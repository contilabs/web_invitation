# Plan técnico — Reorganización modular para soportar plantillas

Spec de referencia: `spec.md`.
Constitución de referencia: `docs/constitution.md`.

Este plan no cambia lo que ve el invitado: reorganiza los módulos, aísla la presentación en una capa de
plantilla y unifica la nomenclatura del código en inglés. Cubre **RF-1 a RF-5** y **RNF-1 a RNF-6**.

## 1. Punto de partida y referencia de paridad

- **Inventario actual:** `src/App.jsx` y `src/main.jsx`; `src/datos/` (registro + fichas + pruebas);
  `src/logica/` (13 módulos puros + 13 pruebas); `src/hooks/` (8 hooks); `src/componentes/` (14
  componentes + `fotos.js`); `styles.css` y `darkMode.css` en la raíz; `test/andamiaje.test.js`;
  `index.html`; `assets/` (fotos, iconos, audio, sin tocar).
- **Paso 0 obligatorio (RNF-1):** **congelar la referencia** antes de tocar nada: commit del estado
  actual y copia del `dist/` construido, para comparar contra ella al final de cada paso. El árbol está
  sin commitear; sin esa referencia la paridad no es comprobable.
- **Punto de entrada que no cambia conceptualmente:** la invitación sigue resolviéndose por el código
  del enlace y se sirve igual (misma dirección y mismo `base` relativo).

## 2. Enmienda constitucional previa (obligatoria)

La constitución fija hoy lo contrario de lo que exige la spec. **Antes de tocar código** hay que
enmendarla (y anotar la enmienda como se hizo en la spec 002). El resto del plan **respeta** la
constitución enmendada:

1. **Principio 1 (stack):** intacto. No se añade ninguna dependencia; `package.json` no cambia
   (solo React, Vite y su plugin). → *RF-1, RF-2, RNF-5*.
2. **Principio 2 (spec = código):** se reformulan las **rutas literales** (`src/datos/boda.js`) por
   **responsabilidades** (`data/`: registro único de la boda + fichas separadas). El contenido y las
   claves del registro **no cambian**; solo cambia el nombre y la ubicación del archivo. → *RF-1, RNF-4*.
3. **Principio 3 (interfaz separada de lógica):** sigue vigente y se refuerza: lógica pura en `utils/`,
   datos en `data/`, presentación en `components/` + `templates/`, hooks en `hooks/`, servicios en
   `services/`. Los colores siguen en **variables CSS** (ahora dentro de la plantilla). → *RF-1, RF-2*.
4. **Principio 4 (tests sin instalar nada):** intacto. Solo `node --test`; la verificación en navegador
   se anota en la sección «Verificación». → *RNF-2*.
5. **Principio 5 (datos a salvo):** intacto. Solo fichas de ejemplo; lo único persistido sigue siendo el
   tema, con la **misma clave** `kg-tema` (contrato publicado). → *RNF-4*.
6. **Principio 6 (idioma):** es el que **exige la enmienda** (hoy manda español en los identificadores).
   Pasa a: nomenclatura del código **en inglés**; textos visibles, datos, comentarios y documentación
   **en español**; la ficha del invitado conserva su excepción documentada. → *RF-3, RNF-6*.

Además, la enmienda debe actualizar `README.md` y `AGENTS.md` (rutas nuevas y convención): es parte del
alcance de la spec (§10) y **no** cambia nada de lo que ve el invitado.

## 3. Estructura objetivo

```
src/
  app/            main.jsx · App.jsx · sectionRenderers.jsx
  components/
    layout/       Header · Footer · Cover · ControlsPanel · ErrorNotice · SkipLink
    sections/     Hero · Countdown · Portrait · Quote · Story · Locations · Timeline
                  · Gifts · Hotels · Restrictions · Rsvp · Gallery
    ui/           CopyButton · ThemeToggle · MusicToggle · GalleryViewer
  constants/      sections.js · theme.js · templates.js
  data/           wedding.js · guest-cards.js (+ sus pruebas)
  hooks/          useTheme · useMusic · useInvitation · useCountdown · useConfirmation
                  · useReveal · useHeader · useGallery · useTemplate
  providers/      TemplateProvider.jsx
  services/       photos.js
  templates/      index.js
    classic/      index.js · classic.css · classic-dark.css · icons.js · photoSizes.js
  types/          wedding.js · guestCard.js   (solo JSDoc, sin código en ejecución)
  utils/          couple · event · sections · restrictions · invitation · confirmation
                  · gifts · validation · countdown · gallery · theme · music · labels
test/             andamiaje.test.js (actualizada) · contracts.test.js (nueva)
```

