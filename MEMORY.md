# MEMORY.md — Invitación digital
Memoria del proyecto entre sesiones. Máximo ~80 líneas: resume o elimina lo que ya no aporte.

## Estado actual
- **Rama viva: `react-migration`** (specs en `specs/`, publicada en `origin` tras el rebase).
- **Spec 001 cerrada salvo la pasada manual y el despliegue:** app React completa, rediseño
  «Ascua», accesibilidad y rendimiento.
- **Spec 002: fases 0–7 hechas;** su pasada manual se cubre con la de la spec 003 (misma lista).
  Registro único (`src/data/wedding.js`) + interfaz dirigida por el registro.
- **Spec 003: T1–T26 y T28 hechas;** estructura por capas (`app/`, `constants/`, `data/`,
  `utils/`, `hooks/`, `providers/`, `services/`, `templates/`, `components/`, `test/`) y
  nomenclatura en inglés. T26: paridad **30/30**. **Falta solo T27** (pasada manual).
- **Spec 004 (`specs/004-servicio-invitados-rsvp`): T1–T9 hechas; T10 (documentación y
  verificación) en curso.** Servicio de invitados y RSVP contra un Apps Script (`gas/Code.gs`),
  con contrato en módulo + documento (`src/constants/contract.js`, `docs/servicio-invitados.md`).
  `npm test` → **158/158** y build OK. Falta la verificación manual contra el despliegue vivo
  (§13 del plan; checklist anotada en «Verificación» de `AGENTS.md`, la rellena el coordinador).
- Documentación: `docs/constitution.md` (6 principios, enmendada en T2 de la 004),
  `docs/servicio-invitados.md`, `README.md`, `AGENTS.md`, `PENDING_TASKS.md`.

## Decisiones (y por qué)
- **Spec 004 · contrato módulo + documento:** `src/constants/contract.js` es la fuente única que
  consume la app; `docs/servicio-invitados.md` es el derivado y `test/serviceContract.test.js`
  exige la sincronía (RF-17, D18). Los literales del modelo (hojas, columnas, estados, códigos)
  van en inglés por excepción documentada.
- **Spec 004 · el invitado sale del servicio:** el parámetro del enlace es **`guest`**
  (`codigo`/`code`/`inv` jubilados, sin alias); la app **no** deduce tipo ni cupo: los recibe
  resueltos (`interpretInvitation`, D20). Tipos: `personal`, `generic`, `public` (el código
  reservado `PUBLIC` es la pública, sin tope); `none` = sin invitación.
- **Spec 004 · el teléfono es la llave** de la genérica y la pública (10 dígitos, también para
  rechazar); una fila existente por ese teléfono se **actualiza**, no se duplica.
- **Spec 004 · plazo del maestro:** el registro ya **no** tiene `confirmacion.fechaLimite` ni
  `marca.enlaces.rsvp`, y `confirmacion.maximoBoda` **no** lo lee ningún cálculo de cupos
  (queda como dato informativo). El plazo (`deadline`) y el cupo viven en el maestro del servicio.
- **Spec 004 · configuración por variables de entorno** (`VITE_SERVICE_URL`, `VITE_WEDDING_SLUG`;
  p. ej. `.env.local`, gitignorado; nunca valores hardcodeados en el repo): sin URL → modo demo
  sin llamar; URL sin `slug` → `MISSING_SLUG` sin reintento. POST con `text/plain` + JSON (evita
  el preflight de Apps Script) y espera de 10 s con `AbortController`.
- **Spec 004 · los libros reales no se versionan** (`gas/*.xlsx` en `.gitignore`);
  `src/data/guest-cards.js` son **fixtures ficticios** que la app no importa en ejecución.
- **Spec 003 · plantilla:** sale de `wedding.plantilla`, se resuelve con `templateStatus`, se
  publica por contexto y `useTemplate` es la única vía. `photos.js` resuelve por clave
  (`photoFor`) y falla al arrancar si falta una (`assertPhotoKeys`).
- **Spec 003 · nomenclatura:** inglés solo de código; intactos textos visibles, datos y sus
  claves, contratos publicados y comentarios/documentación. `base: "./"` (relativo); tema
  anti-parpadeo en el `<head>`; `audio.play()` dentro del gesto; tokens «Ascua»; `<main>` +
  `SkipLink` + `:focus-visible`.
- **Spec 002 · lógica:** `visibleSections` omite opcionales ausentes/vacíos y fuerza la
  confirmación; `allowsChildren` es `true` si no se indica; `isConfirmationOpen(deadline, now)`
  devuelve `null` (sin plazo) o `NaN` (plazo ilegible) y compara `<=` con «ahora» por parámetro.

## Aprendizajes y errores a evitar
- `node --test` descubre `**/*.test.js`; los módulos puros no afectan al build.
  `services/config.js` (lee `import.meta.env`) no se prueba con `node --test` (misma frontera
  que `photos.js`).
- **Leer antes de editar:** el lector de archivos puede devolver una versión distinta a la real;
  confirmar con Node y validar siempre con `git diff`. **`replaceAll` en masa es peligroso:**
  cae sobre títulos y comentarios en español (en T25 hubo que revertir).
- Chrome headless: `--dump-dom` no sirve para medir; servir `dist/` en local y medir por
  DevTools Protocol. Paridad T26 con script **fuera** del repo y casos límite con **parches
  temporales** de `wedding.js` + rebuild + revertir.
- **Fotos estructurales:** hero/retrato/confirmación (`foto1`/`foto9`/`foto7`) viven en el
  descriptor de la plantilla; mantener las variantes de `assets/photos/opt/` (el arranque falla
  si falta una). Nombres sensibles a mayúsculas en sistemas case-sensitive.
- **Mesa de regalos:** el registro marca **un** dato (`copiar: true`); varios sin marca → sin
  botón (no se adivina la cuenta).
- **Agentes de OpenCode (`.opencode/agents/*.md`):** el frontmatter debe ser YAML válido si no
  el agente se omite en silencio (`opencode debug agents` lista solo los cargados).

## Próximos pasos
- **Spec 004 · T10:** el coordinador verifica contra el despliegue vivo (tres tipos, escritura
  por teléfono, casos de §13 del plan) y anota el veredicto en «Verificación» de `AGENTS.md`.
- **Spec 003 · T27:** pasada manual (móvil y escritorio, tema, música tras «Ingresar», cuenta
  regresiva, galería/visor, copiado y envío real del RSVP) y anotarla en «Verificación».
- Publicación pendiente (host real, `og:image` absoluto, fuentes autoalojadas y las variables de
  entorno del servicio en el build): ver `PENDING_TASKS.md`.
