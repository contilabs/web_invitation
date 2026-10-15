# AGENTS.md

Invitación de boda de Karina & Gerardo. App **React + Vite** con build. La spec activa es
`specs/003-reorganizacion-modular-plantillas/` (reorganización modular por capas, plantilla de
presentación y nomenclatura del código en inglés); las anteriores son
`specs/002-modelo-datos-boda/` (modelo de datos reutilizable, UI dirigida por el registro) y
`specs/001-migracion-y-rediseno/` (de la página estática a React).

## Quick start

- `npm install` — instala React + Vite (no hay más dependencias).
- `npm run dev` — servidor de desarrollo de Vite.
- `npm run build` — genera el sitio estático en `dist/`; `npm run preview` lo sirve.

Estado: la app React compone **toda** la invitación y la interfaz va **dirigida por el registro
único**. `index.html` es el shell de Vite (`<div id="root">`), la app monta desde `src/app/main.jsx`
y `src/app/App.jsx` compone el catálogo de secciones que devuelve `visibleSections(wedding)` (el
mapa clave → componente vive en `src/app/sectionRenderers.jsx`). Los antiguos `script.js` /
`darkMode.js` **ya no existen**, igual que `src/logica/`, `src/datos/`, `src/componentes/` y los
CSS de la raíz. La spec 003 tiene **T1–T26 y T28 hechas** (verificación automática incluida) salvo
la **pasada manual (T27)**.

## Critical sync points

> El **único origen** de los datos de la boda es **`src/data/wedding.js`** (pareja, evento, secciones, enlaces, etc.). Las **fichas de invitación** viven en **`src/data/guest-cards.js`** (separadas del registro de la boda). Los componentes no tienen datos ni textos de contenido incrustados.

- **Registro de la boda.** El **único origen** de los datos de la boda es `src/data/wedding.js` (export `wedding`); las **fichas de invitación** viven en `src/data/guest-cards.js` (export `guestCards`). Cambiar un dato se hace ahí y se publica reconstruyendo.
- **RSVP form endpoint.** FormSubmit.co; el primer envío pedirá confirmación por correo (externo, no local). El endpoint se define en el registro (`src/data/wedding.js`, `marca.enlaces.rsvp`).
- **Idioma.** La **nomenclatura del código** va en **inglés**; los **textos visibles**, los **datos** (con sus claves), los **comentarios**, los **títulos de prueba** y la **documentación** van en **español**. Los **ids de ancla** (`#inicio`, `#fecha`…) se conservan tal cual por ser enlaces compartibles.

## Lógica pura (`src/utils/`)

- **Sin React, sin DOM y sin reloj interno.** Cada módulo exporta funciones puras; lo que
  depende del entorno (el «ahora», `localStorage`, `<audio>`, `URLSearchParams`) entra como parámetro o vive en el
  hook/componente. Identificadores en inglés; comentarios y textos de interfaz en español.
