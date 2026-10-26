# Especificación — Servicio de invitados y confirmación (libro maestro y libro de invitados)

**Estado:** aprobada por quien la pide; en revisión de cierre tras el QA; **ampliada por el cambio de
requisitos de §10** (hoja `public` independiente y lectura tolerante de las celdas vacías), pendiente
de aprobación de quien la pide.

> **Cómo leer esta spec.** El cuerpo (§1–§9) es la versión ya implementada y verificada de esta spec.
> El **§10** recoge el **cambio de requisitos posterior** pedido por quien la usa —la hoja `public`
> independiente (RF-19) y la lectura tolerante de las celdas de asistentes vacías (RF-20), con las
> decisiones **D29**–**D34**— y dice **dónde toca** el cuerpo. Cuando un punto del §10 contradiga el
> cuerpo, **manda el §10**. Los identificadores del §10 (`RF-19`, `RF-20`, `D29`…`D34`) **no**
> colisionan con los del cuerpo (`RF-1`…`RF-18`, `D1`…`D28`); los de la spec 005 se citan **con el
> prefijo «005»** (`005 RF-16`, `005 RF-17`, `005 D21`…), porque allí `RF-16`/`RF-17` y `D21`/`D22`
> significan otra cosa.

## 1. Contexto y objetivo

Hoy la invitación **resuelve al invitado dentro del propio repositorio**, con el modelo de las specs
002 y 003: `src/utils/invitation.js` reconoce **tres tipos locales** (*personalizada*, *reutilizable*
y *genérica*), los resuelve por el **código del enlace** con los parámetros `codigo` / `code` / `inv`
y los **infiere** de dónde aparece el código en las fichas de ejemplo
(`src/data/guest-cards.js`); el formulario de confirmación
(`src/components/sections/Rsvp.jsx`) es un **POST nativo** a FormSubmit.co (el destino vive en el
registro, `marca.enlaces.rsvp`) y el plazo de la confirmación sale del registro
(`confirmacion.fechaLimite`). El intento anterior de esta spec (el documento de contrato en `docs/`,
el script de Apps Script en `gas/` y la capa de servicio) **se descartó**: no existe en el árbol, así
que esta spec parte del estado real de la spec 003.

Los **libros reales** que se van a usar **no** tienen esa forma: el servicio se organiza en **un libro
maestro** (una fila por boda, con el id del libro de invitados de cada una, su tipo de invitación, su
plazo y si está activa) y en **un libro de invitados por boda**, con **hasta tres** hojas (`guests`,
`generic` y `public`); hay **tres** tipos de invitación (personalizada, genérica y pública); el
**teléfono** es obligatorio en las invitaciones que no vienen precargadas; y los estados se llaman
`viewed`, `confirmed`, `updated` y `rejected`.

**Objetivo:** redefinir por completo la conexión con el servicio para que (1) **resuelva la
invitación** a partir del enlace y del maestro (quién es el invitado, de qué tipo es su invitación y
qué cupo tiene) y (2) **registre la respuesta** en el libro de invitados que corresponda, con las
columnas y los valores de los libros reales. El **contenido de la boda** (nombres, fecha, secciones,
fotos) **sigue viviendo en el repositorio** (spec 002); solo el invitado y su respuesta salen del
repositorio.

**Por qué:** el modelo local no describe los libros que la pareja y quien organiza van a usar de
verdad; mantenerlo obligaría a inventar hojas y campos que no existen y a perder el teléfono, que en
las invitaciones genéricas y públicas es la única forma de saber **quién** responde y de
**actualizar** su respuesta en lugar de duplicarla.

**Precisión de vocabulario (evita ambigüedad):**
- «**el maestro**»: el libro de cálculo que identifica las bodas (hoja `files`, una fila por boda).
- «**el libro de invitados**»: el libro propio de **una** boda, referenciado desde el maestro por
  `guests_sheet_id`; tiene **hasta tres** hojas: `guests` (siempre), `generic` (en la boda genérica) y
  `public` (en la boda pública) (RF-4, RF-19).
- «**el servicio de registro**»: el servicio externo (Google Apps Script) que lee el maestro y el
  libro de invitados y escribe la respuesta; es un **tercero (Google)**.
- «**la app**» (o «la invitación»): el sitio estático (React + Vite) que ve el invitado.
- «**el sistema**»: la app **y** el servicio de registro, juntos. Cuando el requisito afecte a una
  sola parte, se dice cuál.
- «**el contrato del servicio**»: los **dos artefactos versionados** que describen la forma de las
  llamadas y de las respuestas de ese servicio (RF-17): el **módulo** `src/constants/contract.js`
  (fuente única de la versión, los nombres de campo, los parámetros y los **códigos de error**) y el
  **documento** `docs/servicio-invitados.md` (la explicación humana del mismo contrato). No es el
  servicio en vivo.
- «**el registro**»: el registro único de la boda que vive en el repositorio (spec 002).
- «**configuración del despliegue**»: los valores que fija quien publica (ubicación del servicio y
  `slug` de la boda); **no** viajan en el enlace ni en el registro de la boda.
- «**código de enlace**»: el valor del parámetro `guest` del enlace; es un `guest_id` (invitación
  personalizada), un `generic_id` de la hoja `generic` (invitación genérica) o un `public_id` de la
  hoja `public` (invitación pública). Se compara **normalizado**: sin espacios en los extremos y **sin
  distinguir mayúsculas y minúsculas** (RF-2, RF-19).
- «**cupo**»: los lugares que la invitación permite ocupar; vive en la columna `adults_guests` de la
  fila (precargado en la personalizada, escrito por el servicio en la genérica y la pública).

### 1.1 El modelo de datos real (los libros)

> **Aviso de privacidad.** Los libros reales contienen **datos personales** (nombres y teléfonos de
> personas concretas). Por eso: **no se versionan** (RNF-2), esta spec **no** reproduce ningún dato
> personal y todos sus ejemplos usan marcadores opacos (`<slug>`, `<guest>`, `<generic_id>`,
> `<public_id>`, «Titular», «Acompañante»).

**Los nombres de columna de este apartado son los del libro y son literales.** Si difieren de los
que se dijeron al pedir esta spec, **manda el libro** y la divergencia queda anotada.

#### El maestro (una sola hoja, `files`)

Un libro de cálculo **con una sola hoja**, llamada **`files`**, con **una fila por boda**. Cabeceras
exactas, en este orden:

| Columna | Tipo en el libro | Significado |
| --- | --- | --- |
| `slug` | texto | Identificador de la boda. Es el valor que se configura en el despliegue (RF-15). |
| `is_active` | **booleano** (`TRUE`/`FALSE`) | Si la boda se sirve (`TRUE`) o ya no es accesible (`FALSE`) (RF-3). |
| `guests_sheet_id` | texto | **Id del libro de invitados** de esa boda (RF-3). |
| `deadline` | fecha y hora (número con formato de fecha/hora) | Plazo de confirmación, **el único**: lo da el servicio (RF-11). |
| `guest_type` | texto | Tipo de invitación de la boda: `personal`, `generic` o `public` (RF-5). |
| `generic_json_cache` | texto | **Caché** de los códigos de la hoja `generic` de esa boda (RF-18). |
| `public_json_cache` | texto | **Caché** de los códigos de la hoja `public` de esa boda (RF-19, D32). |

Anotaciones (divergencias con la petición y avisos del ejemplo):

- La hoja se llama **`files`**; la petición no mencionó su nombre.
- **El `slug` es único:** el servicio deberá fallar de forma visible si dos filas del maestro comparten
  `slug` y también si dos filas **activas** comparten `guests_sheet_id` (el modelo es un libro por
  boda; M2, M6, D28, RF-3).
- **Columnas obligatorias del maestro:** `slug`, `is_active`, `guests_sheet_id` y `guest_type`.
  `deadline` **puede estar vacía** (sin plazo, RF-11) y las **dos cachés** (`generic_json_cache` y
  `public_json_cache`) **pueden faltar o estar vacías** (son cachés, RF-18, RF-19): que falten esas
  tres **no** invalida la boda (I9).
- La columna del id del libro de invitados es **`guests_sheet_id`** (en **plural**), **no**
  `guest_sheet_id`.
- El maestro trae además la columna **`deadline`**, que la petición no listó; es el **único** plazo
  (sustituye al plazo del registro local, RF-11).
- El ejemplo trae una fila en la que **dos bodas apuntan al mismo `guests_sheet_id`**: es un **error
  del ejemplo**. El modelo es **un libro de invitados por boda** (D4, D5).
- En el ejemplo, las celdas de `deadline` están rellenas con la **fórmula `NOW()`**: su valor es el
  **momento del guardado** y no un plazo real (con `NOW()` el plazo **nunca vencería**). Lo mismo
  ocurre con `datetime` en la hoja `guests`. El modelo exige **valores fijos** (no fórmulas): la
  puesta en marcha del servicio lo obliga y la verificación manual lo comprueba (I11, D28, RF-11, §8).
- `generic_json_cache` aparece **vacío** en el ejemplo: se llena cuando el servicio lee la hoja
  `generic` de esa boda (RF-18). `public_json_cache` aparece **vacía** (o ni aparece): se llena cuando
  el servicio lee la hoja `public` de esa boda (RF-19, D32).

#### El libro de invitados (hasta tres hojas)

**Un libro por boda.** El maestro guarda su id en `guests_sheet_id`; es lo que permite **atribuir
cada respuesta a su boda** sin añadir ninguna columna de boda a la hoja `guests` (D5). El libro tiene
**siempre** la hoja `guests` y, según el tipo de la boda, la hoja `generic` y/o la hoja `public`
(RF-4, RF-19, D29).

Hoja **`guests`** — las respuestas de los invitados de esa boda. Cabeceras exactas:

| Columna | Tipo en el libro | Significado |
| --- | --- | --- |
| `guest_id` | **texto o entero** | Identificador del invitado. En la **personalizada** viene **precargado** y suele ser **texto** (por ejemplo, con un sufijo numérico); en la **genérica** y la **pública** lo asigna el servicio y es un **entero**. El autoincremental **ignora** los valores de texto (M7, RF-8). |
| `phone` | **texto** (10 dígitos; el ejemplo lo trae con formato **numérico**) | Teléfono. **No hace falta en la personalizada**; en la **genérica** y la **pública** es **obligatorio** y es el **campo llave dentro del libro de esa boda** (RF-8). El servicio lo **trata como texto**: normaliza a 10 dígitos y escribe el valor como texto (celda de texto) para no perder ceros a la izquierda (I3, D6). |
| `guest_name` | texto | Titular en la **personalizada**. En la genérica y la pública, el **nombre de quien confirma**. |
| `partner_name` | texto (opcional) | Acompañante de la invitación personalizada, cuando exista. |
| `adults_guests` | entero | **Cupo** de adultos de la invitación. Precargado en la personalizada; lo **escribe el servicio** al crear la fila de una genérica o pública (el límite del código, RF-8, RF-9). |
| `adults_attendees` | entero | Adultos que **asisten** (lo escribe la respuesta). |
| `child_guests` | entero (opcional) | **Cupo** de niños. Solo la personalizada lo usa; en la genérica y la pública queda **vacío** (no se ofrecen niños, RF-9). |
| `child_attendees` | entero | Niños que **asisten** (lo escribe la respuesta). |
| `message` | texto (opcional) | Mensaje para la pareja. |
| `dietary_restrictions` | texto (opcional) | Restricciones alimentarias. |
| `status` | texto | Estado de la respuesta (RF-10): `viewed`, `confirmed`, `updated` o `rejected`. |
| `datetime` | fecha y hora | Cuándo se registró la última respuesta (lo pone el servicio). |

Puntos de la hoja `guests`:

- **Cupo ≠ asiste:** `*_guests` es el **cupo** de la invitación (lo que se permite ocupar) y
  `*_attendees`, lo que **asiste** de verdad. La respuesta escribe los segundos; el cupo llega
  precargado (personalizada) o lo escribe el servicio (genérica y pública) (RF-7, RF-8, RF-9).
- Los estados que aparecen en el libro son **exactamente** `viewed`, `confirmed`, `updated` y
  `rejected`; conviven filas con la respuesta completa (asistentes incluidos) y filas con el estado
  puesto y los asistentes **vacíos** (p. ej. `viewed`). Una fila **sin respuesta** (`viewed` o
  `status` vacío) **puede** tener esas celdas vacías y **no** se le exige el cuadre de RF-13 (D21).
- La hoja **no declara ninguna columna** para el **código** (`generic_id`) con el que contestó un
  invitado genérico o público: el código **no se registra** (RF-8, D7).
- En el ejemplo conviven filas precargadas (personalizadas) con **filas declaradas y vacías** al
  final de la hoja: las filas sin datos se ignoran (RF-4).

Hoja **`generic`** — los códigos predefinidos. Cabeceras exactas:

| Columna | Tipo en el libro | Significado |
| --- | --- | --- |
| `generic_id` | texto | El **código** de la invitación genérica: es el valor del parámetro `guest` del enlace en las invitaciones genéricas (RF-19). |
| `limit` | número | **Cupo** (en **adultos**) que ese código permite **en cada respuesta** (RF-9). |

Puntos de la hoja `generic`:

- Los códigos que hay en ella llevan **límites enteros mayores que cero** (en el ejemplo, de 1 a 10).
  Un `limit` entero **≤ 0** es inválido (RF-13) y un `limit` que **no** sea un entero mayor que cero es
  un **código mal formado**: responde `MALFORMED_GUEST` (005 RF-16, D21).
- Los códigos se comparan **normalizados**: sin espacios en los extremos y **sin distinguir mayúsculas
  y minúsculas** (RF-2, D24).
- **El código reservado `PUBLIC` sale de esta hoja** (D31, RF-19): la invitación pública vive en la
  hoja `public`. Si se **deja** una fila `PUBLIC` en `generic`, es **un código genérico más**: con
  `limit = "n"` no cumple la regla de esta hoja y responde `MALFORMED_GUEST` (RF-19, D31).
- **Un mismo código sirve a muchos invitados:** el límite es **por respuesta**, no una bolsa que se
  agote (RF-9).

Hoja **`public`** — el código de la invitación pública. Cabeceras exactas:

| Columna | Tipo en el libro | Significado |
| --- | --- | --- |
| `public_id` | texto | El **código** de la invitación pública: es el valor del parámetro `guest` del enlace en las invitaciones públicas (RF-19). |
| `limit` | número en casi todas las filas; **texto `n`** en la normal | **Cupo** (en **adultos**) que ese código permite **en cada respuesta**; el texto **`n`** significa **sin tope** (RF-9, D30). |

Puntos de la hoja `public`:

- **Solo la necesita el tipo `public`**, donde es **obligatoria** (RF-4, RF-19); en los otros tipos
  **puede** estar (y entonces es donde se busca el código público de una boda genérica, D29).
- Habla **el mismo idioma** que la hoja `generic`: un **entero mayor que cero** es el cupo por
  respuesta y el texto **`n`** es **sin tope** (D30). El caso normal es el código reservado
  **`PUBLIC`** con `"n"`.
- Los códigos se comparan **normalizados** (RF-2, D24) y **un mismo código sirve a muchos
  invitados**: el límite es **por respuesta** (RF-9).

#### Cómo se leen los libros

El servicio deberá leer el maestro y el libro de invitados **por el nombre de la cabecera (fila 1)**,
nunca por la posición de la columna: el orden de las columnas puede cambiar y las columnas que el
servicio no necesita pueden quedarse vacías. Las filas vacías se ignoran (RF-4).

### Decisiones de alcance (fijadas con quien pide la spec)

- **D1 — Solo el invitado y su respuesta salen del repositorio.** El contenido de la boda no se pide
  al servicio; sigue en el registro local (RF-16).
- **D2 — El enlace identifica la invitación (`guest`); la boda, por configuración.** El parámetro
  `guest` lleva el código de enlace (`guest_id`, `generic_id` o `public_id`; RF-19); el `slug` de la
  boda y la ubicación del servicio son **configuración del despliegue** (RF-2, RF-15). Los
  parámetros `codigo`/`code`/`inv` quedan **jubilados, sin alias** (RF-2).
- **D3 — Tres tipos, decididos por el maestro; una boda, un tipo.** Personalizada, genérica y
  pública; el tipo lo declara la columna `guest_type` del maestro y **no** se infiere de la forma de
  la respuesta ni se mezcla dentro de una boda (RF-5).