`assets/**`, `fonts/**`, `docs/**` (salvo la enmienda), `vite.config.js`, `package.json` y el shell no
se mueven. → *RF-1*.

## 4. Convención de nombres (fija D-7 de la spec)

- Carpetas: minúscula, en inglés; plural según lo que contienen.
- Componentes React: `PascalCase.jsx` (se conserva la convención actual, menos churn).
- Hooks: `useAlgo.js`. Resto de módulos: `camelCase.js`. Constantes: `UPPER_SNAKE_CASE`.
- Clases CSS: `kebab-case` en inglés.
- **Restricción de seguridad:** la prueba de andamiaje prohíbe la subcadena `carousel` (y `bootstrap`,
  `data-bs`, `--bs-`) para que no vuelva Bootstrap. Las clases nuevas del carrusel **no** pueden usar
  «carousel»: se proponen `gallery-strip`, `slide`, `slide-active`, `gallery-arrow`, `gallery-counter`.
  *Alternativa descartada:* relajar el guardarraíl a solo `bootstrap` (debilitaría la protección).

## 5. Mapa de archivos

### 5.1 Lógica pura: `src/logica/` → `src/utils/` (RF-1, RF-4, RF-5)

Renombrado de archivo y de **exportaciones**; mismas funciones, mismos casos de prueba.

| Actual | Destino | Exportaciones (nombres nuevos) |
| --- | --- | --- |
| `pareja.js` | `utils/couple.js` | `composePersonName`, `coupleNames` |
| `evento.js` | `utils/event.js` | `eventTimeZone`, `eventInstant`, `formatDate`, `formatTime` |
| `secciones.js` | `utils/sections.js` | `hasContent`, `visibleSections` (el orden pasa a `constants/sections.js`) |
| `restricciones.js` | `utils/restrictions.js` | `allowsChildren`, `hasChildrenConflict`, `restrictionMessages` |
| `invitacion.js` | `utils/invitation.js` | `INVITATION_TYPES`, `readInvitationCode`, `resolveInvitation`, `reservedSeats`, `guestLimit`, `withinLimit`, `formatSeats` |
| `confirmacion.js` | `utils/confirmation.js` | `deadlineMs`, `confirmationOpen`, `confirmationFields` |
| `regalos.js` | `utils/gifts.js` | `GIFT_KINDS`, `copyableData`, `copyableDatum`, `giftOptions` |
| `validacion.js` | `utils/validation.js` | `templateStatus`, `registryErrors`, `registryWarnings` |
| `cuentaRegresiva.js` | `utils/countdown.js` | `remainingParts` |
| `galeria.js` | `utils/gallery.js` | `nextIndex`, `pickVariant` |
| `tema.js` | `utils/theme.js` | `resolveTheme` (las claves/valores pasan a `constants/theme.js`) |
| `musica.js` | `utils/music.js` | `nextMusicState` |
| `etiquetas.js` | `utils/labels.js` | `THEME_ARIA_LABEL`, `musicLabel`, `themeLabel` |

Cada `src/logica/X.test.js` se mueve a `src/utils/X.test.js` con los mismos casos y aserciones (solo
cambian las rutas de import). Los **títulos** de los tests son prosa: se quedan en español.

### 5.2 Datos: `src/datos/` → `src/data/` (RF-1, RNF-4)

| Actual | Destino | Responsabilidad y nota |
| --- | --- | --- |
| `boda.js` | `data/wedding.js` | Registro único. **Contenido y claves idénticos**; solo cambia archivo y ruta |
| `boda.test.js` | `data/wedding.test.js` | No regresión del registro (mismas aserciones) |
| `invitaciones.js` | `data/guest-cards.js` | Fichas de ejemplo. **Forma del contrato GAS intacta** (claves en inglés) |
| `invitaciones.test.js` | `data/guest-cards.test.js` | Forma de las fichas (mismas aserciones) |

### 5.3 Presentación: `src/componentes/` → `components/` + `templates/` (RF-1, RF-2, RF-4, RF-5)

