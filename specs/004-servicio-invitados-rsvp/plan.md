# Plan técnico — Servicio de invitados y RSVP

Traduce a decisiones de implementación la spec `spec.md` de esta carpeta (RF-1…RF-18, RNF-1…RNF-10
y las decisiones D1–D28, más el cambio posterior de §10: **RF-19**, **RF-20** y **D29–D34**). Cada
parte indica **qué RF cubre**. Los identificadores de código van en inglés; los textos visibles, los
datos y la documentación, en español (RNF-6, RNF-7).

> **Enmienda posterior — §10 de la spec (mandada por quien la pide).** Este plan recoge también el
> **cambio de requisitos posterior** de la spec (§10: **RF-19**, **RF-20** y las decisiones
> **D29–D34**). Cuando el §10 contradiga el cuerpo (§1–§9), **manda el §10**; los puntos afectados
> van marcados con *«§10 manda sobre este punto»*. El cambio trae **hoja `public` propia**,
> **resolución por tipo**, **`limit` con el mismo idioma en las dos hojas**, **segunda caché**
> (`public_json_cache`), **celda vacía = cero** en el servicio y `CONTRACT_VERSION` → **`1.3.0`**.
> Vive en la **Fase 4** de §11 (tareas **T11–T17**). Las fases 1–3 (**T1–T10**) **no se rehacen**:
> la spec 004 ya está implementada y verificada; lo que queda de T10 es su parte documental.

## 1. Punto de partida y referencia

- **Árbol actual:** la app de la spec 003, con `app/`, `constants/`, `data/`, `utils/` (lógica pura
  + pruebas), `hooks/`, `providers/`, `services/`, `templates/classic/`, `components/{layout,sections,ui}/`
  y `test/{andamiaje,contracts}.test.js`. `npm test` → **158/158** y `npm run build` en verde.
- **Lo que hoy no sirve y se sustituye:** `utils/invitation.js` (modelo local de tres tipos por
  ficha), `data/guest-cards.js` (personaliza en ejecución), `hooks/useInvitation.js`,
  `hooks/useConfirmation.js` y `utils/confirmation.js` (el plazo vive en el registro),
  `components/sections/Rsvp.jsx` (POST nativo a FormSubmit) y `test/contracts.test.js` (vigila el
  destino FormSubmit y los `name` del formulario).
- **Lo que no existía al abrir esta spec** (y esta spec obligaba a crear): `src/constants/contract.js`,
  `docs/servicio-invitados.md`, `gas/Code.gs`, `gas/README.md`, `test/serviceContract.test.js`, el
  cliente del servicio y las piezas puras de RSVP. **Hoy ya existen**: las **Fases 1–3** (§11) están
  implementadas y verificadas, y lo que queda de T10 es su parte documental.
- **Rama:** se trabaja donde esté la rama viva de la spec 003 (`react-migration`), sin rebase ni
  publicación por este plan.

## 2. Enmienda constitucional previa (obligatoria)

La constitución (`docs/constitution.md`) dice hoy lo contrario de lo que exige la spec. **Antes de
tocar código** (T2) hay que enmendarla; el resto del plan respeta la constitución enmendada:

1. **Principio 1 (stack):** intacto. No se añade ninguna dependencia; `package.json` no cambia (solo
   React, Vite y su plugin). El servicio es un artefacto **externo** que la app consume → *RF-17,
   RNF-8*.
2. **Principio 3 (capas):** se refuerza. La llamada al servicio vive en `src/services/`; la lectura y
   el armado del envío, puras, en `src/utils/`; el **cuándo** y el **estado**, en `src/hooks/`; la
   presentación, en `src/components/`; el contrato y la configuración, en `src/constants/` →
   *RNF-9*.
3. **Principio 5 (datos del usuario):** cambia. Ya **no** se conecta un servicio «de referencia»: hay
   un servicio real, el **teléfono entra en el alcance** y es la llave de la genérica y la pública, y
   los libros reales (con datos personales) **se excluyen por `.gitignore`**. Se conserva que el
   repositorio solo versiona **ejemplos ficticios** → *RNF-1, RNF-2, D19, D22*.
4. **Principio 6 (idioma):** se ajusta. La excepción documentada pasa a los **nombres de hoja y de
   columna**, los **estados**, los **parámetros** y los **códigos de error** del modelo del servicio
   (que van en inglés). Los textos visibles, los datos, los comentarios y la documentación siguen en
   español → *RNF-6, RNF-7*.
5. **Principio 4 (pruebas):** intacto (runner integrado de Node, sin instalar nada); se añade una
   prueba de **sincronía documento↔módulo** → *RNF-10, D18*.

## 3. Estructura objetivo

```
src/constants/
  contract.js        # NUEVO  fuente única del contrato del servicio (RF-17, D18)
  service.js         # NUEVO  nombres de las variables de entorno de la configuración (RF-15)
  templates.js       # (sin cambios)
  sections.js        # (sin cambios)
  theme.js           # (sin cambios)
src/utils/                       # lógica pura, sin React, sin DOM, sin reloj interno
  invitation.js      # REESCRITO  tipos, código y modelo resuelto (RF-2, RF-5, RF-6, RF-9)
  service.js         # NUEVO  normalización y estado de la configuración (RF-15)
  rsvp.js            # NUEVO  teléfono, cuerpo del envío y validación (RF-8, RF-9, RF-14)
  confirmation.js    # REESCRITO  plazo y apertura, con el «ahora» por parámetro (RF-11)
  validation.js      # se ajusta: `registryErrors(wedding)` valida solo el registro (RF-1, RF-13)
  restrictions.js    # se retira `hasChildrenConflict` (sin consumidor); el resto se conserva
  ...                # el resto, sin cambios
src/app/
  App.jsx            # deja de importar las fichas de ejemplo en ejecución (RF-1, D22)
src/services/
  registration.js    # NUEVO  cliente HTTP del servicio de registro (RF-14, RNF-4, D27)
  config.js          # NUEVO  lee import.meta.env (Vite) y lo entrega a utils/service.js
  photos.js          # (sin cambios)
src/hooks/
  useInvitation.js   # REESCRITO  resuelve la invitación contra el servicio (RF-1, RF-12)
  useRsvp.js         # NUEVO  estado del envío (RF-14)
  useConfirmation.js # REESCRITO  el plazo entra por parámetro (RF-11)
  ...
src/components/sections/
  Rsvp.jsx           # REESCRITO  bloques de carga/demo/error/cerrado/formulario (RF-8, RF-12, RF-14)
src/data/
  wedding.js         # se le quitan `confirmacion.fechaLimite` y `marca.enlaces.rsvp`
  guest-cards.js     # REESCRITO  ejemplos ficticios, solo fixtures de su prueba (D22)
docs/
  servicio-invitados.md  # NUEVO  documento humano derivado del módulo (RF-17, D18)
gas/
  Code.gs            # NUEVO  el servicio (Apps Script) que implementa el contrato
  README.md          # NUEVO  puesta en marcha y comprobaciones manuales
test/
  serviceContract.test.js # NUEVO  sincronía documento ↔ módulo (RNF-10, M9)
  contracts.test.js       # REESCRITO  contratos nuevos (RF-2, RF-14)
  andamiaje.test.js       # (sin cambios)
```

> **El árbol no crece en la Fase 4 (§10).** El cambio de la hoja `public` y de la lectura tolerante
> **no crea** ningún archivo: lo que cambia es el **contenido** de cuatro de los que ya existen —
> `src/constants/contract.js` (hoja `public` + `public_json_cache` + versión `1.3.0`),
> `docs/servicio-invitados.md` (las tres cosas derivadas), `gas/Code.gs` (resolución por tipo y
> celda vacía = cero) y `test/serviceContract.test.js` (que vigila los literales nuevos, ya
> recogidos del módulo: no hay que escribir el listado a mano). La **app**
> (`src/utils/invitation.js`, `src/utils/rsvp.js`) se **revisa**, pero **no** se espera que cambie
> (§8).

## 4. Convención de nombres (fija RNF-6/RNF-7)

- **Módulos, funciones y variables en inglés** (`guestType`, `responseState`, `serviceConfig`,
  `rsvpPayload`, `errorCode`). **Comentarios, textos de interfaz y documentación en español.**