- **D4 — El maestro es la raíz.** Localizar la boda es leer su fila del maestro y, de ahí, **dónde**
  están sus invitados: el libro que indica `guests_sheet_id` (RF-3).
- **D5 — Un libro de invitados por boda.** Cada boda tiene **su** libro, y eso es lo que atribuye
  cada respuesta a su boda: la hoja `guests` **no** lleva columna de boda ni de código. El teléfono
  es la llave **dentro del libro de esa boda** (RF-3, RF-8).
- **D6 — El teléfono entra en el alcance y es la llave de la genérica y la pública.** La
  personalizada no lo pide; la genérica y la pública lo exigen en cada respuesta, porque es lo que
  permite **reconocer a quien vuelve a contestar** y **actualizar** su fila en lugar de duplicarla.
  Se normaliza a **10 dígitos** y se guarda como **texto**, para no perder ceros a la izquierda
  (RF-8, RNF-2).
- **D7 — El cupo vive en `adults_guests` en los tres tipos, y el código usado no se registra.**
  Precargado en la personalizada; en la genérica y la pública lo **escribe el servicio** al crear la
  fila, con el **límite del código** del enlace, y `adults_attendees` recoge lo que asiste. Así el
  código no necesita columna propia (RF-7, RF-8, RF-9).
- **D8 — Cuatro estados, todos reversibles.** `viewed`, `confirmed`, `updated` y `rejected`; **no hay
  ningún estado terminal**. Mientras el plazo esté abierto se puede volver a contestar (también
  después de `rejected`). `viewed` **solo existe en las invitaciones personalizadas** y lo escribe el
  servicio **al abrir**, únicamente si la fila todavía no tiene respuesta (RF-10).
- **D9 — El plazo lo da el servicio.** Manda el `deadline` del maestro y es el **único** plazo: se
  retira `confirmacion.fechaLimite` del registro local. Un `deadline` vacío significa **sin plazo**
  (RF-11).
- **D10 — Sin invitación identificada, el bloque se muestra deshabilitado.** Se mantiene la
  **derogación** del «la confirmación **siempre** se muestra» de la spec 002 (RF-18): el bloque sigue
  **visible**, pero **deshabilitado**, con el motivo y, cuando tenga sentido, la opción de reintentar
  (RF-12). El bloque **no** se deshabilita por el estado de la respuesta (no hay estado terminal):
  solo por falta de invitación, por plazo vencido o por servicio no disponible. Nunca se confirma a
  ciegas.
- **D11 — La respuesta genérica y pública se identifica por teléfono.** El servicio decide si es un
  **alta** (fila nueva con `guest_id` entero autoincremental) o una **edición** (fila del mismo
  teléfono). La app **no** persiste nada ni deduplica entre pestañas, y **no** da por registrado lo
  que el servicio no aceptó (RF-8, RF-14, RNF-2).
- **D12 — El cupo cuenta adultos; la genérica y la pública no ofrecen niños.** La personalizada pide
  adultos y niños por separado, acotados a los cupos de su fila; la genérica y la pública piden solo
  adultos dentro del límite del código, y `PUBLIC` (`"n"`) **no tiene tope** (RF-9).
- **D13 — La caché de códigos la escribe el servicio.** `generic_json_cache` es un **mapa JSON**
  `código → límite` que el servicio escribe al leer la hoja `generic` de esa boda, y
  `public_json_cache` el equivalente de la hoja `public` (D32, RF-19); cada hoja es la **fuente** y su
  caché una **copia** (RF-18).
- **D14 — `is_active` en falso es «boda ya no accesible».** El servicio **deniega** el acceso y la
  app lo muestra como degradación visible con motivo propio, **distinto** de «boda desconocida»
  (RF-3, RF-12). Es un dato que se usará en futuras iteraciones: no se inventa panel ni gestión.
- **D15 — Modo demo sin servicio.** Sin servicio configurado la invitación funciona **completa, sin
  personalización, con aviso y confirmación deshabilitada** (RF-12, RF-15).
- **D16 — El contrato se versiona y los libros viven fuera.** El contrato del servicio se versiona en
  el repositorio en **dos artefactos**: el **módulo** `src/constants/contract.js` (la fuente única que
  consume la app) y su **documento** `docs/servicio-invitados.md` (ver D18). Los libros reales (con
  sus datos personales y sus ids) **no se versionan** (RNF-2, D19) y la verificación automática va
  contra esos artefactos, no contra el servicio en vivo (RNF-10, RF-17).
- **D17 — Configuración, no datos.** La ubicación del servicio y el `slug` son configuración del
  despliegue; el mecanismo concreto (por ejemplo, variables de entorno del build) es una decisión
  del **plan**, no de esta spec.
- **D18 — El contrato tiene un módulo fuente y un documento derivado.** `src/constants/contract.js`
  es la **fuente única** (versión, nombres de campo, parámetros del enlace y **códigos de error**);
  `docs/servicio-invitados.md` explica lo mismo para las personas. Una **prueba automática**
  (`test/serviceContract.test.js`) comprueba que el documento contiene todos los campos y códigos del
  módulo (B1, M9, RF-17).
- **D19 — Los libros reales se ignoran en git y se conservan en disco.** `.gitignore` **debe**
  excluirlos (`gas/*.xlsx` o la regla que mejor encaje), para que un `git add` accidental no los suba;
  los libros siguen en el disco de quien publica y la app no los necesita para funcionar (B2, RNF-2,
  RF-17).
- **D20 — El tipo resuelto lo devuelve el servicio.** El servicio devuelve el `guest_type` ya resuelto
  (`personal` / `generic` / `public`); la app **nunca** lo deduce del enlace ni de los datos (RF-5,
  RF-6).
- **D21 — Fila sin respuesta y límites.** Una fila **sin respuesta** (`viewed` o `status` vacío) puede
  tener las celdas de asistentes **vacías** y queda **exenta** del cuadre de RF-13; un `limit` entero
  **≤ 0** es **inválido**; con **cupo cero** solo cabe **rechazar** (I1, I2, RF-9, RF-13).
- **D22 — Las fichas de ejemplo se conservan como ejemplos ficticios.** `src/data/guest-cards.js`
  queda reducido a **ejemplos ficticios** para el desarrollo y las **pruebas puras**; **no**
  personaliza en ejecución ni las usa el **modo demo** (I5, RF-1, RF-15).
- **D23 — Zona horaria, caché y teléfono corto.** El `deadline` del maestro se interpreta en la **zona
  del libro/hoja de cálculo**; las cachés del maestro (`generic_json_cache` y `public_json_cache`) se
  reescriben **solo cuando están vacías o ilegibles** (o cuando el código pedido no está en ellas); un
  teléfono que **no llega a 10 dígitos** se **rechaza visiblemente**; `confirmacion.maximoBoda` **sale
  de la lógica de cupos** (M8, RF-8, RF-9, RF-11, RF-18).
- **D24 — El código `guest` se compara normalizado.** Sin espacios en los extremos y **sin distinguir
  mayúsculas y minúsculas**, para que `PUBLIC` y los códigos en mayúsculas resuelvan aunque el enlace
  llegue en minúsculas (I6, RF-2).
- **D25 — Tiempo de espera de 10 s.** Si el servicio **no responde en 10 s**, se da por **no
  disponible**: se degrada y la confirmación queda deshabilitada (I8, RF-12, RNF-4).
- **D26 — Rechazar exige nombre y teléfono en la genérica y la pública.** El rechazo (`rejected`)
  necesita los mismos datos que la confirmación, porque el teléfono es la llave del libro (M4, RF-8).
- **D27 — Estrategia CORS realizable.** El contrato deberá fijar un método, un tipo de contenido que
  **evite el preflight** (p. ej. `POST` con `Content-Type: text/plain;charset=utf-8` y cuerpo JSON) y
  un formato de respuesta **JSON**; así RNF-4 queda comprobable sin añadir ninguna librería (I10,
  RNF-8, RF-17).
- **D28 — Valores fijos y unicidad en el maestro.** Las celdas de `deadline` y `datetime` son **valores
  fijos** (no fórmulas como `NOW()`), y el maestro no puede tener dos filas con el mismo `slug` ni dos
  filas activas con el mismo `guests_sheet_id`; el servicio falla visiblemente si ocurre (I11, M2, M6,
  RF-3, RF-11).

## 2. Usuarios

- **El invitado personalizado.** Abre su enlace, ve su nombre, su acompañante (si lo hay) y su cupo
  (adultos y, si los hay, niños), confirma cuántos asistirán, puede editar dentro del plazo y puede
  rechazar; también puede volver a contestar después de rechazar mientras el plazo siga abierto.
- **El invitado genérico.** Abre su enlace (un código con límite), escribe su nombre y su teléfono,
  indica cuántos asisten dentro del límite y confirma o rechaza; si vuelve a contestar con el mismo
  teléfono, su respuesta se **actualiza**.
- **El invitado público.** Contesta desde el enlace que se comparte con todos (el código `PUBLIC`);
  igual que el genérico, se identifica con su nombre y su teléfono, así que su respuesta no se
  confunde con la de otro, y no tiene tope de asistentes.
- **La pareja.** Ve en la hoja `guests` de su libro quién responde (nombre y teléfono), cuántos
  asisten, si es una respuesta nueva o una edición y cuándo se registró; no usa esta app para
  gestionar, pero depende de que las respuestas lleguen a **su** libro.
- **Quien organiza y publica.** Da de alta las bodas en el maestro (con su tipo, su plazo y si están
  activas), crea y precarga el libro de invitados de cada boda, reparte los códigos de enlace y
  configura la invitación (ubicación del servicio y `slug`).
- **Quien comprueba la invitación.** Necesita que una boda inactiva, un código desconocido, un libro
  que no responde o un fallo del servicio se vean al instante y no se disfracen de una respuesta
  válida.

## 3. Historias de usuario

- **HU-1:** Como invitado personalizado quiero que mi enlace me muestre mi nombre, mi acompañante y
  mi cupo, para saber cuántas personas puedo confirmar.
- **HU-2:** Como invitado genérico quiero escribir mi nombre y mi teléfono y confirmar (o rechazar)
  dentro del límite de mi código.
- **HU-3:** Como invitado público quiero contestar desde el enlace compartido sin que mi respuesta se
  atribuya a otra persona.
- **HU-4:** Como invitado quiero editar mi respuesta volviendo a contestar con mi teléfono dentro del
  plazo, sin tener que avisar a nadie.
- **HU-5:** Como invitado quiero saber si mi respuesta quedó registrada o si falló, para no quedarme
  con la duda.
- **HU-6:** Como pareja quiero que cada respuesta llegue a **mi** libro con el nombre y el teléfono de
  quien responde, y que una respuesta editada **actualice su fila** en vez de duplicarla.
- **HU-7:** Como quien comprueba quiero que una boda inactiva, un código desconocido, un libro de
  invitados que no responde o un servicio caído se vean de forma clara y que la app no confirme a
  ciegas.
- **HU-8:** Como quien organiza quiero repartir un código por enlace (o el código público) sin tocar
  el repositorio.

## 4. Requisitos funcionales (criterios en EARS)

**RF-1 — El invitado se resuelve en el servicio de registro**

- CUANDO la invitación se abra con el código de enlace (`guest`) y haya servicio configurado, el
  sistema deberá resolver al invitado contra el servicio de registro para personalizar la invitación.
- El sistema no deberá tomar los datos del invitado de las fichas de ejemplo locales: estas quedan
  como **ejemplos ficticios de desarrollo y pruebas puras** y **no** personalizan nada en ejecución
  (D22); el **modo demo** tampoco las usa (RF-15).
- El sistema no deberá versionar datos personales reales de invitados (nombres, teléfonos, ids de
  libros); en un despliegue real los datos llegan del servicio y viven en los libros (RNF-2).

**RF-2 — Identificación: `guest` en el enlace, `slug` en la configuración**

- El sistema deberá identificar la **invitación** por el parámetro `guest` del enlace.
- El sistema deberá tomar el `slug` de la boda de la **configuración del despliegue**, nunca del
  enlace, ni del registro de la boda, ni de los datos del invitado.
- El sistema deberá dejar de usar los parámetros `codigo`/`code`/`inv` (**jubilados, sin alias**);
  las pruebas que los congelaban se actualizan (§8).
- El parámetro del enlace conserva el nombre **`guest`** aunque el modelo llame a sus columnas
  `guest_id`, `generic_id` y `public_id` (divergencia anotada en §1.1, RF-19).
- El servicio deberá comparar el código **normalizado**: sin espacios en los extremos y **sin
  distinguir mayúsculas y minúsculas**, para que `PUBLIC` y los códigos en mayúsculas resuelvan aunque
  el enlace llegue en minúsculas (D24).
- DONDE el enlace no traiga `guest`, el sistema deberá mostrar la invitación completa sin
  personalización y con la confirmación deshabilitada (RF-12).

**RF-3 — El maestro localiza la boda y declara dónde están sus invitados**

- CUANDO el servicio reciba el `slug`, deberá localizar la fila de la boda en la hoja `files` del
  maestro por esa columna, y deberá leer su `guest_type`, su `deadline` y su `is_active`.
- El servicio deberá tratar el `slug` como **único**: SI dos filas del maestro comparten `slug`,
  ENTONCES deberá fallar de forma visible (RF-13, D28).
- SI dos filas **activas** del maestro comparten `guests_sheet_id`, ENTONCES el servicio deberá fallar
  de forma visible: el modelo es un libro por boda (M2, D28, RF-13).
- El servicio deberá tratar el `deadline` como un **valor fijo** del maestro, no una fórmula: una celda
  rellena con `NOW()` no es un plazo válido y quien organiza debe rellenarla con un valor real (D28,
  RF-11, §8).
- SI el `slug` no tiene fila en el maestro, ENTONCES el sistema deberá tratar la boda como
  **desconocida** (RF-12).
- SI `is_active` es **falso**, ENTONCES el sistema **no** deberá servir esa boda: el servicio deberá
  **denegar el acceso** y la app deberá mostrarla como **boda ya no accesible**, con motivo propio,
  sin personalización y sin reintento (D14, RF-12). El modo `TRUE`/`FALSE` del libro es la única
  forma de apagar una boda sin borrarla.
- El servicio deberá tomar **`guests_sheet_id`** de esa fila y **abrir ese libro de invitados por su
  id**; un **único** libro por boda: es lo que atribuye cada respuesta a **esa** boda. El
  `guests_sheet_id` no viaja al navegador ni se incrusta en la app.
- SI `guests_sheet_id` está **vacío**, o el libro **no existe**, o el servicio **no puede abrirlo**
  (sin permiso) o **no responde**, ENTONCES el sistema deberá fallar de forma **visible** con un
  motivo propio (RF-12), sin personalizar y sin dar por registrada ninguna respuesta.
- El maestro identifica la boda y **dónde** están sus invitados; no contiene datos de invitados.

**RF-4 — El libro de invitados: hasta tres hojas, leídas por el nombre de su cabecera**

- El servicio deberá leer el libro de invitados por el **nombre de la cabecera** de la fila 1, nunca
  por la posición de la columna; las columnas que no necesite pueden quedarse vacías y las **filas
  sin datos** se ignoran.
- El servicio deberá reconocer las hojas del libro por su nombre literal: `guests` (las respuestas),
  `generic` (los códigos genéricos predefinidos) y `public` (el código de la invitación pública). La
  hoja `guests` es **obligatoria en los tres tipos**; la hoja `generic` es **obligatoria** en la
  **genérica** —que es la que resuelve sus códigos contra ella—; la hoja `public` es **obligatoria**
  en la **pública** (RF-19, D29, I4, D20). En los tipos donde una hoja no hace falta, **su ausencia
  no es un fallo**.
- El sistema deberá tratar los datos del libro con los significados literales de §1.1:
  `adults_guests` y `child_guests` son **cupos**, `adults_attendees` y `child_attendees` son
  **quienes asisten**, el estado vive en `status` y el momento, en `datetime`.
- SI falta la hoja que su tipo necesita (RF-5), falta una cabecera que la respuesta necesite, los
  valores no son legibles o la fila es incoherente, ENTONCES el sistema deberá fallar de forma
  **visible** (RF-13) antes que adivinar.
- El sistema **no** deberá inventar hojas, columnas ni cabeceras: si necesita un dato que el libro no
  declara (por ejemplo, el código usado, RF-8), no lo escribirá fuera de lo declarado.

**RF-5 — Tres tipos de invitación, decididos por el maestro (una boda, un tipo)**

