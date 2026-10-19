# Plan técnico — Flujo del RSVP: respuesta previa, estados del bloque y selección de asistentes

Traduce a decisiones de implementación la spec `spec.md` de esta carpeta (RF-1…RF-10, RNF-1…RNF-5,
las decisiones D1–D16 y las decisiones cerradas R1–R7). Cada parte indica **qué RF cubre**. Parte
del **estado real de la spec 004** (implementada y verificada contra el servicio vivo), no de un
árbol imaginario. Los identificadores de código van en inglés; los textos visibles, los datos, los
comentarios y la documentación, en español (RNF-4, constitución principio 6).

## 1. Punto de partida y referencia

- **Árbol actual:** app React de la spec 004, con `app/`, `constants/`, `data/`, `utils/` (lógica
  pura + pruebas), `hooks/`, `providers/`, `services/`, `templates/classic/`,
  `components/{layout,sections,ui}/` y `test/{andamiaje,contracts,serviceContract}.test.js`.
  `npm test` → **158/158** y `npm run build` en verde.
- **Lo que ya funciona y esta spec da por bueno:** la resolución de los tres tipos (`resolve`), el
  `viewed` de la personalizada, el envío con deduplicación por teléfono (`respond`), el plazo del
  maestro, el contrato en módulo + documento, la caché de códigos y los códigos de error de la 004
  §4.1 (spec §1.1, §8).
- **Lo que hoy no sirve y se amplía o rehace:**
  - `src/utils/invitation.js` **lee la respuesta previa** (`previousResponse`) pero nadie la usa:
    se añade la interpretación de la acción nueva `lookup` y el cupo efectivo del combo.
  - `src/utils/rsvp.js` no sabe nada del paso previo del teléfono: se añaden el cuerpo de la
    consulta, las opciones del combo y la precarga del formulario desde una respuesta.
  - `src/components/sections/Rsvp.jsx` pinta **cinco** estados y muestra los datos del invitado
    en cuanto resuelve, con controles numéricos libres: se **rehace** con los siete estados de
    RF-1/D1, el orden de RF-3, los combos de RF-4, el paso del teléfono de RF-5 y el panel de
    lectura de RF-10.
  - `src/constants/contract.js` gana la acción **`lookup`** (con su `LOOKUP_FIELDS`) y sube su
    `CONTRACT_VERSION`; `docs/servicio-invitados.md` y `gas/Code.gs` la reflejan **a la vez**
    (RF-8, D5).
  - `test/serviceContract.test.js` comprueba hoy solo literales del módulo en el documento: se
    amplía con los literales de `lookup` y la **igualdad de `CONTRACT_VERSION`** con `gas/Code.gs`
    (RF-8, RNF-5).
- **Lo que esta spec NO toca (y el plan respeta):** `useInvitation.js` (ya devuelve
  `previousResponse`), `useRsvp.js` (el envío y su validación), `useConfirmation.js` (el cierre sin
  recargar ya existe), `services/registration.js` (el cliente `POST` sirve tal cual para `lookup`),
  `services/config.js`, `utils/confirmation.js`, `utils/service.js`, la plantilla, las fotos, el
  registro `src/data/wedding.js` y `test/contracts.test.js` (RF-2, RF-9, RF-10; DT-7, §9).
- **Rama:** se trabaja donde esté la rama viva (`react-migration`), sin rebase ni publicación por
  este plan.
- **Nota de cierre de la 004 (fuera de las tareas de la 005):** la verificación manual de la 004
  (su T10) sigue **sin anotar** en «Verificación» de `AGENTS.md` y la rellena el coordinador: este
  plan **no** la marca ni la da por hecha.

## 2. Estructura objetivo

```
src/constants/
  contract.js            # AMPLIADO  acción `lookup`, `LOOKUP_FIELDS`, `CONTRACT_VERSION` → 1.1.0
  service.js             # (sin cambios)
src/utils/               # lógica pura: sin React, sin DOM, sin reloj, sin red
  invitation.js          # AMPLIADO  `interpretLookup`, `attendeeLimits`
  invitation.test.js     # AMPLIADO
  rsvp.js                # AMPLIADO  `lookupPayload`, `attendeeOptions`, `attendanceForm`
  rsvp.test.js           # AMPLIADO
  rsvpState.js           # NUEVO  máquina de estados del bloque (siete estados + transiciones)
  rsvpState.test.js      # NUEVO
  confirmation.js        # (sin cambios)
src/hooks/
  useGuestLookup.js      # NUEVO  estado de la consulta por teléfono (`lookup`)
  useGuestLookup.test.js # NUEVO
  useInvitation.js       # (sin cambios)  ya expone `previousResponse`
  useRsvp.js             # (sin cambios)  el envío no cambia
  useConfirmation.js     # (sin cambios)  el cierre sin recargar ya existe
src/services/
  registration.js        # (sin cambios)  el cliente del contrato sirve para las dos acciones
src/components/ui/
  AttendeeSelect.jsx     # NUEVO  combo nativo con etiqueta y ayuda (RNF-1)
  ResponseSummary.jsx    # NUEVO  panel de datos en solo lectura (RNF-1)
src/components/sections/
  Rsvp.jsx               # REESCRITO  siete estados, orden, paso del teléfono, combos, «Editar»
docs/
  servicio-invitados.md  # AMPLIADO  acción `lookup` + versión del contrato
  constitution.md        # AMPLIADO  principio 5 (riesgo aceptado de la lectura)
gas/
  Code.gs                # AMPLIADO  acción `lookup` + `CONTRACT_VERSION` 1.1.0
  README.md              # AMPLIADO  comprobación manual de `lookup`
test/
  serviceContract.test.js # AMPLIADO  literales de `lookup` + igualdad de versión con `gas/Code.gs`
  contracts.test.js       # (sin cambios)
AGENTS.md · MEMORY.md · PENDING_TASKS.md  # actualizados al final (§5.5)
```

