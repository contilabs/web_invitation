# Especificación — Flujo del RSVP: respuesta previa, estados del bloque y selección de asistentes

**Estado:** borrador corregido tras QA, pendiente de aprobación de quien la pide.

## 1. Contexto y objetivo

La spec **004** («Servicio de invitados y confirmación») está **implementada y verificada contra el
servicio vivo**: el Apps Script resuelve los tres tipos de invitación (`personal`, `generic`,
`public`), el envío deduplica por teléfono, el plazo lo da el maestro, el contrato vive en módulo +
documento (`src/constants/contract.js` y `docs/servicio-invitados.md`) con su prueba de sincronía, y
el `viewed` se escribe al abrir la personalizada sin respuesta. La verificación manual de esa spec
confirmó que el servicio funciona; al recorrer el flujo completo, sin embargo, aparecieron
**comportamientos incorrectos del flujo RSVP** en la interfaz y una limitación del contrato.

**Objetivo de esta spec:** corregir esos comportamientos y esa limitación, **partiendo del estado real
de la 004** (no de un árbol ni de un modelo imaginarios): (1) **usar** la respuesta previa que el
servicio ya devuelve, para mostrarla y poder editarla; (2) reordenar el formulario (nombre antes que
acompañante y asistencia); (3) limpiar visualmente el bloque (los datos del invitado **ocultos** tras
un botón «Responder invitación»; tras contestar, **solo** agradecimiento, datos en lectura y botón
«Editar»); (4) volver **explícito** el cupo con **combo box** en lugar de números libres; y (5) que
en la **genérica** y la **pública** el invitado escriba su **teléfono**, pulse un botón
**«Continuar»** y el sistema **consulte** si ya existe una respuesta para reconocer a quien vuelve.
Lo primero a cuatro es **presentación y estado** sobre el bloque de confirmación; lo quinto exige
**una acción nueva en el contrato del servicio** (hoy la 004 dictamina que en esos tipos «no puede
devolver una respuesta previa», porque no conoce el teléfono).

**Por qué:** el invitado que ya contestó no tiene forma de ver ni corregir su respuesta sin adivinar;
el formulario (y sus datos) se muestran antes de tiempo y en un orden que confunde; los números
libres dejan elegir cualquier valor y ocultan el cupo; y un invitado genérico o público que vuelve a
abrir su enlace empieza siempre desde cero aunque su respuesta siga en el libro.

### 1.1 Punto de partida (estado real de la spec 004)

- La app resuelve la invitación contra el servicio al abrir (`resolve`): en la **personalizada** el
  servicio **ya devuelve la respuesta previa** (004 RF-6) y la app ya la interpreta en su modelo
  (`previousResponse`); lo que **no** hace es **usarla**: el formulario se pinta siempre editable y
  sin precargar la respuesta anterior. Este requisito **no** pide tocar el servicio de la 004, solo
  usar lo que llega.
- En la **genérica** y la **pública**, el servicio solo puede devolver el código y su límite (004
  RF-6): no hay forma de saber si el teléfono que aún no se ha escrito corresponde a una respuesta
  existente. Aquí sí hace falta **extender el contrato** (RF-5, RF-8).
- El bloque de confirmación pinta hoy cinco estados (demo/degradación, carga, degradación con
  reintento, plazo cerrado, formulario) y muestra el cupo («Hemos reservado … en tu honor»), el
  acompañante y el formulario **en cuanto** la invitación está lista; conserva esa base y **añade**
  los estados de interacción de esta spec (RF-1).
- El plazo (004 RF-11), los cuatro estados del libro (004 RF-10), la llave por teléfono (004 RF-8),
  la caché de códigos (004 RF-18), la configuración del despliegue (004 RF-15) y la tabla de códigos
  de error (004 §4.1) **no cambian**: esta spec los da por buenos.
- El campo del titular de la personalizada ya se pinta hoy con `readOnly` (no editable) y los
  controles de asistentes son números libres con `min`/`max`; la validación previa
  (`src/utils/rsvp.js`) ya impide confirmar sin ningún asistente (`OVER_LIMIT`) y exige el teléfono de
  diez dígitos.

### 1.2 Vocabulario nuevo (además del de la spec 004)

- «**bloque de confirmación**»: la sección de confirmación de la invitación (ancla `#confirmar`), tal
  como la describe la 004.
- «**estado del bloque**»: el modo de presentación del bloque en una sesión de página (RF-1). Se
  **nombra en español** porque es un concepto de interfaz (constitución, principio 6: los textos
  visibles y la documentación van en español); en el **código**, los identificadores van en inglés
  (M5). No se confunde con los **estados de la respuesta** del libro (`viewed`, `confirmed`,
  `updated`, `rejected`; 004 RF-10), que no cambian.
- «**paso del teléfono**»: el paso de la genérica y la pública que pide el teléfono y lo confirma con
  el botón «Continuar» (RF-5).
- «**consulta por teléfono**» (acción **`lookup`**): la llamada nueva al servicio que, con `slug` +
  código + teléfono, devuelve la respuesta previa de **esa** fila, o su ausencia (RF-5, RF-8).
- «**fila**»/«**fila completa**»: la fila de la hoja `guests` de esa boda identificada por el
  teléfono consultado, con sus datos registrados (RF-6).
- «**datos en solo lectura**»: los datos de la respuesta mostrados sin controles editables (texto y
  valores visibles, ningún input de formulario).

### 1.3 Los cinco pedidos, punto por punto

| # | Petición (texto de quien la pide, resumido) | Requisitos |
| --- | --- | --- |
| 1 | «Al abrirse la página se debe buscar si el invitado ya contestó previamente (personalizadas); si ya respondió, los datos desplegados y bloqueados, con un botón **editar**.» | RF-1, RF-2, RF-10 |
| 2 | «El nombre del invitado debería aparecer **antes** que el del acompañante y los inputs de asistencia.» | RF-3 |
| 3 | «Los datos del invitado **escondidos** tras un botón **"Responder invitación"**; al contestar, **solo** el agradecimiento y el botón para editar.» | RF-1, RF-3, RF-9 |
| 4 | «Los inputs de números de invitados deberían ser **combo box** para que sea explícito el límite de boletos.» | RF-4 |
| 5 | «En genéricas y públicas, primero el **teléfono** tras el botón de responder; luego buscar si ya existe una respuesta asignada a ese teléfono para permitir editar.» | RF-5, RF-6, RF-7, RF-8 |

### 1.4 Riesgo aceptado: la consulta por teléfono devuelve la fila completa

La acción `lookup` devuelve, cuando hay fila, **la fila completa** de esa respuesta: nombre
registrado, asistentes, mensaje y restricciones. En la invitación **genérica y la pública el enlace
se comparte** (es la misma URL para todo el que la recibe) y el teléfono es la **única barrera** que
separa a un invitado de la respuesta de otro: quien tenga el enlace y un teléfono puede **ver** esa
respuesta.

Quien pide la spec **acepta ese riesgo de forma explícita** (no «el mismo que la 004»: la 004 lo
asumía al **escribir**; esto es **lectura** de datos de otra persona) a cambio de reconocer al
invitado que vuelve y dejarle corregir lo que ya contestó. No hay segunda verificación del teléfono
(fuera de alcance, §9) y nada se **escribe** sin un envío explícito: leer no cambia el libro.

Este riesgo aceptado debe quedar escrito también fuera de esta spec, como parte del alcance del
cambio (§5.2): `docs/constitution.md` (principio 5, privacidad) y `AGENTS.md`.

## 2. Decisiones de alcance (fijadas con quien pide la spec)

- **D1 — Siete estados del bloque (capa de presentación nueva).** Cinco de **interacción** —
  `sin-respondido`, `telefono`, `consultando`, `respondido` y `editando`— más dos que quedan **fuera**
  de la interacción normal —`cerrado` (plazo vencido) y `degradado` (fallo, sin configuración o modo
  demo)— (RF-1). Los estados
  son un concepto **de interfaz**: «respondido» **no** es un estado del libro y los cuatro de 004
  RF-10 siguen intactos (D10). Los nombres de la tabla de estados se escriben en español por ser
  concepto de interfaz; los identificadores del código van en inglés (M5, constitución principio 6).
- **D2 — Arranque con una sola regla.** Al resolver la invitación, el bloque arranca en
  **`degradado`** si la resolución falla o no hay configuración (incluido el modo demo), en
  **`cerrado`** si el plazo ya venció, en **`respondido`** si es una **personalizada que ya conoce su
  respuesta previa**, y en **`sin-respondido`** en cualquier otro caso. No hay ninguna otra regla de
  arranque (resuelve la contradicción entre «arranca cerrado» y «abre con la respuesta previa»).
- **D3 — Orden: nombre → acompañante → asistencia.** El nombre del invitado se muestra antes que el
  acompañante y antes que los controles de asistencia (punto 2). En la genérica y la pública el
  **paso del teléfono** (punto 5) es anterior al formulario completo, sin contradecir el orden
  interno del formulario (RF-3).
