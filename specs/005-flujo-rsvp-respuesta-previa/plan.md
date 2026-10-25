# Plan técnico — Flujo del RSVP: respuesta previa, estados del bloque y selección de asistentes

Traduce a decisiones de implementación la spec `spec.md` de esta carpeta (RF-1…RF-10, RNF-1…RNF-5,
las decisiones D1–D16 y las decisiones cerradas R1–R7). Cada parte indica **qué RF cubre**. Parte
del **estado real de la spec 004** (implementada y verificada contra el servicio vivo), no de un
árbol imaginario. Los identificadores de código van en inglés; los textos visibles, los datos, los
comentarios y la documentación, en español (RNF-4, constitución principio 6).

> **Cómo leer este plan.** Las **§1–§16** traducen la spec del cuerpo (§1–§12). La **§17** traduce el
> **primer cambio de requisitos posterior** (§13 de la spec: RF-12…RF-15, D19/D20, R12/R13). La
> **§18** traduce el **segundo cambio posterior** (§14 de la spec: RF-16/RF-17, D21/D22, R14/R15).
> Ambas viven **después** del cuerpo: donde la más reciente contradiga a la anterior, **manda la más
> reciente** (**§18 sobre §17**, §17 sobre §1–§16; y la spec §14 manda sobre su propio §13). La §17
> enumera **qué queda superado** de las §1–§16; la §18 enumera **qué queda superado** de las §1–§16
> **y de la §17**.

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
8. **[Cambio de §13 — §17, Fase 6 (T16–T23).]** Va **después** de la Fase 5 y **no** reescribe nada:
   lógica pura primero (**T16**: `rsvpPayload` con el mensaje del rechazo + `responseSummaryData`),
   luego la interfaz (**T17**–**T18**: gating del mensaje y región viva; copy del rechazo y saludo),
   el **arreglo de la precarga del rechazo** en la composición pura (**T23**, DT-17: `state` en
   `responseSummaryData`), el servicio (**T19**: `lookupResponse_` solo exige `phone`) con su
   comprobación manual y documento (**T20**), la verificación manual del cambio (**T21**) y la
   gobernanza (**T22**). El contrato **no** cambia (`1.1.0`).

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
  (spec §10). Los puntos **8–11** son del **cambio de requisitos** (§17.6) y se añaden a los siete del
  cuerpo:
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
  5. **selección de asistentes** (estado real de la Fase 5, §17.7): combos **por campo** —
     adultos `1..cupo` **sin** el 0, niños `0..cupo`—, cupo 0 (sin combo, solo rechazar), campo libre
     con `n` (`min={1}`) y la normalización de un 0 heredado de adultos a 1;
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
7. El **cambio de requisitos de la spec §13** queda cubierto por la **§17** (T16–T23), con lo que la
   §17 marca como superado de las §1–§16 ya actualizado.

## 17. Cambio de requisitos de la spec §13 (RF-12…RF-15, D19/D20, R12/R13)

Traduce el **cambio posterior** que vive en la **§13 de la spec** (aprobado por quien la pide). Parte
del **estado real del código** ya implementado (spec 005 con las fases 1–5 hechas: `Rsvp.jsx`,
`src/utils/rsvp.js`, `ResponseSummary.jsx` y `gas/Code.gs` **como están hoy**), no de un modelo
imaginario. Se añade **después** de la §16 para no reescribir lo ya implementado y verificado; **no**
repite tareas (esas van en `tasks.md`, Fase 6) ni cambia el contrato.

### 17.1 Qué pide el cambio y en qué capa cae

| Pedido | RF | Capa | Efecto |
| --- | --- | --- | --- |
| Copy propia del rechazo | **RF-12**, D20, R12 | **Interfaz** (rótulo con el componente) | «Lamentamos que no puedas acompañarnos. Gracias por tu respuesta.» en `respondido` y en el envío aceptado de un `rejected`; no toca el contrato. |
| Mensaje también al rechazar | **RF-13**, D18/D17 matizadas | **Interfaz + composición del envío + lógica pura del panel** | El `message` se escribe, se envía, se muestra y se precarga en un rechazo; adultos, niños y restricciones siguen fuera. |
| Saludo con el nombre (personalizada) | **RF-14**, D19 | **Interfaz** | «Hola, \<nombre completo\>» en el contenido revelado (y sobre el panel en `respondido`); nunca en la vista colapsada. |
| La consulta tolera cabeceras que no usa | **RF-15**, R13 | **Servicio** (`gas/Code.gs`) + su comprobación manual | `lookupResponse_` exige **solo `phone`**; la escritura no se relaja. |

**No cambia:** el contrato (`CONTRACT_VERSION` sigue `1.1.0`), el modelo del libro, los códigos de
error, la escritura del servicio ni `test/serviceContract.test.js` (su regla es la misma). La copy del
rechazo es un **rótulo de interfaz** y vive **con su componente** (`AGENTS.md`), **no** en
`src/constants/contract.js`; la prueba de sincronía vigila una lista **cerrada** de objetos del módulo
y una copy no entraría en ella (spec §13.4).

### 17.2 Mapa de archivos del cambio

- **`src/utils/rsvp.js` (lógica pura, ampliada).**
  - **`rsvpPayload` (modificada)** — hoy, con `response === "rejected"`, `return payload` **antes** de
    `message`/`restrictions`/`adults`/`children` (línea ~149). Pasa a **dejar viajar solo el
    `message`** en un rechazo: se mantiene el `return` que omite `adults`, `children` y
    `restrictions`, pero **antes** se añade el `message` con la misma regla que en una confirmación
    (`text(message) !== null` → se incluye; sin mensaje, no se manda el campo). El resto del cuerpo
    (acción, slug, código, respuesta, teléfono, nombre) **no** cambia. *Alternativa descartada:*
    quitar el `return` y enviar también asistentes/alergias en un rechazo (rompería D18/004 D26, que
    siguen fuera, y el servicio escribiría asistentes que el invitado no confirmó).
  - **`responseSummaryData(answer, personalized)` (nueva, pura)** — la composición del **panel de solo
    lectura** (RF-13, RF-10; DT-13 de esta §17), movida desde `summaryData` de `Rsvp.jsx`. Entradas:
    la respuesta (`answer`) y si la invitación es personalizada. Devuelve el objeto que consume
    `ResponseSummary` con los mismos campos que hoy (`name`, `adultsAttendees`, `childAttendees`,
    `message`, `restrictions`, `datetime`, `phone`), con la **misma regla** de hoy **menos** el
    mensaje: en un rechazo, `adultsAttendees`/`childAttendees`/`restrictions` van **ausentes**
    (`undefined`, no `0` ni `""`, que sí se pintarían) y el **`message` sí se conserva** (se devuelve
    `answer.message`); en una confirmación, todo como hoy. Sin `answer` → `null`. Sin React, sin DOM
    y sin reloj (RNF-4/RNF-9). *Alternativa descartada:* dejarlo en el componente (como `summaryData`
    hoy): la composición de un rechazo es una **decisión de negocio** —qué se muestra y qué no—, no
    presentación, y así se prueba con `node --test` (era la contradicción I3 de la spec).
    - **FIX (T23): la composición conserva también el `state`** — además de los campos visibles, el
      objeto devuelto mantiene **`state: answer.state`** (el estado de la respuesta: `confirmed`/
      `rejected`/`updated`), porque es lo que `attendanceForm` necesita para precargar el formulario.
      `ResponseSummary` **no** lo pinta: su API es una lista **cerrada** de props y `state` no es una
      de ellas, así que la prop se queda sin consumir en el panel (no aparece como campo visible y no
      se toca la pieza). Con esto, el panel y el «Editar» comparten **una sola fuente** compuesta
      (DT-17).
