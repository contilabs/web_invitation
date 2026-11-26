# Servicio de invitados y confirmación — contrato

Este documento explica el **contrato del servicio de registro** (spec 004, RF-17): la forma de
las llamadas y de las respuestas con las que la invitación y el servicio se entienden, el modelo
de los **libros** que el servicio lee y escribe, y la **tabla de códigos de error**.

> **Documento derivado.** La **fuente única** es el módulo `src/constants/contract.js`: es el que
> consume la app y del que sale este documento. `test/serviceContract.test.js` comprueba que aquí
> no falte ningún literal del módulo (hojas, columnas, tipos, estados, valores especiales,
> acciones, campos del intercambio, el parámetro `guest` y los tiempos) ni ningún código de error,
> con su mensaje. Si el módulo cambia, este documento se actualiza **con** él (D18, RNF-10).

- **Versión del contrato:** `1.4.0` (`CONTRACT_VERSION`). Se sube en los dos lados cuando cambia
  la forma de una llamada o de una respuesta **o el modelo de los libros**. La `1.1.0` añade la
  acción `lookup` (spec 005, RF-8), la `1.2.0` el código `MALFORMED_GUEST` (spec 005, RF-16) y la
  `1.3.0` la hoja `public` del libro de invitados y la columna `public_json_cache` del maestro
  (spec 004 §10, RF-19, D34). Las dos primeras son cambios **aditivos** de la **forma**:
  `resolve`, `respond` y `lookup` siguen intactos y ninguna entrada se retira ni se renombra. La
  `1.3.0` cambia el **contenido** del modelo de los libros, **sin** cambiar la forma de las
  llamadas: ni las acciones, ni los campos, ni los tipos, ni los códigos de error.
- **Sin datos personales ni credenciales.** Aquí solo hay **forma**: ni un nombre, ni un teléfono,
  ni un id de libro real. Los libros reales **no se versionan** (`.gitignore`, `gas/*.xlsx`) y se
  conservan en el disco de quien publica (RNF-2, D19).

---

## 1. Cómo se identifica cada llamada

- **El invitado** se identifica con el parámetro del enlace **`guest`** (`GUEST_PARAM`): su valor
  es un `guest_id` de la hoja `guests` (invitación **personalizada**), un `generic_id` de la hoja
  `generic` (invitación **genérica**) o un `public_id` de la hoja `public` (invitación
  **pública** y códigos públicos de una boda genérica, §4). El servicio compara ese código
  **normalizado** —sin espacios en los extremos y sin distinguir mayúsculas de minúsculas—
  (RF-2, D24).
- **La boda** **no** viaja en el enlace ni en el registro local: su `slug` y la **ubicación del
  servicio** son **configuración del despliegue** (RF-15).
- **Acciones** (`SERVICE_ACTIONS`): `resolve` para **resolver** la invitación (leer quién es y qué
  cupo tiene), `respond` para **registrar** la respuesta y `lookup` para **consultar por teléfono**
  la respuesta previa de una fila de la **genérica** y la **pública** (spec 005, RF-8).

### Intercambio entre orígenes (CORS realizable)

Una aplicación web de Apps Script **no** responde al `OPTIONS` del preflight, así que el contrato
fija:

- **Método:** `POST`.
- **Tipo de contenido:** `text/plain;charset=utf-8`, con el cuerpo en **JSON**. Es lo que **evita
  el preflight** (D27, RNF-4).
- **Respuesta:** **JSON**.
- **Tiempo de espera:** `REQUEST_TIMEOUT_MS` = 10000 ms (10 s). Si el servicio no responde a
  tiempo, se da por **no disponible** (D25) y la confirmación queda deshabilitada.

### Cuerpo del envío (`action: "respond"`)

La app manda un objeto JSON con los campos `REQUEST_FIELDS`:

| Campo | Contenido |
| --- | --- |
| `action` | `respond` |
| `slug` | El `slug` de la boda (configuración del despliegue). |
| `code` | El código del enlace (el valor del parámetro `guest`). |
| `name` | Nombre de quien responde. En la **personalizada** la fila ya lo tiene. |
| `phone` | Teléfono. **Obligatorio** en la **genérica** y la **pública** (10 dígitos); en la personalizada no se manda (RF-8, D26). |
| `adults` | Adultos que asisten. |
| `children` | Niños que asisten: solo la **personalizada** los ofrece. |
| `message` | Mensaje para la pareja (opcional), también en un rechazo (spec 005, RF-13). |
| `restrictions` | Restricciones alimentarias (opcional). |
| `response` | Lo que el invitado elige: `accepted` o `declined`. |

### Respuesta del servicio

Todas las respuestas llevan `ok` y `action`; si `ok` es `false`, llevan `code` (un código de la
tabla del §11).

