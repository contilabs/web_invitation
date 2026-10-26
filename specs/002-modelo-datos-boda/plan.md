# Plan técnico — Spec 002: Modelo de datos reutilizable de la invitación

- **Spec:** `spec.md`
- **Constitución:** `../../docs/constitution.md`
- **Naturaleza:** plan (sí puede nombrar stack, archivos y arquitectura; la spec no).
- **Base:** la app React + Vite ya terminada (spec 001, T1–T27). Este plan **reorganiza los
  datos** y **mueve los textos de las secciones al registro**; no cambia el aspecto.

## 0. Enfoque

Convertir la invitación en **una app dirigida por datos**: un **registro único de la boda**
(`src/datos/boda.js`) describe toda la boda (pareja, evento, portada, cita, historia,
ubicaciones, itinerario, regalos, hoteles, restricciones, confirmación, galería, ajustes, marca y
plantilla) y un **registro de invitaciones** (`src/datos/invitaciones.js`) contiene las **fichas**
con la forma del contrato del servicio de registro (Google Apps Script). Los componentes dejan de
tener textos y datos incrustados: solo **leen, resuelven y pintan**.

**Alcance de «registro» (spec §1):** el registro de la boda y las fichas de invitación son
**estructuras separadas**; no se mezclan.

La **lógica se aísla en módulos puros** (`src/logica/*.js`, sin React y sin DOM) para poder
probarla con `node --test`. Los **datos** se separan de la lógica en `src/datos/` (son datos, no
funciones). El **pegamento con estado** (reloj, `localStorage`, `<audio>`, `IntersectionObserver`,
`URLSearchParams`) sigue en `../../src/hooks` y la **presentación** en `src/componentes/`.

Requisito transversal: **RF-20** obliga a que un dato requerido inválido o un conflicto de
configuración **se vea** (no se sustituya en silencio). Por eso la validación es una función pura
que devuelve **errores** (fallo visible) y **avisos** (datos válidos no implementados, como una
plantilla distinta de la clásica) que la interfaz pinta en un panel visible.

**Contrato del invitado:** la ficha usa los **identificadores del contrato del GAS** (inglés)
para que la conexión futura sea directa; el **resto** del código y el registro de la boda van en
español. En esta iteración el contrato es **solo referencia**: no se conecta ningún servicio y
`invitaciones.js` lleva **solo datos de ejemplo** (RNF-7).

## 1. Alineación con la constitución

| Principio | Cómo se cumple en este plan |
| --- | --- |
| 1. Stack React + Vite, sin otras dependencias | No se añade ninguna librería: el catálogo en TypeScript de referencia se **traduce a JavaScript + JSDoc**, la zona horaria se resuelve con **`Intl`** (incluido en Node y el navegador) y no se usa router. |
| 2. Spec = código | El plan deriva de la spec; **este spec exige enmendar la redacción** del principio: ya no hay «HTML y su constante en JS» que sincronizar, sino **un único registro**. Además, como parte del cambio se actualizan `../../README.md`/`AGENTS.md` (criterio de gobernanza, spec §8). Ver §7 y `PENDING_TASKS.md`. |
| 3. Interfaz separada de lógica | Lógica pura en `src/logica/*.js`; datos en `src/datos/*.js`; interfaz en `src/componentes/*.jsx`. Los colores siguen en variables CSS. **Los textos de contenido salen de los componentes** y pasan al registro (RNF-1). Se enmienda el principio: los **mensajes del sistema** (fallo visible, aviso de plantilla, cierre del plazo) son **copy de interfaz**, como el aviso de `<noscript>` del spec 001. |
| 4. Tests sin instalar nada | `node --test` (runner integrado). La UI y los flujos (audio, portapapeles, envío) se verifican a mano. |
| 5. Datos del usuario a salvo | El repositorio solo lleva **fichas de ejemplo** (RNF-7); los **datos personales reales no se versionan** (llegan sin versionar en el despliegue o, más adelante, del servicio). El contrato del GAS es **solo referencia**: **no** se da de alta ningún tercero nuevo. Lo único persistido en el navegador sigue siendo el tema (`localStorage["kg-tema"]`). |
| 6. Idioma | El **registro de la boda** y los **textos visibles** van en español; la **ficha del invitado** conserva los identificadores del **contrato del servicio** (inglés) como **excepción documentada**. Se enmienda el principio para reflejar la excepción. |

