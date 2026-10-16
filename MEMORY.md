# MEMORY.md — Invitación digital
Memoria del proyecto entre sesiones. Máximo ~80 líneas: resume o elimina lo que ya no aporte.
## Estado actual
- **Spec 001 cerrada salvo la pasada manual** (T28) y el despliegue. La app React compone toda la
  invitación; `script.js`/`darkMode.js` borrados y el código legado de datos eliminado (T29). El
  árbol está sin commitear.
- **Spec 002 · modelo de datos reutilizable** (`specs/Jose-QB/002-modelo-datos-boda`): fases **0–7**
  hechas (documentos/datos, lógica pura, hooks, interfaz, limpieza y verificación); solo queda la
  **pasada manual (T33)**: otro registro, portapapeles, audio tras «Ingresar», RSVP real y móvil.
- Documentación: `docs/constitution.md` (6 principios), `specs/Jose-QB/001-*` y
  `specs/Jose-QB/002-*` (`spec.md`,
  `plan.md`, `tasks.md`), `PENDING_TASKS.md`.
- **Spec 001 (T1–T27):** hooks, componentes, rediseño «Ascua», accesibilidad y rendimiento;
  verificación headless en `dist/` OK (320–1440 px, día/noche, contraste, foco, movimiento
  reducido).
- **Spec 002 · Fases 1–2 (T4–T15):** registro único `src/datos/boda.js` + fichas
  `src/datos/invitaciones.js` (tres tipos de ejemplo); lógica pura en `src/logica/` (`pareja`,
  `evento`, `secciones`, `restricciones`, `invitacion`, `confirmacion`, `regalos`, `validacion` y,
  de spec 001, `cuentaRegresiva`, `tema`, `musica`, `etiquetas`, `galeria`).
- **Spec 002 · Fase 4 (T17–T19):** `useInvitacion` (código de enlace → tipo/límite/invitado/
  lugares) sustituye a `useInvitados` (borrado); `useConfirmacion` (cierre al llegar el límite sin
  recargar). Los hooks reciben sus datos por parámetros.
- **Spec 002 · Fase 5 (T20–T28):** interfaz dirigida por el registro. `App.jsx` compone leyendo
  `seccionesVisibles(boda)`; nuevos `AvisoDeError`/`Cita`/`Historia`; `Portada`, `Galeria`,
  `MesaDeRegalos`+`BotonCopiar` y `Confirmacion` leen del registro; `Encabezado`/`CuentaRegresiva`
  reciben props. `fotos.js` resuelve portada/galería por clave (`fotosDePortada`,
  `fotosDeGaleria`). `npm test` → **98/98** y `npm run build` OK; render verificado con Chrome
  headless sobre `dist/` (portada, 11 secciones, enlace personalizado con nombre bloqueado y
  «2 lugares»).
- **Spec 002 · Fase 6 (T29):** borrados `logica/datosEvento.js`/`.test.js` e
  `logica/invitados.js`/`.test.js` (nadie los importaba; `formatearLugares` ya vivía en
  `invitacion.js`). `npm test` → **84/84**. `README.md` y `AGENTS.md` dejan de apuntar al módulo
  borrado (el README ya describe el registro y el enlace por `?codigo=`).
- **Spec 002 · Fase 7 (T30–T32, T34):** no regresión del registro (`src/datos/boda.test.js`) y de
  las fichas (`src/datos/invitaciones.test.js`), más guardarraíl de `?invitados=N` en
  `test/andamiaje.test.js`; `npm test` → **105/105** y build OK (fuentes, iconos y audio en
  `dist/assets/`). Verificación headless a 320–1440 px en día/noche: sin desbordamiento e imágenes
  que cargan con `alt`; secciones según el registro (`restricciones` no sale); casos límite con
  **parches temporales** de `boda.js` (plazo pasado, registro inválido, sección omitida, plantilla no
  implementada). Queda solo T33 (a mano).
- **Spec 002 · ajuste posterior (T35):** la mesa de regalos muestra los datos de la transferencia
  como texto y un **único** botón que copia el dato marcado en el registro (`copiar: true`: la
  cuenta). `npm test` → **110/110** y build OK.
- **Spec 002 · ajuste posterior (T36):** la **galería cierra** la invitación (última sección, justo
  antes del `Pie`). El orden vive solo en `ORDEN_SECCIONES` (`secciones.js`); `App.jsx` y el CSS no
  cambiaron. `npm test` → **110/110** y build OK.