**Resolución (`action: "resolve"`)** — el modelo ya resuelto (`RESOLVE_FIELDS`), que es lo que la
app _sí_ consume; **no** recibe filas crudas (el tipo y el cupo vienen dados, D20):

| Campo | Contenido |
| --- | --- |
| `ok` | `true` si se resolvió. |
| `action` | `resolve`. |
| `type` | Tipo de invitación resuelto: `personal`, `generic` o `public`. |
| `guest` | Objeto con `name` (titular), `partner` (acompañante, si lo hay), `adultsGuests` (cupo de adultos), `childGuests` (cupo de niños) y `phone` solo si aplica. En la personalizada, el `phone` de una fila **precargada** no se devuelve (RNF-2). |
| `limit` | Límite del código (adultos) en la **genérica** y la **pública**: un entero mayor que cero, o `"n"` **sin tope**. |
| `response` | La respuesta previa, para poder editarla: `state`, `adultsAttendees`, `childAttendees`, `message`, `restrictions` y `datetime`; `null` si no hay respuesta. |
| `deadline` | Plazo de confirmación del maestro, o `null` **sin plazo**. |

**Envío (`action: "respond"`)** responde `{ ok, code }`: `ok` en `true` y `code` en `OK` cuando la
respuesta se registró, o `ok` en `false` con el `code` del fallo (RF-14).

### Consulta por teléfono (`action: "lookup"`) — spec 005

La **genérica** y la **pública** no conocen el teléfono cuando se resuelve la invitación: lo
aporta el invitado en un paso previo de la página y lo confirma con el botón «Continuar». Entonces
la app **consulta** si esa fila ya tiene respuesta, para reconocer a quien vuelve y dejarle
editarla (spec 005, RF-5 y RF-8). La consulta **solo lee**: **no** escribe ninguna celda de la hoja
`guests` (el `viewed` sigue siendo **solo** de la invitación personalizada, RF-10) y **no** crea ni
actualiza filas; eso sí, al resolver el código **puede refrescar** la caché del maestro
(`generic_json_cache` o `public_json_cache`, según la hoja) exactamente igual que la lectura
normal (§10). En una boda **personal** la consulta **no aplica** (el cuerpo no encaja en esa
invitación).

**Petición** (`LOOKUP_FIELDS`): `{ action, slug, code, phone }`.

| Campo | Contenido |
| --- | --- |
| `action` | `lookup`. |
| `slug` | El `slug` de la boda (configuración del despliegue). |
| `code` | El código del enlace (el valor del parámetro `guest`). |
| `phone` | El teléfono que aporta el invitado, **normalizado a 10 dígitos**. |

**Respuesta correcta:** `{ ok: true, action: "lookup", type, limit, response, deadline }`.

| Campo | Contenido |
| --- | --- |
| `ok` | `true` si la consulta terminó bien. |
| `action` | `lookup`. |
| `type` | Tipo de la boda, `generic` o `public`; el contrato **no** admite `lookup` en una boda `personal` (`INVALID_RESPONSE`). |
| `limit` | El **mismo** `limit` que devuelve `resolve` para ese código: un entero mayor que cero (el **cupo**) o `"n"` **sin tope** (el código reservado `PUBLIC`, de la hoja `public`). Es el que manda para el cupo que la app muestra. |
| `response` | `null` (no hay fila con ese teléfono, o su `status` está vacío o es `viewed`) o el **mismo modelo de respuesta previa que devuelve `resolve`** (`state`, `adultsAttendees`, `childAttendees`, `message`, `restrictions` y `datetime`) **más** `name`, el **nombre registrado** de la fila (columna `guest_name`). |
| `deadline` | Plazo de confirmación del maestro, como en `resolve` (o `null` **sin plazo**). |

- El **nombre registrado** va **dentro** de `response`, porque es un dato de la respuesta (como
  `datetime`): la consulta **no** devuelve un objeto `guest` (la genérica y la pública no precargan
  titular ni cupo, RF-6).
- La respuesta **no** lleva el teléfono (la app ya lo tiene en la página), aunque la petición **sí
  lo envía**: es la **llave** de la fila consultada.
- **Error:** `{ ok: false, code }` con los códigos **existentes** de la tabla del §11, **ninguno
  nuevo**: `MISSING_SLUG`, `MISSING_GUEST`, `UNKNOWN_WEDDING`, `INACTIVE_WEDDING`, `UNKNOWN_GUEST`
  (código que no está en su hoja), `GUEST_SHEET_UNAVAILABLE`, `INVALID_DATA`, `MISSING_FIELDS` (sin
  teléfono), `INVALID_PHONE` (teléfono que no son 10 dígitos), `INVALID_RESPONSE` (cuerpo que esa
  invitación no admite) y `SERVICE_UNAVAILABLE`. Un teléfono **sin fila no es un error**: es
  `response: null`.

