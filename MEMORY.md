# MEMORY.md — Invitación digital
Memoria del proyecto entre sesiones. Máximo ~80 líneas: resume o elimina lo que ya no aporte.
## Estado actual
- **Rama viva: `react-migration`** (antes `003-reorganizacion-modular-plantillas`; = `main` + specs
  001–004), **publicada** en `origin/react-migration`. **Spec 004** arrancada: solo `spec.md` (falta
  plan y tasks). `main` y `origin/main` al día en `f085e53`; la autenticación de GitHub funciona.
- **Spec 001 cerrada salvo la pasada manual y el despliegue:** app React completa (sin
  `script.js`/`darkMode.js` ni código legado de datos), rediseño «Ascua», accesibilidad y rendimiento.
- **Spec 002 (`specs/Jose-QB/002-modelo-datos-boda/`): fases 0–7 hechas**; su pasada manual se cubre con la
  de la spec 003 (misma lista). Registro único (`src/data/wedding.js`) + fichas
  (`src/data/guest-cards.js`); interfaz dirigida por el registro (`App.jsx` compone
  `visibleSections(wedding)`); `npm test` → **116/116** y build OK.
- **Spec 003 (`specs/Jose-QB/003-reorganizacion-modular-plantillas/`): T1–T26 y T28 hechas** y marcadas en
  `tasks.md`. Estructura final: `app/`, `constants/`, `data/`, `utils/` (lógica pura + pruebas),
  `hooks/`, `providers/`, `services/`, `templates/classic/`, `components/{layout,sections,ui}/` y
  `test/{andamiaje,contracts}.test.js`. **Toda la nomenclatura de `src/` y `test/` está en inglés**
  (T25; antes T13–T21). T26: paridad **30/30** + 4 casos límite. `npm test` → **116/116** y build OK.
  **Falta solo T27** (pasada manual: móvil y escritorio, RSVP real, portapapeles, audio).
- Documentación: `docs/constitution.md` (6 principios, enmendada por T2), `specs/Jose-QB/001-*`…`specs/Jose-QB/003-*`,
  `PENDING_TASKS.md`.
## Decisiones (y por qué)
- **Spec 002 (modelo de datos):** toda la boda en un registro único y las fichas aparte; un despliegue
  por pareja; **tres tipos de invitación** (*personalizada*, *reutilizable* 1–10 y *genérica*) que
  **sustituyen** a `?invitados=N`; configuración jerárquica (boda → ficha) y conflicto de niños →
  fallo visible; datos inválidos → fallo visible, plantilla desconocida → aviso. El repo usa **solo
  fichas de ejemplo**; el contrato del GAS es **solo referencia**.
- T3: **`base: "./"`** (relativo), vale en cualquier subruta. T4: el script de tema vive en el
  `<head>` y React **reutiliza** `data-tema`/`kg-tema`. T7: la cuenta regresiva termina cuando la
  diferencia es `<= 0`. `pickVariant` da la variante optimizada más cercana (nunca el original).
  `audio.play()` **dentro del gesto** (Safari). Rediseño «Ascua»: solo cambian **tokens**. `<main>` +
  `SkipLink` (`skip-link`) + `:focus-visible` por token; `preload="none"` y `fetchPriority`.
- `services/photos.js` resuelve por **clave** con `photoFor(clave, alt, sizes)` → `{ src, srcSet,
  sizes, alt }` vía `import.meta.glob` y **falla al arrancar** si falta una clave (`assertPhotoKeys`).
- **Spec 003 · plantilla:** sale de `wedding.plantilla` y se resuelve en ámbito de módulo de
  `App.jsx` con `templateStatus` (si no está implementada, la de por defecto); se publica por
  **contexto** y `useTemplate` es la **única vía de acceso**. El descriptor reúne identidad, iconos,
  `photoSizes` y las **claves de las fotos estructurales** (`foto1`/`foto9`/`foto7`). `photos.js`
  **no decide presentación** (recibe los `sizes` y las claves).