- **No se traduce nada del modelo del servicio**: hojas (`files`, `guests`, `generic`, **`public`**),
  columnas
  (`slug`, `is_active`, `guests_sheet_id`, `deadline`, `guest_type`, `generic_json_cache`,
  **`public_json_cache`**, `guest_id`, `phone`, `guest_name`, `partner_name`, `adults_guests`,
  `adults_attendees`, `child_guests`, `child_attendees`, `message`, `dietary_restrictions`, `status`,
  `datetime`, **`public_id`**),
  estados (`viewed`, `confirmed`, `updated`, `rejected`), el parámetro `guest` y los **códigos de
  error** (`OK`, `MISSING_GUEST`, …) conservan su forma literal (excepción documentada).
  Los literales de la hoja `public` son **nuevos** en la Fase 4 y entran por el módulo, no a mano
  (§10 manda sobre este punto).
- **Los tipos de invitación en el código** son los valores del modelo: `"personal"`, `"generic"`,
  `"public"` (los que trae `guest_type`, RF-5, D20).

## 5. Mapa de archivos

### 5.1 Contrato y configuración (RF-17, RF-15, D18, D19)

- **`src/constants/contract.js` (nuevo).** Fuente única que **consume la app**:
  - `CONTRACT_VERSION`; en la Fase 4 pasa de `1.2.0` a **`1.3.0`** (D34);
  - `GUEST_PARAM = "guest"` (y la nota de que `codigo`/`code`/`inv` quedan jubilados sin alias);
  - `GUEST_TYPES = { PERSONAL: "personal", GENERIC: "generic", PUBLIC: "public" }`;
  - `MASTER_SHEET` / `GUEST_SHEET` / `GENERIC_SHEET` / **`PUBLIC_SHEET`**: nombre de hoja + nombre de
    cada columna. **`PUBLIC_SHEET` es nuevo en la Fase 4** (§10 manda sobre este punto): hoja
    `public` con las columnas exactas `public_id` y `limit` (RF-19);
  - `MASTER_SHEET.columns` gana **`PUBLIC_JSON_CACHE`** (`public_json_cache`), la **segunda caché**
    del maestro, con la misma forma y la misma regla de refresco que `generic_json_cache` (D32);
  - `RESPONSE_STATES` (`viewed`, `confirmed`, `updated`, `rejected`) y `NO_RESPONSE_STATES`;
  - `NO_LIMIT = "n"`, `PUBLIC_CODE = "PUBLIC"` (el código **reservado** de la invitación pública: en
    la Fase 4 vive en la hoja **`public`**, no en `generic` —D31—, y sigue siendo el que usan todos
    los invitados de una boda pública), `PHONE_DIGITS = 10`, `REQUEST_TIMEOUT_MS = 10000`;
  - `SERVICE_ACTIONS = { RESOLVE: "resolve", RESPOND: "respond" }`;
  - `SERVICE_ERRORS`: la **tabla de códigos de error** de la spec §4.1 como datos
    (`{ code, message, retryable }`), incluido `OK`. **La tabla no se toca** en la Fase 4: ningún
    código nuevo, ningún mensaje nuevo (§10.5 manda sobre este punto).
  Sin React, sin DOM, sin `import.meta`: se puede importar desde `node --test`.
- **`src/constants/service.js` (nuevo).** Solo los nombres de las variables de entorno
  (`VITE_SERVICE_URL`, `VITE_WEDDING_SLUG`) y sus valores por defecto vacíos.
- **`src/utils/service.js` (nuevo, puro).** `resolveServiceConfig(raw)` → `{ url, slug, state }`, con
  **tres** estados que fijan la causa visible (RF-15, D15): `"not-configured"` cuando **falta la URL**
  (modo demo → `NOT_CONFIGURED`, no se llama a nadie), `"missing-slug"` cuando **hay URL pero falta el
  `slug`** (→ `MISSING_SLUG`, aviso propio y **sin reintento**) y `"ready"` cuando están las dos.
  Recorta espacios y **no** deduce el `slug` de la URL.
- **`src/services/config.js` (nuevo).** Lee `import.meta.env` con los nombres de
  `constants/service.js` y lo entrega a `resolveServiceConfig`. Es Vite-específico → **no** se prueba
  con `node --test` (misma frontera que `services/photos.js`).

### 5.2 Lógica pura (RF-2, RF-5, RF-6, RF-8, RF-9, RF-14, RNF-9)

- **`src/utils/invitation.js` (reescrito).** Fuera el modelo local; dentro el del servicio:
  - `INVITATION_TYPES = { PERSONALIZED: GUEST_TYPES.PERSONAL, GENERIC: …, PUBLIC: …, NONE: "none" }`;
  - `readGuestCode(params)` → el parámetro `guest` **recortado**, o `null` si falta (RF-2). La app
    **no** normaliza el código: la comparación sin distinguir mayúsculas la hace el **servicio**
    (D24), que es quien tiene los códigos en los libros;
  - `interpretInvitation(result)` → el modelo que consume la interfaz a partir de la respuesta ya
    resuelta del servicio: `{ type, errorCode, guestName, partnerName, adultsGuests, childGuests,
    limit, previousResponse, deadline, seatsText, guestLimit }`. **No** deduce el tipo ni el cupo:
    los recibe (D20);
  - `reservedSeats(invitation)`, `guestLimit(invitation)`, `isWithinGuestLimit(count, limit)`,
  - `formatSeats(total)` y `seatsText(invitation)`, con `PUBLIC`/`"n"` = sin tope.
  Desaparecen `resolveInvitation(guestCards, code)` y cualquier lectura del registro local.
- **`src/utils/rsvp.js` (nuevo, puro).**
  - `phoneDigits(value)` → solo dígitos; `isPhoneComplete(digits)` → exactamente 10 (RF-8, D23);
  - `rsvpPayload({ action, slug, code, name, phone, adults, children, message, restrictions })` →
    el objeto JSON que viaja al servicio, con los nombres de campo de `contract.js` (RF-14);
  - `validateRsvp(form, invitation)` → `{ ok, errorCode }` con `MISSING_FIELDS`, `INVALID_PHONE` y
    `OVER_LIMIT` (RF-8, RF-9);
  - `interpretRsvpResult(result)` → `{ ok, errorCode }`, incluidas la respuesta **rechazada** por el
    servicio (`INVALID_RESPONSE`) y las causas que solo él puede detectar (RF-14).
- **`src/utils/confirmation.js` (reescrito).**
  - `deadlineMs(value)` → número de ms, o `null` si viene vacío o no se puede interpretar (RF-11);
  - `isConfirmationOpen(deadline, nowMs)` → `null` = **sin plazo** (siempre abierto), `NaN` = cerrado,
    si no `now <= deadline` (borde incluido); **el «ahora» entra por parámetro** (RF-11);
  - `confirmationFields(confirmation)` se conserva tal cual (los campos los sigue declarando el
    registro).

### 5.3 Servicios (RF-14, RNF-4, RNF-8, D27)

- **`src/services/registration.js` (nuevo).** `callService(url, payload, { timeoutMs, signal, fetchImpl })`:
  - `POST` a la URL del despliegue, `Content-Type: text/plain;charset=utf-8` y **cuerpo JSON**
    (evita el preflight que Apps Script no responde, D27);
  - `AbortController` con el `REQUEST_TIMEOUT_MS` del contrato (10 s, D25);
  - devuelve `{ ok, data, errorCode }`: si la red falla, se agota el tiempo o el cuerpo **no es JSON
    válido** → `SERVICE_UNAVAILABLE` (el servicio no respondió como manda el contrato). `INVALID_DATA`
    **no** se usa aquí: es un veredicto del **servicio** sobre los datos del libro (RF-13). **Nunca**
    lanza al componente.
  - No se añade ninguna librería de peticiones (RNF-8): `fetch` del navegador.

### 5.4 Hooks (RF-1, RF-11, RF-12, RF-14, RNF-9)

- **`src/hooks/useInvitation.js` (reescrito).** Recibe la configuración y (para las pruebas) el
  cliente; lee el código, llama al servicio en un `useEffect` con `AbortController` y expone
  `{ status, invitation, errorCode }` con `status ∈ demo | loading | ready | error`. Traduce el estado
  de la configuración (RF-15): `"not-configured"` → `demo` **sin llamar**; `"missing-slug"` → `error`
  con `errorCode: MISSING_SLUG` y **sin reintento**; `"ready"` → llama al servicio. El render **no** se
  bloquea (RNF-5).