- El sistema deberá reconocer **tres** tipos de invitación: **personalizada**, **genérica** y
  **pública**, y deberá tomar el de la boda de la columna `guest_type` del maestro
  (`personal` / `generic` / `public`).
- El sistema **no** deberá inferir el tipo de la forma de los datos de la respuesta, ni **mezclar**
  tipos dentro de una boda: la boda declara **un** tipo y su libro contiene filas de ese tipo.
- El servicio deberá devolver a la app el **tipo resuelto** (`personal` / `generic` / `public`); la app
  **no** deberá deducirlo del enlace ni de los datos (D20).
- DONDE la invitación sea **personalizada** (`personal`), el código de enlace deberá ser un
  **`guest_id`** de la hoja `guests`, y su fila deberá estar **precargada** con `guest_id`,
  `guest_name`, `partner_name` (opcional), `adults_guests` y `child_guests` (opcional y si aplica).
  La app **no** deberá pedir el teléfono en este tipo.
- DONDE la invitación sea **genérica** (`generic`), el código de enlace deberá ser un **`generic_id`**
  de la hoja `generic` con un **límite** propio. Cada código es un enlace distinto y sirve a muchos
  invitados; el cupo es **por respuesta** (RF-9). SI el libro **también** tiene hoja `public` y el
  código pedido **no está** en `generic`, el servicio deberá buscarlo **en `public`** (RF-19, D29).
- DONDE la invitación sea **pública** (`public`), el código de enlace deberá ser un **`public_id`** de
  la hoja `public`, que es **obligatoria** en ese tipo; la hoja `generic` **ya no hace falta** para
  servirlo. El caso normal es el código reservado **`PUBLIC`** con `limit = "n"`: sirve a todos los
  invitados de esa boda con **un solo enlace** y **sin tope** (RF-9, RF-19, D30).
- En la **genérica** y la **pública**, la app deberá pedir el **nombre** y el **teléfono** al
  contestar (RF-8); no precargará nombre ni cupo.
- SI el `guest_type` del maestro no es uno de los tres, o falta, ENTONCES el sistema deberá fallar de
  forma **visible** (RF-13).

**RF-6 — Lectura de la invitación**

- CUANDO la invitación sea **personalizada**, el servicio deberá devolver a la app: el titular
  (`guest_name`), el acompañante (`partner_name`) cuando exista, el **cupo** (`adults_guests` y
  `child_guests`), el estado (`status`) y, si el invitado ya contestó, su **respuesta previa**
  (`adults_attendees`, `child_attendees`, `message`, `dietary_restrictions`, `datetime`) para poder
  editarla.
- CUANDO la invitación sea **genérica** o **pública**, el servicio deberá devolver el código de
  enlace y el **límite** de ese código (el cupo que tendrá la respuesta; sale de la hoja `generic` o
  de la hoja `public` que corresponda por su tipo, RF-19); **no** precargará nombre ni cupo y **no**
  puede devolver una respuesta previa, porque el teléfono que la identifica lo escribe el invitado al
  contestar (RF-8).
- El servicio **no** deberá devolver al navegador el **teléfono** de una fila precargada: es un dato
  de la pareja y la app no lo necesita para personalizar (RNF-2).
- El sistema deberá devolver el estado **tal cual lo trae el libro** (`viewed`, `confirmed`,
  `updated` o `rejected`), sin traducirlo ni renombrarlo; un estado que no sea uno de esos cuatro se
  trata según RF-13.
- CUANDO el servicio lea una invitación **personalizada** cuya fila todavía **no tenga respuesta**
  (estado vacío o `viewed`), deberá escribir **`viewed`** en esa fila; SI la fila ya tiene respuesta
  (`confirmed`, `updated` o `rejected`), **no** deberá sobrescribirla (RF-10).
- El servicio **no** deberá escribir en el **libro de invitados** al leer una invitación **genérica** o
  **pública** (sí puede refrescar la **caché del maestro**, RF-18).

**RF-7 — Escritura de la respuesta de una invitación personalizada**

- CUANDO el invitado personalizado confirme, edite o rechace dentro del plazo, el servicio deberá
  escribir en **su fila** de `guests`: `adults_attendees`, `child_attendees`, `message`,
  `dietary_restrictions`, `status` y `datetime`.
- El servicio **no** deberá tocar la identidad de la fila ni el cupo: `guest_id`, `guest_name`,
  `partner_name`, `phone`, `adults_guests` y `child_guests` se quedan como están.
- El servicio deberá escribir `confirmed` en la primera respuesta, `updated` cuando se cambie una
  respuesta anterior y `rejected` cuando el invitado diga que no (RF-10).
- El servicio deberá escribir en `datetime` el **momento del registro** (lo pone el servicio, no el
  invitado), y en `adults_attendees`/`child_attendees` lo que **asiste**, sin superar el cupo de su
  fila (RF-9).
- El sistema **no** deberá escribir ninguna fila nueva en la hoja `guests` por una respuesta
  personalizada.

**RF-8 — Escritura de la respuesta de una invitación genérica o pública**

- CUANDO el invitado de una invitación **genérica** o **pública** conteste, la app deberá pedirle su
  **nombre** y su **teléfono**; el teléfono es **obligatorio**, se **normaliza a 10 dígitos** y es la
  **llave dentro del libro de esa boda** (D5, D6). El **rechazo** (`rejected`) exige **los mismos
  datos** que la confirmación (D26).
- SI falta el **nombre** o el **teléfono** en estos tipos, ENTONCES el servicio deberá rechazarlo
  (`MISSING_FIELDS`, §4.1) y la app deberá impedir el envío antes.
- SI el teléfono normalizado **no llega a 10 dígitos**, ENTONCES el servicio deberá **rechazarlo** de
  forma visible (código `INVALID_PHONE`, §4.1), sin crear ni actualizar fila (D23).
- El servicio deberá buscar en `guests` de **ese** libro una fila con ese **teléfono**:
  - SI ya existe una fila con ese teléfono, ENTONCES deberá **actualizarla** (con `updated` cuando
    cambie una respuesta anterior) **sin** crear otra fila;
  - SI no existe, ENTONCES deberá **añadir** una fila nueva y asignarle un **`guest_id` entero
    autoincremental** (el **mayor entero existente + 1**, **ignorando** los `guest_id` que son texto;
    §1.1 y §9.1.7).
- Las columnas que el servicio escribe en estos tipos son: `guest_id` (solo en la fila nueva),
  `phone` (texto normalizado), `guest_name`, `adults_guests` (**el cupo: el límite del código del
  enlace**, RF-9), `adults_attendees`, `message`, `dietary_restrictions`, `status` y `datetime`.
  `child_guests` y `child_attendees` quedan **vacíos** (la genérica y la pública no ofrecen niños,
  D12).
- **El cupo es el del código del envío:** al crear la fila, y también al actualizarla, el servicio
  deberá dejar `adults_guests` en el **límite del código** que venga en ese enlace, y acotar
  `adults_attendees` a él (RF-9).
- El servicio deberá acotar los asistentes al **cupo del código** y rechazar lo que lo supere
  (RF-9).
- **El código usado no se registra:** la hoja `guests` **no declara ninguna columna** para el
  `generic_id` ni para el `public_id`. El sistema **no** deberá inventar una columna ni escribir
  fuera de lo declarado; del código solo queda su **límite**, escrito en `adults_guests` (D7).
- El teléfono **no** se persiste en el navegador: se escribe en el libro porque es la llave
  (RNF-2).

**RF-9 — Cupo de asistencia**

- DONDE la invitación sea **personalizada**, el cupo serán los adultos reservados (`adults_guests`) y
  los niños (`child_guests`) de **su** fila, y el sistema deberá mostrar esos lugares junto al
  formulario. `child_guests` vacío vale por **cero**: la invitación no ofrece niños.
- DONDE la invitación sea **genérica** o **pública**, el cupo será el **límite** (`limit`) del código
  del enlace —de la hoja `generic` o de la hoja `public` que corresponda por su tipo (RF-19)—, y
  **solo cuenta adultos**: la genérica y la pública **no** ofrecen niños. `limit` con el texto **`n`**
  (el código `PUBLIC`) significa **sin tope**: la app **no** deberá inventar un máximo.
- El cupo es **por envío**: cada invitado que use un código puede traer hasta su límite **en su
  propia respuesta**; el código **no** se agota.
- Un número **igual** al cupo deberá ser válido **cuando el cupo es mayor que cero**; un número **por
  encima** deberá impedirse y indicarse de forma visible **antes** de enviar. Con **cupo cero** no se
  puede confirmar asistencia: lo único posible es **rechazar** (D21).
- Un `limit` de código **entero ≤ 0** es **inválido** (RF-13); el código que **existe** pero cuyo
  `limit` **no cumple la regla de su hoja** responde **`MALFORMED_GUEST`** (005 RF-16, D21) y no
  `INVALID_DATA`; el código `PUBLIC` (`"n"`) **no** tiene tope (D21, D30).
- El sistema no deberá enviar una respuesta que supere el cupo; el servicio también deberá
  rechazarla (`OVER_LIMIT`, §4.1).

**RF-10 — Estados de la respuesta (los cuatro del libro, todos reversibles)**

- El sistema deberá usar los cuatro estados del libro, con este significado:
  - **`viewed`** — la invitación **personalizada** se abrió y **todavía no hay respuesta**.
  - **`confirmed`** — hay una **respuesta de asistencia registrada**.
  - **`updated`** — la respuesta anterior se **cambió** (la edición de lo ya contestado).
  - **`rejected`** — el invitado dijo que **no podrá asistir**.
- **Ningún estado es terminal:** mientras el plazo esté abierto, el sistema deberá permitir
  contestar y **volver a contestar** en cualquier estado (también después de `rejected`): en la
  personalizada, sobre su propia fila; en la genérica y la pública, con el mismo teléfono (RF-7,
  RF-8, RF-11).
- **`viewed` solo existe en las invitaciones personalizadas** y lo escribe el **servicio al abrir**,
  únicamente si la fila todavía **no tiene respuesta**; el servicio **no** deberá sobrescribir
  `confirmed`, `updated` ni `rejected` (RF-6).
- SI un invitado que ya había confirmado quiere **anular** su confirmación, lo que hace es **volver a
  contestar** (por ejemplo, con `rejected`) mientras el plazo esté abierto: el libro **no** tiene
  ningún estado de «cancelación» y el sistema **no** deberá inventar uno.
- El sistema deberá tratar como `viewed` (sin respuesta) una fila cuyo `status` esté **vacío**.

**RF-11 — Plazo de la confirmación (lo da el servicio)**

- El plazo de la confirmación deberá ser el **`deadline` del maestro** y **solo** ese: el servicio es
  su autoridad (D9).
- El servicio deberá interpretar el `deadline` en la **zona del libro/hoja de cálculo** del maestro,
  no en la del navegador ni la del evento (D23).
- El `deadline` deberá ser un **valor fijo** (no una fórmula como `NOW()`); una celda con fórmula **no**
  es un plazo válido y quien organiza debe rellenarla con un valor real (D28, §8).
- El sistema **no** deberá tomar el plazo del registro local: `confirmacion.fechaLimite` **se retira**
  del registro (el plazo deja de vivir en el repositorio).
- El servicio deberá devolver el plazo a la app al resolver la invitación; el invitado deberá ver
  ese plazo y el formulario se ofrecerá **mientras esté abierto**.
- SI el envío llega con el plazo ya expirado, ENTONCES el servicio deberá **rechazarlo**, y el
  sistema deberá mostrarlo de forma visible **distinguiéndolo** de un fallo técnico (RF-14).
- SI el `deadline` del maestro está **vacío** o no se puede interpretar, ENTONCES **no habrá plazo**:
  el servicio **no** deberá rechazar por plazo y la invitación se podrá contestar siempre (mientras
  el servicio esté disponible).
- SI el servicio **no responde**, ENTONCES el sistema no tendrá plazo que mostrar y el bloque de
  confirmación quedará **deshabilitado** (RF-12).

**RF-12 — Sin invitación identificada o servicio no disponible (bloque visible y deshabilitado)**

- El sistema deberá **distinguir y nombrar** cada causa, con su propio aviso y su **código de error**
  del contrato (§4.1):
  - **sin `guest` en el enlace** (no se busca a nadie) — `MISSING_GUEST`;
  - **sin `slug` configurado** (la invitación no sabe de qué boda es; RF-15) — `MISSING_SLUG`;
  - **boda desconocida** (el `slug` configurado no tiene fila en el maestro) — `UNKNOWN_WEDDING`;
  - **boda ya no accesible** (`is_active` en falso) — `INACTIVE_WEDDING`;
  - **invitado desconocido** (el código no está en la hoja que le toca por su tipo) — `UNKNOWN_GUEST`;
  - **libro de invitados no disponible** (`guests_sheet_id` vacío, libro inexistente, sin permiso o
    sin respuesta) — `GUEST_SHEET_UNAVAILABLE`;
  - **respuesta del servicio inválida o incoherente** (RF-13) — `INVALID_DATA`;
  - **servicio no disponible** (no responde en **10 s**, tarda demasiado, falla la red o responde algo
    que no respeta el contrato) — `SERVICE_UNAVAILABLE`;
  - **servicio sin configurar** (modo demo, RF-15) — `NOT_CONFIGURED`;
  - **plazo vencido** (el plazo del servicio ya expiró) — `DEADLINE_EXPIRED`.
- EN CUALQUIERA de esas causas, el sistema deberá mostrar la invitación **completa sin
  personalización**, con un aviso visible que diga **qué** ocurrió, y una **opción de reintentar**
  salvo en las causas que no tienen nada que reintentar: «sin `guest`», «sin `slug`», «sin
  configurar», «boda desconocida», «boda ya no accesible» y «plazo vencido» (M3).
- MIENTRAS no haya datos del invitado (o el plazo esté vencido, o el servicio no esté disponible),
  el **bloque de confirmación deberá seguir visible pero deshabilitado**, con el motivo; el sistema
  no deberá confirmar a ciegas. El bloque **no** se deshabilita por el estado de la respuesta: no hay
  estado terminal (D8, D10, RF-10).
- El sistema no deberá sustituir los datos del invitado por valores de ejemplo.
- **Derogación expresa:** esta spec **mantiene derogado** el «la confirmación **siempre** se
  muestra» de la spec 002 (RF-18) en el sentido de que, sin invitado, el formulario **no** se
  ofrece: el bloque se muestra **deshabilitado** (D10). La sección no se apaga ni se oculta.

**RF-13 — Datos inválidos o incoherentes: fallo visible**

- SI los datos del maestro o del libro de invitados son inválidos o incoherentes, ENTONCES el
  sistema deberá fallar de forma **visible**, sin personalizar con datos incompletos. Se consideran
  inválidos:
  - un maestro sin la hoja `files`, sin las columnas **obligatorias** (`slug`, `is_active`,
    `guests_sheet_id`, `guest_type`; `deadline`, `generic_json_cache` y `public_json_cache` pueden
    faltar o estar vacías, §1.1), con un `guest_type` que no sea uno de los tres, con dos filas que
    comparten `slug` o con dos filas **activas** que comparten `guests_sheet_id`;
  - un libro de invitados al que le falta la hoja que su tipo necesita (`guests` en todos; `generic` en
    la genérica; `public` en la pública), o con la **cabecera** incompleta (RF-19);
  - una invitación **personalizada** sin `guest_name`, con `adults_guests` ilegible o negativo, o
    con `child_guests` ilegible o negativo (vacío sí vale: es cero);
  - un código cuyo `limit` **no cumpla la regla de su hoja** (un entero mayor que cero en `generic` y en
    `public`, o el texto `n` en el código reservado `PUBLIC`): esto **no** es `INVALID_DATA`, es el
    **código mal formado** `MALFORMED_GUEST` (005 RF-16, D21, RF-19);
  - un `status` **no vacío** que no sea uno de los cuatro estados de RF-10 (un `status` vacío vale
    por `viewed` / sin respuesta, RF-10);
  - cifras de asistentes **presentes** que no sean enteros ≥ 0; una celda de asistentes **vacía** vale
    por **cero** y **no** invalida la fila (RF-20, D33), tanto si la fila tiene respuesta como si no
    (D21).
- El sistema no deberá inventar nombre, acompañante, cupo, límite, estado, teléfono ni código que el
  libro no entregue.
- SI el fallo ocurre, ENTONCES el sistema deberá mostrar el aviso y dejar la confirmación
  **deshabilitada** (RF-12).
- Los campos **opcionales** ausentes (`partner_name`, `child_guests`, `message`,
  `dietary_restrictions`) **no** invalidan la respuesta.