## 3. Convención de nombres (RNF-4, constitución principio 6)

- **Módulos, funciones y variables en inglés** (`blockState`, `interpretLookup`, `lookupPayload`,
  `attendeeOptions`, `attendanceForm`, `effectiveLimit`). **Comentarios, textos de interfaz y
  documentación en español.**
- **Los estados del bloque se nombran en español en la spec** (son concepto de interfaz: D1, M5) y
  en **inglés en el código**: `NOT_ANSWERED` (sin-respondido), `PHONE` (telefono), `LOOKING_UP`
  (consultando), `ANSWERED` (respondido), `EDITING` (editando), `CLOSED` (cerrado) y `DEGRADED`
  (degradado).
- **No se traduce nada del modelo del servicio** (hojas, columnas, estados, el parámetro `guest`,
  los códigos de error ni la acción nueva `lookup`): literales en inglés por excepción documentada.

## 4. Mapa de archivos

### 4.1 Contrato y servicio (RF-8; 004 RF-17, D5, D18)

- **`src/constants/contract.js` (ampliado).**
  - `SERVICE_ACTIONS` gana **`LOOKUP: "lookup"`** (junto a `RESOLVE` y `RESPOND`).
  - **`LOOKUP_FIELDS` (nuevo objeto)** con los literales del intercambio nuevo: los de la petición
    (`action`, `slug`, `code`, `phone`) y los de la respuesta (`ok`, `action`, `type`, `limit`,
    `response`, `deadline`, `code` y los de dentro de `response`: `name`, `state`,
    `adultsAttendees`, `childAttendees`, `message`, `restrictions`, `datetime`). Se declaran aquí
    para que el documento no pueda omitirlos y la prueba de sincronía los enumere (RF-8, M6).
  - **`CONTRACT_VERSION` sube de `"1.0.0"` a `"1.1.0"`** (DT-1): el cambio es **aditivo** —una
    acción nueva, sin retirar ni renombrar campo, con `resolve` y `respond` intactos—, así que es
    una subida **menor**.
  - Nada más cambia: ni un código de error nuevo, ni una columna, ni un estado del libro.
- **`docs/servicio-invitados.md` (ampliado).** Documento **derivado** del módulo:
  - la línea de versión pasa a `1.1.0`;
  - §1 (acciones) menciona `lookup` junto a `resolve` y `respond`;
  - nueva sección **«Consulta por teléfono (`action: "lookup"`)»** con la tabla de la petición, la
    de la respuesta (con `name` **dentro** de `response`), «no devuelve objeto `guest`», «no
    escribe la hoja `guests` (el `viewed` sigue siendo solo de la personalizada) y puede refrescar
    la caché del maestro», y la lista **cerrada** de códigos de error existentes;
  - §5 (cómo se lee la invitación) **retira** la frase derogada («no puede devolver una respuesta
    previa, porque el teléfono lo escribe el invitado») y la sustituye por la consulta nueva
    (spec §5.1, 004 RF-6 modificada).
- **`gas/Code.gs` (ampliado).** Implementa la acción nueva (DT-10, §4.6).

### 4.2 Lógica pura (RF-1…RF-10; RNF-4)

- **`src/utils/rsvpState.js` (nuevo, puro).** La máquina de estados del bloque, probada sin DOM
  (B2, I1):
  - `BLOCK_STATES` con los **siete** identificadores en inglés (§3);
  - `BLOCK_EVENTS` con los acontecimientos: `reveal`, `continue`, `lookup-found`, `lookup-none`,
    `lookup-failed`, `lookup-invalid-phone`, `edit`, `submit-ok`, `submit-fail`, `deadline`;
  - `initialBlockState({ status, invitation, open })` → la **única regla de arranque** de D2:
    `status !== "ready"` (demo o error) → `DEGRADED`; si no, `!open` → `CLOSED`; si no,
    **personalizada con `previousResponse`** → `ANSWERED`; en cualquier otro caso → `NOT_ANSWERED`;
  - `nextBlockState(state, event, { personalized })` → la transición de RF-1, en una **tabla
    explícita** (y `null` cuando el acontecimiento no aplica en ese estado, para el doble clic de
    M10): `NOT_ANSWERED` + `reveal` → `EDITING` (personalizada) o `PHONE` (genérica/pública);
    `PHONE` + `continue` → `LOOKING_UP`; `LOOKING_UP` + `lookup-found` → `ANSWERED`;
    `LOOKING_UP` + `lookup-none` → `EDITING`; `LOOKING_UP` + `lookup-failed` → `DEGRADED`;
    `LOOKING_UP` + `lookup-invalid-phone` → `PHONE`; `ANSWERED` + `edit` → `EDITING`;
    `EDITING` + `submit-ok` → `ANSWERED`; `EDITING` + `submit-fail` → `EDITING`; y `deadline` desde
    `NOT_ANSWERED`, `PHONE`, `LOOKING_UP`, `ANSWERED` o `EDITING` → `CLOSED`.
  - Sin React, sin DOM, sin reloj: el «ahora» no entra aquí (el cierre lo dispara `open`, §4.4).