| Actual | Destino | Responsabilidad |
| --- | --- | --- |
| `Secciones.jsx` | `components/sections/Hero.jsx` | Portada principal (ancla `#inicio`) |
| | `components/sections/Portrait.jsx` | Retrato (`aria-hidden`) |
| | `components/sections/Locations.jsx` | Ubicaciones + `LocationCard` local |
| | `components/sections/Timeline.jsx` | Itinerario; iconos desde la plantilla |
| | `components/sections/Hotels.jsx` | Hospedaje; icono desde la plantilla |
| | `components/sections/Restrictions.jsx` | Restricciones; mensajes de `utils/restrictions.js` |
| | `components/layout/Footer.jsx` | Pie |
| `Cita.jsx` | `components/sections/Quote.jsx` | Cita |
| `Historia.jsx` | `components/sections/Story.jsx` | Historia |
| `CuentaRegresiva.jsx` | `components/sections/Countdown.jsx` | Cuenta regresiva (ancla `#fecha`) |
| `Galeria.jsx` | `components/sections/Gallery.jsx` | Carrusel + rejilla |
| `MesaDeRegalos.jsx` | `components/sections/Gifts.jsx` | Mesa de regalos |
| `Confirmacion.jsx` | `components/sections/Rsvp.jsx` | Confirmación (ancla `#confirmar`) |
| `Encabezado.jsx` | `components/layout/Header.jsx` | Encabezado fijo |
| `Portada.jsx` | `components/layout/Cover.jsx` | Portada-modal de bienvenida |
| `AvisoDeError.jsx` | `components/layout/ErrorNotice.jsx` | Aviso del registro |
| `ControlTema.jsx` | `components/ui/ThemeToggle.jsx` | Control de tema |
| `ControlMusica.jsx` | `components/ui/MusicToggle.jsx` | Control de música |
| `BotonCopiar.jsx` | `components/ui/CopyButton.jsx` | Botón de copiado (único de la opción) |
| `Visor.jsx` | `components/ui/GalleryViewer.jsx` | Visor `<dialog>` del carrusel |
| `fotos.js` | `services/photos.js` | Resolución de recursos (ver §7) |

Al partir `Secciones.jsx` **no** cambia ni un nodo del marcado: solo se reparte y se renombra.

### 5.4 Raíz y shell

| Actual | Destino | Nota |
| --- | --- | --- |
| `src/main.jsx` | `src/app/main.jsx` | Entrada; actualizar `index.html` y la prueba de andamiaje |
| `src/App.jsx` | `src/app/App.jsx` | Composición; se le quita el `switch` de secciones (§6) |
| `styles.css` | `src/templates/classic/classic.css` | Tokens de día + todas las reglas; mismo orden de cascada |
| `darkMode.css` | `src/templates/classic/classic-dark.css` | Tokens de noche + ajustes oscuros |
| `index.html` | (se conserva) | Cambian la ruta del `<link>` del CSS y la del `<script>` de entrada |

## 6. Archivos nuevos y su responsabilidad

| Nuevo | Responsabilidad | RF |
| --- | --- | --- |
| `app/sectionRenderers.jsx` | Mapa `clave → componente` extraído del `switch` de App (incluye el bloque `pareja` con Hero + Countdown + Portrait) | RF-1, RF-4 |
| `components/layout/SkipLink.jsx` | Enlace «Saltar al contenido» (mismo `href="#inicio"`, clase nueva en inglés) | RF-5 |
| `components/layout/ControlsPanel.jsx` | Panel flotante que agrupa los controles y conserva `inert` cuando la portada está abierta | RF-5 |
| `constants/sections.js` | `SECTION_ORDER`: **única** fuente del orden de secciones | RF-4 |
| `constants/theme.js` | `THEME_STORAGE_KEY = "kg-tema"`, `THEME_DAY`, `THEME_NIGHT` (valores **contrato**) | RF-5, RNF-4 |
| `constants/templates.js` | `IMPLEMENTED_TEMPLATE_IDS = ["clasica"]`: qué plantillas existen; lo leen `utils/validation.js` y el registro de plantillas sin arrastrar assets | RF-2 |
| `hooks/useTemplate.js` | Lee la plantilla activa del contexto | RF-2 |
| `providers/TemplateProvider.jsx` | Publica la plantilla activa (contexto + proveedor) a todo el árbol | RF-2, RF-3 |
| `templates/index.js` | Registro: `clasica → classic` y resolución con reserva a la plantilla por defecto | RF-2 |
| `templates/classic/index.js` | Descriptor: `id`, `icons`, `photoSizes`, `structuralPhotos` | RF-2 |
| `templates/classic/icons.js` | Clave del registro → icono del build (Iglesia, Mansión, Copas, Comida, Disco, Hotel; ceremonia/recepción) | RF-2, RF-4 |
| `templates/classic/photoSizes.js` | Valores de `sizes` de cada uso de imagen (héroe, retrato, destacada, rejilla, tarjeta, confirmación) | RF-2, RNF-5 |
| `types/wedding.js`, `types/guestCard.js` | `@typedef` en JSDoc del registro y de la ficha (no se ejecutan) | RF-1, RNF-6 |
| `test/contracts.test.js` | Guarda los contratos que RF-3 **no** puede tocar (§10) | RF-3, RF-5 |

