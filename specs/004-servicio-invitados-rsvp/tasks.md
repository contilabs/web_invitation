# Tareas — Spec 004: Servicio de invitados y RSVP

Ordenadas por dependencia. Cada tarea es pequeña (≤ 20–30 min), indica los RF que cubre y tiene una
línea **Hecho cuando:** verificable. Los RF/RNF citados son los de la **spec 004** (`spec.md`), no los
de specs anteriores.

**Regla de cierre de cada tarea:** `npm test` en verde y `npm run build` sin errores. Ninguna prueba se
relaja: si vigila un nombre que cambia, se actualiza **comprobando lo mismo**. Nada se publica a medias.

**Prerequisito:** todo el plan respeta la constitución **enmendada** en T2. La lógica pura y sus
pruebas van **antes** que sus consumidores (§11 del plan).

**Orden de documentos:** la constitución se enmienda primero (T2); `README.md`, `AGENTS.md`,
`MEMORY.md` y `PENDING_TASKS.md` se actualizan **al final** (T10), porque describen rutas y
comportamiento y hacerlo antes dejaría la documentación en contradicción con el código.

> **Fase 4 (T11–T17) — el cambio de requisitos posterior (§10 de la spec).** Viene **después** de
> las T1–T10 y **no las rehace**: la spec 004 ya está implementada y verificada. Lo que trae es la
> **hoja `public` independiente** (RF-19) y la **lectura tolerante de las celdas vacías** (RF-20),
> con las decisiones **D29–D34**. Cuando el §10 contradiga el cuerpo de la spec, **manda el §10**.
> **Regla de cierre de la fase:** la misma que la de cada tarea —`npm test` en verde y `npm run
> build` sin errores— y, además, **nada de rellenar ni de corregir filas del libro**: el arreglo
> del `INVALID_DATA` es **de lectura** (RF-20, D33).

## Fase 1 — Higiene y contrato

- [x] **T1 · Excluir los libros reales del repositorio.** _RF: RF-17; RNF-2; D19._
  Hecho cuando: `.gitignore` incluye la regla que excluye los libros (p. ej. `gas/*.xlsx`) y
  `git check-ignore gas/Master.xlsx gas/Guests_Karina-Gerardo.xlsx` responde con su ruta;
  `git status` no lista ningún `.xlsx`; el comentario obsoleto del archivo queda corregido.

- [x] **T2 · Enmendar la constitución.** _RF: RF-15, RF-17; RNF-1, RNF-2, RNF-6, RNF-7._
  Hecho cuando: el principio 5 dice que el teléfono entra en el alcance y es la llave de la genérica
  y la pública, que los libros reales se excluyen por `.gitignore` y que el contrato es un **módulo +
  documento**; el principio 6 amplía la excepción de idioma a hojas, columnas, estados y códigos de
  error; `npm test` y `npm run build` siguen en verde.

- [x] **T3 · Contrato del servicio: módulo, documento y sincronía.** _RF: RF-17; RNF-10; D18, D25,
  D27._
  Hecho cuando: existen `src/constants/contract.js` (versión, parámetro `guest`, hojas y columnas,
  estados, `"n"`, 10 dígitos, 10 s, acciones y la tabla §4.1), `src/constants/service.js` y
  `docs/servicio-invitados.md` (derivado del módulo); `test/serviceContract.test.js` **falla** si se
  quita del documento un campo o un código del módulo; `npm test` está en verde.

## Fase 2 — Lógica pura, servicios y presentación

- [x] **T4 · Lógica pura: invitación, plazo y envío.** _RF: RF-2, RF-5, RF-6, RF-8, RF-9, RF-11,
  RF-14; RNF-9._
  Hecho cuando: `utils/invitation.js` y `utils/confirmation.js` (reescritos) y `utils/service.js` y
  `utils/rsvp.js` (nuevos) exportan las funciones de §8 del plan, con pruebas co-locadas que cubren el
  código **recortado** y su ausencia (la comparación sin distinguir mayúsculas es del servicio), los
  tres estados de la configuración, los tres tipos, `"n"` sin tope, cupo 0, teléfono de 10 dígitos,
  `MISSING_FIELDS`/`INVALID_PHONE`/`OVER_LIMIT`, la respuesta rechazada (`INVALID_RESPONSE`) y el borde
  del plazo; ningún módulo toca el DOM, el reloj ni la red.

