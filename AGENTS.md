# AGENTS.md

Invitación de boda de Karina & Gerardo. App **React + Vite** con build. La spec activa es
`specs/004-servicio-invitados-rsvp` (servicio de invitados y RSVP contra un Apps Script,
parámetro `guest` y configuración por variables de entorno); las anteriores son
`specs/003-reorganizacion-modular-plantillas` (reorganización modular, plantilla y nomenclatura
del código en inglés), `specs/002-modelo-datos-boda` (modelo de datos reutilizable, UI dirigida
por el registro) y `specs/001-migracion-y-rediseno` (de la página estática a React).

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
la **pasada manual (T27)**; la **spec 004** tiene **T1–T9 hechas** y la parte documental de T10 en
curso (la verificación contra el servicio vivo la anota el coordinador en «Verificación»).

## Critical sync points

> El **único origen** del **contenido** de la boda es **`src/data/wedding.js`** (pareja, evento, secciones, etc.). El **invitado y su respuesta** salen del **servicio de registro** (resolución por el parámetro `guest`); `src/data/guest-cards.js` son solo **ejemplos ficticios** (fixtures de su prueba, la app no los importa en ejecución). Los componentes no tienen datos ni textos de contenido incrustados.

- **Registro de la boda.** El **único origen** del contenido es `src/data/wedding.js` (export `wedding`); cambiar un dato se hace ahí y se publica reconstruyendo. El registro **no** lleva ni el plazo de confirmación (`confirmacion.fechaLimite` se retiró: el plazo lo da el maestro del servicio) ni el destino del envío (`marca.enlaces.rsvp` se retiró), y `confirmacion.maximoBoda` **no** lo lee ningún cálculo de cupos.
- **Servicio de invitados (RSVP).** La resolución de la invitación y el registro de la respuesta van al servicio de registro (Apps Script, `gas/Code.gs`) por `src/services/registration.js` (POST con `text/plain` + JSON, 10 s con `AbortController`). Además, para precargar la respuesta previa en la invitación **genérica** y **pública**, la app usa la acción `lookup` (misma vía POST) para **leer** una fila por teléfono; esa consulta **no escribe** en `guests` (no marca `viewed`) y **no devuelve** el teléfono ni datos de otras filas. El contrato es **módulo + documento**: `src/constants/contract.js` es la fuente única que consume la app y `docs/servicio-invitados.md` el derivado (`test/serviceContract.test.js` exige la sincronía). La configuración (`VITE_SERVICE_URL`, `VITE_WEDDING_SLUG`, p. ej. en `.env.local`, gitignorado) es **por publicación**, nunca del repo. Los libros reales (datos personales) se excluyen por `.gitignore` (`gas/*.xlsx`). 

  **Riesgo aceptado (spec 005).** Al solicitar el teléfono para la búsqueda, ese número forma parte de la consulta al servicio en genérica/pública (nunca en personalizada). Se mitiga porque `lookup` exige diez dígitos antes de llamar, no escribe en `guests`, no devuelve el teléfono ni filas ajenas, no lo persiste en `localStorage` ni en la URL y solo se usa con la configuración del servicio.
- **Idioma.** La **nomenclatura del código** va en **inglés**; los **textos visibles**, los **datos** (con sus claves), los **comentarios**, los **títulos de prueba** y la **documentación** van en **español**. Excepción documentada (spec 004): los literales del **modelo del servicio** (hojas, columnas, estados, el parámetro `guest` y los códigos de error) conservan su forma en inglés. Los **ids de ancla** (`#inicio`, `#fecha`…) se conservan tal cual por ser enlaces compartibles.

## Lógica pura (`src/utils/`)

- **Sin React, sin DOM y sin reloj interno.** Cada módulo exporta funciones puras; lo que
  depende del entorno (el «ahora», `localStorage`, `<audio>`, `URLSearchParams`) entra como parámetro o vive en el
  hook/componente. Identificadores en inglés; comentarios y textos de interfaz en español.