*Alternativas descartadas:* `types/` con TypeScript (la spec §7 lo prohíbe y añadiría dependencia);
`styles/` global separado del template (rompería el orden de cascada → riesgo de paridad);
`Icon` como componente `ui` (churn sin ganancia: el icono es un `<img>` simple).

## 7. La capa de plantilla en detalle (RF-2, RNF-3)

- **Qué decide la plantilla:** los estilos (los dos CSS completos), el mapa de iconos, los `sizes` de
  las imágenes y **qué fotos estructurales** usa (héroe `foto1`, retrato `foto9`, confirmación `foto7`).
- **Qué NO decide:** datos, textos, qué secciones se muestran y en qué orden (eso es `constants/` +
  `utils/`), ni ninguna regla de negocio.
- **Cómo llega a los componentes:** `app/App.jsx` resuelve la plantilla a partir de
  `boda.plantilla` (reutilizando `templateStatus` de `utils/validation.js` para la reserva) y la
  publica con `TemplateProvider`; las piezas que la necesitan la leen con `useTemplate()`.
- **Sin selector:** no se añade ningún control, parámetro ni ruta para elegir plantilla. El aviso de
  «plantilla no implementada» de `utils/validation.js` **se conserva con el mismo texto**.
- **`services/photos.js`:** recibe los `sizes` y las claves estructurales de la plantilla, así que deja
  de tener constantes de presentación; mantiene la **validación al arrancar** (falla si falta una clave
  esperada, uniendo las claves del registro con las estructurales de la plantilla).
- **El audio** (`assets/audio.mp3`) se queda donde está: es un recurso que importa la app, no una
  decisión de aspecto; el registro ya prevé `ajustes.musica.fuente`. *Alternativa descartada:* moverlo
  al descriptor de la plantilla (mezclaría recursos con presentación sin necesidad hoy).

## 8. Funciones puras de lógica

**No se añade ninguna función pura nueva.** La paridad funcional (RNF-2) prohíbe cambiar reglas: toda la
lógica que existe se **mueve y se renombra** (§5.1), y ninguna gana, pierde o cambia de comportamiento.
Añadir lógica sería un cambio de comportamiento no pedido por la spec.

Lo único nuevo **no es puro** y por eso no vive en `utils/`:

- `templates/index.js` (registro) y `templates/classic/*`: importan CSS y assets (`import.meta.glob`),
  igual que hoy `fotos.js`; **no** son testeables con `node --test`.
- `providers/TemplateProvider.jsx` y `hooks/useTemplate.js`: dependen de React.
- `services/photos.js`: depende de `import.meta.glob` de Vite.

La **decisión** de qué plantillas existen sigue siendo pura (`constants/templates.js`) y es la que usa
`utils/validation.js`: así el aviso se puede seguir probando con `node --test`.

## 9. Contratos que NO cambian (RF-3, RNF-4)

Nada de esto se renombra; la prueba nueva `test/contracts.test.js` lo vigila:

- **Datos y claves:** todas las claves de `data/wedding.js` (`plantilla`, `pareja.nombre1`, `evento.*`,
  `ajustes.*`, `marca.enlaces.rsvp`, …) y de `data/guest-cards.js` (con su forma GAS: `codigo`, `tipo`,
  `lugaresReservados`, `guestName`, `partnerName`, `limite`, …). El **valor** `plantilla: "clasica"` y
  los valores de tipo (`personalizada`, `reutilizable`, `generica`) tampoco cambian.