**RF-14 — Resultado del envío**

- CUANDO un envío termine, el sistema deberá mostrar de forma visible si la respuesta se registró o
  si falló, **distinguiendo** el fallo del servicio (`SERVICE_UNAVAILABLE`), el plazo vencido
  (`DEADLINE_EXPIRED`), la respuesta rechazada por inválida (`INVALID_RESPONSE`) y el exceso de
  asistentes (`OVER_LIMIT`), además de los que la propia app detecta antes de enviar
  (`MISSING_FIELDS`, `INVALID_PHONE`), con los **códigos de error** del contrato (§4.1, RF-8, RF-11).
- MIENTRAS un envío esté en curso, el sistema deberá impedir otro envío **en esa página** (doble
  clic).
- El sistema **no** coordina pestañas distintas: sin persistencia (RNF-2), cada pestaña es
  independiente y el **servicio** es la autoridad sobre los duplicados (por teléfono, D11). No se
  promete deduplicación en el cliente.
- El sistema no deberá dar por registrada una respuesta que el servicio no aceptó.
- SI el envío falla, ENTONCES el sistema deberá **conservar lo que el invitado escribió** (incluidos
  su nombre y su teléfono en la genérica y la pública) y ofrecer reintentar, sin perder el
  formulario.

**RF-15 — Configuración del servicio**

- El sistema deberá tomar la **ubicación** del servicio y el **`slug`** de la boda de la
  **configuración del despliegue**; no del enlace, ni del registro de la boda, ni de los datos del
  invitado.
- SI la ubicación del servicio **no está configurada**, ENTONCES el sistema **no** deberá intentar
  ninguna llamada y entrará en **modo demo** (RF-12, D15).
- SI la ubicación está configurada pero falta el `slug`, ENTONCES el sistema deberá mostrarlo como
  **«sin `slug` configurado»** (`MISSING_SLUG`), causa propia de RF-12: sin personalización,
  confirmación deshabilitada y **sin** reintento (reintentar no cambiaría la configuración; I7).
- La configuración no deberá incluir datos personales de invitados ni versionarse con ellos.

**RF-16 — El contenido de la boda sigue local**

- El sistema deberá seguir tomando todo el contenido de la boda del **registro local** (spec 002);
  esta spec no lo mueve al servicio.
- El sistema deberá conservar los comportamientos actuales (portada, tema, música, cuenta regresiva,
  galería y visor) salvo los cambios de esta spec.

**RF-17 — Contrato del servicio versionado y libros fuera del repositorio**

- El repositorio deberá incluir el contrato del servicio en **dos artefactos versionados**:
  - **`src/constants/contract.js`** — el **módulo fuente única**: versión del contrato, parámetro del
    enlace, nombres de hoja y de columna del modelo, estados, valores especiales (`PUBLIC`, `"n"`), el
    **tiempo de espera (10 s)** y la **tabla de códigos de error** (§4.1). Es el que **consume la app**.
  - **`docs/servicio-invitados.md`** — el **documento humano derivado** del módulo: explica el maestro
    (columna a columna), el libro de invitados (sus hojas, columna a columna y con sus tipos), la
    resolución (`slug` → `guest_type` → `guests_sheet_id` → código), los tres tipos y el tipo por boda,
    la lectura (incluido el `viewed` de la personalizada) y la escritura con los nombres de columna del
    libro, los cuatro estados reversibles, el teléfono como llave (10 dígitos, texto), el cupo en
    `adults_guests`, el `guest_id` entero autoincremental, la caché de códigos y los **códigos de
    error**; también la **estrategia de intercambio entre orígenes** (D27).
- La app deberá **consumir el módulo** (`src/constants/contract.js`); el documento es la referencia
  versionada para las personas (D16, D18).
- El contrato deberá fijar una estrategia CORS **realizable**: método, tipo de contenido que **evite el
  preflight** (p. ej. `POST` con `Content-Type: text/plain;charset=utf-8` y cuerpo JSON) y un formato de
  respuesta **JSON** (D27, RNF-4).
- El repositorio **no** deberá versionar el maestro, ni los libros de invitados, ni sus ids, ni ningún
  dato personal de invitados (D16, RNF-2): los libros reales se configuran y se mantienen fuera del
  repositorio.
- `.gitignore` deberá **excluir los libros reales** (p. ej. `gas/*.xlsx`), de modo que un `git add`
  accidental no los suba; los libros se **conservan en el disco** de quien publica (B2, D19, RNF-2).
- SI la app necesita un dato que el contrato no declara, ENTONCES el sistema deberá fallar de forma
  visible (RF-13) antes que adivinarlo.
- Ni el módulo ni el documento deberán contener datos personales reales ni credenciales.

**RF-18 — Caché de códigos del maestro (`generic_json_cache` y `public_json_cache`)**

- El maestro declara en `generic_json_cache` un **mapa JSON `código → límite`** con los códigos de la
  hoja `generic` de esa boda, y en `public_json_cache` el mapa equivalente con los códigos de la hoja
  `public` (las claves son los códigos de su hoja y la búsqueda se hace **normalizada**, RF-2), para
  poder resolver un código **sin abrir el libro de invitados** (D13, D32, RF-19).
- El servicio deberá **escribir** la caché de **su** hoja cuando la **lea** (`generic` →
  `generic_json_cache`; `public` → `public_json_cache`); cada hoja es la **fuente** y su caché una
  **copia**. El servicio **no** deberá escribir la caché como efecto de la respuesta de un invitado.
- MIENTRAS la caché sea **legible** y contenga el código pedido, el servicio deberá resolverlo **sin
  volver a abrir el libro** del invitado (para eso existe: evitar abrir el libro solo para validar un
  código).
- SI la caché está **vacía** o es **ilegible**, o **no contiene el código pedido**, ENTONCES el servicio
  deberá leer la hoja correspondiente y **refrescar la caché** con lo leído: el servicio reescribe la
  caché **solo en ese caso**, para no escribir de más (D23).
- SI al leer la hoja el contenido **discrepa** de la caché, ENTONCES deberá mandar la **hoja** (la
  fuente) y la caché se actualiza con lo leído.
- SI ni la caché ni la hoja permiten resolver el código, ENTONCES el servicio deberá fallar de forma
  visible (`UNKNOWN_GUEST`, RF-12).

### 4.1 Tabla de códigos de error del servicio (parte del contrato)

> El **módulo** `src/constants/contract.js` es la **fuente única** de esta tabla; el **documento**
> `docs/servicio-invitados.md` debe reproducirla **entera**: **todos** los códigos de abajo, con su
> causa y su mensaje, y ninguno de más (`test/serviceContract.test.js` lo comprueba; D18, RF-17,
> RNF-10). La app usa el **código** para elegir el aviso y el **mensaje de interfaz** es el copy
> visible en español (RNF-7). Cada causa de RF-12 y cada fallo de RF-14 corresponden a un código de
> esta tabla.

| Código | Causa | Mensaje de interfaz |
| --- | --- | --- |
| `OK` | La operación terminó bien (lectura o registro). | «¡Gracias! Tu respuesta quedó registrada.» |
| `MISSING_GUEST` | El enlace no trae el parámetro `guest`. | «Este enlace no identifica ninguna invitación.» |
| `MISSING_SLUG` | La configuración del despliegue no tiene `slug`. | «Esta invitación no está configurada.» |
| `NOT_CONFIGURED` | No hay ubicación del servicio configurada (modo demo). | «La confirmación no está disponible en este momento.» |
| `UNKNOWN_WEDDING` | El `slug` no tiene fila en el maestro. | «No encontramos esta boda.» |
| `INACTIVE_WEDDING` | `is_active` en falso. | «Esta boda ya no está disponible.» |
| `UNKNOWN_GUEST` | El código no está en la hoja que le toca por su tipo. | «No encontramos esta invitación.» |
| `GUEST_SHEET_UNAVAILABLE` | `guests_sheet_id` vacío, libro inexistente, sin permiso o sin respuesta. | «No pudimos abrir la lista de invitados.» |
| `INVALID_DATA` | Datos del maestro o del libro inválidos o incoherentes, **de lectura** (RF-12, RF-13). | «Los datos de esta invitación están incompletos.» |
| `INVALID_RESPONSE` | El servicio **rechaza la respuesta enviada** por inválida o incoherente (RF-14). | «No pudimos registrar tu respuesta con esos datos.» |
| `SERVICE_UNAVAILABLE` | El servicio no responde en 10 s, falla la red o responde algo que no respeta el contrato. | «No pudimos conectar. Inténtalo de nuevo.» |
| `DEADLINE_EXPIRED` | El plazo del maestro ya pasó. | «El plazo para confirmar ya terminó.» |
| `OVER_LIMIT` | Los asistentes superan el cupo (RF-9). | «Superaste el número de lugares de tu invitación.» |
| `MISSING_FIELDS` | Falta el nombre o el teléfono en una genérica o pública, **también al rechazar** (RF-8, D26). | «Escribe tu nombre y tu teléfono para responder.» |
| `INVALID_PHONE` | El teléfono normalizado no llega a 10 dígitos (RF-8). | «Revisa el teléfono: deben ser 10 dígitos.» |

> **Dos precisiones sobre esta tabla.** (1) El **código `MALFORMED_GUEST`** —un código que **existe**
> pero cuyo `limit` **no** cumple la regla de su hoja— lo añadió la spec **005 §14** (005 RF-16): desde
> entonces ese fallo **no** es `INVALID_DATA` y el **mensaje** de `INVALID_DATA` **no** cambia.
> (2) El cambio de **§10** **no añade ningún código** ni altera **ningún** mensaje: lo que hace es
> **aclarar** la causa de `INVALID_DATA` —una cifra de asistentes **presente** que no sea un entero
> ≥ 0 (RF-20)— y **remitir** a `MALFORMED_GUEST` para el código mal formado (§10.4).

## 5. Requisitos no funcionales

- **RNF-1 Mantenibilidad.** La ubicación del servicio y el `slug` son configuración; los datos del
  invitado no se incrustan en la interfaz. Atender a otra boda o a otro invitado no exige editar la
  app: se editan los **libros**. El contrato del servicio vive en **dos artefactos versionados** —el
  **módulo** `src/constants/contract.js`, que es la **fuente única** que consume la app, y el
  **documento** `docs/servicio-invitados.md`, derivado de él— y **no** está disperso por los
  componentes (RF-17, D16, D18).
- **RNF-2 Privacidad.** Ningún dato personal real de invitados se versiona: los **libros reales**
  (maestro y libros de invitados, con sus nombres y teléfonos) **no** se versionan, y el repositorio
  solo contiene ejemplos ficticios. Lo único que el navegador persiste sigue siendo el tema
  (`kg-tema`): no se guardan respuestas, ni datos del invitado, ni el teléfono. El **código de
  enlace** viaja en la URL —**quien comparte el enlace comparte el código**—, así que los códigos
  corrientes deberán ser **opacos** y no contener nombre, correo ni teléfono; el código `PUBLIC` es,
  por definición, un enlace compartido con todos. El servicio de registro es un **tercero (Google)**
  al que solo se envían el código y los datos de la respuesta; no se añaden terceros ni analítica. El
  **teléfono** es un dato personal que el invitado de una genérica o pública **aporta** al contestar:
  se envía al servicio y se escribe en el libro porque es la **llave**, y no se persiste en el
  navegador.
- **Regla de git.** El repositorio deberá **excluir los libros reales** por una regla explícita de
  `.gitignore` (p. ej. `gas/*.xlsx`), para que un `git add` accidental no los suba; los libros se
  **conservan en el disco** de quien publica y la app no los necesita para funcionar (B2, D19, RF-17).
- **RNF-3 Fallo visible.** Un servicio caído, una boda desconocida o ya no accesible, un código
  desconocido, un libro que no responde, una respuesta inválida, un plazo vencido o un tipo que no se
  puede determinar se ven; nunca se finge una confirmación registrada ni se personaliza con datos
  incompletos.
- **RNF-4 Compatibilidad.** La conexión con el servicio debe funcionar con la invitación publicada en
  cualquier subruta (`base: "./"`) y desde un móvil, con una estrategia de intercambio entre orígenes
  **realizable**: el contrato deberá fijar método, tipo de contenido que **evite el preflight** (p. ej.
  `POST` con `Content-Type: text/plain;charset=utf-8` y cuerpo JSON) y un formato de respuesta **JSON**
  (D27, RF-17). SI el servicio no responde en **10 s**, se da por **no disponible** (D25, RF-12).
- **RNF-5 Rendimiento.** La personalización no debe bloquear el despliegue del contenido de la boda:
  el invitado puede leer la invitación mientras llega la respuesta. La confirmación no añade
  descargas pesadas y la llamada al servicio no bloquea el primer pintado. SI el servicio no responde
  en **10 s**, se degrada y la invitación sigue legible (D25, RF-12).
- **RNF-6 Accesibilidad.** Los avisos y los estados de envío se anuncian a las tecnologías de
  asistencia en **regiones vivas** (`role="status"` para los cambios de estado y `role="alert"` para
  los errores). Cuando aparece un aviso de fallo, el **foco** se mueve a él; cuando termina un envío,
  el foco va al resultado. El formulario deshabilitado lo está de verdad (campos `disabled`, no solo
  un estilo) y su **motivo** queda asociado por texto; la opción de reintentar es un botón alcanzable
  por teclado. Los campos de nombre y teléfono llevan etiqueta propia y tipo de teclado adecuado en
  móvil, y el formulario sigue siendo operable por teclado y con foco visible.
- **RNF-7 Idioma.** Los textos visibles y los mensajes del sistema van en **español**; los
  identificadores del **modelo y del contrato del servicio** (hojas, columnas, parámetros, estados y
  códigos de error) conservan su forma en inglés como **excepción documentada**.
- **RNF-8 Sin dependencias nuevas.** La conexión se hace con lo que ya permite la constitución
  (React + Vite); no se añaden librerías, servicios, herramientas ni gestores de peticiones
  (principio 1).
- **RNF-9 Capas (principio 3).** La llamada al servicio vive en `src/services/`; la lectura de la
  respuesta (tipo, cupo, estado y límites) en `src/utils/` (puras, con lo que dependa del entorno
  como parámetro); el **cuándo** y el **estado**, en `src/hooks/`; la presentación, en
  `src/components/`. La configuración no vive en el contenido de la boda, y los **datos de los
  invitados no viven en el repositorio**.
- **RNF-10 Verificación del contrato.** La verificación automática de la forma del envío y de la
  lectura va contra el **módulo** `src/constants/contract.js` (la fuente única del contrato), **no**
  contra el servicio en vivo, y con el runner integrado de Node (`node --test`), sin instalar nada
  (principio 4). Además, `test/serviceContract.test.js` comprueba, leyendo los dos archivos como
  texto, que `docs/servicio-invitados.md` contiene **al menos una vez** cada literal del módulo y que
  su **tabla de códigos** coincide en **conjunto** y en el **mensaje** de cada uno (B1, M9, D16, D18).

## 6. Casos límite

- **Servicio caído, lento o sin respuesta** (más de **10 s**): la invitación se muestra completa sin
  personalización, con aviso, motivo y reintento; la confirmación queda visible pero deshabilitada y no
  hay plazo que mostrar (RF-12, D25).
- **Boda desconocida** (`slug` sin fila en el maestro): aviso propio, sin personalización,
  confirmación deshabilitada y **sin** reintento (el `slug` es configuración; reintentar no cambiaría
  nada; M3).
- **Sin `slug` configurado:** aviso propio («sin `slug` configurado»), sin personalización,
  confirmación deshabilitada y **sin** reintento (RF-15, I7).
- **Boda ya no accesible** (`is_active` en falso): aviso propio (distinto de «boda desconocida»), sin
  personalización, confirmación deshabilitada y **sin** reintento (RF-3, RF-12).
- **Libro de invitados no disponible** (`guests_sheet_id` vacío, libro inexistente, sin permiso o sin
  respuesta): aviso propio, sin personalización, confirmación deshabilitada, con reintento (RF-3,
  RF-12).
- **Invitado desconocido** (código sin fila en la hoja que le toca por su tipo): aviso propio, sin
  personalización, confirmación deshabilitada (RF-5, RF-12).
- **Sin `guest` en el enlace:** invitación completa sin personalización y confirmación deshabilitada,
  **sin** opción de reintentar (no hay nada que reintentar).
- **Servicio no configurado (modo demo):** no se llama al servicio; invitación completa, aviso de
  modo demo y confirmación deshabilitada (RF-15).
