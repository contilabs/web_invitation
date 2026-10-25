# Tareas — Spec 005: Flujo del RSVP: respuesta previa, estados del bloque y selección de asistentes

Ordenadas por dependencia. Cada tarea es pequeña (≤ 20–30 min), indica los RF que cubre y tiene una
línea **Hecho cuando:** verificable. Los RF/RNF citados son los de la **spec 005** (`spec.md`), no
los de specs anteriores.

**Regla de cierre de cada tarea:** `npm test` en verde y `npm run build` sin errores. Ninguna prueba
se relaja: si vigila un nombre que cambia, se actualiza **comprobando lo mismo**. Nada se publica a
medias.

**Prerequisito:** el contrato y el servicio (`lookup`) van **antes** que la interfaz; la lógica pura
y sus pruebas van **antes** que sus consumidores (plan §10). Los identificadores de código van en
inglés; los textos, datos, comentarios y documentación, en español. Nada de dependencias nuevas.

**Orden de documentos:** la documentación y la gobernanza van **al final** (T9), porque describen
comportamiento y rutas y hacerlo antes las dejaría en contradicción con el código.

**Revisión por el cambio de requisitos del formulario (T11–T15).** La spec ganó **RF-11** (los
campos de la asistencia solo existen con «Sí, asistiré») y un **RF-4** con el combo de adultos
`1..cupo` (sin el 0), el campo libre de `n` con **mínimo 1** y la normalización del valor fuera de
rango a **1** (D4, D17, D18; R8–R11). Son **presentación y composición del envío**: **no** tocan el
contrato, ni `gas/Code.gs`, ni `CONTRACT_VERSION` (RF-8 intacto). Las tareas nuevas van **después**
de T10 y **rehacen** una parte ya implementada de la spec 005 original (el rango `0..cupo` del combo
en **T5**, el cuerpo del rechazo en `rsvpPayload` y la visibilidad de los cuatro campos en **T8**);
la historia de T1–T10 **no** se reescribe. La lógica pura va **antes** que la presentación (plan
§10, RNF-4).

**R11 (decisión nueva): la validación pura también exige elegir asistencia.** Por elección de quien
pide el cambio, **no** basta con el `required` de los radios: `validateRsvp` **rechaza** el envío sin
asistencia elegida, con el código **existente** `INVALID_RESPONSE` (el contrato no admite códigos
nuevos). Se implementa en **T12** (junto a la composición del envío del rechazo, que ya vive en la
lógica pura) y se refleja en **T13**. **No** toca el contrato.

**Nota sobre la 004:** su verificación manual (T10 de la 004) sigue pendiente y la rellena el
coordinador en «Verificación» de `AGENTS.md`; **no** forma parte de estas tareas y aquí **no** se
marca.

**Cambio de requisitos posterior (Fase 6, T16–T23).** La spec cerró un **cambio nuevo** en su **§13**
(allí está la fuente de verdad): **RF-12** (copy propia del rechazo), **RF-13** (el mensaje también con
«No podré asistir»), **RF-14** (saludo con el nombre en la personalizada) y **RF-15** (la consulta
tolera las cabeceras que no usa), con **D19/D20** y **R12/R13**. Son **interfaz + composición del
envío + lógica pura del panel + servicio**, con **una decisión de forma cerrada** (la composición del
panel de lectura se hace en **lógica pura**). **No** toca el contrato (`CONTRACT_VERSION` sigue
`1.1.0`, `test/serviceContract.test.js` **no** cambia de regla), ni el modelo del libro, ni los
códigos de error. Va **después** de T15 y **no** reescribe la historia de T1–T15; el plan lo traduce en
su **§17**. La lógica pura va **antes** que sus consumidores (plan §10, RNF-4); el servicio, antes que
su documentación; la gobernanza, al final.

**Segundo cambio de requisitos posterior (Fase 7, T24–T29).** La spec cerró un **cambio nuevo** en su
**§14** (allí está la fuente de verdad): **RF-16** (un código **existente** con `limit` que no cumple la
regla de su tipo responde el código de error **nuevo** `MALFORMED_GUEST`, no `INVALID_DATA`) y
**RF-17** (`PUBLIC` con `limit = "n"` se acepta **también** en una boda `generic` como **«sin tope»**),
con **D21/D22** y **R14/R15**. Es **contrato + servicio + la app** (la lectura de la app tiene que
aceptar la invitación genérica sin tope), y **sí** cambia la **forma** del contrato: sube
`CONTRACT_VERSION` de `1.1.0` a **`1.2.0`** **a la vez** en `src/constants/contract.js`, `gas/Code.gs` y
`docs/servicio-invitados.md` (la **regla** de `test/serviceContract.test.js` **no** cambia). Va
**después** de T23 y **no** reescribe la historia de T1–T23; el plan lo traduce en su **§18**. La lógica
pura y el contrato van **antes** que sus consumidores (plan §10, RNF-4); el servicio, antes que su
documentación; la gobernanza, al final.

## Fase 1 — Contrato y servicio

- [x] **T1 · Declarar la acción `lookup` en el módulo del contrato y en su documento.** _RF: RF-8; D5, I2; M6._
  Hecho cuando: `src/constants/contract.js` declara `SERVICE_ACTIONS.LOOKUP = "lookup"`,
  `LOOKUP_FIELDS` con los literales de la petición (`action`, `slug`, `code`, `phone`) y de la
  respuesta (`ok`, `action`, `type`, `limit`, `response`, `deadline`, `code` y, dentro de `response`,
  `name`, `state`, `adultsAttendees`, `childAttendees`, `message`, `restrictions`, `datetime`) y
  `CONTRACT_VERSION = "1.1.0"`; `docs/servicio-invitados.md` explica la acción en una sección propia
  (petición, respuesta con `name` **dentro** de `response`, «no escribe la hoja `guests` —el
  `viewed` sigue siendo solo de la personalizada— y puede refrescar la caché», y los **mismos**
  códigos de error de la 004 §4.1), **retira** la frase derogada de §5 que negaba la respuesta
  previa y actualiza su línea de versión a `1.1.0`; `npm test` en verde sin tocar todavía la prueba
  de sincronía.