## 2. Archivos: qué se crea, se modifica o se elimina

### Se crean

**Datos (`src/datos/`) — el «qué»:**

- `boda.js` — **el registro único de la boda** (Karina & Gerardo), con claves en español:
  `plantilla`, `pareja`, `evento`, `portada`, `cita`, `historia`, `ubicaciones`, `itinerario`,
  `galeria`, `regalos`, `hoteles`, `restricciones`, `confirmacion`, `ajustes`, `marca`.
  Conserva el contenido actual (RF-22) y añade soporte para las secciones nuevas. _RF-1, RF-2,
  RF-3, RF-4…RF-15, RF-22 · RNF-1._
- `invitaciones.js` — el **registro de invitaciones**: fichas con la forma del contrato del GAS
  (ficha de invitado `guestName`, `partnerName?`, `adultsGuests`, `childGuests?`, …; tipo
  `personalizada`/`reutilizable`/`generica`) más el **código** de enlace y, cuando aplique, el
  **límite**. **Solo fichas de ejemplo** (RNF-7). _RF-16, RF-17, RF-19 · RNF-7._

**Lógica pura (`src/logica/`) — el «cómo», sin React ni DOM:**

| Archivo | Responsabilidad | RF |
| --- | --- | --- |
| `pareja.js` | Componer nombres (con apellidos/nombres intermedios) y resolver el nombre para mostrar. | RF-2 |
| `evento.js` | Resolver la zona horaria (explícita o local), convertir fecha/hora a un instante y formatear fecha y hora en español. | RF-3 |
| `secciones.js` | Resolver **qué secciones** se muestran, **en qué orden** (la galería cierra la invitación, antes del pie), omitiendo opcionales ausentes o vacías, y si una sección tiene contenido. | RF-4, RF-6, RF-7, RF-8, RF-9, RF-11, RF-14 |
| `restricciones.js` | Código de vestimenta, permiso de niños (por defecto: permitidos), otras indicaciones y **jerarquía boda → ficha**. | RF-12 |
| `invitacion.js` | Leer el código del enlace, resolver tipo/límite/invitado, lugares reservados y comprobar asistentes. | RF-16, RF-17 |
| `confirmacion.js` | Si el formulario está abierto (fecha límite, borde incluido) y qué campos se habilitan. | RF-18 |
| `regalos.js` | Normalizar las opciones de regalo por tipo (tienda/mesa, transferencia, efectivo) y extraer sus datos copiables. | RF-10 |
| `validacion.js` | Detectar datos requeridos inválidos y conflictos → **errores**; detectar datos válidos no implementados → **avisos**. | RF-20 |

**Interfaz (`src/componentes/`):**

- `AvisoDeError.jsx` — panel visible con los **errores** y **avisos** del registro (fallo visible).
  _RF-20._
- `Cita.jsx` — sección **cita** (texto + autor opcional). _RF-7._
- `Historia.jsx` — sección **historia** (título + párrafos en orden). _RF-8._

**Hooks (`../../src/hooks`):**

- `useInvitacion.js` — lee el código del enlace y resuelve tipo/límite/invitado/lugares. _RF-16,
  RF-17._
- `useConfirmacion.js` — «ahora» con tic para abrir/cerrar el formulario en la fecha límite.
  _RF-18._

### Se modifican