- **D4 — Combo box nativo cuando el cupo es numérico; campo libre cuando es `n`.** Los campos de
  número de asistentes pasan de número libre a **lista desplegable** con las opciones enteras de 0
  al cupo que corresponda, **siempre que ese cupo sea numérico** (decisión R1). Con **cupo cero** el
  combo **no** se muestra (no hay opciones) y se conserva que solo cabe **rechazar** (004 RF-9/D21
  intactos). Con límite **`n`** (pública, sin tope) se conserva el **campo numérico libre** con la
  validación existente: la app **no** declara ningún máximo artificial y la 004 RF-9/D12 quedan
  **íntegras** (`n` sigue significando sin tope). El combo ofrece el rango completo, incluido el
  **0**: elegir 0 con «confirmar» es una combinación que la validación previa y el servicio siguen
  rechazando (M1, RF-4).
- **D5 — Acción nueva `lookup` en el contrato.** El contrato gana la acción **`lookup`** (slug +
  código + teléfono) con la forma **literal** de RF-8: devuelve el modelo ya resuelto (tipo, límite y
  plazo) más la **respuesta previa de esa fila** —con su **nombre registrado** dentro de `response`—
  o `response: null` si no hay fila (o si la fila no tiene respuesta). Los **tres artefactos del
  contrato** —el módulo (`src/constants/contract.js`, con su `CONTRACT_VERSION` subido), el
  documento (`docs/servicio-invitados.md`) y el script del servicio (`gas/Code.gs`, con la **misma**
  `CONTRACT_VERSION`)— se actualizan **a la vez** y el servicio se **redespliega** (RF-8; el reparto
  de tareas va en el plan).
- **D6 — El paso previo pide solo el teléfono y lo confirma un botón «Continuar».** El nombre y el
  teléfono siguen siendo obligatorios en el envío, **también al rechazar** (004 RF-8 y D26 intactos;
  decisión R2). El paso previo (punto 5) pide **solo el teléfono** y la consulta **no** se dispara
  sola al décimo dígito: la dispara el botón **«Continuar»** (decisión R5). El teléfono queda
  **visible y editable** en el formulario: si el invitado lo cambia, manda la regla de la 004 (la
  respuesta se asocia al teléfono nuevo, fila nueva o ajena) y la app **no** vuelve a consultar sola
  (RF-5, M8).
- **D7 — La consulta es de una fila y no deja rastro.** `lookup` devuelve **solo** la fila del
  teléfono pedido (completa: §1.4) y **nunca** datos de **otras** filas; el teléfono **no** viaja en
  la respuesta (la app ya lo tiene en la página), aunque **sí se envía** en el cuerpo de la consulta
  (I8). Nada se persiste en el navegador: el teléfono vive solo en memoria mientras la página siga
  abierta (004 RNF-2 intacto).
- **D8 — Plazo vencido: lectura, sin editar.** Con el plazo vencido el bloque queda en **`cerrado`**
  con el aviso de cierre de 004 RF-11 y **no** ofrece «Responder invitación» ni «Editar». DONDE la
  invitación sea personalizada **y** se conozca la respuesta previa, sus datos se muestran en **solo
  lectura** junto al aviso (informativo, sin posibilidad de cambiar nada). DONDE sea genérica o
  pública, **no** se pide el teléfono: sin formulario no hay consulta.
- **D9 — Degradación y demo: bloque `degradado`, con el botón deshabilitado.** Causas de degradación
  y modo demo de 004 RF-12/RF-15 intactos: el bloque sigue **visible y deshabilitado** con su motivo
  (004 D10), ahora con «Responder invitación» **deshabilitado**, el «Reintentar» de la causa cuando
  corresponda y **sin** «Editar» (no se puede saber si hay respuesta previa). Si la **consulta
  `lookup`** no termina bien, se trata igual: `degradado` con **reintento** según la causa y sin
  formulario (R3, RF-5, RF-7).
- **D10 — «Respondido» es presentación, no estado del libro.** Tras un envío aceptado el bloque se
  oculta y queda agradecimiento + datos en lectura + «Editar»; la copy de `OK` del contrato (004
  §4.1) vale **también** cuando la respuesta es `rejected` (el contrato ya la usa así). Los cuatro
  estados y su reversibilidad (004 RF-10) no cambian.
- **D11 — Sin dependencias nuevas.** Los combos son listas desplegables **nativas** y el bloque
  colapsable se resuelve con lo que ya hay (constitución, principio 1): nada de librerías de UI, CSS
  o animación.
- **D12 — La resolución de la personalizada no cambia.** Mismo `resolve`, mismo `viewed` al abrir,
  misma no sobrescritura de una respuesta existente (004 RF-6/RF-10): lo único nuevo es **qué hace
  la app** con la respuesta previa que ya recibía (RF-2).
- **D13 — Tras un envío aceptado no se vuelve a consultar.** El estado `respondido` se construye con
  los datos que la app **ya tiene en página** (el envío de esta sesión o la respuesta previa); el
  servicio no recibe una llamada extra por el mero hecho de mostrar el agradecimiento.
- **D14 — La consulta no escribe en el libro de invitados; la caché del maestro es otra cosa.**
  `lookup` **no** escribe ninguna celda de la hoja `guests` (extensión de 004 RF-6 «no escribir al
  leer»): el `viewed` sigue siendo **solo** de la personalizada y el teléfono se **escribe** solo en
  el envío. Al resolver el código, sin embargo, la consulta **puede refrescar la caché del maestro**
  (`generic_json_cache`, 004 RF-18/D13) exactamente igual que la lectura normal: eso no es el libro
  de invitados y no lo decide el invitado (I7).
- **D15 — Los datos del invitado solo existen dentro del bloque.** El nombre del invitado, el
  acompañante, el cupo y los lugares reservados **no** se muestran en ningún otro sitio de la
  invitación (portada, hero, cabecera ni pie): el bloque de confirmación es el único lugar donde
  aparecen, y solo desde `respondido` o `editando` (decisión R6, RF-3).
- **D16 — El nombre registrado se muestra en lectura y se edita al editar.** En `respondido` el
  nombre registrado es texto en solo lectura; al pulsar «Editar» pasa a ser un **campo editable**,
  junto con los asistentes, el mensaje y las restricciones (decisión R7, RF-10). En la
  **personalizada**, en cambio, el titular de la invitación **nunca** se edita (004 RF-7; RF-2).

## 3. Usuarios

- **El invitado personalizado que ya contestó.** Abre su enlace y quiere **ver** lo que respondió y,
  si hace falta, **editarlo** sin rellenar nada desde cero ni perder el mensaje o las restricciones
  que escribió.
- **El invitado personalizado que aún no contesta.** No quiere el formulario (ni sus datos) encima
  mientras lee la invitación: pulsa «Responder invitación» cuando esté listo.
- **El invitado genérico o público.** Pulsa «Responder invitación», escribe su **teléfono**, pulsa
  **«Continuar»** y espera que el sistema **reconozca** si su respuesta ya existe (para verla y
  editarla) o le dé el formulario limpio si es la primera vez; también quiere ver su límite de
  boletos de forma explícita al elegir asistentes.
- **El invitado que cambia de opinión.** En cualquier tipo, estando el plazo abierto, usa «Editar» o
  vuelve a contestar; los estados del libro siguen siendo reversibles (004 RF-10).
- **La pareja.** Nada cambia para ella: las respuestas siguen llegando a su libro con las mismas
  columnas y estados; esta spec no añade escrituras en la hoja `guests` (la consulta solo lee).
- **Quien organiza y publica.** Debe redesplegar el script del servicio cuando el contrato gana
  `lookup` (los tres artefactos se actualizan a la vez, RF-8); los libros no cambian.
- **Quien comprueba la invitación.** Necesita que un servicio caído, una consulta fallida, un plazo
  vencido o un código desconocido se vean igual de claro que hoy, y que **nunca** se responda a
  ciegas ni se pierda lo escrito.

## 4. Historias de usuario

- **HU-9:** Como invitado personalizado que ya respondió quiero ver mis datos en pantalla y un botón
  «Editar» para corregirlos, sin rellenar el formulario desde cero.
- **HU-10:** Como invitado quiero que la confirmación no muestre el formulario hasta que yo pulse
  «Responder invitación», para leer la invitación sin distracciones.
- **HU-11:** Como invitado genérico o público quiero escribir mi teléfono y pulsar «Continuar» para
  que el sistema reconozca si ya respondí, para ver mi respuesta y editarla.
- **HU-12:** Como invitado quiero elegir mis asistentes en una lista que muestre mi límite, para no
  equivocarme de cantidad.
- **HU-13:** Como invitado quiero que, al abrir el formulario, mi nombre aparezca **antes** que el de
  mi acompañante y que las opciones de asistencia, para confirmar que la invitación es mía antes de
  responder.