- [x] **T2 · Implementar la acción `lookup` en el servicio (Apps Script).** _RF: RF-5, RF-6, RF-8; D14; RNF-2._
  Hecho cuando: `gas/Code.gs` declara `CONTRACT_VERSION = '1.1.0'` y `SERVICE_ACTIONS.LOOKUP =
  'lookup'`, `doPost` despacha la acción a `lookupResponse_`, y esta valida `slug`/código/boda y que
  el tipo **no** sea `personal` (→ `INVALID_RESPONSE`), exige teléfono (`MISSING_FIELDS` vacío,
  `INVALID_PHONE` si no son diez dígitos), resuelve el límite reutilizando `resolveCode_` (con su
  caché) y lee **la fila de ese teléfono sin escribir nada** (ni `viewed`), devolviendo
  `{ ok: true, action: 'lookup', type, limit, response, deadline }` con `name`/`state`/
  `adultsAttendees`/`childAttendees`/`message`/`restrictions`/`datetime` dentro de `response` (o
  `response: null` si no hay fila o su `status` es vacío/`viewed`), con **ningún** código de error
  nuevo y **sin** objeto `guest` ni teléfono en la respuesta; `gas/README.md` recoge la comprobación
  manual de `lookup` (teléfono con fila y sin fila) y el aviso de redesplegar el script.

- [x] **T3 · Ampliar la prueba de sincronía del contrato (literales de `lookup` + igualdad de versión).** _RF: RF-8; RNF-5; M6, I2._
  Hecho cuando: `test/serviceContract.test.js` exige en `docs/servicio-invitados.md` los literales de
  `LOOKUP_FIELDS` y de la acción `lookup` (además de los que ya vigila) y afirma que `gas/Code.gs`
  declara la **misma** `CONTRACT_VERSION` que el módulo (leyendo el script como texto, sin
  ejecutarlo); `npm test` en verde y la prueba **falla** de verdad si se omite un literal o se
  cambia la versión de un solo lado.

## Fase 2 — Lógica pura y consulta

- [x] **T4 · Máquina de estados del bloque (pura, con sus pruebas).** _RF: RF-1, RF-7; D1, D2; B2, I1._
  Hecho cuando: `src/utils/rsvpState.js` exporta `BLOCK_STATES` (los siete estados con
  identificadores en inglés: `NOT_ANSWERED`, `PHONE`, `LOOKING_UP`, `ANSWERED`, `EDITING`, `CLOSED`,
  `DEGRADED`), `BLOCK_EVENTS`, `initialBlockState({ status, invitation, open })` (regla única:
  `degradado` > `cerrado` > `respondido` —personalizada con respuesta previa— > `sin-respondido`) y
  `nextBlockState(state, event, { personalized })` con la tabla de transiciones de RF-1 y `null`
  para los acontecimientos que no aplican; sin React, sin DOM y sin reloj; `src/utils/rsvpState.test.js`
  cubre los siete estados, cada arranque y cada transición (incluido el doble clic); `npm test` en
  verde.

- [x] **T5 · Lógica pura de la consulta y de la respuesta (interpretación, cuerpo, combos y precarga).** _RF: RF-2, RF-4, RF-5, RF-8, RF-10; M2, M4; R1._
  Hecho cuando: `src/utils/invitation.js` añade `interpretLookup(result)` (fila con respuesta → el
  modelo **más `name`**; sin fila o fila sin respuesta → `null`; `type` personal o respuesta fuera de
  contrato → `INVALID_DATA`; sin teléfono en la respuesta) y `attendeeLimits(invitation, lookupLimit)`
  (manda la **consulta** cuando difiere; `"n"` viaja tal cual); `src/utils/rsvp.js` añade
  `lookupPayload({ slug, code, phone })` (teléfono normalizado a dígitos), `attendeeOptions(limit)`
  (rango `0..cupo` con la opción 0; `null` con `"n"`/`Infinity` o con cupo 0) y
  `attendanceForm(invitation, previousResponse)` (precarga desde la respuesta —incluido `rejected`— o
  los valores por defecto de hoy; el teléfono **no** forma parte de la respuesta); las pruebas
  co-locadas (`invitation.test.js`, `rsvp.test.js`) cubren esos casos y `npm test` en verde.

  > **Superado por la revisión del formulario (RF-4, RF-11):** el rango `0..cupo` **con la opción 0**
  > de `attendeeOptions` que describe esta tarea queda **sustituido** por T11 (rango por campo:
  > adultos `1..cupo`, niños `0..cupo`) y la normalización del valor fuera de rango de T11; el
  > cuerpo del rechazo de `rsvpPayload` lo sustituye T12. La historia de T5 **no** se reescribe.

- [x] **T6 · Hook de la consulta por teléfono.** _RF: RF-5; M4, M10; RNF-2, RNF-4._
  Hecho cuando: `src/hooks/useGuestLookup.js` expone `{ status, errorCode, result, lookup(phone) }`
  con `status ∈ idle | looking | ok | error`, valida los diez dígitos **antes** de llamar, **ignora**
  una segunda consulta mientras hay una en curso, no llama sin configuración lista, usa el mismo
  `callService` de `services/registration.js`, traduce con `interpretLookup` y **no** persiste nada;
  `src/hooks/useGuestLookup.test.js` comprueba el primer pintado (con `renderToStaticMarkup`) y esas
  reglas; `npm test` en verde.

## Fase 3 — Presentación

- [x] **T7 · Piezas de interfaz reutilizables: combo y panel de lectura.** _RF: RF-4, RF-10; RNF-1, RNF-3._
  Hecho cuando: `src/components/ui/AttendeeSelect.jsx` pinta un `<select>` nativo con su `<label>` y
  el texto de ayuda del cupo enlazado por `aria-describedby`; `src/components/ui/ResponseSummary.jsx`
  pinta el panel de datos en **solo lectura** (lista etiqueta/valor, sin controles de formulario;
  nombre, asistentes, mensaje, restricciones, fecha y teléfono cuando existan); ambos con textos de
  interfaz en español y sin dependencias nuevas; `npm run build` sin errores (su aspecto y su uso se
  comprueban en T8 y en T10).

- [x] **T8 · Rehacer la sección de confirmación (`Rsvp.jsx`).** _RF: RF-1, RF-2, RF-3, RF-4, RF-5, RF-6, RF-7, RF-9, RF-10; D15; RNF-1, RNF-3._
  Hecho cuando: `Rsvp.jsx` deriva el bloque de `rsvpState` (los siete estados) y avanza con
  `nextBlockState`; conserva el ancla `#confirmar`, el `<h2>` del registro (`confirmacion.titulo`) y
  el `#numero` de los lugares reservados (que pasa al contenido revelado); en `sin-respondido`
  muestra **solo** el título y «Responder invitación» (con `aria-expanded` y panel asociado por
  `id`); en `telefono` (genérica/pública) solo el teléfono y «Continuar» deshabilitado hasta los diez
  dígitos; en `consultando` el teléfono y «Continuar» deshabilitados, sin formulario y con el aviso
  en la región viva; en `respondido` el agradecimiento + `ResponseSummary` (con el teléfono
  aportado) + «Editar»; en `editando` el formulario con el **orden** nombre → acompañante →
  asistencia → cupos (personalizada) y nombre → asistencia → adultos → alergias → mensaje con el
  teléfono visible y editable (genérica/pública), con el nombre del titular `readOnly`, el nombre
  registrado editable y los **combos** de RF-4 (o campo libre con `n`); en `cerrado` el aviso de
  plazo (con los datos en lectura si la personalizada tenía respuesta) y sin «Responder
  invitación»/«Editar»; en `degradado` el motivo, «Reintentar» cuando proceda y «Responder
  invitación» deshabilitado (un `INVALID_PHONE`/`MISSING_FIELDS` de la consulta vuelve a `telefono`
  con el aviso); el cupo del combo y de la validación previa sale de `attendeeLimits` y el foco y los
  anuncios (regiones vivas) funcionan; `npm test` en verde y `npm run build` sin errores.

