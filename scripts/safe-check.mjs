import { randomUUID } from 'node:crypto'
import {
  cpSync,
  existsSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
export const applicationPaths = [
  'src', 'public', 'assets/photos/opt', 'assets/icons', 'assets/audio.mp3',
  'fonts', 'index.html', 'vite.config.js', 'package.json', 'package-lock.json',
]
const sourcePaths = [
  ...applicationPaths, 'test', 'scripts', 'docs', 'gas/Code.gs', 'README.md',
]


// Imagen oficial multiplataforma de Node 22, fijada por el commit de origen.
export const nodeImage =
  'docker.io/library/node:22-bookworm-slim@sha256:c3de60bf2f9dd0ac6370e6117950ff62d6e339527e7472301c9c78a017978392'

export function validateDependencies(manifest, lock) {
  if (lock.lockfileVersion !== 3 || !lock.packages?.['']) {
    throw new Error('A version 3 package-lock.json is required.')
  }
  for (const section of [
    'dependencies',
    'devDependencies',
    'optionalDependencies',
  ]) {
    const declared = manifest[section] ?? {}
    const locked = lock.packages[''][section] ?? {}
    if (
      JSON.stringify(Object.entries(declared).sort()) !==
      JSON.stringify(Object.entries(locked).sort())
    ) {
      throw new Error(
        `package.json and package-lock.json disagree on ${section}.`,
      )
    }
    for (const [name, version] of Object.entries(declared)) {
      if (
        typeof version !== 'string' ||
        !/^[\d\s.^~<>=|*+xX-]+$/.test(version)
      ) {
        throw new Error(`Only registry version ranges are allowed: ${name}.`)
      }
    }
  }
  for (const [name, entry] of Object.entries(lock.packages)) {
    if (name === '') continue
    if (
      !name.startsWith('node_modules/') ||
      name.split('/').includes('..') ||
      name.includes('\\') ||
      entry.link
    ) {
      throw new Error(`Local, linked, or invalid dependency path: ${name}.`)
    }
    let url
    try {
      url = new URL(entry.resolved)
    } catch {
      throw new Error(`Missing or invalid download URL: ${name}.`)
    }
    if (
      url.protocol !== 'https:' ||
      url.hostname !== 'registry.npmjs.org' ||
      url.port ||
      url.username ||
      url.password ||
      url.search ||
      url.hash
    ) {
      throw new Error(
        `Unapproved dependency source: ${name}. Only HTTPS registry.npmjs.org is allowed.`,
      )
    }
    if (
      typeof entry.integrity !== 'string' ||
      !/^sha512-[A-Za-z0-9+/]+={0,2}$/.test(entry.integrity)
    ) {
      throw new Error(`Missing SHA-512 integrity for ${name}.`)
    }
  }
}

function excluded(name) {
  return (
    name === '.git' ||
    name === 'node_modules' ||
    name === 'dist' ||
    name === '.aws' ||
    name === '.ssh' ||
    name === '.npmrc' ||
    name === '.env' ||
    name.startsWith('.env.') ||
    /\.(?:pem|key|p12|pfx)$/i.test(name)
  )
}

function rejectSymlinks(path) {
  const stat = lstatSync(path)
  if (stat.isSymbolicLink())
    throw new Error(`Symlinks are not copied into the sandbox: ${path}.`)
  if (!stat.isDirectory()) {
    if (!stat.isFile()) throw new Error(`Unsupported source file: ${path}.`)
    return
  }
  for (const name of readdirSync(path)) {
    if (!excluded(name)) rejectSymlinks(join(path, name))
  }
}

export function snapshotProject(from, to, paths = sourcePaths) {
  mkdirSync(to, { recursive: true })
  for (const relative of paths) {
    const source = join(from, relative)
    if (!existsSync(source)) continue
    rejectSymlinks(source)
    cpSync(source, join(to, relative), {
      recursive: true,
      filter: (path) => !excluded(path.split(/[\\/]/).at(-1)),
    })
  }
}

export function commandFor(mode) {
  const commands = {
    check: 'node --test && ./node_modules/.bin/vite build',
    test: 'node --test',
    build: './node_modules/.bin/vite build',
  }
  if (!Object.hasOwn(commands, mode)) {
    throw new Error('Comprobaciones permitidas: check, test, build. No se admiten argumentos extra.')
  }
  return commands[mode]
}

// Solo estos valores públicos de Vite cruzan al contenedor; nunca se leen archivos .env.
export function serviceEnvironmentArguments(env = process.env) {
  return ['VITE_SERVICE_URL', 'VITE_WEDDING_SLUG'].flatMap((name) =>
    Object.hasOwn(env, name) ? ['--env', `${name}=${env[name]}`] : [],
  )
}

export function requireLocalDocker(endpoint) {
  if (!endpoint.startsWith('unix://') && !endpoint.startsWith('npipe://'))
    throw new Error('Usa un daemon local de Docker; los contextos remotos no están permitidos.')
}

export function executionArguments(name, image, mode = 'check') {
  const command = commandFor(mode)
  return [
    'create',
    '--name',
    name,
    '--network',
    'none',
    '--user',
    '1000:1000',
    '--cap-drop',
    'ALL',
    '--security-opt',
    'no-new-privileges',
    '--read-only',
    '--pids-limit',
    '128',
    '--memory',
    '2g',
    '--cpus',
    '2',
    '--tmpfs',
    '/tmp:rw,exec,nosuid,size=1g,mode=1777',
    '--workdir',
    '/opt/project',
    '--env',
    'CI=true',
    ...serviceEnvironmentArguments(),
    image,
    'sh',
    '-c',
    `cp -R /opt/project /tmp/project && cd /tmp/project && ${command}`,
  ]
}

export function installationDockerfile() {
  return (
    [
      `FROM ${nodeImage}`,
      'WORKDIR /opt/project',
      'COPY package.json package-lock.json ./',
      'RUN npm ci --ignore-scripts --no-audit --no-fund --registry=https://registry.npmjs.org/ --userconfig=/opt/npm-user-config --globalconfig=/opt/npm-global-config',
      'RUN chown -R node:node /opt/project',
    ].join('\n') + '\n'
  )
}

function docker(args, capture = false) {
  const env = { ...process.env }
  delete env.NODE_OPTIONS
  delete env.NODE_PATH
  const result = spawnSync('docker', args, {
    env,
    stdio: capture ? 'pipe' : 'inherit',
    encoding: 'utf8',
    timeout: 10 * 60 * 1000,
  })
  if (result.error || result.status !== 0) {
    throw new Error(
      capture
        ? 'Docker must be installed and running with Linux containers. There is no host-execution fallback.'
        : `Docker command failed (${result.status ?? result.error?.message}).`,
    )
  }
  return result.stdout?.trim()
}

export function main(mode = 'check') {
  commandFor(mode)
  const directory = mkdtempSync(join(tmpdir(), 'wedding-safe-check-'))
  const id = randomUUID()
  const container = `wedding-check-${id}`
  const staging = `${container}-stage`
  const image = `wedding-check:${id}`
  const runtimeImage = `${image}-source`
  let created = false
  let built = false
  let staged = false
  let committed = false
  try {
    const install = join(directory, 'install')
    mkdirSync(install)
    for (const name of ['package.json', 'package-lock.json']) {
      rejectSymlinks(join(root, name))
      cpSync(join(root, name), join(install, name))
    }
    validateDependencies(
      JSON.parse(readFileSync(join(install, 'package.json'), 'utf8')),
      JSON.parse(readFileSync(join(install, 'package-lock.json'), 'utf8')),
    )
    requireLocalDocker(
      process.env.DOCKER_HOST && !process.env.DOCKER_CONTEXT
        ? process.env.DOCKER_HOST
        : docker(['context', 'inspect', '--format', '{{.Endpoints.docker.Host}}'], true),
    )
    if (docker(['info', '--format', '{{.OSType}}'], true) !== 'linux') {
      throw new Error(
        'Select Linux containers in Docker Desktop before running checks.',
      )
    }
    writeFileSync(join(install, 'Dockerfile'), installationDockerfile())
    console.log(
      'Installing only locked npm-registry dependencies; package lifecycle scripts are disabled.',
    )
    docker(['build', '--pull', '--tag', image, install])
    built = true
    const source = join(directory, 'source')
    snapshotProject(root, source)
    // Conserva los manifiestos validados aunque cambie el checkout.
    for (const name of ['package.json', 'package-lock.json'])
      cpSync(join(install, name), join(source, name))
    // Copia a un contenedor detenido; no se ejecuta código en él.
    docker(['create', '--name', staging, '--network', 'none', image])
    staged = true
    docker(['cp', `${source}/.`, `${staging}:/opt/project`])
    docker(['commit', staging, runtimeImage])
    committed = true
    docker(executionArguments(container, runtimeImage, mode))
    created = true
    console.log(
      'Running checks offline, with no host-folder mounts or forwarded credentials.',
    )
    docker(['start', '--attach', container])
    const exit = docker(
      ['inspect', '--format', '{{.State.ExitCode}}', container],
      true,
    )
    if (exit !== '0')
      throw new Error(
        `Project checks failed inside the sandbox (exit ${exit}).`,
      )
  } finally {
    if (created)
      spawnSync('docker', ['rm', '--force', container], {
        stdio: 'ignore',
        timeout: 30000,
      })
    if (staged)
      spawnSync('docker', ['rm', '--force', staging], {
        stdio: 'ignore',
        timeout: 30000,
      })
    if (committed)
      spawnSync('docker', ['image', 'rm', runtimeImage], {
        stdio: 'ignore',
        timeout: 30000,
      })
    if (built)
      spawnSync('docker', ['image', 'rm', image], {
        stdio: 'ignore',
        timeout: 30000,
      })
    rmSync(directory, { recursive: true, force: true })
  }
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  try {
    if (process.argv.length > 3)
      throw new Error('Extra commands or flags are rejected.')
    main(process.argv[2] ?? 'check')
  } catch (error) {
    console.error(error.message)
    process.exitCode = 1
  }
}
