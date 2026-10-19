# MEMORY.md — Invitación digital
Memoria del proyecto entre sesiones. Máximo ~80 líneas: resume o elimina lo que ya no aporte.

## Estado actual
- **Rama viva: `react-migration`** (specs en `specs/`, publicada en `origin` tras el rebase).
- **Specs 001–003 cerradas salvo la pasada manual (T27) y el despliegue:** app React completa,
  rediseño «Ascua», estructura por capas, nomenclatura en inglés, registro único
  (`src/data/wedding.js`); paridad T26 **30/30**.
- **Spec 004: T1–T9 hechas; T10 (verificación manual contra el despliegue vivo) desbloqueada.**
  Servicio de invitados y RSVP contra un Apps Script (`gas/Code.gs`). El defecto corregido (17/10) en
  `readMaster_` (leía el id del maestro por su valor y no por el nombre de la propiedad) dejaba el
  servicio sin funcionar. Checklist en «Verificación» de `AGENTS.md`.
- **Spec 005 (`specs/005-flujo-rsvp-respuesta-previa`): T1–T9 y T11–T15 hechas; T10 desbloqueada
  (verificación manual), igual que la de la 004.** Flujo RSVP por máquina de estados
  (`src/utils/rsvpState.js`, 7 estados) con `lookup` por teléfono (lectura, sin escritura en
  `guests`), `useGuestLookup`, `AttendeeSelect`, `ResponseSummary` y contrato ampliado
  (`CONTRACT_VERSION 1.1.0`, `SERVICE_ACTIONS.LOOKUP`, `LOOKUP_FIELDS`). Las **T11–T15** son la
  revisión del formulario (RF-4, RF-11), que **no** toca el contrato.
- Documentación: `AGENTS.md`, `MEMORY.md`, `PENDING_TASKS.md`, `README.md`, `docs/`.

## Decisiones (y por qué)
- **Spec 005 · RSVP por máquina de estados y lookup:** el componente solo despacha eventos
  (`initialBlockState`/`nextBlockState`, 7 estados). La consulta `lookup` por teléfono se usa solo
  en genérica/pública (nunca en personalizada), exige diez dígitos antes de llamar, **no escribe**
  en `guests` (no marca `viewed`) y **no devuelve** el teléfono ni datos ajenos. El cupo del combo
  y de validación sale de `attendeeLimits` (DT-6); la precarga usa `attendanceForm`/`interpretLookup`.
  El riesgo aceptado de enviar el teléfono en la consulta queda documentado (constitución 5, AGENTS.md).
- **Spec 005 · revisión del formulario (T11–T15, RF-4/RF-11):** el rango del combo es **por campo**
  —adultos `1..cupo` (el **0 fuera**: no es una confirmación válida) y niños `0..cupo`—;
  `attendeeValue` **normaliza** el valor guardado a una opción válida (el 0 heredado se ve y se envía
  como **1**) al mostrarse los campos, para que lo que se ve sea lo que se envía (`optionValue`
  eliminado). `validateRsvp` **exige elegir asistencia** (`INVALID_RESPONSE`, código existente) tras
  nombre/teléfono y antes del rechazo y los cupos. Los **cuatro campos de la asistencia** (adultos,
  niños, alergias, mensaje) **solo existen** con «Sí, asistiré» y un **rechazo** no los envía ni los
  muestra (D18). El campo libre de `n` lleva `min={1}`.
- **Spec 004/005 · contrato módulo + documento:** `src/constants/contract.js` es la fuente única que
  consume la app, `docs/servicio-invitados.md` el derivado y `test/serviceContract.test.js` la
  sincronía exigida (RF-17, D18); los literales del modelo van en inglés por excepción documentada.
- **Spec 004 · el invitado sale del servicio:** el parámetro del enlace es **`guest`**
  (`codigo`/`code`/`inv` jubilados, sin alias); la app **no** deduce tipo ni cupo: los recibe
  resueltos (`interpretInvitation`, D20). Tipos: `personal`, `generic`, `public` (el código
  reservado `PUBLIC` es la pública, sin tope); `none` = sin invitación.