**La consulta tolera las cabeceras que no necesita** (spec 005, RF-15 y R13). De la hoja `guests`
solo es **obligatoria** `phone`, la **llave** con la que se localiza la fila: el teléfono ya viaja en
la petición, así que las otras cabeceras que la consulta lee son **toleradas**.

- Sin `guest_name` la consulta **no** falla: el **nombre registrado** es **opcional** (como el
  `message`) y viaja vacío (`name: null`); la app muestra la respuesta con el nombre en blanco y deja
  editarlo (RF-10).
- Sin `status` tampoco falla: un `status` **ausente** vale por **primera respuesta** (`response:
  null`), igual que uno vacío o `viewed`.
- Sin `phone` **sí** falla, con `INVALID_DATA`: sin esa columna no hay fila que localizar y es un
  fallo **real** de los datos (RF-13), no una cabecera que no hacía falta. Un `status` no vacío que no
  sea uno de los cuatro estados del libro sigue siendo `INVALID_DATA`, y un código que no está en su
  hoja sigue siendo `UNKNOWN_GUEST`.
- Un maestro **sin** `generic_json_cache` (ni `public_json_cache`) **no** es el motivo de un
  `INVALID_DATA`: las cachés son **copias** de sus hojas y esas columnas son opcionales (§10), así
  que el código se resuelve leyendo la hoja. El **contrato no cambia** (RF-15): la forma de la
  respuesta sigue igual y
  `response.name` **puede** ser `null`.

**La escritura no se relaja:** en el envío (`respond`) el servicio sigue exigiendo y escribiendo las
columnas que necesita (incluida `guest_name`); lo que se tolera es **solo** la lectura de la consulta
(RF-15, 004 RF-8 intacta).

---

## 2. El maestro (una hoja, `files`)

Un libro de cálculo con **una sola hoja**, `files`, y **una fila por boda**. Cabeceras exactas:

| Columna | Tipo en el libro | Significado |
| --- | --- | --- |
| `slug` | texto | Identificador de la boda. Es el valor que se configura en el despliegue (RF-15). |
| `is_active` | booleano (`TRUE`/`FALSE`) | Si la boda se sirve. En falso, la boda ya **no** es accesible (RF-3, D14). |
| `guests_sheet_id` | texto | Id del **libro de invitados** de esa boda. **Un libro por boda** (D5). |
| `deadline` | fecha y hora | Plazo de confirmación: el **único** plazo (RF-11). Valor **fijo**, no una fórmula. |
| `guest_type` | texto | Tipo de invitación de la boda: `personal`, `generic` o `public` (RF-5). |
| `generic_json_cache` | texto | Caché de los códigos de la hoja `generic` de esa boda (RF-18). |
| `public_json_cache` | texto | Caché de los códigos de la hoja `public` de esa boda (RF-18, D32). |

Reglas del maestro (RF-3, RF-13, D28):

- Columnas **obligatorias**: `slug`, `is_active`, `guests_sheet_id` y `guest_type`. `deadline`
  puede estar vacía (**sin plazo**) y `generic_json_cache` y `public_json_cache` pueden faltar o
  estar vacías (las dos cachés son **opcionales**, D32).
- **Únicos:** dos filas **no** pueden compartir `slug`, ni dos filas **activas** compartir
  `guests_sheet_id`; el servicio falla de forma visible si ocurre.
- `guests_sheet_id` **no** viaja al navegador: el servicio abre el libro por ese id.
- `deadline` y `datetime` son **valores fijos** (no fórmulas como `NOW()`), y el `deadline` se
  interpreta en la **zona del libro**.

---

## 3. El libro de invitados (hasta tres hojas)

**Un libro por boda.** El maestro guarda su id en `guests_sheet_id` y eso es lo que atribuye cada
respuesta a su boda: la hoja `guests` **no** lleva columna de boda. Los libros se leen **por el
nombre de la cabecera** (fila 1), nunca por la posición de la columna, y las filas sin datos se
ignoran (RF-4). El libro tiene **hasta tres** hojas: `guests` (siempre), `generic` (en las bodas
genéricas) y `public` (en las bodas públicas, y opcional en las demás, RF-19).

### Hoja `guests` — las respuestas de los invitados de esa boda

