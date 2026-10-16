# AGENTS.md

Invitación de boda de Karina & Gerardo. App **React + Vite** con build. La spec activa es
`specs/Jose-QB/002-modelo-datos-boda` (modelo de datos reutilizable, UI dirigida por el registro); la
migración previa (de la página estática a React) está en `specs/Jose-QB/001-migracion-y-rediseno`.

## Quick start

- `npm install` — instala React + Vite (no hay más dependencias).
- `npm run dev` — servidor de desarrollo de Vite.
- `npm run build` — genera el sitio estático en `dist/`; `npm run preview` lo sirve.

Estado: la app React compone **toda** la invitación y la interfaz va **dirigida por el registro
único** (fase 5 de la spec 002 hecha). `index.html` es el shell de Vite (`<div id="root">`), la app
monta desde `src/main.jsx` y `src/App.jsx` compone el catálogo de secciones que devuelve
`seccionesVisibles(boda)`; los antiguos `script.js` / `darkMode.js` **ya no existen**. La spec 002
tiene las fases 0–7 hechas (verificación automática incluida) salvo la **pasada manual (T33)**.

## Critical sync points

> El **único origen** de los datos de la boda es **`src/datos/boda.js`** (pareja, evento, secciones, enlaces, etc.). Las **fichas de invitación** viven en **`src/datos/invitaciones.js`** (separadas del registro de la boda). El código antiguo (`script.js`, `darkMode.js`) ya se borró.

- **Registro de la boda.** El **único origen** de los datos de la boda es `src/datos/boda.js` (pareja, evento, secciones, enlaces, etc.). Las **fichas de invitación** viven en `src/datos/invitaciones.js` (separadas del registro de la boda).
- **RSVP form endpoint.** FormSubmit.co; el primer envío pedirá confirmación por correo (externo, no local). El endpoint se define en el registro (`boda.js`) donde corresponda.

## Lógica pura (`src/logica/`)

- **Sin React, sin DOM y sin reloj interno.** Cada módulo exporta funciones puras; lo que
  depende del entorno (el «ahora», `localStorage`, `<audio>`, `URLSearchParams`) entra como parámetro o vive en
  el hook/componente. Español en identificadores, comentarios y textos de interfaz.
- **Secciones.** El catálogo incluye las secciones existentes más **cita** e **historia**. La confirmación **siempre está presente** (no se apaga). Las secciones opcionales se omiten si no están definidas o no tienen contenido. El **orden de presentación vive solo en `ORDEN_SECCIONES`** (`secciones.js`); la **galería cierra** la invitación (última, justo antes del `Pie`). Los **títulos de sección viven en el registro** (`ubicaciones.titulo`, `galeria.titulo`, `regalos.titulo`, `restricciones.titulo`, `itinerario.titulo`, `hoteles.titulo`); un objeto con solo `titulo` **no** hace visible la sección (por eso `esNoVacio` lo ignora).
- **Personalización por enlace.** La invitación se resuelve por **código de enlace** (no por `?invitados=N`). Hay tres tipos: personalizada, reutilizable y genérica. Los lugares reservados solo existen en la personalizada.
- **Inventario de lógica.** Funciones puras para nombres (`pareja.js`), fecha/zona (`evento.js`), secciones visibles (`secciones.js`), restricciones con jerarquía boda→ficha (`restricciones.js`), resolución de invitación (`invitacion.js`), confirmación/plazos (`confirmacion.js`), regalos con `opcionesDeRegalo`/`datosCopiables`/`datoCopiable` (`regalos.js`), validación/avisos (`validacion.js`), cuenta regresiva (`cuentaRegresiva.js`), galería (`galeria.js`), tema (`tema.js`), música (`musica.js`) y etiquetas (`etiquetas.js`).
- **Mesa de regalos (RF-10).** Los datos de cada opción salen del registro; **como máximo uno** va marcado con `copiar: true` y es el que copia el **único** botón de la opción (el resto se muestra como texto). Si una opción trae varios datos sin marca, no se pone botón: no se adivina cuál es la cuenta. `BotonCopiar` usa `textoBoton` para el rótulo visible y el aviso nombra el dato copiado.
- **Pruebas co-locadas** (`src/logica/*.test.js`) con el runner `node --test`; se descubren
  solas. No hay tests de UI (van a mano).
- **Interfaz (`src/hooks/`, `src/componentes/`).** La lógica con estado (el «ahora», `localStorage`,
  `<audio>`, `IntersectionObserver`) vive en `src/hooks/` (un hook por comportamiento) y la
  presentación en `src/componentes/` (JSX en español). `App.jsx` compone el catálogo que devuelve
  `seccionesVisibles(boda)` y reparte los datos; cada sección tiene su componente (`Portada`,
  `Hero`, `CuentaRegresiva`, `Retrato`, `Cita`, `Historia`, `Lugares`, `Itinerario`, `Galeria`,
  `MesaDeRegalos`, `Hoteles`, `Restricciones`, `Confirmacion`, `Pie`, `Encabezado`) y hay piezas
  reutilizables (`BotonCopiar`, `Visor`, `ControlTema`, `ControlMusica`, `AvisoDeError`). Los
  textos que son **datos de la boda** viven en el registro (`boda.js`); los rótulos de interfaz que
  no son datos viven con su componente.