- **Anclas e identificadores de la página:** `#inicio`, `#fecha`, `#cita`, `#historia`, `#lugares`,
  `#itinerario`, `#galeria`, `#galeria-seccion`, `#confirmar`, `#regalos`, `#restricciones`,
  `#hospedaje`, `#cuenta-regresiva` y el `id="root"`. Son enlaces compartibles → los **ids siguen en
  español** (excepción documentada; las clases CSS sí pasan a inglés).
- **Enlace de invitación:** los parámetros aceptados siguen siendo `codigo`, `code` e `inv`.
- **Confirmación:** el destino (`marca.enlaces.rsvp`) y los `name` de los campos enviados
  (`_subject`, `asistencia`, `nombre`, `acompanante`, `asistentes`, `alergias`, `mensaje`).
- **Tema:** la clave `kg-tema` y los valores `dia`/`noche`; la clase `dark-mode` del `<html>` (ya está en
  inglés) y el atributo `data-tema` que se intercambian el script del `<head>` y `useTheme`.
- **Recursos:** los nombres de `assets/photos/opt/**`, `assets/icons/**` y `assets/audio.mp3`; el
  `og:image`, el favicon y las rutas del shell.
- **Textos:** todo lo que lee el invitado (incluidos los avisos de `utils/validation.js`) y los
  comentarios/documentación, en español.

## 10. Decisiones técnicas y alternativas descartadas

- **DT-1 · Sin lenguaje tipado.** Se mantiene JavaScript + JSX; los tipos son `@typedef` en JSDoc.
  *Descartado:* adoptar la parte `.ts/.tsx` de la estructura de referencia (lo prohíbe la spec §7 y
  añadiría dependencia; rompería la constitución 1 y 4).
- **DT-2 · Un solo CSS por plantilla, cargado por `<link>`.** `classic.css` + `classic-dark.css`
  movidos **enteros** y enlazados desde el shell. *Descartado:* CSS Modules por componente (repartiría
  la presentación fuera de la plantilla → RF-2) y CSS importado desde JS (produciría destello de
  contenido sin estilos y rompería el guardarraíl del orden tema→estilos).
- **DT-3 · Plantilla vía contexto + `useTemplate()`.** Una sola vía de entrada de la presentación.
  *Descartado:* pasar la plantilla por props a cada sección (un parámetro más en cada componente, acopla
  la composición de `App` a lo que la plantilla necesita); importar la plantilla directamente en cada
  componente (funciona, pero deja la dependencia dispersa y sin un punto único de cambio).
- **DT-4 · `constants/` mínimo.** Solo lo compartido o de presentación (orden de secciones, clave/valores
  del tema, plantillas implementadas). Los enums de un solo módulo (`INVITATION_TYPES`,
  `GIFT_KINDS`) se quedan junto a su lógica. *Descartado:* extraer todos los enums a `constants/`
  (más archivos y más churn sin ganancia).
- **DT-5 · `logica/` → `utils/`.** Se sigue la estructura de referencia. *Descartado:* `core/` o
  `domain/` (más honestos semánticamente, pero se separan del árbol de referencia que pide la spec).
  **Decisión revisable por quien mantiene:** cambiarla después es renombrar una carpeta.
- **DT-6 · `data/` con nombres en inglés.** `data/wedding.js` y `data/guest-cards.js`. *Descartado:*
  conservar `datos/` (rompería «una sola nomenclatura para el código»).
- **DT-7 · Migración por pasos con paridad en cada paso** (§11), no reescritura.
  *Descartado:* rehacer desde cero (diff irrevisable y riesgo alto de regresión).
- **DT-8 · Pruebas co-locadas y `node --test`.** Se conserva la convención. *Descartado:* Vitest o
  Testing Library (dependencias prohibidas por la constitución 1 y 4).
- **DT-9 · El shell conserva lo documental.** Los `<link>` de fuentes, los metadatos, el favicon y el
  script del tema se quedan en `index.html`; la **elección** tipográfica son los tokens del CSS de la
  plantilla. *Descartado:* mover las fuentes al descriptor (el `@import` retrasaría la carga → RNF-5).