- [x] **T5 · Cliente del servicio y configuración.** _RF: RF-14, RF-15; RNF-4, RNF-8; D27._
  Hecho cuando: `services/registration.js` hace `POST` con `text/plain` y cuerpo JSON, espera 10 s con
  `AbortController` y devuelve `{ ok, data, errorCode }` **sin lanzar**; `services/config.js` lee las
  variables de entorno y `resolveServiceConfig` distingue los **tres** estados (sin URL →
  `not-configured`; URL sin `slug` → `missing-slug`; ambas → `ready`); `package.json` no gana
  dependencias.

- [x] **T6 · Hooks de la invitación, el plazo y el envío.** _RF: RF-1, RF-11, RF-12, RF-14; RNF-3,
  RNF-5._
  Hecho cuando: `useInvitation` expone `{ status, invitation, errorCode }` (sin URL → `demo` sin
  llamar; con URL y sin `slug` → `error` con `MISSING_SLUG` y **sin reintento**), `useConfirmation`
  recibe el plazo por parámetro y `useRsvp` expone `{ status, errorCode, submit }`; la app compila y el
  primer pintado no queda bloqueado.

- [x] **T7 · La sección de confirmación con sus cinco estados.** _RF: RF-8, RF-12, RF-14; RNF-3,
  RNF-6._
  Hecho cuando: `Rsvp.jsx` pinta modo demo, carga, degradación con **reintento** (salvo en las causas
  sin reintento), plazo cerrado y formulario; en la genérica y la pública pide nombre y teléfono
  **también para rechazar**; conserva el ancla `#confirmar` y el `<h2>` del registro; anuncia los
  avisos en regiones vivas y mueve el foco al resultado.

## Fase 3 — Registro, servicio y cierre

- [x] **T8 · Registro, ejemplos ficticios y contratos.** _RF: RF-1, RF-2, RF-11, RF-13, RF-14._
  Hecho cuando: `data/wedding.js` ya no tiene `confirmacion.fechaLimite` ni `marca.enlaces.rsvp` y
  **ningún** cálculo usa `maximoBoda`; `App.jsx`, `useInvitation.js`, `Rsvp.jsx` y `validation.js`
  dejan de importar `guest-cards.js` en ejecución —`registryErrors(wedding)` valida **solo el
  registro** y se reescriben `data/wedding.test.js` (deja de pasarle las fichas),
  `utils/validation.test.js` (desaparece el caso «conflicto de niños es error», que llamaba
  `registryErrors(wedding, [{…}])`) y `utils/restrictions.test.js` (se retira `hasChildrenConflict`)—
  y las fichas quedan como **fixtures** de `guest-cards.test.js` con la forma nueva (tres tipos,
  teléfono y los cuatro estados); `test/contracts.test.js` vigila los contratos nuevos (parámetro
  `guest` y ausencia de `codigo`/`code`/`inv`, de `enlaces?.rsvp` y de FormSubmit, claves del registro
  y anclas); `npm test` en verde.

- [x] **T9 · El servicio (Apps Script) y su puesta en marcha.** _RF: RF-3…RF-11, RF-13, RF-14, RF-18;
  D5, D6, D7, D14, D20, D21, D23, D24, D26, D28._
  Hecho cuando: `gas/Code.gs` implementa el contrato (maestro por `slug` con `slug` y
  `guests_sheet_id` únicos y `is_active`, libro abierto por `guests_sheet_id`, lectura/escritura por
  cabecera, `viewed` al abrir la personalizada sin respuesta, teléfono como llave con `guest_id`
  autoincremental, cupo en `adults_guests`, los cuatro estados, el plazo y la caché) y responde con los
  códigos de error de §4.1 (`INVALID_DATA` en la lectura y `INVALID_RESPONSE` en una respuesta
  rechazada); `gas/README.md` explica la puesta en marcha. (La comprobación contra el servicio vivo va
  en T10.)

- [ ] **T10 · Documentación y verificación manual.** _RF: RF-16; RNF-3, RNF-6._
  Hecho cuando: `README.md` (enlaces con `guest` y los tres tipos), `AGENTS.md`, `MEMORY.md` y
  `PENDING_TASKS.md` están al día (en `PENDING_TASKS.md` desaparecen las entradas que dejan de
  aplicar: el RSVP sin servicio y los límites fuera de rango; y en `MEMORY.md`, la retirada del tope
  `maximoBoda` de la lógica de cupos); `npm test` y `npm run build` en verde; contra un **despliegue
  real** del Apps Script, los tres tipos se resuelven y una respuesta aparece en la fila correcta del
  libro correcto; y la pasada manual de §13 del plan (edición por el mismo teléfono, boda inactiva,
  código desconocido, sin `slug`, modo demo, teléfono corto, cupo 0, plazo vencido y servicio caído)
  está hecha y anotada en «Verificación».