- **HU-14:** Como invitado quiero que mi nombre, mi acompañante y mi cupo **no** se vean hasta que yo
  pulse «Responder invitación», para que quien mire la pantalla no vea mis datos.

## 5. Requisitos funcionales (criterios en EARS)

**RF-1 — Estados del bloque de confirmación y sus transiciones** (puntos 1 y 3)

- MIENTRAS la invitación esté resuelta y el plazo permita contestar (abierto o sin plazo), el bloque
  de confirmación deberá estar en **uno** de los **cinco** estados de interacción (`sin-respondido`,
  `telefono`, `consultando`, `respondido` o `editando`); en cualquier otro caso estará en
  **`cerrado`** (plazo vencido) o en **`degradado`** (fallo de resolución, servicio sin configurar o
  modo demo). Los **siete** estados, con lo que se ve y lo que se anuncia en cada uno, son:

  | Estado | Qué se ve en el bloque | Qué se anuncia |
  | --- | --- | --- |
  | **`sin-respondido`** | Solo el **título de la sección** (el del registro, `confirmacion.titulo`) y el botón **«Responder invitación»**. Ni datos del invitado ni formulario. | El foco, si viene de una vuelta al estado. |
  | **`telefono`** | El **campo del teléfono** y el botón **«Continuar»** (solo genérica y pública). | El foco entra al campo del teléfono. |
  | **`consultando`** | El teléfono en **solo lectura** (campo deshabilitado) y «Continuar» **deshabilitado**; sin formulario. | «Estamos buscando tu respuesta…» en la región viva. |
  | **`respondido`** | **Agradecimiento** (copy `OK` del contrato, 004 §4.1), **datos de la respuesta en solo lectura** y botón **«Editar»**. | El resultado y el cambio de estado, con el foco en el panel. |
  | **`editando`** | El **formulario editable**, precargado según corresponda (RF-2 en la personalizada, RF-5 en la genérica y la pública). | El foco entra al primer campo. |
  | **`cerrado`** | El **aviso de plazo vencido** (004 RF-11); con respuesta previa conocida, además sus datos en solo lectura (D8). | El aviso. |
  | **`degradado`** | El **motivo** (004 D10) y «Reintentar» si la causa lo permite (004 RF-12); «Responder invitación» **deshabilitado** y sin «Editar». | El motivo. |

- Al resolver la invitación, el bloque deberá arrancar en **`degradado`** (fallo de resolución,
  servicio sin configurar o modo demo), **`cerrado`** (plazo vencido), **`respondido`** (personalizada
  con respuesta previa ya conocida) o **`sin-respondido`** (cualquier otro caso), y **solo** en uno
  de esos cuatro (D2; RF-2, RF-7).
- CUANDO el invitado pulse «Responder invitación», el bloque pasará a **`editando`** (personalizada)
  o a **`telefono`** (genérica y pública), y el **foco** irá al primer campo del paso revelado.
- CUANDO el invitado pulse «Continuar» con un teléfono de diez dígitos, el bloque pasará a
  **`consultando`** (genérica y pública; RF-5).
- CUANDO la consulta termine, el bloque pasará a **`respondido`** (fila con respuesta), a
  **`editando`** (sin fila o fila sin respuesta) o a **`degradado`** (consulta fallida; RF-5, RF-7).
- CUANDO el invitado pulse «Editar», el bloque pasará a **`editando`** con la precarga de RF-2 o RF-5.
- CUANDO un envío termine **aceptado**, el bloque pasará de `editando` a **`respondido`**: el
  formulario se oculta y quedan agradecimiento, datos en lectura y «Editar» (RF-9).
- CUANDO **venza el plazo** estando el bloque en `sin-respondido`, `telefono`, `consultando`,
  `respondido` o `editando`, el bloque pasará a **`cerrado`** sin recargar (004 RF-11; D8).
- MIENTRAS el bloque esté en `sin-respondido`, `respondido`, `cerrado` o `degradado`, **ningún** dato
  del invitado se mostrará editable (RF-2, RF-5, RF-10).
- El agradecimiento de `OK` se mostrará **también** cuando la respuesta sea `rejected`: la copy del
  contrato es la misma y 004 RF-10 (rechazo registrado) no cambia.
- El bloque conserva su ancla y su título; la sección no se apaga ni se oculta (004 RF-12).
- Los nombres de los estados son un **concepto de interfaz en español**: en el código, los
  identificadores van en inglés (constitución, principio 6).

**RF-2 — La respuesta previa de la personalizada se muestra y se usa para editar** (punto 1)

- CUANDO la invitación sea **personalizada** y el servicio devuelva una **respuesta previa** (004
  RF-6, ya resuelta al abrir), el bloque deberá arrancar en estado **`respondido`** (D2): datos en
  solo lectura (nombre del titular, acompañante cuando exista, asistentes confirmados en adultos y
  niños, mensaje y restricciones si los escribió, y la fecha de la respuesta cuando se conozca) y
  botón «Editar».
- DONDE la fila del invitado **no** tenga respuesta (`viewed` o `status` vacío; 004 RF-10), el bloque
  arrancará en **`sin-respondido`**; el sistema **no** dará por contestada una fila `viewed`.
- CUANDO el invitado pulse «Editar», el formulario deberá precargarse con la respuesta previa
  **completa**: adultos y niños asistentes, mensaje, restricciones y la asistencia elegida
  («confirmar» para `confirmed`/`updated`, «rechazar» para `rejected`).
- El campo del **nombre** en la personalizada seguirá siendo el de la invitación y **no** se podrá
  editar (004 RF-7: no se toca la identidad de la fila); se pinta con `readOnly`, como hoy.
- MIENTRAS el invitado edite, si el envío falla no se perderá nada de lo precargado ni de lo escrito
  (004 RF-14 intacto).
- Este requisito **no** cambia cómo ni cuándo el servicio escribe `viewed` ni la no sobrescritura de
  una respuesta existente (004 RF-6, RF-10 intactos; D12).

**RF-3 — Orden de los campos y visibilidad de los datos del invitado** (punto 2)

- EN el formulario de respuesta, el **nombre** del invitado deberá mostrarse **antes** que el nombre
  del **acompañante** y **antes** que los controles de **asistencia**.
- El acompañante (cuando exista) se mostrará después del nombre del invitado y antes de los controles
  de asistencia; su forma visible (aviso «Te acompañará …») no cambia.
- Los controles de asistencia vendrán después; el orden del resto de campos no cambia (004 RF-8).
- DONDE la invitación sea genérica o pública, el **paso del teléfono** (RF-5) es **anterior** a este
  formulario: este requisito ordena el formulario de respuesta, no el paso previo.
- MIENTRAS el bloque esté en `sin-respondido`, `telefono`, `consultando`, `cerrado` o `degradado`, la
  invitación **no** mostrará —ni dentro ni fuera del bloque— el nombre del invitado, el acompañante,
  el cupo ni los lugares reservados: desde `respondido` y `editando`, el bloque es el **único**
  lugar donde esos datos aparecen (D15, HU-14).
- El texto que anuncia los lugares reservados («Hemos reservado … en tu honor») vivirá **dentro** del
  contenido que revela el botón «Responder invitación», no en la vista colapsada.

**RF-4 — Selección de asistentes: combo box cuando el cupo es numérico** (punto 4; decisión R1)

- CUANDO el cupo que corresponda sea **numérico**, el campo de **número de asistentes** (adultos y
  niños) deberá ser una **lista desplegable** (combo box) con las opciones enteras desde **0** hasta
  ese cupo, en lugar de un campo numérico libre.
- DONDE la invitación sea **personalizada**, el cupo de adultos será `adults_guests` y el de niños,
  `child_guests` (004 RF-9); el combo de niños solo se mostrará cuando `child_guests` sea mayor que
  cero (como hoy); los dos cupos son numéricos, así que ambos campos son combo cuando se muestran.
- DONDE la invitación sea **genérica**, el combo de adultos ofrecerá las opciones desde 0 hasta el
  **límite del código** (004 RF-9); la genérica y la pública **no** ofrecen niños (004 D12 intacto).
- DONDE el límite sea **`n`** (la pública, sin tope; 004 RF-9/D12), el campo deberá ser un **campo
  numérico libre** con la **validación existente** (enteros ≥ 0): `n` sigue significando **sin
  tope**, la app **no** declara ningún máximo artificial y la 004 RF-9/D12 quedan **íntegras** (R1).
- El cupo que pinta el combo se tomará de la **lectura vigente** en esa sesión: en la personalizada,
  de los cupos de la invitación resuelta por `resolve` (que no cambian durante la sesión); en la
  genérica y la pública, del `limit` que devuelve la **consulta** `lookup` (RF-5, RF-8), que es la
  lectura más reciente y la única disponible cuando el formulario aparece. Si difirieran, **manda la
  de la consulta** y el servicio sigue siendo la autoridad en el envío (`OVER_LIMIT`; M2).
- SI el cupo máximo correspondiente es **0**, ENTONCES el combo **no** se mostrará (no hay ninguna
  opción que ofrecer) y se conservará que lo único posible es **rechazar** (004 RF-9, D21 intactos).