| Columna | Tipo en el libro | Significado |
| --- | --- | --- |
| `guest_id` | texto o entero | Identificador del invitado. **Precargado** en la personalizada (suele ser texto); en la genérica y la pública lo asigna el servicio y es un **entero** (RF-8). |
| `phone` | texto (10 dígitos) | Teléfono. **No** hace falta en la personalizada; en la genérica y la pública es **obligatorio** y es la **llave dentro de ese libro**. Se normaliza a 10 dígitos y se guarda como texto, para no perder ceros a la izquierda (RF-8, D6). |
| `guest_name` | texto | Titular en la personalizada; nombre de quien confirma en la genérica y la pública. |
| `partner_name` | texto (opcional) | Acompañante de la invitación personalizada, cuando exista. |
| `adults_guests` | entero | **Cupo** de adultos. Precargado en la personalizada; lo escribe el servicio en la genérica y la pública (el límite del código, RF-9). |
| `adults_attendees` | entero | Adultos que **asisten**. Una celda **vacía** vale por **cero** (RF-20, D33). |
| `child_guests` | entero (opcional) | **Cupo** de niños: solo la personalizada lo usa. |
| `child_attendees` | entero | Niños que **asisten**. Una celda **vacía** vale por **cero** (RF-20, D33). |
| `message` | texto (opcional) | Mensaje para la pareja. |
| `dietary_restrictions` | texto (opcional) | Restricciones alimentarias. |
| `status` | texto | Estado de la respuesta (RF-10). |
| `datetime` | fecha y hora | Cuándo se registró la última respuesta (lo pone el servicio). |

**Cupo ≠ asiste:** `*_guests` es lo que la invitación **permite** ocupar y `*_attendees`, lo que
**asiste** de verdad (RF-7, RF-9). La hoja **no** declara ninguna columna para el código
(`generic_id` o `public_id`) con el que contestó un invitado genérico o público: el **código no
se registra** (D7).

### Hoja `generic` — los códigos genéricos predefinidos

| Columna | Tipo en el libro | Significado |
| --- | --- | --- |
| `generic_id` | texto | El **código** de la invitación: el valor del parámetro `guest` del enlace (RF-2). |
| `limit` | número, o el texto `"n"` | **Cupo** (en adultos) que ese código permite **en cada respuesta** (RF-9). |

- Los códigos de esta hoja llevan un `limit` **entero mayor que cero** (RF-19, D31): es el
  **único** idioma de esta hoja. Un `limit` que **no** cumpla esa regla (ni entero mayor que
  cero ni el texto `"n"`) es un **código mal formado**: el servicio responde
  **`MALFORMED_GUEST`** (005 RF-16, D21), no `INVALID_DATA`.
- El código reservado **`PUBLIC`** **sale** de esta hoja: vive en la hoja `public` (D31). Si se
  deja una fila `PUBLIC` en `generic`, pasa a ser **un código genérico más** y, con
  `limit = "n"`, **no** cumple la regla de esta hoja: responde **`MALFORMED_GUEST`**. El
  arreglo es de **datos**: **borrar esa fila**.
- El cupo es **por respuesta**: cada invitado que use un código puede traer hasta su límite en su
  propia respuesta; el código **no** se agota.
- La hoja `generic` es **obligatoria** en la invitación **genérica**; en la **pública** ya no hace
  falta para servirla y su ausencia **no** es un fallo (D29).

### Hoja `public` — los códigos públicos

| Columna | Tipo en el libro | Significado |
| --- | --- | --- |
| `public_id` | texto | El **código** de la invitación pública: el valor del parámetro `guest` del enlace (RF-2, RF-19). |
| `limit` | número, o el texto `"n"` | **Cupo** (en adultos) que ese código permite **en cada respuesta** (RF-9, D30). |

- Es la **tercera** hoja del libro de invitados y es **opcional**, salvo en las bodas de tipo
  **`public`**, donde es **obligatoria** (RF-19, D29).
- Su `limit` habla **el mismo idioma** que el de `generic`: un **entero mayor que cero** es el
  **cupo por respuesta** de ese código y el texto `"n"` significa **sin tope** (D30). El caso
  normal es el código reservado **`PUBLIC`** con `"n"`. Un `limit` que **no** cumpla la regla de
  **su** hoja es un **código mal formado** → **`MALFORMED_GUEST`** (005 RF-16, D21), no
  `INVALID_DATA`.
- Resuelve **cualquier** `public_id` de la hoja, no solo el reservado `PUBLIC` (D29): la hoja
  existe para eso y da simetría con `generic`.
- Si la hoja **existe** pero le falta la cabecera `public_id` o la cabecera `limit`, el fallo es
  **visible**: `INVALID_DATA` (RF-13).

---

## 4. La resolución: del `slug` al invitado

1. El servicio busca la fila de la boda en el maestro (`files`) por `slug`, y de ahí lee
   `is_active`, `guest_type`, `deadline`, `guests_sheet_id` y las cachés `generic_json_cache` y
   `public_json_cache` (RF-3, D4, D32).