> **Nota.** La comprobación contra el despliegue real **de la Fase 4** (hoja `public`, celda vacía y
> regresión) es la **T17**; la T10 se queda con la parte **documental** de las specs 004/005.

## Fase 4 — Hoja `public` y lectura tolerante (cambio de §10)

- [x] **T11 · Contrato: la hoja `public`, la segunda caché y la versión `1.3.0`.** _RF: RF-17, RF-19,
  RF-20; RNF-10; D18, D32, D34._
  Hecho cuando: `src/constants/contract.js` declara `PUBLIC_SHEET` (nombre `public`, columnas
  `public_id` y `limit`) y `MASTER_SHEET.columns.PUBLIC_JSON_CACHE` (`public_json_cache`), y su
  `CONTRACT_VERSION` es `"1.3.0"` **en los dos lados** (el módulo y la **declaración** de
  `gas/Code.gs`, para que la prueba de sincronía no quede en rojo entre T11 y T12); en
  `docs/servicio-invitados.md` quedan la hoja `public` **columna a columna**, la regla de **qué hoja
  se mira según el tipo**, la **segunda caché**, la **regla de la celda vacía** y la versión `1.3.0`;
  la **tabla de códigos** del módulo y del documento sigue coincidiendo **en conjunto y en el
  mensaje de cada código** (ningún código ni mensaje nuevo); `npm test` en verde.

- [x] **T12 · Servicio: la hoja `public` en `gas/Code.gs` y la celda vacía como cero.** _RF: RF-19,
  RF-20; D29, D30, D31, D32, D33, D34._
  Hecho cuando: `gas/Code.gs` declara `SHEET_NAMES.PUBLIC` (`'public'`), las columnas de esa hoja
  **aparte** (`public_id`, `limit`) y `MASTER_COLUMNS.PUBLIC_JSON_CACHE`; `resolveCode_` resuelve
  **por tipo** (genérica: `generic` y, si el libro tiene `public` y el código **no** está en
  `generic`, `public`; pública: `public`, y `generic` ya no hace falta) con el **mismo idioma** del
  `limit` en las dos hojas (entero > 0 = cupo, `"n"` = sin tope) y **`MALFORMED_GUEST`** cuando el
  código existe pero su `limit` no cumple la regla de **su** hoja; la caché `public_json_cache` se
  escribe con la **misma** regla de refresco que `generic_json_cache`; `adults_attendees` y
  `child_attendees` **vacías** se leen como **cero** en `resolvePersonal_`, en `lookupResponse_` y en
  la escritura, mientras que una celda **presente** incoherente (`"x"`, `-1`, `1,5`) sigue
  respondiendo `INVALID_DATA`; `CONTRACT_VERSION` es `'1.3.0'`; **no se rellena ni se borra ninguna
  fila** del libro; `npm test` en verde.

- [x] **T13 · `gas/README.md`: el reparto nuevo y el aviso de redespliegue.** _RF: RF-19, RF-20;
  D29, D31, D34._
  Hecho cuando: el **paso 2** documenta la hoja `public` con sus dos cabeceras exactas (`public_id` y
  `limit`) y la columna `public_json_cache` del maestro, y dice que el código público **sale** de
  `generic`; el **punto 8** explica que la fila `PUBLIC` que se queda en `generic` responde
  **`MALFORMED_GUEST`** (no `INVALID_DATA`) y que el arreglo es **borrar la fila** y llevar el
  código a la hoja `public` (un arreglo **de datos**, no de código), y dice **qué hoja se mira**
  según el tipo; hay un aviso de **redespliegue** (todo cambio en `Code.gs` exige una versión nueva
  de la implementación y la salud delata el despliegue viejo con `contract: "1.2.0"`); no queda
  ninguna instrucción que rellene filas.

- [ ] **T14 · Vigilancia del contrato y del servicio (estática, sin ejecutar Apps Script).**
  _RF: RF-17, RF-19; RNF-10; D18, D34._
  Hecho cuando: `test/serviceContract.test.js` **no relaja** su regla: recoge del **módulo** los
  literales de la hoja `public` y de `public_json_cache` (sin escribirlos a mano) y **falla** si el
  documento no los reproduce; comprueba que `gas/Code.gs` declara la **misma** versión que el módulo
  y que declara la hoja `public` y su columna de caché, **leídos como texto** (sin ejecutar Apps
  Script); la tabla de códigos del módulo y del documento sigue coincidiendo en conjunto y en el
  mensaje de cada código; `npm test` en verde.

