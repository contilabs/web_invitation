# MEMORY.md — Invitación digital
Memoria del proyecto entre sesiones. Máximo ~80 líneas: resume o elimina lo que ya no aporte.

## Estado actual
- **Rama viva: `codex/seccion-padres-padrinos`** (cambio aislado sobre el estado actual; pendiente de integrar).
- **Coordinación 2026-11-10:** `main` quedó integrado en `dfdae26`; la rama está limpia y sin conflictos,
  pero sigue 2 commits por delante de `origin` y la validación dinámica está bloqueada porque no hay Docker.
- **Sección familia:** se añadió el catálogo/renderizador y el modelo `familia.grupos`; los nombres reales
  siguen pendientes porque no estaban en el repositorio y no se inventaron datos personales.
- **Specs 001–003 cerradas** salvo la pasada manual (T27) y el despliegue: app React completa,
  rediseño «Ascua», capas, nomenclatura en inglés, registro único (`src/data/wedding.js`); paridad
  T26 **30/30**.
- **Spec 004: T1–T16 hechas; T17 (manual) pendiente.** Servicio de invitados y RSVP contra un Apps
  Script (`gas/Code.gs`), contrato **`1.4.0`** con hoja `public`, resolución por tipo (caída
  `generic`→`public`), estados `viewed`/`accepted`/`declined`, `MALFORMED_GUEST`, celdas vacías
  como cero y diagnóstico en `gas/README.md`.
- **Spec 005 (`specs/005-flujo-rsvp-respuesta-previa`): T1–T20, T22 y T23 hechas; T21 (manual)
  pendiente.** Flujo RSVP por máquina de estados (`rsvpState`, 7 estados) con `lookup` por teléfono,
  `useGuestLookup`, `AttendeeSelect`, `ResponseSummary` y contrato `1.4.0`. **T11–T15** son la
  revisión del formulario (RF-4/RF-11) y la **Fase 6 (T16–T20, T23)** el cambio RF-12…RF-15 (copy del
  rechazo, mensaje al rechazar, saludo de la personalizada, consulta tolerante). RF-17/D22 de la
  spec 005 quedan **derogados** por el cambio de la 004.
- **Spec 006 (`specs/006-panel-respuestas`):** T1–T12 y T16 implementadas. `admin.html` es una
  entrada Vite independiente; el panel usa `listResponses`, valida filas antes de pintarlas,
  deriva el resumen, filtra/ordena y abre detalle accesible. `revealPhone` exige la misma allowlist,
  devuelve una sola fila y el teléfono se mantiene solo en estado React. El slug sale de
  `VITE_WEDDING_SLUG` para la invitación y token de 5 dígitos enviado a `admin_email` para el
  panel. Cada solicitud de correo genera un token nuevo; `counter` cuenta fallos del token vigente
  y el token solo vive en memoria del panel. El filtro por tipo se retiró porque una boda solo
  tiene un tipo de invitación. El panel usa `files.language` para su vista, mantiene los estados
  del libro en inglés, muestra `dietary_restrictions` como alergias y separa los mensajes. Los
  boletos emitidos del panel salen solo de la suma de `guests.adults_guests`, no de las hojas de
  códigos. La pestaña de mensajes no muestra la fecha de actualización.
- **Separación de servicios del panel:** la invitación usa `VITE_SERVICE_URL`; `admin.html` usa
  `VITE_SERVICE_URL` para el endpoint tokenizado. `admin.html` es React estático, usa `fetch`
  sin credenciales y comparte deployment con el RSVP; no hay sesión Google.
- **Seguridad local:** `dev`, `preview`, `test`, `build` y `check` usan lanzadores Docker
  (`scripts/safe-dev.mjs` y `scripts/safe-check.mjs`) sin red ni montajes del host durante
  la ejecución; la configuración está documentada en `docs/local-security.md`.
- **Diagnóstico panel 2026-10-29:** una respuesta `INVALID_RESPONSE` al pedir el token indica que
  el deployment activo no reconoce `action: "requestToken"` o no recibe JSON válido; el código
  actual sí declara y enruta esa acción. La primera sospecha es una versión vieja o una URL de
  deployment distinta en `VITE_SERVICE_URL`; `MailApp` solo se alcanza después y devolvería
  `EMAIL_UNAVAILABLE` si fallara el permiso o la cuota.