- **`src/utils/rsvp.test.js` (ampliada).** Los casos nuevos de `rsvpPayload` (rechazo con mensaje →
  viaja; rechazo sin mensaje → rechazo válido sin `message`; rechazo nunca manda adultos/niños/
  restricciones; confirmación como hoy), de `responseSummaryData` (rechazo **conserva** el mensaje y
  **omite** adultos/niños/restricciones; confirmación como hoy; `personalized` decide los niños;
  `null` sin respuesta) **y el caso que hoy falta (T23): el objeto compuesto conserva `state` y
  `attendanceForm(invitation, responseSummaryData(answer, personalized))` de un rechazo arranca en
  `rejected`** (no en `confirmed`), sin tocar el estado en el resto de casos. Se implementa **tests
  primero** (ver T16 y T23).
- **`src/components/sections/Rsvp.jsx` (modificado).**
  - **`summaryData` (local, retirada)** → se sustituye por la llamada a **`responseSummaryData`**
    (importada de `utils/rsvp.js`); `answeredData` se compone con la función pura (RF-13).
  - **`handleEdit` (sin cambio de forma, con la fuente ya arreglada)** — sigue pasando **`answeredData`**
    a `attendanceForm(effectiveInvitation, answeredData)`; el arreglo de T23 va en la composición pura
    (el `state` que ahora conserva), **no** en esta llamada: así el panel y el «Editar» comparten una
    sola fuente (DT-17) y no hay una segunda vía en el componente.
  - **`showsAttendanceFields(response)` (ajustada)** — hoy devuelve `true` solo con `confirmed`, y
    ese único booleano gatea **los cuatro** campos. Se parte el gating en dos:
    - `showsAttendanceFields(response)` → **adultos, niños y alergias** (sigue `true` solo con
      `confirmed`);
    - el campo **mensaje** se pinta con `confirmed` **o** `rejected` (un predicado propio, p. ej.
      `showsMessageField`, o la comprobación inline `form.response === confirmed || rejected`).
    El mensaje **no** se pinta sin elegir asistencia.
  - **`attendanceNotice(response)` (ajustada)** — el aviso de `rejected` deja de decir «ni mensaje»:
    pasa a «No se muestran los campos de asistentes ni alergias.» (el mensaje **sí** se muestra,
    RF-13, I2 de la spec). El aviso de `confirmed` y el de «sin elegir» no cambian.
  - **Copy del rechazo (nueva, local)** — una constante de interfaz en el módulo del componente (p.
    ej. `const REJECTION_NOTICE = "Lamentamos que no puedas acompañarnos. Gracias por tu respuesta.";`)
    usada en dos sitios donde hoy se usa `serviceNotice(CODES.OK).message`:
    - el aviso de `respondido` (línea ~607-609): elige la copy del rechazo cuando la respuesta
      registrada es `rejected` (por `answer.state`), y la de `OK` en cualquier otra;
    - el agradecimiento tras un **envío aceptado** de un `rejected`: se resuelve con el estado
      enviado (`form.response`/`answered.state`), no con el código `OK`.
    La copy **no** va a `contract.js` (D20, §13.4) y **no** se toca `serviceNotice` ni el código `OK`.
  - **Saludo con el nombre (RF-14, D19)** — un `<p className="rsvp-lead">` (o similar, texto visible,
    no un control) con «Hola, {invitation.guestName}», **solo** en la personalizada:
    - en **`editando`**: como **primer** elemento del contenido revelado, **antes** del campo del
      nombre (solo lectura) y **antes** de «Hemos reservado … en tu honor» (orden fijado en la spec
      §5/RF-3: saludo → nombre → lugares reservados → resto);
    - en **`respondido`**: **sobre** el `ResponseSummary` (antes del panel), no dentro ni debajo de
      sus pares etiqueta/valor (I1);
    - **nunca** en las vistas colapsada/`telefono`/`consultando`/`cerrado`/`degradado` ni en la
      genérica/pública.
    El nombre sale de `invitation.guestName` **tal cual** (no se adivina el nombre de pila).
  - **Sin dependencias nuevas** (RNF-3): el saludo, la copy y los avisos son HTML/React ya presentes.
- **`src/components/ui/ResponseSummary.jsx`** — **no cambia de API**: ya pinta la fila del mensaje
  cuando el valor no está vacío; el cambio de «qué se le pasa» es de `responseSummaryData`, no de la
  pieza. (Se revisa que no haya que tocarlo; si lo hubiera, se documenta aquí.)
- **`gas/Code.gs` (modificado, RF-15/R13).** En **`lookupResponse_`** (~líneas 566-578), la
  comprobación de cabeceras pasa de exigir `[PHONE, GUEST_NAME, STATUS]` a exigir **solo
  `[PHONE]`** (`firstMissingColumn_(headerMap, [GUEST_COLUMNS.PHONE])`): la consulta **no** necesita
  `guest_name` (el nombre registrado es **opcional**, como el `message`) ni `status` (su ausencia vale
  por **primera respuesta**: el código ya trata `null`/`viewed` como `response: null`). La lectura de
  la fila ya usa `cellOf_` (devuelve vacío si la columna no está) y `parseCount_`, así que **no** hay
  más cambios en la lectura: el resto del camino es el de hoy. **No** se toca el camino `personal`
  (`resolvePersonal_`), ni la escritura (`registerCodeResponse_`), ni `CONTRACT_VERSION`. *Alternativa
  descartada:* devolver `INVALID_DATA` «amable» cuando falte una cabecera opcional (seguiría
  rompiendo el reporte: el libro real no declara esas cabeceras) y relajar también `phone` (no habría
  fila que localizar).
