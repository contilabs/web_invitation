# Tareas — Spec 001: Migración a React y rediseño

Ordenadas por dependencia. Cada tarea es pequeña (≤ 20–30 min) e indica los RF que cubre.
Las tareas de `src/logica/` incluyen sus pruebas (`node --test`).

## Fase 0 — Andamiaje

- [x] **T1 · Andamiaje React + Vite.** _RF: soporte._
  Hecho cuando: `npm run dev` sirve una app React mínima y `npm run build` termina sin errores.
  _Hecho: `package.json` + `vite.config.js` + `src/main.jsx`/`src/App.jsx`, con `index.html`
  como shell de Vite. React 19.3, Vite 8.3 y `@vitejs/plugin-react` 6.1._
- [x] **T2 · `package.json` con scripts y `"type": "module"`.** _RF: soporte._
  Hecho cuando: existen `dev`, `build`, `preview` y `test`, y `npm test` (`node --test`) corre sin instalar nada.
  _Hecho: 4 scripts + `"type": "module"` (quita el aviso ESM/CJS de Vite 8). Se añadió la
  prueba de andamiaje `test/andamiaje.test.js` (excepción acordada a «solo funciones puras»
  del plan §4): vigila ESM, scripts y el shell de `index.html`. `npm test` → 4/4._
- [x] **T3 · `vite.config.js` con `base` de publicación.** _RF: RNF-6._
  Hecho cuando: `npm run build` genera rutas con el `base` correcto y `npm run preview` abre la app.
  _Hecho: `base: "./"` (relativo). No hay URL de publicación confirmada — ni CNAME, ni workflows,
  ni Pages activo — así que se optó por rutas relativas para valer en cualquier subruta/dominio.
  Verificado en `dist/index.html` (`./assets/…`), con `vite preview` (200 en `/` y en
  `/index.html?invitados=3`) y sirviendo el build en una subruta anidada `/web_invitation/`._
- [x] **T4 · Shell de `index.html` (root + metas + fuentes + anti-parpadeo).** _RF: RF-4, RNF-5._
  Hecho cuando: la app monta y, con tema oscuro guardado, recargar no muestra parpadeo del tema claro.
  _Hecho: cabecera ya traída en T1; en T4 se añadió `meta[name=color-scheme]`, se subió el
  script de tema al inicio del `<head>` (antes de cualquier estilo) y se añadió `<noscript>` en
  español. El test de andamiaje comprueba el orden (script antes del primer `rel="stylesheet"`) y
  que lea `kg-tema`. Verificado además en `dist/` (script antes del CSS inyectado) y en preview/dev.
  La comprobación visual del anti-parpadeo queda a cargo del usuario._

- [x] **T5 · Migrar CSS y retirar Bootstrap.** _RF: RF-11, RNF-1._
  Hecho cuando: `styles.css`/`darkMode.css` aplican sus tokens y no queda ninguna referencia a Bootstrap.
  _Hecho: los selectores de Bootstrap del carrusel pasan a clases propias (`.diapositiva`,
  `.carrusel-flecha(-siguiente)`, `.carrusel-flecha-icono`) con flecha SVG propia; se añadió
  `position: relative` al carrusel y la utilidad `.visually-hidden` (la aportaba Bootstrap). Sin
  cambio visual (RF-11). Guardarraíl en `test/andamiaje.test.js`: nada de `bootstrap`/`carousel`/
  `data-bs` en los CSS, el shell ni las dependencias. `npm test` → 7/7; build/preview/dev verificados.
  `script.js`/`darkMode.js` aún citan la API de Bootstrap hasta su borrado (ver `PENDING_TASKS.md`)._

## Fase 1 — Datos y lógica pura (con tests)