## Theming & behavior quirks

- **Theme prevents flash.** The inline script at the top of `<head>` in `index.html` is the **single initial resolution** of the theme: it reads `localStorage["kg-tema"]` (`"dia"`/`"noche"`), falls back to the system preference, and applies `html.dark-mode` + `data-tema` before any stylesheet loads. It must stay **before** the first `<link rel="stylesheet">` (guarded by `test/andamiaje.test.js`). Don’t add theme classes to `<body>` or duplicate this logic: `useTema` (T12) **reuses** what the script already set (`data-tema` / `kg-tema`), persists the choice in `localStorage["kg-tema"]`, follows the system while there is no saved choice, and updates `theme-color` with an unscoped `<meta>` when the guest chooses.
- **No-JS fallback.** `<body>` carries a `<noscript>` notice in Spanish: without JavaScript the app cannot mount, so the guest is told to enable it. Keep it in Spanish (RNF-5); it is new interface copy, allowed by RF-2.
- **CSS-only theming.** Day tokens live in `styles.css` (`:root`), night tokens in `darkMode.css` (`html.dark-mode`). Only CSS variables change; images are not filtered for theme. Dark-mode icon/logo adjustments are defined in `darkMode.css`.
- **Reduced motion.** The motion override lives at the end of `styles.css` (`@media (prefers-reduced-motion: reduce)`). `useGaleria` (T21) also disables the carousel’s auto-advance under this preference (RNF-2), and `useReveal` relies on the CSS override to skip the section animation.
- **Accessibility (T25).** La app va dentro de `<main>` (con `<header>`/`<footer>`) y abre con el enlace «Saltar al contenido» (`a.saltar`, oculto hasta recibir foco). El foco visible sale de `:where(a, button, input, textarea, [tabindex]):focus-visible` con `--ember`. La portada cierra con Escape o clic fuera y devuelve el foco a `#inicio`; cada diapositiva del carrusel es un `<button>` y el visor es un `<dialog>` con `showModal()`. `test/andamiaje.test.js` exige el enlace de salto dentro de `<main>`.
- **Rendimiento (T26).** La página solo carga derivados de `assets/photos/opt/` (nunca los originales); el visor usa `elegirVariante(srcset, 1400)`; el `<audio>` lleva `preload="none"` con `<source>` (no se descarga hasta el gesto); `fetchPriority` alto en la portada y bajo en el hero. `calcularRestante` devuelve «terminado» si la fecha es `NaN` en vez de propagarlo.
- **Bootstrap retired (T5).** No Bootstrap CSS/JS is loaded: `styles.css` + `darkMode.css` (plus Google Fonts) are the only stylesheets. Carousel hooks are now project-owned — `.galeria-carrusel .diapositiva img` for slides, `.diapositiva.activa` is the visible one (T21 mechanics), and `.carrusel-flecha` (with `.carrusel-flecha-siguiente` for the reversed arrow) + `.carrusel-flecha-icono` for the controls; the chevron is an inline SVG data-URI, and `.galeria-carrusel` is `position: relative` so `.galeria-contador` anchors to it. `.visually-hidden` is defined locally (RNF-1). `test/andamiaje.test.js` fails if `bootstrap`/`carousel`/`data-bs` reappear in the CSS or the shell.
- **Music requires gesture.** Autoplay is blocked; music starts only after clicking “INGRESAR” (which also closes the welcome modal and unlocks background) or the floating music button. `useMusica` (T23) calls `audio.play()` **inside** the gesture (Safari-friendly); the audio file `assets/audio.mp3` is imported by `App.jsx` so it enters the build.

## Images & assets