## Decisiones (y por qué)
- **Spec 005 · máquina de estados y lookup:** el componente solo despacha eventos; `lookup` (por
  teléfono, solo genérica/pública) exige diez dígitos antes de llamar, **no escribe** en `guests`
  (no marca `viewed`) y **no devuelve** el teléfono ni datos ajenos. Cupo del combo y validación:
  `attendeeLimits`; precarga: `attendanceForm`/`interpretLookup`. Riesgo aceptado del teléfono en la
  consulta, documentado (constitución 5, `AGENTS.md`).
- **Spec 005 · teléfono tras el primer envío:** cuando un RSVP genérico o público termina bien,
  `Rsvp` copia el teléfono capturado en `submitted.current` a `lookupPhone`; así «Editar» conserva
  la llave de la fila aunque no haya habido una consulta previa. Durante el envío el campo es de
  solo lectura y al terminar se restaura el teléfono capturado antes de bloquearlo.
- **Spec 005 · formulario y Fase 6 (RF-4/RF-11/RF-12–RF-15):** rango del combo **por campo** (adultos
  `1..cupo` —el 0 fuera—, niños `0..cupo`); `attendeeValue` **normaliza** el 0 heredado (se ve y se
  envía como 1); `validateRsvp` **exige elegir asistencia**. Con «Sí» existen los cuatro campos; con
  «No» **solo el mensaje** (RF-13) y un rechazo envía ese mensaje y ninguno de los otros tres (D17/D18
  matizadas solo en el mensaje). La copy del rechazo es **rótulo local del componente**; el panel lo
  compone la **lógica pura** `responseSummaryData(answer, personalized)` (en un rechazo conserva el
  mensaje y `state` —«Editar» precarga el rechazo, DT-17— y omite asistentes y restricciones); el
  saludo «Hola, <nombre>» sale de `invitation.guestName` (nunca en la vista colapsada).
  `lookupResponse_` exige solo `phone` (tolerancia de cabeceras).
- **Spec 004/005 · contrato módulo + documento:** `src/constants/contract.js` es la fuente única,
  `docs/servicio-invitados.md` el derivado y `test/serviceContract.test.js` la sincronía exigida; los
  literales del modelo van en inglés por excepción documentada.
- **Servicio · protección de escritura:** `writeResponse_` marca como texto las cadenas antes de
  escribirlas y antepone el apóstrofo de escape de Sheets; así nombre, mensaje y restricciones no
  pueden evaluarse como fórmulas si empiezan por `=`. Los números se siguen escribiendo como
  números y los vacíos como vacíos.
- **Servicio · estado `viewed`:** `resolvePersonal_` lee la fila y decide si marca `viewed` bajo
  el mismo `ScriptLock` que `registerResponse_`; así una respuesta concurrente no puede ser
  sobrescrita por el resolver.
- **Servicio · escrituras bajo bloqueo:** los bloques protegidos hacen `SpreadsheetApp.flush()`
  antes de liberar el lock; el `releaseLock()` queda en un `finally` interno para no retenerlo si
  el flush falla.
- **Spec 004 · el invitado sale del servicio:** parámetro `guest` (`codigo`/`code`/`inv` jubilados,
  sin alias); la app **no** deduce tipo ni cupo, los recibe resueltos (`interpretInvitation`, D20).
  Tipos: `personal`, `generic`, `public` (código reservado `PUBLIC`, sin tope); `none` = sin
  invitación. **El teléfono es la llave** de genérica/pública (10 dígitos, también al rechazar): una
  fila con ese teléfono se **actualiza**, no se duplica.
- **Spec 006 · panel administrativo:** la autenticación vive en Apps Script con token de
  `admin_email` por boda, sin sesión Google ni slug en el enlace; los totales se
  derivan de las filas validadas. `updatedAt` representa la última respuesta del libro; si no hay
  ninguna, usa la hora de lectura.