- **`gas/README.md` (ampliado).** La comprobación manual de `lookup` (punto 6) gana los casos de
  §13.3 de la spec: libro **sin `guest_name`/`status`** → la consulta **no** falla (devuelve la fila
  con `name: null`, `state: null`/`response: null`); libro **sin `phone`** → **sí** falla con
  `INVALID_DATA`; `generic_json_cache` ausente → **no** es el fallo (la caché es una copia, 004
  RF-18). Se añade el **aviso de redespliegue**: la tolerancia vive en el script, así que hasta
  desplegar una **nueva versión** la consulta sigue exigiendo las tres cabeceras.
  - **Nota de diagnóstico (caso real, T20): «`INVALID_DATA` al resolver un código = dato del libro,
    no de la app».** Un `INVALID_DATA` que aparece **antes** de leer ninguna fila sale de
    **`resolveCode_`** (`gas/Code.gs`, ~líneas 377-384), que aplica la regla del **tipo** de la boda
    sobre el `limit` del código: una boda **`public`** exige que el `limit` sea exactamente **`"n"`**;
    una boda **`generic`** exige un **entero > 0**; cualquier otro valor → **`INVALID_DATA`**.
    Consecuencia que hay que dejar escrita: **un código `PUBLIC` (con `limit = "n"`) dentro de una
    boda `generic` nunca resuelve** — da `INVALID_DATA` con o sin teléfono, en `resolve` y en
    `lookup`—. No es un defecto de la **app** ni de la acción `lookup`: la app **no** inventa
    `PUBLIC` (solo lo usa si el enlace lo trae) y el fallo ocurre al resolver el **código**, antes de
    mirar el teléfono. El arreglo de ese caso es **de datos** (borrar la fila `PUBLIC` de la hoja
    `generic` de una boda que es solo de genéricos), **no** de código: el servicio **no** se toca y
    **no** se añade ningún código de error nuevo (decisión cerrada). Lo que sí conviene documentar para
    quien diagnostica: **cómo distinguirlo** de los otros `INVALID_DATA` y de los fallos que **no** son
    este (teléfono ausente → `MISSING_FIELDS`; código inexistente → `UNKNOWN_GUEST`; cabecera que la
    consulta necesita y falta → `INVALID_DATA` después de resolver el código; caché ausente → no es el
    fallo). Detalle de este aviso, en T20.
- **`docs/servicio-invitados.md` (ampliado, derivado).** En la sección de `lookup` (§1, tabla de la
  respuesta) y/o en §5: aclarar que la **consulta tolera** `guest_name`/`status` ausentes (nombres
  opcionales; `status` ausente = primera respuesta) y que **un rechazo puede llevar mensaje** (RF-13).
  **No** recoge la copy del rechazo (vive con el componente, §13.4). No cambia la línea de versión
  (`1.1.0`) ni los códigos de error.
- **`test/serviceContract.test.js`** — **no cambia de regla**: la copy no es literal del módulo (§13.4).
  Se revisa que siga verde con el documento actualizado (el documento **no** introduce la copy).

### 17.3 Funciones puras del cambio (con su firma)

| Función | Módulo | Entradas | Salida | RF |
| --- | --- | --- | --- | --- |
| `rsvpPayload({…})` (modificada) | `utils/rsvp.js` | el formulario y la respuesta elegida | cuerpo JSON; en un rechazo, con `message` y **sin** adultos/niños/restricciones | RF-13 |
| `responseSummaryData(answer, personalized)` (nueva) | `utils/rsvp.js` | respuesta + tipo | objeto para `ResponseSummary`; en un rechazo conserva `message` y omite adultos/niños/restricciones | RF-13, RF-10 |

Ambas sin React, sin DOM y sin reloj: se cubren con `node --test` (RNF-4, RNF-9). La **copy** y el
**saludo** son textos de interfaz y **no** son funciones puras (viven con el componente, RNF-3/§13.4).

### 17.4 Decisiones de implementación (DT-13…DT-16)

- **DT-13 · `rsvpPayload` envía el mensaje en un rechazo; los demás campos del rechazo siguen fuera.**
  Se añade el `message` **antes** del `return` del rechazo, con la regla de «solo si tiene valor».
  *Descartado:* enviar todo el rechazo (rompe D18/004 D26) y dejar el mensaje fuera (es lo que el
  cambio pide). El contrato **no** cambia: `message` ya es un campo del envío.
- **DT-14 · La composición del panel de lectura vive en lógica pura (`responseSummaryData`).** Se saca
  de `Rsvp.jsx` (`summaryData`) a `utils/rsvp.js` con su prueba co-locada; la regla del rechazo se
  prueba sin DOM (era la contradicción I3 de la spec). *Descartado:* dejarla en el componente (no
  verificable) y que `ResponseSummary` decida por su cuenta (mezclaría presentación con negocio; su
  API no cambia).
- **DT-15 · La copy del rechazo es un rótulo de interfaz en `Rsvp.jsx`, no una entrada del módulo.**
  La regla de `AGENTS.md` («los rótulos de interfaz que no son datos viven con su componente») y la
  lista cerrada de la prueba de sincronía lo exigen. *Descartado:* declararla en
  `src/constants/contract.js` (el módulo aloja literales del modelo del servicio, no copy de interfaz;
  además `test/serviceContract.test.js` no la vigilaría) y que el servicio devuelva un código nuevo
  (tocaría la forma del contrato y su versión por puro texto, D20).
- **DT-16 · El saludo se pinta con el dato ya resuelto (`invitation.guestName`), sin derivar el nombre
  de pila.** Orden por estado: en `editando` abre el contenido (saludo → nombre → lugares reservados →
  resto); en `respondido`, sobre el panel. *Descartado:* mostrar solo el nombre de pila (prohibido:
  la constitución no admite deducciones) y poner el saludo en la vista colapsada (rompería D15/HU-14).
- **DT-17 · El panel y el «Editar» comparten una sola fuente compuesta: `responseSummaryData` conserva
  el `state` (arreglo de T23).** Al pulsar «Editar» sobre un rechazo, `handleEdit` pasa **`answeredData`**
  a `attendanceForm`; como `responseSummaryData` **no** devolvía `state`, `attendanceForm` no lo
  encontraba y caía a `CONFIRMED`: el formulario se precargaba como una **confirmación**. El arreglo
  vive en la **composición pura** (una sola fuente para el panel y para la precarga), no en una segunda
  vía en el componente: `responseSummaryData` mantiene **`state: answer.state`** junto a los campos
  visibles. `ResponseSummary` **no** lo pinta (su API es una lista cerrada de props y `state` no está
  entre ellas), así que el estado deja de ser un campo visible y la pieza **no** cambia. *Alternativas
  descartadas:* parchear solo la llamada de `handleEdit` (una segunda fuente —la respuesta cruda— junto
  a la compuesta: es justo la duplicidad que este cambio quería evitar) y añadir `state` a la API de
  `ResponseSummary` (pintaría el estado como un campo visible y cambiaría una pieza que no lo necesita).

### 17.5 Estrategia de pruebas del cambio (`node --test`)

- **Ampliadas:** `utils/rsvp.test.js` —
  - `rsvpPayload` con `response: "rejected"` y mensaje → el cuerpo **incluye** `message` y **no**
    incluye `adults`/`children`/`restrictions`; sin mensaje → rechazo válido sin `message`; con
    `confirmed` → igual que hoy (mensaje y el resto);
  - `responseSummaryData` con una respuesta `rejected` → **conserva** el mensaje y **omite** adultos,
    niños y restricciones (no `0` ni `""`); con `confirmed` y `personalized` → como hoy; `null` sin
    respuesta;
  - **[T23]** `responseSummaryData` de un rechazo **conserva `state`** (`answer.state`), y
    **`attendanceForm(invitation, responseSummaryData(answer, personalized))`** con una respuesta
    `rejected` arranca en **`rejected`** (antes del arreglo, como `answeredData` no llevaba `state`,
    `attendanceForm` caía a `CONFIRMED` y «Editar» precargaba una confirmación: la brecha que T23
    cierra); con `confirmed`/`updated` el arranque sigue siendo `confirmed`.