2. Si `is_active` es falso, **deniega** el acceso: la boda ya no es accesible (D14).
3. Abre el libro de invitados por `guests_sheet_id` y resuelve el código del enlace **según el
   tipo** que declara `guest_type` (RF-5, D20):
   - `personal` → el código es un `guest_id` de la hoja `guests`; su fila viene **precargada**.
   - `generic` → el código es un `generic_id` de la hoja `generic` con su `limit` propio; **si el
     libro también tiene hoja `public` y el código pedido no está en `generic`**, se busca en
     `public` (D29).
   - `public` → el código es un `public_id` de la hoja `public` con su `limit` propio; la hoja
     `generic` ya no hace falta para servirla (D29).

**Qué hoja se mira, según el tipo** (D29): primero la hoja **de su tipo** y solo después la otra.

| Tipo (`guest_type`) | Hoja que se mira | Cuándo se mira la otra |
| --- | --- | --- |
| `personal` | `guests` (obligatoria) | Ni `generic` ni `public` hacen falta (RF-5). |
| `generic` | `generic` (obligatoria) | `public`, **solo** si el libro la tiene y el código pedido **no está** en `generic`. |
| `public` | `public` (obligatoria) | `generic` ya no hace falta para servirla; su ausencia **no** es un fallo. |

**Una boda, un tipo:** no se infiere el tipo de la forma de los datos ni se mezclan tipos dentro
de una boda.

---

## 5. Cómo se lee la invitación

- **Personalizada:** el servicio devuelve `name`, `partner` (si lo hay), el cupo
  (`adultsGuests` y `childGuests`), el `state` y, si el invitado ya contestó, su respuesta previa
  (`adultsAttendees`, `childAttendees`, `message`, `restrictions`, `datetime`) para poder
  editarla (RF-6).
- **Genérica y pública:** el servicio devuelve el código y el `limit` de ese código y **no**
  precarga nombre ni cupo. La respuesta previa de **esa** fila **no** viene de `resolve`: la
  devuelve la **consulta por teléfono** (`lookup`, §1), con el teléfono que el invitado **escribe en
  la página** (spec 005 §5.1: la frase de 004 RF-6 que negaba esa respuesta previa queda
  **derogada**).
- El servicio **no** devuelve el `phone` de una fila precargada (RNF-2) y devuelve el `state`
  **tal cual** lo trae el libro (`viewed`, `accepted` o `declined`), sin traducirlo.
- Al **abrir** una invitación personalizada cuya fila todavía **no** tiene respuesta (estado
  vacío o `viewed`), el servicio escribe **`viewed`** en su `status`; si la fila ya tiene
  respuesta, **no** la sobrescribe (RF-6, RF-10).
- Al leer una invitación genérica o pública, el servicio **no** escribe en el libro de
  invitados —tampoco al **consultar por teléfono** (`lookup`, §1)—: solo puede refrescar la
  **caché** del maestro (§10).
- **Celda vacía = cero** (RF-20, D33): una celda de asistentes (`adults_attendees` o
  `child_attendees`) **vacía** se lee como **cero** en **toda** lectura —al resolver, al
  consultar por teléfono y al escribir— y en los **tres** tipos. Una fila **con respuesta** cuyas
  celdas de asistentes estén vacías **no** es una fila inválida y **no** produce `INVALID_DATA`.
  Solo es **incoherente** una celda **presente** cuyo valor **no** sea un entero ≥ 0 (`"x"`,
  `-1`, `1,5`): eso sigue siendo `INVALID_DATA` (RF-13). La regla **no** relaja el resto del
  cuadre: un `status` fuera de los cuatro estados, un `limit` que no cumple la regla de su hoja
  (`MALFORMED_GUEST`), un `phone` ilegible o una cabecera que falta **siguen** siendo fallos
  visibles.

---

## 6. Cómo se escribe la respuesta

### Invitación personalizada (RF-7)

- El servicio escribe en **su** fila de `guests`: `adults_attendees`, `child_attendees`,
  `message`, `dietary_restrictions`, `status` y `datetime`.
- **No** toca la identidad ni el cupo: `guest_id`, `guest_name`, `partner_name`, `phone`,
  `adults_guests` y `child_guests` se quedan como están.
- Nunca crea una fila nueva por una respuesta personalizada.

### Invitación genérica y pública (RF-8, D11)

- La app pide **nombre** y **teléfono**; el teléfono es **obligatorio** (también para
  **rechazar**, D26), se normaliza a **10 dígitos** y se escribe como **texto**. Un teléfono que
  no llega a 10 dígitos se **rechaza** sin crear ni actualizar fila (D23).
