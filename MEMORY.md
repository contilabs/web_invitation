# MEMORY.md — Invitación digital
Memoria del proyecto entre sesiones. Máximo ~80 líneas: resume o elimina lo que ya no aporte.
## Estado actual
- **Spec 001 cerrada salvo la pasada manual (T28) y el despliegue:** app React completa (sin
  `script.js`/`darkMode.js` ni código legado de datos), rediseño «Ascua», accesibilidad y rendimiento.
- **Spec 002 (`specs/002-modelo-datos-boda/`): fases 0–7 hechas**; queda la **pasada manual (T33)**:
  otro registro, portapapeles, audio tras «Ingresar», RSVP real y móvil. Registro único
  (`src/data/wedding.js`) + fichas (`src/data/guest-cards.js`); interfaz dirigida por el registro
  (`App.jsx` compone `visibleSections(boda)`); `npm test` → **110/110** y build OK.
- **Spec 003 (`specs/003-reorganizacion-modular-plantillas/`): T1–T13 hechas** (fases 0–4) y marcadas
  en `tasks.md`: `constants/`, `utils/` en inglés (T4–T7), `data/` (T8), plantilla clásica con CSS +
  iconos + `photoSizes` (T9–T10), **capa de plantilla** (T11–T12: `templates/index.js`,
  `templates/classic/index.js`, `providers/TemplateProvider.jsx`, `hooks/useTemplate.js`,
  `services/photos.js`) y **hooks renombrados y en inglés** (T13: `useTheme`, `useMusic`,
  `useInvitation`, `useCountdown`, `useConfirmation`, `useReveal`, `useHeader`, `useGallery`), con los
  **internos de `utils/` y de `hooks/` pasados a inglés** (comentarios, textos y claves de datos
  siguen en español). `npm test` → **110/110**, build OK (CSS `index-BJyTF753.css` intacto) y
  **paridad 30/30**. Falta T14–T28 (componentes, clases CSS, `app/`, pruebas y cierre).
- Documentación: `docs/constitution.md` (6 principios), `specs/001-*`…`003-*`, `PENDING_TASKS.md`.
## Decisiones (y por qué)
- **Spec 002 (modelo de datos):** toda la boda en un registro único y las fichas aparte; un despliegue
  por pareja; **tres tipos de invitación** (*personalizada*, *reutilizable* 1–10 y *genérica*) que
  **sustituyen** a `?invitados=N`; configuración jerárquica (boda → ficha) y conflicto de niños →
  fallo visible; datos inválidos → fallo visible, plantilla desconocida → aviso. El repo usa **solo
  fichas de ejemplo** (RNF-7); el contrato del GAS es **solo referencia**.
- T3: **`base: "./"`** (relativo), vale en cualquier subruta. T4: el script de tema vive en el
  `<head>` y React **reutiliza** `data-tema`/`kg-tema`. T7: `terminado` cuando la diferencia es `<= 0`.
  T11: `pickVariant` da la variante optimizada más cercana (nunca el original). T23: `audio.play()`
  **dentro del gesto** (Safari). T24 («Ascua»): solo cambian **tokens**. T25/T26: `<main>` + `a.saltar`
  + `:focus-visible` por token; `preload="none"` y `fetchPriority`.
- T14: `services/photos.js` resuelve por **clave** con `photoFor(clave, alt, sizes)` → `{ src, srcSet,
  sizes, alt }` vía `import.meta.glob`; **falla al arrancar** si falta una variante esperada
  (`assertPhotoKeys`).
- **Spec 003 · plantilla (T11–T12):** sale de `boda.plantilla` y se resuelve en ámbito de módulo de
  `App.jsx` con `templateStatus` (si no está implementada, la de por defecto); se publica por
  **contexto** y `useTemplate` es la **única vía de acceso**. El descriptor reúne identidad, iconos,
  `photoSizes` y las **claves de las fotos estructurales**. `services/photos.js` **no decide
  presentación** (recibe los `sizes` y las claves) y los servicios no importan la plantilla concreta.