- **No cambia:** `test/serviceContract.test.js` (misma regla; la copy no es del módulo),
  `test/contracts.test.js` (nada publicado se renombra) ni `src/utils/invitation.test.js`
  (`interpretLookup` ya tolera `name: null`).
- **Lo que `node --test` no cubre** (y por eso va a la verificación manual): la copy del rechazo en la
  interfaz, el saludo con el nombre (DOM), el gating del mensaje con «No podré asistir», la región
  viva, y la **tolerancia de cabeceras del servicio** (Apps Script en ejecución: no hay runner).

### 17.6 Verificación manual añadida a §12 (puntos nuevos)

Se **añaden** a la lista de §12 (numeración que continúa; el punto 5 de §12 queda **actualizado**,
ver §17.7):

- **8. Copy del rechazo (RF-12, D20).** Al registrar/abrir una respuesta `rejected` (personalizada con
  respuesta previa y genérica/pública tras un envío de rechazo), el aviso de `respondido` muestra
  «Lamentamos que no puedas acompañarnos. Gracias por tu respuesta.»; una confirmación sigue mostrando
  la copy `OK`.
- **9. Mensaje en un rechazo (RF-13).** Con «No podré asistir», el campo del mensaje **existe**,
  es opcional, viaja, se ve en el panel de solo lectura (`respondido` y `cerrado` con respuesta) y se
  precarga al pulsar «Editar»; la **región viva** del rechazo ya **no** dice «ni mensaje»; la fila del
  libro guarda el mensaje con 0 asistentes y sin restricciones.
  **[T23 — precarga de un rechazo]** Al pulsar **«Editar»** sobre una respuesta **rechazada**, el
  formulario arranca en **«No podré asistir»** (no en «Sí, asistiré»): se ve el mensaje precargado y
  **no** se ven adultos, niños ni alergias; el **panel** de solo lectura que queda detrás **no**
  muestra el estado como un campo (sigue siendo nombre, mensaje, fecha…). Guardar otra vez sin cambiar
  la asistencia sigue registrando un rechazo.
- **10. Saludo con el nombre (RF-14, D19).** En la personalizada, «Responder invitación» abre el
  contenido con «Hola, \<nombre completo\>» **antes** del nombre (solo lectura) y de los lugares
  reservados; antes de pulsar **no** se ve; en `respondido`, el saludo va **sobre** el panel de solo
  lectura; en la genérica/pública **no** aparece.
- **11. Tolerancia de la consulta (RF-15, R13).** Con el script **redesplegado**, una boda
  genérica/pública cuyo libro **no** declare `guest_name`/`status` deja de responder `INVALID_DATA`:
  la fila se devuelve con `name: null` y `response: null` (primera respuesta); sin la columna `phone`
  **sí** falla con `INVALID_DATA`; `generic_json_cache` ausente **no** es el fallo. (Detalle en
  `gas/README.md`.)
- **Punto 5 de §12 actualizado:** los combos son **por campo** (adultos `1..cupo` sin el 0, niños
  `0..cupo`) y el campo libre de `n` lleva `min={1}` (estado real de la Fase 5; ver §17.7).
- **12. Diagnóstico de un `INVALID_DATA` al resolver (caso real, no un RF nuevo).** Al probar un enlace
  hay que usar un **código genérico real** (p. ej. `4236_GEN`), **no** `PUBLIC`: una boda `generic`
  cuya hoja `generic` tenga una fila `PUBLIC` con `limit = "n"` responde **`INVALID_DATA`** al resolver
  ese código (con o sin teléfono, en `resolve` y en `lookup`), porque `resolveCode_` aplica la regla del
  **tipo** (`generic` → entero > 0; `public` → `"n"`). La comprobación distingue ese caso de los demás
  (sin teléfono → `MISSING_FIELDS`; código inexistente → `UNKNOWN_GUEST`) y confirma que la app **no**
  inventa `PUBLIC`. **Arreglo:** borrar la fila `PUBLIC` de la hoja `generic` (dato del libro), **no**
  tocar el servicio ni el contrato. Documentado en `gas/README.md` (T20).

### 17.7 Qué de las §1–§16 queda superado por este cambio

- **§4.4 `respondido`** («agradecimiento (copy `OK` del contrato, válido también para `rejected`)») →
  **superado** por DT-15: en un `rejected` se pinta la copy del rechazo.
- **§7 (tabla de funciones puras)** y **§5 (archivos nuevos)** → **ampliados** con
  `responseSummaryData` (RF-13; conserva también el `state`, DT-17) ; `rsvpPayload` cambia de
  comportamiento (mensaje en el rechazo).
- **§10 (estrategia de implementación)** y **§11 (pruebas)** → **ampliados**: el cambio va **después**
  de la Fase 5, lógica pura primero (T16), luego presentación (T17–T18), el arreglo de la precarga del
  rechazo en la composición pura (T23, DT-17), servicio (T19) y su documentación (T20), verificación
  manual (T21) y gobernanza al final (T22).
- **§12 punto 5** («combos con rangos completos y opción 0») → **superado** por el estado real de la
  Fase 5 (rango por campo, ver §17.6).
- **§8 (contratos que NO cambian)** → **intacto**: el cambio **no** toca el contrato, el modelo del
  libro, los códigos de error ni las APIs de los hooks; la copy no es contrato (§13.4).
- **§13 (cobertura)** → **ampliada** en la tabla de abajo.
- **§14 (riesgos)** → se añade el riesgo operativo del redespliegue (la versión no cambia, así que un
  script viejo y la app «coinciden» en `1.1.0`): mitigación en `gas/README.md` y punto manual 11.

### 17.8 Cobertura de requisitos del cambio

| Parte del plan | RF/RNF |
| --- | --- |
| §17.2 `rsvpPayload` (mensaje en el rechazo) | RF-13 |
| §17.2 `responseSummaryData` (§17.3, DT-13, DT-17) | RF-13, RF-10 |
| §17.2 `ResponseSummary` (sin cambio de API) | RF-13 |
| §17.2 `showsAttendanceFields`/mensaje y `attendanceNotice` (región viva) | RF-13 (I2) |
| §17.2 copy del rechazo en `respondido` y en el envío aceptado (DT-15) | RF-12, D20, R12 |
| §17.2 saludo con el nombre en `editando`/`respondido` (DT-16) | RF-14, D19 |
| §17.2 `lookupResponse_` exige solo `phone` | RF-15, R13 |
| §17.2 `gas/README.md` (casos + redespliegue) y §17.6 punto 11 | RF-15, R13 |
| §17.2 `docs/servicio-invitados.md` (tolerancia + rechazo con mensaje) | RF-13, RF-15 |
| §17.2 `gas/README.md` (nota de diagnóstico `INVALID_DATA` por `limit`/tipo) y §17.6 punto 12 | RNF-5, §13 (R13) |
| §17.5 pruebas puras; §17.6 verificación manual | RNF-4, RNF-5, RNF-9 |
| §17.2 sin dependencias nuevas; copy/saludo en el componente | RNF-3, §13.4 |

### 17.9 Riesgos del cambio