- **Secciones.** El catálogo incluye las secciones existentes más **cita** e **historia**. La confirmación **siempre está presente** (no se apaga). Las secciones opcionales se omiten si no están definidas o no tienen contenido. El **orden de presentación vive solo en `SECTION_ORDER`** (`src/constants/sections.js`); la **galería cierra** la invitación (última, justo antes del `Footer`). Los **títulos de sección viven en el registro** (`ubicaciones.titulo`, `galeria.titulo`, `regalos.titulo`, `restricciones.titulo`, `itinerario.titulo`, `hoteles.titulo`); un objeto con solo `titulo` **no** hace visible la sección (por eso `hasContent` lo ignora).
- **Personalización por enlace.** La invitación se resuelve contra el **servicio** por el parámetro **`guest`** (`readGuestCode` lo recorta; los parámetros `codigo`/`code`/`inv` están **jubilados**, sin alias). Tipos (`INVITATION_TYPES`, valores del contrato): `personal` (personalizada, con lugares reservados), `generic` (genérica, cupo del código), `public` (pública, código reservado `PUBLIC`, sin tope) y `none` (ausencia de invitación: confirmación deshabilitada, sin personalizar). La comparación normalizada del código (sin distinguir mayúsculas) es del **servicio**, no de la app.
- **Inventario de lógica (`src/utils/`).** Funciones puras para nombres (`couple.js`: `composePersonName`, `coupleNames`), fecha/zona (`event.js`: `eventTimeZone`, `eventInstant`, `formatDate`, `formatTime`), secciones visibles (`sections.js`: `hasContent`, `visibleSections`), restricciones (`restrictions.js`: `allowsChildren`, `restrictionMessages`), la invitación resuelta por el servicio (`invitation.js`: `readGuestCode`, `interpretInvitation`, `interpretLookup`, `reservedSeats`, `guestLimit`, `attendeeLimits`, `isWithinGuestLimit`, `formatSeats`, `seatsText`, `INVITATION_TYPES`), plazo (`confirmation.js`: `deadlineMs`, `isConfirmationOpen`, `confirmationFields`; el «ahora» y el plazo entran por parámetro), configuración del servicio (`service.js`: `resolveServiceConfig` con tres estados), el envío y consulta (`rsvp.js`: `phoneDigits`, `isPhoneComplete`, `rsvpPayload`, `lookupPayload`, `attendeeOptions`, `attendanceForm`, `validateRsvp`, `interpretRsvpResult`), regalos (`gifts.js`: `giftOptions`, `copyableFields`, `copyableField`, `GIFT_TYPES`), validación/avisos (`validation.js`: `templateStatus`, `registryErrors`, `registryWarnings`), cuenta regresiva (`countdown.js`: `remainingParts`), galería (`gallery.js`: `nextIndex`, `pickVariant`), tema (`theme.js`: `resolveTheme`), música (`music.js`: `nextMusicState`), etiquetas (`labels.js`) y máquina de estados del bloque de confirmación (`rsvpState.js`: `BLOCK_STATES`, `BLOCK_EVENTS`, `initialBlockState`, `nextBlockState`). Los literales del contrato del servicio (parámetro, tipos, hojas, columnas, estados, códigos de error) viven en `src/constants/contract.js` y los nombres de las variables de entorno en `src/constants/service.js`; las claves/valores del tema, en `src/constants/theme.js`.
- **Mesa de regalos (RF-10).** Los datos de cada opción salen del registro; **como máximo uno** va marcado con `copiar: true` y es el que copia el **único** botón de la opción (el resto se muestra como texto). Si una opción trae varios datos sin marca, no se pone botón: no se adivina cuál es la cuenta. `CopyButton` usa `buttonText` para el rótulo visible y el aviso nombra el dato copiado.
- **Pruebas co-locadas** (`src/utils/*.test.js`, `src/data/*.test.js`) con el runner `node --test`; se
  descubren solas. No hay tests de UI (van a mano).