## Fase 4 — Documentación y verificación

- [x] **T9 · Documentación y gobernanza.** _RF: §5.2 de la spec; I6._
  Hecho cuando: `docs/constitution.md` (principio 5) recoge que la app **lee y muestra** los datos de
  la fila identificada por teléfono en la genérica y la pública, con el **riesgo aceptado** de §1.4 y
  el teléfono como única barrera, y que **enviar** el teléfono no es **escribirlo**; `AGENTS.md`
  amplía su sección del servicio (acción `lookup`, riesgo aceptado, `utils`/`hooks`/`ui` nuevos y la
  lista de verificación manual) y sus inventarios; `MEMORY.md` queda al día y `PENDING_TASKS.md`
  depurado (sin marcar en ninguno la verificación manual de la 004); `npm test` en verde.

- [ ] **T10 · Verificación manual contra el despliegue vivo y anotación del veredicto.** _RF: §10 de la spec; RNF-5._
  Hecho cuando: con el Apps Script **redesplegado**, se recorren sin fallos los puntos de §12 del plan
  —(1) un envío real de cada tipo (`personal`, `generic`, `public`) y su fila; (2) personalizada con
  respuesta previa que arranca en `respondido` y «Editar» que la precarga; (3) genérica/pública con
  el paso del teléfono, consulta **con** fila (datos en lectura, nombre editable) y **sin** fila
  (formulario limpio); (4) cambio de teléfono que no re-consulta, avisa y guarda con el teléfono
  nuevo; (5) combos con rango completo y opción 0, cupo 0 y campo libre con `n`; (6) plazo vencido,
  degradación (incluido el `lookup` fallido, con reintento) y modo demo, más el doble clic sin efectos
  dobles; (7) privacidad y riesgo aceptado (al recargar se vuelve a pedir el teléfono, nada en
  `localStorage` ni en la URL, sin datos de otras filas y sin escrituras de `lookup` en `guests`)— y
  el veredicto queda anotado en «Verificación» de `AGENTS.md`. (La verificación manual de la 004
  sigue pendiente: no se marca aquí.)

## Fase 5 — Revisión del formulario (cambio de requisitos: RF-4, RF-11; D4, D17, D18; R8–R11)

Rehace una parte ya implementada de la spec 005 original (T5, T8): el rango del combo, el valor
fuera de rango, la composición del envío de un rechazo y la **exigencia de elegir asistencia** en la
validación previa (R11). **No** toca el contrato, `gas/Code.gs` ni
`CONTRACT_VERSION` (RF-8 intacto). La lógica pura va **antes** que la presentación (plan §10,
RNF-4). Cada tarea cierra con `npm test` en verde y `npm run build` sin errores.

- [x] **T11 · Rango del combo por campo y normalización del valor fuera de rango (pura, con pruebas).** _RF: RF-4; D4, R8, R10; DT-13._
  Tests primero: en `src/utils/rsvp.test.js` se **sustituyen** los casos que hoy afirman
  `attendeeOptions(...) === [0, 1, 4…]` y `attendeeOptions(0) === null` por los del rango por
  campo, y se añaden los de `attendeeValue`; luego se implementa hasta ponerlos en verde.
  Hecho cuando: `attendeeOptions(limit, field)` devuelve **adultos `1..limit`** (sin el 0) y
  **niños `0..limit`** (con el 0), `null` con cupo 0 y con un límite no numérico (`"n"`,
  `Infinity`, ilegible); `attendeeValue(value, options)` devuelve una opción válida tal cual y, si
  el valor no está entre las opciones (el 0 heredado o una cifra fuera del rango), la **opción
  menor** (`1` en adultos, `0` en niños); `attendanceForm(...).adults` queda en `"1"` cuando la
  respuesta previa traía 0 adultos **y el cupo de adultos es mayor que cero** (con cupo 0 no hay
  combo y solo cabe rechazar: la normalización no aplica, 004 D21); `npm test` en verde. (Esta tarea
  **sustituye** el rango `0..cupo` con la opción 0 de T5.)
  Archivos: `src/utils/rsvp.js`, `src/utils/rsvp.test.js`.

- [x] **T12 · Validación previa de la asistencia elegida y composición del envío de un rechazo (pura, con pruebas).** _RF: RF-9, RF-11; D18, R11; DT-14._
  Tests primero: en `src/utils/rsvp.test.js` se añaden (a) los casos de `validateRsvp` sin asistencia
  elegida —`response` vacío, ausente o con un valor que no sea `confirmed` ni `rejected`— con nombre
  y teléfono ya presentes (genérica/pública) y sin ellos (personalizada), esperando
  `INVALID_RESPONSE`; (b) el caso de que el orden de comprobaciones se conserva (sin nombre o
  teléfono sigue mandando `MISSING_FIELDS`/`INVALID_PHONE`, y un rechazo válido sigue pasando); y
  (c) el caso de `rsvpPayload` con `response: "rejected"`; luego se implementa.
  Hecho cuando: `validateRsvp(form, invitation)` **rechaza** con el código **existente**
  `INVALID_RESPONSE` cuando `form.response` **no** es `confirmed` ni `rejected`, **después** de la
  invitación y del nombre y el teléfono (004 RF-8/D26 intactas) y **antes** de la rama de rechazo y
  de los cupos (004 RF-9/D21 intacta; R11), y `rsvpPayload({...})` **omite** `adults`, `children`,
  `message` y `restrictions` cuando `response` es `rejected` (aunque el formulario los tuviera
  escritos) y los mantiene como hoy en cualquier otra respuesta; el contrato (`REQUEST_FIELDS`,
  `SERVICE_ERRORS`) **no** cambia (ningún código nuevo) y las pruebas existentes de `validateRsvp` y
  del cuerpo del envío siguen cubriendo sus casos; `npm test` en verde.
  (Esta tarea **sustituye** el comportamiento implícito del cuerpo del envío en T5 y **cierra R11**,
  el riesgo «enviar sin elegir asistencia» que la spec 005 original solo vigilaba.)
  Archivos: `src/utils/rsvp.js`, `src/utils/rsvp.test.js`.