- El combo ofrecerá el rango **completo** 0..cupo, **incluido el 0**: el 0 nunca es una
  confirmación válida (confirmar exige al menos un asistente), así que elegirlo con «confirmar» se
  rechazará con el aviso de la validación existente (`OVER_LIMIT`, copia del contrato; 004 RF-9/D21
  intactos) y el servicio lo rechazará igual. No se oculta la opción 0 del combo: el cupo explícito
  es lo que el punto 4 pide (M1).
- El combo hará **imposible elegir por encima del cupo en la interfaz**, pero la validación previa y
  el rechazo `OVER_LIMIT` del servicio se conservan (004 RF-9 intacto), también en el campo libre.
- Un número **igual** al cupo seguirá siendo válido cuando el cupo sea mayor que cero (004 RF-9).
- Los valores por defecto del formulario no cambian: sin respuesta previa, la personalizada ofrecerá
  por defecto su cupo (como hoy); la genérica y la pública, la de hoy.
- Los combos llevarán su **etiqueta** y el **texto de ayuda del cupo** que ya existe (RNF-1).

**RF-5 — Paso del teléfono, consulta y reconocimiento en la genérica y la pública** (punto 5)

- CUANDO el invitado pulse «Responder invitación» en una invitación **genérica** o **pública**, el
  bloque pasará a **`telefono`**: el campo del **teléfono** (diez dígitos; 004 RF-8, D23 intactos) y
  el botón **«Continuar»**, con el foco en el campo.
- MIENTRAS el teléfono no tenga **exactamente diez dígitos**, «Continuar» permanecerá
  **deshabilitado** y **no** se llamará al servicio: la comprobación previa es la existente
  (`isPhoneComplete`). El servicio **vuelve a validar** el teléfono en la consulta y es la
  **autoridad**: si responde `INVALID_PHONE`, el bloque volverá a `telefono` con ese aviso, sin
  degradarse, para que el invitado corrija (M4).
- CUANDO el invitado pulse «Continuar» con el teléfono completo, el bloque pasará a **`consultando`**
  y el sistema **consultará al servicio** con la acción nueva **`lookup`** (slug + código + teléfono
  normalizado a dígitos; D5, RF-8) **antes** de mostrar el formulario: la consulta **no** se dispara
  sola al escribir el décimo dígito (R5).
- MIENTRAS el bloque esté en `consultando`, el teléfono se mostrará en **solo lectura** (campo
  `disabled`), «Continuar» estará **deshabilitado**, no habrá formulario y el estado se anunciará en
  la región viva («Estamos buscando tu respuesta…») (M3).
- SI la consulta devuelve una **respuesta registrada**, ENTONCES el bloque pasará a **`respondido`**:
  agradecimiento, datos de esa fila en **solo lectura** (nombre registrado, asistentes, mensaje y
  restricciones si los hay, fecha, y el **teléfono aportado**) y «Editar»; el estado de esa fila
  (`confirmed`/`updated`/`rejected`) determina la asistencia preseleccionada al editar (precarga de
  RF-2). El teléfono aparece porque es un dato **propio** que el invitado acaba de escribir, ya está
  en la página y no se persiste (M9).
- CUANDO el invitado pulse «Editar» tras la consulta, el formulario deberá precargarse con esa
  respuesta (asistentes, mensaje, restricciones y asistencia) y el **teléfono** quedará visible con
  el valor ya aportado (D6). El **nombre registrado** llegará **editable** (RF-10).
- SI **no** existe fila con ese teléfono, ENTONCES el bloque pasará a **`editando`** con el
  **formulario limpio** (primera respuesta): esto **no** es un error y no lleva ningún código de
  error (D5: `response: null`).
- SI la fila existe pero **no tiene respuesta** (`viewed` o `status` vacío), ENTONCES se tratará como
  **primera respuesta** y el bloque pasará a `editando` limpio (004 RF-10).
- SI la consulta **no termina bien** (servicio no disponible, libro no disponible, tiempo agotado,
  respuesta fuera de contrato o cualquier causa de degradación de la lectura), ENTONCES el bloque
  pasará a **`degradado`** con su aviso y su reintento según la causa (RF-7, R3).
- El paso previo pedirá **solo el teléfono** (R2); el **nombre** se pedirá **después**, en el
  formulario, como campo obligatorio **también al rechazar** (004 RF-8 y D26 intactos).
- CUANDO el invitado **cambie el teléfono** en el formulario después de una consulta que encontró
  fila, la app **no** volverá a consultar (D6): avisará de que la respuesta se guardará con **ese**
  teléfono y el **nombre** quedará tal como esté en el campo (editable y obligatorio al enviar). Al
  enviar se aplica la regla de la 004: la respuesta se asocia al teléfono nuevo (fila nueva o ajena)
  (M8).
- El **doble clic** en «Responder invitación», «Continuar» o «Editar» no romperá nada: mientras el
  bloque esté en `consultando` no se disparará ninguna consulta más y las pulsaciones repetidas se
  ignorarán; «Editar» no se ofrece en `consultando` (M10).
- MIENTRAS el plazo esté vencido, el bloque esté `degradado` o no haya configuración, **no** se
  ofrecerá el paso del teléfono (RF-7).

**RF-6 — Privacidad de la consulta por teléfono y riesgo aceptado**

- El servicio devolverá con `lookup` **solo** la fila del **teléfono pedido**; en ningún caso un
  listado de filas ni datos de **otras** filas.
- La fila se devolverá **completa** (nombre registrado, asistentes, mensaje y restricciones): es el
  **riesgo aceptado** de §1.4, y quien pide la spec lo asume de forma explícita porque el enlace
  genérico/público **se comparte** y el teléfono es la **única barrera**. El riesgo se documentará
  además en `docs/constitution.md` (principio 5) y en `AGENTS.md` (§5.2).
- La respuesta de `lookup` **no** incluirá el teléfono (la app ya lo tiene en la página), aunque el
  **cuerpo de la consulta sí lo envía**; la app **no** deberá persistirlo: el teléfono vive solo en
  **memoria de la página** mientras esté abierta (004 RNF-2 intacto: nada en `localStorage`, ni en la
  URL, ni en cookies; al recargar se vuelve a pedir).
- La consulta **no escribe** ninguna celda de la hoja `guests`: el código usado sigue sin registrarse,
  el `viewed` no se toca (sigue siendo solo de las personalizadas, 004 RF-10) y el teléfono se
  **escribe** solo en el envío (004 RF-8, D7 intactos). La consulta **sí puede refrescar** la caché
  del maestro al resolver el código (`generic_json_cache`, 004 RF-18/D13): eso no es el libro de
  invitados (D14).
- Los errores de la consulta usarán los **códigos existentes** del contrato (004 §4.1): boda o código
  desconocidos, boda inactiva, libro no disponible, datos incoherentes, teléfono inválido, campos que
  falten y servicio no disponible; «teléfono sin fila» **no** es un error (es `response: null`,
  RF-5).
- En una boda **personalizada** la consulta **no aplica**: la app no la usa, y si le llegara, el
  servicio responderá `INVALID_RESPONSE` (el cuerpo no encaja en esa invitación).

**RF-7 — Interacción con el plazo, la degradación y la configuración**

- MIENTRAS el plazo esté **vencido**, el bloque estará en **`cerrado`** con el aviso de cierre (004
  RF-11 intacto) y **no** ofrecerá «Responder invitación» ni «Editar»; DONDE la invitación sea
  **personalizada** y se conozca la **respuesta previa**, sus datos se mostrarán en **solo lectura**
  junto al aviso (D8); DONDE sea **genérica o pública**, **no** se pedirá el teléfono ni se hará
  ninguna consulta (no hay formulario que ofrecer).
- EN **cualquier** causa de degradación del servicio o sin configuración (004 RF-12 y RF-15
  intactos), el bloque quedará en **`degradado`**: **visible y deshabilitado** con su motivo (004
  D10), el botón «Responder invitación» **deshabilitado**, el «Reintentar» de la causa cuando sea
  reintentable y **sin** «Editar» (no se puede saber si hay respuesta previa).
- SI la consulta **`lookup`** no termina bien (servicio no disponible, libro no disponible, tiempo
  agotado, respuesta fuera de contrato, boda inactiva o desconocida, código desconocido), ENTONCES
  el bloque quedará en **`degradado`** con su aviso y su **reintento** según la causa (004 RF-12), y
  **no** se ofrecerá el formulario: sin consulta no se puede saber si hay respuesta previa y
  responder a ciegas podría sobrescribir lo que el invitado quería revisar (R3, coherente con «nunca
  confirmar a ciegas»: 004 RF-12/D10).
- CUANDO el invitado pulse «Reintentar», el sistema volverá a resolver la invitación (004 RF-12) y el
  bloque volverá a su estado de arranque (D2): `sin-respondido` si ya se puede contestar y la
  personalizada no traía respuesta previa, `respondido` si la traía, `cerrado` si el plazo venció
  mientras tanto, o `degradado` otra vez si la causa persiste.