- **Spec 004 · plazo y configuración:** el registro ya **no** tiene `confirmacion.fechaLimite` ni
  `marca.enlaces.rsvp`; plazo y cupo viven en el maestro. Config por entorno (`VITE_SERVICE_URL`,
  `VITE_WEDDING_SLUG`; `.env.local` gitignorado): sin URL → demo sin llamar; URL sin `slug` →
  `MISSING_SLUG` sin reintento. POST `text/plain` + JSON (evita preflight) y 10 s con
  `AbortController`. Los libros reales **no** se versionan (`gas/*.xlsx`).
- **Spec 003 · plantilla y nomenclatura:** la plantilla sale de `wedding.plantilla` (`templateStatus`);
  `useTemplate` es la única vía; `photos.js` resuelve por clave y falla al arrancar si falta una.
  Inglés solo de código; intactos textos, datos y contratos. `base: "./"`, tema anti-parpadeo,
  `audio.play()` en el gesto, tokens «Ascua».
- **Spec 002 · lógica:** `visibleSections` omite opcionales vacíos y fuerza la confirmación;
  `allowsChildren` es `true` si no se indica; `isConfirmationOpen` devuelve `null` (sin plazo) o
  `NaN` (ilegible) y compara `<=` con el «ahora» por parámetro.

## Aprendizajes y errores a evitar
- `node --test` descubre `**/*.test.js`; `services/config.js` (lee `import.meta.env`) y `photos.js`
  (usa `import.meta.glob`) no se prueban con `node --test`.
- **Leer antes de editar:** el lector puede devolver una versión distinta a la real; confirmar con
  Node y validar con `git diff`. **`replaceAll` en masa es peligroso** (cae en títulos y comentarios
  en español; en T25 hubo que revertir).
- **El id del maestro se lee POR NOMBRE:** `getProperty('MASTER_SHEET_ID')`. Pasar el **valor** como
  clave devuelve `null`. `npm test` **no** ejecuta Apps Script: no sustituye a la verificación manual.
- **`INVALID_DATA` al resolver un código = dato del libro, no defecto de la app:** `resolveCode_`
  aplica la regla del **tipo** (`generic` → `limit` entero > 0; `public` → `"n"`; otro →
  `INVALID_DATA`). Una fila `PUBLIC` con `limit = "n"` en una boda `generic` **nunca resuelve** (con o
  sin teléfono); el arreglo es **de datos** (borrar esa fila). No confundir con `MISSING_FIELDS` (sin
  teléfono), `UNKNOWN_GUEST` (código inexistente) ni un `INVALID_DATA` posterior (cabecera necesaria).
  Detalle en `gas/README.md`.
- Chrome headless: `--dump-dom` no sirve para medir; servir `dist/` en local y medir por DevTools
  Protocol. Paridad T26 con script **fuera** del repo y casos límite por parches temporales + revertir.
- **Fotos estructurales:** hero/retrato/confirmación (`foto1`/`foto9`/`foto7`) viven en el descriptor
  de la plantilla; mantener las variantes de `assets/photos/opt/` (el arranque falla si falta una).
- **Mesa de regalos:** el registro marca **un** dato (`copiar: true`); varios sin marca → sin botón.
- **Agentes de OpenCode (`.opencode/agents/*.md`):** el frontmatter debe ser YAML válido o el agente se
  omite en silencio (`opencode debug agents` lista solo los cargados).

## Próximos pasos
- **Spec 004 · T10 y spec 005 · T21 (manuales):** verificación contra el despliegue vivo —tres tipos,
  escritura por teléfono, casos de fallo (004 §13) y estados del RSVP (005 §12, puntos 1–11)—; anotar
  veredicto en «Verificación» de `AGENTS.md`. Usar un **código genérico real** (`4236_GEN`), no
  `PUBLIC`; **redesplegar** (la versión no sube y un despliegue viejo es indetectable). La T27 de la
  003 se cubre en la misma pasada.
- Publicación pendiente (host real, `og:image` absoluto, fuentes autoalojadas y las variables de
  entorno del servicio en el build): ver `PENDING_TASKS.md`.