- **`src/utils/invitation.js` (ampliado).**
  - `interpretLookup(result)` → interpreta la respuesta de `lookup` (RF-8, I2): valida que el
    `type` sea `generic` o `public` (`INVALID_DATA` si no), lee el `limit` con la misma regla que
    `resolve` (entero > 0 o `"n"`) y devuelve `{ ok, errorCode, type, limit, deadline,
    previousResponse }`, donde `previousResponse` es `null` (sin fila **o** fila sin respuesta:
    `viewed`/`status` vacío) o el modelo de respuesta **más `name`** (`response.name`, el nombre
    registrado), reutilizando los ayudantes internos (`responseState`, `attendance`, `codeLimit`).
    Un `name` ausente **no** invalida la fila (se devuelve `null`, como el `message` opcional).
  - `attendeeLimits(invitation, lookupLimit)` → los límites que pinta el combo (RF-4, M2): en la
    personalizada, `{ adults: adultsGuests, children: childGuests }`; en la genérica y la pública,
    `{ adults: lookupLimit ?? invitation.limit, children: 0 }` —**manda la consulta** cuando
    difiere—; el valor `"n"` viaja tal cual (sin tope).
- **`src/utils/rsvp.js` (ampliado).**
  - `lookupPayload({ slug, code, phone })` → el cuerpo JSON de la consulta, con los nombres de
    campo locales y el **teléfono normalizado a dígitos** (RF-5, RF-8, I8).
  - `attendeeOptions(limit)` → la lista de opciones del combo (RF-4, D4): enteros `0..limit` con la
    opción 0 incluida cuando `limit` es un entero ≥ 1; `null` cuando el límite no es numérico (la
    pública `"n"` → **campo libre**) o es **0** (sin combo: solo rechazar).
  - `attendanceForm(invitation, previousResponse)` → la precarga del formulario (RF-2, RF-5,
    RF-10), movida aquí desde `Rsvp.jsx` para poder probarla: `response` (`""` sin respuesta,
    `rejected` para `rejected`, `confirmed` en el resto), `name` (el registrado o el titular de la
    personalizada), `adults` y `children` (los de la respuesta o los valores por defecto de hoy) y
    `message`/`restrictions`. El **teléfono** no forma parte de la respuesta: vive en el
    componente (lo que el invitado escribió).

### 4.3 Hook de la consulta por teléfono (RF-5; RNF-4)

- **`src/hooks/useGuestLookup.js` (nuevo).** Expone `{ status, errorCode, result, lookup(phone) }`
  con `status ∈ idle | looking | ok | error`:
  - `lookup(phone)` **valida antes de llamar** con `isPhoneComplete` (M4) y, mientras hay una
    consulta en curso, **ignora** las llamadas siguientes (doble clic, M10): un `useRef` hace de
    candado, como en `useRsvp`;
  - sin servicio listo (`not-configured`/`missing-slug`) no se llama: `error` con la causa de la
    configuración (004 RF-15);
  - arma el cuerpo con `lookupPayload` (el código, de la URL con `readGuestCode`), llama al
    **mismo** `callService` de `services/registration.js` y traduce con `interpretLookup`;
  - **no persiste nada** (el teléfono vive solo en memoria, RNF-2) y **no** lanza.
- Se prueba como los hooks actuales: primer pintado con `renderToStaticMarkup` (sin navegador) y
  las reglas de «no se llama» y «un segundo `lookup` se ignora».

### 4.4 Presentación (RF-1, RF-3, RF-4, RF-9, RF-10; RNF-1, RNF-3)

- **`src/components/sections/Rsvp.jsx` (reescrito).** Conserva el ancla `#confirmar`, el `<h2>`
  del registro (`confirmacion.titulo`), la foto estructural de la plantilla y el `useEffect` del
  foco al resultado; cambia lo de dentro:
  - **Estado del bloque:** `useState` con `initialBlockState(...)`, recalculado cuando cambia la
    invitación resuelta o el `retryToken` (reintento), y avanzado con `nextBlockState(...)` en cada
    interacción. `open` de `useConfirmation` (sin cambios) dispara `deadline` → `CLOSED` al vencer
    el plazo sin recargar (RF-1, RF-7). No se usa `useReducer` para no complicar la
    reinicialización (DT-3).
  - **`sin-respondido`:** solo el título y el botón **«Responder invitación»** (con
    `aria-expanded` y el panel asociado por `id`); nada del invitado a la vista (RF-3, D15, HU-14).
  - **`telefono` (solo genérica/pública):** el campo del teléfono y **«Continuar»**,
    deshabilitado hasta los diez dígitos; el foco entra al campo (RF-1, RF-5, M4).
  - **`consultando`:** teléfono `disabled`, «Continuar» `disabled`, sin formulario y el aviso
    «Estamos buscando tu respuesta…» en la región viva (M3).
  - **`respondido`:** agradecimiento (copy `OK` del contrato, válido también para `rejected`),
    **panel de datos en solo lectura** (`ResponseSummary`) y botón **«Editar»**; en la
    genérica/pública el panel incluye el **teléfono** aportado (M9) y la fecha solo si se conoce
    (no se inventa, 004 RF-13); el foco va al panel (RF-9, RF-10, RNF-1).
  - **`editando`:** el formulario en el **orden de RF-3** —nombre → acompañante → asistencia →
    cupos (personalizada); nombre → asistencia → adultos → alergias → mensaje (genérica/pública,
    con el **teléfono visible y editable** por encima del formulario)-; el nombre del titular
    personalizado lleva `readOnly`, el nombre registrado de la genérica/pública es **editable**
    (RF-10); los campos de asistentes son los **combos** de RF-4 (o el campo libre con `"n"`).
  - **`cerrado`:** el aviso de plazo de la 004 y, donde la personalizada tenga respuesta previa,
    sus datos en solo lectura; sin «Responder invitación» ni «Editar» (D8, RF-7).
  - **`degradado`:** el motivo de la causa (demo/error, o el fallo de `lookup`), «Reintentar»
    cuando la causa lo permita, «Responder invitación» **deshabilitado** y sin «Editar» (RF-7,
    D9). El caso `INVALID_PHONE`/`MISSING_FIELDS` de la consulta vuelve a `telefono` con el aviso
    (M4), no a `degradado`.
  - **Cupo del combo:** `attendeeLimits(invitation, lookup?.result?.limit)`; al enviar se pasa a
    `useRsvp` una invitación compuesta con ese límite para que la validación previa use el mismo
    criterio que el combo (DT-6).