- **Datos inválidos o incoherentes** (cabecera incompleta, `guest_type` desconocido, `limit` entero
  ≤ 0 en un código genérico, `limit` que no sea `n` en el código público, `status` no vacío desconocido,
  cifras **presentes** ilegibles): fallo visible, sin personalización y confirmación deshabilitada (RF-13,
  RF-20).
- **Fila precargada «vista» sin respuesta** (`status` = `viewed`, asistentes vacíos): el invitado
  puede confirmar; la app no la da por contestada (RF-10).
- **Estado vacío** en la fila: se trata como `viewed` / sin respuesta (RF-10).
- **Cambio de opinión en una invitación personalizada:** cualquiera de los cuatro estados puede volver
  a contestarse mientras el plazo esté abierto; también `rejected` (RF-10).
- **Un invitado que confirmó y luego quiere anular:** vuelve a contestar (p. ej. con `rejected`)
  mientras el plazo esté abierto; no hay estado de «cancelación» (RF-10).
- **Invitación personalizada con 0 de cupo** (`adults_guests` = 0 y `child_guests` vacío o 0): no se
  puede confirmar asistencia y lo único posible es **rechazar** (RF-9, RF-10).
- **Invitación personalizada sin acompañante:** el campo `partner_name` ausente no rompe nada; la app
  no muestra acompañante (RF-6, RF-13).
- **Genérica o pública sin nombre o sin teléfono:** no se confirma **ni se rechaza**: ambos son
  obligatorios, también para rechazar (D26, RF-8).
- **Teléfono que no llega a 10 dígitos tras normalizar** (o que trae lada de país): se **rechaza
  visiblemente** (`INVALID_PHONE`) sin crear ni actualizar fila (D23, RF-8).
- **`slug` o `guests_sheet_id` duplicados** (dos filas con el mismo `slug`, o dos filas activas con el
  mismo libro): fallo visible (D28, M2, M6, RF-3).
- **`deadline`/`datetime` con fórmula `NOW()`:** no es un plazo válido y quien organiza debe rellenarlo
  con un valor fijo (D28, I11, RF-11).
- **`limit` de un código genérico ≤ 0:** inválido, fallo visible (D21, RF-13).
- **Fila sin respuesta con asistentes vacíos** (`viewed` o `status` vacío): **exenta** del cuadre de
  RF-13; no es un dato inválido (D21).
- **Libro de una boda personalizada sin hoja `generic`:** **no** es un fallo: la hoja `generic` solo es
  obligatoria en la genérica y la pública (I4, RF-4).
- **Genérica o pública con el mismo teléfono dos veces:** la segunda respuesta **actualiza** la fila
  existente en vez de duplicarla, y el cupo se aplica contra el límite del código de ese envío
  (RF-8, D11).
- **Teléfono de otra persona:** como es la llave, una respuesta con el teléfono de otra fila
  actualizaría esa fila; el servicio no puede distinguirlo (D5).
- **Código `PUBLIC` con `limit = "n"`:** sin tope; la app no inventa un máximo (RF-9, D12).
- **Libro con hoja `public` y boda `generic`:** un código que **no está** en `generic` se busca en
  `public`; si tampoco está ahí, `UNKNOWN_GUEST` (RF-19, D29).
- **Fila `PUBLIC` que se deja además en `generic`:** manda `generic` (el código **sí** está en esa
  hoja) y, con `limit = "n"`, **no** cumple su regla → `MALFORMED_GUEST`; el arreglo es **borrar esa
  fila** y llevar el código público a la hoja `public` (RF-19, D31).
- **Fila con respuesta y celdas de asistentes vacías** (típico de la genérica y la pública, que
  dejan `child_guests` y `child_attendees` vacíos): se leen como **cero**; la fila **no** es inválida y
  la **consulta por teléfono no responde `INVALID_DATA`** (RF-20, D33).
- **Celda de asistentes presente pero incoherente** (`"x"`, `-1`, `1,5`): `INVALID_DATA` (RF-13,
  RF-20).
- **Libro sin hoja `public` en una boda `public`:** fallo visible (`INVALID_DATA`); la hoja es
  **obligatoria** en ese tipo (RF-4, RF-19).
- **Libro sin hoja `public` en una boda `generic`:** **no** es un fallo: la hoja solo es obligatoria en
  la pública (RF-4, RF-19).
- **Código genérico o público con niños:** no se ofrecen; el límite del código cuenta **adultos**
  (D12, RF-9).
- **Código de la hoja `generic` usado por muchos invitados:** el límite es **por respuesta**; el
  código no se agota (RF-9).
- **Asistentes por encima del cupo** (cupo de la fila en la personalizada o límite del código en la
  genérica y la pública): se impide antes de enviar y el servicio también lo rechaza (RF-9).
- **Plazo vencido:** el bloque sigue visible e indicado y no se ofrece enviar; si el envío ya salió,
  el servicio lo rechaza y se muestra como plazo vencido, **distinto** de un fallo técnico (RF-11,
  RF-14).
- **`deadline` del maestro vacío o ilegible:** **sin plazo**: no se rechaza por plazo y se puede
  contestar siempre (RF-11).
- **`generic_json_cache` vacía o ilegible, o sin el código pedido:** los códigos se leen de la hoja
  `generic` y la caché se **refresca** con lo leído (D23, RF-18).
- **`generic_json_cache` que discrepa de la hoja `generic`:** manda la hoja y la caché se actualiza
  (RF-18).
- **Cambio de teléfono de un invitado genérico o público:** al contestar con un teléfono distinto, el
  servicio crea una fila nueva; la anterior queda (no se puede reconocer que es la misma persona)
  (RF-8).
- **Respuesta personalizada con el `phone` de su fila vacío:** no pasa nada: en la personalizada el
  teléfono no se usa para identificar (RF-7).
- **Edición de una respuesta ya enviada:** en la personalizada, una segunda respuesta deja `updated`;
  en la genérica y la pública, el mismo teléfono actualiza la misma fila (RF-7, RF-8, RF-10).
- **Doble clic:** se impide el envío repetido mientras hay uno en curso **en esa página** (RF-14).
  **Dos pestañas:** no se coordinan (sin persistencia) y el servicio es la autoridad; no se promete
  deduplicación en el cliente.
- **Campos opcionales ausentes** (acompañante, niños, mensaje, restricciones): no rompen la
  personalización ni el envío (RF-13).
- **Envío sin conexión:** se muestra el fallo y se ofrece reintentar; no se pierde lo escrito (RF-14).
- **Filas declaradas y vacías al final de la hoja `guests`:** se ignoran (RF-4).
- **Teléfono con ceros a la izquierda o el número abreviado por la hoja** (en el ejemplo, la columna
  trae formato numérico): el servicio deberá normalizarlo a **10 dígitos** y guardarlo como **texto**,
  sin recortarlo (D6, RF-8).
- **`guest_id` precargados que son texto** (p. ej. con iniciales y sufijo numérico): **no** cuentan
  para el autoincremental; el `guest_id` nuevo es el **mayor entero + 1** (RF-8).

## 7. Fuera de alcance

- **Traer la información de la boda del servicio:** el contenido sigue en el registro local (spec
  002).
- **Notificaciones a la pareja** (correo, WhatsApp o similares) al recibir una respuesta: la
  respuesta queda en el libro y no se avisa a nadie.
- **Cambiar el modelo de los libros** (añadir hojas, columnas, tipos, códigos o estados) **por
  iniciativa propia**: esta spec **consume** los libros tal como están. La **única** incorporación es
  la hoja **`public`** (`public_id`, `limit`), que entra **por petición expresa** y con su regla de
  resolución (RF-19, D29, §10). Crear el maestro y los libros de invitados, dar de alta las bodas y
  los códigos y publicar el script es **trabajo externo** a la app.
- **Gestionar `is_active`** (activar y desactivar bodas desde la app): es un dato del maestro, sin
  panel ni lógica de gestión en esta iteración (D14).
- **Regenerar, migrar o reimportar los libros reales** (ni desde el modelo anterior, ni desde otros
  canales).
- **Generar o repartir los enlaces** a partir de los códigos: los reparte quien organiza.
- **Invalidación de caché del servicio:** sigue siendo una operación manual.
- **Panel de administración** para crear bodas, códigos o editar hojas.
- **Coordinar respuestas entre pestañas o deduplicar en el cliente** (RF-14).
- **El tope global de asistentes de la boda** contando la suma de todas las respuestas: sigue como
  está (ver `PENDING_TASKS.md`); el cupo de la fila y el límite del código sí entran (RF-9).
  `confirmacion.maximoBoda` **sale de la lógica de cupos** (D23).
- **Los tres tipos del modelo local** (personalizada / reutilizable / genérica): quedan **derogados**;
  los tres tipos de esta spec son personalizada, genérica y pública (RF-5).
- **Los parámetros `codigo`/`code`/`inv`:** quedan **jubilados** (RF-2).
- **`confirmacion.fechaLimite` del registro local:** queda **retirado**; el plazo lo da el maestro
  (RF-11).
- **El envío nativo a FormSubmit.co** (`marca.enlaces.rsvp`): queda **retirado**; la respuesta la
  registra el servicio de registro (RF-14).
- **Otros destinos externos del RSVP** además del servicio de registro.
- **Verificar contra el servicio en vivo:** la verificación automática va contra los **artefactos
  versionados** del contrato (el módulo y el documento), no contra el servicio (RF-17, RNF-10).
- **Gestión de `.gitignore` por la app:** la regla de exclusión de los libros es una tarea de
  preparación (D19, T1), no una funcionalidad de la invitación.

## 8. Criterios de finalización

- La invitación localiza la boda en el maestro por `slug`, abre el libro de invitados por
  `guests_sheet_id` y resuelve el código según el tipo que declara `guest_type` (RF-2, RF-3, RF-5).
- Se sirven los **tres tipos**: la personalizada precarga nombre, acompañante y cupo y no pide
  teléfono; la genérica y la pública piden nombre y teléfono y acotan los adultos al límite del
  código (RF-5, RF-6, RF-8, RF-9).
- Al abrir una invitación **personalizada** sin respuesta, el servicio deja `viewed` en su fila; si
  ya había respuesta, no la sobrescribe (RF-6, RF-10).
- Una respuesta **personalizada** escribe asistentes, mensaje, restricciones, estado y `datetime` en
  su fila, sin tocar la identidad ni el cupo (RF-7).
- Una respuesta **genérica o pública** se identifica por teléfono: crea una fila con `guest_id` entero
  autoincremental (mayor entero + 1) o actualiza la del mismo teléfono, escribe el **cupo** del
  código en `adults_guests`, deja `child_guests`/`child_attendees` vacíos y **no** registra el código
  usado (RF-8, D7, D11).
- Se respetan los **cuatro estados** del libro y **todos son reversibles** mientras el plazo esté
  abierto: no queda ninguna noción de estado terminal (RF-10).
- El **plazo** sale del `deadline` del maestro, la app lo muestra y el servicio lo hace valer; se
  interpreta en la zona del libro, es un **valor fijo** (no `NOW()`), un `deadline` vacío significa sin
  plazo y `confirmacion.fechaLimite` ya no existe en el registro (RF-11, D23, D28).
- La confirmación ya **no** usa FormSubmit ni ningún canal de correo; el resultado se resuelve en la
  página (RF-14).
- `codigo`/`code`/`inv` dejan de usarse y **no** queda alias alguno; el enlace usa `guest` (RF-2).
- El **teléfono** es obligatorio y llave en la genérica y la pública, se normaliza a 10 dígitos y
  **no** se persiste en el navegador (RF-8, RNF-2).
- Boda desconocida, boda ya no accesible, código desconocido, libro no disponible, sin `guest`,
  respuesta inválida, servicio caído, servicio sin configurar y plazo vencido producen **degradación
  visible**, con la confirmación **visible pero deshabilitada** y su motivo, nunca una confirmación
  falsa (RF-12, RF-13, D10).
- **RF-15 cumplido:** sin configuración la app **no** intenta ninguna llamada y entra en modo demo;
  con configuración, la llamada va a la ubicación configurada.
- El **contenido de la boda** sigue viniendo del registro local y los comportamientos actuales
  (portada, tema, música, cuenta regresiva, galería y visor) se conservan (RF-16).
- El repositorio **no** contiene libros reales ni datos personales: el contrato vive en **dos
  artefactos versionados** (el módulo `src/constants/contract.js` y el documento
  `docs/servicio-invitados.md`) y los libros reales quedan **excluidos por `.gitignore`** y en el disco
  (RF-17, RNF-2, D18, D19).
- La **caché de códigos** (`generic_json_cache`) se escribe al leer la hoja `generic` (cuando está
  vacía, ilegible o no trae el código), tiene la forma del mapa `código → límite` y la hoja `generic`
  manda si discrepan (RF-18, D23).
- **El código público vive en su propia hoja `public`** (`public_id`, `limit`): el tipo `public`
  resuelve ahí, el tipo `generic` cae en ella si el código no está en `generic` y el maestro gana la
  caché `public_json_cache` (RF-19, D29, D32).
- **La consulta por teléfono de una fila ya registrada** devuelve la respuesta anterior aunque sus
  celdas de asistentes estén **vacías** (se leen como **cero**); solo una celda **presente** e
  incoherente es un fallo (RF-20, D33).
- La **tabla de códigos de error** (§4.1) está en el módulo y el documento la reproduce; la app
  distingue cada causa por su código (RF-12, RF-14, RNF-10).
- **HU-6 cumplida:** un envío real llega a la hoja `guests` del libro de la boda, con el nombre y el
  teléfono de quien responde; una segunda respuesta con el mismo teléfono **actualiza** esa fila y no
  la duplica (comprobado en la verificación manual y anotado en «Verificación»).
- **Verificación:** `npm test` (`node --test`) y `npm run build` en verde; la verificación automática
  de la forma del envío y de la lectura va contra el **módulo** del contrato y el documento reproduce
  sus literales y su tabla de códigos (RF-17, RNF-10); verificación manual en navegador (escritorio y
  móvil) de un envío real de cada tipo, anotada en «Verificación» (principio 4).

### Gobernanza — documentos y pruebas que esta spec crea o actualiza

> El descarte del intento anterior dejó el árbol en el estado de la spec 003: **no existen** todavía
> `docs/servicio-invitados.md`, `gas/Code.gs`, `gas/README.md`, `src/constants/contract.js`, las
> piezas de servicio (`src/services/`, `src/utils/` de RSVP) ni las pruebas nuevas. Esta spec las
> obliga a **crear**; la fase de plan fija su forma exacta.

- **`.gitignore`:** **se actualiza** con la regla que **excluye los libros reales** (p. ej.
  `gas/*.xlsx`), para que no se versionen aunque estén en el árbol (B2, D19, RNF-2, RF-17). Es la
  **primera** tarea del plan (el riesgo está abierto hoy).
- **`src/constants/contract.js`:** **se crea** como **fuente única** del contrato: versión, parámetro
  del enlace, nombres de hoja y de columna del modelo, estados, valores especiales (`PUBLIC`, `"n"`), el
  **tiempo de espera (10 s)** y la **tabla de códigos de error** (§4.1) (D18, RF-17).
- **`docs/servicio-invitados.md`:** **se crea** como **documento humano derivado** del módulo: el
  maestro (columna a columna), el libro de invitados (sus hojas, columna a columna y con sus tipos), la
  resolución (`slug` → `guest_type` → `guests_sheet_id` → código), los tres tipos y el tipo por boda, la
  lectura (incluido el `viewed` de la personalizada) y la escritura con los nombres de columna del
  libro, los cuatro estados reversibles, el teléfono como llave (10 dígitos, texto), el cupo en
  `adults_guests`, el `guest_id` entero autoincremental, la caché de códigos, la estrategia CORS y los
  códigos de error (D18, D27, RF-17).
- **`test/serviceContract.test.js`:** **se crea** y comprueba, leyendo el módulo y el documento como
  texto, que `docs/servicio-invitados.md` contiene **al menos una vez** cada literal del módulo
  (nombres de hoja y de columna, estados, valores especiales, acciones, el parámetro `guest` y el
  tiempo de espera) y que su **tabla de códigos de error** coincide con la del módulo: **el mismo
  conjunto de códigos** y, para cada uno, su **mensaje de interfaz** exacto. **No** comprueba el campo
  booleano `retryable`, que el documento explica en prosa (M9, D18, RNF-10).