- [x] **T13 · Visibilidad condicional de los cuatro campos de la asistencia (`Rsvp.jsx`).** _RF: RF-11; D17, R11; DT-14._
  Hecho cuando: en `editando`, los campos de **adultos, niños, alergias y mensaje** se pintan
  **solo** con «Sí, asistiré»; con «No podré asistir» o sin elegir **no existen** en el DOM (no
  se esconden por CSS ni quedan `disabled` de adorno), y el **nombre** y el **teléfono** se pintan
  y se exigen **siempre** (004 RF-8/D26 intactas); lo ya escrito **se conserva** al cambiar de
  opinión y reaparece al reelegir «Sí»; el aparecer/desaparecer se anuncia en la **región viva** y
  cada control lleva su `<label>`/`aria-describedby` **solo** mientras existe (RNF-1); los radios
  **siguen** siendo `required` como **ayuda de navegador**, pero la **garantía** de no enviar sin
  elegir asistencia es la **validación previa** de T12 (`validateRsvp` → `INVALID_RESPONSE`; R11:
  el `required` **no** es lo que lo impide, así que aquí **no** hay nada que vigilar por si se
  cuela); `npm run build`
  sin errores (su aspecto se comprueba en T14 y a mano en la pasada manual).
  Archivos: `src/components/sections/Rsvp.jsx`.

- [x] **T14 · Normalización al mostrarse, mínimo 1 del campo libre y resumen del rechazo (`Rsvp.jsx` + `ResponseSummary`).** _RF: RF-4, RF-9, RF-11; D4, D18, R10; DT-13, DT-15._
  Hecho cuando: al aparecer los campos con «Sí, asistiré», `form.adults` se **normaliza** con
  `attendeeValue` (un 0 heredado se ve y se envía como **1**, R10) y el `<select>` de adultos ya
  no ofrece el 0; el campo numérico libre de `n` lleva **`min={1}`** (R9) y conserva su etiqueta y
  ayuda; en `respondido` y en `cerrado` con respuesta previa, el panel **no** muestra adultos,
  niños, mensaje ni restricciones **cuando la respuesta es un rechazo** (se pasan esos campos como
  ausentes, no como `0`), y sí los muestra en una confirmación; `npm test` en verde y
  `npm run build` sin errores. (Esta tarea **sustituye** el recorte del valor en `optionValue` y
  la presentación del rechazo de T8.)
  Archivos: `src/components/sections/Rsvp.jsx`, `src/components/ui/ResponseSummary.jsx`.

- [x] **T15 · Documentación y gobernanza de la revisión.** _RF: §5.2 de la spec; RF-4, RF-11; D17, D18; I6._
  Hecho cuando: `AGENTS.md` refleja los ajustes del formulario (los cuatro campos de la asistencia
  solo con «Sí, asistiré», el 0 fuera del combo de adultos, el mínimo 1 de la pública y el rechazo
  que no envía asistentes ni textos) en sus inventarios y en la lista de verificación manual
  (punto 8 de §12 del plan); `MEMORY.md` queda al día con el estado de T11–T15; `PENDING_TASKS.md`
  se depura si algo deja de aplicar; **no** se toca el contrato, `gas/Code.gs` ni
  `CONTRACT_VERSION`; `npm test` en verde.
  Archivos: `AGENTS.md`, `MEMORY.md`, `PENDING_TASKS.md`.

**Pruebas automáticas de cierre de la revisión:** T11 y T12 con `node --test` sobre
`src/utils/rsvp.js` (rangos por campo, normalización, **asistencia elegida obligatoria** en
`validateRsvp` —R11— y cuerpo del rechazo). **Queda para la pasada
manual** (§12 punto 8 del plan): que los cuatro campos se pinten o no según la asistencia, que el
foco y las etiquetas no queden huérfanos, el `min` del campo libre en el navegador, el resumen del
rechazo en pantalla y la fila del libro con 0 asistentes y sin mensaje/restricciones.

## Puntos delicados a vigilar al repartir la implementación

- **Enviar sin elegir asistencia (RESUELTO, R11).** Ya **no** queda solo vigilado: la validación
  **pura** (`validateRsvp`) **rechaza** el envío cuando `form.response` no es `confirmed` ni
  `rejected`, con el código **existente** `INVALID_RESPONSE` (no se añade ninguno al contrato). Se
  implementa en **T12** (tests primero) y T13 solo conserva los radios `required` como **ayuda de
  navegador**: el `required` **no** es la garantía, así que no hay que vigilar «por si se cuela» un
  envío sin elección —la prueba pura lo fija—. El servicio, sin cambios, hacía de todos modos un
  rechazo silencioso (trata cualquier respuesta distinta de `confirmed` como `rejected`): esto solo
  evita que la app envíe a ciegas.
- **Lo que se ve y lo que se envía deben coincidir (R10, DT-13).** La normalización va en la lógica
  pura **y** al estado del formulario al mostrarse los campos; el componente **no** debe recortar por
  su cuenta (hoy lo hace `optionValue`). No dejar dos fuentes de verdad.
- **El resumen del rechazo (DT-15).** `ResponseSummary` pinta la fila si el valor **no** está vacío
  y un `0` **sí** se pinta: para el rechazo hay que pasar esos campos como **ausentes**, no como 0,
  o el panel mostrará «Adultos 0».
- **Conservar lo escrito (RF-11, D17).** Al ocultar/mostrar los campos, el estado del formulario no
  se debe reiniciar; solo el **0 de adultos** se normaliza a 1 (nunca un valor que el invitado haya
  elegido en el combo).
- **No tocar el contrato.** Ni `REQUEST_FIELDS`, ni `LOOKUP_FIELDS`, ni `SERVICE_ERRORS` (ningún
  código nuevo: la exigencia de elegir asistencia usa el **existente** `INVALID_RESPONSE`, R11), ni
  `CONTRACT_VERSION`, ni `gas/Code.gs`, ni `docs/servicio-invitados.md`: el rechazo que omite campos
  es **composición del envío** y el servicio ya escribe 0/vacío (verificado en `gas/Code.gs`). Si una
  tarea necesita tocar el contrato, se ha salido del alcance: **parar y preguntar**.

## Fase 6 — Cambio de requisitos: mensaje al rechazar, copy, saludo y consulta tolerante (RF-12…RF-15; D19, D20; R12, R13)