- **Interfaz (`src/hooks/`, `src/components/`).** La lógica con estado (el «ahora», `localStorage`,
  `<audio>`, `IntersectionObserver`) vive en `src/hooks/` (un hook por comportamiento: `useTheme`,
  `useMusic`, `useInvitation`, `useGuestLookup`, `useRsvp`, `useCountdown`, `useConfirmation`, `useReveal`, `useHeader`,
  `useGallery`, `useTemplate`) y la presentación en `src/components/`: `layout/` (estructura:
  `Header`, `Footer`, `Cover`, `ControlsPanel`, `ErrorNotice`, `SkipLink`), `sections/` (contenido:
  `Hero`, `Countdown`, `Portrait`, `Quote`, `Story`, `Locations`, `Timeline`, `Gifts`, `Hotels`,
  `Restrictions`, `Rsvp`, `Gallery`) y `ui/` (piezas reutilizables: `CopyButton`, `AttendeeSelect`, `ResponseSummary`, `ThemeToggle`,
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
- **Base relativa del build.** `vite.config.js` fija `base: "./"`, así el sitio funciona en cualquier subruta (y los enlaces `…/index.html?guest=…` siguen valiendo). Consecuencia: importa los assets (`import x from "…"` o `import.meta.glob`) en vez de construir rutas a mano; `import.meta.env.BASE_URL` vale `"./"` y no hay que normalizarlo a `/`. Vite reescribe las rutas del HTML y del CSS y resuelve las de JS con `import.meta.url`.

## Guest personalization

- La invitación se resuelve con **`useInvitation`**: lee el parámetro **`guest`** de la URL, llama al servicio (`action: resolve`) y expone `{ status, invitation, errorCode }` con `status ∈ demo | loading | ready | error` (la lógica pura vive en `src/utils/invitation.js`; el modelo **ya viene resuelto** del servicio: tipo, cupo, límite, respuesta previa y plazo — la app no deduce nada, D20). Sin URL → `demo` sin llamar (invitación completa, sin personalizar); URL sin `slug` → `error` con `MISSING_SLUG` y **sin reintento**.
- `Rsvp` pinta cinco estados (demo / sin `slug`, carga, degradación con reintento según la causa, plazo cerrado y formulario) y envía con **`useRsvp`** (`{ status, errorCode, submit }`): en la genérica y la pública pide nombre y teléfono **también para rechazar** (el teléfono es la llave de la fila en el libro). `useConfirmation` recibe el **plazo del servicio** por parámetro y recalcula el cierre al pasar el plazo sin recargar. Los hooks no leen el registro por su cuenta: sus datos entran por parámetros (`App.jsx` y `Rsvp` se los pasan).

## Editing guidance

- Prefer minimal, targeted edits. El trabajo avanza **tarea a tarea** según
  `specs/004-servicio-invitados-rsvp`: no adelantes tareas ajenas ni reescribas lo que
  ya funciona.
- Keep the theme token system intact (central CSS variables). Don't inline colors that should come from tokens.
- When touching dates, links, or bank data, update the **único origen**:
  `src/data/wedding.js` (toda la interfaz lee de ahí). El código legado de la spec 001
  (`logica/datosEvento.js`, `logica/invitados.js`) **ya se borró**: no queda copia alguna.
- **Contratos que no se renombran** (vigilados por `test/contracts.test.js`): claves del registro (ya sin `confirmacion.fechaLimite` ni `marca.enlaces.rsvp`); ids de ancla; el parámetro **`guest`** y la **ausencia** de los jubilados (`codigo`/`code`/`inv`, `enlaces?.rsvp` y FormSubmit); los nombres de campo de `confirmacion.camposHabilitados`; clave `kg-tema` y valores `dia`/`noche`; y los recursos (`assets/**`).

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
- **Commits** en español y sin acentos; los de tarea empiezan `spec NNN Tx:` y los de
  documentación `docs(...)`; si aporta, cuerpo con viñetas.

## Límites

- ✅ Siempre: actualizar `MEMORY.md` al terminar cada tarea.
- ⚠️ Pregunta antes: crear archivos nuevos, cambiar el formato de los datos guardados.
- 🚫 Nunca: añadir dependencias fuera de las que fija la constitución (hoy: React, Vite y el
  plugin oficial de React). Nada de librerías de UI, CSS o animación.

## Verificación

- `npm run dev` y `npm run build` deben terminar sin errores.
- `npm test` (`node --test`, el runner integrado de Node): sin instalar nada. Cubre la lógica
  pura de `src/utils/*.test.js`, la no regresión del registro (`src/data/*.test.js`) y los
  guardarraíles `test/andamiaje.test.js`, `test/contracts.test.js` y
  `test/serviceContract.test.js`.
- Verificación manual en el navegador (no hay tests de UI): tema, música, cuenta regresiva,
  galería + visor, copiar datos y envío del RSVP.
- **Pruebas.** `src/utils/*.test.js` (incluidos `service.test.js` y `rsvp.test.js`) cubre la
  lógica pura; `src/data/wedding.test.js` es la **no regresión del registro** y
  `src/data/guest-cards.test.js` la **forma de los ejemplos ficticios** (no importan
  `services/photos.js`: usa `import.meta.glob`, que solo existe bajo Vite; las claves se validan
  con `registryErrors`). `test/andamiaje.test.js` vigila el shell, el CSS, el enlace de salto y
  que no vuelvan Bootstrap ni `?invitados=N`; `test/contracts.test.js` frena cualquier renombrado
  «de paso» de los contratos publicados y la vuelta atrás del modelo de la spec 004;
  `test/serviceContract.test.js` exige que `docs/servicio-invitados.md` no omita ningún literal
  del módulo `src/constants/contract.js` (sincronía documento ↔ módulo).
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
  portapapeles, audio tras «Ingresar», **envío real del RSVP** (contra el servicio de registro
  de la spec 004) y una vuelta en un **móvil físico**.
- **Spec 004 · verificación automática (hecha en T9/T10).** `npm test` → **158/158** y
  `npm run build` sin errores. La forma del intercambio se prueba contra el **módulo** del
  contrato, no contra el servicio vivo (RNF-10); la comprobación contra un despliegue real va en
  la lista siguiente.
- **Spec 004 · verificación manual contra un despliegue real (pendiente, la anota el
  coordinador).** Con el Apps Script desplegado (`gas/README.md`), en navegador (escritorio y
  móvil), comprobar y registrar aquí el veredicto de cada punto:
  1. un envío real de **cada tipo** (`personal`, `generic`, `public`) y su fila en `guests`
     (nombre y teléfono en la genérica y la pública; sin tocar identidad ni cupo en la
     personalizada);
  2. una segunda respuesta con el **mismo teléfono** que **actualiza** la fila y no la duplica;
  3. **boda inactiva**, **código desconocido**, **sin `slug`** y **sin configurar** (modo demo):
     cada una con su aviso y su comportamiento de reintento;
  4. **teléfono corto**, **cupo 0**, **plazo vencido** y **servicio caído** (URL rota) →
     degradación visible y confirmación deshabilitada;
  5. `viewed` escrito al abrir una personalizada sin respuesta y **no** sobrescrito si ya había
     respuesta.
  (Si algo falla, corregir el servicio o el código y repetir el punto; nada se da por hecho sin
  verlo contra el despliegue vivo.)
- **Spec 005 · verificación manual por estados del RSVP (pendiente).** Con el Apps Script
  redesplegado, recorrer sin fallos los puntos del plan §12 (1) cada tipo con envío real, (2)
  personalizada con respuesta previa (arranca en `respondido`, «Editar» la precarga), (3)
  genérica/pública: paso de teléfono, consulta **con** fila (datos en lectura, nombre editable) y
  **sin** fila (formulario limpio), (4) cambio de teléfono que no re-consulta y guarda con el nuevo,
  (5) combos con rango completo y opción 0, cupo 0 y campo libre con `n`, (6) plazo vencido,
  degradación (incluido `lookup` fallido, con reintento) y modo demo, doble clic sin efectos dobles,
  (7) privacidad y riesgo aceptado (recarga pide teléfono otra vez, nada en `localStorage` ni URL,
  sin datos ajenos, `lookup` no escribe en `guests`). Anotar veredicto en esta sección.

## Reglas

- Lee `docs/constitution.md` y la spec activa (`specs/NNN-*/`) antes de tocar código.