- El servicio busca en `guests` de **ese** libro una fila con ese `phone`:
  - si existe, **actualiza esa fila** conservando el estado `accepted` o `declined`;
  - si no existe, **añade** una fila y le asigna un `guest_id` **entero autoincremental**: el
    **mayor entero existente + 1**, **ignorando** los `guest_id` que son texto.
- Las columnas que escribe son: `guest_id` (solo en la fila nueva), `phone`, `guest_name`,
  `adults_guests` (el **cupo**: el límite del código de ese enlace), `adults_attendees`,
  `message`, `dietary_restrictions`, `status` y `datetime`. `child_guests` y `child_attendees`
  quedan **vacíos** (no se ofrecen niños, D12).
- El **código usado no se registra**: del código solo queda su **límite**, escrito en
  `adults_guests`.
- El `phone` **no** se persiste en el navegador (RNF-2): se escribe en el libro porque es la
  llave.
- **Un rechazo también puede llevar `message`** (spec 005, RF-13): el invitado puede dejar un mensaje
  para la pareja aunque no asista y el servicio lo escribe en la columna `message` que ya existe. Lo
  único que un rechazo **añade** al cuerpo es ese `message`; `adults`, `children` y `restrictions`
  siguen **fuera** del envío de un rechazo (D18 matizada solo en el mensaje; 004 D26 intacta) y no
  existe ninguna columna nueva.

---

## 7. Estados de la respuesta (RF-10)

| Estado | Significado |
| --- | --- |
| `viewed` | La invitación **personalizada** se abrió y todavía no hay respuesta. |
| `accepted` | Hay una respuesta de asistencia registrada. |
| `declined` | El invitado dijo que no podrá asistir. |

- **Ningún estado es terminal:** mientras el plazo esté abierto se puede contestar y **volver a
  contestar** en cualquiera de los dos (también después de `declined`). Para anular una
  confirmación se **vuelve a contestar**; el libro no tiene estado de «cancelación» (D8).
- `viewed` solo existe en las invitaciones personalizadas y lo escribe el **servicio al abrir**.
- Un `status` **vacío** vale por `viewed` / sin respuesta, y su fila queda **exenta** del cuadre
  de asistentes (D21).
- Un `status` no vacío que no sea uno de los cuatro es un dato inválido: fallo visible (RF-13).

## 8. Cupo y plazo

- **Cupo de la personalizada:** `adults_guests` y `child_guests` de **su** fila; un `child_guests`
  vacío vale por cero.
- **Cupo de la genérica y la pública:** el `limit` del código —el de **su** hoja, `generic` o
  `public`—, y **solo cuenta adultos** (no se ofrecen niños). `limit` con el texto `n` (el código
  `PUBLIC`, que vive en la hoja `public`) es **sin tope**: la app no inventa un máximo.
- El cupo es **por envío**, y el sistema **no** admite una respuesta que lo supere: la app lo
  impide antes de enviar y el servicio la rechaza igualmente.
- **Plazo:** es el `deadline` del maestro y **solo** ese (RF-11). Se interpreta en la zona del
  libro, es un **valor fijo** (no `NOW()`) y un `deadline` **vacío** significa **sin plazo** (no
  se rechaza por plazo). El servicio lo devuelve al resolver y lo hace valer en el envío: si el
  plazo ya pasó, la respuesta se rechaza y el sistema lo muestra de forma visible, distinguiéndolo
  de un fallo técnico (RF-14).

---

## 9. El tipo de invitación y su reparto

| Tipo (`guest_type`) | Código del enlace | Qué pide la app | Cupo |
| --- | --- | --- | --- |
| `personal` | un `guest_id` de `guests` | Nada: nombre, acompañante y cupo vienen precargados. **No** pide teléfono. | `adults_guests` y `child_guests` de su fila |
| `generic` | un `generic_id` de `generic` (y, si el libro tiene `public` y el código no está en `generic`, un `public_id` de `public`) | Nombre y teléfono, también para rechazar. | `limit` del código (adultos) |
| `public` | un `public_id` de `public` (normalmente el reservado `PUBLIC`) | Nombre y teléfono, también para rechazar. | `limit` del código (adultos): `n` = **sin tope** |

## 10. Caché de códigos del maestro (`generic_json_cache` y `public_json_cache`)

- Son **dos** mapas JSON `código → límite`: `generic_json_cache` es el de la hoja `generic` y
  `public_json_cache` el de la hoja `public`. Los dos los escribe el servicio al **leer su
  hoja**: la hoja es la **fuente** y la caché una **copia** (RF-18, D32).
- Mientras la caché de una hoja sea legible y contenga el código pedido, el servicio lo resuelve
  **sin volver a abrir el libro de invitados**.
- Si está **vacía**, es **ilegible** o **no trae el código**, el servicio lee la hoja y
  **refresca** la caché con lo leído; reescribe **solo** en ese caso. Si el contenido discrepa,
  manda la **hoja**.