- **Que la copy del rechazo choque con «la app no incrusta copy de contrato».** → DT-15: la copy es un
  **rótulo de interfaz** (no un literal del modelo); el módulo sigue siendo la fuente de lo que sí es
  contrato y la prueba de sincronía no cambia.
- **Que `rsvpPayload` envíe de más en un rechazo.** → DT-13 y prueba pura: en un rechazo solo viaja el
  `message`; la prueba fija que adultos, niños y restricciones **no** se envían.
- **Que el panel borre el mensaje del rechazo.** → `responseSummaryData` lo **conserva** y su
  prueba lo fija (sustituye a `summaryData`).
- **Que la precarga de «Editar» pierda el estado del rechazo (DT-17, T23).** `responseSummaryData`
  **no** devolvía `state` y `attendanceForm` caía a `CONFIRMED`: «Editar» sobre un rechazo precargaba
  una confirmación. → `responseSummaryData` conserva `state` (una sola fuente para el panel y la
  precarga) y una prueba pura alimenta `attendanceForm` con su salida y exige `rejected`; el punto
  manual 9 lo comprueba en el navegador. `ResponseSummary` no cambia (no pinta el estado).
- **Que el saludo se cuele en la vista colapsada o en la genérica/pública.** → DT-16 y punto manual 10:
  solo en `editando`/`respondido` de la personalizada.
- **Que la tolerancia de cabeceras oculte un fallo real.** → R13: solo se relajan `guest_name`/`status`;
  `phone` sigue obligatoria y los fallos de verdad siguen dando `INVALID_DATA`; la comprobación manual
  distingue ambos casos.
- **Riesgo operativo: el redespliegue no es detectable por la versión.** Como el contrato **no** sube de
  `1.1.0`, un `gas/Code.gs` viejo y la app coinciden en versión; el **redespliegue** es un paso manual
  obligatorio (`gas/README.md`) y el punto manual 11 falla si no se hizo (seguiría dando
  `INVALID_DATA`). No se añade un marcador de versión solo para esto.
- **Un `INVALID_DATA` que parece de la app y es de los datos (caso real, §17.6 punto 12).** Un código
  `PUBLIC` en una boda `generic` (o cualquier `limit` que no cuadre con el tipo) hace que
  `resolveCode_` devuelva `INVALID_DATA` antes de leer ninguna fila. → Riesgo **de diagnóstico**, no de
  código: la nota de `gas/README.md` (T20) explica la regla del tipo y los dos casos de `limit`, cómo
  distinguirlo de `MISSING_FIELDS`/`UNKNOWN_GUEST` y que el arreglo es **de datos**; no se cambia el
  contrato ni el servicio (opción descartada por el usuario: un código de error específico nuevo).
  **[Superado por §18:]** el «código de error específico nuevo» **sí** se hace (era la opción
  descartada en §17): `MALFORMED_GUEST` (RF-16) y, además, `PUBLIC` con `"n"` **sí** resuelve en una
  boda `generic` (RF-17). De esta §17.9 sigue vigente la explicación de la regla del tipo y que la app
  **no** inventa `PUBLIC`.

---

## 18. Cambio de requisitos de la spec §14 (RF-16/RF-17, D21/D22, R14/R15)

Traduce el **segundo cambio posterior**, que vive en la **§14 de la spec** (aprobado por quien la
pide). Parte del **estado real del código** ya implementado (spec 005 con las fases 1–6 hechas:
`contract.js`, `gas/Code.gs`, `docs/servicio-invitados.md`, `src/utils/invitation.js` **como están
hoy**) y de la **evidencia en vivo** del §14.0 (una boda `generic` con una fila `PUBLIC` con
`limit = "n"` que **siempre** responde `INVALID_DATA`). Se añade **después** de la §17 para no
reescribir lo implementado; **no** repite tareas (esas van en `tasks.md`, Fase 7).

### 18.1 Qué pide el cambio y en qué capa cae

| Pedido | RF | Capa | Efecto |
| --- | --- | --- | --- |
| Código de error propio para una fila de código mal formada | **RF-16**, D21, R14 | **Contrato (módulo + documento) y servicio** | `MALFORMED_GUEST` nuevo; `INVALID_DATA` se reserva a lo que impide leer/escribir; `CONTRACT_VERSION` **1.1.0 → 1.2.0** **en módulo y script a la vez, en la misma tarea (T24)**, y el documento lo reproduce. |
| `PUBLIC` con `"n"` vale por «sin tope» en una boda genérica | **RF-17**, D22, R15 | **Servicio** (regla del tipo) **+ la app** (lectura) | `resolveCode_` acepta `PUBLIC` con `"n"` en `generic`; `codeLimit`/`interpretInvitation`/`interpretLookup` aceptan `{ type: "generic", limit: "n" }`. |

**No cambia:** el modelo del libro (hojas, columnas, estados), la acción `lookup` ni su forma, el
`guest_type` del maestro, la copy del rechazo (§13.4), la lista cerrada de la prueba de sincronía ni
su **regla** (sigue exigiendo la tabla de códigos y la igualdad de versión, leída como texto).

### 18.2 Mapa de archivos del cambio

- **`src/constants/contract.js` (contrato, ampliado).**
  - **`SERVICE_ERRORS` gana una entrada nueva** para el código mal formado:
    `{ code: "MALFORMED_GUEST", message: "El código de esta invitación no es válido.", retryable: true }`.
    El **mensaje** va en **español** (es texto de interfaz, RF-16); el **`code`** en inglés por
    excepción documentada (literales del modelo del servicio). `retryable: true` porque quien publica
    puede corregir la fila (como `INVALID_DATA`).
  - **`CONTRACT_VERSION` sube de `"1.1.0"` a `"1.2.0"`** (DT-18): cambio **de forma** (un código de
    error más en la tabla), subida **menor** porque nada se retira ni se renombra. La sube **esta
    misma tarea (T24) en el módulo y en `gas/Code.gs` a la vez**: el guardarraíl de
    `test/serviceContract.test.js` (misma versión en módulo y script) **no** se relaja ni se pone en
    rojo en ningún momento (ver §18.4, DT-18, y §18.2, el script).
  - **Nada más cambia:** ni tipos, ni estados, ni acciones, ni los campos de `resolve`/`lookup`/
    `respond`, ni `NO_LIMIT`, ni `PUBLIC_CODE`, ni las hojas ni las columnas. La entrada de
    `INVALID_DATA` **no** se renombra ni se retira (solo cambia su **reparto** en la prosa del
    documento).
- **`docs/servicio-invitados.md` (documento derivado, ampliado).**
  - la línea de versión pasa a **`1.2.0`**;
  - la **tabla de códigos de error** (004 §4.1) gana **`MALFORMED_GUEST`** con su causa y su mensaje
    (derivados del módulo) y **matiza** la causa de `INVALID_DATA` (deja de incluir el código mal
    formado: sigue para libro/hoja/cabecera de verdad y datos incoherentes);
  - la prosa de **`lookup`/`resolve`** aclara que un código **existente** cuyo `limit` no cumple la
    regla del tipo responde **`MALFORMED_GUEST`** (no `INVALID_DATA`), que `UNKNOWN_GUEST` sigue
    siendo «el código no está en su hoja» y que **`PUBLIC` con `"n"` vale por sin tope también en una
    boda `generic`**;
  - **no** recoge ninguna copy de interfaz ni cambia la forma de las respuestas correctas.