- **`src/components/ui/AttendeeSelect.jsx` (nuevo).** El combo nativo (`<select>`) con su
  `<label>` y el texto de ayuda del cupo enlazado por `aria-describedby` (RNF-1): lo usan los
  adultos y los niños; la etiqueta y la ayuda son textos de interfaz en español.
- **`src/components/ui/ResponseSummary.jsx` (nuevo).** El panel de datos en **solo lectura** (lista
  etiqueta/valor, sin controles de formulario; nombre, asistentes, mensaje, restricciones, fecha y
  teléfono cuando existan), que se anuncia al aparecer y sirve a `respondido` y a `cerrado` con
  respuesta previa (RF-10, RNF-1).
- **Sin dependencias nuevas** (D11, RNF-3): combos nativos, panel y transiciones con HTML, CSS y
  React ya presentes; el encogible se resuelve con lo que hay (foco con `ref` y `aria-expanded`).

### 4.5 Documentación, registro y gobernanza (spec §5.2; I6)

- **No se toca el registro** `src/data/wedding.js`: el título del bloque sigue saliendo de
  `confirmacion.titulo` (M7) y `confirmacion.camposHabilitados` no cambia.
- **`docs/constitution.md` (principio 5).** Debe recoger que la app **lee y muestra** los datos de
  la fila identificada por teléfono en la invitación genérica y la pública (nombre, asistentes,
  mensaje y restricciones), con el **riesgo aceptado** de §1.4 escrito y el teléfono como **única
  barrera**; y que **enviar** el teléfono no es **escribirlo** (se escribe solo en el envío).
- **`AGENTS.md`.** Misma ampliación de alcance en su sección del servicio: la acción `lookup`, el
  riesgo aceptado, los `utils`/`hooks`/`ui` nuevos y la lista de verificación manual de §13.
- **`MEMORY.md`.** Estado y decisiones del cambio (y la depuración de lo que ya no aplique).
- **`PENDING_TASKS.md`.** Se depura: se retiran las entradas que dejen de aplicar por esta spec
  (si alguna la toca) y se conserva lo que siga pendiente; **no** se marca aquí la verificación
  manual de la 004 (§1).
- **`gas/README.md`.** Se amplía con la comprobación manual de `lookup` (teléfono con fila y sin
  fila) y el aviso de redesplegar el script.

### 4.6 El servicio Apps Script (RF-5, RF-6, RF-8; D14, 004 RF-17)

- **`gas/Code.gs` (ampliado).** `CONTRACT_VERSION` pasa a `'1.1.0'` (la **misma** que el módulo),
  `SERVICE_ACTIONS` gana `LOOKUP: 'lookup'` y `doPost` despacha la acción nueva. (DT-10):
  - valida `slug` (`MISSING_SLUG`), código (`MISSING_GUEST`), la boda (`findWedding_`) y que el
    `guest_type` **no** sea `personal` → `INVALID_RESPONSE`;
  - exige teléfono: vacío → `MISSING_FIELDS`; distinto de diez dígitos → `INVALID_PHONE`;
  - resuelve el límite del código **reutilizando `resolveCode_`** (con su caché; puede refrescar
    `generic_json_cache`, D14) y devuelve sus errores tal cual (`UNKNOWN_GUEST`, `INVALID_DATA`,
    `GUEST_SHEET_UNAVAILABLE`);
  - abre la hoja `guests`, busca **la fila de ese teléfono** (comparando normalizado a dígitos,
    primera coincidencia), **sin escribir nada** (ni `viewed`): si no hay fila o su `status` es
    vacío/`viewed` → `response: null`; si tiene respuesta, devuelve `state`, `adultsAttendees`,
    `childAttendees`, `message`, `restrictions`, `datetime` y **`name`** (columna `guest_name`)
    dentro de `response`;
  - responde `{ ok: true, action: 'lookup', type, limit, response, deadline }`, **sin** objeto
    `guest` y **sin** el teléfono; **ningún** código de error nuevo.
  - El camino `personal` (`resolvePersonal_`, que **sí** escribe `viewed`) **no** se reutiliza
    (DT-10).