Traduce la **§13 de la spec** (y la **§17 del plan**). **No** toca el contrato (`CONTRACT_VERSION` sigue
`1.1.0`, `test/serviceContract.test.js` sin cambio de regla), ni el modelo del libro, ni los códigos de
error. La lógica pura va **antes** que sus consumidores (plan §10, RNF-4); el servicio, antes que su
documentación; la gobernanza, al final. Cada tarea cierra con `npm test` en verde y `npm run build` sin
errores.

**Orden de ejecución de la fase:** T16 → T17 → T18 → T19 → T20 → **T23 → T21 → T22**. **T23** (arreglo
de la precarga de «Editar» de un rechazo, DT-17) se ejecuta **antes** de la re-verificación manual
(**T21**) y de la gobernanza (**T22**, que documenta el estado final); por eso su número es posterior
pero su lugar en la secuencia está **entre T20 y T21**.

- [x] **T16 · Cuerpo del envío con mensaje en un rechazo y composición pura del panel (pura, con pruebas).** _RF: RF-13; D18 matizada (solo el mensaje); DT-13, DT-14._
  Tests primero: en `src/utils/rsvp.test.js` se añaden los casos de `rsvpPayload` y `responseSummaryData`
  del plan §17.5; luego se implementa hasta ponerlos en verde.
  Hecho cuando: `rsvpPayload({…, response: "rejected", message })` **incluye** el `message` en el cuerpo
  y **sigue omitiendo** `adults`, `children` y `restrictions` (un rechazo sin mensaje sigue siendo un
  rechazo válido sin `message`; con `confirmed` el cuerpo es como hoy); `src/utils/rsvp.js` exporta
  **`responseSummaryData(answer, personalized)`**, pura, que en un rechazo **conserva** el `message` y
  devuelve **ausentes** (`undefined`) `adultsAttendees`, `childAttendees` y `restrictions` —nunca `0`
  ni `""`—, en una confirmación los devuelve como hoy y sin `answer` devuelve `null`; sin React, sin
  DOM y sin reloj; el contrato **no** cambia (ningún campo ni código nuevo); `npm test` en verde.
  (Esta tarea **sustituye** el comportamiento del rechazo de `rsvpPayload` fijado en T12 y la
  composición del panel de `summaryData` de T14.)
  Archivos: `src/utils/rsvp.js`, `src/utils/rsvp.test.js`.

- [x] **T17 · El mensaje también con «No podré asistir» y la región viva del rechazo (`Rsvp.jsx`).** _RF: RF-13; D17/D18 matizadas (solo el mensaje); I2._
  Hecho cuando: con «No podré asistir», el campo del **mensaje** **existe** (opcional) y los campos de
  **adultos, niños y alergias** siguen **sin existir** en el DOM; sin elegir asistencia, el mensaje
  **tampoco** se pinta; el gating se parte (adultos/niños/alergias solo con «Sí, asistiré»; el mensaje
  con «Sí» **o** «No»), sin etiquetas huérfanas y conservando lo ya escrito al cambiar de opinión; el
  **aviso de la región viva** de un rechazo deja de decir «ni mensaje» y anuncia solo que no se muestran
  asistentes ni alergias (el mensaje **sí**), y el de «Sí, asistiré» no cambia; `npm run build` sin
  errores (su aspecto se comprueba a mano en T21).
  Archivos: `src/components/sections/Rsvp.jsx`.

- [x] **T18 · Copy del rechazo y saludo con el nombre (`Rsvp.jsx`), con el panel servido por la lógica pura.** _RF: RF-12, RF-14; D19, D20; R12._
  Hecho cuando: `Rsvp.jsx` compone el panel con **`responseSummaryData`** (importada de `utils/rsvp.js`)
  en lugar del `summaryData` local —que se retira—, de modo que un rechazo **muestra** su mensaje; el
  aviso de `respondido` y el del **envío aceptado** pintan la **copy del rechazo** («Lamentamos que no
  puedas acompañarnos. Gracias por tu respuesta.») cuando la respuesta es `rejected` y la copy de `OK`
  en cualquier otra, y esa copy vive **con el componente** (constante local), **no** en
  `src/constants/contract.js` y **sin** tocar `serviceNotice` ni el código `OK`; en la **personalizada**
  aparece el **saludo** «Hola, \<nombre completo\>» (texto visible, `invitation.guestName` tal cual),
  en `editando` como **primer** elemento del contenido revelado (saludo → nombre en solo lectura →
  «Hemos reservado … en tu honor» → resto) y en `respondido` **sobre** el `ResponseSummary`, **nunca**
  en la vista colapsada/`telefono`/`consultando`/`cerrado`/`degradado` ni en la genérica/pública;
  `ResponseSummary` **no** cambia de API; sin dependencias nuevas; `npm test` en verde y
  `npm run build` sin errores. (La precarga de «Editar» de un rechazo quedó **incompleta** aquí:
  `responseSummaryData` no devolvía `state` y `attendanceForm` caía a `confirmed`; lo **corrige T23**,
  que va **antes** de la re-verificación de T21.)
  Archivos: `src/components/sections/Rsvp.jsx` (y `src/components/ui/ResponseSummary.jsx` solo si su
  API lo exigiera, documentándolo).

- [x] **T19 · La consulta tolera las cabeceras que no necesita (Apps Script).** _RF: RF-15; R13; 004 RF-17 intacta._
  Hecho cuando: en `lookupResponse_` de `gas/Code.gs`, la comprobación de cabeceras exige **solo
  `phone`** (`firstMissingColumn_(headerMap, [GUEST_COLUMNS.PHONE])`); con `guest_name` o `status`
  ausentes la consulta **responde la fila** (nombre `null`, `response: null` si no hay estado) en vez de
  `INVALID_DATA`; sin `phone` **sigue** fallando con `INVALID_DATA`; el camino `personal`
  (`resolvePersonal_`), la **escritura** (`registerCodeResponse_`), `CONTRACT_VERSION` (`'1.1.0'`) y los
  códigos de error **no** cambian.
  Archivos: `gas/Code.gs`.