- **`gas/Code.gs`:** **se crea** el script que implementa el contrato: leer el maestro por `slug`,
  respetar `is_active`, detectar `slug`/`guests_sheet_id` duplicados, abrir el libro por
  `guests_sheet_id`, resolver el código según el tipo (normalizado), leer y escribir las columnas del
  libro **por el nombre de su cabecera**, escribir `viewed` al abrir la personalizada sin respuesta,
  tratar el teléfono como llave (10 dígitos, texto), asignar el `guest_id` autoincremental, usar los
  cuatro estados, escribir el cupo en `adults_guests`, mantener la caché y validar el `deadline` del
  maestro. **`gas/README.md`:** **se crea** la puesta en marcha (crear el maestro con su hoja `files` y
  sus columnas; dar de alta cada boda con el id de su libro de invitados, su `guest_type`, su
  `deadline` como **valor fijo** y su `is_active`; preparar el libro de cada boda con `guests` y
  `generic` y sus cabeceras; llenar los códigos de `generic`, incluido `PUBLIC`; publicar la aplicación
  web; comprobar a mano la lectura y la escritura de cada tipo).
- **`docs/constitution.md`:** el principio 5 cambia (el teléfono entra en el alcance y es la llave de
  la genérica y la pública; los libros reales —con datos personales— se **excluyen por `.gitignore`** y
  el contrato es un **módulo + documento** que la app consume) y revisar el principio 6 (la excepción de
  idioma pasa a los **nombres de hoja y columna** y a los **códigos de error** del modelo del servicio).
- **`AGENTS.md`:** la personalización (parámetro `guest`, configuración del despliegue,
  `useInvitation`) y el envío (nuevo hook de RSVP y `Rsvp`), con los tres tipos, el teléfono como
  llave, el cupo, los cuatro estados y los códigos de error; también la nota de que la confirmación ya
  no usa FormSubmit y de que los libros reales se ignoran en git.
- **`README.md`:** la tabla de campos y, sobre todo, la sección «Enlaces de invitación» (hoy
  `index.html?codigo=…` y los tres tipos viejos, ~líneas 95–106), que pasa a `guest`, a los tres tipos
  nuevos y a la descripción de los libros.
- **`test/contracts.test.js`:** **se reescribe** en los puntos del modelo: parámetro del enlace
  (`guest`) y ausencia de los jubilados `codigo`/`code`/`inv`, ausencia de `enlaces?.rsvp` y de
  FormSubmit, claves del registro y anclas. (Las fichas de ejemplo **no** se vigilan aquí: son
  fixtures de `guest-cards.test.js`.)
- **`src/data/guest-cards.js`** y **`src/data/guest-cards.test.js`:** **dejan de personalizar** la
  invitación (RF-1). Se **conservan** como **ejemplos ficticios** que sirven de **fixtures** a
  `guest-cards.test.js`, con la nueva forma (tres tipos, teléfono y los cuatro estados) y sin la
  validación de límite 1–10 ligada a `maximoBoda`; la app **no las importa en ejecución** y el **modo
  demo no las usa** (D22).
- **`src/app/App.jsx`**, **`src/hooks/useInvitation.js`**, **`src/components/sections/Rsvp.jsx`** y
  **`src/utils/validation.js`:** la app **deja de importar** las fichas de ejemplo en ejecución
  (RF-1, D22): `registryErrors` pasa a validar **solo el registro de la boda**
  (`registryErrors(wedding)`), sin las fichas, y se retira la comprobación de conflicto de niños, que
  solo tenía sentido contra una ficha local (RF-13).
- **`src/utils/validation.js`** y **`src/utils/validation.test.js`:** `registryErrors` pierde el
  segundo parámetro (las fichas) y su prueba se ajusta a la firma nueva: el caso «conflicto de niños
  es error» **desaparece** (no hay ficha local que lo provoque) y el resto se conserva.
- **`src/utils/restrictions.js`** y **`src/utils/restrictions.test.js`:** se retira
  `hasChildrenConflict` (queda **sin consumidor** tras el cambio anterior); `allowsChildren` y
  `restrictionMessages` se conservan.
- **`src/data/wedding.js`** y **`src/data/wedding.test.js`:** se quita `confirmacion.fechaLimite` (el
  plazo lo da el servicio, RF-11) y `marca.enlaces.rsvp` (el envío ya no va a FormSubmit, RF-14);
  `confirmacion` conserva título, descripción y `camposHabilitados`. `confirmacion.maximoBoda` **sale de
  la lógica de cupos** (D23).
- **`src/utils/invitation.js`** y **`src/utils/invitation.test.js`:** **se reescriben**: parámetro
  `guest` **recortado** (la comparación **normalizada** —sin distinguir mayúsculas— la hace el
  **servicio**, D24), los tres tipos por `guest_type`, el cupo y el límite del código; desaparecen la
  inferencia de tipos y el tope por `maximoBoda`.
- **`src/utils/confirmation.js`** y **`src/utils/confirmation.test.js`:** se ajustan: el plazo ya no
  sale del registro local (RF-11).
- **`src/hooks/useInvitation.js`:** se ajusta: la invitación se resuelve contra el servicio, no contra
  las fichas locales (RF-1).
- **`src/components/sections/Rsvp.jsx`:** **se reescribe** (hoy es un POST nativo a FormSubmit): pasa a
  resolver el envío contra el servicio, con nombre y teléfono en la genérica y la pública (también para
  rechazar) y con el bloque deshabilitado cuando no hay invitación (RF-8, RF-12, RF-14).
- **Piezas nuevas que hoy no existen** (la fase de plan fija sus nombres y su reparto): la llamada al
  servicio (`src/services/`), la lectura/validación de la respuesta y el cuerpo del envío (`src/utils/`,
  puras), la configuración (`src/constants/`, configuración del despliegue) y el hook del estado de
  envío (`src/hooks/`), con sus pruebas co-locadas (RNF-9, RNF-10).
- **`specs/002-modelo-datos-boda/spec.md`:** su RF-18 sigue derogado (bloque visible y deshabilitado,
  RF-12); su modelo local de tres tipos queda **sustituido** por los tres tipos de esta spec y su
  `confirmacion.fechaLimite` deja de ser el plazo. Hace falta una **nota de actualización** que lo
  registre.
- **`test/andamiaje.test.js`:** **no** requiere cambios por estos motivos; vigila `?invitados=N` y la
  ausencia de Bootstrap, no el contrato del servicio.
- **`MEMORY.md`** y **`PENDING_TASKS.md`:** al final; la entrada del RSVP sin servicio y la de límites
  fuera de rango dejan de aplicar como estaban.

## 9. Dudas abiertas

**Las dudas del cuerpo están todas resueltas** (todo lo que estaba pendiente se resolvió; se listan
las decisiones para que queden registradas: las de las vueltas anteriores en §9.1 y §9.2, las de la
segunda vuelta del QA en §9.3 y las de la gobernanza de cierre en §9.4). Las del **cambio de
requisitos de §10** quedan **abiertas** y se listan en **§10.9**, con su recomendación y su motivo.

### 9.1 Resueltas antes del QA (vuelta anterior)

1. **De dónde sale el tipo.** Lo **decide** la columna `guest_type` del maestro: **una boda, un
   tipo**; no se infiere de la forma de la respuesta ni se mezclan tipos dentro de una boda (D3, RF-5).
2. **Atribución y teléfono.** **Un libro de invitados por boda** (`guests_sheet_id`), y eso atribuye
   cada respuesta a su boda; la fila del ejemplo en la que dos bodas compartían id era un **error del
   ejemplo**; el teléfono es la llave **dentro del libro de esa boda**; **no** se añade columna de
   boda a `guests` (D4, D5, RF-3, RF-8).
3. **`PUBLIC` y los niños.** `limit = "n"` significa **sin tope**; la genérica y la pública **no**
   ofrecen niños; el límite de un código cuenta **adultos** y es **por respuesta** (D12, RF-9).
4. **Plazo.** **Manda el `deadline` del maestro** y es el **único** plazo: se retira
   `confirmacion.fechaLimite`; un `deadline` **vacío** significa **sin plazo**; si el servicio no
   responde, no hay plazo que mostrar y el bloque queda deshabilitado (D9, RF-11, RF-12).
5. **Estados.** Los cuatro del libro, **todos reversibles** mientras el plazo esté abierto: **no hay
   estado terminal**. `viewed` **solo** en las personalizadas y lo escribe el **servicio al abrir**,
   únicamente si la fila aún no tiene respuesta. Para anular una confirmación se **vuelve a
   contestar** (p. ej. con `rejected`); no se inventa estado de cancelación (D8, RF-10, RF-12).
6. **Caché de códigos.** `generic_json_cache` es un **mapa JSON `código → límite`** (incluida
   `"PUBLIC": "n"`) que **escribe el servicio** al leer la hoja `generic`; la hoja es la **fuente** y
   la caché una **copia**; si discrepan, manda la hoja; vacía o ilegible → se lee la hoja. Existe para
   **no abrir el libro del invitado solo para validar un código** (D13, RF-18).
7. **`guest_id` y teléfono.** `guest_id` entero **por libro** = **mayor entero existente + 1**,
   **ignorando** los `guest_id` de texto; teléfono **normalizado a 10 dígitos** y guardado como
   **texto**; nada de ids por boda (D6, RF-8).
8. **`is_active` en falso.** Es «**boda ya no accesible**»: el servicio **deniega** el acceso y la app
   lo nombra como causa propia, **distinta** de «boda desconocida», sin panel ni gestión de datos
   (D14, RF-3, RF-12).
9. **Cupo y código usado.** El cupo es **por envío** (cada invitado trae hasta su `limit` en su propia
   respuesta; el código no se agota). El **código usado no se registra**: al crear la fila el
   servicio escribe el **límite del código en `adults_guests`** (el cupo de esa fila) y
   `adults_attendees` recoge lo que asiste; `child_guests`/`child_attendees` quedan vacíos; al
   reenviar con el mismo teléfono se **actualiza esa misma fila** con el límite del código del envío
   (D7, RF-8, RF-9).

### 9.2 Resueltas tras el QA (esta vuelta)

1. **Contrato.** El artefacto que **consume la app** es el **módulo** `src/constants/contract.js`
   (versión, nombres de campo, parámetros y **códigos de error**); `docs/servicio-invitados.md` es el
   **documento humano** derivado, y una **prueba automática** comprueba que el documento no omite
   ningún campo ni código del módulo (**D18**, RF-17, RNF-10, B1, M9).
2. **Libros reales.** Se **excluyen por `.gitignore`** (`gas/*.xlsx` o equivalente) y se **conservan en
   disco**; la spec lo exige y el plan lo pone como **primera tarea** (**D19**, RNF-2, RF-17, B2).
3. **Tipo.** El servicio devuelve el **`guest_type` resuelto**; la app nunca lo deduce (**D20**, RF-5).
4. **Celdas vacías y `limit`.** Una fila **sin respuesta** (`viewed` o `status` vacío) **puede** tener
   las celdas de asistentes vacías y queda **exenta** del cuadre; un `limit` entero **≤ 0** es
   **inválido** (**D21**, RF-9, RF-13, I1, I2).
5. **Fichas de ejemplo.** Se **conservan** como **ejemplos ficticios** para el desarrollo y las
   pruebas puras, **sin personalizar**; el **modo demo no las usa** (**D22**, RF-1, RF-15, I5).
6. **Dudas anteriores.** (a) el `deadline` se interpreta en la **zona del libro/hoja**; (b)
   `generic_json_cache` se reescribe **solo si está vacía o ilegible** (o si no trae el código); (c) un
   teléfono que no llega a 10 dígitos se **rechaza visiblemente**; (d) `confirmacion.maximoBoda`
   **sale de la lógica de cupos** (**D23**, M8).
7. **Código `guest`.** Se compara **normalizado** (`trim`, sin distinguir mayúsculas/minúsculas)
   (**D24**, RF-2, I6).
8. **Tiempo de espera.** **10 s** antes de dar el servicio por no disponible (**D25**, RF-12, RNF-4,
   I8).
9. **Rechazar con nombre y teléfono.** En la genérica y la pública, el rechazo exige nombre y teléfono,
   igual que confirmar (**D26**, RF-8, M4).
10. **CORS realizable.** El contrato fija método, contenido que evita el preflight y respuesta JSON
    (**D27**, RF-17, RNF-4, I10).
11. **Valores fijos y unicidad.** `deadline`/`datetime` son valores fijos (no `NOW()`) y el maestro no
    admite `slug` ni `guests_sheet_id` duplicados (**D28**, RF-3, RF-11, I11, M2, M6).
12. **Resto de hallazgos.** Columnas obligatorias vs. opcionales del maestro y hoja `generic` requerida
    solo por tipo (I4, I9), «sin `slug`» como causa propia sin reintento (I7, M3, RF-15), «boda
    desconocida» sin reintento (M3), `phone` como texto (I3), `guest_id` texto o entero (M7), RF-6
    aclara que el servicio no escribe en el **libro de invitados** al leer (M5).

### 9.3 Resueltas en la segunda vuelta del QA

1. **Los tres estados de la configuración.** La configuración normalizada distingue **sin URL** (modo
   demo, `NOT_CONFIGURED`), **URL sin `slug`** (`MISSING_SLUG`, aviso propio y **sin reintento**) y
   **ambos** (`ready`), de modo que la causa «sin `slug`» de RF-15 es alcanzable (N1; plan §5.1 y
   §5.4).
2. **El contrato, sin contradicción.** RNF-1 nombra los **dos artefactos** y cuál manda: el módulo es
   la fuente única y el documento es derivado (N2; D16, D18, RF-17).
3. **Copy de `MISSING_FIELDS`.** Vale tanto para **confirmar** como para **rechazar** (N3; D26, RF-8).
4. **Dos códigos distintos.** `INVALID_DATA` queda para los datos **de lectura** inválidos o
   incoherentes (RF-13) y `INVALID_RESPONSE` para la respuesta **rechazada** en un envío (RF-14): cada
   uno tiene su causa y su mensaje (N4).
5. **La validación del registro no usa las fichas.** `registryErrors(wedding)` valida **solo el
   registro**; la app deja de importar `guest-cards.js` en ejecución y las fichas quedan como
   **fixtures** de `guest-cards.test.js`; se retira `hasChildrenConflict` (sin consumidor) (N5; D22,
   RF-1, RF-13).
6. **La normalización del código es del servicio.** La app solo **recorta** el parámetro `guest`; no
   hay ninguna función de normalización en la app (N6; D24, RF-2).
7. **Alcance exacto de la prueba de sincronía.** Comprueba que el documento contiene **al menos una
   vez** cada literal del módulo y que la **tabla de códigos** coincide en **conjunto** y en el
   **mensaje** de cada uno; **no** comprueba `retryable` (N7; D18, RNF-10).
8. **Citas y verificación de las tareas.** T8 cita RF-2; **RNF-3** queda citado (T6, T7 y T10); la
   comprobación «contra un despliegue real» se mueve de T9 a T10 (N8).

### 9.4 Gobernanza de cierre (observaciones G1–G5)

1. **`utils/validation.test.js` entra en el plan.** El caso «conflicto de niños es error» llamaba
   `registryErrors(wedding, [{…}])` y **fallaría** con la firma nueva (RF-1, D22); queda junto a
   `utils/restrictions.test.js` en las pruebas a reescribir (plan §12, §5.6, T8).
2. **El literal reservado `PUBLIC` vive en el módulo.** `PUBLIC_CODE = "PUBLIC"` se añade al
   inventario de `contract.js` para que la prueba de sincronía vigile ese **valor especial** (RF-17).
3. **`SERVICE_UNAVAILABLE` ampara la respuesta fuera de contrato.** Su causa incluye que el servicio
   «responda algo que no respeta el contrato» (plan §5.3, G3); el código no cambia de alcance.
4. **Importadores de las fichas, todos nombrados.** `App.jsx`, `useInvitation.js`, `Rsvp.jsx` y
   `validation.js` (§8); las pruebas no importan fichas.
5. **Estado de la spec.** Deja de ser borrador: aprobada por quien la pide y en revisión de cierre
   tras el QA, sin requisitos abiertos.

## 10. Cambio de requisitos posterior (hoja `public` independiente y lectura tolerante de celdas vacías)