- **Las dos** cachés son **opcionales**: en el maestro pueden faltar o estar vacías (§2) y su
  ausencia **no** es el motivo de un `INVALID_DATA` (§1).
- El servicio **no** escribe la caché como efecto de la respuesta de un invitado.

---

## 11. Tabla de códigos de error

La app elige el aviso por el **código** y muestra el **mensaje** como copy de interfaz en español
(RNF-7). `retryable` (un booleano del módulo, no de esta tabla) dice si la causa tiene algo que
**reintentar**: no lo tienen las que dependen de la configuración, de la boda o del plazo
(`MISSING_GUEST`, `MISSING_SLUG`, `NOT_CONFIGURED`, `UNKNOWN_WEDDING`, `INACTIVE_WEDDING` y
`DEADLINE_EXPIRED`); el resto sí (RF-12, D25).

| Código | Causa | Mensaje de interfaz |
| --- | --- | --- |
| `OK` | La operación terminó bien (lectura o registro). | «¡Gracias! Tu respuesta quedó registrada.» |
| `MISSING_GUEST` | El enlace no trae el parámetro `guest`. | «Este enlace no identifica ninguna invitación.» |
| `MISSING_SLUG` | La configuración del despliegue no tiene `slug`. | «Esta invitación no está configurada.» |
| `NOT_CONFIGURED` | No hay ubicación del servicio configurada (modo demo). | «La confirmación no está disponible en este momento.» |
| `UNKNOWN_WEDDING` | El `slug` no tiene fila en el maestro. | «No encontramos esta boda.» |
| `INACTIVE_WEDDING` | `is_active` en falso. | «Esta boda ya no está disponible.» |
| `UNKNOWN_GUEST` | El código no está en la hoja que le toca por su tipo. | «No encontramos esta invitación.» |
| `MALFORMED_GUEST` | El código **sí** está en su hoja, pero su `limit` no cumple la regla de su tipo (RF-16, D21). | «El código de esta invitación no es válido.» |
| `GUEST_SHEET_UNAVAILABLE` | `guests_sheet_id` vacío, libro inexistente, sin permiso o sin respuesta. | «No pudimos abrir la lista de invitados.» |
| `INVALID_DATA` | Datos del maestro o del libro inválidos o incoherentes que impiden **leer o escribir** de verdad —libro, hoja, cabecera, `status` o cifra incoherentes—, **nunca** el código mal formado (ese tiene su propio código, RF-16). | «Los datos de esta invitación están incompletos.» |
| `INVALID_RESPONSE` | El servicio rechaza la respuesta enviada por inválida o incoherente (RF-14). | «No pudimos registrar tu respuesta con esos datos.» |
| `SERVICE_UNAVAILABLE` | El servicio no responde en 10 s, falla la red o responde algo que no respeta el contrato. | «No pudimos conectar. Inténtalo de nuevo.» |
| `DEADLINE_EXPIRED` | El plazo del maestro ya pasó. | «El plazo para confirmar ya terminó.» |
| `OVER_LIMIT` | Los asistentes superan el cupo (RF-9). | «Superaste el número de lugares de tu invitación.» |
| `MISSING_FIELDS` | Falta el nombre o el teléfono en una genérica o pública, también al rechazar (RF-8, D26). | «Escribe tu nombre y tu teléfono para responder.» |
| `INVALID_PHONE` | El teléfono normalizado no llega a 10 dígitos (RF-8). | «Revisa el teléfono: deben ser 10 dígitos.» |

`INVALID_DATA` es el veredicto del servicio sobre los datos **de lectura**; `INVALID_RESPONSE`,
sobre la respuesta **enviada**.

---

## 12. Configuración del despliegue

Ni el `slug` ni la ubicación del servicio son datos del repositorio: se fijan al publicar, por
variables de entorno que se leen en el build:

| Variable | Contenido |
| --- | --- |
| `VITE_SERVICE_URL` | Ubicación del servicio desplegado. Sin ella, el sistema **no** llama a nadie y entra en **modo demo** (`NOT_CONFIGURED`). |
| `VITE_WEDDING_SLUG` | El `slug` de la boda. Con URL y sin `slug`, el sistema muestra `MISSING_SLUG` y **no** reintenta. |

La configuración **no** incluye datos de invitados ni se versiona con ellos. El panel y la
invitación usan `VITE_SERVICE_URL`. Los lanzadores Docker locales transmiten los valores públicos
permitidos del entorno del proceso o de `.env.local`, sin copiar el archivo. Reiniciar tras
cambiarlas. Ver [seguridad local](local-security.md) para desarrollo, preview y publicación.

---