- [x] **T20 · Comprobación manual del servicio y documento del contrato.** _RF: RF-13, RF-15; R13; 004 RF-17/RF-18 intactas; nota de diagnóstico (caso real, sin RF nuevo)._
  > **Parte ampliada hecha (nota de diagnóstico).** `gas/README.md` añade el punto 8 («`INVALID_DATA` al resolver un código = dato del libro, no de la app»): la regla del tipo en `resolveCode_`, que una fila `PUBLIC` en una boda `generic` nunca resuelve y que el arreglo es **de datos** (borrar la fila), más la tabla para distinguirlo de `MISSING_FIELDS`/`UNKNOWN_GUEST`/cabecera ausente/caché ausente. La comprobación **contra el servicio vivo** la cierra T21.
  Hecho cuando: `gas/README.md` amplía la comprobación manual de `lookup` con los casos de la spec
  §13.3 —libro **sin `guest_name`/`status`** → no falla; **sin `phone`** → `INVALID_DATA`;
  `generic_json_cache` ausente → no es el fallo— y con el **aviso de redespliegue** (la tolerancia vive
  en el script: hasta desplegar una versión nueva, la consulta sigue exigiendo las tres cabeceras);
  **y añade la nota de diagnóstico del caso real**: «`INVALID_DATA` **al resolver un código** = dato del
  libro, **no** de la app», con (a) la regla del **tipo** de `resolveCode_` (`gas/Code.gs`, ~377-384):
  boda `generic` → `limit` **entero > 0**, boda `public` → `limit` exactamente **`"n"`**, cualquier otro
  valor → `INVALID_DATA`; (b) el aviso de que **una fila `PUBLIC` en la hoja `generic` de una boda
  `generic` nunca resuelve** (da `INVALID_DATA` con o sin teléfono, en `resolve` y en `lookup`) y que el
  arreglo es **de datos** (borrar esa fila), **no** de código ni de contrato; y (c) cómo **distinguirlo**
  de los otros fallos (sin teléfono → `MISSING_FIELDS`; código inexistente → `UNKNOWN_GUEST`; cabecera
  necesaria ausente → `INVALID_DATA` **después** de resolver; caché ausente → no es el fallo).
  `docs/servicio-invitados.md` aclara que la consulta tolera `guest_name`/`status` ausentes y que un
  **rechazo puede llevar mensaje**, **sin** recoger la copy (vive con el componente) y **sin** cambiar
  la línea de versión ni los códigos; `test/serviceContract.test.js` sigue verde **sin** cambio de
  regla; **no** se toca `gas/Code.gs` por esta nota (el código del servicio no cambia); `npm test` en
  verde.
  Archivos: `gas/README.md`, `docs/servicio-invitados.md`.

- [x] **T23 · La precarga de «Editar» conserva el estado del rechazo (pura, con pruebas).** _RF: RF-13, RF-2; D17/D18 matizadas; DT-17. Corrige la brecha que dejó T18._
  Tests primero: en `src/utils/rsvp.test.js` se añade el caso que hoy **falta** —`attendanceForm`
  alimentado con la salida de `responseSummaryData` de un rechazo → `rejected`— y el de que la salida
  de `responseSummaryData` **conserva `state`** en los demás casos; luego se implementa hasta ponerlos
  en verde.
  Hecho cuando: `responseSummaryData(answer, personalized)` devuelve **`state: answer.state`** además de
  los campos visibles (el resto de la composición del rechazo no cambia: mensaje conservado; adultos,
  niños y restricciones ausentes), de modo que `attendanceForm(invitation, responseSummaryData(answer,
  personalized))` con una respuesta **rechazada** arranca en **`rejected`** (no en `confirmed`) y con
  una confirmación/actualización sigue arrancando en `confirmed`; `ResponseSummary` **no** cambia de
  API y **no** pinta el estado (su lista de props es cerrada: `state` se queda sin consumir en el
  panel); `handleEdit` sigue usando `answeredData` (**una sola fuente** para el panel y la precarga; no
  se parchea la llamada del componente); el contrato **no** cambia; `npm test` en verde y
  `npm run build` sin errores.
  (Esta tarea **corrige** la parte de T18 que dejó incompleta la precarga de un rechazo y se ejecuta
  **antes** de la re-verificación manual de T21 y de la gobernanza de T22.)
  Archivos: `src/utils/rsvp.js`, `src/utils/rsvp.test.js` (y `src/components/sections/Rsvp.jsx` solo si
  hiciera falta ajustar el consumo de `answeredData`, documentándolo).

- [ ] **T21 · Verificación manual del cambio, sobre el despliegue vivo.** _RF: §10 de la spec; RF-12…RF-15; RNF-5._
  Hecho cuando: con el Apps Script del cambio **redesplegado**, se recorren sin fallos los puntos
  **8–11** del §12 del plan —(8) copy del rechazo en `respondido` y en el envío aceptado, con una
  confirmación que sigue con la copy `OK`; (9) mensaje en un rechazo que se escribe, viaja, se ve en el
  panel (y en `cerrado` con respuesta previa), se precarga al «Editar», con la región viva sin «ni
  mensaje» y la fila con 0 asistentes y sin restricciones; **[T23]** «Editar» sobre un **rechazo**
  arranca en «No podré asistir» (con el mensaje precargado y sin adultos/niños/alergias) y el panel
  **no** muestra el estado; (10) saludo «Hola, \<nombre completo\>» en
  `editando` (orden saludo → nombre → lugares reservados) y **sobre** el panel en `respondido`, ausente
  antes de pulsar y en la genérica/pública; (11) consulta de una boda sin `guest_name`/`status` que deja
  de dar `INVALID_DATA`, sin `phone` que sí falla y caché ausente que no es el fallo)— más una vuelta
  rápida por los puntos **1–7** que el cambio puede rozar; el veredicto queda anotado en «Verificación»
  de `AGENTS.md`. (La verificación manual de la 004 sigue pendiente: no se marca aquí.)
  **[§17.6 punto 12]** En las pruebas de la genérica/pública se usa un **código genérico real** de la
  hoja `generic` (p. ej. `4236_GEN`), **no** `PUBLIC`: si la hoja conserva una fila `PUBLIC` con
  `limit = "n"` en una boda `generic`, ese código da `INVALID_DATA` al **resolver** (no es un fallo de la
  app ni del `lookup`; el arreglo es **de datos**, borrar esa fila). Se comprueba además la distinción
  del diagnóstico: con el código real, sin teléfono → `MISSING_FIELDS`; código inexistente →
  `UNKNOWN_GUEST`.

- [x] **T22 · Gobernanza del cambio.** _RF: §5.2/§13 de la spec; RF-12…RF-15._
  Hecho cuando: `AGENTS.md` refleja el cambio en sus inventarios y en la lista de verificación manual
  (el mensaje del rechazo que se escribe y **se lee**, la copy del rechazo en el componente, el saludo
  de la personalizada y la consulta tolerante con su redespliegue); `MEMORY.md` queda al día con el
  estado de T16–T23; `PENDING_TASKS.md` se depura si algo deja de aplicar; **no** se toca el contrato,
  `gas/Code.gs` (salvo lo de T19) ni `CONTRACT_VERSION`; `npm test` en verde.
  **[Nota de diagnóstico — T20]** `AGENTS.md` recoge que un `INVALID_DATA` **al resolver un código** es
  un dato del libro (regla del **tipo** en `resolveCode_`: `generic` → entero > 0, `public` → `"n"`; una
  fila `PUBLIC` en una boda `generic` nunca resuelve → arreglo **de datos**, no de código) y **no** un
  defecto de la app ni del `lookup` (detalle en `gas/README.md`); no hay contrato ni RF nuevos.
  Archivos: `AGENTS.md`, `MEMORY.md`, `PENDING_TASKS.md`.