- **`src/hooks/useConfirmation.js` (reescrito).** Recibe el **plazo** resuelto (`deadline`) y el
  «ahora» se lee dentro del hook; programa el cierre al pasar el plazo sin recargar (RF-11).
- **`src/hooks/useRsvp.js` (nuevo).** `{ status, errorCode, submit(form) }` con
  `status ∈ idle | sending | ok | error`; toma los datos del registro y de la invitación, valida con
  `utils/rsvp.js`, llama al servicio y traduce el resultado (RF-14).

### 5.5 Presentación (RF-8, RF-12, RF-14, RNF-6)

- **`src/components/sections/Rsvp.jsx` (reescrito).** Deja de ser un formulario nativo: conserva el
  ancla `#confirmar`, el `<h2>` del registro y la foto estructural de la plantilla, y pinta cinco
  estados:
  1. **modo demo** (`NOT_CONFIGURED`, cuando falta la URL) y **«sin `slug`»** (`MISSING_SLUG`, cuando
     hay URL y falta el `slug`): invitación completa, **aviso propio de cada causa** y confirmación
     deshabilitada, **sin** reintento;
  2. **carga**: bloque con un aviso de estado (`role="status"`), sin bloquear el resto de la página;
  3. **degradación** (`error`, con `errorCode`): aviso propio por causa, y botón de **reintentar**
     salvo en las causas sin reintento (RF-12, D25);
  4. **plazo cerrado** (`DEADLINE_EXPIRED`): bloque visible con el motivo;
  5. **formulario**: personalizada (nombre y acompañante de la ficha, cupo de la fila) o genérica y
     pública (nombre y teléfono obligatorios, también para **rechazar**); resultado del envío
     (`OK`/`errorCode`) con región viva y foco en el resultado (RNF-6).
  Los **mensajes** de cada código salen de `SERVICE_ERRORS` (fuente única) y se anuncian como copy
  de interfaz en español (RNF-7).

### 5.6 Datos (RF-1, RF-11, RF-14, D22)

- **`src/data/wedding.js`:** se quitan `confirmacion.fechaLimite` (el plazo lo da el servicio,
  RF-11) y `marca.enlaces.rsvp` (el envío ya no va a FormSubmit, RF-14). `confirmacion` conserva
  `titulo`, `descripcion` y `camposHabilitados`. `confirmacion.maximoBoda` **sale de la lógica de
  cupos** (D23): se conserva como dato informativo o se retira en T8, pero **ningún** cálculo lo lee.
- **`src/data/guest-cards.js`:** **se conserva** como **ejemplos ficticios** (nunca datos reales) con
  la forma nueva: los tres tipos (`personal`, `generic`, `public`), teléfono de ejemplo, límites y
  los cuatro estados. La app **deja de importarlo en ejecución**: sobrevive como **fixtures** de
  `guest-cards.test.js` (RF-1, D22).
- **`src/app/App.jsx`**, **`src/hooks/useInvitation.js`**, **`src/components/sections/Rsvp.jsx`** y
  **`src/utils/validation.js`:** son los que hoy importan las fichas; el registro se valida **sin**
  ellas —`registryErrors(wedding)`— y se retira la comprobación de conflicto de niños, que solo tenía
  sentido contra una ficha local (RF-1, RF-13). **`src/utils/validation.test.js`:** pierde el caso
  «conflicto de niños es error». **`src/utils/restrictions.js`** y
  **`src/utils/restrictions.test.js`:** se retira `hasChildrenConflict` (queda sin consumidor);
  `allowsChildren` y `restrictionMessages` se conservan (ver DT-8).

### 5.7 Servicio (Apps Script) y su documentación (RF-3…RF-10, RF-13, RF-17, RF-18)

- **`gas/Code.gs` (nuevo).** Implementa el contrato con las reglas de la spec:
  - lee el maestro por `slug`, comprueba `slug` **único** y `guests_sheet_id` **único entre filas
    activas**, respeta `is_active` (D14, D28) y trata `deadline` como **valor fijo** (D28);
  - localiza el **libro de invitados** por `guests_sheet_id` y lee/escribe **por el nombre de la
    cabecera** (RF-4);
  - resuelve el código **normalizado** según el `guest_type` resuelto (RF-2, RF-5, D20, D24);
  - en la **personalizada** escribe `viewed` al abrir si la fila no tiene respuesta (RF-6, RF-10);
  - en la **genérica** y la **pública** exige nombre y teléfono (también al rechazar), normaliza el
    teléfono a 10 dígitos (rechazo visible si no llega), busca por teléfono, crea la fila con
    `guest_id` entero autoincremental o actualiza la existente, escribe el **cupo** del código en
    `adults_guests` y deja los niños vacíos (RF-8, D5, D6, D7, D21, D23, D26);
  - hace valer el **plazo** y el **cupo** (RF-9, RF-11), usa los cuatro estados reversibles (RF-10)
    y devuelve los **códigos de error** del contrato (§4.1), incluida la respuesta **rechazada**
    (`INVALID_RESPONSE`) y los datos **de lectura** incoherentes (`INVALID_DATA`) (RF-13, RF-14);
  - mantiene `generic_json_cache` como mapa `código → límite`, reescribiéndola **solo** cuando está
    vacía, ilegible o no trae el código (RF-18, D23).

  **Cambio de §10 (Fase 4 — §10 manda sobre este punto).** Al servicio le toca el grueso del
  cambio, porque el modelo de los libros es suyo:
  - **Hoja `public` (`SHEET_NAMES.PUBLIC`).** `SHEET_NAMES` gana `PUBLIC: 'public'` y sus columnas
    se declaran **aparte** (`PUBLIC_COLUMNS = { PUBLIC_ID: 'public_id', LIMIT: 'limit' }`), porque su
    **cabecera de código no es `generic_id`** (RF-19).
  - **Resolución por tipo (D29).** `resolveCode_` deja de mirar **solo** `generic`: el **tipo manda**
    sobre la hoja donde se busca el código y el orden es *primero su hoja, después la otra*:
    `personal` → `guests` (`resolvePersonal_`, sin cambios de hoja); `generic` → hoja `generic`
    (**obligatoria**) y, **si el libro tiene hoja `public` y el código no está en `generic`**, se
    busca en `public`; `public` → hoja `public` (**obligatoria**) y la hoja `generic` **ya no hace
    falta** para servirla. La hoja **`guests` sigue siendo obligatoria en los tres tipos**.
  - **El idioma del `limit` (D30).** El `limit` de `public` habla **el mismo idioma** que el de
    `generic`: **entero mayor que cero** = cupo por respuesta; texto **`n`** = **sin tope** (el caso
    normal: el reservado `PUBLIC` con `"n"`). Un `limit` que **no** cumpla la regla de **su** hoja
    → **`MALFORMED_GUEST`** (005 RF-16), **no** `INVALID_DATA`. Y con D31, el código reservado
    `PUBLIC` **sale** de `generic`: una fila `PUBLIC` que se quede allí es **un código genérico
    más** y, con `limit = "n"`, responde `MALFORMED_GUEST` (el arreglo es **borrar la fila**, y es
    un cambio de **datos**, no de código: el servicio **no** modifica el libro).
  - **Segunda caché (D32).** `MASTER_COLUMNS` gana `PUBLIC_JSON_CACHE` (`public_json_cache`) y el
    maestro la lleva **junto** con `generic_json_cache`: mismo formato (mapa JSON `código → límite`,
    claves **normalizadas**), misma regla de refresco (**solo** cuando está vacía, es ilegible o no
    trae el código pedido) y misma fuente (la hoja manda si discrepan). Es **opcional**: que falte
    la columna no invalida la boda (RF-13, I9).
  - **Celda vacía = cero (D33).** `adults_attendees` y `child_attendees` **vacías** se leen como
    **cero** en **los tres** tipos y en **todas** las lecturas (`resolvePersonal_`, `lookupResponse_`
    y la escritura): una fila **con respuesta** cuyas celdas de asistentes estén vacías **no** es una
    fila inválida. Solo una celda **presente** con un valor que **no** sea un entero ≥ 0 (`"x"`,
    `-1`, `1,5`) sigue siendo `INVALID_DATA`. El arreglo es **de lectura**, **no** de datos: no se
    rellena ninguna fila del libro ni se inventa ningún valor (RF-20).
  - **Versión (D34).** `CONTRACT_VERSION` pasa a **`1.3.0`**, **a la vez** que el módulo.