- `src/logica/cuentaRegresiva.js` — sigue puro; pasa a recibir el instante **desde `evento.js`**
  (fecha + zona) en vez de una constante. _RF-3._ (Su prueba se conserva.)
- `src/logica/galeria.js` — se conserva (`siguienteIndice`, `elegirVariante`); la galería ahora
  itera las imágenes del registro. _RF-9._
- `src/logica/etiquetas.js` / `musica.js` / `tema.js` — sin cambios de fondo; `musica.js` lee la
  fuente y el habilitado del registro a través del hook (sin reproducción automática, RF-13).
  _RF-13, RF-22._
- `src/componentes/Secciones.jsx` — `Hero`, `Frase` (→ cita/portada), `Retrato`, `Lugares`,
  `Itinerario`, `Hoteles` y `Pie` pasan a **recibir el registro**; **se eliminan los textos
  incrustados** y el itinerario fijo. _RF-2, RF-4…RF-6, RF-11, RF-14 · RNF-1._
- `src/componentes/Confirmacion.jsx` — campos según el registro, **siempre visible**, lugares
  reservados del invitado, prellenado y **no editable** del nombre en la personalizada, cierre al
  superar la fecha límite. _RF-17, RF-18._
- `src/componentes/MesaDeRegalos.jsx` — opciones por tipo (tienda/mesa, transferencia, efectivo)
  con sus datos desde el registro, sin botón propio: el dato marcado como copiable lo copia un
  **único** `BotonCopiar` por opción. _RF-10._
- `src/componentes/Galeria.jsx` / `Visor.jsx` — imágenes, orden y `alt` desde el registro (siguen
  usando variantes optimizadas). La galería es la **última** sección: cierra la invitación, antes
  del pie. _RF-9._
- `src/componentes/Portada.jsx` — portada (título/subtítulo/imágenes) desde el registro. _RF-1._
- `src/componentes/Encabezado.jsx` — se muestra u omite según `ajustes.navegacion`. _RF-14._
- `src/componentes/ControlMusica.jsx` — se muestra u omite y usa la fuente según el registro.
  _RF-13._
- `src/componentes/fotos.js` — se convierte en **resolución por clave**: el registro guarda una
  clave de imagen y aquí se obtiene `{ src, srcset, sizes }` de `../../assets/photos/opt`; el `alt`
  viene del registro. Sin rutas a mano y sin originales. _RF-9 · RNF-4._
- `src/App.jsx` — compone **solo las secciones visibles y en orden** (según `secciones.js`), monta
  el panel de error/avisos, decide portada/panel y fija `document.title`/descripción desde el
  registro. _RF-1, RF-4, RF-14, RF-20._
- `src/hooks/useMusica.js` / `useGaleria.js` / `useReveal.js` / `useEncabezado.js` /
  `useCuentaRegresiva.js` — reciben parámetros del registro en vez de constantes. _RF-3, RF-6,
  RF-9, RF-13, RF-14._
- `../../AGENTS.md` — el «único origen» deja de ser `src/logica/datosEvento.js` y pasa a
  `src/datos/boda.js`; actualizar el inventario de secciones (aparecen **cita** e **historia**), el
  modelo de datos y la personalización por enlace. _RF-1, RF-16, RF-21 · RNF-1._
- `../../README.md` — documentar el registro y **cómo reutilizar la invitación para otra pareja**
  (RF-21). _RF-21._
- `../../MEMORY.md` — estado y decisiones del spec 002.
- `../../docs/constitution.md` — **enmendar los principios 2, 3, 5 y 6** (ver §7). _Criterio de
  gobernanza (spec §8)._
- `../../PENDING_TASKS.md` — registrar la copia **local** del contrato del GAS y la retirada de
  `?invitados=N`. _RF-16, RF-19._

### Se eliminan

- `src/logica/datosEvento.js` y `src/logica/datosEvento.test.js` — sustituidos por
  `src/datos/boda.js` y `src/logica/validacion.js` (+ su prueba). _RF-1, RF-21._
