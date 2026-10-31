import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  mkdtempSync,
  readFileSync,
  mkdirSync,
  writeFileSync,
  rmSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import {
  developmentPaths,
  runtimeArguments,
  serverCommand,
  sourcePayload,
  requireLocalDocker,
} from './safe-dev.mjs'
import {
  snapshotProject,
  installationDockerfile,
  nodeImage,
} from './safe-check.mjs'
import { safePath, synchronize } from './container-bridge.mjs'
import { spawn } from 'node:child_process'
import { createServer } from 'node:net'
import { chmodSync, readdirSync } from 'node:fs'
import { networkInterfaces } from 'node:os'
import { createConnection } from 'node:net'

test('desarrollo y preview permanecen sin red, privilegios, montajes ni puertos publicados', () => {
  const args = runtimeArguments('test', 'image')
  assert.equal(args[args.indexOf('--network') + 1], 'none')
  assert.equal(args[args.indexOf('--user') + 1], '1000:1000')
  assert.equal(args[args.indexOf('--cap-drop') + 1], 'ALL')
  for (const flag of [
    '--read-only',
    '--pids-limit',
    '--memory',
    '--cpus',
    '--tmpfs',
  ])
    assert.ok(args.includes(flag))
  assert.equal(args[args.indexOf('--security-opt') + 1], 'no-new-privileges')
  for (const flag of [
    '--mount',
    '--volume',
    '-v',
    '--privileged',
    '--publish',
    '-p',
  ])
    assert.equal(args.includes(flag), false)
  for (const mode of ['dev', 'preview']) {
    assert.match(
      serverCommand(mode),
      /--host 127\.0\.0\.1 --port 5173 --strictPort$/,
    )
  }
  assert.match(serverCommand('preview'), /vite build &&/)
  for (const mode of ['build', '__proto__', 'dev --host 0.0.0.0'])
    assert.throws(() => serverCommand(mode))
})

test('los comandos de desarrollo pasan por los lanzadores revisados', () => {
  const manifest = JSON.parse(
    readFileSync(new URL('../package.json', import.meta.url)),
  )
  for (const mode of ['dev', 'preview'])
    assert.equal(manifest.scripts[mode], `node scripts/safe-dev.mjs ${mode}`)
  const recipe = installationDockerfile()
  assert.ok(recipe.startsWith(`FROM ${nodeImage}\n`))
  assert.match(recipe, /COPY package.json package-lock.json/)
  assert.match(recipe, /npm ci --ignore-scripts --no-audit --no-fund/)
  assert.equal(recipe.includes('COPY . '), false)
})

test('las copias seleccionan fuentes, codifican binarios y reflejan borrados', () => {
  const directory = mkdtempSync(join(tmpdir(), 'dev-snapshot-test-'))
  try {
    const source = join(directory, 'source')
    const output = join(directory, 'output')
    mkdirSync(join(source, 'src'), { recursive: true })
    mkdirSync(join(source, 'docs'))
    writeFileSync(join(source, 'src', 'image.png'), Buffer.from([0, 255, 7]))
    writeFileSync(join(source, 'src', '.env.local'), 'secret')
    writeFileSync(join(source, 'docs', 'private.md'), 'not needed')
    snapshotProject(source, output, developmentPaths)
    assert.deepEqual(JSON.parse(sourcePayload(output)), [
      ['src/image.png', 'AP8H'],
    ])
    rmSync(join(output, 'src', 'image.png'))
    assert.deepEqual(JSON.parse(sourcePayload(output)), [])
  } finally {
    rmSync(directory, { recursive: true, force: true })
  }
})

test('la sincronización rechaza rutas externas y sobrescrituras de dependencias', () => {
  for (const path of [
    '/etc/passwd',
    '../outside',
    'src/../../outside',
    'src\\outside',
    'node_modules/vite/index.js',
    'src//x',
  ])
    assert.throws(() => safePath(path))
  assert.equal(safePath('src/valid.ts'), '/tmp/project/src/valid.ts')
})

test('se rechazan los daemons remotos de Docker', () => {
  for (const endpoint of [
    'tcp://127.0.0.1:2375',
    'ssh://remote',
    'https://remote',
  ])
    assert.throws(() => requireLocalDocker(endpoint))
  for (const endpoint of [
    'unix:///var/run/docker.sock',
    'npipe:////./pipe/docker_engine',
  ])
    assert.doesNotThrow(() => requireLocalDocker(endpoint))
})

test('el receptor aplica cambios y borrados en el proyecto temporal', () => {
  const name = '__bridge_probe__/binary.dat'
  try {
    synchronize([[name, 'AP8H']])
    assert.deepEqual(readFileSync(safePath(name)), Buffer.from([0, 255, 7]))
    synchronize([[name, 'dXBkYXRl']])
    assert.equal(readFileSync(safePath(name), 'utf8'), 'update')
    synchronize([])
    assert.throws(() => readFileSync(safePath(name)), /ENOENT/)
  } finally {
    rmSync('/tmp/project/__bridge_probe__', { recursive: true, force: true })
    rmSync('/tmp/source-files.json', { force: true })
  }
})