## 5. Archivos nuevos y su responsabilidad

| Archivo | Responsabilidad | RF |
| --- | --- | --- |
| `src/utils/rsvpState.js` | Máquina de estados del bloque (arranque y transiciones), pura | RF-1, RF-7 |
| `src/utils/rsvpState.test.js` | Pruebas de la máquina de estados | RF-1, RF-7 |
| `src/hooks/useGuestLookup.js` | Estado y disparo de la consulta por teléfono | RF-5 |
| `src/hooks/useGuestLookup.test.js` | Primer pintado y reglas de la consulta | RF-5 |
| `src/components/ui/AttendeeSelect.jsx` | Combo nativo con etiqueta y ayuda del cupo | RF-4, RNF-1 |
| `src/components/ui/ResponseSummary.jsx` | Panel de datos en solo lectura | RF-10, RNF-1 |
| `LOOKUP_FIELDS` (`constants/contract.js`) | Literales del intercambio nuevo (módulo) | RF-8 |

## 6. El intercambio de `lookup` (RF-8, I2, D5)

```
Petición:   { action: "lookup", slug, code, phone }        // phone = los diez dígitos, normalizado

Respuesta:  { ok: true, action: "lookup", type, limit, response, deadline }
            type    = "generic" | "public"
            limit   = entero > 0 (genérica) | "n" (pública)   // el que manda para el combo (M2)
            response= null  |  { name, state, adultsAttendees, childAttendees,
                                 message, restrictions, datetime }
            deadline= "2027-…-06:00" | null
            // sin objeto `guest` y sin teléfono en la respuesta

Error:      { ok: false, code }   // códigos EXISTENTES de la 004 §4.1, ninguno nuevo
```

La **petición** usa los literales locales de `lookup`; el **cuerpo del envío** (`respond`) no
cambia. El teléfono **se envía** en la consulta y en el envío, pero **se escribe** solo en el
envío (I8, RF-6, RNF-2).

## 7. Funciones puras

Todo lo que decide **sin** entorno vive en `src/utils/`; lo que depende de él (el reloj, `fetch`,
`localStorage`, el DOM) entra por parámetro o vive en el hook/servicio (RNF-4).

| Función | Módulo | Entradas | RF |
| --- | --- | --- | --- |
| `initialBlockState({ status, invitation, open })` | `utils/rsvpState.js` | estado de la invitación, plazo | RF-1, RF-7 |
| `nextBlockState(state, event, { personalized })` | `utils/rsvpState.js` | estado y acontecimiento | RF-1, RF-5, RF-7 |
| `interpretLookup(result)` | `utils/invitation.js` | respuesta del servicio | RF-5, RF-8 |
| `attendeeLimits(invitation, lookupLimit)` | `utils/invitation.js` | modelo + límite consultado | RF-4 |
| `lookupPayload({ slug, code, phone })` | `utils/rsvp.js` | datos del paso | RF-5, RF-8 |
| `attendeeOptions(limit)` | `utils/rsvp.js` | el cupo que toca | RF-4 |
| `attendanceForm(invitation, previousResponse)` | `utils/rsvp.js` | modelo + respuesta previa | RF-2, RF-5, RF-10 |
| `phoneDigits` / `isPhoneComplete` (sin cambios) | `utils/rsvp.js` | texto | RF-5, M4 |

Ninguna función lee `Date.now()` por dentro, ninguna toca el DOM y ninguna importa un módulo de
React: es lo que hace que `node --test` las cubra.

## 8. Contratos que NO cambian

Nada de esto se toca; `test/contracts.test.js` y `test/andamiaje.test.js` lo siguen vigilando:
anclas de la página (incluidos `#confirmar` y `#numero`, que se conservan en el rework), el
parámetro del enlace **`guest`** y la **ausencia** de los jubilados, la clave `kg-tema` y sus
valores, el registro y sus claves (`confirmacion.titulo`, `camposHabilitados`), los **códigos de
error** de la 004 §4.1 (ninguno se retira ni se renombra; `lookup` no añade ninguno), el cupo y
los cuatro estados del libro, y la API de `useInvitation`/`useRsvp`/`useConfirmation` y de
`validateRsvp`/`rsvpPayload`/`interpretRsvpResult`. `services/registration.js` y `utils/service.js`
se quedan como están.

## 9. Decisiones técnicas y alternativas descartadas

- **DT-1 · Una acción nueva en el módulo único, con subida menor de versión (`1.1.0`).** `lookup`
  se declara en `constants/contract.js` (fuente única) y el documento y el servicio se actualizan
  a la vez (RF-8, D5). *Descartado:* no subir la versión (lo prohíben 004 RF-17/RF-8) y subir a
  `2.0.0` (nada se retira ni se renombra: `resolve` y `respond` no cambian), y un `lookup` fuera
  del contrato (la app dejaría de tener fuente única).
- **DT-2 · `lookup` devuelve el modelo de `resolve` más `name` dentro de `response`.** El nombre
  registrado es un dato de **la respuesta** (como `datetime`), no del invitado; no hay objeto
  `guest` (004 RF-6, D5; RF-8). *Descartado:* un objeto `guest` con el nombre (los tipos
  genérico/público no precargan titular ni cupo) y devolver la fila cruda (rompería D20/DT-3 de la
  004 y filtraría columnas).
