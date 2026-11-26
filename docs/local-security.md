# Desarrollo y comprobaciones en Docker

Los cambios adaptan los commits `104fb2fb89c58585802904634f7b74dbb935623c` y
`ce2206dee9ae2d0f039f0f894eee3222c4dd6ef4` de
[Jose-QB/wedding_invitation](https://github.com/Jose-QB/wedding_invitation), incluidos los
lanzadores de comprobación que ese proyecto ya tenía. Aquí se conserva React + Vite y el
runner integrado de Node; no se incorporan TypeScript, ESLint, Prettier ni dependencias nuevas.

## Uso

Requiere Node.js 22.12+ y npm en el host, y Docker Desktop con contenedores Linux en
macOS/Windows o Docker Engine en Linux. El daemon debe ser local y estar en marcha.
Revisar `package.json`, `package-lock.json`, `.npmrc`, `scripts/` y la configuración antes
de ejecutar un checkout nuevo. No hace falta `npm install` ni `npm ci` en el host.

```bash
npm run dev       # desarrollo con sincronización de archivos y HMR
npm run preview   # build y preview en una misma sesión
npm test          # pruebas de aplicación y seguridad
npm run build     # comprobación del build
npm run check     # pruebas y build
```

Desarrollo y preview sirven en [http://127.0.0.1:5173](http://127.0.0.1:5173) y no pueden
usarse a la vez. No se aceptan argumentos adicionales ni puertos alternativos. Ctrl+C o
SIGTERM detienen y limpian la sesión. Preview toma una copia al arrancar: reiniciarlo tras
editar. Desarrollo copia los cambios cada segundo; un cambio en los manifiestos detiene
la sesión y exige reiniciar para validar e instalar de nuevo.

## Aislamiento

1. El lanzador usa módulos integrados de Node, sin importar configuración ni dependencias
   del proyecto en el host. Valida la coincidencia de dependencias entre manifiesto y
   lockfile v3, sus URLs HTTPS de `registry.npmjs.org` y su integridad SHA-512. Rechaza
   fuentes locales, enlaces, Git, alias npm y registros alternativos.
2. La instalación tiene red pero recibe **solo los dos manifiestos**, sobre una imagen
   oficial de Node 22 fijada por digest. Usa `npm ci --ignore-scripts --no-audit --no-fund`
   y configuración npm independiente. No recibe fuentes, `.npmrc` ni credenciales.
3. La ejecución recibe una copia seleccionada del proyecto. Usa `--network none`, UID/GID
   `1000:1000`, raíz de solo lectura, capacidades eliminadas, `no-new-privileges`, hasta
   128 procesos, 2 GiB de memoria, 2 CPU y `/tmp` de 1 GiB. No monta carpetas del host ni
   el socket Docker y no publica puertos Docker. El build permanece en el contenedor.

Desarrollo copia `src`, `public` si existe, `assets/photos/opt`, `assets/icons`,
`assets/audio.mp3`, `fonts`, `index.html`, `vite.config.js` y los manifiestos. Las comprobaciones
añaden `test`, `scripts`, `docs`, `README.md` y **solo** `gas/Code.gs` para los guardarraíles
del servicio. Se excluyen Git, dependencias del host, `dist`, `.env*`, `.npmrc` y claves de
extensiones comunes; se rechazan enlaces simbólicos. No se copian fotos originales ni
libros de invitados. La sincronización admite binarios, propaga borrados, limita cada envío
a 128 MiB y rechaza rutas que salgan de `/tmp/project` o sobrescriban `node_modules`.
No guardar secretos con nombres arbitrarios dentro de las fuentes permitidas: las
exclusiones no pueden reconocer cualquier secreto.

Un relay TCP de Node escucha **solo en el localhost del host**, `127.0.0.1:5173`. Por cada
conexión ejecuta `docker exec -i` con un helper instalado en `/opt/container-bridge.mjs`,
fuera del árbol modificable del proyecto. El helper conecta únicamente al Vite del
contenedor en `127.0.0.1:5173`; transporta HTTP y WebSocket por entrada/salida estándar.
Hay un máximo de 32 conexiones. No necesita red puente, firewall ni acceso del proyecto
al daemon. El helper de sincronización usa el mismo transporte sin dar escritura al host.

La red `none` deja únicamente el loopback del contenedor. El código del proyecto no tiene
salida hacia internet, DNS externo, servicios del host ni otros contenedores. El relay solo
acepta conexiones iniciadas desde el host y no ofrece un proxy de salida. Los daemons
remotos se rechazan en desarrollo y comprobaciones.

## Configuración del servicio y publicación

El archivo `.env.local` no se copia al contenedor ni se versiona. Los lanzadores leen de él
únicamente los cuatro valores públicos permitidos. También puedes exportarlos antes de arrancar (ejemplo
para bash/zsh; en PowerShell usa las variables equivalentes):

```bash
export VITE_SERVICE_URL="https://script.google.com/macros/s/EJEMPLO/exec"
export VITE_WEDDING_SLUG="mi-boda"
export VITE_WHATSAPP_NUMBER="521234567890"
export VITE_PASSWORD="<contraseña del panel>"
npm run dev
```

Estas cuatro variables se transmiten de forma explícita al contenedor, también para preview
y check. `VITE_PASSWORD` es opcional y queda visible en el JavaScript del panel. Ninguna otra
variable del entorno del host se transmite al runtime del proyecto. Sin URL se conserva
el modo demo; sin slug se conserva el aviso de configuración incompleta. Reiniciar para
aplicar cambios en estos valores. Las variables exportadas tienen prioridad sobre
`.env.local`.

El navegador sí puede consultar Apps Script y cargar Google Fonts; el aislamiento cubre
las herramientas del proyecto, no el código ejecutado en el navegador. Los proxies Vite
hacia APIs externas no pueden funcionar desde el contenedor sin red.

`npm run check` valida un build desechable y **no genera `dist/` en el checkout**. Preview
construye su propio build. `npm run build` ejecuta Vite directamente y está destinado al
entorno de CI/hosting: instala con `npm ci --ignore-scripts`, conserva `dist/` y lo publica
como sitio estático con las dos variables públicas configuradas antes del build. Esto permite
que Netlify construya sin Docker.

## Fallos y limpieza

- Si Docker no está disponible o falla, detenerse; no sustituirlo por herramientas del host.
- Si 5173 está ocupado, detener la otra sesión y volver a intentar. Se reserva el puerto
  antes de instalar dependencias.
- Ante un fallo de configuración, compilación o sincronización, corregir el archivo y
  reiniciar. No habilitar scripts de instalación ni quitar restricciones para pasarlo.
- Ctrl+C limpia contenedores, etiquetas de imágenes y copias temporales de desarrollo.
  Las comprobaciones limpian sus recursos al terminar. Las capas de caché de Docker pueden
  permanecer. SIGKILL, un cierre del host o un daemon caído pueden impedir la limpieza.
- Buscar restos con `docker ps -a --filter name=wedding-dev-`,
  `docker ps -a --filter name=wedding-preview-` o
  `docker ps -a --filter name=wedding-check-`. Eliminar solo los recursos identificados de
  la sesión detenida, usando `docker rm -f <nombre> <nombre>-stage`.
  Desarrollo/preview usan `<nombre>:runtime` y `<nombre>:dependencies`; las comprobaciones,
  `wedding-check:<id>` y `wedding-check:<id>-source`. Eliminar sus etiquetas con
  `docker image rm`. Las copias temporales usan `wedding-safe-dev-` y `wedding-safe-check-`
  en el directorio temporal del sistema; borrarlas solo tras confirmar que la sesión acabó.

## Reglas para agentes y límites

Usar exclusivamente los comandos npm revisados. No ejecutar Vite, pruebas, configuración,
`npx`, `npm exec`, importaciones de archivos del proyecto ni instalaciones en el host.
Mantener desactivadas las herramientas del editor que ejecuten código no revisado. La
inspección estática, Git y la edición de texto están permitidos. Una excepción de ejecución
en el host requiere una petición humana explícita y acotada tras explicar el código afectado.

`.npmrc` desactiva scripts por defecto, pero sus opciones se pueden sobrescribir; no es
una barrera de seguridad. Docker, Node/npm oficiales, el daemon y los lanzadores revisados
son software de confianza. Los contenedores reducen el riesgo, no garantizan ausencia de
vulnerabilidades. Las instrucciones del repositorio tampoco impiden que un agente las
ignore: una barrera estricta necesita permisos o una VM administrados fuera del repositorio.
Usar un perfil separado del navegador para código desconocido. No se asume aquí ninguna
política de acceso de GitHub ni protección de ramas del proyecto de origen.

## Verificación

Las pruebas de seguridad cubren política de dependencias, comandos permitidos, exclusiones,
recursos optimizados, variables públicas permitidas, rechazo de enlaces y contextos remotos,
sincronización binaria y borrados, red y raíz del contenedor real, Docker ausente, puerto
ocupado, fallo de instalación y limpieza tras interrupción. Las pruebas con Docker simulado
se ejecutan dentro del contenedor sin red. Se ejecutan junto con las pruebas existentes de
la aplicación, sin sustituir la verificación manual del RSVP contra Apps Script.

Los resultados de esta adaptación se anotan en `MEMORY.md`. No se trasladan como propios
los resultados de pruebas del repositorio de origen; otras plataformas requieren su propia
verificación de navegador, HMR y aislamiento.