- **Secciones.** El catálogo incluye las secciones existentes más **cita** e **historia**. La confirmación **siempre está presente** (no se apaga). Las secciones opcionales se omiten si no están definidas o no tienen contenido. El **orden de presentación vive solo en `SECTION_ORDER`** (`src/constants/sections.js`); la **galería cierra** la invitación (última, justo antes del `Footer`). Los **títulos de sección viven en el registro** (`ubicaciones.titulo`, `galeria.titulo`, `regalos.titulo`, `restricciones.titulo`, `itinerario.titulo`, `hoteles.titulo`); un objeto con solo `titulo` **no** hace visible la sección (por eso `hasContent` lo ignora).
- **Personalización por enlace.** La invitación se resuelve por **código de enlace** (parámetros `codigo` / `code` / `inv`, **no** `?invitados=N`). Hay tres tipos (`INVITATION_TYPES`): personalizada, reutilizable y genérica. Los lugares reservados solo existen en la personalizada.
- **Inventario de lógica (`src/utils/`).** Funciones puras para nombres (`couple.js`: `composePersonName`, `coupleNames`), fecha/zona (`event.js`: `eventTimeZone`, `eventInstant`, `formatDate`, `formatTime`), secciones visibles (`sections.js`: `hasContent`, `visibleSections`), restricciones con jerarquía boda→ficha (`restrictions.js`), resolución de invitación (`invitation.js`), confirmación/plazos (`confirmation.js`: `deadlineMs`, `isConfirmationOpen`, `confirmationFields`), regalos (`gifts.js`: `giftOptions`, `copyableFields`, `copyableField`, `GIFT_TYPES`), validación/avisos (`validation.js`: `templateStatus`, `registryErrors`, `registryWarnings`), cuenta regresiva (`countdown.js`: `remainingParts`), galería (`gallery.js`: `nextIndex`, `pickVariant`), tema (`theme.js`: `resolveTheme`), música (`music.js`: `nextMusicState`) y etiquetas (`labels.js`). Las claves/valores del tema viven en `src/constants/theme.js`.
- **Mesa de regalos (RF-10).** Los datos de cada opción salen del registro; **como máximo uno** va marcado con `copiar: true` y es el que copia el **único** botón de la opción (el resto se muestra como texto). Si una opción trae varios datos sin marca, no se pone botón: no se adivina cuál es la cuenta. `CopyButton` usa `buttonText` para el rótulo visible y el aviso nombra el dato copiado.
- **Pruebas co-locadas** (`src/utils/*.test.js`, `src/data/*.test.js`) con el runner `node --test`; se
  descubren solas. No hay tests de UI (van a mano).
- **Interfaz (`src/hooks/`, `src/components/`).** La lógica con estado (el «ahora», `localStorage`,
  `<audio>`, `IntersectionObserver`) vive en `src/hooks/` (un hook por comportamiento: `useTheme`,
  `useMusic`, `useInvitation`, `useCountdown`, `useConfirmation`, `useReveal`, `useHeader`,
  `useGallery`, `useTemplate`) y la presentación en `src/components/`: `layout/` (estructura:
  `Header`, `Footer`, `Cover`, `ControlsPanel`, `ErrorNotice`, `SkipLink`), `sections/` (contenido:
  `Hero`, `Countdown`, `Portrait`, `Quote`, `Story`, `Locations`, `Timeline`, `Gifts`, `Hotels`,
  `Restrictions`, `Rsvp`, `Gallery`) y `ui/` (piezas reutilizables: `CopyButton`, `ThemeToggle`,
  `MusicToggle`, `GalleryViewer`). Los textos que son **datos de la boda** viven en el registro
  (`src/data/wedding.js`); los rótulos de interfaz que no son datos viven con su componente.

## Capa de plantilla (`src/templates/`, RF-2)

- **Qué decide la plantilla:** los estilos (`classic.css` + `classic-dark.css`), el mapa de iconos
  (`icons.js`), los `sizes` de las imágenes (`photoSizes.js`) y **qué fotos estructurales** usa
  (`structuralPhotos`: hero `foto1`, retrato `foto9`, confirmación `foto7`). **Qué NO decide:** datos,
  textos, qué secciones se muestran ni en qué orden, ni ninguna regla de negocio.
- **Cómo llega a los componentes:** `App.jsx` resuelve la plantilla con `resolveTemplate` (usando
  `templateStatus` para la reserva), la publica con **`TemplateProvider`** y las piezas que la
  necesitan la leen con **`useTemplate()`** (única vía; no se pasa por props ni se importa directa).
- **Sin selector.** Solo existe la plantilla `clasica` (`DEFAULT_TEMPLATE_ID` e
  `IMPLEMENTED_TEMPLATE_IDS` en `src/constants/templates.js`); no hay control, parámetro ni ajuste
  para elegir otra. El aviso de «plantilla no implementada» (`registryWarnings`) se conserva.
- **`src/services/photos.js`** recibe los `sizes` y las claves estructurales de la plantilla; resuelve
  las fotos **por clave** (`photoFor(clave, alt, sizes)`) y **falla al arrancar** (`assertPhotoKeys`) si
  falta una variante optimizada esperada (claves del registro + estructurales de la plantilla).