- **DT-3 · La máquina de estados es un módulo puro con tabla de transiciones, y el componente usa
  `useState` + `nextBlockState`.** Así la máquina se prueba entera con `node --test` (§12, B2, I1)
  y el componente solo la pinta. *Descartado:* banderas sueltas de `useState` en `Rsvp.jsx` (no
  verificables y origen de la contradicción I1) y `useReducer` (la reinicialización al responder la
  invitación o al reintentar queda más enredada sin ganar nada).
- **DT-4 · La consulta por teléfono vive en un hook propio (`useGuestLookup`).** Tiene su propio
  ciclo de vida (por teléfono) y su propio candado contra el doble clic (M10). *Descartado:*
  ampliar `useRsvp` (mezclaría dos estados —consulta y envío— y su API, que esta spec no cambia).
- **DT-5 · Dos piezas de `components/ui/` para el combo y el panel de lectura.** Evitan duplicar
  el `<select>` con su etiqueta y ayuda (dos combos por formulario) y el panel de solo lectura
  (aparece en `respondido` y en `cerrado`). *Descartado:* todo incrustado en `Rsvp.jsx` (duplicaría
  el marcado accesible y engordaría el archivo).
- **DT-6 · El cupo efectivo del combo y de la validación sale de `attendeeLimits`; manda la
  consulta cuando difiere.** Al enviar se pasa a `useRsvp` una invitación compuesta con ese límite
  para que la validación previa use el mismo criterio que el combo (M2), y el servicio sigue siendo
  la autoridad (`OVER_LIMIT`). *Descartado:* cambiar la firma de `validateRsvp`/`useRsvp` (esta
  spec no los toca) y quedarse con el `limit` de `resolve` (el combo podría ofrecer menos de lo que
  la lectura vigente permite).
- **DT-7 · `useInvitation`, `useRsvp` y `useConfirmation` no cambian.** Comprobado: la
  personalizada **ya** trae `previousResponse` (RF-2), el envío **ya** valida y traduce (RF-9) y el
  cierre sin recargar **ya** existe (`open` pasa a `false` y el bloque deriva `CLOSED`) (RF-1,
  RF-7). *Descartado:* reescribir los tres «de paso» (rompería lo que ya funciona y su frontera).
- **DT-8 · Combos nativos; con `"n"` un campo numérico libre y con cupo 0 sin combo.** `n` sigue
  significando **sin tope** y no se declara ningún máximo artificial (R1, RF-4, 004 RF-9/D12
  íntegras). *Descartado:* declarar un máximo para `n` (derogaría la 004 y la decisión R1) y
  ocultar la opción 0 del combo (el punto 4 pide el cupo explícito; M1).
- **DT-9 · Colapsable y foco con lo que ya hay.** Botón real con `aria-expanded`, panel asociado
  por `id`, `ref` para llevar el foco al primer campo o al panel, y regiones vivas
  (`role="status"`) para anunciar los cambios (RNF-1, D11). *Descartado:* `<details>`/`<dialog>`
  aquí (no permiten dirigir el foco ni el estado con la matriz de RF-1) y cualquier librería de
  UI/animación (prohibida, RNF-3).
- **DT-10 · El servicio reutiliza `resolveCode_` y **no** `resolvePersonal_`.** Así el límite y la
  caché salen del mismo camino que `resolve` (D14) y `lookup` **no** escribe el `viewed` (el
  `viewed` sigue siendo solo de la personalizada). *Descartado:* reutilizar el camino de la
  personalizada (escribiría `viewed` al leer y rompería D14/RF-6) y leer la hoja `generic` sin la
  caché (duplicaría la lógica de la 004).
- **DT-11 · La verificación del contrato se amplía sin runner nuevo.** `test/serviceContract.test.js`
  gana los literales de `lookup` (desde `LOOKUP_FIELDS` y `SERVICE_ACTIONS`) y la comprobación de
  que `gas/Code.gs` declara **la misma** `CONTRACT_VERSION` (se lee como texto). *Descartado:*
  ejecutar el Apps Script desde la prueba (exigiría credenciales y red; RNF-5 prohíbe verificar
  contra el servicio vivo) y dejarlo todo a la comprobación manual (RF-8 pide la automática donde
  se pueda).
- **DT-12 · La documentación y la gobernanza van al final (T9).** La constitución, `AGENTS.md`,
  `MEMORY.md` y `PENDING_TASKS.md` describen comportamiento y rutas: hacerlo antes dejaría la
  documentación en contradicción con el código. *Descartado:* enmendar la constitución al
  principio (a diferencia de la 004, aquí el código **no** la contradice: la amplía).

## 10. Estrategia de implementación (cada paso termina en verde)

Cada paso cierra con `npm test` en verde y `npm run build` sin errores; ninguna prueba se relaja:
si vigila un nombre que cambia, se actualiza **comprobando lo mismo**.

1. **Contrato (T1):** `lookup`, `LOOKUP_FIELDS` y la versión `1.1.0` en el módulo; el documento al
   día; la prueba de sincronía sigue en verde con el literal nuevo.
2. **Servicio Apps Script (T2):** la acción `lookup` en `gas/Code.gs` y su puesta en marcha; sin
   códigos nuevos y sin escribir el libro.
3. **Prueba de contrato ampliada (T3):** literales de `lookup` + igualdad de `CONTRACT_VERSION`
   módulo ↔ `gas/Code.gs`.
4. **Lógica pura (T4 y T5):** la máquina de estados, la interpretación de `lookup`, el cuerpo de la
   consulta, las opciones del combo y la precarga del formulario, con sus pruebas co-locadas.