Esta sección sigue el **mismo patrón** que el **§13** y el **§14** de la spec 005: se añade al
final, con identificadores que **no** colisionan **dentro de esta spec** (el cuerpo llega a `RF-18` y
a `D28`; aquí se usan **`RF-19`**/`**RF-20**` y **`D29`**…**`D34`**). **Aviso de colisión con otras
specs:** la spec 005 usa `RF-16`/`RF-17` y `D21`/`D22` para **otra** cosa; al citarlos desde aquí se
escribe **«005 RF-16»**, **«005 RF-17»**, **«005 D21»**, etc. Dice **dónde toca** el cuerpo y **qué
deroga o matiza** respecto de la 004 y de la 005. Cuando algo de aquí contradiga el cuerpo, **manda
esta sección**. El cambio lo pidió quien usa la invitación **después** de implementadas y validadas la
004, la 005 y sus §13/§14, y parte del **estado real del código y del libro** (no de un modelo
imaginario).

### 10.0 Contexto: los dos casos reales que motivan el cambio

- **Caso A — la hoja del código público.** El libro de invitados de una boda **tenía** el código
  público en la hoja `generic`, junto a los códigos genéricos, y **eso ya no es así**: el código
  público **se ha movido** a una **hoja propia** llamada **`public`**, con las columnas **`public_id`**
  y **`limit`**, «para no ensuciar los datos de `generic`».
- **Lo que hace hoy el servicio** (comprobado en `gas/Code.gs`): `SHEET_NAMES` (~líneas 42-46) solo
  declara `MASTER`, `GUESTS` y `GENERIC`; `resolveCode_` (~354-410) resuelve el código **solo** en la
  hoja `generic` (con la caché `generic_json_cache` y, si no está, con `readGenericLimits_`), y
  `readGenericLimits_` (~433-463) busca la hoja por su nombre literal. **Consecuencia:** un código que
  está en la hoja `public` **no se encuentra** → el servicio responde **`UNKNOWN_GUEST`** («No
  encontramos esta invitación.»). La app **no** es la causa: no inventa códigos, solo usa el que
  trae el enlace.
- **Caso B — el teléfono ya registrado que responde `INVALID_DATA`.** En una **invitación
  genérica**, con un teléfono **ya registrado**, la **consulta por teléfono** (`lookup`, 005 RF-8)
  responde `{"ok":false,"code":"INVALID_DATA"}` en lugar de devolver la respuesta anterior.
- **Diagnóstico del caso B (comprobado en el código):** `lookupResponse_` (~líneas 616-621) lee
  `adults_attendees` y `child_attendees` con `parseCount_`, que devuelve `null` para una celda
  **vacía** (~983-990), y responde `INVALID_DATA` si alguna de las dos es `null`. Pero la **escritura**
  de la genérica y la pública deja `child_guests` y `child_attendees` **vacíos** a propósito
  (`registerCodeResponse_`, ~915-916), porque esos dos tipos **no ofrecen niños** (D12). Resultado:
  **toda** fila genérica o pública **con respuesta** falla la consulta; el invitado ve «Los datos de
  esta invitación están incompletos.» y **no** ve su respuesta anterior.
- **El mismo defecto, latente, en la personalizada:** `resolvePersonal_` (~315-319) exige lo mismo, así
  que una fila personalizada con respuesta y `child_attendees` vacío también respondería
  `INVALID_DATA`.
- **La app no es la causa:** `count()` (`src/utils/invitation.js` ~46-50 y `src/utils/rsvp.js` ~33)
  **ya** trata un valor ausente o vacío como **cero**; el desajuste está entre el **servicio** (celda
  vacía = inválida) y la **app** (celda vacía = cero).
- **Los dos casos son independientes:** el primero es un cambio del **modelo del libro** (una hoja
  nueva) y el segundo, un cambio de la **regla de lectura** (celda vacía = cero). Los decide quien
  pide el cambio y ambos tocan el **servicio** (`gas/Code.gs`).

### 10.1 Los dos pedidos y su reparto (contrato/servicio ↔ datos)

| # | Pedido (texto de quien la pide, resumido) | Requisitos | ¿De quién es el cambio? |
| --- | --- | --- | --- |
| 12 | «Acabo de cambiar la clave pública a una hoja independiente para no ensuciar los datos de `generic`. La hoja se llama `public`, las columnas `public_id`, `limit`.» | **RF-19**, **D29**, **D30**, **D31**, **D32** | **Modelo del libro y servicio**: una hoja nueva en el libro de invitados y la regla de resolución por tipo. **No** es solo un cambio de datos: el servicio tiene que **leer** esa hoja. |
| 13 | «Estoy usando un teléfono ya registrado en una invitación genérica… me contesta con `{"ok":false,"code":"INVALID_DATA"}`.» | **RF-20**, **D33** | **Servicio** (regla de lectura de las celdas de asistentes). **No** cambia la forma del intercambio (no hay campo ni acción nuevos): la forma del modelo del libro la aporta el pedido 12. |

**Lo que el pedido 13 NO pide (y no se hace):** inventar un dato, «rellenar» la fila del libro ni
devolver un teléfono o una fila ajena. La fila **se queda como está**; lo que cambia es **cómo se
lee**: una celda vacía vale por cero.

### 10.2 Decisiones del cambio (D29–D34)

- **D29 — Cada tipo resuelve en su hoja, y la genérica puede caer en `public` si el código no está en
  `generic`.** `personal` → **`guest_id`** en `guests`; `generic` → **`generic`** (obligatoria) y, si
  el libro **también** tiene hoja `public` y el código pedido **no está** en `generic`, **se busca en
  `public`**; `public` → **`public`** (obligatoria) y la hoja `generic` **ya no hace falta** para
  servirla. El orden es **el del tipo**: primero su hoja, y solo después la otra.
  **Por qué:** es lo que hace falta para que el cambio de datos del caso A **sirva de algo** sin
  tocar el maestro (la boda sigue siendo `generic`) y sin convertir `generic` en un cajón de sastre.
  **Alternativas descartadas:** (a) cambiar el `guest_type` de la boda a `public` —obligaría a
  repartirse un enlace único y a perder los códigos genéricos—; (b) buscar **siempre** en las dos
  hojas, sin prioridad —haría que un código duplicado se resolviera por la hoja «menos probable», que
  es como aparecen los fallos difíciles de diagnosticar—; (c) que el servicio **no** mirara `public` en
  una boda genérica —entonces el código público de una boda genérica **no resolvería nunca**—.
- **D30 — El `limit` de `public` habla el mismo idioma que el de `generic`.** Un **entero mayor que
  cero** es el **cupo por respuesta** de ese código y el texto **`n`** es **sin tope** (el caso
  normal: el código reservado `PUBLIC` con `"n"`). **Por qué:** un mismo modelo de datos para las
  dos hojas hace que el servicio, la app y el documento puedan aplicar **la misma** regla, y evita que
  «sin tope» dependa de la hoja.
  **Alternativas descartadas:** (a) obligar a `n` en `public` —deja sin poder hacer una invitación
  pública **con tope**, que es un caso real—; (b) inventar un valor por hoja —obligaría a la app a
  conocer la hoja de cada código, que es justo lo que el servicio debe resolver—; (c) dejar el
  `limit` de `public` **libre** (texto o número sin regla) —convertiría un dato mal escrito en un
  cupo inventado—.
- **D31 — La hoja `generic` queda con códigos genéricos de límite entero > 0; se deroga el RF-17 de
  la spec 005.** El código reservado `PUBLIC` **sale** de `generic` y vive en `public`. Una fila
  `PUBLIC` **que se deje** en `generic` pasa a ser **un código genérico más**: con `limit = "n"` no
  cumple la regla de esa hoja y responde **`MALFORMED_GUEST`** (005 RF-16, D21) —**no**
  `INVALID_DATA`—. El arreglo es de **datos**: **borrar esa fila** (o darle un límite entero).
  **Por qué:** es lo que pidió quien pide el cambio («para no ensuciar los datos de `generic`») y lo
  que hace el modelo coherente: una hoja, un idioma.
  **Alternativas descartadas:** (a) **mantener** la excepción de 005 RF-17 (`PUBLIC` con `"n"` en una
  boda genérica = sin tope) —dejaría **dos** sitios donde decir «sin tope» y mantendría el fallo
  opaco—; (b) **borrar** la fila automáticamente —el servicio **no** modifica datos del libro—; (c)
  aceptar `n` en **cualquier** código de `generic` —un cupo mal escrito se convertiría en una
  invitación sin tope—.
- **D32 — El maestro gana una segunda caché: `public_json_cache`.** `generic_json_cache` **se
  conserva** tal como está (mapa JSON `código → límite` de la hoja `generic`) y `public_json_cache`
  es su equivalente para la hoja `public`; **las dos** son **opcionales** y se refrescan **solo**
  cuando están vacías, son ilegibles o no traen el código pedido (RF-18, D23).
  **Por qué:** la caché existe para **no abrir el libro** solo para validar un código; el patrón ya
  existe y **duplicarlo** es más barato que cambiar el formato de la que ya hay.
  **Alternativas descartadas:** (a) **un solo** mapa con un espacio de nombres por hoja
  (`generic:…`, `public:…`) —**rompe** el formato de la caché existente y obliga a **migrar** a
  mano—; (b) meter los dos mapas en **una** celda con una estructura nueva —lo mismo, con el añadido
  de que se pierde la caché si alguien edita la celda—; (c) **no** cachear `public` —la hoja es
  pequeña, pero entonces `public` abriría el libro en cada resolución y quedaría detrás de `generic`
  solo por costumbre—.
- **D33 — Una celda de asistentes vacía vale por cero en toda lectura.** `adults_attendees` y
  `child_attendees` **vacías** se leen como **cero** en los **tres** tipos y en **todas** las lecturas
  (resolver, consultar por teléfono y escribir). Solo es **incoherente** una celda **presente** que
  **no** sea un entero ≥ 0 (`"x"`, `-1`, `1,5`): eso sigue siendo `INVALID_DATA`.
  **Por qué:** el servicio **escribe** esas celdas vacías **a propósito** (D12) y la app **ya** las
  lee como cero; el fallo del caso B es, exactamente, que el servicio no lo hacía.
  **Alternativas descartadas:** (a) **dejar** la celda vacía como inválida y obligar a la escritura a
  **rellenar** `child_attendees` con `0` —cambia el modelo de los libros (una fila que no ofrece
  niños pasa a llevar un cero) y no arregla las filas **ya** escritas—; (b) tratar la celda vacía como
  **cero** solo en la consulta —dejaría el mismo fallo en la personalizada—; (c) ignorar la columna si
  falta —eso es otra cosa: una **cabecera** ausente es un fallo real (RF-13)—.
- **D34 — El contrato sube a `1.3.0`.** `CONTRACT_VERSION` sube de `1.2.0` a **`1.3.0`** **a la vez**
  en el **módulo** (`src/constants/contract.js`) y en el **script** (`gas/Code.gs`).
  **Por qué:** el **modelo de los libros** cambia (una hoja nueva con sus columnas y una columna de
  caché nueva en el maestro) y el **módulo** es la fuente única de ese modelo (RF-17, D18): el
  contrato cambia de **contenido**, aunque **no** cambien la forma de las llamadas ni de las
  respuestas. De paso, la versión es la **señal** de que el despliegue es el nuevo: la salud del
  servicio (`doGet`) devuelve `contract`.
  **Alternativas descartadas:** (a) **no** subir la versión —el módulo cambiaría (literales nuevos)
  sin que nada lo delate, y un despliegue viejo quedaría **indetectable**—; (b) subirla solo en el
  script —la prueba de sincronía **falla** si el módulo y el script no coinciden—; (c) subirla a
  `2.0.0` —no hay ruptura de forma: no se retira ni se renombra nada (005 §14.5).

### 10.3 RF nuevos (criterios en EARS)

**RF-19 — El código público vive en su propia hoja `public`, y cada tipo resuelve en su hoja**
(pedido 12; D29, D30, D31, D32)

- El libro de invitados de una boda **podrá** tener una tercera hoja, llamada exactamente **`public`**,
  con las cabeceras exactas **`public_id`** y **`limit`** (RF-4, §1.1).
- DONDE la boda sea **`public`**, el código de enlace **deberá** ser un **`public_id`** de la hoja
  `public`, que es **obligatoria** en ese tipo; la hoja `generic` **no hace falta** para servirla y su
  ausencia **no** es un fallo (D29).
- DONDE la boda sea **`generic`**, la hoja `generic` **deberá** ser la que resuelva el código; SI el
  libro **también** tiene hoja `public` y el código pedido **no** está en `generic`, ENTONCES el
  servicio **deberá** buscarlo en `public` (D29). Los códigos se comparan **normalizados** (RF-2).
- DONDE la boda sea **`personal`**, el código es un `guest_id` de `guests` y **ni** `generic` **ni**
  `public` hacen falta (RF-5).
- El `limit` de la hoja `public` **deberá** hablar **el mismo idioma** que el de la hoja `generic`: un
  **entero mayor que cero** es el **cupo por respuesta** de ese código y el texto **`n`** significa
  **sin tope** (el caso normal: el código reservado `PUBLIC` con `"n"`); el servicio **no** deberá
  inventar un máximo (RF-9, D30).
- CUANDO el código **exista** en la hoja que le toca por su tipo **pero** su `limit` **no** cumpla la
  regla de esa hoja, el servicio **deberá** responder **`MALFORMED_GUEST`** (005 RF-16, D21) y **no**
  `INVALID_DATA`.
- SI la hoja `public` **existe** pero **le falta** la cabecera `public_id` o la cabecera `limit`,
  ENTONCES el sistema **deberá** fallar de forma **visible** (`INVALID_DATA`, RF-13).
- La hoja `generic` **deberá** quedar con **códigos genéricos** de límite **entero mayor que cero**:
  el código reservado `PUBLIC` **sale** de ella (D31). SI una fila `PUBLIC` **se deja** en `generic`,
  ENTONCES será **un código genérico más** y, con `limit = "n"`, responderá **`MALFORMED_GUEST`**; su
  arreglo es **borrar esa fila** (D31).

**RF-20 — La lectura tolera las celdas de asistentes vacías** (pedido 13; D33)

- Una **celda vacía** de `adults_attendees` o de `child_attendees` **deberá** leerse como **cero** en
  **toda** lectura y en los **tres** tipos: una fila **con respuesta** cuyas celdas de asistentes estén
  vacías **no** es una fila inválida y **no** deberá producir `INVALID_DATA` (D33).
- Solo una celda **presente** cuyo valor **no** sea un entero ≥ 0 (`"x"`, `-1`, `1,5`) **será**
  incoherente, y ENTONCES el sistema **deberá** fallar de forma **visible** (`INVALID_DATA`, RF-13).
- CUANDO la **consulta por teléfono** (`lookup`, 005 RF-8) encuentre una fila **ya registrada** en una
  invitación **genérica** o **pública**, el servicio **deberá** devolver **esa** respuesta (con
  `child_attendees` = **0**) y **no** `INVALID_DATA` (D33).
- La lectura de una fila **personalizada** con respuesta **deberá** seguir la misma regla: su
  `child_attendees` vacío es **cero** (esa invitación no ofrece niños) y **no** deberá producir
  `INVALID_DATA` (D33).
- La regla **no** relaja el resto del cuadre de RF-13: un `status` fuera de los cuatro estados, un
  `limit` que no cumpla la regla de su hoja (`MALFORMED_GUEST`), un `phone` ilegible o una cabecera
  que falta **siguen** siendo fallos visibles (RF-12, RF-13).

### 10.4 Qué queda derogado o matizado (de la spec 004 y de la spec 005)

- **004 §1 (vocabulario) — MATIZADO.** El «código de enlace» puede ser un **`public_id`** de la hoja
  `public` (RF-19).
- **004 §1.1 (modelo de datos) — MATIZADO.** El libro de invitados pasa de «dos hojas» a **hasta
  tres** (`guests`, `generic` y `public`); el maestro gana la columna **opcional** `public_json_cache`;
  la hoja `generic` **deja** de llevar el código reservado `PUBLIC` (RF-19, D31, D32).
- **004 RF-4 (hojas del libro) — MATIZADO.** El servicio reconoce la hoja `public` y su obligatoriedad
  depende del **tipo** (RF-19, D29).
- **004 RF-5 (qué código resuelve cada tipo) — MATIZADO.** El tipo `public` resuelve en `public` (y
  `generic` **ya no** hace falta para servirlo) y el tipo `generic` cae en `public` si el código no
  está en `generic` (RF-19, D29).
- **004 RF-6 (lectura de la invitación) — MATIZADO (una frase).** El límite que devuelve el servicio
  sale de la hoja que corresponde al tipo (RF-19).