- El **modo demo** (sin servicio configurado) no llamará a nadie, tampoco a `lookup` (004 RF-15
  intacto).
- La lectura de la **personalizada** no cambia: el `viewed` al abrir y la no sobrescritura siguen
  exactamente como en 004 RF-6/RF-10 (D12).

**RF-8 — El contrato: la acción `lookup` y sus tres artefactos**

- La acción **`lookup`** tendrá esta forma **literal** (nombres de campo en inglés, excepción de
  idioma de la 004 RNF-7):
  - **Petición:** `{ action: "lookup", slug, code, phone }`. `phone` viaja **normalizado a dígitos**
    (los diez del teléfono); `slug` y `code` como en `resolve`.
  - **Respuesta correcta:** `{ ok: true, action: "lookup", type, limit, response, deadline }`, donde:
    - `type`: el tipo de la boda, `"generic"` o `"public"` (los literales de `GUEST_TYPES`); el
      contrato **no** admite `lookup` en una boda `personal` (`INVALID_RESPONSE`);
    - `limit`: el mismo que devuelve `resolve` para ese código —entero mayor que cero en la genérica,
      `"n"` en la pública (literales de `NO_LIMIT`)— y **es el que manda para el combo** (RF-4, M2);
    - `response`: **`null`** (no hay fila con ese teléfono, o la fila no tiene respuesta) o el
      **mismo modelo de respuesta previa que devuelve `resolve`** —`{ state, adultsAttendees,
      childAttendees, message, restrictions, datetime }`— **más** `name`, el **nombre registrado** de
      la fila (la columna `guest_name`), que es lo único nuevo de la consulta;
    - `deadline`: el plazo del maestro, como en `resolve` (texto ISO con desfase, o `null`).
  - La consulta **no** devuelve un objeto `guest`: la genérica y la pública no precargan titular ni
    cupo (004 RF-6); el nombre registrado va **dentro de `response`** (es un dato de la respuesta,
    como `datetime`), no en `guest`.
  - **Error:** `{ ok: false, code }` con los códigos **existentes**: `MISSING_SLUG`, `MISSING_GUEST`,
    `UNKNOWN_WEDDING`, `INACTIVE_WEDDING`, `UNKNOWN_GUEST` (código que no está en su hoja; en la
    pública, cualquiera que no sea `PUBLIC`), `GUEST_SHEET_UNAVAILABLE`, `INVALID_DATA`,
    `MISSING_FIELDS` (sin teléfono), `INVALID_PHONE` (teléfono que no son diez dígitos),
    `INVALID_RESPONSE` (cuerpo que el contrato no admite en esa invitación) y `SERVICE_UNAVAILABLE`.
    **Ningún** código nuevo.
- El contrato del servicio deberá actualizarse **a la vez** en sus **tres artefactos**: el **módulo**
  (`src/constants/contract.js`, que gana la acción y sube su `CONTRACT_VERSION`), el **documento**
  (`docs/servicio-invitados.md`) y el **script del servicio** (`gas/Code.gs`, que declara la **misma**
  `CONTRACT_VERSION`), y el servicio deberá **redesplegarse** para servir la acción nueva (004
  RF-17/D18 intactos). Los literales nuevos de la acción y de sus campos se declararán en el módulo
  para que el documento no pueda omitirlos.
- La **prueba de sincronía documento↔módulo** (004 RNF-10, `test/serviceContract.test.js`) seguirá
  exigiendo que el documento no omita ningún literal ni ningún código del módulo, `lookup` incluida;
  **no** comprueba hoy la forma de la respuesta ni la igualdad de versión, así que el plan deberá
  además: (a) declarar en el módulo los literales nuevos de `lookup` (acción, campos de la petición y
  de `response`); (b) añadir la comprobación de que `gas/Code.gs` declara la misma `CONTRACT_VERSION`
  (basta leerlo como texto; si no se hiciera, la igualdad queda como paso manual del despliegue); y
  (c) cubrir con pruebas puras la interpretación de la respuesta de `lookup` (RF-8, M6).
- La app seguirá **consumiendo el módulo**: ningún componente llevará literales de contrato (004
  RF-17 intacto).

**RF-9 — Resultado del envío** (punto 3; modifica la presentación de 004 RF-14)

- CUANDO un envío termine **aceptado** (`OK`), el bloque pasará a **`respondido`**: se oculta el
  formulario y quedan **solo** el agradecimiento (la copy `OK` del contrato), los datos de la
  respuesta en **solo lectura** y el botón **«Editar»** (RF-1).
- CUANDO un envío **falle** (cualquier código de 004 RF-14 o RF-11), el bloque permanecerá en
  **`editando`**, mostrará el aviso por su código y **conservará** todo lo escrito (004 RF-14
  intacto: códigos, distinción de causas, doble clic impedido, reintentable sin perder el formulario).
- El estado «respondido» se construirá con los datos que la app **ya tiene en página** (el envío de
  esta sesión o la respuesta previa ya recibida); el sistema **no** hará una consulta extra por el
  mero hecho de mostrarlo (D13).
- «Respondido» es un estado **de presentación**: **no** cambia ni añade estados del libro (004 RF-10
  intacto).

**RF-10 — El nombre registrado: solo lectura en `respondido`, editable al editar** (decisión R7)

- EN el estado **`respondido`** de la genérica y la pública, el nombre registrado se mostrará como
  **texto en solo lectura**, como el resto de los datos de la respuesta: ningún control editable.
- CUANDO el invitado pulse «Editar», el **nombre registrado** se mostrará en un campo de texto
  **editable**, junto con los asistentes, el mensaje y las restricciones (sin el `readOnly` que lleva
  el titular de la personalizada, RF-2).
- El nombre seguirá siendo **obligatorio** al enviar (004 RF-8/D26): si el invitado lo borra, la
  validación previa mostrará el aviso del contrato (`MISSING_FIELDS`) y el servicio lo rechazará
  igual.
- El **mecanismo observable** es el atributo del control, no solo el estilo: el titular de la
  personalizada lleva `readOnly` **siempre** (004 RF-7); el nombre registrado de la genérica y la
  pública **no** lo lleva en `editando` y solo existe como texto en `respondido` (I5).
- Los datos en solo lectura (nombre, asistentes, mensaje, restricciones, fecha y teléfono) se
  mostrarán con la estructura accesible de RNF-1.

### 5.1 Relación con la spec 004: RF y D que se modifican, amplían o matizan

- **004 RF-6 — MODIFICADA parcialmente; su segunda frase queda DEROGADA.** La parte que dice que en
  la genérica y la pública el servicio «**no** puede devolver una respuesta previa, porque el teléfono
  que la identifica lo escribe el invitado al contestar» queda **derogada**: mediante la acción
  `lookup` —con el teléfono **que aporta el invitado en su enlace**— el servicio **sí** devuelve esa
  respuesta previa (RF-5, RF-8 de esta spec), **completa** y con el riesgo aceptado de §1.4. **Todo
  lo demás de 004 RF-6 se conserva** (la personalizada devuelve su respuesta previa; el estado, tal
  cual; el `viewed` al abrir sin respuesta y sin sobrescribir; no escribir al leer —ahora también en
  `lookup`, salvo la caché del maestro—; no devolver el teléfono de filas precargadas).
- **004 RF-8 — MODIFICADA en el cuándo se pide el teléfono.** El teléfono se pide en un **paso
  previo** al formulario, tras «Responder invitación» y confirmado con «Continuar» (RF-5); el
  **contenido del envío**, la obligatoriedad de nombre y teléfono **también para rechazar** (D26), la
  normalización a diez dígitos, la llave por teléfono y la fila autoincremental **no cambian**.
- **004 RF-9 — MODIFICADA en la forma de elegir, no en los límites.** Los campos numéricos pasan a
  **combo box** cuando el cupo es numérico (RF-4, R1); el cupo de la personalizada, el límite del
  código en la genérica y la pública, `n` sin tope (que sigue siendo **campo numérico libre**: no se
  declara ningún máximo artificial), el borde incluido, el `OVER_LIMIT` (también con la opción 0 del
  combo) y el «cupo cero → solo rechazar» (D21) quedan **intactos**; la única matización es que con
  cupo 0 el combo **no** se muestra (D4).
- **004 RF-14 — MODIFICADA en la presentación del éxito.** Tras un envío aceptado el formulario se
  **oculta** y el bloque queda en `respondido` (RF-9); los códigos, el doble clic, la conservación de
  lo escrito ante un fallo y la distinción de causas quedan **intactos**.
- **004 RF-17 — AMPLIADA.** El contrato gana la acción `lookup`, sube su versión **en el módulo y en
  el script** y exige la actualización **a la vez** de los tres artefactos **más redespliegue** del
  servicio (RF-8).