- **`gas/README.md` (nuevo).** Puesta en marcha paso a paso: crear el maestro con su hoja `files` y
  sus columnas; dar de alta cada boda con el id de su libro, su `guest_type`, su `deadline` como
  **valor fijo** y su `is_active`; preparar el libro de cada boda con `guests` y `generic` y sus
  cabeceras; llenar los códigos de `generic` (**antes de §10, el `PUBLIC` iba aquí**: en la Fase 4
  **sale** de `generic`, ver el cambio de abajo); publicar la aplicación web;
  **avisar de que los libros no se versionan** y de que hay que corregir los `NOW()` y los ids
  repetidos del ejemplo.

  **Cambio de §10 (Fase 4 — §10 manda sobre este punto).** El README refleja el reparto nuevo:
  - **Paso 2**: la hoja **`public`** (con sus dos cabeceras exactas `public_id` y `limit`) y la
    columna **`public_json_cache`** del maestro; el código público **sale** de `generic`.
  - **Punto 8 (diagnóstico)**: el caso de la fila `PUBLIC` remanente en `generic` **sigue siendo
    cierto** (ese código no resuelve) pero **el motivo cambia**: ya no es `INVALID_DATA`, es
    **`MALFORMED_GUEST`**, y el arreglo es **borrar la fila** y **llevar el código público a la hoja
    `public`**. La nota explica además **qué hoja se mira según el tipo** (D29) y **por qué** un
    código de `public` en una boda `generic` **sí** resuelve (la caída de D29).
  - **Aviso de redespliegue**: todo cambio en `Code.gs` exige **publicar una versión nueva** de la
    implementación; como la versión del contrato **sube** a `1.3.0`, un despliegue viejo **se
    delata** en la salud (`GET` a la URL → `contract: "1.2.0"`).

## 6. Archivos nuevos y su responsabilidad

| Archivo | Responsabilidad | RF |
| --- | --- | --- |
| `src/constants/contract.js` | Fuente única del contrato (campos, estados, límites, códigos de error) | RF-17, RF-18, RF-19 |
| `src/constants/service.js` | Nombres de las variables de entorno de la configuración | RF-15 |
| `src/utils/service.js` | Normalizar la configuración y fijar su estado (puro) | RF-15 |
| `src/services/config.js` | Leer `import.meta.env` (Vite) | RF-15 |
| `src/services/registration.js` | Cliente HTTP del servicio (POST, JSON, 10 s, CORS realizable) | RF-14, RNF-4 |
| `src/utils/rsvp.js` | Teléfono, cuerpo del envío, validación e interpretación (puro) | RF-8, RF-9, RF-14, RF-20 |
| `src/hooks/useRsvp.js` | Estado del envío | RF-14 |
| `docs/servicio-invitados.md` | Documento humano derivado del módulo | RF-17, RF-19, RF-20 |
| `gas/Code.gs` | El servicio (Apps Script) | RF-3…RF-11, RF-13, RF-18, RF-19, RF-20 |
| `gas/README.md` | Puesta en marcha y comprobaciones manuales | §8, §13 |
| `test/serviceContract.test.js` | Sincronía documento ↔ módulo (+ versión del script) | RNF-10, RF-19 |

## 7. El modelo resuelto que devuelve el servicio (RF-6, D20)

La app **no** recibe filas: recibe el resultado ya resuelto. Forma mínima (los nombres son los del
contrato; el `slug` y la URL son configuración, no viajan de vuelta):

```
{ ok: true, action: "resolve",
  type: "personal" | "generic" | "public",
  guest: { name, partner, adultsGuests, childGuests, phone? },   // `phone` solo si aporta (no en precargadas)
  limit: 3 | "n",                                                // límite del código (genérica/pública)
  response: { state, adultsAttendees, childAttendees, message, restrictions, datetime } | null,
  deadline: "2027-10-25T23:59:59-06:00" | null }

{ ok: false, code: "<código de error>" }
```

En el envío (`action: "respond"`) la app manda `{ slug, code, name, phone, adults, children,
message, restrictions, response:"confirmed"|"rejected" }` y el servicio responde `{ ok, code }`.
En la **personalizada** el teléfono no se manda; en la genérica y la pública es obligatorio (D26).

## 8. Funciones puras

Todo lo que decide **sin** entorno vive en `src/utils/`; lo que depende de él (la URL, `fetch`, el
reloj, `localStorage`) entra por parámetro o vive en el hook/servicio (RNF-9).

| Función | Módulo | Entradas | RF |
| --- | --- | --- | --- |
| `readGuestCode(params)` | `utils/invitation.js` | `URLSearchParams` o mapa | RF-2 |
| `interpretInvitation(result)` | `utils/invitation.js` | respuesta del servicio | RF-5, RF-6, RF-12 |
| `seatsText(invitation)` / `formatSeats(total)` | `utils/invitation.js` | modelo resuelto | RF-9 |
| `guestLimit(invitation)` / `isWithinGuestLimit(count, limit)` | `utils/invitation.js` | modelo, número | RF-9 |
| `resolveServiceConfig(raw)` | `utils/service.js` | `{ url, slug }` → `state` | RF-15, D15 |
| `phoneDigits(value)` / `isPhoneComplete(digits)` | `utils/rsvp.js` | texto | RF-8 |
| `rsvpPayload(form)` | `utils/rsvp.js` | formulario + invitación | RF-14 |
| `validateRsvp(form, invitation)` | `utils/rsvp.js` | formulario + invitación | RF-8, RF-9 |
| `interpretRsvpResult(result)` | `utils/rsvp.js` | respuesta del servicio | RF-14 |
| `deadlineMs(value)` | `utils/confirmation.js` | valor del servicio | RF-11 |
| `isConfirmationOpen(deadline, nowMs)` | `utils/confirmation.js` | **«ahora» por parámetro** | RF-11 |
| `confirmationFields(confirmation)` | `utils/confirmation.js` | registro | RF-8 |

Ninguna función lee `Date.now()` por dentro, ninguna toca el DOM y ninguna importa un módulo de
React: es lo que hace que `node --test` las cubra.

### 8.1 Revisión de la Fase 4: la app **no** cambia (pero se **revisa** con prueba pura)

> **§10 manda sobre este punto.** El §10.6 pide **revisar, no asumir**: que la lógica pura de la
> app **tolere** la celda vacía (RF-20) y el `limit` de la hoja `public` (RF-19).

Lo que el código **ya** hace (comprobado en `src/utils/invitation.js` y `src/utils/rsvp.js`), y por
lo tanto **no** se toca:

- **`count()`** (`invitation.js` y `rsvp.js`) ya devuelve **cero** para un valor ausente o vacío y
  `null` solo para un valor **presente** que no es un entero ≥ 0 → la app **ya** lee la celda vacía
  como cero (RF-20). El desajuste del caso B estaba **solo** en el servicio.
- **`codeLimit()`** (`invitation.js`) ya admite `"n"` **en `generic` y en `public`** y exige un
  entero > 0 en cualquier otro caso → la app **ya** tolera el `limit` de la hoja `public` (RF-19,
  D30). Y con la **caída** de D29 ese caso **pasa a ser necesario**: una boda `generic` cuyo código
  solo está en `public` vuelve del servicio con `type: "generic"` y `limit: "n"`, y la app **tiene
  que** aceptarlo (si no, descartaría una invitación válida, el fallo silencioso de 005 §14.7).
- **`guestLimit()`**, **`seatsText()`**, **`attendeeLimits()`**, **`isWithinGuestLimit()`** y
  **`validateRsvp()`** leen `"n"` **sin mirar el tipo** → «sin tope» funciona igual en los tres tipos.

