# Tareas — Spec 003: Reorganización modular para soportar plantillas

Ordenadas por dependencia. Cada tarea es pequeña (≤ 20–30 min), indica los RF que cubre y tiene una
línea **Hecho cuando:** verificable. Los **RF/RNF** citados son los de la **spec 003**
(`spec.md`), no los de la 002.

**Regla de cierre de cada tarea:** `npm test` en verde y `npm run build` sin errores. Ninguna prueba se
relaja: si vigila un nombre que cambia, se actualiza **comprobando lo mismo**. Nada se publica a medias.

**Prerequisito:** T1 (referencia congelada). Todo el plan respeta la constitución **enmendada** en T2.

**Orden de documentos:** la constitución se enmienda primero (T2); `README.md` y `AGENTS.md` se
actualizan **al final** (T28), porque describen rutas y hacerlo antes dejaría la documentación en
contradicción con el código (principio 2, «spec = código»).

## Fase 0 — Preparación

- [x] **T1 · Congelar la referencia de paridad.** _RF: RNF-1._
  Hecho cuando: existe un commit con el estado actual y una copia del `dist/` construido desde él
  (con su fecha), guardada fuera del árbol de trabajo; sin esa copia la paridad no es comprobable.
- [x] **T2 · Enmendar `docs/constitution.md`.** _RF: RF-3, RNF-6 (soporte de RF-1 y RF-2)._
  Hecho cuando: los principios 2 y 3 describen **responsabilidades y capas** en vez de rutas literales,
  el 6 exige nomenclatura de **código en inglés** conservando español en textos, datos, comentarios y
  documentación, y el 4 aclara qué es verificación automática y cómo se anota la manual; ninguna frase
  de la constitución contradice ya la spec 003.

## Fase 1 — Constantes y lógica pura

- [x] **T3 · Crear `constants/` y hacer que la lógica lea de ahí.** _RF: RF-1, RF-2, RF-4, RF-5._
  Hecho cuando: `constants/sections.js` es la **única** fuente del orden de secciones,
  `constants/theme.js` expone `THEME_STORAGE_KEY` con el valor `"kg-tema"` y `constants/templates.js`
  expone `IMPLEMENTED_TEMPLATE_IDS = ["clasica"]`; `secciones.js`, `tema.js` y `validacion.js` los usan y
  `npm test` pasa con los mismos valores y el mismo aviso de plantilla.
- [x] **T4 · Mover a `utils/` los módulos de nombres y fechas.** _RF: RF-1, RF-4, RNF-6._
  Hecho cuando: existen `utils/couple.js`, `utils/event.js` y `utils/labels.js` con sus exportaciones
  renombradas en inglés, sus pruebas corren desde `utils/` y `npm test` pasa con los **mismos casos**
  (nombres compuestos, zonas horarias, formatos y rótulos de interfaz).
- [x] **T5 · Mover a `utils/` las secciones, restricciones e invitaciones.** _RF: RF-1, RF-4._
  Hecho cuando: existen `utils/sections.js`, `utils/restrictions.js` y `utils/invitation.js`, sus pruebas
  pasan desde `utils/` con los mismos casos (incluido el **orden** de secciones y los tres tipos de
  invitación) y ningún archivo de `src/` importa ya desde `logica/`.
- [x] **T6 · Mover a `utils/` confirmación, regalos y validación.** _RF: RF-1, RF-4, RF-2 (aviso)._
  Hecho cuando: existen `utils/confirmation.js`, `utils/gifts.js` y `utils/validation.js`, el aviso por
  plantilla no implementada conserva **el mismo texto** y `npm test` pasa con los mismos casos.
- [x] **T7 · Mover a `utils/` cuenta regresiva, galería, tema y música.** _RF: RF-1, RF-5._
  Hecho cuando: existen `utils/countdown.js`, `utils/gallery.js`, `utils/theme.js` y `utils/music.js`,
  `src/logica/` ha desaparecido por completo y `npm test` pasa (mismo número de pruebas que al empezar).

## Fase 2 — Datos

- [x] **T8 · Mover `src/datos/` a `src/data/`.** _RF: RF-1, RNF-4._
  Hecho cuando: `data/wedding.js` y `data/guest-cards.js` contienen **exactamente** el mismo registro y
  las mismas fichas (mismas claves y mismos valores, incluido `plantilla: "clasica"`), sus pruebas pasan
  desde `data/` y ninguna referencia a `datos/` queda en `src/`.

## Fase 3 — Capa de plantilla