- **Spec 002 · títulos de sección** en el registro; `hasContent` ignora `titulo` (un rótulo solo no
  muestra la sección). `ajustes.navegacion`/`ajustes.musica.habilitada` gobiernan qué se pinta. `Rsvp`
  prellena y bloquea el nombre en la personalizada e impide superar el límite. La galería se titula
  «Nuestros momentos» para no chocar con la sección **historia**.
- **Spec 003 · T13 (hooks/utils):** el renombrado alcanza también a los **tests**, pero quedan
  intactos los **exports de `data/`** (`boda`/`invitaciones`), `data-tema`/`kg-tema`/`dark-mode`, ids
  de ancla y todo lo que el **plan §9** lista como contrato. Se tocan en la misma tarea los puntos de
  uso mínimos en componentes; el barrido interno de estos llega en T14–T17.
## Aprendizajes y errores a evitar
- T5: el guardarraíl escanea CSS/`index.html` (no JS/JSX): no se puede nombrar Bootstrap.
- `node --test` descubre `**/*.test.js`; los módulos puros no afectan al build.
- Chrome headless: `--dump-dom` no sirve para medir (emite todo en una línea); servir `dist/` en local
  y medir por DevTools Protocol. `:focus-visible` no coincide con `focus()` programático.
- **Spec 001/002 · personalización por código de enlace** (sin vuelta atrás a `?invitados=N`).
- **Spec 002 · lógica:** `eventInstant` → `NaN` si la fecha o la zona es inválida (lo detecta
  `validation.js`); `visibleSections` omite opcionales ausentes o **vacíos** y **fuerza la
  confirmación** (RF-18); `allowsChildren` es `true` si no se indica (RF-12); `isConfirmationOpen`
  compara `<=` (borde incluido).
- **Fotos estructurales:** hero/retrato/confirmación no están en el registro; sus **claves**
  (`foto1`/`foto9`/`foto7`) viven en el descriptor de la plantilla y hay que mantener las variantes de
  `assets/photos/opt/` (el arranque falla si falta una).
- **Datos de ejemplo:** `src/data/wedding.js` trae cita, historia, galería (13 fotos, 7 destacadas),
  portada y enlaces; `restricciones` va sin datos → la sección no se muestra.
- **Verificación (headless):** `dist/` servido en local y medido por CDP (WebSocket global de Node
  ≥ 22), en un script **fuera** del repo; los casos límite con **parches temporales** de `wedding.js` +
  rebuild + revertir (nunca dejarlos aplicados).
- **Desviaciones del §6 (detalle en `PENDING_TASKS.md`):** un `limite` fuera de 1–10 cae a
  `desconocida` **en silencio**, el límite de la ficha se recorta al `maximoBoda` sin aviso y
  `eventInstant` no interpreta la hora de pared en la zona del evento.
- **Mesa de regalos (T35):** el registro marca **un** dato (`copiar: true`) y `copyableField` lo
  resuelve (varios sin marca → sin botón, para no adivinar).
- **Spec 003 · nomenclatura:** la paridad se exige sobre el **resultado visible** (referencia
  congelada), no sobre los nombres. El inglés es **solo de código**: no alcanza a textos visibles,
  datos y sus claves, contratos publicados (`kg-tema`, anclas, campos del envío), recursos ni
  documentos. La paridad **manda** sobre reutilizar.
- **Spec 003 · arnés de paridad (fuera del repo, `…\003-referencia\parity.mjs`):** 3 tipos × día/noche
  × 5 anchos (30 casos) de estructura, textos, atributos, geometría y estilos efectivos; **excluye las
  clases** (T18–T21 las renombran) y **omite la cuenta regresiva** (depende del reloj). Exige
  `prefers-reduced-motion`, esperar las fuentes, recorrer la página y medir hasta dos instantáneas
  idénticas. Hoy **30/30**.
## Próximos pasos
- **Spec 002 · T33:** pasada manual (otro registro, portapapeles, audio, **RSVP real**, móvil físico).
- **Spec 003 · T14–T28:** componentes a inglés y a `components/`, clases CSS (lo más delicado),
  `app/`, `test/contracts.test.js`, limpieza y paridad automática (arnés ya disponible).
- Publicación pendiente (host real, `og:image` absoluto, fuentes autoalojadas…): ver `PENDING_TASKS.md`.