**Lo que sí hace la tarea T15:** **dejar constancia con prueba pura** de esos dos casos (celda
vacía = cero; `type: "generic"` + `limit: "n"` = sin tope) en `utils/invitation.test.js` y
`utils/rsvp.test.js`, y **solo** ajustar el código si la revisión encuentra un punto que **no** lo
tolera. Si hubiera que ajustarlo, el ajuste va **antes** de tocar la interfaz, con su prueba pura
(RNF-9, RNF-10). **La interfaz no se toca** en esta fase: el modelo que la app consume
(`type`, `limit`, `response`) **no** cambia de forma (§10.5).

## 9. Contratos que NO cambian (RF-2, RNF-2)

Nada de esto se renombra en esta spec; `test/contracts.test.js` (reescrito) lo vigila:

- **Anclas e identificadores de la página:** `#inicio`, `#fecha`, `#cita`, `#historia`, `#lugares`,
  `#itinerario`, `#galeria`, `#galeria-seccion`, `#confirmar`, `#regalos`, `#restricciones`,
  `#hospedaje`, `#cuenta-regresiva`, `#numero` y el `id="root"`. Siguen en español (enlaces
  compartibles).
- **Tema:** la clave `kg-tema`, los valores `dia`/`noche`, la clase `dark-mode` del `<html>` y el
  atributo `data-tema`.
- **Recursos:** los nombres de `assets/photos/opt/**`, `assets/icons/**` y `assets/audio.mp3`; el
  `og:image`, el favicon y las rutas del shell. Las **claves** de las fotos estructurales
  (`foto1`/`foto9`/`foto7`) siguen en el descriptor de la plantilla.
- **Registro:** todas las claves de `data/wedding.js` salvo las **dos** que se retiran
  (`confirmacion.fechaLimite`, `marca.enlaces.rsvp`); el valor `plantilla: "clasica"`; los nombres de
  campo de `confirmacion.camposHabilitados` (`nombre`, `asistentes`, `alergias`, `mensaje`).
- **Textos visibles:** los de la invitación (incluidos los avisos) siguen en español (RNF-6).
- **Lo que sí cambia, y a propósito:** el parámetro del enlace (`guest`, con `codigo`/`code`/`inv`
  jubilados), el destino del envío (el servicio, no FormSubmit) y el plazo (el maestro, no el
  registro).
- **Y en la Fase 4 (§10 manda sobre este punto):** los **literales nuevos** del modelo de los
  libros (`public`, `public_id`, `public_json_cache`) y la **versión** del contrato (`1.3.0`), que
  son **adiciones** del modelo, **no** renombrados: ni una hoja, ni una columna, ni un estado, ni un
  código de error, ni un mensaje, ni una acción, ni un campo, ni el parámetro `guest`, ni el
  teléfono, ni el tiempo de espera cambian de forma (§10.5).

## 10. Decisiones técnicas y alternativas descartadas

- **DT-1 · Un solo módulo de contrato consumido por la app, más un documento derivado.** El módulo
  es la fuente única y una prueba comprueba que el documento no lo omite. *Descartado:* solo el
  documento (no verificable por código) y solo el módulo (ilegible para quien organiza) (D18, RF-17).
- **DT-2 · POST con `Content-Type: text/plain;charset=utf-8` y cuerpo JSON.** Es lo que evita el
  preflight que una app web de Apps Script no responde. *Descartado:* `application/json` (dispara un
  `OPTIONS` que el servicio no contesta) y JSONP (no admite `POST`) (D27, RNF-4).
- **DT-3 · El servicio devuelve el modelo ya resuelto.** `type`, `limit`, `deadline` y el estado
  previo vienen dados. *Descartado:* devolver filas crudas y resolver en el cliente (duplicaría
  reglas, filtraría columnas y rompería RF-1/RF-5).
- **DT-4 · Configuración por variables de entorno de Vite** leídas en `services/config.js` y
  normalizadas en `utils/service.js`. *Descartado:* un `config.json` versionado (serían valores por
  publicación dentro del repo) y deducir el `slug` de la URL (RF-15).
- **DT-5 · Tiempo de espera con `AbortController` a 10 s** (valor del contrato). *Descartado:*
  confiar en el tiempo del navegador (puede no expirar y dejar el bloque colgado) (D25, RNF-5).
- **DT-6 · Los códigos de error son datos del contrato** (`SERVICE_ERRORS` con su copy) y la interfaz
  los busca por código. *Descartado:* repartir los mensajes por los componentes (sin fuente única ni
  prueba de sincronía) (§4.1, M9).
- **DT-7 · Se conservan los ejemplos ficticios** de `data/guest-cards.js` con la forma nueva, pero la
  app **no** los usa para personalizar. *Descartado:* borrarlos (se perderían los datos de prueba de
  la lógica pura) y dejarlos como fuente de personalización (contradice RF-1) (D22).
- **DT-8 · La validación del registro se desacopla de las fichas.** `registryErrors(wedding)` valida
  **solo el registro de la boda**; `App.jsx` deja de importar `guest-cards.js` en ejecución y las
  fichas quedan como **fixtures** de `guest-cards.test.js`. *Descartado:* dejar
  `registryErrors(wedding, guestCards)` (una ficha ficticia podría marcar un error **visible** en la
  invitación real, y contradice RF-1/D22) y borrar las fichas (se perderían los datos de prueba)
  (RF-1, RF-13, D22).
- **DT-9 · `useInvitation` no bloquea el render**: llama al servicio en un `useEffect` y expone un
  estado (`demo`/`loading`/`ready`/`error`). *Descartado:* resolver antes de pintar (retrasaría el
  primer pintado y rompería RNF-5).
- **DT-10 · El plazo entra por parámetro al hook** (`useConfirmation(deadline)`) y el «ahora» se lee
  dentro. *Descartado:* seguir leyendo el plazo del registro (contradice RF-11).
- **DT-11 · El servicio es un artefacto versionado** (`gas/Code.gs` + `gas/README.md`), pero los
  **libros no**: van fuera por `.gitignore`. *Descartado:* versionar los libros (datos personales,
  RNF-2) y no versionar el código (no habría contrato real que mantener).

### Decisiones de la Fase 4 (§10; DT-12…DT-16)

- **DT-12 · La resolución se hace por tipo, con la hoja del tipo primero (D29).** `resolveCode_`
  recibe el **tipo de la boda** y decide **qué hoja** mira: `generic` → `generic` y, si el libro
  tiene `public` y el código **no** está en `generic`, `public`; `public` → `public`. *Descartado:*
  (a) buscar **siempre** en las dos hojas sin prioridad (un código duplicado se resolvería por la
  hoja «menos probable», que es como aparecen los fallos difíciles de diagnosticar); (b) no mirar
  `public` en una boda genérica (el código público de una boda genérica **no** resolvería nunca);
  (c) cambiar el `guest_type` de la boda a `public` (obligaría a repartir un enlace único y a
  perder los códigos genéricos).
- **DT-13 · El `limit` de `public` usa el mismo idioma que el de `generic` (D30).** Entero > 0 = cupo
  por respuesta; `"n"` = sin tope. *Descartado:* (a) obligar a `"n"` en `public` (deja sin poder
  hacer una invitación pública **con tope**); (b) inventar un valor por hoja (obligaría a la app a
  conocer la hoja de cada código, que es justo lo que debe resolver el servicio); (c) dejar el
  `limit` de `public` libre (convertiría un dato mal escrito en un cupo inventado).
- **DT-14 · La celda vacía se lee como cero con un *helper* del servicio, no «rellenando» el
  libro (D33).** Un lector de asistentes que devuelve **cero** para la celda vacía y `null` solo
  para la celda **presente** e incoherente; se usa en `resolvePersonal_`, `lookupResponse_` y en la
  escritura. *Descartado:* (a) obligar a la escritura a rellenar `child_attendees` con `0` (cambia
  el modelo de los libros y **no** arregla las filas ya escritas); (b) tratar la celda vacía como
  cero solo en la consulta (deja el mismo fallo en la personalizada); (c) ignorar la columna si
  falta (eso es otra cosa: una **cabecera** ausente es un fallo real, RF-13).