- [x] **T9 · Mover los dos CSS a `templates/classic/`.** _RF: RF-2, RNF-5._
  Hecho cuando: `src/templates/classic/classic.css` y `classic-dark.css` son idénticos a los actuales,
  `index.html` los enlaza con el script del tema **antes** del primer `<link rel="stylesheet">` y pasan
  `npm run build` y la prueba de andamiaje (con las rutas nuevas).
- [x] **T10 · Extraer iconos y tamaños de imagen a la plantilla.** _RF: RF-2, RF-4._
  Hecho cuando: `templates/classic/icons.js` y `photoSizes.js` contienen el mapa de iconos y los `sizes`
  de hoy, los componentes los leen de la plantilla y lugares, itinerario, hoteles, portada, galería y
  confirmación se ven **igual** que antes.
- [x] **T11 · Registro de plantillas, proveedor y `useTemplate`.** _RF: RF-2, RNF-3._
  Hecho cuando: `templates/index.js` resuelve `"clasica"` y cae en la plantilla por defecto con cualquier
  otro valor; `App` la publica con `TemplateProvider`, `useTemplate` es la única vía de acceso y **no**
  existe ningún control, parámetro de enlace ni ajuste nuevo para elegir plantilla.
- [x] **T12 · `services/photos.js` sin decisiones de presentación.** _RF: RF-2, RNF-5._
  Hecho cuando: el servicio recibe de la plantilla los `sizes` y las claves estructurales, sigue
  **fallando al arrancar** si falta una clave esperada (registro + estructurales) y ninguna imagen se
  carga desde el original sin optimizar.

## Fase 4 — Hooks

- [x] **T13 · Mover los hooks a `hooks/` con nombres en inglés.** _RF: RF-1, RF-3, RF-5._
  Hecho cuando: existen `useTheme`, `useMusic`, `useInvitation`, `useCountdown`, `useConfirmation`,
  `useReveal`, `useHeader` y `useGallery` (más `useTemplate`), **toda la nomenclatura interna de
  `hooks/` y `utils/` (variables, parámetros y constantes locales) está en inglés** (RF-3/RNF-6; se
  conservan en español los comentarios, los textos y las claves de datos), y tema, música, cuenta
  regresiva y galería se comportan igual (comprobado a mano).

## Fase 5 — Componentes (aún sin tocar nombres de clase)

- [x] **T14 · Mover las piezas reutilizables a `components/ui/`.** _RF: RF-1, RF-5._
  Hecho cuando: existen `CopyButton`, `ThemeToggle`, `MusicToggle` y `GalleryViewer`, y copiar el dato
  de la mesa de regalos, cambiar de tema, pausar la música y abrir el visor con teclado funcionan igual.
- [x] **T15 · Mover las piezas de estructura a `components/layout/`.** _RF: RF-1, RF-5._
  Hecho cuando: existen `Header`, `Footer`, `Cover`, `ErrorNotice`, `SkipLink` y `ControlsPanel`; el
  enlace de salto sigue apuntando a `#inicio`, `href="#inicio"` no cambia y el panel sigue inerte
  mientras la portada está abierta.
- [x] **T16 · Partir `Secciones.jsx` en `components/sections/`.** _RF: RF-1, RF-4._
  Hecho cuando: existen `Hero`, `Portrait`, `Locations`, `Timeline`, `Hotels` y `Restrictions` (y
  `Footer` en layout) y el marcado generado es **idéntico** al de antes: mismos nodos, mismos atributos,
  mismas `alt` y mismo orden.
- [x] **T17 · Mover las secciones restantes.** _RF: RF-1, RF-4, RF-5._
  Hecho cuando: existen `Quote`, `Story`, `Countdown`, `Gallery`, `Gifts` y `Rsvp`; el conjunto y el
  orden de secciones no cambian y la confirmación muestra el mismo formulario, los mismos campos y los
  mismos límites por tipo de invitación.

## Fase 6 — Nomenclatura de clases CSS en inglés (el paso de más riesgo)

- [x] **T18 · Renombrar clases de estructura y controles.** _RF: RF-3, RNF-6, RNF-1._
  Hecho cuando: portada, encabezado, pie, panel, controles, enlace de salto y aviso usan clases en inglés
  (JSX y CSS a la vez), la prueba de andamiaje apunta al nombre nuevo del enlace de salto, ninguna clase
  usa `carousel`/`bootstrap`/`data-bs`/`--bs-` y la comparación de paridad de esos bloques no muestra
  diferencias.