## Theming & behavior quirks

- **Theme prevents flash.** The inline script at the top of `<head>` in `index.html` is the **single initial resolution** of the theme: it reads `localStorage["kg-tema"]` (`"dia"`/`"noche"`), falls back to the system preference, and applies `html.dark-mode` + `data-tema` before any stylesheet loads. It must stay **before** the first `<link rel="stylesheet">` (guarded by `test/andamiaje.test.js`). Don’t add theme classes to `<body>` or duplicate this logic: `useTheme` **reuses** what the script already set (`data-tema` / `kg-tema`), persists the choice in `localStorage["kg-tema"]`, follows the system while there is no saved choice, and updates `theme-color` with an unscoped `<meta>` when the guest chooses.
- **No-JS fallback.** `<body>` carries a `<noscript>` notice in Spanish: without JavaScript the app cannot mount, so the guest is told to enable it. Keep it in Spanish (RNF-6); it is new interface copy.
- **CSS-only theming.** Day tokens live in `src/templates/classic/classic.css` (`:root`), night tokens in `src/templates/classic/classic-dark.css` (`html.dark-mode`). Only CSS variables change; images are not filtered for theme. Dark-mode icon/logo adjustments are defined in `classic-dark.css`.
- **Reduced motion.** The motion override lives at the end of `classic.css` (`@media (prefers-reduced-motion: reduce)`). `useGallery` also disables the carousel’s auto-advance under this preference (RNF-2), and `useReveal` relies on the CSS override to skip the section animation.
- **Accessibility.** La app va dentro de `<main>` (con `<header>`/`<footer>`) y abre con el enlace «Saltar al contenido» (`SkipLink`, clase `skip-link`, oculto hasta recibir foco). El foco visible sale de `:where(a, button, input, textarea, [tabindex]):focus-visible` con `--ember`. La portada cierra con Escape o clic fuera y devuelve el foco a `#inicio`; cada diapositiva del carrusel es un `<button>` y el visor (`GalleryViewer`) es un `<dialog>` con `showModal()`. `test/andamiaje.test.js` exige el enlace de salto dentro de `<main>`.
- **Rendimiento.** La página solo carga derivados de `assets/photos/opt/` (nunca los originales); el visor usa `pickVariant(srcset, 1400)`; el `<audio>` lleva `preload="none"` con `<source>` (no se descarga hasta el gesto); `fetchPriority` alto en la portada y bajo en el hero. `remainingParts` devuelve «terminado» si la fecha es `NaN` en vez de propagarlo.
- **Bootstrap retired.** No Bootstrap CSS/JS is loaded: `classic.css` + `classic-dark.css` (plus Google Fonts) are the only stylesheets. Carousel hooks are project-owned — `.gallery-strip .slide img` for slides, `.slide.slide-active` is the visible one, and `.gallery-arrow` (with `.gallery-arrow-next` for the reversed arrow) + `.gallery-arrow-icon` for the controls; the chevron is an inline SVG data-URI, and `.gallery-strip` is `position: relative` so `.gallery-counter` anchors to it. `.visually-hidden` is defined locally. `test/andamiaje.test.js` fails if `bootstrap`/`carousel`/`data-bs`/`--bs-` reappear in the CSS or the shell (that is why the gallery classes avoid the word “carousel”).
- **Music requires gesture.** Autoplay is blocked; music starts only after clicking “INGRESAR” (which also closes the welcome modal and unlocks background) or the floating music button. `useMusic` calls `audio.play()` **inside** the gesture (Safari-friendly); the audio file `assets/audio.mp3` is imported by `App.jsx` so it enters the build.

## Images & assets