- **Spec 002 · títulos de sección** en el registro; `hasContent` ignora `titulo` (un rótulo solo no
  muestra la sección). `ajustes.navegacion`/`ajustes.musica.habilitada` gobiernan qué se pinta. `Rsvp`
  prellena y bloquea el nombre en la personalizada e impide superar el límite. La galería se titula
  «Nuestros momentos» para no chocar con la sección **historia**.
- **Spec 003 · nomenclatura (T13–T25):** el inglés es **solo de código**; quedan intactos los
  **textos visibles**, los **datos y sus claves**, los **contratos publicados** (`data-tema`/`kg-tema`,
  ids de ancla, parámetros `codigo`/`code`/`inv`, `name` del formulario), los **recursos** y los
  **comentarios/documentación**. **T25** renombró los exports de datos (`boda`→`wedding`,
  `invitaciones`→`guestCards`) por ser identificadores de código, y borró el **CSS muerto**
  (`body.cover-closed …` y `.data-label`, sin uso desde que se retiró `script.js`).
## Aprendizajes y errores a evitar
- `node --test` descubre `**/*.test.js`; los módulos puros no afectan al build.
- **Leer antes de editar:** el lector de archivos puede devolver una versión distinta a la real;
  confirmar con Node y validar siempre con `git diff`.
- Chrome headless: `--dump-dom` no sirve para medir (emite todo en una línea); servir `dist/` en local
  y medir por DevTools Protocol. `:focus-visible` no coincide con `focus()` programático.
- **Renombrar en masa con `replaceAll` es peligroso:** cae también sobre títulos de prueba, mensajes
  y comentarios en español. Verificar con `git diff` después (en T25 hubo que revertir
  «errores»→«errors» en un título y «paquete»→«pkg» en otro).
- **Spec 001/002 · personalización por código de enlace** (sin vuelta atrás a `?invitados=N`).
- **Spec 002 · lógica:** `eventInstant` → `NaN` si la fecha o la zona es inválida (lo detecta
  `validation.js`); `visibleSections` omite opcionales ausentes o **vacíos** y **fuerza la
  confirmación**; `allowsChildren` es `true` si no se indica; `isConfirmationOpen` compara `<=`.
- **Fotos estructurales:** hero/retrato/confirmación no están en el registro; sus **claves**
  (`foto1`/`foto9`/`foto7`) viven en el descriptor de la plantilla y hay que mantener las variantes de
  `assets/photos/opt/` (el arranque falla si falta una).
- **Datos de ejemplo:** `src/data/wedding.js` trae cita, historia, galería (13 fotos, 7 destacadas),
  portada y enlaces; `restricciones` va sin datos → la sección no se muestra.
- **Verificación (headless):** `dist/` servido en local y medido por CDP (WebSocket global de Node
  ≥ 22), en un script **fuera** del repo (`…\003-referencia\parity.mjs`); los casos límite con
  **parches temporales** de `wedding.js` + rebuild + revertir (nunca dejarlos aplicados). El arnés:
  3 tipos × día/noche × 5 anchos (30 casos), excluye las clases y omite la cuenta regresiva (reloj).
- **Mesa de regalos:** el registro marca **un** dato (`copiar: true`) y `copyableField` lo
  resuelve (varios sin marca → sin botón, para no adivinar).
- **Desviaciones del plan (detalle en `PENDING_TASKS.md`):** un `limite` fuera de 1–10 cae a
  `desconocida` **en silencio**, el límite de la ficha se recorta al `maximoBoda` sin aviso y
  `eventInstant` no interpreta la hora de pared en la zona del evento.
## Próximos pasos
- **Spec 003 · T27:** pasada manual (móvil y escritorio, tema, música tras «Ingresar», cuenta
  regresiva, galería/visor con teclado, copiado y **envío real** del RSVP) y anotar el resultado en
  «Verificación» de `AGENTS.md`.
- Publicación pendiente (host real, `og:image` absoluto, fuentes autoalojadas…): ver `PENDING_TASKS.md`.