- **004 RF-18 y D13 — MATIZADAS en un punto.** La consulta **no** escribe en el libro de invitados,
  pero **puede refrescar la caché del maestro** al resolver el código, igual que la lectura normal
  (D14, RF-6).
- **004 D10 — MATIZADA.** El bloque visible y deshabilitado conserva su motivo y ahora muestra el
  botón «Responder invitación» **deshabilitado** (RF-7); el principio (bloque deshabilitado, nunca
  confirmar a ciegas) queda intacto.
- **004 D12 y D21 — INTACTOS, con la matización del combo** (cupo 0 sin combo; `n` → campo numérico
  libre, sin máximo declarado; D4, R1).
- **004 D26, D8, D9, D15, D17… — INTACTOS.** Ningún requisito de la 004 queda derogado **por
  completo**: solo la frase de 004 RF-6 citada arriba y las formas de presentación indicadas.

### 5.2 Cambios documentales que esta spec exige

Esta spec vive **solo** en `specs/`; los siguientes cambios van **fuera** de ella y forman parte de
su alcance (los hace quien ejecuta el plan cuando la spec esté aprobada):

- **`docs/constitution.md` (principio 5, privacidad).** Debe recoger que la app **lee y muestra**
  datos de la fila identificada por teléfono en la invitación genérica y la pública (nombre,
  asistentes, mensaje y restricciones), con el **riesgo aceptado** de §1.4 escrito y el teléfono como
  **única barrera**; y que **enviar** el teléfono no es **escribirlo**: se escribe solo en el envío
  (I8).
- **`AGENTS.md`.** Debe reflejar el mismo alcance (la acción `lookup`, el riesgo aceptado y la
  verificación manual correspondiente), en su sección de servicio de invitados.
- **`MEMORY.md`.** Estado y decisiones del cambio, al terminar la implementación (como en cada
  tarea).

Mientras esos tres documentos no se actualicen, el cambio de alcance no queda documentado donde la
constitución y las reglas permanentes lo exigen (I6).

## 6. Requisitos no funcionales

- **RNF-1 Accesibilidad del bloque, de los combos y del panel de lectura.**
  - **Botones:** «Responder invitación», «Continuar», «Editar» y «Reintentar» son **botones reales**,
    alcanzables por teclado y con foco visible; el que revela el panel anuncia su estado **expandido o
    contraído** (`aria-expanded` con el panel asociado).
  - **Cambios de estado:** cada transición relevante se anuncia en una **región viva**
    (`role="status"`), y al revelar un paso el foco va al **primer campo**; al pasar a `respondido`,
    al panel de datos (encabezado con `tabIndex={-1}`) (004 RNF-6 intacto).
  - **Combos (RF-4):** cada `<select>` lleva su `<label>` asociado y el **texto de ayuda del cupo**
    enlazado (`aria-describedby`); la etiqueta del campo personalizada ya existente («Adultos que
    asistirán» / «Cuántos asistirán» / «Niños que asistirán») se conserva. El campo libre de `n`
    conserva su etiqueta y su ayuda («Esta invitación no tiene tope»).
  - **Panel de datos en solo lectura (`respondido` y `cerrado`):** estructura de pares
    etiqueta/valor (lista de definiciones o equivalente), **sin** controles de formulario, dentro de
    la región viva; se anuncia al aparecer.
  - **Deshabilitado de verdad:** en `degradado`, `cerrado` y `consultando`, los controles que no se
    pueden usar van `disabled` (no solo con estilo), y en `consultando` el campo del teléfono queda
    deshabilitado mientras dura la consulta (004 RNF-6 intacto).
- **RNF-2 Privacidad.** 004 RNF-2 intacta, con el alcance de esta spec: la consulta devuelve **solo**
  la fila del teléfono pedido y **completa** (riesgo aceptado, §1.4), **nunca** otras filas y **sin**
  su teléfono dentro; el teléfono **se envía** en la consulta y en el envío, pero **se escribe** solo
  en el envío; la app **no** persiste el teléfono ni la respuesta previa (nada en `localStorage` ni
  en la URL); los libros reales siguen fuera del repositorio (RF-6).
- **RNF-3 Sin dependencias nuevas.** Combos, paneles y transiciones de estado se resuelven con HTML,
  CSS y React ya presentes; ninguna librería de UI, CSS o animación (constitución, principio 1; D11).
- **RNF-4 Capas.** 004 RNF-9 intacta: la consulta `lookup` y su estado respetan el mismo reparto —
  lógica pura con «ahora» y entorno por parámetro, el cuándo en los hooks, la llamada en el servicio
  y la presentación en el componente—; los textos de interfaz siguen en español y los literales del
  contrato, en inglés (004 RNF-7 intacta).
- **RNF-5 Verificación.** 004 RNF-10 intacta: la verificación automática va contra el **módulo** del
  contrato (nunca contra el servicio vivo) con el runner integrado de Node, **sin instalar nada**. La
  prueba de sincronía documento↔módulo **solo** garantiza que el documento no omita literales del
  módulo: cubre `lookup` y sus campos, pero **no** la forma de la respuesta ni la igualdad de versión,
  que se cubren con lo previsto en RF-8. La interfaz (estados del bloque, combos, foco) se verifica
  **en navegador**, de forma automática donde se pueda y manual donde no (constitución, principio 4).

## 7. Casos límite

**Estados y transiciones**

- **Personalizada con respuesta previa `confirmed`/`updated`:** el bloque arranca en `respondido`
  (datos en lectura + «Editar»); editar precarga asistentes, mensaje, restricciones y asistencia
  (RF-2, D2).
- **Personalizada con respuesta previa `rejected`:** igual (es una respuesta registrada, no un
  error); al editar, la asistencia se preselecciona en «rechazar» y se puede cambiar de opinión (004
  RF-10 intacto).
- **Personalizada `viewed` o `status` vacío:** bloque en `sin-respondido`; **no** se da por
  contestada (004 RF-10); el servicio **no** cambia el `viewed` que ya escribió al abrir (004 RF-6).
- **Personalizada: se pulsa «Responder invitación»:** pasa directa a `editando`, sin paso del
  teléfono (RF-1, RF-5).
- **Consulta en vuelo:** `consultando` con el teléfono deshabilitado, «Continuar» deshabilitado, sin
  formulario y el aviso en la región viva; una segunda pulsación no dispara nada (RF-5, M3, M10).
- **Recarga de página:** el estado no persiste (no hay persistencia, 004 RNF-2): la **personalizada**
  vuelve a encontrar la respuesta previa y arranca de nuevo en `respondido`; la **genérica** y la
  **pública** vuelven a pedir el teléfono (el `lookup` no se «recuerda»).
- **Dos pestañas:** siguen sin coordinarse (004 RF-14); la autoridad sobre duplicados sigue siendo el
  servicio por teléfono.

**Teléfono y consulta**

- **Teléfono incompleto o con lada de país:** «Continuar» no avanza (está deshabilitado; diez dígitos
  exactos) y, si el servicio lo rechazara, la consulta devuelve `INVALID_PHONE` y el bloque vuelve a
  `telefono` con ese aviso, **sin** degradarse (RF-5, M4; D23 intacto).
- **Genérica o pública — teléfono sin fila (primera respuesta):** `response: null` → formulario
  limpio; **no** es un error y no se muestra ningún código (RF-5).
- **Genérica o pública — teléfono con fila sin respuesta** (`viewed` o vacío, anomalía tolerada): se
  trata como primera respuesta: formulario limpio (004 RF-10).
- **Genérica o pública — teléfono de otra persona:** la consulta devuelve **su** fila **completa** y
  el bloque la muestra; es el **riesgo aceptado** de §1.4 (el enlace se comparte y el teléfono es la
  única barrera), ahora explícito y documentado, y **no** «el mismo riesgo que la 004»: aquí es
  **lectura**, y escribir exigiría pulsar «Editar» y enviar. Sin autenticación no hay forma de
  distinguirlo (fuera de alcance, §9).
- **Teléfono cambiado en el formulario tras la consulta:** la app **no** vuelve a consultar; avisa de
  que la respuesta se guardará con el teléfono nuevo y el nombre queda como esté en el campo
  (editable, obligatorio al enviar). La respuesta se asocia al teléfono nuevo (fila nueva o ajena,
  regla de la 004) (RF-5, M8).
- **Nombre registrado:** en `respondido` se lee (texto); al pulsar «Editar» es un **campo editable**
  junto con asistentes, mensaje y restricciones; si se deja vacío, la validación previa muestra
  `MISSING_FIELDS` (RF-10, R7).
- **Consulta `lookup` fallida** (servicio caído, libro no disponible, tiempo agotado o respuesta
  fuera de contrato): `degradado` con aviso y **reintento**, sin formulario (RF-7, R3).
- **Consulta `lookup` en boda desconocida, inactiva o con código desconocido:** los mismos códigos de
  la lectura normal (004 RF-12/RF-13 intactos), con la misma degradación.