- **Spec 004 · el teléfono es la llave** de la genérica y la pública (10 dígitos, también para
  rechazar); una fila existente por ese teléfono se **actualiza**, no se duplica.
- **Spec 004 · plazo del maestro:** el registro ya **no** tiene `confirmacion.fechaLimite` ni
  `marca.enlaces.rsvp`; el plazo (`deadline`) y el cupo viven en el maestro del servicio.
- **Spec 004 · configuración por variables de entorno** (`VITE_SERVICE_URL`, `VITE_WEDDING_SLUG`;
  p. ej. `.env.local`, gitignorado; nunca valores hardcodeados en el repo): sin URL → modo demo
  sin llamar; URL sin `slug` → `MISSING_SLUG` sin reintento. POST con `text/plain` + JSON (evita
  el preflight de Apps Script) y espera de 10 s con `AbortController`.
- **Spec 004 · los libros reales no se versionan** (`gas/*.xlsx` en `.gitignore`);
  `src/data/guest-cards.js` son **fixtures ficticios** que la app no importa en ejecución.
- **Spec 003 · plantilla y nomenclatura:** la plantilla sale de `wedding.plantilla`, se resuelve con
  `templateStatus` y `useTemplate` es la única vía; `photos.js` resuelve por clave (`photoFor`) y falla
  al arrancar si falta una (`assertPhotoKeys`). Inglés solo de código; intactos textos visibles, datos
  y contratos. `base: "./"`, tema anti-parpadeo, `audio.play()` en el gesto, tokens «Ascua».
- **Spec 002 · lógica:** `visibleSections` omite opcionales vacíos y fuerza la confirmación;
  `allowsChildren` es `true` si no se indica; `isConfirmationOpen(deadline, now)` devuelve `null` (sin
  plazo) o `NaN` (plazo ilegible) y compara `<=` con «ahora» por parámetro.

## Aprendizajes y errores a evitar
- `node --test` descubre `**/*.test.js`; `services/config.js` (lee `import.meta.env`) no se prueba con
  `node --test` (misma frontera que `photos.js`).
- **Leer antes de editar:** el lector de archivos puede devolver una versión distinta a la real;
  confirmar con Node y validar siempre con `git diff`. **`replaceAll` en masa es peligroso:**
  cae sobre títulos y comentarios en español (en T25 hubo que revertir).
- **El id del maestro se lee POR NOMBRE:** `getProperty('MASTER_SHEET_ID')`. Pasar el **valor** de la
  propiedad como clave devuelve `null`, y `readMaster_` responde `INVALID_DATA` con cualquier maestro.
  El guardarraíl es estático: `npm test` **no** ejecuta Apps Script, así que no sustituye a la
  verificación manual contra el despliegue vivo.
- Chrome headless: `--dump-dom` no sirve para medir; servir `dist/` en local y medir por
  DevTools Protocol. Paridad T26 con script **fuera** del repo y casos límite con **parches
  temporales** de `wedding.js` + rebuild + revertir.
- **Fotos estructurales:** hero/retrato/confirmación (`foto1`/`foto9`/`foto7`) viven en el descriptor
  de la plantilla; mantener las variantes de `assets/photos/opt/` (el arranque falla si falta una).
- **Mesa de regalos:** el registro marca **un** dato (`copiar: true`); varios sin marca → sin
  botón (no se adivina la cuenta).
- **Agentes de OpenCode (`.opencode/agents/*.md`):** el frontmatter debe ser YAML válido si no
  el agente se omite en silencio (`opencode debug agents` lista solo los cargados).

## Próximos pasos
- **Spec 004/005 · T10 (desbloqueadas):** verificación manual contra el despliegue vivo —tres tipos,
  escritura por teléfono, casos de fallo (004 §13 del plan) y estados del RSVP (005 §12, con el punto 8
  de la revisión del formulario)—; anotar veredicto en «Verificación» de `AGENTS.md`. La de **spec 003
  · T27** se cubre en la misma pasada.
- Publicación pendiente (host real, `og:image` absoluto, fuentes autoalojadas y las variables de
  entorno del servicio en el build): ver `PENDING_TASKS.md`.