- [x] **T6 · `logica/datosEvento.js` (único origen).** _RF: RF-2, RF-3, RF-10, RNF-8._
  Hecho cuando: fecha, cuenta/titular y enlaces se leen solo de este módulo, sin duplicados.
  _Hecho: `NOMBRES`, `FECHA_ISO` (hora local, como el original) + `FECHA_MS` + `FECHA_TEXTO`,
  `LUGAR`, `CEREMONIA`/`RECEPCION`, `HOTELES`, `MESA_DE_REGALOS`, `CUENTA_BANCARIA` y `ENLACES`
  (crédito y endpoint del RSVP). Prueba de contrato en `datosEvento.test.js`. `script.js` aún
  conserva una copia (legado; ver `PENDING_TASKS.md`)._
- [x] **T7 · `logica/cuentaRegresiva.js` + tests.** _RF: RF-3._
  Hecho cuando: `node --test` pasa futuro, fecha ya pasada (`terminado`) y segundo exacto.
  _Hecho: `calcularRestante(objetivoMs, ahoraMs)`; recorta (no redondea) y marca `terminado` en
  cuanto la diferencia es ≤ 0, con todo a cero._
- [x] **T8 · `logica/invitados.js` + tests.** _RF: RF-9._
  Hecho cuando: `node --test` pasa `""`, `"1"`, `"2"`, `"0"`, `"-1"`, `"abc"`, `"2.5"`, `" 3"`, `"999999"`.
  _Hecho: `leerInvitados` usa `Number` + `Number.isInteger` (no `parseInt`), así que `"2.5"` es
  inválido como pide RF-9 —divergencia a propósito respecto a la web antigua—; `formatearLugares`
  da «un lugar» / «1 lugar» / «N lugares»._
- [x] **T9 · `logica/tema.js` + tests.** _RF: RF-4._
  Hecho cuando: `node --test` pasa guardado válido, guardado inválido y sistema claro/oscuro.
  _Hecho: `resolverTema(guardado, prefiereOscuro)` y `CLAVE_TEMA` (`"kg-tema"`). La persistencia
  en `localStorage` queda para el hook `useTema` (T12)._
- [x] **T10 · `logica/musica.js` + `logica/etiquetas.js` + tests.** _RF: RF-5, RF-4._
  Hecho cuando: `node --test` pasa la alternancia y las etiquetas en español.
  _Hecho: `siguienteEstadoMusica(sonando)`, `etiquetaMusica(sonando)`, `etiquetaTema(tema)` y
  `ETIQUETA_TEMA_ARIA`, con los textos que ya usaba la web anterior._
- [x] **T11 · `logica/galeria.js` + tests.** _RF: RF-7._
  Hecho cuando: `node --test` pasa salto circular, total 0/1 y elección de variante (intermedia, nunca el original).
  _Hecho: `siguienteIndice(actual, total, paso)` (circular; total 0/1 no rompe) y
  `elegirVariante(srcset, anchoObjetivo)`, que elige la variante optimizada más cercana al
  objetivo y descarta las entradas sin ancho (`w`) —las que apuntarían al original—._
  
  _Fase 1 verificada: `npm test` → 44/44; `npm run build` → `✓ built`; `npm run dev` responde 200._

## Fase 2 — Interfaz por función

- [x] **T12 · `useTema` + `ControlTema`.** _RF: RF-4._
  Hecho cuando: el botón cambia de tema, persiste tras recargar y `aria-pressed` refleja el estado.
  _Hecho: `useTema` reutiliza el tema que ya fijó el script del `<head>` (`data-tema`), persiste en
  `localStorage["kg-tema"]` y sigue al sistema mientras no haya elección. Actualiza `theme-color`
  con una meta sin `media` cuando el invitado elige. `ControlTema` reproduce el interruptor (sol/luna)._
- [x] **T13 · `useCuentaRegresiva` + `CuentaRegresiva`.** _RF: RF-3._
  Hecho cuando: muestra d/h/min/seg y, pasada la fecha, el mensaje post-evento.
  _Hecho: `useCuentaRegresiva(FECHA_MS)` late cada segundo y se detiene al terminar; las cajas y el
  mensaje post-evento los decide `calcularRestante`._