- [x] **T19 · Renombrar clases de las secciones de contenido.** _RF: RF-3, RNF-6, RNF-1._
  Hecho cuando: hero, cita, historia, cuenta regresiva, lugares, itinerario, hoteles y mesa de regalos
  usan clases en inglés, los **ids de ancla** (`#inicio`, `#fecha`, `#cita`, `#historia`, `#lugares`,
  `#itinerario`, `#regalos`, `#hospedaje`, `#restricciones`) siguen **sin cambiar** y la paridad de esas
  secciones no muestra diferencias.
- [x] **T20 · Renombrar clases de la galería y el visor, sin «carousel».** _RF: RF-3, RNF-5, RNF-1._
  Hecho cuando: `slide`/`slide-active`, `gallery-strip`, `gallery-arrow` y `gallery-counter` sustituyen a
  las clases españolas en JSX y CSS, `useReveal` y `useGallery` apuntan a las nuevas, y el carrusel, el
  contador y el visor funcionan igual (avance, pausa, cierre y teclado).
- [ ] **T21 · Renombrar clases de la confirmación y del aviso del registro.** _RF: RF-3, RNF-6, RNF-1._
  Hecho cuando: el formulario, los avisos y los datos copiables usan clases en inglés, los `name` de los
  campos enviados (`asistencia`, `nombre`, `acompanante`, `asistentes`, `alergias`, `mensaje`, `_subject`)
  **no** cambian y la paridad de la confirmación (abierta y cerrada) no muestra diferencias.

## Fase 7 — App y shell

- [ ] **T22 · Mover la entrada y la composición a `app/`.** _RF: RF-1, RF-4._
  Hecho cuando: existen `app/main.jsx`, `app/App.jsx` y `app/sectionRenderers.jsx`; `index.html` apunta a
  `/src/app/main.jsx`, la prueba de andamiaje apunta a `app/App.jsx`, el orden de eventos al entrar
  (cerrar portada → devolver el foco a `#inicio` → arrancar la música) se conserva y el build pasa.

## Fase 8 — Pruebas y cierre

- [ ] **T23 · Crear `test/contracts.test.js`.** _RF: RF-3, RF-5._
  Hecho cuando: la prueba falla si alguien cambia la clave `kg-tema`, un id de ancla, los parámetros
  aceptados `codigo`/`code`/`inv`, los `name` de los campos del formulario o cualquier clave del registro
  o de las fichas.
- [ ] **T24 · Repasar `test/andamiaje.test.js` completo.** _RF: RF-3, RNF-2._
  Hecho cuando: apunta a las rutas nuevas y **ninguna** de sus comprobaciones se ha relajado (script del
  tema antes del primer estilo, `kg-tema`, `dark-mode`, `<noscript>` en español, sin `?invitados=N`, sin
  originales de fotos y sin Bootstrap).
- [ ] **T25 · Limpieza y verificación básica.** _RF: RF-1, RF-3, RNF-2._
  Hecho cuando: no quedan huérfanos (`src/logica/`, `src/datos/`, `src/componentes/`, `styles.css` y
  `darkMode.css` en la raíz no existen), **toda la nomenclatura de `src/` y de `test/` está en inglés**
  (salvo claves de datos y contratos, textos visibles, títulos de prueba y comentarios, que siguen en
  español), `npm test` pasa con las mismas pruebas lógicas que al empezar (solo renombradas) y
  `npm run build` termina sin errores.
- [ ] **T26 · Paridad automática contra la referencia congelada.** _RF: RNF-1, RNF-2._
  Hecho cuando: la matriz (tres tipos de invitación × día/noche × 320/375/768/1024/1440 px, registro
  inválido, sección omitida, aviso de plantilla y confirmación cerrada) no muestra diferencias en
  estructura visible, textos, atributos, geometría ni estilos efectivos.
- [ ] **T27 · Pasada manual y anotación.** _RF: RF-5, RNF-1._
  Hecho cuando: móvil y escritorio, tema, música tras «Ingresar», cuenta regresiva, galería y visor con
  teclado, copiado y **envío real** del RSVP funcionan, y el resultado queda anotado en la sección
  «Verificación» de `AGENTS.md`.
- [ ] **T28 · Actualizar `README.md`, `AGENTS.md` y `MEMORY.md`.** _RF: RF-1, RNF-6 (spec §10)._
  Hecho cuando: describen la estructura nueva y la convención de nombres, el «único origen» y el
  inventario de `AGENTS.md` apuntan a `data/`, `utils/`, `services/` y `templates/`, y no queda ninguna
  referencia a las rutas viejas.