- [ ] **T15 · Revisión de la lógica pura de la app (la celda vacía y el `limit` de `public`).**
  _RF: RF-19, RF-20; RNF-9, RNF-10; D30, D33._
  Hecho cuando: las pruebas de `utils/invitation.test.js` y `utils/rsvp.test.js` dejan constancia de
  que una respuesta con asistentes **ausentes o vacíos** se lee como **cero** y **no** invalida la
  invitación, y de que `{ type: "generic", limit: "n" }` (la caída de D29) se acepta como **sin
  tope** (`guestLimit`, `seatsText`, `attendeeLimits`, `validateRsvp`); **solo** si la revisión
  encuentra un punto que no lo tolera, se ajusta `src/utils/` **con su prueba pura** y **sin** tocar
  la interfaz; `npm test` en verde.

- [x] **T16 · Nota en la spec 005 y gobernanza.** _RF: RF-19, RF-20; D31._
  Hecho cuando: `specs/005-flujo-rsvp-respuesta-previa/spec.md` deja constancia de que su
  **RF-17/D22 queda derogado** (el `PUBLIC` con `"n"` dentro de una boda genérica **ya no** vale
  por sin tope: es `MALFORMED_GUEST` y su arreglo es borrar la fila) y de que su **§14.8, punto
  13**, queda **matizado** (se sustituye por «`PUBLIC` en la hoja `public` → sin tope» y por «código
  mal formado → `MALFORMED_GUEST`»); `AGENTS.md` recoge la hoja `public`, la resolución por tipo, la
  celda vacía como cero, la versión `1.3.0` y el diagnóstico de `gas/README.md`; `MEMORY.md` los
  resume; y en `PENDING_TASKS.md` **desaparece** la entrada del «`PUBLIC` en la hoja `generic`» (ya
  no aplica: el arreglo es de datos, ya está hecho y la nota vive en `gas/README.md`).

- [x] **T17 · Verificación manual contra el despliegue real (puntos 14–18 y regresión).**
  _RF: RF-19, RF-20; RNF-3, RNF-10._
  Hecho cuando: con el script **redesplegado** (la salud devuelve `contract: "1.3.0"`; un despliegue
  viejo delata `"1.2.0"`) y un **libro de prueba**, se comprueban los puntos **14–18** de §13.1 del
  plan: (14) la hoja `public` resuelve en una boda `public` (con `PUBLIC`/`"n"` y con otro
  `public_id` de límite entero) y, sin esa hoja, → `INVALID_DATA`; (15) en una boda `generic` con
  hoja `public`, un código de `generic` resuelve, uno **solo** de `public` también y uno que no está
  en ninguna → `UNKNOWN_GUEST`; (16) la fila `PUBLIC` remanente en `generic` → `MALFORMED_GUEST` y,
  borrada, el mismo enlace resuelve contra `public`; (17) `lookup` de un teléfono **ya registrado**
  con `child_attendees` **vacío** → `ok: true` con `childAttendees: 0`, y la fila **no** cambia;
  (18) una celda **presente** incoherente → `INVALID_DATA`; y la **regresión** de los tres tipos,
  el `viewed`, el plazo, el rechazo y la actualización por teléfono. **El veredicto lo anota el
  coordinador** en «Verificación» de `AGENTS.md`, **no** el implementador. _(Infraestructura lista:
  contrato `1.3.0` en módulo y script, `gas/README.md` con hoja `public`/punto 8/aviso de redespliegue,
  vigilancia estática en verde. Verificación manual pendiente de ejecución y anotación.)_

- [ ] **T18 · Corregir el candado en `registerResponse_` (resolver fuera del lock).** _RF: RF-8, RF-14; D11._
  Hecho cuando: en `gas/Code.gs`, `registerResponse_` resuelve el código **fuera** del candado para
  genérica/pública (`resolveCode_` antes de `LockService.getScriptLock().waitLock(...)`), guarda
  `resolved` y lo pasa a `registerCodeResponse_` (o se reestructura para que no vuelva a llamar a
  `resolveCode_` dentro del lock); para personalizada, el flujo no cambia innecesariamente; el lock
  solo protege la lectura/escritura de la hoja `guests` (evitar asignar el mismo `guest_id` o
  pisarse filas); se mantiene la lógica existente, se conserva el manejo de errores y `LOCK_WAIT_MS`;
  `npm test` y `npm run build` siguen en verde. No se toca la interfaz ni otros archivos.
