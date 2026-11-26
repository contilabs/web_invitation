import assert from 'node:assert/strict'
import {
  mkdtempSync,
  mkdirSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
  existsSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'
import {
  serviceEnvironmentArguments,
  commandFor,
  executionArguments,
  snapshotProject,
  validateDependencies,
} from './safe-check.mjs'

test('solo se aceptan comandos fijos y aislados', () => {
  for (const mode of ['check', 'test', 'build']) {
    const args = executionArguments('test-container', 'test-image', mode)
    assert.equal(args[args.indexOf('--network') + 1], 'none')
    assert.ok(args.includes('--read-only'))
    assert.ok(args.at(-1).endsWith(commandFor(mode)))
  }
  for (const mode of [
    'format',
    'dev',
    'preview',
    '__proto__',
    'lint; curl example.com',
  ]) {
    assert.throws(() => commandFor(mode))
  }
})

test('los scripts de npm no ejecutan herramientas del proyecto en el host', () => {
  const manifest = JSON.parse(
    readFileSync(new URL('../package.json', import.meta.url), 'utf8'),
  )
  for (const mode of ['test', 'build']) {
    assert.equal(manifest.scripts[mode], `node scripts/safe-check.mjs ${mode}`)
  }
  assert.equal(manifest.scripts.check, 'node scripts/safe-check.mjs')
})

function fixture(
  resolved = 'https://registry.npmjs.org/example/-/example-1.0.0.tgz',
) {
  return [
    { dependencies: { example: '^1.0.0' } },
    {
      lockfileVersion: 3,
      packages: {
        '': { dependencies: { example: '^1.0.0' } },
        'node_modules/example': { resolved, integrity: 'sha512-YWJjZA==' },
      },
    },
  ]
}

test('acepta dependencias del registro y rechaza otros orígenes, credenciales y fuentes locales', () => {
  assert.doesNotThrow(() => validateDependencies(...fixture()))
  for (const source of [
    'https://registry.npmjs.org.evil.example/package.tgz',
    'https://evil.example/package.tgz',
    'http://registry.npmjs.org/package.tgz',
    'https://user:secret@registry.npmjs.org/package.tgz',
    'file:../package',
    'git+https://github.com/example/repo',
  ])
    assert.throws(() => validateDependencies(...fixture(source)))
  const [manifest, lock] = fixture()
  delete lock.packages['node_modules/example'].integrity
  assert.throws(() => validateDependencies(manifest, lock))
})

test('rechaza manifiestos distintos, declaraciones locales y dependencias enlazadas', () => {
  const [manifest, lock] = fixture()
  manifest.dependencies.example = 'file:../example'
  assert.throws(() => validateDependencies(manifest, lock))
  lock.packages[''].dependencies.example = manifest.dependencies.example
  assert.throws(() => validateDependencies(manifest, lock))
  const [clean, linked] = fixture()
  linked.packages['node_modules/example'].link = true
  assert.throws(() => validateDependencies(clean, linked))
})

test('copia fuentes sin credenciales, historial Git ni dependencias del host', () => {
  const temporary = mkdtempSync(join(tmpdir(), 'safe-check-test-'))
  try {
    const source = join(temporary, 'source')
    const output = join(temporary, 'output')
    mkdirSync(join(source, 'src'), { recursive: true })
    writeFileSync(join(source, 'src', 'app.ts'), 'export const value = 1')
    writeFileSync(join(source, 'src', '.env.local'), 'SECRET=hidden')
    writeFileSync(join(source, '.env'), 'SECRET=hidden')
    writeFileSync(
      join(source, '.npmrc'),
      '//registry.npmjs.org/:_authToken=hidden',
    )
    mkdirSync(join(source, '.git'))
    mkdirSync(join(source, 'node_modules'))
    snapshotProject(source, output)
    assert.equal(
      readFileSync(join(output, 'src', 'app.ts'), 'utf8'),
      'export const value = 1',
    )
    for (const path of [
      '.env',
      '.npmrc',
      '.git',
      'node_modules',
      'src/.env.local',
    ])
      assert.equal(existsSync(join(output, path)), false)
    symlinkSync(join(source, 'src', 'app.ts'), join(source, 'src', 'linked.ts'))
    assert.throws(
      () => snapshotProject(source, join(temporary, 'linked-output')),
      /Symlinks/,
    )
  } finally {
    rmSync(temporary, { recursive: true, force: true })
  }
})

test('ejecuta sin red, montajes del host ni privilegios', () => {
  const args = executionArguments('test-container', 'test-image')
  assert.equal(args[args.indexOf('--network') + 1], 'none')
  assert.equal(args[args.indexOf('--user') + 1], '1000:1000')
  assert.equal(args[args.indexOf('--cap-drop') + 1], 'ALL')
  assert.ok(args.includes('--read-only'))
  for (const flag of ['--mount', '--volume', '-v', '--privileged', '--publish'])
    assert.equal(args.includes(flag), false)
  assert.ok(args.at(-1).includes('node --test'))
  assert.equal(args.at(-1).includes('npm run'), false)
})


test('solo se transmiten las variables públicas permitidas', () => {
  assert.deepEqual(serviceEnvironmentArguments({
    VITE_SERVICE_URL: 'https://example.test/exec', VITE_WEDDING_SLUG: 'prueba', VITE_WHATSAPP_NUMBER: '521234567890',
    SECRET: 'privado', NODE_OPTIONS: '--require=malicioso',
  }), ['--env', 'VITE_SERVICE_URL=https://example.test/exec', '--env', 'VITE_WEDDING_SLUG=prueba', '--env', 'VITE_WHATSAPP_NUMBER=521234567890'])
  assert.deepEqual(serviceEnvironmentArguments({}), [])
})

test('incluye los recursos optimizados y excluye originales y libros de invitados', () => {
  const temporary = mkdtempSync(join(tmpdir(), 'asset-snapshot-test-'))
  try {
    const source = join(temporary, 'source')
    const output = join(temporary, 'output')
    for (const name of ['assets/photos/opt', 'assets/icons', 'fonts', 'gas'])
      mkdirSync(join(source, name), { recursive: true })
    for (const name of ['assets/photos/opt/foto1-900.jpg', 'assets/icons/icon.svg',
      'assets/audio.mp3', 'fonts/font.woff2', 'assets/photos/original.jpg', 'gas/guests.xlsx'])
      writeFileSync(join(source, name), 'ejemplo')
    snapshotProject(source, output)
    for (const name of ['assets/photos/opt/foto1-900.jpg', 'assets/icons/icon.svg',
      'assets/audio.mp3', 'fonts/font.woff2'])
      assert.ok(existsSync(join(output, name)), name)
    for (const name of ['assets/photos/original.jpg', 'gas/guests.xlsx'])
      assert.equal(existsSync(join(output, name)), false, name)
  } finally {
    rmSync(temporary, { recursive: true, force: true })
  }
})