## 13. Panel privado de respuestas (spec 006)

El panel privado es **independiente** del contrato público 1.4.0. Usa un sobre y una acción
distintos, con su propia versión de contrato.

- **Versión del contrato administrativo** `3.0.0` (`ADMIN_CONTRACT_VERSION`).
- **Acciones** `adminLogin` (`ADMIN_SERVICE_ACTIONS.LOGIN`), `listResponses` (`ADMIN_SERVICE_ACTIONS.LIST_RESPONSES`),
  `listCodes` (`ADMIN_SERVICE_ACTIONS.LIST_CODES`) y `revealPhone`
  (`ADMIN_SERVICE_ACTIONS.REVEAL_PHONE`). `listCodes` devuelve los códigos y límites de la
  caché `generic_json_cache` o `public_json_cache`, según el tipo de boda.
- **Acceso.** El formulario compara `VITE_PASSWORD` en el navegador. `adminLogin` recibe el
  `slug` de `VITE_WEDDING_SLUG` y devuelve `{ ok, code, contract, session }` si
  la boda existe en el maestro y está activa. La contraseña queda en el JavaScript publicado.
- **Alcance.** La sesión da acceso a una boda, vive en memoria y caduca como máximo a los 45 minutos desde el inicio de sesión.
- **Teléfono:** enmascarado siempre por defecto, con revelación temporal tras acción
  adicional, sin persistirlo (D3).
- **Volumen:** consulta única sin paginación en la primera entrega (D4).
- **Idioma:** `files.language` puede ser `spanish` o `english`; el servicio lo devuelve en
  `wedding.language` y el panel traduce sus etiquetas, estados y mensajes sin cambiar los datos
  guardados.

### Petición (`action: "listResponses"`)

| Campo | Contenido |
| --- | --- |
| `action` | `listResponses` |
| `session` | Credencial efímera devuelta por `adminLogin`. |

Para las lecturas, el servidor comprueba la sesión y que la boda siga activa.

La acción `revealPhone` recibe `guestId`, vuelve a comprobar la sesión y
devuelve el teléfono de esa fila durante la sesión de la página. La interfaz lo oculta al
cerrar el detalle o al pulsar «Ocultar»; nunca se persiste en el navegador, la URL ni los
logs.

### Respuesta correcta

```text
{
  ok: true,
  contract: "3.0.0",
  wedding: { slug, name, isActive, deadline, updatedAt, guestType, language },
  summary: { total, viewed, accepted, declined, pending, adults, children,
    seatsIssued, seatsOccupied, seatsUnoccupied },
  responses: [{ guestId, guestType, guestName, phoneMasked, adultsAttendees,
    childAttendees, assignedAdults, assignedChildren, assignedSeats, occupiedSeats,
    allergies, message, status, datetime }]
}
```

Los totales de adultos y niños excluyen las respuestas `declined`; los campos vacíos de
asistentes se cuentan como cero. En invitaciones genéricas y públicas no se muestran datos de
niños. `dietary_restrictions` se presenta como **alergias** y `message` se consulta en una pestaña
independiente. `seatsIssued` se calcula exclusivamente sumando `guests.adults_guests`; por eso
las invitaciones genéricas y públicas solo aportan boletos conforme aparecen sus filas contestadas.

### Errores del panel administrativo

| Código | Causa | Mensaje de interfaz |
| --- | --- | --- |
| `OK` | Listado cargado correctamente. | «Listado de respuestas cargado.» |
| `NOT_CONFIGURED` | Panel no configurado. | «El panel no está configurado.» |
| `UNKNOWN_WEDDING` | No se encuentra la boda autorizada. | «No encontramos la boda autorizada.» |
| `INACTIVE_WEDDING` | La boda ya no está activa. | «Esta boda ya no está disponible.» |
| `GUEST_SHEET_UNAVAILABLE` | No se puede abrir la lista de invitados. | «No pudimos abrir la lista de invitados.» |
| `INVALID_DATA` | Datos incompletos o inválidos. | «Los datos del panel están incompletos o son inválidos.» |
| `SERVICE_UNAVAILABLE` | Red o fallo del servidor. | «No pudimos conectar. Inténtalo de nuevo.» |
| `INVALID_RESPONSE` | Respuesta que no respeta el contrato. | «La respuesta del servidor no es válida.» |
| `INVALID_TOKEN` | La sesión falta, es inválida o caducó. | «La sesión venció. Vuelve a ingresar la contraseña.» |

Los códigos `retryable` se definen en el módulo `src/constants/contract.js` (ADMIN_SERVICE_ERRORS).
El panel nunca envía `localStorage`, cookies propias, ni datos sensibles en la URL. No se
versionan libros, tokens o cuentas en el repositorio.