- [x] **T14 · `Portada` (bloqueo de fondo y foco).** _RF: RF-1._
  Hecho cuando: al abrir, el fondo queda inerte; «Ingresar» cierra la portada y deja el foco correcto.
  _Hecho: `inert` en `.contenido` y `.fixed-panel` mientras está abierta; al cerrar, foco al `#inicio`
  (hero) y `body.portada-cerrada`. Se creó `componentes/fotos.js`, que resuelve las 20 imágenes de
  `assets/photos/opt/` con `import.meta.glob(..., ?url)` (único origen; corrige el 404 de `dist/`)._
- [x] **T15 · `useEncabezado` + `Encabezado`.** _RF: RF-6._
  Hecho cuando: el encabezado aparece al dejar de verse el título de apertura.
  _Hecho: observa `#inicio` y añade `.inicio--fijo`; el hero (portada principal) vive en `Secciones.jsx`._
- [x] **T16 · `useReveal` y aparición de secciones.** _RF: RF-6._
  Hecho cuando: las secciones aparecen al hacer scroll y, con movimiento reducido, no hay animación.
  _Hecho: observa los `.reveal` y añade `.visible`; con movimiento reducido el CSS ya las muestra._
- [x] **T17 · Secciones informativas con enlaces.** _RF: RF-2._
  Hecho cuando: ceremonia, recepción, ubicaciones y hoteles se ven y sus enlaces abren el destino.
  _Hecho: `Frase`, `Retrato`, `Lugares` (ceremonia/recepción con «Cómo llegar»), `Itinerario`,
  `Hoteles` y `Pie` en `Secciones.jsx`; los datos salen de `datosEvento.js` y los iconos del build._
- [x] **T18 · `MesaDeRegalos` + `BotonCopiar`.** _RF: RF-10._
  Hecho cuando: se ve banco/titular/cuenta; copiar muestra notificación y, si falla, muestra la cuenta.
  _Hecho: copia con `navigator.clipboard` y respaldo con `execCommand`; el aviso (`#notificacion`,
  `role="status"`) aparece y se desvanece como antes._
- [x] **T19 · `Confirmacion` (RSVP).** _RF: RF-8._
  Hecho cuando: con requeridos vacíos no envía; completos, envía al canal actual.
  _Hecho: formulario nativo `POST` a `ENLACES.rsvp` (FormSubmit), sin `fetch`/`preventDefault`, con
  los `required` del navegador._
- [x] **T20 · `useInvitados` y texto de lugares.** _RF: RF-9._
  Hecho cuando: `?invitados=3`→«3 lugares», `?invitados=1`→«1 lugar», valor inválido→«un lugar».
  _Hecho: `useInvitados` lee `?invitados` una vez y `formatearLugares` decide el texto; verificado con
  el DOM renderizado (`?invitados=3` → «3 lugares»)._
- [x] **T21 · `Galeria` (carrusel).** _RF: RF-7._
  Hecho cuando: muestra las 7 fotos destacadas y el contador «actual / total» avanza bien.
  _Hecho: `useGaleria` (avance cada 5 s, pausa del visor, sin avance con movimiento reducido) y
  mecánica mínima en CSS (`display` de `.diapositiva.activa` + posición de `.carrusel-flecha`, que
  aportaba Bootstrap). El fundido queda para T24._
- [x] **T22 · `Visor` a pantalla completa.** _RF: RF-7._
  Hecho cuando: abre, navega con flechas/botones, cierra y pausa/reanuda el carrusel (salvo movimiento reducido).
  _Hecho: `<dialog>` con `showModal()` (foco atrapado y Escape nativo), flechas del teclado, cierre al
  pulsar el fondo y contador «Foto N de M»; recorre las 13 fotos y usa `elegirVariante(srcset, 1400)`._
- [x] **T23 · `useMusica` + `ControlMusica`.** _RF: RF-5._
  Hecho cuando: «Ingresar» inicia la música; el botón alterna y el icono/aria reflejan el estado.
  _Hecho: `play()` se llama dentro del gesto (INGRESAR o botón) para Safari; el icono y `aria-label`
  siguen el estado. Se borraron `script.js` y `darkMode.js`: `datosEvento.js` es ya el único origen._