- **`gas/Code.gs` (servicio, modificado).** **`CONTRACT_VERSION` pasa a `'1.2.0'` (la misma que el
  módulo) en la tarea del contrato (T24), a la vez que el módulo** —el guardarraíl de
  `test/serviceContract.test.js` exige que los dos declaren la misma versión, así que subirlos en
  tareas distintas dejaría la prueba en **rojo** entre ambas—. En la tarea del servicio (T26),
  `ERROR_CODES` gana `MALFORMED_GUEST: 'MALFORMED_GUEST'` y en **`resolveCode_`** (~líneas 350-397) la
  regla del tipo cambia (DT-19):
  - boda **`public`**: el código tiene que ser `PUBLIC` (si no, `UNKNOWN_GUEST`, sin cambio) y su
    `limit`, **exactamente `"n"`**; cualquier otro valor → **`MALFORMED_GUEST`** (antes `INVALID_DATA`);
  - boda **`generic`**: si el código es el reservado **`PUBLIC`** (RF-17), el `limit` tiene que ser
    **exactamente `"n"`** → se acepta y vale por **sin tope** (`limit = "n"`); un `PUBLIC` con otro
    `limit` → **`MALFORMED_GUEST`**; un código genérico corriente exige un **entero > 0** y, si no,
    **`MALFORMED_GUEST`** (antes `INVALID_DATA`).
  - **No** se toca `lookupResponse_` (su tolerancia de cabeceras de §13/T19 sigue) ni
    `registerCodeResponse_` (su escritura ya cubre `"n"` con `limit !== NO_LIMIT && adults > limit →
    OVER_LIMIT`, ~línea 850) ni `resolvePersonal_`.
- **`test/serviceContract.test.js` (guardarraíl) — sin cambio de regla.** Ya exige que la tabla de
  códigos del documento coincida **en conjunto y en el mensaje** con `SERVICE_ERRORS` y que
  `gas/Code.gs` declare la **misma** `CONTRACT_VERSION` (leída como texto). El código nuevo entra solo
  desde el módulo y la versión sube **en T24 en módulo y script a la vez**, de modo que el guardarraíl
  queda **verde en todo momento**; se **revisa** que la prueba siga verde sin tocarla (si hubiera que
  tocarla, sería señal de que algo se salió del contrato: parar y revisar).
- **`src/utils/invitation.js` (lógica pura de la app, modificada).** `codeLimit(type, value)` (~líneas
  81-87) deja de atar `"n"` **solo** a `public`: pasa a aceptar `"n"` **también** en `generic` (DT-20).
  Con eso `interpretInvitation` (rama `else`, ~línea 171) e `interpretLookup` (~línea 204) aceptan
  `{ type: "generic", limit: "n" }` sin descartar la invitación. **El resto de la lectura ya es
  coherente** (comprobado en el código, §14.7 de la spec): `guestLimit` (`Infinity` con `NO_LIMIT`,
  sin mirar el tipo), `seatsText` («sin tope» con `NO_LIMIT`, sin mirar el tipo), `attendeeLimits`
  (`adults: "n"` en genérica y pública por igual, `children: 0`), `isWithinGuestLimit(total, Infinity)`
  (`true`), `validateRsvp` (usa `guestLimit(invitation)` → sin tope pasa) y `rsvpPayload` (no deciden
  por tipo). **No** se toca ningún otro punto.
- **`src/utils/invitation.test.js` (ampliada).** Los casos nuevos (DT-20, tests primero): un
  `GENERIC_RESULT` con `limit: "n"` **no** cae en `INVALID_DATA` y la invitación sale con `limit: "n"`,
  `guestLimit: Infinity` y `seatsText` «sin tope»; un `LOOKUP_GENERIC` con `limit: "n"` tampoco cae en
  `INVALID_DATA`; un genérico con `limit` no entero > 0 (`"x"`, `0`, `-1`, vacío) **sigue** siendo
  `INVALID_DATA` (es un dato fuera de contrato: el **servicio** es quien emite `MALFORMED_GUEST`, la
  app solo lee). Se **revisa** que los casos actuales que afirman `INVALID_DATA` con `"n"` en
  `generic` (p. ej. la tabla de límites de ~línea 228 y la de `interpretLookup` de ~línea 345) se
  **sustituyen** por los nuevos donde el `"n"` ahora es válido en genérica, conservando los que
  siguen siéndolo para `limit` ilegible.
- **`src/utils/rsvp.test.js` — revisión (sin código nuevo).** `validateRsvp` con una invitación
  `{ type: "generic", limit: "n" }` (o con `guestLimit: Infinity`) **pasa** el cupo: se añade/ajusta el
  caso para fijarlo (hoy `guestLimit` ya devuelve `Infinity`). No cambia ninguna función de `rsvp.js`.
- **`src/data/guest-cards.js` y `guest-cards.test.js` — revisión.** Son **fixtures** (la app no los
  importa en ejecución) y su prueba exige que las fichas `generic` tengan un `limit` **entero > 0**
  (~líneas 36-41) y las `public`, `"n"`. Ese fixture representa una boda genérica **corriente**, así
  que **sigue siendo válido** y **no** se toca; si el plan necesita un fixture nuevo para «genérica
  sin tope» (una fila `PUBLIC` en una boda `generic`), se **añade** como ficha aparte **sin** aflojar
  la regla de las fichas corrientes. Decisión: **no** se añade fixture (el caso se cubre con los
  literales de `invitation.test.js`); si hiciera falta para la verificación manual, se documenta.
- **`gas/README.md` (ampliado).** La **nota de diagnóstico** (punto 8, T20) **deja de** decir que un
  `PUBLIC` en una boda `generic` «nunca resuelve»: pasa a describir el **reparto nuevo** —`PUBLIC` con
  `"n"` en boda genérica → **sin tope** (RF-17); cualquier otro `limit` que no cuadre con su regla →
  **`MALFORMED_GUEST`** (RF-16), que ya **no** es `INVALID_DATA`—, añade el código nuevo a la **tabla
  de distinción de fallos** (sin teléfono → `MISSING_FIELDS`; código inexistente → `UNKNOWN_GUEST`;
  código que existe con `limit` mal formado → `MALFORMED_GUEST`; libro/hoja/cabecera real →
  `INVALID_DATA`) y el **aviso de redespliegue** (el cambio vive en el script; hasta publicar una
  versión nueva sigue el reparto viejo).
- **Gobernanza (`AGENTS.md`, `MEMORY.md`, `PENDING_TASKS.md`) al final.** El código nuevo, la regla de
  `PUBLIC` con `"n"` en boda genérica, la versión `1.2.0`, la nota de `gas/README.md` y los puntos
  manuales nuevos; la verificación de la 004 y la de §13 siguen pendientes y **no** se marcan aquí.

### 18.3 Funciones puras del cambio (con su firma)