- **Photo inventory (`src/services/photos.js`).** Las fotos se resuelven **por clave** con `photoFor(key, alt?, sizes?)`, que devuelve `{ src, srcSet, sizes, alt }` (listo para esparcir en un `<img>`) desde `import.meta.glob("../../assets/photos/opt/*.{jpg,jpeg,png}", { query: "?url", import: "default" })`. Al arrancar **falla** si falta una clave esperada (las estructurales + las del registro) mediante `assertPhotoKeys`. No escribas rutas de assets a mano: Vite solo copia a `dist/` lo que importa (las fotos/iconos/audio referenciados solo desde el código **no** se copiaban). Así el build las emite con huella y con URL válida en cualquier subruta. La portada y la galería resuelven sus fotos **desde el registro** con `coverPhotos(portada, sizes)` (fondo + tarjeta) y `galleryPhotos(galeria, sizes)` (destacadas + rejilla); las claves de las fotos estructurales (`hero`, `portrait`, `confirmation`) las declara la plantilla (`structuralPhotos`).
- **Use optimized images.** The page loads from `assets/photos/opt/` (with `srcset`/`sizes`), not the large originals in `assets/photos/`. If you replace an original, regenerate its optimized variants with the same base names and widths (e.g. `foto5-900.jpg`, `foto5-1800.jpg`); `photos.js` las descubre por el patrón `…\d+.<ext>` y falla al arrancar si falta una base esperada.
- **Filename casing matters.** On case-sensitive systems (Linux/GitHub Pages) names must match exactly. Since `photos.js` deriva los nombres del glob, un cambio de nombre se refleja solo; pero los literales que sí quedan escritos a mano (p. ej. `backgrond3` como fondo de portada en el registro) tienen que coincidir. Nota: en `opt/` todas son `.jpg` (p. ej. `foto9-900.jpg`), aunque el original de `assets/photos/` sea de otra extensión.
- **Custom fonts.** `Erstoria` y `Kalista` se cargan desde `fonts/` con `font-display: swap` (nombres y títulos: `--fuente-titulo`/`--fuente-script`, y `--fuente-nombres` elige cuál). El **texto** usa `Source Serif 4` (`--fuente-texto`) y las **etiquetas** `Montserrat` (`--fuente-etiqueta`), desde Google Fonts. El rediseño «Ascua» solo cambia **tokens** de color (`--paper`/`--ink`/`--ember`/`--vino`/`--banda-*`): nunca colores literales.
- **Base relativa del build.** `vite.config.js` fija `base: "./"`, así el sitio funciona en cualquier subruta (y los enlaces `…/index.html?codigo=…` siguen valiendo). Consecuencia: importa los assets (`import x from "…"` o `import.meta.glob`) en vez de construir rutas a mano; `import.meta.env.BASE_URL` vale `"./"` y no hay que normalizarlo a `/`. Vite reescribe las rutas del HTML y del CSS y resuelve las de JS con `import.meta.url`.

## Guest personalization

- La personalización se resuelve con **`useInvitation`**: lee el **código del enlace** y devuelve `type`, `limit`, `guest`, `card`, `reservedSeats`, `guestLimit` y `seatsText` (la lógica vive en `src/utils/invitation.js`). `Rsvp` usa esos datos: prellena y bloquea el nombre en la personalizada, muestra el acompañante de la ficha y acota el número de asistentes al límite.
- `useConfirmation` expone `{ open }` y la recalcula **al pasar la fecha límite sin recargar**. Los hooks no leen el registro por su cuenta: sus datos entran por parámetros (`App.jsx` y `Rsvp` se los pasan).

## Editing guidance

- Prefer minimal, targeted edits. El trabajo avanza **tarea a tarea** según
  `specs/003-reorganizacion-modular-plantillas/tasks.md`: no adelantes tareas ajenas ni reescribas lo que
  ya funciona.
- Keep the theme token system intact (central CSS variables). Don't inline colors that should come from tokens.
- When touching dates, links, or bank data, update the **único origen**:
  `src/data/wedding.js` (toda la interfaz lee de ahí). El código legado de la spec 001
  (`logica/datosEvento.js`, `logica/invitados.js`) **ya se borró**: no queda copia alguna.
- **Contratos que no se renombran** (vigilados por `test/contracts.test.js`): claves del registro y de las fichas; ids de ancla; parámetros `codigo`/`code`/`inv`; `name` de los campos del formulario; clave `kg-tema` y valores `dia`/`noche`; y los recursos (`assets/**`).