test('el contenedor real solo tiene loopback, bloquea salida por IP y mantiene la raíz de solo lectura', async () => {
  assert.equal(process.getuid(), 1000)
  assert.deepEqual(Object.keys(networkInterfaces()), ['lo'])
  assert.throws(() => writeFileSync('/opt/readonly-probe', 'probe'), /EROFS/)
  for (const host of ['1.1.1.1', '2606:4700:4700::1111']) {
    await new Promise((done, reject) => {
      const socket = createConnection({ host, port: 443 })
      socket.setTimeout(1000)
      socket.on('connect', () => {
        socket.destroy()
        reject(new Error('Unexpected outbound connectivity'))
      })
      socket.on('error', () => done())
      socket.on('timeout', () => {
        socket.destroy()
        done()
      })
    })
  }
})

function runLauncher(env, mode = 'dev') {
  const child = spawn(process.execPath, ['scripts/safe-dev.mjs', mode], {
    env: { ...process.env, ...env },
  })
  let output = ''
  child.stdout.resume()
  child.stderr.on('data', (chunk) => {
    output += chunk
  })
  const result = new Promise((done) => {
    child.on('close', (code) => done({ code, output }))
  })
  return { child, result }
}

// Los lanzadores anidados y el Docker simulado solo se ejecutan en el contenedor sin red.
test('sin Docker se detiene sin ejecutar en el host ni dejar temporales', async () => {
  const directory = mkdtempSync(join(tmpdir(), 'dev-failure-test-'))
  try {
    const { result } = runLauncher({ PATH: directory, TMPDIR: directory })
    const { code, output } = await result
    assert.equal(code, 1)
    assert.match(
      output,
      /Docker must be installed and running.*No host fallback/,
    )
    assert.deepEqual(readdirSync(directory), [])
  } finally {
    rmSync(directory, { recursive: true, force: true })
  }
})

test('un puerto ocupado detiene el proceso antes de invocar Docker', async () => {
  const server = createServer()
  await new Promise((done) => server.listen(5173, '127.0.0.1', done))
  try {
    const { result } = runLauncher({ PATH: '/not-a-docker-path' }, 'preview')
    const { code, output } = await result
    assert.equal(code, 1)
    assert.match(output, /EADDRINUSE/)
    assert.equal(output.includes('Docker must'), false)
  } finally {
    await new Promise((done) => server.close(done))
  }
})

test('los errores de instalación y Ctrl+C limpian recursos sin ejecutar las fuentes', async () => {
  for (const scenario of ['error', 'interrupt']) {
    const directory = mkdtempSync(join(tmpdir(), 'dev-cleanup-test-'))
    const log = join(directory, 'calls.jsonl')
    try {
      const executable = join(directory, 'docker')
      writeFileSync(
        executable,
        `#!${process.execPath}\n` +
          `
import { appendFileSync } from 'node:fs'
const args = process.argv.slice(2)
appendFileSync(process.env.PROBE_LOG, JSON.stringify(args) + '\\n')
if (args[0] === 'context') console.log('unix:///fake/docker.sock')
else if (args[0] === 'info') console.log('linux')
else if (args[0] === 'build') {
  if (process.env.PROBE_SCENARIO === 'error') process.exit(9)
  else setInterval(() => {}, 1000)
}
`,
      )
      chmodSync(executable, 0o700)
      const { child, result } = runLauncher({
        PATH: directory,
        TMPDIR: directory,
        PROBE_LOG: log,
        PROBE_SCENARIO: scenario,
      })
      if (scenario === 'interrupt') {
        await new Promise((done, reject) => {
          const deadline = Date.now() + 5000
          const poll = () => {
            let calls = ''
            try {
              calls = readFileSync(log, 'utf8')
            } catch {
              /* Todavía no existe. */
            }
            if (calls.includes('"build"')) {
              child.kill('SIGINT')
              done()
            } else if (Date.now() > deadline) {
              child.kill()
              reject(new Error('Fixture timed out'))
            } else setTimeout(poll, 20)
          }
          poll()
        })
      }
      assert.equal((await result).code, 1)
      const calls = readFileSync(log, 'utf8')
        .trim()
        .split('\n')
        .map((line) => JSON.parse(line))
      assert.ok(calls.some((args) => args[0] === 'rm' && args[1] === '--force'))
      assert.ok(calls.some((args) => args[0] === 'image' && args[1] === 'rm'))
      assert.equal(
        calls.some((args) => args[0] === 'start' || args[0] === 'exec'),
        false,
      )
      assert.equal(
        readdirSync(directory).some((name) =>
          name.startsWith('wedding-safe-dev-'),
        ),
        false,
      )
    } finally {
      rmSync(directory, { recursive: true, force: true })
    }
  }
})
