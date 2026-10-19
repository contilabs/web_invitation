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

- [ ] **T4 · Máquina de estados del bloque (pura, con sus pruebas).** _RF: RF-1, RF-7; D1, D2; B2, I1._
  Hecho cuando: `src/utils/rsvpState.js` exporta `BLOCK_STATES` (los siete estados con
  identificadores en inglés: `NOT_ANSWERED`, `PHONE`, `LOOKING_UP`, `ANSWERED`, `EDITING`, `CLOSED`,
  `DEGRADED`), `BLOCK_EVENTS`, `initialBlockState({ status, invitation, open })` (regla única:
  `degradado` > `cerrado` > `respondido` —personalizada con respuesta previa— > `sin-respondido`) y
  `nextBlockState(state, event, { personalized })` con la tabla de transiciones de RF-1 y `null`
  para los acontecimientos que no aplican; sin React, sin DOM y sin reloj; `src/utils/rsvpState.test.js`
  cubre los siete estados, cada arranque y cada transición (incluido el doble clic); `npm test` en
  verde.

- [ ] **T5 · Lógica pura de la consulta y de la respuesta (interpretación, cuerpo, combos y precarga).** _RF: RF-2, RF-4, RF-5, RF-8, RF-10; M2, M4; R1._
  Hecho cuando: `src/utils/invitation.js` añade `interpretLookup(result)` (fila con respuesta → el
  modelo **más `name`**; sin fila o fila sin respuesta → `null`; `type` personal o respuesta fuera de
  contrato → `INVALID_DATA`; sin teléfono en la respuesta) y `attendeeLimits(invitation, lookupLimit)`
  (manda la **consulta** cuando difiere; `"n"` viaja tal cual); `src/utils/rsvp.js` añade
  `lookupPayload({ slug, code, phone })` (teléfono normalizado a dígitos), `attendeeOptions(limit)`
  (rango `0..cupo` con la opción 0; `null` con `"n"`/`Infinity` o con cupo 0) y
  `attendanceForm(invitation, previousResponse)` (precarga desde la respuesta —incluido `rejected`— o
  los valores por defecto de hoy; el teléfono **no** forma parte de la respuesta); las pruebas
  co-locadas (`invitation.test.js`, `rsvp.test.js`) cubren esos casos y `npm test` en verde.

- [ ] **T6 · Hook de la consulta por teléfono.** _RF: RF-5; M4, M10; RNF-2, RNF-4._
  Hecho cuando: `src/hooks/useGuestLookup.js` expone `{ status, errorCode, result, lookup(phone) }`
  con `status ∈ idle | looking | ok | error`, valida los diez dígitos **antes** de llamar, **ignora**
  una segunda consulta mientras hay una en curso, no llama sin configuración lista, usa el mismo
  `callService` de `services/registration.js`, traduce con `interpretLookup` y **no** persiste nada;
  `src/hooks/useGuestLookup.test.js` comprueba el primer pintado (con `renderToStaticMarkup`) y esas
  reglas; `npm test` en verde.

## Fase 3 — Presentación

- [ ] **T7 · Piezas de interfaz reutilizables: combo y panel de lectura.** _RF: RF-4, RF-10; RNF-1, RNF-3._
  Hecho cuando: `src/components/ui/AttendeeSelect.jsx` pinta un `<select>` nativo con su `<label>` y
  el texto de ayuda del cupo enlazado por `aria-describedby`; `src/components/ui/ResponseSummary.jsx`
  pinta el panel de datos en **solo lectura** (lista etiqueta/valor, sin controles de formulario;
  nombre, asistentes, mensaje, restricciones, fecha y teléfono cuando existan); ambos con textos de
  interfaz en español y sin dependencias nuevas; `npm run build` sin errores (su aspecto y su uso se
  comprueban en T8 y en T10).

- [ ] **T8 · Rehacer la sección de confirmación (`Rsvp.jsx`).** _RF: RF-1, RF-2, RF-3, RF-4, RF-5, RF-6, RF-7, RF-9, RF-10; D15; RNF-1, RNF-3._
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

- [ ] **T9 · Documentación y gobernanza.** _RF: §5.2 de la spec; I6._
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