## Memoria
- Al empezar, lee `MEMORY.md` para conocer el estado del proyecto y las decisiones
  tomadas.
- Al terminar una tarea, actualízalo: estado actual, decisiones importantes (con su
  por qué) y errores a evitar.
- Mantenlo breve (máximo ~80 líneas): resume o elimina lo que ya no aporte.
- Si algo se convierte en una regla permanente, propón moverlo a `AGENTS.md` en lugar de
  dejarlo en la memoria.
- No guardes nunca datos sensibles (claves, tokens, datos personales).
- Además de `MEMORY.md` existe `PENDING_TASKS.md` (raíz): casos límite, dudas y trabajo
  diferido. Léelo al empezar.
- Depura `PENDING_TASKS.md` siempre: elimina cada entrada cuando se resuelve o deja de ser
  relevante. No es un histórico.
- Reparto: `MEMORY.md` = estado y decisiones; `AGENTS.md` = reglas permanentes;
  `PENDING_TASKS.md` = lo pendiente.

## Forma de trabajar

- Haz solo lo que se pide: no añadas funcionalidades por tu cuenta.
- Cambios pequeños y enfocados; no reescribas lo que ya funciona.
- Al terminar, resume qué has cambiado y cualquier decisión que deba revisar.

## Límites

- ✅ Siempre: actualizar `MEMORY.md` al terminar cada tarea.
- ⚠️ Pregunta antes: crear archivos nuevos, cambiar el formato de los datos guardados.
- 🚫 Nunca: añadir dependencias fuera de las que fija la constitución (hoy: React, Vite y el
  plugin oficial de React). Nada de librerías de UI, CSS o animación.

## Verificación

- `npm run dev` y `npm run build` deben terminar sin errores.
- `npm test` (`node --test`, el runner integrado de Node): sin instalar nada. Cubre la lógica
  pura de `src/utils/*.test.js`, la no regresión del registro (`src/data/*.test.js`) y los
  guardarraíles `test/andamiaje.test.js` y `test/contracts.test.js`.
- Verificación manual en el navegador (no hay tests de UI): tema, música, cuenta regresiva,
  galería + visor, copiar datos y envío del RSVP.
- **Pruebas.** `src/utils/*.test.js` cubre la lógica pura; `src/data/wedding.test.js` y
  `src/data/guest-cards.test.js` son la **no regresión del registro** y la **forma de las
  fichas** (no importan `services/photos.js`: usa `import.meta.glob`, que solo existe bajo Vite;
  las claves se validan con `registryErrors`). `test/andamiaje.test.js` vigila el shell, el CSS,
  el enlace de salto y que no vuelvan Bootstrap ni `?invitados=N`; `test/contracts.test.js` frena
  cualquier renombrado «de paso» de los contratos publicados.
- **Paridad automática (T26).** Chrome headless sobre `dist/` **servido por un servidor propio**
  y medido por DevTools Protocol (WebSocket global de Node ≥ 22), no con `--dump-dom`. Compara la
  referencia congelada (commit `f085e53`) y el build nuevo en la matriz tres tipos × día/noche ×
  320/375/768/1024/1440 px, sobre estructura visible, textos, atributos, geometría y estilos
  efectivos: **30/30 sin diferencias**. Los casos límite (registro inválido, sección omitida,
  aviso de plantilla y confirmación cerrada) se ejercen con **parches temporales** de
  `src/data/wedding.js` + rebuild y revertir: nombre faltante → `.notice-errors`; `historiaVisible:
  false` → sin `#historia`; `plantilla: "moderna"` → `.notice-warnings`; plazo pasado →
  `.rsvp-closed` sin formulario. El script vive **fuera** del repo (no se versiona).
- **Pasada manual (T27, pendiente).** Reutilizar con otro registro, copiar datos con el
  portapapeles, audio tras «Ingresar», **envío real del RSVP** (FormSubmit pide confirmar el correo
  la primera vez) y una vuelta en un **móvil físico**.

## Reglas

- Lee `docs/constitution.md` y la spec activa (`specs/NNN-*/`) antes de tocar código.