**Pruebas automáticas de cierre del cambio:** T16 y **T23** con `node --test` sobre `src/utils/rsvp.js`
(el mensaje en el cuerpo del rechazo, la composición del panel y —T23— la precarga de «Editar» de un
rechazo, alimentando `attendanceForm` con la salida de `responseSummaryData`). **Queda para la pasada
manual** (T21, §12 puntos 8–11 del plan): la copy del rechazo, el mensaje en el panel, la precarga de
«Editar» de un rechazo, el saludo con el nombre, el gating de los campos y la **tolerancia de cabeceras
del servicio** (Apps Script en ejecución: no hay runner). `test/serviceContract.test.js` **no** cambia de
regla (§13.4 de la spec): la copy no es literal del módulo.

## Fase 7 — Segundo cambio de requisitos: código mal formado con error propio y `PUBLIC` sin tope en genérica (RF-16, RF-17; D21, D22; R14, R15)

Traduce la **§14 de la spec** (y la **§18 del plan**). **Sí** cambia la **forma** del contrato: sube
`CONTRACT_VERSION` de `1.1.0` a **`1.2.0`** **a la vez en `src/constants/contract.js` y en
`gas/Code.gs`, en la misma tarea (T24)**, y `docs/servicio-invitados.md` deriva el código nuevo (la
**regla** de `test/serviceContract.test.js` **no** cambia: su guardarraíl de «misma versión en módulo y
script» se mantiene intacto y **nunca** se pone en rojo). Cambia el **reparto** de `INVALID_DATA` (deja
de incluir el código mal formado) y la **regla del tipo** en el servicio (RF-17). Además **obliga a la
app**: `codeLimit` hoy ata `"n"` a `public`, así que sin tocarlo
`interpretInvitation`/`interpretLookup` **descartarían** una invitación genérica sin tope (plan §18.4,
DT-20). La lógica pura y el contrato van **antes** que sus consumidores (plan §10, RNF-4); el servicio,
antes que su documentación; la gobernanza, al final. Cada tarea cierra con `npm test` en verde y
`npm run build` sin errores.

**Orden de ejecución de la fase:** T24 → T25 → T26 → T27 → T28 → T29. El **contrato** (T24) va
**primero** porque define el literal y la versión (en módulo **y** script, a la vez, para no dejar el
guardarraíl en rojo) que el resto consume; la **lógica pura de la app** (T25) va antes del **servicio**
(T26, solo la regla del tipo) para que la lectura ya acepte lo que el servicio devolverá; la
**documentación** (T27) va después del servicio; la **verificación manual** (T28) y la **gobernanza**
(T29) cierran.

- [x] **T24 · `MALFORMED_GUEST` en el módulo del contrato, subida de `CONTRACT_VERSION` a `1.2.0` **a la vez** en módulo y script, y documento derivado.** _RF: RF-16; D21, R14; DT-18; 004 RF-17/RF-18._
  > **Corrección de reparto (detectada al implementar).** El plan original subía la versión en T24 (módulo) y T26 (script), pero `test/serviceContract.test.js` exige que `src/constants/contract.js` y `gas/Code.gs` declaren **la misma** `CONTRACT_VERSION`: entre T24 y T26 el guardarraíl quedaba en **rojo** y T24 no podía cerrar con `npm test` verde. Decisión cerrada: la versión sube **en la misma tarea**, en los **dos lados a la vez**; **no** se toca el guardarraíl (`test/serviceContract.test.js` conserva su regla intacta).
  Hecho cuando: `src/constants/contract.js` añade a `SERVICE_ERRORS` la entrada
  `{ code: "MALFORMED_GUEST", message: "El código de esta invitación no es válido.", retryable: true }`
  (mensaje en español; `code` en inglés por excepción) y su `CONTRACT_VERSION` pasa a **`"1.2.0"`**; y
  **`gas/Code.gs` sube su `CONTRACT_VERSION` a `'1.2.0'` en la misma tarea** (con su comentario de
  versión), de modo que el guardarraíl de `test/serviceContract.test.js` (misma versión en módulo y
  script, leída como texto) queda **verde sin relajarse ni tocarse**; `docs/servicio-invitados.md`
  reproduce el **código nuevo** con su causa y su mensaje (tabla de 004 §4.1 ampliada), **matiza** la
  causa de `INVALID_DATA` (ya **no** incluye el código mal formado) y actualiza su línea de versión a
  `1.2.0`; ni un tipo, ni un estado, ni un campo, ni una columna cambian y ninguna entrada de la tabla
  se retira ni se renombra; **no** se toca todavía la **regla del tipo** de `resolveCode_` (eso es T26);
  `test/serviceContract.test.js` sigue en verde **sin tocar su regla** y **falla** de verdad si el
  documento omite el código o cambia su mensaje; `npm test` en verde.
  Archivos: `src/constants/contract.js`, `gas/Code.gs`, `docs/servicio-invitados.md`.

- [x] **T25 · La lectura de la app acepta una invitación genérica sin tope (pura, con pruebas).** _RF: RF-17; D22, R15; DT-20; 004 RF-9/D12 matizadas._
  Tests primero: en `src/utils/invitation.test.js` se **sustituyen** los casos que hoy afirman
  `INVALID_DATA` con `"n"` en la genérica por los del nuevo comportamiento y se añaden los que faltan;
  luego se implementa hasta ponerlos en verde.
  Hecho cuando: `codeLimit(type, value)` (`src/utils/invitation.js`) acepta `"n"` con `type ===
  generic` **además** de con `public`, de modo que `interpretInvitation` **e** `interpretLookup`
  aceptan `{ type: "generic", limit: "n" }` sin descartar la invitación (`guestLimit: Infinity`,
  `seatsText` «sin tope»), mientras que un genérico con `limit` **no** entero > 0 (`"x"`, `0`, `-1`,
  vacío) **sigue** dando `INVALID_DATA` en la app (el código `MALFORMED_GUEST` lo emite el **servicio**;
  la app solo lee); `guestLimit`, `seatsText`, `attendeeLimits`, `isWithinGuestLimit` y `validateRsvp`
  se comportan como «sin tope» con ese modelo y sus pruebas lo fijan (incluido un caso en
  `rsvp.test.js` que confirma que confirmar con esa invitación **pasa** el cupo); **no** se toca ningún
  otro punto de la lectura; `npm test` en verde.
  Archivos: `src/utils/invitation.js`, `src/utils/invitation.test.js` (y `src/utils/rsvp.test.js` solo
  si hace falta fijar el cupo sin tope).