| Función | Módulo | Entradas | Salida | RF |
| --- | --- | --- | --- | --- |
| `codeLimit(type, value)` (modificada) | `utils/invitation.js` | tipo y `limit` crudo | `"n"` (public **o** generic) \| entero > 0 (generic) \| `null` (fuera de contrato) | RF-17 |
| `interpretInvitation(result)` (sin cambio de firma) | `utils/invitation.js` | respuesta de `resolve` | modelo; acepta `{type:"generic", limit:"n"}` | RF-17 |
| `interpretLookup(result)` (sin cambio de firma) | `utils/invitation.js` | respuesta de `lookup` | modelo; acepta `{type:"generic", limit:"n"}` | RF-17 |

Solo cambia **una regla** dentro de `codeLimit`; `guestLimit`, `seatsText`, `attendeeLimits`,
`isWithinGuestLimit`, `validateRsvp` y `rsvpPayload` **se leen tal cual** (ya soportan `"n"`). El
**código nuevo del contrato** (`MALFORMED_GUEST`) lo **consume la app desde el módulo** (`Rsvp.jsx`
pinta el aviso por `serviceNotice(code).message`, 004 RF-17 intacta): **no** hay función pura nueva ni
literal en componentes.

### 18.4 Decisiones de implementación (DT-18, DT-19, DT-20)

- **DT-18 · El código nuevo es `MALFORMED_GUEST` y el contrato sube a `1.2.0`, en módulo y script a la
  vez (en la misma tarea).** Se declara en `SERVICE_ERRORS` (fuente única) con su mensaje en español y
  `retryable: true`; el documento lo deriva y la prueba de sincronía lo vigila. La **versión** la suben
  `src/constants/contract.js` **y** `gas/Code.gs` en la **misma** tarea (T24): repartirla entre dos
  tareas dejaría en rojo el guardarraíl de `test/serviceContract.test.js` (exige la misma versión en
  los dos lados), que **no** se relaja ni se toca. Es un cambio **de forma** (un código más), por eso
  **sí** sube, a diferencia de §13 (una copy de interfaz no sube). *Descartado:* reutilizar
  `INVALID_DATA` (es exactamente lo que confunde, RF-16); reutilizar `UNKNOWN_GUEST` (diría «el código
  no está en su hoja», que es falso); nombrarlo `INVALID_GUEST_CODE` (se leería como «el enlace es
  inválido», cuando el fallo es de la **fila**); subir a `2.0.0` (nada se retira ni se renombra);
  **repartir la subida entre dos tareas** (módulo en una y script en otra: el guardarraíl quedaría en
  rojo entre ambas).
- **DT-19 · La regla del tipo se parte en dos en `resolveCode_`: «existe mal formado» ≠ «no está» ≠
  «no se puede leer».** El código **que no está** en su hoja sigue `UNKNOWN_GUEST`; el que **está** y
  su `limit` no cumple la regla → `MALFORMED_GUEST`; lo que impide **leer/escribir** (libro, hoja,
  cabecera) sigue `INVALID_DATA`. Dentro de una boda **`generic`**, el código reservado **`PUBLIC`**
  con `"n"` se acepta (sin tope) y con cualquier otro `limit` es `MALFORMED_GUEST`; un genérico
  corriente exige entero > 0. *Descartado:* hacer que `PUBLIC` en `generic` herede el `limit` de la
  fila (inventaría un cupo); aceptar `"n"` en **cualquier** código genérico (convertiría un cupo mal
  escrito en invitación sin tope); dejar el reparto como estaba (el veredicto seguiría opaco).
- **DT-20 · La app lee `"n"` en una invitación genérica sin cambiar su modelo.** Se relaja **una sola**
  regla (`codeLimit`) porque hoy ataría `"n"` a `public` y `interpretInvitation`/`interpretLookup`
  **descartarían** una invitación que el servicio considera válida (fallo silencioso, peor que el
  actual). El **tipo** sigue siendo `generic` (no se convierte en `public`), no se ofrecen niños (D12)
  y `n` sigue siendo «sin tope» sin máximo (R1). *Descartado:* tratar la genérica sin tope como
  `public` en la app (cambiaría el tipo y el comportamiento); duplicar la regla en el componente
  (debe vivir en la lógica pura, RNF-4); **no** tocar la app (dejaría al servicio y a la app en
  veredictos opuestos).

### 18.5 Estrategia de pruebas del cambio (`node --test`)

- **Ampliadas:** `utils/invitation.test.js` —
  - `interpretInvitation({ ...GENERIC_RESULT, limit: "n" })` → **no** `INVALID_DATA`; la invitación
    sale con `limit: "n"`, `guestLimit: Infinity`, `seatsText` «sin tope»;
  - `interpretLookup({ ...LOOKUP_GENERIC, limit: "n" })` → **no** `INVALID_DATA`;
  - un genérico con `limit` no entero > 0 (`"x"`, `0`, `-1`, vacío, `null`) → **sigue** `INVALID_DATA`
    (dato fuera de contrato; el código del **servicio** es `MALFORMED_GUEST`, la app solo lee);
  - la pública sigue como hoy (`"n"` válido, entero → `INVALID_DATA`).
- **Ajustadas:** `utils/rsvp.test.js` — `validateRsvp` con una invitación genérica sin tope **pasa**
  el cupo (`guestLimit: Infinity`); no cambia ninguna función.
- **Revisada (sin cambio de regla):** `test/serviceContract.test.js` — debe seguir verde con el código
  nuevo y la versión `1.2.0` **subida en módulo y script en la misma tarea** (su guardarraíl de «misma
  versión» nunca queda en rojo); si exigiera tocarla, **parar y revisar** (señal de salida del
  contrato).
- **Lo que `node --test` no cubre** (y va a la verificación manual): el `resolveCode_` **en ejecución**
  (Apps Script no tiene runner), el aviso del código nuevo en la interfaz y el redespliegue.

### 18.6 Verificación manual añadida a §12 (puntos nuevos)

Se **añaden** a la lista de §12 (numeración que continúa). El punto **12** de §17.6 (usar un código
genérico real al probar enlaces) queda **superado** por el punto **13** de aquí (ya **no** hace falta
evitar `PUBLIC`).

- **13. Código mal formado → `MALFORMED_GUEST` (RF-16).** Con un libro de **prueba** cuya hoja
  `generic` tenga un código con `limit` inválido (`"x"`, `0` o vacío): `resolve` y `lookup` de ese
  código responden **`MALFORMED_GUEST`** (no `INVALID_DATA`); la app muestra su **aviso propio**
  («El código de esta invitación no es válido.»), **no** el de «datos incompletos», con su reintento;
  un código **inexistente** sigue siendo `UNKNOWN_GUEST` y un libro **sin `phone`** sigue siendo
  `INVALID_DATA`.
