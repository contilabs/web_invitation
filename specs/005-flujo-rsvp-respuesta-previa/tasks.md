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

- [ ] **T15 · Documentación y gobernanza de la revisión.** _RF: §5.2 de la spec; RF-4, RF-11; D17, D18; I6._
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