- **DT-15 · La caché de `public` es una **segunda columna** del maestro (`public_json_cache`), no un
  mapa con prefijo (D32).** Mismo formato y misma regla de refresco que `generic_json_cache`.
  *Descartado:* un único mapa con espacio de nombres por hoja (`generic:…`, `public:…`) —rompe el
  formato de la caché existente y obliga a **migrar** a mano—; meter los dos mapas en una celda con
  una estructura nueva (lo mismo, y se pierde la caché si alguien edita la celda); no cachear
  `public` (la hoja es pequeña, pero `public` abriría el libro en cada resolución).
- **DT-16 · La versión sube a `1.3.0` y no a `2.0.0` (D34).** El cambio es del **modelo de los
  libros**, no de la forma de las llamadas: la tabla de códigos, los tipos, los estados, las acciones,
  los campos, el parámetro `guest`, el teléfono y el tiempo de espera **no** cambian (§10.5).
  *Descartado:* no subirla (el módulo cambiaría sin que nada lo delate y un despliegue viejo
  quedaría indetectable); subirla solo en el script (la prueba de sincronía falla si el módulo y el
  script no coinciden); `2.0.0` (no hay ruptura de forma: no se retira ni se renombra nada).

## 11. Estrategia de implementación (cada paso termina en verde)

Cada paso cierra con `npm test` en verde y `npm run build` sin errores; ninguna prueba se relaja: si
vigila un nombre que cambia, se actualiza **comprobando lo mismo**.

### Fase 1–3 — la spec 004 ya implementada (T1–T10)

1. **Higiene de git (T1).** Regla de `.gitignore` que excluye los libros reales y limpieza del
   comentario obsoleto. `git check-ignore` lo demuestra.
2. **Enmienda de la constitución (T2)** (§2).
3. **Contrato (T3):** `constants/contract.js`, `constants/service.js`, `docs/servicio-invitados.md`
   y `test/serviceContract.test.js`.
4. **Lógica pura (T4):** reescritura de `utils/invitation.js`, `utils/confirmation.js` y creación de
   `utils/service.js` y `utils/rsvp.js`, con sus pruebas co-locadas.
5. **Servicios (T5):** `services/config.js` y `services/registration.js`.
6. **Hooks (T6):** `useInvitation`, `useRsvp` y `useConfirmation`.
7. **Presentación (T7):** `Rsvp.jsx` con sus cinco estados.
8. **Registro, fichas y contratos (T8):** retirar los dos valores del registro, **desacoplar la
   validación de las fichas** (`App.jsx`, `validation.js` y `restrictions.js`), rehacer los ejemplos
   ficticios y sus pruebas, y reescribir `test/contracts.test.js`.
9. **Servicio Apps Script (T9):** `gas/Code.gs` y `gas/README.md`.
10. **Cierre (T10):** documentación (`README.md`, `AGENTS.md`, `MEMORY.md`, `PENDING_TASKS.md`) y
    verificación manual completa, anotada en «Verificación».

No se publica nada a medias: entre T4 y T8 la app queda coherente en cada paso porque la lógica
pura y sus pruebas van antes que sus consumidores.

### Fase 4 — Hoja `public` y lectura tolerante (T11–T17, el cambio de §10)

> **§10 manda sobre este punto.** Los pasos 11–17 son el **cambio de requisitos posterior**; no
> rehacen las tareas 1–10. El orden es el de las dependencias: **primero el contrato** (el módulo
> es la fuente única y el documento se deriva de él), **después el servicio** (que consume el
> modelo), **después la vigilancia** (que comprueba que los dos lados no divergen), **después la
> app** (que se revisa) y **por último** la nota en la spec 005 y la gobernanza.

11. **Contrato (T11):** `constants/contract.js` gana `PUBLIC_SHEET` (`public`, `public_id`,
    `limit`) y `MASTER_SHEET.columns.PUBLIC_JSON_CACHE`, y `CONTRACT_VERSION` pasa a **`1.3.0`**;
    `docs/servicio-invitados.md` deriva las tres cosas (hoja `public` **columna a columna**, regla de
    **qué hoja se mira según el tipo**, **segunda caché**, **regla de la celda vacía** y versión).
    La **tabla de códigos no se toca**. La **declaración** de `CONTRACT_VERSION` en `gas/Code.gs` se
    sube **aquí**, **junto** con la del módulo, para que la prueba de sincronía **no quede en rojo**
    entre T11 y T12 (el resto del script es T12). Cierra con `npm test` en verde: la prueba de
    sincronía **falla** mientras el documento no reproduzca los literales nuevos.
12. **Servicio (T12):** `gas/Code.gs` — hoja `public` (`SHEET_NAMES.PUBLIC` + `PUBLIC_COLUMNS`),
    resolución **por tipo** (D29), idioma del `limit` (D30) con `MALFORMED_GUEST`, segunda caché
    `public_json_cache` (D32), **celda vacía = cero** en las tres lecturas (D33) y versión `1.3.0`
    (D34). Cierra con `npm test` en verde (la prueba de sincronía compara la **versión** del script
    con la del módulo, leída **como texto**).
13. **Puesta en marcha (T13):** `gas/README.md` — paso 2 (hoja `public` y `public_json_cache`),
    punto 8 (diagnóstico del `PUBLIC` remanente en `generic` → `MALFORMED_GUEST`, arreglo **de
    datos**) y aviso de **redespliegue** (la salud delata el despliegue viejo con
    `contract: "1.2.0"`).
14. **Vigilancia (T14):** `test/serviceContract.test.js` — **no cambia de regla**: su listado de
    literales se recoge **del módulo**, así que la hoja `public` entra **sola**; se le añade la
    vigilancia **estática** del script (que la hoja `public` y su columna estén declaradas, y que la
    versión coincida), leída **como texto**, **sin ejecutar** Apps Script.
15. **App (T15):** **revisión** de la lógica pura (`utils/invitation.js`, `utils/rsvp.js` y sus
    pruebas): dejar constancia con prueba pura de que la celda vacía se lee como **cero** y de que
    `{ type: "generic", limit: "n" }` se acepta (necesario con la caída de D29); **ajustar solo si
    la revisión encuentra algo que no lo tolera**. La **interfaz no se toca**.
16. **Nota y gobernanza (T16):** la spec 005 recoge la **derogación** de 005 RF-17/D22 y el
    **matiz** de su §14.8 (punto 13); `AGENTS.md`, `MEMORY.md` y `PENDING_TASKS.md` recogen la hoja
    `public`, la resolución por tipo, la celda vacía como cero, la versión `1.3.0` y el diagnóstico
    de `gas/README.md`; en `PENDING_TASKS.md` **desaparece** la entrada del «`PUBLIC` en la hoja
    `generic`» (ya no aplica: el arreglo ya está hecho y la nota vive en `gas/README.md`).
17. **Verificación manual (T17):** con el script **redesplegado** (salud `contract: "1.3.0"`) y un
    **libro de prueba**, los puntos **14–18** de §13 y la **regresión** de lo que ya funcionaba. El
    **veredicto lo anota el coordinador** en «Verificación» de `AGENTS.md`, **no** el implementador.

**Lo que esta fase NO hace:** rellenar ni corregir filas del libro (el arreglo del `INVALID_DATA` es
**de lectura**, RF-20/D33); tocar la **forma** del intercambio (ni códigos, ni mensajes, ni
acciones, ni campos, ni el parámetro `guest`, ni el teléfono, ni el tiempo de espera); añadir
dependencias; ni cambiar la interfaz.

## 12. Estrategia de pruebas con `node --test`

- **Convención intacta:** `*.test.js` co-locado con su módulo; `npm test` sigue siendo `node --test`
  (sin instalar nada). Los guardarraíles viven en `test/`.
- **Reescritas:** `utils/invitation.test.js`, `utils/confirmation.test.js`, `utils/validation.test.js`
  y `utils/restrictions.test.js` —las dos últimas **por RF-1/D22**: `registryErrors` pierde el
  parámetro de las fichas, así que el caso «conflicto de niños es error» (que llama
  `registryErrors(wedding, [{…}])`) deja de ser válido y `hasChildrenConflict` se retira—,
  `data/wedding.test.js` (hoy llama `registryErrors(wedding, guestCards)`),
  `data/guest-cards.test.js` (las fichas pasan a ser **fixtures**) y `test/contracts.test.js`.