- **14. `PUBLIC` con `"n"` en una boda genérica → sin tope (RF-17).** En una boda **`generic`** de
  prueba con una fila `PUBLIC` (`limit = "n"`): `resolve` y `lookup` de `PUBLIC` responden `ok: true`
  con `type: "generic"` y `limit: "n"`; la app **no** descarta la invitación (no aparece «los datos de
  esta invitación están incompletos»), anuncia **sin tope**, ofrece el **campo numérico libre** (sin
  máximo) y el envío con `PUBLIC` **no** devuelve `OVER_LIMIT` por cupo. Un `PUBLIC` con `limit`
  **distinto** de `"n"` (p. ej. `3`) responde **`MALFORMED_GUEST`**. Los códigos corrientes `…_GEN`
  siguen resolviendo con su `limit` numérico y su combo `1..cupo`; el punto manual **11** (tolerancia
  de cabeceras) sigue pasando.

### 18.7 Qué de las §1–§17 queda superado por este cambio

- **§17.2 nota de diagnóstico de `gas/README.md`** («un `PUBLIC` en una boda `generic` **nunca**
  resuelve» y «el arreglo es **de datos**») → **superado**: con RF-17 ese código **sí** resuelve (sin
  tope); la nota pasa a describir el reparto nuevo y `MALFORMED_GUEST` (DT-19, §18.2). El arreglo de
  datos sigue siendo opcional pero **ya no** es obligatorio.
- **§17.6 punto 12** («usar un código genérico real, no `PUBLIC`») → **superado** por el punto 14 de
  §18.6: ya **no** hay que evitar `PUBLIC`.
- **§17.9 último riesgo** (el `INVALID_DATA` opaco por `limit`/tipo, con «código de error específico
  nuevo» como **opción descartada**) → **superado**: esa opción **se toma** (RF-16) y `PUBLIC` con
  `"n"` **sí** resuelve (RF-17).
- **§17.1** («no cambia el contrato; `CONTRACT_VERSION` sigue `1.1.0`; `test/serviceContract.test.js`
  sin cambio de regla») → **la parte de la versión queda superada**: el contrato **sí** sube
  (`1.2.0`, DT-18), **en módulo y script a la vez en la misma tarea (T24)**. La **regla** de la prueba
  **sí** sigue igual (se dice lo mismo: la tabla y la versión deben coincidir) y **el guardarraíl no
  se relaja en ningún momento**: por eso la subida **no** se reparte entre dos tareas.
- **§8 (contratos que NO cambian)** → **matizada**: la frase «los códigos de error de 004 §4.1
  (ninguno se retira ni se renombra; `lookup` no añade ninguno)» se mantiene en que **no** se retira ni
  renombra ninguno y en que `lookup` **no** añade ninguno **propio**; pero la tabla **gana**
  `MALFORMED_GUEST` (es de la **resolución del código**, no de `lookup`).
- **§13 (cobertura) y §12 (verificación)** → **ampliadas** con la tabla y los puntos de abajo.
- **§16 criterio 1** («sin ningún código de error nuevo») y **§10 paso 1** → **matizados**: el
  contrato gana **un** código (`MALFORMED_GUEST`), declarado a la vez en módulo + script **en T24**, y
  el documento lo reproduce.
- **§10 (estrategia de implementación)** y **§11 (pruebas)** → **ampliados**: el cambio va **después**
  de la Fase 6, contrato con la versión subida en módulo y script a la vez (T24) y lógica pura después
  (T25), luego la **regla del tipo** del servicio (T26, **sin** volver a tocar la versión) y su
  documentación (T27), la verificación manual (T28) y la gobernanza (T29).
- **§17.7 y §17.8 (superados y cobertura de §17)** → **se conservan**; este §18.7 y §18.8 son los que
  añaden lo superado y la cobertura **de este** cambio.

### 18.8 Cobertura de requisitos del cambio

| Parte del plan | RF/RNF |
| --- | --- |
| §18.2 `contract.js` + `gas/Code.gs` (`MALFORMED_GUEST` y `CONTRACT_VERSION` `1.2.0` **en módulo y script a la vez, en T24**) | RF-16, R14 |
| §18.2 `docs/servicio-invitados.md` (tabla ampliada + reparto de `INVALID_DATA`) | RF-16 |
| §18.2 `gas/Code.gs` `resolveCode_` (reparto + `PUBLIC`/`"n"` en `generic`, **sin** volver a tocar la versión, T26) | RF-16, RF-17, D21, D22 |
| §18.2 `codeLimit`/`interpretInvitation`/`interpretLookup` (acepta `{generic, "n"}`) | RF-17, R15 |
| §18.5 `invitation.test.js` (genérica sin tope; `limit` ilegible sigue fallando) | RF-17, RNF-4 |
| §18.2 `test/serviceContract.test.js` (sin cambio de regla; verde porque la versión sube en los dos lados a la vez) | RF-16, RNF-5 |
| §18.2 `gas/README.md` (reparto nuevo + tabla + redespliegue) y §18.6 puntos 13–14 | RF-16, RF-17, RNF-5 |
| §18.4 DT-18/DT-19/DT-20 (nombre, reparto, lectura de la app) | RF-16, RF-17, D21, D22 |
| §18.2 sin dependencias nuevas; gobernanza al final | RNF-3, §5.2 de la spec |

### 18.9 Riesgos del cambio

- **Que el código nuevo se quede sin documentar o sin declarar en el módulo.** → DT-18: se declara en
  `SERVICE_ERRORS` (fuente única) y `test/serviceContract.test.js` exige que el documento no lo omita
  ni cambie su mensaje; el documento lo deriva y el script declara la misma versión.
- **Que subir la versión se olvide en uno de los dos lados (o se reparta entre dos tareas y deje el
  guardarraíl en rojo).** → DT-18: la versión sube **en la misma tarea (T24), en `src/constants/contract.js`
  y en `gas/Code.gs` a la vez**; el módulo la declara como literal y `test/serviceContract.test.js` la
  compara con `gas/Code.gs` (leído como texto), de modo que el guardarraíl queda verde en todo momento y
  **nunca** se relaja. T26 **no** vuelve a tocar la versión (solo la regla del tipo).
- **Que la app descarte una invitación genérica sin tope (el fallo silencioso de §14.7).** → DT-20: se
  relaja `codeLimit` y se prueban `interpretInvitation`/`interpretLookup` con `{generic, "n"}`.
- **Que `PUBLIC` sin tope sirva de puerta a un cupo mal escrito.** → La excepción es **solo** para el
  código reservado `PUBLIC` con **`"n"`**; cualquier otro `limit` cae en `MALFORMED_GUEST` (D22,
  RF-17).
- **Que el diagnóstico vuelva a ser opaco en el otro sentido** (creer que todo `INVALID_DATA` es un
  código mal formado). → `INVALID_DATA` conserva sus causas y `gas/README.md` recoge la tabla de
  distinción completa.
- **Que la regla del tipo se duplique o diverja entre módulo y script.** → La regla vive **una vez**
  en cada lado con la misma forma (`public` → `"n"`; `generic` → entero > 0 **o** `PUBLIC` con `"n"`);
  la prueba de sincronía vigila la tabla de códigos y la versión, y la verificación manual cubre el
  servicio.
- **Que el fixture de fichas (genérica entera > 0) parezca contradecir RF-17.** → El fixture
  representa una boda genérica **corriente**; RF-17 solo añade el caso `PUBLIC`/`"n"`, que **no** se
  representa con una ficha nueva (se cubre con literales puros). La prueba del fixture **no** se
  relaja.