- **004 RF-9 (cupo) — MATIZADO.** El `limit` de `public` sigue el mismo idioma que el de `generic`
  (D30) y un `limit` que no cumple la regla de su hoja es `MALFORMED_GUEST`, no `INVALID_DATA`
  (005 RF-16).
- **004 RF-13 (datos inválidos) — MATIZADO.** (a) La lista de hojas obligatorias cambia con el tipo
  (RF-19); (b) un `limit` que no cumpla la regla de su hoja **sale** de la lista (es
  `MALFORMED_GUEST`, 005 RF-16); (c) las cifras de asistentes **presentes** que no sean enteros ≥ 0
  **siguen** siendo inválidas, pero una celda **vacía** **deja** de serlo (RF-20, D33).
- **004 RF-18 (caché) — MATIZADO.** La caché de la hoja `generic` **se conserva** y la de `public` es
  su equivalente (D32).
- **004 D13 y D23 (caché) — MATIZADOS.** Hablan de las **dos** cachés, con la misma regla de refresco
  (D32).
- **004 §7 («cambiar el modelo de los libros») — MATIZADO.** La hoja `public` entra **por petición
  expresa**; lo demás sigue fuera de alcance (RF-19).
- **004 §4.1 (tabla de códigos) — SIN CAMBIOS.** Este cambio **no** añade **ningún** código ni altera
  **ningún** mensaje; lo que hace es **aclarar** la causa de `INVALID_DATA` (una cifra **presente**
  incoherente) y **remitir** a `MALFORMED_GUEST` para el código mal formado (005 RF-16).
- **005 §14 (RF-16, D21) — INTACTO.** `MALFORMED_GUEST` sigue siendo el error del código mal formado y
  `INVALID_DATA` sigue reservado a lo que impide leer o escribir de verdad.
- **005 §14 (RF-17, D22) — DEROGADO.** La excepción que hacía que el código reservado `PUBLIC` con
  `"n"` **dentro de una boda genérica** valiera por «sin tope» **deja de aplicar**: `PUBLIC` vive en
  la hoja `public` (D31). En una boda genérica, un `PUBLIC` con `"n"` en la hoja `generic` es un
  **código mal formado** (`MALFORMED_GUEST`) y su arreglo es **borrar esa fila**.
- **005 §14.8 (verificación manual, punto 13) — MATIZADO.** El caso «`PUBLIC` en una boda genérica →
  sin tope» **se sustituye** por «`PUBLIC` en la hoja `public` → sin tope», y por «código mal formado →
  `MALFORMED_GUEST`» (§10.7).
- **`gas/README.md` (punto 8, nota de diagnóstico) — MATIZADA.** La frase «una fila `PUBLIC` en la
  hoja `generic` de una boda `generic` nunca resuelve» **sigue siendo cierta**, pero **el motivo
  cambia**: ya no es `INVALID_DATA` sino **`MALFORMED_GUEST`**, y el arreglo pasa a ser «**borrar la
  fila** de `generic` **y** llevar el código público a la hoja `public`». La nota debe explicar además
  **qué hoja se mira** según el tipo (RF-19, D29).
- **005 §10 (puntos de verificación manual) — MATIZADOS.** Los puntos que usaban el código `PUBLIC` en
  la hoja `generic` **se rehacen** contra la hoja `public` (§10.7).
- **004 RF-1, RF-2, RF-3, RF-7, RF-8, RF-10, RF-11, RF-12, RF-14, RF-15, RF-16, RF-17 y RNF-1…RNF-10 —
  INTACTOS.** No cambian el modelo de la escritura, la llave por teléfono, el plazo, el contrato en
  módulo + documento ni la verificación.

### 10.5 Contrato: qué cambia, qué sube de versión y qué no

- **Lo que cambia (contenido del modelo):** el **módulo** `src/constants/contract.js` gana la hoja
  **`public`** (con sus columnas **`public_id`** y **`limit`**) y la columna **`public_json_cache`** del
  maestro, y su `CONTRACT_VERSION` pasa a **`1.3.0`**. El **documento** `docs/servicio-invitados.md`
  deriva lo mismo.
- **Lo que NO cambia:** la **tabla de códigos de error** (ningún código nuevo, ningún mensaje nuevo),
  los **tipos** (`personal`, `generic`, `public`), los **estados**, las **acciones** (`resolve`,
  `respond`, `lookup`), los **campos** de petición y de respuesta, el parámetro **`guest`**, el
  **teléfono** (10 dígitos), el **tiempo de espera** (10 s), los valores especiales `PUBLIC` y `n`, y
  la **forma** de las tres llamadas.
- **Por qué sube la versión:** el modelo de los libros cambia y el módulo es su fuente única (D34).
  La **prueba de sincronía** (`test/serviceContract.test.js`) **no cambia de regla**: sigue exigiendo
  que el documento no omita ningún literal del módulo, que la **tabla de códigos coincida en conjunto
  y en el mensaje de cada uno** y que `gas/Code.gs` declare la **misma** versión (leída como texto);
  lo que sí cambia es su **listado de literales**, que se recoge de los objetos del módulo: al
  declarar la hoja `public`, sus dos columnas entran **solas** en la vigilancia.
- **Redespliegue:** el cambio vive en `gas/Code.gs` y **exige** publicar una **versión nueva** del
  script (RF-17, D18). Como la versión **sube** a `1.3.0`, un despliegue viejo **se delata**: la salud
  del servicio (`GET` a la URL) devuelve `contract: "1.2.0"`.

### 10.6 Dónde toca el plan (sin redactar tareas)

- **Contrato (módulo):** `src/constants/contract.js` gana `PUBLIC_SHEET` (nombre `public`, columnas
  `public_id` y `limit`) y `MASTER_SHEET.columns.PUBLIC_JSON_CACHE`, y `CONTRACT_VERSION` pasa a
  `1.3.0`. La tabla de códigos **no** se toca (RF-19, D32, D34).
- **Contrato (documento):** `docs/servicio-invitados.md` deriva la hoja `public` (columna a columna),
  la regla de **qué hoja se mira según el tipo**, la segunda caché, la regla de la celda vacía y la
  versión `1.3.0`; sus apartados de tipos y de cachés se actualizan (RF-19, RF-20).
- **Servicio (`gas/Code.gs`):** `SHEET_NAMES` gana `PUBLIC`; las columnas de esa hoja se declaran
  aparte (`public_id`, `limit`); `MASTER_COLUMNS` gana `PUBLIC_JSON_CACHE`; `resolveCode_` **deja** de
  mirar solo `generic` y resuelve **por tipo** (D29), con la regla del `limit` de `public` (D30); la
  lectura de las **celdas de asistentes** pasa a tratar la celda **vacía** como **cero** (D33) —tanto
  en `lookupResponse_` como en `resolvePersonal_`—; `CONTRACT_VERSION` pasa a `1.3.0` (D34).
- **Prueba de sincronía (`test/serviceContract.test.js`):** **no** cambia de regla; su **listado de
  literales** tiene que incluir los de la hoja nueva (lo natural es recogerlos del módulo, como ya se
  hace con las demás hojas).
- **App (`src/utils/invitation.js`, `src/utils/rsvp.js` y sus pruebas):** **revisar, no asumir**. En
  el código actual `count()` **ya** trata la celda vacía como **cero** (RF-20) y `codeLimit()` **ya**
  admite `n` en `generic` y en `public` (005 §14.7), así que **lo previsible es que la app no
  cambie**; si el plan encuentra un punto que **no** tolera la celda vacía o que **no** admite el
  `limit` de la hoja `public`, lo ajusta **con su prueba pura** antes de tocar la interfaz (RNF-9,
  RNF-10).
- **`gas/README.md`:** el paso 2 (hoja `public`) y el punto 8 (diagnóstico) se actualizan con el
  reparto nuevo (D29, D31) y con el aviso de **redespliegue** (la versión `1.3.0` lo delata).
- **Verificación (§8 de esta spec y «Verificación» de `AGENTS.md`):** los puntos manuales nuevos
  (§10.7) y la regresión de los de la 004 y la 005.
- **Gobernanza (`AGENTS.md`, `MEMORY.md`, `PENDING_TASKS.md`):** la hoja `public`, la regla de
  resolución por tipo, la celda vacía como cero, la versión `1.3.0` y el diagnóstico de `gas/README.md`,
  al cerrar las tareas.

### 10.7 Verificación del cambio

- **Automática (`npm test` con `node --test`, con `npm run build` en verde), contra el módulo del
  contrato y la lógica pura (RNF-10 intacta; nunca contra el servicio vivo):**
  - **Contrato:** el módulo declara la hoja `public` con sus dos columnas y la columna
    `public_json_cache`; su `CONTRACT_VERSION` es `1.3.0`; el documento los reproduce y la tabla de
    códigos sigue coincidiendo **en conjunto y en el mensaje de cada código**; `gas/Code.gs` declara
    la **misma** versión.
  - **Lógica pura de la app:** la lectura de una respuesta con asistentes ausentes o vacíos da **cero**
    y no invalida la invitación (RF-20); un `limit` de la hoja `public` —entero o `n`— se acepta en
    su tipo (RF-19).
- **Manual (Apps Script en ejecución: no hay runner; el veredicto va en «Verificación» de
  `AGENTS.md`), con el script **redesplegado** (la salud debe devolver `contract: "1.3.0"`) y un libro
  de prueba:**
  14. **La hoja `public`.** En una boda `public` con la hoja `public` (`public_id`, `limit`) y la fila
      `PUBLIC` con `limit = "n"`: `resolve` y `lookup` de `PUBLIC` responden `ok: true` con
      `type: "public"` y `limit: "n"`, y la app anuncia **sin tope**. Un `public_id` **distinto** de
      `PUBLIC` con un `limit` entero **también** resuelve, con su cupo (D29). Una boda `public` **sin**
      hoja `public` → `INVALID_DATA` visible.
  15. **La genérica con hoja `public`.** En una boda `generic` con sus códigos en `generic` y **además**
      la hoja `public`: un código de `generic` resuelve con su límite; un código **solo** de `public`
      también resuelve (caída de D29); un código que **no está en ninguna** → `UNKNOWN_GUEST`.
  16. **La fila `PUBLIC` que se queda en `generic`.** Con esa fila, el código `PUBLIC` **no** resuelve:
      responde **`MALFORMED_GUEST`** («El código de esta invitación no es válido.»), **no**
      `INVALID_DATA` (D31). **Borrada** la fila, el mismo enlace resuelve contra la hoja `public`.
  17. **La consulta por teléfono con la fila ya registrada (el caso B).** En una boda `generic`, con un
      teléfono **ya registrado** en una fila cuya respuesta dejó `child_attendees` **vacío**: `lookup`
      responde **`ok: true`** con `response` (con `childAttendees` = **0**) en lugar de `INVALID_DATA`;
      la app muestra la respuesta anterior y permite editarla. La fila **no** cambia (`status`,
      `datetime` y asistentes igual).
  18. **La celda incoherente (lo que sigue fallando).** Una celda de asistentes **con** un valor que no
      es un entero ≥ 0 (p. ej. `"x"`) → `INVALID_DATA` (RF-20, RF-13): el cambio **no** relaja el
      cuadre, solo la celda vacía.
- **Regresión de lo que ya funcionaba:** los códigos `…_GEN` de una boda `generic` siguen resolviendo
  con su `limit` numérico y su combo `1..cupo`; la **personalizada** sigue precargando nombre,
  acompañante y cupo y **no** pide teléfono; el `viewed` se sigue escribiendo al abrir una
  personalizada sin respuesta; el plazo, el rechazo y la actualización por teléfono siguen igual; y el
  punto 7 de `gas/README.md` (tolerancia de cabeceras de `lookup`) sigue pasando.

### 10.8 Riesgos y su mitigación

- **Que la fila `PUBLIC` que se queda en `generic` sea un callejón sin salida.** Mitigación: el fallo
  es **explícito** (`MALFORMED_GUEST`, con su mensaje propio) y `gas/README.md` (punto 8) dice **qué
  hacer**: borrar la fila y llevar el código público a la hoja `public`. La app **no** puede
  «arreglar» el libro.
- **Que un libro con la hoja `public` a medias (sin `public_id` o sin `limit`) no lo note nadie.**
  Mitigación: es `INVALID_DATA` **visible** (RF-19, RF-13) y el paso 2 de `gas/README.md` lista las
  dos cabeceras exactas.
- **Que un despliegue viejo siga sirviendo el script anterior.** Mitigación: la versión sube a
  `1.3.0` y la **salud** del servicio la delata (`contract`); la comprobación manual empieza por ahí
  (§10.7).
- **Que el servicio empiece a tratar un vacío como cero en un sitio donde no debía.** Mitigación: la
  regla **no** relaja nada más: una celda **presente** e incoherente sigue siendo `INVALID_DATA` y el
  resto del cuadre de RF-13 no cambia (§10.7, punto 18).
- **Que leer «cero» en una celda vacía esconda un dato mal escrito.** Mitigación: el servicio deja
  esas celdas vacías **a propósito** (D12) y un dato mal escrito es un caso distinto —celda
  **presente**— que **sigue** fallando (D33).
- **Que la fila pública quede con `adults_guests` vacío («sin tope») y alguien lo lea como un cupo de
  cero.** Mitigación: ninguna lectura del servicio toma `adults_guests` de una fila genérica o pública
  como cupo —el cupo sale del **código**—, y la app no inventa máximos (RF-9, D30).
- **Que la segunda caché (`public_json_cache`) se olvide de refrescar.** Mitigación: la **misma** regla
  que la de `generic` (vacía, ilegible o sin el código → se lee la hoja y se refresca) y la nota de
  `gas/README.md` sobre «la caché es una copia» se extiende a las dos (D32, RF-18).
- **Que la app descarte una invitación válida.** Mitigación: el plan **revisa** la lectura de la app
  contra el modelo nuevo antes de tocar nada (§10.6) y la lógica pura tiene sus pruebas (RNF-9).

### 10.9 Dudas abiertas (con recomendación y motivo)

1. **Qué pasa con una fila `PUBLIC` que se queda en la hoja `generic`.** Hoy se decide **derogarla**
   (D31: es un código mal formado → `MALFORMED_GUEST`) y **exigir que se borre**. **Motivo:** una
   hoja, un idioma; y es lo que pidió quien pide el cambio («no ensuciar `generic`»).
   **Alternativa:** mantener la excepción de 005 RF-17 (`PUBLIC` con `"n"` en una boda genérica = sin
   tope), con lo que la fila seguiría funcionando y no habría que tocar los libros. **No** se
   recomienda: dejaría **dos** sitios donde decir «sin tope» y mantendría el fallo opaco.
2. **Qué forma tiene la caché de los códigos de `public`.** Se decide una **segunda columna** en el
   maestro, `public_json_cache`, con el mismo formato que `generic_json_cache` (D32). **Motivo:** el
   patrón ya existe y no obliga a migrar nada a mano.
   **Alternativa:** un **único** mapa con prefijo por hoja (`generic:…`, `public:…`), que **rompe** el
   formato de la caché existente y obliga a **migrar** a mano. **No** se recomienda.
3. **En el tipo `public`, resuelve cualquier `public_id` o solo el reservado `PUBLIC`.** Se decide que
   resuelve **cualquier** `public_id` de la hoja, con `PUBLIC` + `"n"` como el caso normal (D29, D30).
   **Motivo:** simetría con `generic` (allí cualquier `generic_id` resuelve) y la hoja existe para eso;
   fijar `PUBLIC` dejaría la hoja sin uso.
   **Alternativa:** solo el reservado `PUBLIC`, y cualquier otro `public_id` → `UNKNOWN_GUEST`. **No**
   se recomienda: no aporta nada y hace la hoja redundante.
4. **Si la caída de `generic` a `public` (D29) admite cualquier código o solo el reservado `PUBLIC`.**
   Se decide que **cualquier** código. **Motivo:** la misma simetría del punto 3, y porque quien
   organiza puede querer varios códigos públicos (por ejemplo, uno por familia) sin tocar el
   `guest_type` de la boda.
   **Alternativa:** restringir la caída al reservado `PUBLIC` (más conservador, pero obliga a quien
   organiza a **renombrar** los códigos que quiera servir). **No** se recomienda: es la misma
   incoherencia que había antes del cambio.

**Decidido y sin duda (para que no se reabra):** **D33** (la celda vacía vale por cero: es lo que
**arregla** el caso B y lo que la app **ya** hace) y **D34** (la versión sube a `1.3.0`: el modelo de
los libros cambia y el módulo es su fuente única).