- **Consulta `lookup` en una boda personalizada:** no ocurre desde la app; si llegara, el servicio
  responde `INVALID_RESPONSE` (RF-8).
- **La consulta no escribe el libro:** tras consultar un teléfono sin fila, la hoja `guests` queda
  igual (ninguna fila nueva, ningún `viewed`); la caché del maestro sí puede refrescarse (D14, I7).
- **Doble clic en «Responder invitación», «Continuar», «Editar» o el envío:** ningún estado
  intermedio roto; la consulta y el envío repetidos quedan impedidos mientras hay uno en curso (RF-5,
  004 RF-14 intacto).

**Cupo y selección de asistentes**

- **Cupo cero (personalizada):** sin combo de asistentes y sin niños; solo cabe **rechazar** (004
  RF-9/D21 intactos).
- **Límite `n` (pública):** campo numérico libre con la validación existente (enteros ≥ 0); la app no
  inventa un máximo y la 004 RF-9/D12 quedan íntegras (R1).
- **Opción 0 del combo con «confirmar»:** la opción se ofrece (el rango es completo) y se rechaza con
  el aviso de la validación existente (`OVER_LIMIT`); el servicio lo rechaza igual (RF-4, M1).
- **Cupo distinto entre `resolve` y `lookup`:** el combo se pinta con el `limit` de la **consulta**
  (la lectura vigente cuando el formulario aparece); el servicio sigue siendo la autoridad y un
  exceso se rechaza con `OVER_LIMIT` (RF-4, M2).
- **Cuándo se ve el cupo:** solo desde `respondido`/`editando`; en la invitación personalizada no
  aparece fuera del bloque (D15, RF-3, HU-14).

**Plazo y degradación**

- **Personalizada con plazo vencido y respuesta previa:** `cerrado` con el aviso + datos en **solo
  lectura**, sin «Editar» (D8); con plazo vencido y **sin** respuesta previa: solo el aviso.
- **El plazo vence mientras el bloque está en `respondido` o `editando`:** pasa a `cerrado` con los
  datos en solo lectura (RF-1, D8) y sin «Editar»; la programación del cierre sin recargar es la de
  004 RF-11 (sin cambios). Si el invitado alcanza a enviar, la autoridad es el servicio: el envío se
  rechaza como plazo vencido y la app lo muestra como tal, distinto de un fallo técnico.
- **Modo demo o degradación:** bloque `degradado` con el motivo, «Responder invitación»
  deshabilitado y sin «Editar» (RF-7); no se llama al servicio (004 RF-15 intacto).
- **Reintento:** vuelve a resolver la invitación y el bloque queda en el estado de arranque que
  corresponda (RF-7).
- **La fecha de la respuesta tras un envío de esta sesión:** el envío solo devuelve `OK`, así que la
  fecha puede **no conocerse** en ese momento; se muestra cuando existe (respuesta previa recibida) y
  **no se inventa** cuando no (004 RF-13: nada se adivina).

**Orden y presentación**

- **Orden del formulario:** en la personalizada, nombre (solo lectura) → acompañante → asistencia →
  cupos; en la genérica y la pública, tras el paso del teléfono: nombre → asistencia → adultos →
  alergias → mensaje, con el teléfono visible y editable (RF-3, RF-5, D6) y el nombre registrado
  editable (RF-10).
- **Nada del invitado fuera del bloque:** el nombre, el acompañante, el cupo y los lugares reservados
  no aparecen en la portada, el hero, la cabecera ni el pie; «Hemos reservado … en tu honor» vive
  dentro del contenido que revela el botón (RF-3, D15).

## 8. Casos que no cambian (spec 004, íntegros)

- Los **tres tipos** decididos por el maestro y devueltos por el servicio (004 RF-5, D20); el
  parámetro `guest` y la configuración del despliegue (004 RF-2, RF-15); el **plazo** del maestro y
  su rechazo en el envío (004 RF-11); los **cuatro estados** del libro y su reversibilidad, y el
  `viewed` al abrir la personalizada (004 RF-10, RF-6); el **teléfono como llave** con deduplicación
  por fila, el `guest_id` autoincremental, el cupo escrito en `adults_guests` y el código no
  registrado (004 RF-7, RF-8, D5–D7); el cupo por envío y `n` sin tope (004 RF-9, D12); la **caché
  de códigos** (004 RF-18, matizada en D14); los **códigos de error** de 004 §4.1 (ninguno se retira
  ni se renombra; `lookup` no añade ninguno); la degradación visible y el bloque deshabilitado sin
  confirmar a ciegas (004 RF-12, RF-13); el resultado del envío con sus códigos (004 RF-14); el modo
  demo (004 RF-15); el contenido de la boda local y los comportamientos ajenos al RSVP (004 RF-16);
  los libros fuera del repositorio (004 RF-17, RNF-2); y la lista de casos límite de 004 §6 no
  mencionada arriba.

## 9. Fuera de alcance

- **Autenticación o segunda verificación del teléfono** (p. ej. código por SMS): el modelo no la tiene
  y esta spec no la inventa. El riesgo del «teléfono de otra persona» **se acepta de forma explícita**
  (§1.4) y se documenta (constitution, principio 5; `AGENTS.md`), y no se disfraza de «igual que en
  la 004»: aquí la app **lee y muestra** datos de la fila que ese teléfono identifica.
- **Persistir en el navegador** la respuesta previa, el teléfono o el estado del bloque (004 RNF-2
  intacta; la recarga vuelve a empezar según el tipo).
- **Cambiar el modelo de los libros** (hojas, columnas, estados o códigos): `lookup` añade una
  **acción**, no columnas; la hoja `guests` sigue sin columna para el código (004 D7).
- **Cambiar la resolución, el plazo, los estados, la caché, la configuración ni la tabla de códigos**
  de la 004 (§8), salvo la matización de la caché en D14.
- **Añadir estados del libro** (p. ej. algo que signifique «respondido» en la hoja): «respondido» es
  solo presentación (D10).
- **Notificaciones a la pareja, panel de administración, tope global de asistentes, generar o
  repartir enlaces**: igual que en 004 (§7 de la 004).
- **Retrasar o adelantar el `viewed`** de la personalizada (004 RF-6 intacto).
- **Declarar un máximo para `PUBLIC` (`n`):** **descartado** por decisión de quien la pide (R1): `n`
  sigue significando sin tope y su campo es numérico libre; la 004 RF-9/D12 **no** se enmienda.
- **Verificar contra el servicio en vivo en la verificación automática**: la automatizada va contra el
  módulo del contrato (004 RNF-10 intacta); el servicio vivo se comprueba **a mano** al final (§10).

## 10. Verificación

- `npm test` (`node --test`, sin instalar nada) y `npm run build` en **verde**, como en cada tarea.
- **Pruebas de lógica pura (co-locadas):** la **máquina de estados** completa —los cinco estados de
  interacción más `cerrado` y `degradado`, con sus transiciones (arranque, «Responder invitación»,
  «Continuar», resultado de la consulta, «Editar», envío aceptado o fallido, vencimiento del
  plazo)—, con el «ahora» por parámetro donde haga falta; la precarga de la edición desde la
  respuesta previa (incluido `rejected`); los **rangos de los combos** (0..cupo con la opción 0, cupo
  0 sin combo, `n` como campo libre); la **interpretación de la respuesta de `lookup`** (fila con
  respuesta, sin fila, fila sin respuesta, `response` sin teléfono, y `name` dentro de `response`); el
  cupo que manda cuando `resolve` y `lookup` difieren; la validación del teléfono del paso previo y
  su `INVALID_PHONE` sin degradación.
- **Contrato:** `test/serviceContract.test.js` cubre `lookup` como cubre el resto (documento que no
  omite ningún literal del módulo, tabla de códigos idéntica) **y** se añade lo previsto en RF-8
  (literales nuevos declarados en el módulo y comprobación de que `gas/Code.gs` declara la misma
  `CONTRACT_VERSION`); `test/contracts.test.js` sigue vigilando lo que ya vigila (anclas, `guest`,
  `kg-tema`, ausencia de los jubilados); ningún código de error se retira ni se renombra.