- **Photo inventory (`src/componentes/fotos.js`).** Las fotos se resuelven **por clave** con `resolverFoto(clave, alt?, sizes?)`, que devuelve `{ src, srcSet, sizes, alt }` (listo para esparcir en un `<img>`) desde `import.meta.glob("../../assets/photos/opt/*.{jpg,jpeg,png}", { query: "?url", import: "default" })`. Al arrancar **falla** si falta una clave esperada (las estructurales + las del registro). No escribas rutas de assets a mano: Vite solo copia a `dist/` lo que importa (las fotos/iconos/audio referenciados solo desde el código **no** se copiaban). Así el build las emite con huella y con URL válida en cualquier subruta. La portada y la galería resuelven sus fotos **desde el registro** con `fotosDePortada(portada)` (fondo + tarjeta) y `fotosDeGaleria(galeria)` (destacadas + rejilla); solo quedan como constantes estructurales `FOTO_HERO`, `FOTO_RETRATO` y `FOTO_CONFIRMACION` (fase 5 de la spec 002).
- **Use optimized images.** The page loads from `assets/photos/opt/` (with `srcset`/`sizes`), not the large originals in `assets/photos/`. If you replace an original, regenerate its optimized variants with the same base names and widths (e.g. `foto5-900.jpg`, `foto5-1800.jpg`); `fotos.js` las descubre por el patrón `…\d+.<ext>` y falla al arrancar si falta una base esperada.
- **Filename casing matters.** On case-sensitive systems (Linux/GitHub Pages) names must match exactly. Since `fotos.js` deriva los nombres del glob, un cambio de nombre se refleja solo; pero los literales que sí quedan escritos a mano (`backgrond3` como fondo de portada) tienen que coincidir. Nota: en `opt/` todas son `.jpg` (p. ej. `foto9-900.jpg`), aunque el original de `assets/photos/` sea de otra extensión.
- **Custom fonts.** `Erstoria` y `Kalista` se cargan desde `fonts/` con `font-display: swap` (nombres y títulos: `--fuente-titulo`/`--fuente-script`, y `--fuente-nombres` elige cuál). El **texto** usa `Source Serif 4` (`--fuente-texto`) y las **etiquetas** `Montserrat` (`--fuente-etiqueta`), desde Google Fonts. El rediseño «Ascua» (T24) solo cambia **tokens** de color (`--paper`/`--ink`/`--ember`/`--vino`/`--banda-*`): nunca colores literales.
- **Base relativa del build (tarea T3).** `vite.config.js` fija `base: "./"`, así el sitio funciona en cualquier subruta (y los enlaces `…/index.html?codigo=…` siguen valiendo). Consecuencia: importa los assets (`import x from "…"` o `import.meta.glob`) en vez de construir rutas a mano; `import.meta.env.BASE_URL` vale `"./"` y no hay que normalizarlo a `/`. Vite reescribe las rutas del HTML y del CSS y resuelve las de JS con `import.meta.url`.

## Guest personalization

- La personalización se resuelve con **`useInvitacion`** (T17): lee el **código del enlace** y devuelve `tipo`, `limite`, `invitado`, `ficha`, `lugaresReservados`, `limiteAsistentes` y `lugaresTexto` (la lógica vive en `logica/invitacion.js`). `Confirmacion` (T27) usa esos datos: prellena y bloquea el nombre en la personalizada, muestra el acompañante de la ficha y acota el número de asistentes al límite.
- `useConfirmacion` (T18) expone `{ abierta }` y la recalcula **al pasar la fecha límite sin recargar**. Los hooks no leen el registro por su cuenta: sus datos entran por parámetros (en la fase 5, `App.jsx` y `Confirmacion` se los pasan).

## Editing guidance

- Prefer minimal, targeted edits. El trabajo avanza **tarea a tarea** según
  `specs/Jose-QB/002-modelo-datos-boda`: no adelantes tareas ajenas ni reescribas lo que
  ya funciona.
- Keep the theme token system intact (central CSS variables). Don't inline colors that should come from tokens.
- When touching dates, links, or bank data, update the **único origen**:
  `src/datos/boda.js` (toda la interfaz lee de ahí). El código legado de la spec 001
  (`logica/datosEvento.js`, `logica/invitados.js`) **ya se borró** (T29): no queda copia alguna.

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
  pura de `src/logica/*.test.js` y la prueba de andamiaje `test/andamiaje.test.js`.
- Verificación manual en el navegador (no hay tests de UI): tema, música, cuenta regresiva,
  galería + visor, copiar datos y envío del RSVP.
- **Pruebas.** `src/logica/*.test.js` cubre la lógica pura; `src/datos/boda.test.js` y
  `src/datos/invitaciones.test.js` (T30) son la **no regresión del registro** y la **forma de las
  fichas** (no importan `componentes/fotos.js`: usa `import.meta.glob`, que solo existe bajo Vite;
  las claves se validan con `erroresDelRegistro`). `test/andamiaje.test.js` vigila el shell, el CSS
  y que no vuelva `?invitados=N` (RF-16).
- **Verificación automática (T32).** Chrome headless sobre `dist/` **servido por un servidor propio**
  y medido por DevTools Protocol (WebSocket global de Node ≥ 22), no con `--dump-dom`. Comprueba a
  320/375/768/1024/1440 px, en día y noche, que `scrollWidth` no supera `innerWidth` + 1, que las
  imágenes del DOM cargan y llevan `alt`, y qué secciones salen según el registro (`restricciones`
  no aparece en el ejemplo). Los casos límite se ejercen con **parches temporales** de `boda.js` +
  rebuild y revertir: plazo pasado → `.confirmacion-cerrada` sin formulario; `nombre2` vacío →
  `.aviso-registro` con el error; `historiaVisible: false` → sin `#historia`; `plantilla: "moderna"`
  → aviso. El script vive **fuera** del repo (no se versiona).
- **Pasada manual (T33, pendiente).** Reutilizar con otro registro, copiar datos con el
  portapapeles, audio tras «Ingresar», **envío real del RSVP** (FormSubmit pide confirmar el correo
  la primera vez) y una vuelta en un **móvil físico**.

## Reglas

- Lee `docs/constitution.md` y la spec activa (`specs/Jose-QB/NNN-*/`) antes de tocar código. 