- [x] **T26 · La regla del tipo en el servicio: `MALFORMED_GUEST` y `PUBLIC` con `"n"` en genérica (Apps Script).** _RF: RF-16, RF-17; D21, D22; DT-19; 004 RF-9/RF-13 matizadas._
  Hecho cuando: `gas/Code.gs` añade `ERROR_CODES.MALFORMED_GUEST = 'MALFORMED_GUEST'` y en
  **`resolveCode_`** reparte así: el código que **no** está en su hoja sigue `UNKNOWN_GUEST`; el que
  **está** con un `limit` que no cumple la regla de su tipo devuelve **`MALFORMED_GUEST`** (antes
  `INVALID_DATA`); la boda **`generic`** acepta el código reservado **`PUBLIC`** **solo** con
  `limit = "n"` → **sin tope** (`limit = "n"`) y con cualquier otro `limit` da `MALFORMED_GUEST`; un
  genérico corriente exige **entero > 0**; el camino `personal` (`resolvePersonal_`), la lectura
  (`lookupResponse_`) y la escritura (`registerCodeResponse_`) **no** cambian y ningún otro código de
  error se retira ni se renombra. **La versión ya la subió T24**: esta tarea **no** vuelve a tocar
  `CONTRACT_VERSION` (queda `'1.2.0'`, ya igual en módulo y script).
  Archivos: `gas/Code.gs`.

- [ ] **T27 · Documento derivado del reparto nuevo y nota de diagnóstico del Apps Script.** _RF: RF-16, RF-17; RNF-5; 004 RF-17/RF-18._
  Hecho cuando: `docs/servicio-invitados.md` aclara en la prosa de `resolve`/`lookup` que el código
  **existente** con `limit` mal formado responde **`MALFORMED_GUEST`** (no `INVALID_DATA`), que
  `UNKNOWN_GUEST` sigue siendo «el código no está en su hoja» y que **`PUBLIC` con `"n"` vale por sin
  tope también en una boda `generic`** (sin cambiar el `type` ni la forma de las respuestas correctas);
  `gas/README.md` **deja de** decir que un `PUBLIC` en una boda `generic` «nunca resuelve» y describe el
  **reparto nuevo** (punto 8: `PUBLIC` con `"n"` → sin tope; otro `limit` que no cuadre con su regla →
  `MALFORMED_GUEST`), **añade** `MALFORMED_GUEST` a su **tabla de distinción de fallos** (sin teléfono
  → `MISSING_FIELDS`; código inexistente → `UNKNOWN_GUEST`; código existente mal formado →
  `MALFORMED_GUEST`; libro/hoja/cabecera real → `INVALID_DATA`) y el **aviso de redespliegue** (el
  cambio vive en el script); `test/serviceContract.test.js` sigue verde **sin** cambio de regla;
  `npm test` en verde.
  Archivos: `docs/servicio-invitados.md`, `gas/README.md`.

- [ ] **T28 · Verificación manual del cambio, sobre el despliegue vivo.** _RF: §14 de la spec; RF-16, RF-17; RNF-5._
  Hecho cuando: con el Apps Script del cambio **redesplegado**, se recorren sin fallos los puntos
  **13–14** de §18.6 del plan —(13) un código con `limit` inválido (`"x"`, `0` o vacío) responde
  `MALFORMED_GUEST` (no `INVALID_DATA`) en `resolve` y en `lookup`, con el aviso propio en la app y su
  reintento, mientras un código inexistente sigue siendo `UNKNOWN_GUEST` y un libro sin `phone` sigue
  siendo `INVALID_DATA`; (14) una fila `PUBLIC` con `limit = "n"` en una boda **`generic`** resuelve en
  `resolve` y `lookup` con `type: "generic"`/`limit: "n"`, la app **no** descarta la invitación,
  anuncia **sin tope**, ofrece el campo libre sin máximo y el envío con `PUBLIC` **no** da `OVER_LIMIT`
  por cupo; un `PUBLIC` con un `limit` distinto de `"n"` da `MALFORMED_GUEST`; los códigos corrientes
  `…_GEN` siguen con su `limit` numérico y su combo)— más una vuelta rápida por los puntos **1–12** que
  el cambio puede rozar (en particular, el punto **12** de §17.6 deja de aplicar: ya se puede probar con
  `PUBLIC`); el veredicto queda anotado en «Verificación» de `AGENTS.md`. (La verificación manual de la
  004 y la de §13 siguen pendientes: no se marcan aquí.)

- [ ] **T29 · Gobernanza del cambio.** _RF: §5.2/§14 de la spec; RF-16, RF-17; D21, D22; I6._
  Hecho cuando: `AGENTS.md` refleja el cambio en sus inventarios y en la lista de verificación manual
  (el código de error nuevo `MALFORMED_GUEST`, el reparto de `INVALID_DATA` que ya **no** incluye el
  código mal formado, `PUBLIC` con `"n"` aceptado como sin tope en una boda genérica, la versión
  `1.2.0` y la nota de `gas/README.md`), y **actualiza** la nota de diagnóstico que decía que `PUBLIC`
  en `generic` nunca resuelve; `MEMORY.md` queda al día con el estado de T24–T29;
  `PENDING_TASKS.md` se depura si algo deja de aplicar; **no** se toca ningún otro contrato ni el modelo
  del libro; `npm test` en verde.
  Archivos: `AGENTS.md`, `MEMORY.md`, `PENDING_TASKS.md`.

**Pruebas automáticas de cierre del cambio:** T24 (contrato: código `MALFORMED_GUEST` y versión
`1.2.0` **en módulo y script a la vez**) y T25 (lectura de la app) con `node --test` sobre
`src/constants/contract.js` y `src/utils/invitation.js` (`interpretInvitation`/`interpretLookup` aceptan
`{generic, "n"}` y siguen rechazando un genérico con `limit` no entero > 0), más
`test/serviceContract.test.js` **sin** cambio de regla (su guardarraíl de «misma versión en módulo y
script» queda **verde** al subir ambos en T24). **Queda para la pasada manual** (T28, §18.6 puntos
13–14 del plan): el reparto del servicio en ejecución (`MALFORMED_GUEST` vs `INVALID_DATA` vs
`UNKNOWN_GUEST`), la invitación genérica sin tope de punta a punta y el **redespliegue** del Apps Script
(no hay runner). `test/contracts.test.js` **no** cambia: nada publicado se renombra.
