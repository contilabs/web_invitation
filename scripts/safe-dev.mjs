import { randomUUID, createHash } from 'node:crypto'
import {
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { spawn } from 'node:child_process'
import { createServer } from 'node:net'
import { fileURLToPath } from 'node:url'
import {
  applicationPaths,
  requireLocalDocker,
  executionArguments,
  installationDockerfile,
  snapshotProject,
  validateDependencies,
} from './safe-check.mjs'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
export const developmentPaths = applicationPaths
export { requireLocalDocker } from './safe-check.mjs'

export function runtimeArguments(name, image) {
  const args = executionArguments(name, image, 'build')
  args[args.length - 1] =
    'cp -R /opt/project /tmp/project && touch /tmp/project-ready && node /opt/container-bridge.mjs wait'
  return args
}

export function serverCommand(mode) {
  if (!['dev', 'preview'].includes(mode))
    throw new Error('Allowed modes: dev, preview. Extra flags are rejected.')
  const serve = `./node_modules/.bin/vite${mode === 'preview' ? ' preview' : ''} --host 127.0.0.1 --port 5173 --strictPort`
  return mode === 'preview'
    ? `./node_modules/.bin/vite build && ${serve}`
    : serve
}

export function sourcePayload(directory) {
  const files = []
  function visit(relative) {
    for (const entry of readdirSync(join(directory, relative), {
      withFileTypes: true,
    })) {
      const path = join(relative, entry.name)
      if (entry.isDirectory()) visit(path)
      else if (entry.isFile())
        files.push([
          path.split('\\').join('/'),
          readFileSync(join(directory, path)).toString('base64'),
        ])
      else throw new Error('Unsupported snapshot entry')
    }
  }
  visit('')
  const payload = JSON.stringify(files)
  if (Buffer.byteLength(payload) > 128 * 1024 * 1024)
    throw new Error('Source snapshot exceeds 128 MiB')
  return payload
}

export async function main(mode) {
  const command = serverCommand(mode)
  const directory = mkdtempSync(join(tmpdir(), 'wedding-safe-dev-'))
  const name = `wedding-${mode}-${randomUUID()}`
  const image = `${name}:dependencies`
  const runtime = `${name}:runtime`
  const staging = `${name}-stage`
  const children = new Set()
  const sockets = new Set()
  let stopping = false
  let dockerReady = false
  let timer
  let rejectStop
  const stopped = new Promise((_, reject) => {
    rejectStop = reject
  })
  // Una señal puede llegar durante la instalación; registra el rechazo desde el inicio.
  stopped.catch(() => {})
  function stop(error) {
    if (stopping) return
    stopping = true
    rejectStop(error)
    for (const child of children) child.kill('SIGTERM')
  }
  const interrupt = () =>
    stop(new Error('Stopped; removing development resources.'))
  process.on('SIGINT', interrupt)
  process.on('SIGTERM', interrupt)
  const env = { ...process.env }
  delete env.NODE_OPTIONS
  delete env.NODE_PATH
  function launch(args, options = {}) {
    if (stopping) throw new Error('Development launcher stopped')
    const child = spawn('docker', args, { env, ...options })
    children.add(child)
    child.on('close', () => children.delete(child))
    return child
  }
  function docker(args, input) {
    return new Promise((resolveResult, reject) => {
      const child = launch(args, { stdio: ['pipe', 'pipe', 'pipe'] })
      const timeout = setTimeout(
        () => {
          child.kill()
          reject(new Error('Docker command timed out'))
        },
        10 * 60 * 1000,
      )
      let output = ''
      let errors = ''
      child.stdout.on('data', (chunk) => {
        output += chunk
      })
      child.stderr.on('data', (chunk) => {
        errors = (errors + chunk).slice(-4000)
      })
      child.on('error', (error) => {
        clearTimeout(timeout)
        reject(
          new Error(
            `Docker must be installed and running: ${error.message}. No host fallback.`,
          ),
        )
      })
      child.on('close', (code) => {
        clearTimeout(timeout)
        if (code === 0) resolveResult(output.trim())
        else
          reject(
            new Error(`Docker failed: ${errors || code}. No host fallback.`),
          )
      })
      child.stdin.on('error', () => {})
      child.stdin.end(input)
    })
  }
  const server = createServer((socket) => {
    if (stopping || sockets.size >= 32) {
      socket.destroy()
      return
    }
    sockets.add(socket)
    const child = launch([
      'exec',
      '-i',
      name,
      'node',
      '/opt/container-bridge.mjs',
      'connect',
    ])
    socket.pipe(child.stdin)
    child.stdout.pipe(socket)
    child.stderr.resume()
    child.stdin.on('error', () => socket.destroy())
    child.on('error', () => socket.destroy())
    child.on('close', () => socket.destroy())
    socket.on('error', () => {})
    socket.on('close', () => {
      sockets.delete(socket)
      child.kill()
    })
  })
  try {
    await new Promise((ready, reject) => {
      server.once('error', reject)
      server.listen(5173, '127.0.0.1', ready)
    })
    server.on('error', stop)
    const endpoint =
      env.DOCKER_HOST && !env.DOCKER_CONTEXT
        ? env.DOCKER_HOST
        : await docker([
            'context',
            'inspect',
            '--format',
            '{{.Endpoints.docker.Host}}',
          ])
    requireLocalDocker(endpoint)
    if ((await docker(['info', '--format', '{{.OSType}}'])) !== 'linux')
      throw new Error(
        'Docker must be running with Linux containers. No host fallback.',
      )
    dockerReady = true
    const install = join(directory, 'install')
    snapshotProject(root, install, ['package.json', 'package-lock.json'])
    const manifest = readFileSync(join(install, 'package.json'), 'utf8')
    const lock = readFileSync(join(install, 'package-lock.json'), 'utf8')
    validateDependencies(JSON.parse(manifest), JSON.parse(lock))
    writeFileSync(join(install, 'Dockerfile'), installationDockerfile())
    console.log(
      'Installing locked dependencies without source or lifecycle scripts...',
    )
    await docker(['build', '--pull', '--tag', image, install])
    await docker(['create', '--name', staging, '--network', 'none', image])
    const helper = join(directory, 'helper')
    snapshotProject(root, helper, ['scripts/container-bridge.mjs'])
    await docker([
      'cp',
      join(helper, 'scripts/container-bridge.mjs'),
      `${staging}:/opt/container-bridge.mjs`,
    ])
    await docker(['commit', staging, runtime])
    await docker(runtimeArguments(name, runtime))
    await docker(['start', name])
    await docker([
      'exec',
      name,
      'sh',
      '-c',
      'for i in $(seq 1 100); do [ -f /tmp/project-ready ] && exit 0; sleep 0.1; done; exit 1',
    ])
    const source = join(directory, 'source')
    let previousHash
    async function sync() {
      rmSync(source, { recursive: true, force: true })
      snapshotProject(root, source, developmentPaths)
      if (
        readFileSync(join(source, 'package.json'), 'utf8') !== manifest ||
        readFileSync(join(source, 'package-lock.json'), 'utf8') !== lock
      )
        throw new Error(
          'Dependency manifests changed. Restart npm run dev to validate and refresh dependencies.',
        )
      const payload = sourcePayload(source)
      const hash = createHash('sha256').update(payload).digest('hex')
      if (hash !== previousHash) {
        await docker(
          ['exec', '-i', name, 'node', '/opt/container-bridge.mjs', 'sync'],
          payload,
        )
        previousHash = hash
      }
    }
    await sync()
    const vite = launch(
      ['exec', '--workdir', '/tmp/project', name, 'sh', '-c', command],
      { stdio: 'inherit' },
    )
    vite.on('error', stop)
    vite.on('close', (code) => stop(new Error(`Vite exited (${code}).`)))
    if (mode === 'dev') {
      const poll = async () => {
        try {
          await sync()
          if (!stopping) timer = setTimeout(poll, 1000)
        } catch (error) {
          stop(error)
        }
      }
      timer = setTimeout(poll, 1000)
    }
    console.log(
      `${mode}: http://127.0.0.1:5173 (offline container, localhost relay). Ctrl+C stops and cleans up.`,
    )
    await stopped
  } finally {
    stopping = true
    clearTimeout(timer)
    for (const socket of sockets) socket.destroy()
    server.close()
    for (const child of children) child.kill('SIGTERM')
    // Limpia siempre: una señal puede coincidir con una creación de Docker.
    for (const args of dockerReady
      ? [
          ['rm', '--force', name, staging],
          ['image', 'rm', runtime, image],
        ]
      : []) {
      await new Promise((done) => {
        const child = spawn('docker', args, { env, stdio: 'ignore' })
        const timeout = setTimeout(() => {
          child.kill()
          done()
        }, 30000)
        child.on('error', () => {
          clearTimeout(timeout)
          done()
        })
        child.on('close', () => {
          clearTimeout(timeout)
          done()
        })
      })
    }
    rmSync(directory, { recursive: true, force: true })
    process.off('SIGINT', interrupt)
    process.off('SIGTERM', interrupt)
  }
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  try {
    if (process.argv.length !== 3) throw new Error('Extra flags are rejected.')
    await main(process.argv[2])
  } catch (error) {
    console.error(error.message)
    process.exitCode = 1
  }
}