- `src/logica/invitados.js` y `src/logica/invitados.test.js` — `?invitados=N` deja de usarse;
  los sustituye `src/logica/invitacion.js` (+ su prueba). _RF-16._
- `src/hooks/useInvitados.js` — sustituido por `src/hooks/useInvitacion.js`. _RF-16._

## 3. Funciones puras de lógica

Todas deterministas, sin DOM y sin leer el reloj por dentro (el «ahora» entra como parámetro).

| Función | Firma | Qué devuelve | RF |
| --- | --- | --- | --- |
| `componerNombrePersona` | `(persona)` | Nombre completo uniendo los campos presentes (omite vacíos). | RF-2 |
| `nombresDeLaPareja` | `(pareja)` | `{ primera, segunda, paraMostrar }` (usa el nombre para mostrar si existe). | RF-2 |
| `zonaHorariaDelEvento` | `(evento)` | La zona indicada o `null` (⇒ zona local). | RF-3 |
| `instanteDelEvento` | `(evento, zonaLocal?)` | Milisegundos del inicio, interpretando la hora de pared en la zona del evento o en la local. | RF-3 |
| `formatearFecha` | `(ms, zonaHoraria, idioma)` | «01 de noviembre de 2027». | RF-3 |
| `formatearHora` | `(ms, zonaHoraria)` | «16:30 h». | RF-3 |
| `seccionesVisibles` | `(boda)` | Lista **ordenada** de secciones a pintar (clave + datos), omitiendo opcionales ausentes **o vacías** y las apagadas; la confirmación siempre está. | RF-4, RF-6…RF-9, RF-11, RF-14, RF-18 |
| `tieneContenido` | `(clave, seccion)` | `true`/`false` (lista no vacía, párrafos presentes, etc.). | RF-4 |
| `permiteNinos` | `(boda)` | Booleano (por defecto, permitidos si no se indica). | RF-12 |
| `hayConflictoDeNinos` | `(boda, invitacion)` | `true` si la ficha trae niños y la boda no los permite. | RF-12, RF-20 |
| `mensajesDeRestricciones` | `(restricciones)` | Frases en español (vestimenta, niños, otras). | RF-12 |
| `leerCodigoDeInvitacion` | `(parametros)` | Código recortado/normalizado o `null` (sustituye a `leerInvitados`). | RF-16 |
| `resolverInvitacion` | `(invitaciones, codigo)` | `{ tipo, limite, invitado?, reservados? }` o `{ tipo: "desconocida" }`. | RF-16 |
| `lugaresReservados` | `(invitacion)` | Número solo en la personalizada; `null` en el resto. | RF-17, RF-18 |
| `limiteDeAsistentes` | `(invitacion, boda)` | Número: boletos de la ficha · límite del enlace · máximo de la boda (cuenta **personas**: adultos + niños). | RF-17 |
| `asistentesDentroDelLimite` | `(cantidad, limite)` | `cantidad <= limite`. | RF-17 |
| `formatearLugares` | `(total)` | «un lugar» · «1 lugar» · «N lugares» (se conserva del spec 001). | RF-17, RF-18 |
| `confirmacionAbierta` | `(boda, ahoraMs)` | Booleano: `ahoraMs <= fechaLimiteMs` (borde incluido). | RF-18 |
| `camposDeConfirmacion` | `(confirmacion)` | Lista de campos habilitados (nombre, asistentes, alergias, mensaje…). | RF-18 |
| `opcionesDeRegalo` | `(regalos)` | Lista normalizada `{ tipo, etiqueta, descripcion?, url?, datosCopiables?, datoCopiable? }`. | RF-10 |
| `datosCopiables` | `(opcion)` | Lista de `{ etiqueta, valor }` (puede ser vacía). | RF-10 |
| `datoCopiable` | `(opcion)` | El dato a copiar: el marcado con `copiar: true`; si solo hay uno, ese; si hay varios sin marca, `null`. | RF-10 |
| `erroresDelRegistro` | `(boda, invitaciones)` | `[{ campo, mensaje }]` en español (requeridos inválidos, conflictos, imagen irresoluble). | RF-20 |
| `avisosDelRegistro` | `(boda, invitaciones)` | `[{ campo, mensaje }]` para datos válidos no implementados (plantilla no clásica). | RF-15, RF-20 |
| `plantillaImplementada` | `(plantilla)` | `"implementada"` · `"no-implementada"` · `"desconocida"`. | RF-15 |