- **DT-10 · Los ids de ancla se quedan en español.** Son enlaces compartibles (§9). *Descartado:*
  traducirlos (rompería enlaces ya repartidos y la spec lo excluye).

## 11. Estrategia de migración (cada paso termina en verde)

Cada paso cierra con: `npm test` en verde, `npm run build` sin errores y **comparación contra la
referencia congelada** de las secciones afectadas. Nada se publica a medias (caso límite «estado
intermedio» de la spec).

0. **Congelar la referencia**: commit del estado actual + copia del `dist/` (RNF-1).
1. **Enmienda de la constitución** y actualización de `README.md`/`AGENTS.md` (§2).
2. **`constants/` + `utils/`**: mover la lógica y sus pruebas, renombrando módulos y funciones; ajustar
   los imports que quedan en `componentes/` y `hooks/`.
3. **`data/`**: mover registro y fichas con sus pruebas.
4. **`templates/`**: mover los dos CSS, actualizar los `<link>` del shell, crear `icons.js`,
   `photoSizes.js`, el descriptor, el registro y `constants/templates.js`; ajustar el guardarraíl.
5. **`services/photos.js`**: mover y desacoplar los `sizes`/claves estructurales hacia la plantilla.
6. **`hooks/` + `providers/`**: renombrar los 8 hooks y añadir `TemplateProvider` y `useTemplate`;
   conectar `App` a la plantilla.
7. **`components/ui/`** (4 piezas) y **`components/layout/`** (incluida `SkipLink` y `ControlsPanel`).
8. **`components/sections/`**: partir `Secciones.jsx` en 7 archivos y renombrar el resto. **Aún sin
   tocar nombres de clase.**
9. **Renombrado de clases CSS en inglés**, por bloques de un componente cada vez, JS y CSS a la vez, con
   la comparación de paridad después de cada bloque (es el paso de más riesgo).
10. **`app/`**: `main.jsx`, `App.jsx` y `sectionRenderers.jsx`; actualizar el `<script>` del shell y la
    prueba de andamiaje.
11. **Pruebas**: andamiaje actualizada + `contracts.test.js` nueva.
12. **Cierre**: borrar huérfanos (comprobar que no queda ningún archivo viejo), verificación completa de
    paridad y pasada manual; anotar en `AGENTS.md` («Verificación») y actualizar `MEMORY.md`.

## 12. Estrategia de pruebas con `node --test`

- **Convención intacta:** `*.test.js` co-locado junto a su módulo; `npm test` sigue siendo `node --test`
  (sin instalar nada). Al moverse los módulos, sus pruebas se mueven con ellos y solo cambian las rutas
  de import: mismos casos, mismas aserciones, **ninguna prueba se relaja**.
- **Se mantiene el número de pruebas** (hoy 110): la reorganización no añade ni quita cobertura lógica.
- **`data/wedding.test.js`** y **`data/guest-cards.test.js`**: no regresión del registro y forma de las
  fichas (siguen sin importar `services/photos.js`, que depende de Vite).
- **`test/andamiaje.test.js` (modificada):** rutas nuevas de los CSS, del entry (`/src/app/main.jsx`) y
  de `App.jsx`; nombre nuevo de la clase del enlace de salto; se conservan tal cual el orden
  tema→estilos, la clave `kg-tema`, `dark-mode`, el `<noscript>` en español y la prohibición de Bootstrap
  (con la restricción de nombres de §4).
- **`test/contracts.test.js` (nueva, RF-3/RF-5):** lee como texto los archivos y afirma que siguen ahí
  los contratos de §9 (clave `kg-tema`, ids de ancla, parámetros `codigo`/`code`/`inv`, `name` de los
  campos del formulario, claves del registro y de las fichas). Es lo que impide que un renombrado
  «de paso» rompa la personalización, la confirmación o el tema.
- **Lo que `node --test` no puede cubrir** (y por eso sigue siendo verificación manual/navegador): todo lo
  que depende de Vite o del DOM (`import.meta.glob`, CSS, `<dialog>`, `localStorage`,
  `IntersectionObserver`, `matchMedia`). Misma frontera que hoy.

## 13. Verificación de paridad (RNF-1, RNF-2)