5. **Hook de la consulta (T6):** `useGuestLookup`, con su prueba de primer pintado y de doble clic.
6. **Presentación (T7 y T8):** las piezas de `ui/` y el rework de `Rsvp.jsx`. La app queda
   coherente porque la lógica pura y el hook van antes.
7. **Documentación y gobernanza (T9)** y **verificación manual (T10)**: la constitución (principio
   5), `AGENTS.md`, `MEMORY.md`, `PENDING_TASKS.md`, `gas/README.md` y el veredicto en
   «Verificación». La verificación manual **de la 004** sigue pendiente y **no** forma parte de
   estas tareas (§1).

## 11. Estrategia de pruebas con `node --test`

- **Convención intacta:** `*.test.js` co-locado con su módulo; `npm test` sigue siendo `node --test`
  (sin instalar nada). Los guardarraíles viven en `test/`.
- **Ampliadas:** `utils/invitation.test.js` (interpretación de `lookup` y `attendeeLimits`) y
  `utils/rsvp.test.js` (`lookupPayload`, `attendeeOptions` y `attendanceForm`).
- **Nuevas:** `utils/rsvpState.test.js` y `hooks/useGuestLookup.test.js`.
- **Ampliado:** `test/serviceContract.test.js` (los literales de `lookup` y la igualdad de versión
  con `gas/Code.gs`).
- **Casos que deben existir sí o sí** (lo que la spec §10 exige):
  - **la máquina de estados completa**: los siete estados, el arranque por la regla de D2
    (`degradado` > `cerrado` > `respondido` —personalizada con respuesta previa— > `sin-respondido`)
    y cada transición (reveal, continue, found/none/failed/invalid-phone, edit, submit-ok/fail,
    deadline), con los acontecimientos que **no** aplican devolviendo `null` (M10);
  - **la precarga de la edición** (`attendanceForm`) desde una respuesta, incluido `rejected`, y
    desde una sin respuesta (valores por defecto de hoy);
  - **los rangos de los combos** (`attendeeOptions`): `0..cupo` con la opción 0, cupo 0 → sin combo,
    `"n"`/`Infinity` → sin combo (campo libre);
  - **la interpretación de `lookup`**: fila con respuesta (con `name` dentro de `response`), sin
    fila (`null`), fila sin respuesta (`viewed`/vacío → `null`), respuesta que no es de contrato
    (`INVALID_DATA`) y `type` personal (`INVALID_DATA`); la respuesta **no** trae teléfono;
  - **el cupo que manda cuando `resolve` y `lookup` difieren** (`attendeeLimits`);
  - **el teléfono del paso previo** (`lookupPayload` normaliza; `useGuestLookup` no llama con menos
    de diez dígitos y traduce `INVALID_PHONE` sin degradar el bloque —regla del componente—).
- **Lo que `node --test` no puede cubrir** (y por eso queda para la verificación manual): `fetch`
  contra el servicio real, `import.meta.env`, el DOM (foco, regiones vivas, `<select>`) y el propio
  `gas/Code.gs` en ejecución. Misma frontera que hoy.

## 12. Verificación

- **Automática:** `npm test` completo y `npm run build` en verde. La forma de `lookup` se verifica
  contra el **módulo** del contrato, no contra el servicio vivo (RNF-5), y la igualdad de versión se
  comprueba leyendo `gas/Code.gs` como texto.
- **Manual en navegador (escritorio y móvil), contra el servicio redesplegado con `lookup`**
  (spec §10):
  1. **personalizada sin** respuesta previa: ningún dato del invitado fuera del bloque →
     «Responder invitación» → formulario con el **nombre antes** que el acompañante y la asistencia
     → envío → agradecimiento + datos en lectura + «Editar» → «Editar» precarga todo;
  2. **personalizada con** respuesta previa (`confirmed` y `rejected`): arranca en `respondido`;
     «Editar» precarga asistentes, mensaje, restricciones y asistencia; el titular no es editable;
  3. **genérica/pública**: «Responder invitación» → `telefono` (solo el teléfono y «Continuar») →
     incompleto no avanza → completo: `consultando` (teléfono deshabilitado, aviso anunciado) →
     **sin fila**: formulario limpio; **con fila**: `respondido` con los datos de esa fila (nombre,
     asistentes, teléfono) → «Editar» con el **nombre editable** y el teléfono visible → el envío
     actualiza esa misma fila;
  4. **cambiar el teléfono** en el formulario tras la consulta: no se vuelve a consultar, se avisa
     y la respuesta se guarda con el teléfono nuevo;
  5. **selección de asistentes**: combos con rangos completos y opción 0 (que «confirmar» rechaza),
     cupo 0 (sin combo, solo rechazar) y campo libre con `n`;
  6. **plazo vencido** (personalizada con y sin respuesta; genérica/pública sin paso de teléfono),
     **degradación** con el servicio caído (incluida la consulta `lookup` fallida, con su
     reintento) y **modo demo**; **doble clic** en «Continuar»/«Responder invitación»/«Editar» sin
     efectos dobles;
  7. **privacidad y riesgo aceptado**: al **recargar** en `respondido`, la genérica/pública vuelve a
     pedir el teléfono; el teléfono no aparece en `localStorage` ni en la URL; la respuesta de la
     consulta no trae teléfono ni datos de otras filas; la consulta **no** deja ninguna escritura en
     la hoja `guests` (el `viewed` no se escribe en la genérica ni en la pública).