**Se conservan** sin cambios de fondo: `calcularRestante` (RF-3), `siguienteIndice` y
`elegirVariante` (RF-9), `resolverTema` (tema del invitado, RF-22), `siguienteEstadoMusica` y las
etiquetas accesibles (RF-13).

## 4. Estrategia de tests con `node --test`

- **Qué se prueba:** solo la lógica pura de `src/logica/` (`.js` sin JSX) y la **coherencia del
  registro de ejemplo** de `src/datos/`. Los componentes y los efectos se verifican a mano.
- **Cómo:** `../../package.json` con `"test": "node --test"` (ya existe). Sin instalar nada → principio 4.
- **Pruebas co-locadas** (`src/logica/*.test.js`), un archivo por módulo, con los casos por RF:
  - **RF-2:** nombre con todos los campos, sin apellidos, con nombres intermedios, campos vacíos;
    nombre para mostrar definido vs. ausente.
  - **RF-3:** fecha futura y **pasada** (`terminado`, no error); **instante correcto en
    `America/Mexico_City`**; sin zona → zona local; zona horaria inválida → error detectable;
    formato de fecha/hora en español.
  - **RF-4:** sección opcional ausente (se omite) vs. presente (se muestra); sección apagada por
    ajuste; **visible pero vacía** (se omite); confirmación **siempre** presente; **listas vacías**
    (galería, hoteles, itinerario, regalos, párrafos de historia).
  - **RF-6/RF-7/RF-8/RF-9:** orden de momentos, cita sin autor, párrafos en orden, orden y `alt` de
    la galería; imagen irresoluble → error.
  - **RF-10:** los tres tipos de opción; opción de transferencia con **varios datos y un único
    dato copiable marcado**; varios datos sin marca → sin botón; efectivo sin datos copiables;
    enlace ausente frente a enlace vacío.
  - **RF-11:** hoteles con y sin `mapUrl`/`bookingUrl` (mapa vs. búsqueda, reserva u omisión);
    precio presente/ausente.
  - **RF-12:** vestimenta presente/ausente; niños permitidos/no/**no indicados (permitidos)**;
    **conflicto** boda↔ficha.
  - **RF-13/RF-14:** música apagada; encabezado/panel/pie apagados.
  - **RF-15:** `"clasica"` implementada; otra plantilla → `avisosDelRegistro` (no error);
    plantilla desconocida.
  - **RF-16/RF-17:** código de los tres tipos; **límite por tipo**; código ausente, desconocido o
    normalizado; límite reutilizable `0` y `> 10` → error; asistentes **iguales** al límite
    (válido) y **por encima** (bloqueado); personalizada con 0 boletos; **invitado compartido**
    (nombre no editable); código sin invitado → invitación completa sin lugares.
  - **RF-18:** antes, **en** y después de la fecha límite; campos habilitados; plazo con la zona
    del evento.
  - **RF-19:** la ficha de ejemplo tiene la forma del contrato; sin servicio, la invitación se
    muestra igual (la prueba comprueba la forma, no la red).
  - **RF-20:** fecha ausente/imposible; requerido ausente; conflicto de niños; **la lista de
    errores no queda vacía** y los mensajes van en español; los **avisos** no cuentan como
    errores.
  - **RF-22:** el registro de ejemplo conserva los datos actuales (nombres, fecha, ubicaciones,
    cuenta, enlaces) — una prueba de **no regresión** sobre `src/datos/boda.js`.
- **Documentación:** anotar en la sección «Verificación» de `../../AGENTS.md` el comando y lo que queda
  como verificación manual (tema, audio, portapapeles, envío del RSVP, reutilización para otra
  pareja).

## 5. Cobertura de requisitos (RF ↔ partes ↔ prueba)

| RF | Dónde se resuelve | Prueba |
| --- | --- | --- |
| RF-1 Registro único | `datos/boda.js`, `App.jsx`, resto de componentes | `node --test` (coherencia) + manual |
| RF-2 Pareja | `pareja.js`, `Secciones.jsx`, `Portada.jsx` | `node --test` |
| RF-3 Evento/fecha | `evento.js`, `cuentaRegresiva.js`, `useCuentaRegresiva.js`, `CuentaRegresiva.jsx` | `node --test` |
| RF-4 Catálogo/visibilidad | `secciones.js`, `App.jsx`, `fotos.js` | `node --test` + manual |
| RF-5 Ubicaciones | `Secciones.jsx` (Lugares) + `datos/boda.js` | manual |
| RF-6 Itinerario | `Secciones.jsx` (Itinerario) + `secciones.js` | `node --test` + manual |
| RF-7 Cita | `Cita.jsx`, `secciones.js` | `node --test` + manual |
| RF-8 Historia | `Historia.jsx`, `secciones.js` | `node --test` + manual |
| RF-9 Galería | `galeria.js`, `fotos.js`, `Galeria.jsx`, `Visor.jsx` | `node --test` + manual |
| RF-10 Mesa de regalos | `regalos.js`, `MesaDeRegalos.jsx`, `BotonCopiar.jsx` | `node --test` + manual (portapapeles) |
| RF-11 Hoteles | `Secciones.jsx` (Hoteles), `secciones.js` | `node --test` + manual |
| RF-12 Restricciones | `restricciones.js`, `Cita`/`Historia`/`Secciones.jsx` | `node --test` |
| RF-13 Música | `musica.js`, `useMusica.js`, `ControlMusica.jsx`, `ajustes` | `node --test` + manual (audio) |
| RF-14 Navegación/marca | `useEncabezado.js`, `Encabezado.jsx`, `Secciones.jsx` (Pie), `marca` | `node --test` + manual |
| RF-15 Plantilla | `plantillaImplementada`, `avisosDelRegistro`, `datos/boda.js` | `node --test` |
| RF-16 Tipos de invitación | `invitacion.js`, `useInvitacion.js`, `datos/invitaciones.js` | `node --test` |
| RF-17 Personalización/límites | `invitacion.js`, `Confirmacion.jsx`, `datos/invitaciones.js` | `node --test` + manual |
| RF-18 Confirmación/plazo | `confirmacion.js`, `useConfirmacion.js`, `Confirmacion.jsx` | `node --test` |
| RF-19 Registro del invitado | `datos/invitaciones.js` (forma del GAS, fijo) | `node --test` |
| RF-20 Fallo visible | `validacion.js`, `AvisoDeError.jsx`, `App.jsx`, `restricciones.js` | `node --test` + manual |
| RF-21 Reutilización | `datos/boda.js`, `../../README.md`, `AGENTS.md` | manual |
| RF-22 Continuidad | `datos/boda.js`, componentes y hooks conservados | `node --test` (no regresión) + manual |

## 6. Decisiones técnicas (y alternativa descartada)

1. **JavaScript + JSDoc (sin TypeScript).** El catálogo de referencia está en `.ts`; se traduce a
   `.js` con `@typedef`/`@param` para documentar la forma sin instalar nada. _Descartado:_
   TypeScript — añade una dependencia y una herramienta de build (principios 1 y 4); ya se
   descartó en el spec 001.
2. **Registro de la boda en español; ficha del invitado con los nombres del contrato del GAS.**
   El registro lo escribe la pareja (RNF-5 y principio 6); la ficha sigue el contrato del servicio
   (RF-19) para que la conexión futura sea directa; se documenta como **excepción** y se enmienda
   el principio 6. _Descartado:_ copiar el catálogo de referencia en inglés (rompe RNF-5); o
   traducir la ficha del GAS (rompe RF-19 y complica el envío).
3. **Datos separados de la lógica (`src/datos/` y `src/logica/`).** El registro es data; las
   reglas son funciones puras. _Descartado:_ dejar los datos dentro de `src/logica/` (mezcla
   responsabilidades y difumina «el único origen»).
4. **El enlace usa un código de invitación, no `?invitados=N`.** Un código identifica el tipo y,
   en la personalizada, al invitado; el sistema **compone** la URL a partir del código.
   _Descartado:_ conservar `?invitados=N` y añadir un tipo (la spec exige dejar de usar el
   parámetro); o un router (dependencia innecesaria).
5. **Los enlaces reutilizables y el genérico son datos.** La pareja define **hasta diez** fichas
   reutilizables (límite 1–10) y **una** genérica en el registro; el sistema solo compone el
   enlace. _Descartado:_ que el sistema **genere** enlaces (necesitaría estado/servicio, y RF-21
   prohíbe panel/base de datos).
6. **El límite cuenta personas (adultos + niños); el acompañante va dentro de los boletos de la
   ficha.** Coincide con «boletos de su propia ficha» y con «lugares reservados». _Descartado:_
   contar solo adultos (dejaría sin tope a los niños de la ficha).
7. **Las imágenes se referencian por clave y se resuelven a variantes optimizadas.** El registro
   guarda una clave y el `alt`; `fotos.js` obtiene `{ src, srcset, sizes }` de `opt/`. Mantiene
   RNF-4 y deja el registro libre de importaciones del build. _Descartado:_ poner las URL
   importadas dentro del registro (ata los datos a las importaciones y obliga a editar imports
   al reutilizar).
8. **Zona horaria con `Intl`, sin librería.** `instanteDelEvento` usa la zona indicada o, si no
   la hay, la local; el plazo de confirmación usa la misma zona. _Descartado:_ ignorar la zona
   (RF-3 lo pide explícito); fijar un offset a mano (se rompe con el horario de verano); o una
   librería de fechas (dependencia).
9. **La validación devuelve errores y avisos; no lanza ni rellena.** `erroresDelRegistro` y
   `avisosDelRegistro` alimentan `AvisoDeError.jsx`. _Descartado:_ `throw`/`console.error`
   (invisible para quien comprueba: choca con RF-20); o sustituir el dato inválido por un valor
   por defecto (RF-20 lo prohíbe).
10. **Visibilidad y orden de secciones en una sola función pura.** `seccionesVisibles` decide qué
    se pinta y en qué orden, y trata «visible pero vacía» como ausente (la confirmación siempre
    está). _Descartado:_ repartir `if (boda.x)` por cada componente (reglas duplicadas; fácil
    dejar un hueco — RF-4).
11. **Jerarquía de configuración resuelta en lógica pura.** `permiteNinos`/`hayConflictoDeNinos`
    concentran la regla «la boda se impone a la ficha» (hoy, el permiso de niños). _Descartado:_
    resolverla en el componente (reglas dispersas y conflicto no testeable).
12. **Texto de las secciones dentro del registro.** RNF-1 exige que no quede contenido en la
    interfaz. _Descartado:_ mantener los textos en los componentes (contradice RNF-1 y RF-1).
13. **El tema día/noche sigue siendo preferencia del invitado**, no dato de la boda (el registro
    no lo incluye). _Descartado:_ llevar el tema en el registro (lo fija la pareja y deja de
    seguir al sistema, contra la spec §7).
14. **Un despliegue por pareja; sin router, backend ni panel.** Reutilizar es cambiar el registro
    y **volver a publicar** (RF-21). _Descartado:_ multi-inquilino/CMS — fuera de alcance
    (spec §7) y añadiría dependencias.
15. **La confirmación sigue siendo un `POST` nativo a FormSubmit** con los campos nuevos como
    entradas con nombre. _Descartado:_ enviar por `fetch`/JSON (cambia el canal externo, contra
    la spec §7, y sin necesidad).
16. **Sin campo de reproducción automática en el registro.** La música solo se declara habilitada
    o no y con su fuente; el navegador exige gesto. _Descartado:_ conservar el campo `autoplay`
    (dato que el sistema nunca podría usar: contradice RF-13).
17. **Plantilla válida no implementada ⇒ render clásico + aviso visible.** No es un dato inválido
    (RF-15) pero tampoco se oculta (RF-20). _Descartado:_ tratarla como error (contradice RF-15);
    o renderizarla en silencio (contradice RF-20).
18. **Una fecha de evento pasada es dato válido** (estado «terminado» de la cuenta regresiva).
    Solo la fecha ausente o imposible falla. _Descartado:_ tratarla como error (rompería la
    invitación de una boda ya celebrada que se deja publicada).

## 7. Riesgos y pendientes

- **Enmienda de la constitución (criterio de gobernanza, spec §8):** los principios **2**
  («Cambiar un dato obliga a actualizar HTML y su constante en JS a la vez»), **3** («el markup y
  los textos estáticos viven en `../../index.html`»), **5** (terceros) y **6** (idioma) describen la web
  estática y quedan desalineados con este modelo. Hay que reescribirlos: los datos viven en **un
  único registro** (`src/datos/boda.js`) y en las **fichas**; los textos de contenido **salen** de
  la interfaz; la **ficha del invitado** es una excepción de idioma; el servicio del GAS es
  **solo referencia** (sin tercero nuevo). Anotado en `PENDING_TASKS.md`.
- **Contrato del GAS no está en este repositorio:** la spec lo toma como referencia; conviene
  **copiar el contrato** (campo a campo) al repo para que la forma de la ficha y el mapeo futuro
  sean verificables sin depender del proyecto de referencia.
- **`máximo de la boda` no existe en el catálogo de referencia:** RF-17 lo necesita para la
  genérica; se añade en `boda.ajustes.maxAsistentes`. Es una **extensión deliberada** al catálogo
  y debe quedar documentada.
- **Enlaces `?invitados=N` ya repartidos:** dejan de funcionar (RF-16, excepción intencionada de
  RF-22). Hay que decidir cómo avisar o si se redirige a la invitación genérica.
- **Ficha real de invitados:** el repo solo lleva ejemplos (RNF-7); en un despliegue real, los
  datos del invitado llegan **sin versionarse** (fichero local no versionado o, más adelante, el
  servicio). Cuidar que ningún dato real entre en `invitaciones.js`.
- **Registro del GAS del lado de la boda:** el `doGetWedding` del servicio devuelve la boda con
  claves en inglés; cuando se conecte, hará falta un **mapeador** a las claves en español. Se
  anota como pendiente de la siguiente iteración.
- **Fotos de otra pareja:** al reutilizar, hay que dejar archivos con las **mismas claves y
  anchos** en `../../assets/photos/opt`; `fotos.js` debe seguir fallando al arrancar si falta una
  clave esperada (guardarraíl de RNF-4). Una referencia huérfana es un error visible (RF-20).
- **Casos límite del spec §6** (apartado completo): se cubren con las funciones puras y se
  anotan/depuran en `../../PENDING_TASKS.md`.
- **Verificación manual obligatoria** (no automatizable): reutilización para otra pareja,
  portapapeles, audio y envío del RSVP, anotada en la sección «Verificación».