- **Spec 003 · reorganización modular y plantillas** (`specs/Jose-QB/003-reorganizacion-modular-plantillas`):
  **`spec.md` (tras QA), `plan.md` y `tasks.md` (28 tareas, T1–T28) escritos; lista para ejecutar.**
  Prepara **varias plantillas** y la **nomenclatura del código en inglés** sin cambio visible (paridad
  **estricta**, una plantilla, sin selector); exige enmendar la constitución (§10) y fija la estructura
  objetivo (`app/`, `components/`, `constants/`, `data/`, `hooks/`, `providers/`, `services/`, `templates/`, `types/`, `utils/`).
## Decisiones (y por qué)
- **Spec 002 (modelo de datos):** toda la boda en un único registro (`src/datos/boda.js`), fichas separadas (`src/datos/invitaciones.js`); un despliegue por pareja; catálogo completo (incluye **cita** e **historia**); se conserva la plantilla clásica. **Tres tipos de invitación** que **sustituyen** a `?invitados=N` (sin compatibilidad hacia atrás): *personalizada* (enlace con nombre y boletos, lugares reservados), *reutilizable* (hasta 10 enlaces, límite 1–10, sin nombre) y *genérica* (un enlace, sin lugares, con el máximo de la boda). Límites por tipo; configuración **jerárquica** (la boda se impone a la ficha; conflicto niños→fallo visible). Confirmación abierta hasta la fecha límite (borde incluido). Datos inválidos → **fallo visible**; plantilla distinta a la clásica → **aviso** (no error). El repositorio usa **solo fichas de ejemplo** (RNF-7); el contrato del GAS es **solo referencia** (no se copia al repo ahora, no se conecta servicio).
- T3: **`base: "./"`** (relativo), vale en cualquier subruta.
- T4: el script de tema vive en el `<head>`; React **reutiliza** `data-tema`/`kg-tema` (T12).
- T7: `terminado` cuando la diferencia es **≤ 0**; recorta, no redondea.
- T11: `elegirVariante` da la variante optimizada más cercana al ancho objetivo y descarta las que no llevan `w` (nunca el original).
- T14: `componentes/fotos.js` resuelve por **clave** con `resolverFoto(clave, alt?, sizes?)` → `{ src, srcSet, sizes, alt }` con `import.meta.glob` (Vite emite huella y URL válida en cualquier `base`) y **lanza al arrancar** si falta una clave esperada.
- T23: `audio.play()` se llama **dentro del gesto** (INGRESAR o botón) para Safari.
- T24 (rediseño «Ascua»): solo cambian **tokens** (`--paper/--ink/--ember/--vino/--banda-*`); texto `Source Serif 4`, etiquetas `Montserrat`, nombres/títulos `Erstoria`/`Kalista`.
- T25/T26: accesibilidad dentro de `<main>` (`a.saltar`, `:focus-visible` por token, la portada devuelve el foco a `#inicio`); `preload="none"` en el `<audio>`, `fetchPriority`, y `calcularRestante` → «terminado» si la fecha es `NaN`.
- **Spec 002 · Fase 5 (decisiones):** los **títulos de sección viven en el registro** (`ubicaciones.titulo`, `galeria.titulo`, `restricciones.titulo`); `itinerario`/`hoteles` pasan a `{ titulo, momentos/lista }` y `secciones.js` acepta también la lista suelta; `esNoVacio` ignora `titulo` (un rótulo solo no muestra la sección). En `App.jsx` el catálogo y la validación se calculan en ámbito de módulo; el aviso del registro se fija arriba (`z-index: 10001`) para verse con la portada abierta; `document.title`/meta description salen de `marca.nombre`/`evento.descripcion`. `ajustes.navegacion` (`encabezadoVisible`/`panelFlotanteVisible`/`pieVisible`) y `ajustes.musica.habilitada` gobiernan qué se pinta. `Confirmacion` usa `camposDeConfirmacion`, prellena y bloquea el nombre en la personalizada, impide superar el límite (`min`/`max` + `preventDefault`) y muestra el mensaje de cierre. La galería se titula «Nuestros momentos» (antes «Nuestra historia») para no chocar con la sección **historia**.
## Aprendizajes y errores a evitar
- Fase de spec: solo el QUÉ y el POR QUÉ.
- T5: el guardarraíl escanea CSS/`index.html` (no JS/JSX): no se puede nombrar Bootstrap; en comentarios, «la hoja externa retirada».
- `node --test` descubre `**/*.test.js`; los módulos puros no afectan al build.
- Chrome headless: `--dump-dom` emite **todo en una línea** → contar con regex, no por líneas; usar un `--user-data-dir` propio si hay otra instancia abierta. `:focus-visible` no coincide con `focus()` programático.
- **Spec 002:** la personalización pasa a **código de enlace** (tres tipos) en lugar de `?invitados=N`; sin compatibilidad hacia atrás.
- **Spec 002 · lógica:** `instanteDelEvento` → `NaN` si la fecha falta/es imposible o la zona es inválida (lo detecta `validacion.js`). `seccionesVisibles` omite opcionales ausentes o **vacíos** y **fuerza la confirmación** (RF-18). `permiteNinos` es `true` si no se indica (RF-12); el conflicto es error. `confirmacionAbierta` compara `<=` (borde incluido).
- **Spec 002 · `fotos.js`:** en fase 5 quedan como estructurales `FOTO_HERO` (foto1), `FOTO_RETRATO` (foto9) y `FOTO_CONFIRMACION` (foto7); `backgrond3`/`foto20` y toda la galería vienen del registro. Si cambia el registro, hay que mantener las variantes de `assets/photos/opt/` (el arranque falla si falta una).
- **Spec 002 · datos de ejemplo:** `boda.js` trae cita, historia (2 párrafos), galería (13 fotos por clave, 7 destacadas) y portada (fondo + foto20); `restricciones` va sin datos → la sección no se muestra.
- **Spec 002 · verificación (T32):** no usar `--dump-dom` para medir: se sirve `dist/` con un servidor propio y se mide/anota por DevTools Protocol (WebSocket global de Node ≥ 22), en un script **fuera** del repo. Los casos límite se prueban con **parches temporales** de `boda.js` + rebuild + revertir (nunca dejarlos aplicados).
- **Spec 002 · desviaciones del §6 (anotadas en `PENDING_TASKS.md`):** un `limite` de reutilizable fuera de 1–10 cae a `desconocida` **en silencio** (no lo marca `erroresDelRegistro`); el límite de la ficha se recorta al `maximoBoda` sin aviso; `instanteDelEvento` no interpreta la hora de pared en la zona del evento.
- **Spec 002 · mesa de regalos (T35):** un botón por dato resultaba ruidoso (y copiaba banco/titular). Ahora el registro marca **un** dato (`copiar: true`) y `datoCopiable` lo resuelve (varios sin marca → sin botón, para no adivinar). Aprendizaje: en `BotonCopiar` la prop `textoBoton` estaba **declarada y sin usar** (el botón siempre decía «Copiar»).
- **Spec 003 · nomenclatura (spec + plan):** la paridad se exige sobre el **resultado visible** (por eso
  se compara contra una **referencia congelada** antes del cambio), no sobre los nombres. El inglés es
  **solo de código**: no alcanza a textos visibles, datos y sus claves, contratos publicados (`kg-tema`,
  anclas, campos del envío), recursos ni comentarios/documentación. La paridad **manda** sobre reutilizar.
- **Spec 003 · plan:** la plantilla viaja por **contexto** (`TemplateProvider` + `useTemplate`, sin
  selector) y su CSS se enlaza desde el shell (nada de CSS por componente); las **clases** pasan a inglés
  pero los **ids de ancla** (`#inicio`, `#galeria`…) se quedan en español (enlaces compartibles).
  Precedente de la enmienda: la spec 002 ya enmendó la constitución (principios 2, 3, 5 y 6).
- **Spec 002 · orden de secciones (T36):** el orden visual **no estaba en la spec**, solo en `ORDEN_SECCIONES` (`secciones.js`); ahora RF-4 lo exige. Mover una sección = mover su clave ahí y actualizar la prueba de orden de `src/datos/boda.test.js` (la única que lo fija: `secciones.test.js` usa `includes`).
## Próximos pasos
- **Spec 002 · T33 (pasada manual):** reutilizar con otro registro, copiar datos con el portapapeles, audio tras «Ingresar», **envío real del RSVP** y una vuelta en un **móvil físico**; anotar el resultado en «Verificación» de `AGENTS.md`.
- Publicación pendiente (host real, `og:image` absoluto, fuentes autoalojadas…): ver `PENDING_TASKS.md`.