- **Nuevas:** `utils/service.test.js`, `utils/rsvp.test.js` y `test/serviceContract.test.js`.
- **Casos que deben existir sí o sí** (lo que la spec exige y hoy no está cubierto):
  - `readGuestCode` devuelve el código **recortado** y `null` cuando falta; la app **no** normaliza
    mayúsculas (la comparación normalizada es del servicio, D24, y se comprueba en la verificación
    manual de §13);
  - `resolveServiceConfig`: los **tres** estados (sin URL, URL sin `slug`, ambos) (RF-15);
  - `PUBLIC`/`"n"` = sin tope; `limit` `1..10`; cupo 0 → solo rechazar (RF-9, D21);
  - teléfono: 10 dígitos válidos, `INVALID_PHONE` con 9 y con lada de país (D23);
  - `MISSING_FIELDS` cuando falta el nombre o el teléfono en la genérica y la pública, **también** al
    rechazar (D26);
  - `OVER_LIMIT` al superar el cupo (RF-9);
  - `isConfirmationOpen`: borde incluido, sin plazo y plazo ilegible (RF-11);
  - `interpretInvitation`: cada tipo, cada estado y cada código de error de §4.1;
  - `interpretRsvpResult`: la respuesta rechazada (`INVALID_RESPONSE`) y las causas del servicio
    (RF-14);
  - `serviceContract.test.js` (**mismo alcance que la spec §8**): todo literal del módulo (hoja,
    columna, estado, valor especial, acción, el parámetro `guest` y el tiempo de espera) aparece **al
    menos una vez** en `docs/servicio-invitados.md`, y la **tabla de códigos** coincide en **conjunto**
    y en el **mensaje** de cada código; **no** comprueba `retryable` (booleano, explicado en prosa).
- **Lo que `node --test` no puede cubrir** (y por eso queda para la verificación manual): `fetch`
  contra el servicio real, `import.meta.env`, el DOM (`<dialog>`, `localStorage`, `focus`), el audio y
  la paridad visual. Misma frontera que hoy.

### 12.1 Qué prueba la Fase 4 (T11–T15) y qué no

> **§10 manda sobre este punto.** La verificación automática **nunca** va contra el servicio vivo
> (RNF-10 intacta): va contra el **módulo del contrato**, contra el **documento** y contra la
> **lógica pura**.

- **Automático — el contrato (T11, T14).** El módulo declara la hoja `public` con sus dos columnas y
  la columna `public_json_cache`; su `CONTRACT_VERSION` es `1.3.0`; el documento reproduce cada
  literal **al menos una vez** y su **tabla de códigos** coincide con la del módulo **en conjunto y
  en el mensaje de cada código** (la tabla **no** ha cambiado: ni un código ni un mensaje más); el
  **script** declara la **misma** versión.
- **Automático — vigilancia estática del servicio (T14).** El script se lee **como texto** (no se
  ejecuta: no hay runner de Apps Script) y se comprueba que declara la hoja `public` y su columna de
  caché, que la versión coincide con la del módulo y que la **tabla de códigos** del script no
  inventa códigos ajenos al contrato. Esto es **vigilancia**, no ejecución: **no sustituye** a la
  verificación manual (RNF-10, DT-11).
- **Automático — la lógica pura de la app (T15).** La lectura de una respuesta con asistentes
  **ausentes o vacíos** da **cero** y **no** invalida la invitación (RF-20); un `limit` de la hoja
  `public` —**entero** o `"n"`— se acepta en su tipo, y `{ type: "generic", limit: "n" }` (la caída
  de D29) se acepta como **sin tope** (RF-19, D30).
- **Manual — lo que solo se puede ver con el script en marcha (T17).** La resolución **por tipo**
  contra un libro real (los puntos 14–16), la **consulta por teléfono** con una fila ya registrada
  y su celda vacía (punto 17), la celda **presente** incoherente (punto 18) y la **regresión** de
  los tres tipos. Con el **script redesplegado**: la salud debe devolver `contract: "1.3.0"`.

## 13. Verificación

- **Automática:** `npm test` completo y `npm run build` en verde. La forma del envío y de la lectura
  se verifica contra el **módulo** del contrato, no contra el servicio en vivo (RNF-10).
- **Manual (en navegador, escritorio y móvil), con un despliegue real del Apps Script:**
  - un envío real de **cada tipo** y su fila en `guests` (nombre y teléfono en la genérica y la
    pública; sin tocar la identidad ni el cupo en la personalizada);
  - una segunda respuesta con el **mismo teléfono** que **actualiza** la fila y no la duplica;
  - **boda inactiva**, **código desconocido**, **sin `slug`** y **sin configurar** (modo demo):
    cada una con su aviso y su comportamiento de reintento;
  - **teléfono corto**, **cupo 0**, **plazo vencido** y **servicio caído** (URL rota) → degradación
    visible y confirmación deshabilitada;
  - `viewed` escrito al abrir una personalizada sin respuesta y **no** sobrescrito si ya había
    respuesta.
- **Registro:** el resultado se anota en la sección «Verificación» de `AGENTS.md` (principio 4).

### 13.1 Verificación manual del cambio de §10 (Fase 4, T17)

> **§10 manda sobre este punto.** Con el script **redesplegado** (salud: `GET` a la URL →
> `contract: "1.3.0"`; un despliegue viejo delata `"1.2.0"`) y un **libro de prueba**. Los puntos
> son los de §10.7 de la spec.

14. **La hoja `public`.** En una boda `public` con la hoja `public` (`public_id`, `limit`) y la
    fila `PUBLIC` con `limit = "n"`: `resolve` y `lookup` de `PUBLIC` responden `ok: true` con
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

**Regresión de lo que ya funcionaba:** los códigos `…_GEN` de una boda `generic` siguen resolviendo
con su `limit` numérico y su combo `1..cupo`; la **personalizada** sigue precargando nombre,
acompañante y cupo y **no** pide teléfono; el `viewed` se sigue escribiendo al abrir una
personalizada sin respuesta; el plazo, el rechazo y la actualización por teléfono siguen igual; y el
punto 7 de `gas/README.md` (tolerancia de cabeceras de `lookup`) sigue pasando.

**Quién anota el veredicto:** el **coordinador**, en la sección «Verificación» de `AGENTS.md`; el
implementador **no** lo da por bueno sin verlo contra el despliegue vivo.

## 14. Cobertura de requisitos

| Parte del plan | RF/RNF |
| --- | --- |
| §5.4 hook de invitación, §5.2 `interpretInvitation`, §5.6 registro validado sin fichas | RF-1 |
| §5.2 `readGuestCode`, §5.1 `GUEST_PARAM`, §5.7 comparación normalizada del código | RF-2 |
| §5.7 `Code.gs` (maestro, `slug`, `is_active`, `guests_sheet_id`, duplicados) | RF-3 |
| §5.7 lectura por cabecera, hojas por tipo | RF-4 |
| §5.2 `INVITATION_TYPES` e `interpretInvitation` (tipo resuelto), §5.7 | RF-5 |
| §5.4 `useInvitation`, §5.2 `interpretInvitation` (respuesta previa) | RF-6 |
| §5.2 `reservedSeats`/`guestLimit`, §5.7 escritura de la personalizada | RF-7 |
| §5.2 `rsvp.js` (teléfono, obligatorios), §5.5 formulario, §5.7 escritura por teléfono | RF-8 |
| §5.2 `guestLimit`/`isWithinGuestLimit`/`seatsText`, §5.3 validación, §5.7 | RF-9 |
| §5.7 estados reversibles y `viewed`, §5.5 estados del bloque | RF-10 |
| §5.2 `confirmation.js`, §5.4 `useConfirmation`, §5.7 plazo del maestro | RF-11 |
| §5.5 degradación, §5.4 estado `error`, §5.2 códigos, §5.7 denegaciones | RF-12 |
| §5.2 validadores, §5.6 `validation.js` valida el registro sin las fichas, §5.7 cabeceras y valores inválidos | RF-13 |
| §5.3 cliente, §5.4 `useRsvp`, §5.5 resultado del envío (`INVALID_RESPONSE`) | RF-14 |
| §5.1 `utils/service.js` (tres estados) + `services/config.js`, §5.4 demo y «sin `slug`» | RF-15 |
| §5.6 registro local intacto; §5.5/§5.3 no tocan el contenido | RF-16 |
| §5.1 módulo + documento, §5.6 sin libros, §11 paso 1 `.gitignore`, §12 sincronía | RF-17, RNF-2, RNF-10, D18, D19 |
| §5.7 caché `generic_json_cache` | RF-18 |
| **§5.1 `PUBLIC_SHEET` + `MASTER_SHEET.columns.PUBLIC_JSON_CACHE`, §5.7 `SHEET_NAMES.PUBLIC` / `PUBLIC_COLUMNS`, §5.7 `resolveCode_` por tipo (D29) y regla del `limit` (D30), §5.7 segunda caché (D32), §5.1 `CONTRACT_VERSION` `1.3.0` (D34), §8.1 revisión de la app, §12.1 vigilancia, §13.1 puntos 14–16** | **RF-19, D29, D30, D31, D32, D34** |
| **§5.7 lector de asistentes (celda vacía = cero) en `resolvePersonal_`, `lookupResponse_` y la escritura (D33), §8.1 `count()` y sus pruebas, §12.1 prueba pura, §13.1 puntos 17–18** | **RF-20, D33** |
| §5.5 degradación con aviso por causa, §5.4 estado `error` | RNF-3 |
| §5.5 regiones vivas y foco, §5.2 copy por código | RNF-6 |
| §4 nomenclatura, §5.1 códigos en inglés | RNF-7 |
| §3 estructura, §5 capas, §2 principio 3 | RNF-9 |
| §5.3 sin librerías de peticiones, §2 principio 1 | RNF-8 |