- **Verificación manual en navegador** (escritorio y móvil), contra el servicio **redesplegado** con
  la acción `lookup`:
  1. personalizada **sin** respuesta previa: la invitación **no** muestra ningún dato del invitado
     fuera del bloque → «Responder invitación» → formulario con el **nombre antes** que el
     acompañante y que la asistencia → envío → agradecimiento + datos en lectura + «Editar» →
     «Editar» precarga todo;
  2. personalizada **con** respuesta previa (`confirmed` y `rejected`): arranca en `respondido`;
     «Editar» precarga asistentes, mensaje, restricciones y asistencia; el nombre del titular no es
     editable;
  3. genérica/pública: «Responder invitación» → `telefono` (solo el teléfono y «Continuar», nada más
     del invitado en la página) → «Continuar» con el teléfono incompleto no avanza → completo:
     `consultando` (teléfono deshabilitado, aviso anunciado) → **sin fila**: formulario limpio;
     **con fila**: `respondido` con los datos de esa fila (nombre, asistentes, teléfono) → «Editar»
     con el **nombre editable** y el teléfono visible → el envío actualiza esa misma fila en el libro;
  4. cambiar el teléfono en el formulario tras la consulta: no se vuelve a consultar, se avisa y la
     respuesta se guarda con el teléfono nuevo;
  5. selección de asistentes: combos con rangos completos y opción 0 (que «confirmar» rechaza), cupo 0
     (sin combo, solo rechazar) y campo numérico libre con `n`;
  6. plazo vencido (personalizada con y sin respuesta; genérica/pública sin paso de teléfono),
     degradación con el servicio caído (incluida la consulta `lookup` fallida, con su reintento) y
     modo demo; doble clic en «Continuar»/«Responder invitación»/«Editar» sin efectos dobles;
  7. privacidad y riesgo aceptado: al **recargar** en `respondido`, la genérica/pública vuelve a
     pedir el teléfono; el teléfono no aparece en `localStorage` ni en la URL; la respuesta de la
     consulta no trae teléfono ni datos de otras filas; la consulta **no** deja ninguna escritura en
     la hoja `guests` (el `viewed` no se escribe en la genérica ni en la pública).
- El veredicto de cada punto se anota en «Verificación» de `AGENTS.md` (lo rellena el coordinador,
  como en la 004).

## 11. Decisiones cerradas

**No queda ninguna pregunta abierta.** Las tres de la primera versión y las cuatro que abrió el QA
están resueltas e integradas en los requisitos:

1. **R1 — Combo con límite `n`.** «Si es `n`, es sin límite aparente; si es numérico, usar ese número
   como límite.» El combo se muestra **solo cuando el cupo es numérico** (adultos `0..adults_guests`
   en la personalizada, `0..limit` en la genérica con límite entero); cuando el límite es `n` se
   mantiene un **campo numérico libre** con la validación existente (enteros ≥ 0). **No** se declara
   ningún máximo artificial y **no** se deroga nada de la 004 RF-9/D12: `n` sigue significando sin
   tope (D4, RF-4).
2. **R2 — El paso del teléfono pide solo el teléfono.** El nombre se pide **después**, en el
   formulario (obligatorio también al rechazar); el nombre registrado que devuelve la consulta se
   muestra en solo lectura y se edita al pulsar «Editar» (D6, RF-5, RF-10).
3. **R3 — Si la `lookup` falla, no se ofrece el formulario.** Servicio caído, tiempo agotado o
   respuesta que no respeta el contrato → bloque **`degradado` con reintento** (coherente con «nunca
   confirmar a ciegas», 004 RF-12/D10; D9, RF-7).
4. **R4 (QA · privacidad) — La consulta devuelve la fila completa y el riesgo se acepta.** Está
   escrito como **riesgo aceptado** en §1.4 y RF-6: el enlace genérico/público se comparte y el
   teléfono es la única barrera; debe reflejarse en `docs/constitution.md` (principio 5) y en
   `AGENTS.md` (§5.2).
5. **R5 (QA · disparo) — La consulta la dispara el botón «Continuar».** No es automática al décimo
   dígito; con menos dígitos el botón está deshabilitado y, durante la consulta, un segundo clic no
   hace nada (D6, RF-5).
6. **R6 (QA · dónde se ve el nombre) — Nada del invitado se ve hasta pulsar «Responder invitación».**
   El nombre, el acompañante y el cupo **no** se muestran en ningún otro sitio de la invitación; el
   bloque es el único lugar (D15, RF-3, HU-14; HU-13 ajustada).
7. **R7 (QA · editar el nombre) — El nombre registrado se edita al editar.** Se muestra bloqueado
   (texto en solo lectura) en `respondido` y pasa a **campo editable** al pulsar «Editar», junto con
   asistentes, mensaje y restricciones (D16, RF-10); el titular de la personalizada sigue sin poder
   editarse (004 RF-7).

## 12. Trazabilidad de los hallazgos del QA

| Hallazgo | Cómo queda resuelto |
| --- | --- |
| **B1** privacidad de la lectura | **R4**: `lookup` devuelve la fila **completa** y el riesgo se **acepta de forma explícita** como riesgo aceptado (§1.4, RF-6, §9), no como «el mismo riesgo que la 004» (aquí es lectura); se documenta en `docs/constitution.md` (principio 5) y `AGENTS.md` (§5.2). |
| **B2** modelo de estados falso | **RF-1/D1**: modelo **completo** de **siete** estados (`sin-respondido`, `telefono`, `consultando`, `respondido`, `editando`, `cerrado`, `degradado`) con qué se ve y qué se anuncia en cada uno y sus transiciones; §10 prueba la máquina de estados entera. |
| **I1** arranque contradictorio | **D2**: una sola regla de arranque (`degradado` > `cerrado` > `respondido` —personalizada con respuesta previa— > `sin-respondido`), escrita en RF-1. |
| **I2** esquema de la respuesta de `lookup` | **RF-8**: forma literal de petición y respuesta, con `name` **dentro de `response`**, `limit`/`type`/`deadline` iguales que en `resolve`, sin objeto `guest`, y la lista cerrada de códigos de error; §10 y RNF-5 dicen qué añade el plan a la prueba de contrato. |
| **I3** disparo de la consulta | **R5/RF-5**: botón **«Continuar»**; con menos de diez dígitos está deshabilitado; reescrituras del teléfono no disparan nada y el doble clic se ignora (M10). |
| **I4** dónde se ve el nombre | **R6/D15/RF-3**: nada del invitado (nombre, acompañante, cupo, lugares) fuera del bloque; HU-13 ajustada y HU-14 nueva. |
| **I5** editar el nombre | **R7/RF-10/D16**: solo lectura en `respondido`, **editable** al pulsar «Editar»; mecanismo observable por el atributo del control (`readOnly` solo en el titular de la personalizada). |
| **I6** alcance documental | **§5.2**: el alcance incluye actualizar `docs/constitution.md` (principio 5), `AGENTS.md` y `MEMORY.md`. |
| **I7** qué escribe `lookup` | **D14/RF-6/§5.1**: no escribe en la hoja `guests` (el `viewed` sigue siendo solo de la personalizada) pero **puede refrescar** `generic_json_cache` al resolver el código (004 RF-18/D13). |
| **I8** el teléfono se envía y se escribe | **RF-6/RNF-2**: se **envía** en la consulta y en el envío; se **escribe** solo en el envío. |
| **M1** opción 0 del combo | **RF-4/D4**: el combo ofrece el rango completo (0 incluido) y la combinación 0 + «confirmar» se rechaza con el aviso existente (`OVER_LIMIT`), validación previa y servicio. |
| **M2** de dónde sale el `limit` | **RF-4/RF-8**: en la personalizada, de `resolve`; en la genérica y la pública, del `limit` de la **consulta**, que es la que manda para el combo; el servicio sigue siendo la autoridad. |
| **M3** consulta en vuelo | **RF-1/RF-5**: estado `consultando` con teléfono deshabilitado, «Continuar» deshabilitado, sin formulario y aviso en la región viva. |
| **M4** quién valida el teléfono | **RF-5**: la app comprueba los diez dígitos antes de habilitar «Continuar»; el servicio **vuelve a validar** (`INVALID_PHONE`) y es la autoridad; ese error no degrada el bloque. |
| **M5** idioma de los nombres de estado | **D1/RF-1/§1.2**: son concepto de interfaz y se nombran en español; en el código, identificadores en inglés (principio 6). |
| **M6** expectativa de la prueba de contrato | **RF-8/RNF-5/§10**: se dice qué comprueba hoy (`serviceContract.test.js`: literales del módulo en el documento) y qué añadirá el plan (literales nuevos en el módulo, igualdad de `CONTRACT_VERSION` con `gas/Code.gs` y pruebas puras de la respuesta). |
| **M7** cita del título | **RF-1** cita el **registro** (`confirmacion.titulo`) en vez de 004 RF-16. |
| **M8** identidad si cambia el teléfono | **RF-5/casos**: no se vuelve a consultar; se avisa de que la respuesta se guardará con el teléfono nuevo y el nombre queda como esté en el campo (editable, obligatorio); se aplica la regla de la 004 (fila nueva o ajena). |
| **M9** el teléfono en los datos de lectura | **RF-5**: el teléfono **sí** aparece en los datos en solo lectura de `respondido` (dato propio, ya en la página, no persistido). |
| **M10** doble clic durante la consulta | **RF-5/casos**: mientras dura `consultando` no se dispara otra consulta ni se ofrece «Editar»; las pulsaciones repetidas se ignoran. |
| **M11** accesibilidad de combos y panel | **RNF-1**: `<select>` con etiqueta y ayuda del cupo (`aria-describedby`), panel de datos en solo lectura con pares etiqueta/valor y anuncio en la región viva, foco al panel, y deshabilitado **real** (`disabled`) en los estados sin interacción. |