- **Registro:** el veredicto se anota en «Verificación» de `AGENTS.md` (lo rellena el coordinador,
  como en la 004).

## 13. Cobertura de requisitos

| Parte del plan | RF/RNF |
| --- | --- |
| §4.2 `rsvpState.js`, §4.4 `Rsvp.jsx` | RF-1 |
| §4.2 `attendanceForm`, §4.4 `editando`/`respondido` de la personalizada | RF-2 |
| §4.4 orden del formulario y D15/HU-14 | RF-3 |
| §4.2 `attendeeOptions`/`attendeeLimits`, §4.4 `AttendeeSelect` | RF-4 |
| §4.2 `lookupPayload`/`interpretLookup`, §4.3 `useGuestLookup`, §4.4 paso del teléfono | RF-5 |
| §4.6 `lookup` de una fila sin escribir el libro, §4.1 documento (riesgo aceptado) | RF-6 |
| §4.2 `initialBlockState`/`nextBlockState`, §4.4 `cerrado`/`degradado` | RF-7 |
| §4.1 módulo + documento + versión, §4.6 `gas/Code.gs`, §11 prueba de sincronía | RF-8 |
| §4.4 `respondido` tras el envío (el envío no cambia) | RF-9 |
| §4.2 `attendanceForm`, §4.4 nombre editable, §4.4 `ResponseSummary` | RF-10 |
| §4.4 `AttendeeSelect`/`ResponseSummary`/foco/regiones vivas/`disabled` real | RNF-1 |
| §4.6 consulta de una fila sin teléfono en la respuesta ni persistencia | RNF-2 |
| §4.4 sin librerías; combos y panel nativos | RNF-3 |
| §2 estructura, §4 capas, §7 funciones puras | RNF-4 |
| §11 pruebas puras + §4.1 igualdad de versión; §12 manual | RNF-5 |
| §4.5 conocimiento/`AGENTS.md`/`MEMORY.md` (I6) | §5.2 de la spec |

## 14. Riesgos y mitigaciones

- **La consulta `lookup` escribe el libro sin querer (p. ej. `viewed`).** → DT-10: no se reutiliza
  `resolvePersonal_`; el camino nuevo **solo lee** y la prueba manual del punto 7 lo comprueba.
- **El combo ofrece un cupo distinto del que la app valida.** → DT-6: combo y validación previa
  comparten el cupo efectivo (`attendeeLimits`); el servicio sigue rechazando con `OVER_LIMIT`.
- **El teléfono viaja o se persiste donde no debe.** → Se **envía** en la consulta y el envío y
  **no** se escribe en la respuesta (RF-6); nada en `localStorage` ni en la URL (RNF-2); un caso de
  prueba puro lo fija.
- **Dobles pulsaciones durante la consulta.** → Candado con `useRef` en `useGuestLookup` (M10) y
  `nextBlockState` devolviendo `null` para los acontecimientos que no aplican; «Editar» no se ofrece
  en `consultando`.
- **La versión del contrato se desincroniza entre módulo y script.** → La prueba del §11 la compara
  leyendo `gas/Code.gs`; el redespliegue se anota en `gas/README.md` y en la verificación manual.
- **El documento se queda atrás respecto al módulo.** → Los literales de `lookup` se declaran en el
  módulo y la prueba de sincronía los exige en el documento; el documento es el derivado (DT-1).
- **La app queda a medias entre cinco y siete estados.** → Se implementa la máquina entera de una
  vez (T4) **antes** que la presentación (T8), y `Rsvp.jsx` deriva **todo** de `BLOCK_STATES` (sin
  banderas paralelas).

## 15. Fuera de alcance (recordatorio)

Todo lo que la spec §9 excluye: autenticación o segunda verificación del teléfono, persistir el
teléfono/estado en el navegador, cambiar el modelo de los libros, añadir estados del libro,
notificaciones a la pareja, panel de administración, tope global de asistentes, generar enlaces,
declarar un máximo para `PUBLIC` (`n`) y verificar contra el servicio vivo en la prueba automática.

## 16. Criterios de finalización de este plan

1. El contrato declara `lookup` en **módulo + documento + `gas/Code.gs`** con la **misma**
   `CONTRACT_VERSION` (`1.1.0`), sin ningún código de error nuevo (RF-8; T1–T3).
2. La máquina de estados del bloque (siete estados y sus transiciones) y la lógica de `lookup`
   (cuerpo, interpretación, combos y precarga) están en `src/utils/` con sus pruebas puras en verde
   (RF-1…RF-5, RF-10; T4–T5).
3. La sección de confirmación pinta los siete estados, con el orden de RF-3, el paso del teléfono
   de RF-5, los combos de RF-4 y el panel de lectura de RF-10, accesibles (RNF-1) y sin
   dependencias nuevas (RNF-3; T6–T8).
4. La documentación y la gobernanza quedan al día (`docs/constitution.md` principio 5, `AGENTS.md`,
   `MEMORY.md`, `PENDING_TASKS.md`, `gas/README.md`) (spec §5.2; T9).
5. `npm test` en verde con las pruebas nuevas y `npm run build` sin errores (RNF-5).
6. La verificación manual de §12 está hecha contra el despliegue vivo y anotada en «Verificación»
   (T10); la verificación manual de la **004** sigue pendiente y sin marcar (§1).