_Fase 2 verificada: `npm test` → 44/44; `npm run build` → `✓ built`; DOM renderizado en Chrome
headless (dev y `preview`) con las 20 imágenes, los iconos y el audio resolviendo 200._

## Fase 3 — Acabado y verificación

- [x] **T24 · Rediseño visual (evolución del actual).** _RF: RF-11._
  Hecho cuando: paleta, tipografías y acentos se conservan en claro y oscuro, con disposición revisada.
  _Hecho: paleta «Ascua» centralizada en tokens (`--paper/--ink/--ember/--vino/--banda-*`) en `styles.css`
  (día) y `darkMode.css` (noche); texto en `Source Serif 4` y etiquetas en `Montserrat`, conservando
  `Erstoria`/`Kalista` para los nombres vía `--fuente-nombres`/`--fuente-script`; `theme-color`
  (`#f0ebe0`/`#14100d`). Disposición editorial con secciones numeradas, fundido cruzado del carrusel y
  filetes/rombo de brasa._
- [x] **T25 · Accesibilidad y movimiento reducido.** _RF: RNF-1, RNF-2._
  Hecho cuando: portada, visor y controles se operan por teclado y no hay animaciones con movimiento reducido.
  _Hecho: `<main>` + `<header>` y enlace «Saltar al contenido» (`a.saltar`), `:focus-visible` con token,
  portada que cierra con Escape/clic fuera y devuelve el foco a `#inicio`, diapositivas del carrusel como
  `<button>`, flechas del carrusel y del visor con `aria-label`, `<dialog>` con `showModal()`.
  Movimiento reducido al final de `styles.css` (`transition-duration: 0.001ms`) y `useGaleria` sin avance
  automático. `test/andamiaje.test.js` vigila el enlace de salto dentro de `<main>`._
- [x] **T26 · Rendimiento de imágenes.** _RF: RNF-3._
  Hecho cuando: la primera carga no descarga originales y el visor usa una variante intermedia.
  _Hecho: la página solo carga derivados de `assets/photos/opt/` (`srcset`+`sizes`, 1180 px), el visor usa
  `elegirVariante(srcset, 1400)`, `<audio preload="none">` con `<source>` (no se descarga hasta el gesto) y
  `fetchPriority` alto en la portada y bajo en el hero. `calcularRestante` (T26) devuelve «terminado» si la
  fecha es `NaN` en lugar de esparcirlo. `test/andamiaje.test.js` falla si una foto se carga del original._
- [x] **T27 · Documentación (`README.md` y «Verificación» de `AGENTS.md`).** _RF: soporte._
  Hecho cuando: el README explica `npm install/dev/build/test` y «Verificación» lista el comando y lo manual.
  _Hecho: `README.md` reescrito para la app React + Vite (arranque, estructura, dónde editar los datos,
  `?invitados=N`, música, tema, fotos, despliegue); «Verificación» de `AGENTS.md` lista `npm test` y la
  pasada manual._
- [ ] **T28 · Verificación final manual (criterios de finalización).** _RF: RF-1…RF-11._
  Hecho cuando: el checklist de las 11 RF está probado en escritorio y móvil y anotado.
  _Verificado (automático, Chrome headless sobre `dist/`): `npm test` → 47/47; `npm run build` → OK;
  sin desbordamiento horizontal en 320/375/768/1180/1440 px en día y noche; un solo `<h1>` con la portada
  cerrada; contraste ≥ 4.5 en todos los textos (mínimo 4.58 en `#numero`/`.hotel-enlace` en día); regla
  `:focus-visible` con `outline`; movimiento reducido sin transiciones ni avance del carrusel; 28 imágenes
  resueltas (16 con `srcset`); tema que alterna y se reaplica al recargar; formulario `POST` a FormSubmit
  con campos `required`; `?invitados=4` → «4 lugares» y `?invitados=abc` → «un lugar»; consola y red sin
  errores propios._
  _Falta la pasada manual (no automatizable): reproducción real del audio tras «Ingresar», envío real del
  RSVP, y una vuelta en un móvil físico (táctil/Safari)._