- **Automática:** navegador headless sobre el `dist/` servido en local (método ya usado en la spec 002:
  servidor propio + DevTools Protocol, script **fuera** del repo). Se ejecuta contra **las dos
  construcciones** (referencia congelada y versión nueva) y se comparan, con los mismos datos:
  estructura visible y orden de las piezas, textos, atributos visibles, geometría (rectángulos) y
  **estilos efectivos** (propiedades calculadas) de cada pieza. Se excluyen del diff los nombres de
  clases y archivos. Matriz: los tres tipos de invitación, día y noche, los cinco anchos ya usados
  (320/375/768/1024/1440), registro inválido, sección omitida, aviso de plantilla no implementada y
  confirmación cerrada.
- **Humana (una sola vez al final):** la pasada manual de siempre (tema, música tras el gesto, cuenta
  regresiva, galería y visor con teclado, copiado y **envío real** del RSVP) y una vuelta en móvil.
- **Registro:** el resultado se anota en la sección «Verificación» de `AGENTS.md` (constitución 4).

## 14. Cobertura de requisitos

| Parte del plan | RF/RNF |
| --- | --- |
| §3 estructura, §5 movimientos, §6 piezas nuevas | RF-1 |
| §7 capa de plantilla, `templates/**`, `TemplateProvider`, `useTemplate`, `constants/templates.js` | RF-2 |
| §4 convención, §5 renombrados y renombrado de clases, §9 contratos intactos, `test/contracts.test.js` | RF-3, RNF-6 |
| `constants/sections.js`, `utils/sections.js`, `sectionRenderers.jsx`, secciones repartidas, pruebas de datos | RF-4 |
| Hooks y componentes sin cambio de comportamiento, anclas, audio, formulario, tema, música | RF-5 |
| Referencia congelada, CSS movido entero, clases renombradas con comparación, `preload="none"`, `sizes` por variante | RNF-1, RNF-5 |
| Migración por pasos con pruebas en verde, ninguna prueba relajada | RNF-2 |
| Presentación concentrada en `templates/`, `useTemplate` como única vía, docs actualizadas | RNF-3 |
| `data/wedding.js` y `data/guest-cards.js` con contenido y claves idénticos, `kg-tema` intacto | RNF-4 |

## 15. Riesgos y mitigaciones

- **Renombrar clases CSS rompe el acoplamiento JS↔CSS** (`.reveal`/`visible`, `diapositiva`/`activa`,
  las flechas del carrusel, `lightbox`, `dark-mode`, `fixed-panel`). → Se renombran por bloques con la
  comparación de paridad después de cada uno; la prueba de contratos y el guardarraíl cubren los
  contratos duros.
- **Mover los CSS cambia cómo se cargan** (destello de estilos, orden del tema). → Se enlazan desde el
  shell como hoy (DT-2) y se comprueba en `dev` y en `build` en el paso 4; si falla, se conserva el
  archivo en la raíz como contingencia y se anota.
- **Mucho churn en un solo diff.** → Paso 0 con commit de referencia y un paso por área (§11).
- **Sobrecarga por «dejarlo listo para plantillas».** → Nada de abstracciones de más: una sola vía
  (`useTemplate`), sin selector y sin segunda plantilla (DT-3, spec §7).
- **Recursos y anchos.** → `assets/**` no se toca y `services/photos.js` conserva la validación al
  arrancar y las mismas variantes optimizadas.

## 16. Fuera de alcance (recordatorio)

Todo lo que la spec §7 excluye: segunda plantilla (ni de prueba), selector, cambio de aspecto, de datos,
de textos visibles, de enlaces, lenguaje tipado, framework de pruebas, enrutador, pantallas nuevas,
traducción de textos/comentarios/documentación y renombrado de recursos.

## 17. Criterios de finalización de este plan

1. Constitución enmendada y `README.md`/`AGENTS.md` actualizados (§2).
2. Estructura de §3 en su sitio, sin archivos huérfanos ni duplicados.
3. `npm test` en verde con las mismas pruebas lógicas (renombradas) y los dos guardarraíles.
4. `npm run build` sin errores y el sitio servido desde una subruta cualquiera.
5. Paridad visual y funcional comprobada contra la referencia congelada en toda la matriz de §13.
6. Presentación concentrada en `templates/` y ninguna otra área con decisiones de aspecto.
7. Contratos de §9 intactos y vigilados por `test/contracts.test.js`.
8. Documentación: la enmienda, la verificación y el estado anotados en `MEMORY.md` y en `AGENTS.md`.