## 15. Riesgos y mitigaciones

- **El preflight de CORS tumba el envío.** → DT-2 (`text/plain` + JSON) y **comprobar el despliegue
  real en cuanto exista** (T9), no al final; si la respuesta viniera con redirección que rompe CORS,
  se documenta y se fija en el contrato.
- **Los libros reales del ejemplo traen `NOW()` y dos bodas con el mismo `guests_sheet_id`.** → El
  servicio los detecta y falla de forma visible (RF-3, D28) y `gas/README.md` explica cómo
  corregirlos; la puesta en marcha es manual.
- **Filtrar datos personales al repositorio.** → `.gitignore` en el **primer** paso (T1), el módulo y
  el documento sin datos reales, y los ejemplos ficticios como únicos datos versionados.
- **La app queda a medias entre dos modelos.** → El orden de §11: la lógica pura y sus pruebas
  primero; `utils/` no importa `services/` (grafo hacia dentro).
- **Dependencia del reloj o de la red en las pruebas.** → El «ahora» entra por parámetro
  (`isConfirmationOpen`) y la red vive solo en `services/` y `hooks/`; la lógica pura se prueba sin
  ninguna de las dos.
- **La configuración ausente en el build** (variables de entorno olvidadas) deja el sitio en modo
  demo **en silencio**. → El modo demo es un estado visible y con aviso (RF-15); la puesta en marcha
  lo documenta.

### Riesgos de la Fase 4 (§10.8)

- **Que la fila `PUBLIC` que se queda en `generic` sea un callejón sin salida.** → El fallo es
  **explícito** (`MALFORMED_GUEST`, con su mensaje propio) y `gas/README.md` (punto 8) dice **qué
  hacer**: borrar la fila y llevar el código público a la hoja `public`. La app **no** puede
  «arreglar» el libro.
- **Que un libro con la hoja `public` a medias (sin `public_id` o sin `limit`) no lo note nadie.** →
  Es `INVALID_DATA` **visible** (RF-19, RF-13) y el paso 2 de `gas/README.md` lista las dos
  cabeceras exactas.
- **Que un despliegue viejo siga sirviendo el script anterior.** → La versión sube a `1.3.0` y la
  **salud** del servicio la delata (`contract`); la comprobación manual empieza por ahí (§13.1).
- **Que el servicio empiece a tratar un vacío como cero en un sitio donde no debía.** → La regla
  **no** relaja nada más: una celda **presente** e incoherente sigue siendo `INVALID_DATA` y el
  resto del cuadre de RF-13 no cambia (§13.1, punto 18).
- **Que leer «cero» en una celda vacía esconda un dato mal escrito.** → El servicio deja esas
  celdas vacías **a propósito** (D12) y un dato mal escrito es un caso distinto —celda
  **presente**— que **sigue** fallando (D33).
- **Que la fila pública quede con `adults_guests` vacío («sin tope») y alguien lo lea como un cupo
  de cero.** → Ninguna lectura del servicio toma `adults_guests` de una fila genérica o pública
  como cupo —el cupo sale del **código**—, y la app no inventa máximos (RF-9, D30).
- **Que la segunda caché (`public_json_cache`) se olvide de refrescar.** → La **misma** regla que la
  de `generic` (vacía, ilegible o sin el código → se lee la hoja y se refresca) y la nota de
  `gas/README.md` sobre «la caché es una copia» se extiende a las dos (D32, RF-18).
- **Que la app descarte una invitación válida.** → El plan **revisa** la lectura de la app contra
  el modelo nuevo antes de tocar nada (§8.1) y la lógica pura tiene sus pruebas (RNF-9).
- **Que el arreglo se haga «rellenando» el libro en vez de arreglando la lectura.** → El cambio es
  **de lectura**: ninguna tarea rellena, corrige ni inventa filas (RF-20, D33).

## 16. Fuera de alcance (recordatorio)

Todo lo que la spec §7 excluye: traer el contenido de la boda del servicio, notificar a la pareja,
cambiar el modelo de los libros, gestionar `is_active` desde la app, migrar los libros, generar los
enlaces, invalidar cachés a mano, panel de administración, coordinar pestañas y el tope global de
asistentes.

> **§10 manda sobre este punto.** La **única** incorporación al modelo de los libros es la hoja
> **`public`** (`public_id`, `limit`), y entra **por petición expresa** con su regla de resolución
> (RF-19, D29, §10.4). En la Fase 4 **tampoco** se toca: el resto del modelo de los libros, la
> forma de las llamadas, la tabla de códigos, la interfaz y los **datos** de los libros (el
> servicio no rellena ni borra filas).

## 17. Criterios de finalización de este plan

1. Constitución enmendada (§2) y los libros reales fuera de git (§11, paso 1).
2. Contrato en **módulo + documento**, con la prueba de sincronía en verde (RF-17, RNF-10).
3. La invitación resuelve los tres tipos contra el servicio, con degradación visible y sin
   personalización cuando no hay invitación (RF-1…RF-6, RF-12).
4. La respuesta se registra en el libro de la boda por los cuatro estados y por teléfono, con el cupo
   y los códigos de error del contrato (RF-7…RF-10, RF-13, RF-14).
5. `npm test` en verde con las pruebas puras nuevas y los dos guardarraíles, y `npm run build` sin
   errores (RNF-9, RNF-10).
6. Verificación manual de §13 anotada en «Verificación» y documentos (`README.md`, `AGENTS.md`,
   `MEMORY.md`, `PENDING_TASKS.md`) actualizados (T10).

**Y, para la Fase 4 (§10):**

7. El módulo declara la hoja `public` (`public_id`, `limit`) y la columna `public_json_cache`, con
   `CONTRACT_VERSION` = **`1.3.0`**; el documento reproduce los literales y la tabla de códigos sigue
   coincidiendo **en conjunto y en el mensaje de cada código** (RF-19, D34).
8. El servicio resuelve **por tipo** (la hoja del tipo primero), aplica el mismo idioma del `limit`
   en las dos hojas, mantiene la **segunda caché** con la misma regla de refresco y lee la **celda
   vacía como cero** en las tres lecturas; un `limit` que no cumple la regla de su hoja responde
   `MALFORMED_GUEST` (RF-19, RF-20, D29–D33).
9. `gas/README.md` refleja el reparto nuevo (hoja `public`, punto 8, aviso de redespliegue) y
   `PENDING_TASKS.md` ya no tiene la entrada del «`PUBLIC` en la hoja `generic`».
10. Los puntos **14–18** de §13.1 y la regresión están verificados **contra el despliegue real**
    (script **redesplegado**, salud `contract: "1.3.0"`), con el veredicto anotado por el
    **coordinador** en «Verificación» de `AGENTS.md`.
