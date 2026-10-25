# Especificación — Flujo del RSVP: respuesta previa, estados del bloque y selección de asistentes

**Estado:** borrador corregido tras QA **y ampliado por el cambio de requisitos de §13** (mensaje al
rechazar —se escribe, se envía y **se lee**—, agradecimiento del rechazo, saludo con el nombre en la
personalizada y tolerancia de la consulta a cabeceras ausentes), **y corregido tras el QA de
clarificación de ese cambio** (copy en el componente, D17 matizada, alcance real del saludo y del
combo, touchpoints de la región viva), **y ampliado por el cambio de requisitos de §14** (código de
error propio para una fila de código mal formada —`MALFORMED_GUEST`— y `PUBLIC` aceptado como «sin
tope» en una boda genérica, con subida de contrato a `1.2.0`), pendiente de aprobación de quien la
pide.

> **Cómo leer esta spec.** El cuerpo (§1–§12) es la versión ya implementada y verificada de la spec
> 005. El **§13** recogió el **primer cambio de requisitos posterior** pedido por quien la usa —los
> RF/D/R nuevos (`RF-12`…`RF-15`, `D19`/`D20`, `R12`/`R13`)— y **dónde toca** el cuerpo. El **§14**
> recoge el **segundo cambio de requisitos posterior** —`RF-16`/`RF-17`, `D21`/`D22`, `R14`/`R15`— y
> también **dónde toca** el cuerpo. Cuando un punto del §13 o del §14 contradice el cuerpo, **manda
> la sección del cambio más reciente** (§14 sobre §13, y §13 sobre el cuerpo); el §13 **modifica**
> además un punto del §13.4 (la versión del contrato), que el §14 deja sustituido.

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
- «**saludo al invitado**»: el texto de interfaz «Hola, \<nombre completo\>» que la **personalizada**
  muestra **dentro** del contenido que revela «Responder invitación», antes del campo del nombre
  (RF-14, §13). El nombre es el **titular tal cual lo trae el registro** (no se adivina el nombre de
  pila) y el saludo **no** contradice R6/D15 (nada del invitado se ve en la vista colapsada): el
  saludo vive en el contenido revelado, como el resto de los datos del invitado.
- «**cabecera tolerada**» (del cambio de §13): una columna de `guests` cuya **ausencia no impide
  responder** a la consulta (RF-15). El teléfono ya viene en la petición y el nombre registrado es
  **opcional** (como el mensaje), así que una consulta puede resolverse sin `guest_name`; solo se
  falla cuando **de verdad no se puede leer la fila**.

### 1.3 Los pedidos, punto por punto

Las **cinco** filas originales, las **cuatro** que añadió el cambio de requisitos de §13 y las **dos**
que añade el cambio de §14:

| # | Petición (texto de quien la pide, resumido) | Requisitos |
| --- | --- | --- |
| 1 | «Al abrirse la página se debe buscar si el invitado ya contestó previamente (personalizadas); si ya respondió, los datos desplegados y bloqueados, con un botón **editar**.» | RF-1, RF-2, RF-10 |
| 2 | «El nombre del invitado debería aparecer **antes** que el del acompañante y los inputs de asistencia.» | RF-3 |
| 3 | «Los datos del invitado **escondidos** tras un botón **"Responder invitación"**; al contestar, **solo** el agradecimiento y el botón para editar.» | RF-1, RF-3, RF-9 |
| 4 | «Los inputs de números de invitados deberían ser **combo box** para que sea explícito el límite de boletos.» | RF-4 |
| 5 | «En genéricas y públicas, primero el **teléfono** tras el botón de responder; luego buscar si ya existe una respuesta asignada a ese teléfono para permitir editar.» | RF-5, RF-6, RF-7, RF-8 |
| 6 | «A quien rechaza la invitación también se le permite dejar un mensaje para la pareja.» | RF-13 |
| 7 | «En lugar de decirle gracias por tu respuesta, sería algo como "Lamentamos que no puedas acompañarnos. Gracias por tu respuesta."» | RF-12 |
| 8 | «En las invitaciones personalizadas sí debería verse el nombre del invitado antes de dar Click en Responder invitación, con un saludo al invitado.» | RF-14 |
| 9 | «Cuando quiero buscar un número ya registrado en las invitaciones generales me contesta con invalid data.» | RF-15 |
| 10 | «Necesitamos un código de error específico para la fila mal formada: que no se confunda con `INVALID_DATA`.» | RF-16 |
| 11 | «Un código `PUBLIC` en una boda genérica debería aceptarse como "sin tope".» | RF-17 |

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
  **íntegras** (`n` sigue significando sin tope). El rango del combo es **por campo** (estado real
  de la Fase 5/T11): **adultos `1..cupo`** (sin el 0: una confirmación exige al menos un adulto) y
  **niños `0..cupo`**; el 0 heredado de un dato antiguo se normaliza al mostrarse (M1, RF-4).
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
  estados y su reversibilidad (004 RF-10) no cambian. **[Actualizada por D20 (§13): en un rechazo el
  aviso deja de ser la copy `OK` y pasa a la del rechazo (RF-12).]**
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

- **D17 — Campos de la asistencia solo con «Sí, asistiré»** y **D18 — el rechazo no muestra adultos,
  niños ni restricciones**: vienen del cambio de requisitos anterior (Fase 5 de `tasks.md`,
  RF-4/RF-11, R8–R11) y se dan por vigentes; el cambio de §13 los **matiza solo en el mensaje**: el
  **mensaje** de un rechazo **se muestra** (panel de lectura y precarga al editar) y **viaja** en el
  envío; adultos, niños y restricciones siguen sin mostrarse ni enviarse (RF-13, D18 matizada).
  **D17 se enmienda también solo en el mensaje:** los campos que existen **únicamente** con «Sí,
  asistiré» son **adultos, niños y alergias**; el **mensaje** existe **también** con «No podré
  asistir» (RF-13).
- **D19 — saludo con el nombre** y **D20 — copy del aviso del rechazo**: son las **decisiones del
  cambio de §13**, con su redacción completa y su alternativa descartada en **§13.1-bis** (y sus
  requisitos, en RF-14 y RF-12). El pedido 6 (mensaje al rechazar) se enuncia como **RF-13** (sin
  decisión nueva: es alcance de la app) y el 9 (consulta tolerante) como **RF-15** con **R13**.

## 3. Usuarios

- **El invitado personalizado que ya contestó.** Abre su enlace y quiere **ver** lo que respondió y,
  si hace falta, **editarlo** sin rellenar nada desde cero ni perder el mensaje o las restricciones
  que escribió.
- **El invitado personalizado que aún no contesta.** No quiere el formulario (ni sus datos) encima
  mientras lee la invitación: pulsa «Responder invitación» cuando esté listo y, al abrirlo, espera
  ver su nombre saludándole para confirmar que la invitación es suya (RF-14, §13).
- **El invitado que no puede asistir.** Aunque rechace, quiere **dejar un mensaje** a la pareja, poder
  **volver a verlo** cuando reabre su respuesta y recibir un agradecimiento acorde («Lamentamos que no
  puedas acompañarnos…»), no el genérico de una confirmación (RF-13, RF-12; §13).
- **El invitado genérico o público.** Pulsa «Responder invitación», escribe su **teléfono**, pulsa
  **«Continuar»** y espera que el sistema **reconozca** si su respuesta ya existe (para verla y
  editarla) o le dé el formulario limpio si es la primera vez; también quiere ver su límite de
  boletos de forma explícita al elegir asistentes.
- **El invitado que cambia de opinión.** En cualquier tipo, estando el plazo abierto, usa «Editar» o
  vuelve a contestar; los estados del libro siguen siendo reversibles (004 RF-10).
- **La pareja.** Nada cambia para ella: las respuestas siguen llegando a su libro con las mismas
  columnas y estados; esta spec no añade escrituras en la hoja `guests` (la consulta solo lee).
- **Quien organiza y publica.** Debe redesplegar el script del servicio cuando el contrato gana
  `lookup` (los tres artefactos se actualizan a la vez, RF-8) y, en el cambio de §13, cuando la
  **consulta cambia de comportamiento** (tolerancia de cabeceras, RF-15); los libros no cambian.
- **Quien comprueba la invitación.** Necesita que un servicio caído, una consulta fallida, un plazo
  vencido o un código desconocido se vean igual de claro que hoy, y que **nunca** se responda a
  ciegas ni se pierda lo escrito; en el cambio de §13, además, que un fallo de la consulta **se
  distinga** de una cabecera que no hacía falta (RF-15, §13.3).

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
- **HU-15:** Como invitado **personalizado** quiero **ver mi nombre saludándome** («Hola, \<mi
  nombre\>») al abrir el contenido de respuesta, para confirmar que la invitación es mía antes de
  contestar (RF-14, §13).
- **HU-16:** Como invitado que **rechaza** quiero poder **dejar un mensaje** a la pareja, **volver a
  verlo** cuando reabro mi respuesta (panel de solo lectura y al editar) y ver un agradecimiento que
  reconozca que no podré ir («Lamentamos que no puedas acompañarnos. Gracias por tu respuesta.»), para
  despedirme con cariño aunque no asista (RF-12, RF-13, §13).
- **HU-17:** Como invitado de una invitación **genérica o pública** que **vuelve** quiero que la
  consulta de mi teléfono funcione aunque el libro no declare alguna columna que no hace falta para
  reconocerme, para no encontrarme con «los datos de esta invitación están incompletos» sin motivo
  (RF-15, §13).

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
  | **`respondido`** | **Agradecimiento**, **datos de la respuesta en solo lectura** y botón **«Editar»**. El agradecimiento es la copy `OK` del contrato (004 §4.1) y, cuando la respuesta registrada es un **rechazo**, la copy del rechazo (RF-12, D20, §13). | El resultado y el cambio de estado, con el foco en el panel. |
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
  contrato es la misma y 004 RF-10 (rechazo registrado) no cambia. **[Actualizado por RF-12 (§13):
  en un rechazo ya **no** se muestra la copy `OK`, sino la **copy del rechazo**; una respuesta
  `confirmed`/`updated` sigue mostrando la de `OK`.]**
- El bloque conserva su ancla y su título; la sección no se apaga ni se oculta (004 RF-12).
- Los nombres de los estados son un **concepto de interfaz en español**: en el código, los
  identificadores van en inglés (constitución, principio 6).

**RF-2 — La respuesta previa de la personalizada se muestra y se usa para editar** (punto 1)

- CUANDO la invitación sea **personalizada** y el servicio devuelva una **respuesta previa** (004
  RF-6, ya resuelta al abrir), el bloque deberá arrancar en estado **`respondido`** (D2): datos en
  solo lectura (nombre del titular, acompañante cuando exista, asistentes confirmados en adultos y
  niños, mensaje y restricciones si los escribió, y la fecha de la respuesta cuando se conozca) y
  botón «Editar». **En una respuesta `rejected`** el panel muestra el nombre del titular, la fecha y el
  **mensaje** (si lo hay), pero **no** asistentes, restricciones ni niños (RF-13, D18 matizada solo en
  el mensaje).
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
- **[Ampliado por RF-14 (§13):]** en la invitación **personalizada**, el contenido que revela
  «Responder invitación» abrirá con el **saludo** «Hola, \<nombre completo del titular\>», **antes**
  del campo del nombre (que sigue en solo lectura, RF-2) y **antes** que el aviso de los lugares
  reservados («Hemos reservado … en tu honor»): el orden es **saludo → nombre (solo lectura) →
  lugares reservados → resto del formulario**. El saludo es un dato del invitado y por eso vive
  **dentro** del contenido revelado, no en la vista colapsada (D15/HU-14 intactos). En `respondido` el
  saludo va sobre el panel de solo lectura (RF-14).

**RF-4 — Selección de asistentes: combo box cuando el cupo es numérico** (punto 4; decisión R1)

- CUANDO el cupo que corresponda sea **numérico**, el campo de **número de asistentes** (adultos y
  niños) deberá ser una **lista desplegable** (combo box) con las opciones enteras de su rango, en
  lugar de un campo numérico libre: **adultos `1..cupo`** (sin el 0) y **niños `0..cupo`** (estado
  real de la Fase 5/T11 y de RF-11).
- DONDE la invitación sea **personalizada**, el cupo de adultos será `adults_guests` y el de niños,
  `child_guests` (004 RF-9); el combo de niños solo se mostrará cuando `child_guests` sea mayor que
  cero (como hoy); los dos cupos son numéricos, así que ambos campos son combo cuando se muestran.
- DONDE la invitación sea **genérica**, el combo de adultos ofrecerá las opciones desde 1 hasta el
  **límite del código** (004 RF-9); la genérica y la pública **no** ofrecen niños (004 D12 intacto).
- DONDE el límite sea **`n`** (la pública, sin tope; 004 RF-9/D12), el campo deberá ser un **campo
  numérico libre** con la **validación existente** (enteros ≥ 1): `n` sigue significando **sin
  tope**, la app **no** declara ningún máximo artificial y la 004 RF-9/D12 quedan **íntegras** (R1).
- El cupo que pinta el combo se tomará de la **lectura vigente** en esa sesión: en la personalizada,
  de los cupos de la invitación resuelta por `resolve` (que no cambian durante la sesión); en la
  genérica y la pública, del `limit` que devuelve la **consulta** `lookup` (RF-5, RF-8), que es la
  lectura más reciente y la única disponible cuando el formulario aparece. Si difirieran, **manda la
  de la consulta** y el servicio sigue siendo la autoridad en el envío (`OVER_LIMIT`; M2).
- SI el cupo máximo correspondiente es **0**, ENTONCES el combo **no** se mostrará (no hay ninguna
  opción que ofrecer) y se conservará que lo único posible es **rechazar** (004 RF-9, D21 intactos).
- El combo de **adultos** no ofrece el **0** (`1..cupo`): confirmar exige al menos un adulto, así que
  no se ofrece una opción que la validación previa rechazaría; un **0 heredado** de un dato antiguo se
  **normaliza** a 1 al mostrarse el combo (RF-11, `attendeeValue`). El combo de **niños** sí incluye el
  0 (`0..cupo`). El **cupo explícito** es lo que el punto 4 pide (M1).
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
  RF-2). **En un `rejected`** el panel de solo lectura muestra el nombre, la fecha, el teléfono y el
  **mensaje** (si lo hay), y **no** asistentes, restricciones ni niños (RF-13, D18 matizada solo en el
  mensaje). El teléfono aparece porque es un dato **propio** que el invitado acaba de escribir, ya está
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
  formulario y quedan **solo** el agradecimiento, los datos de la respuesta en **solo lectura** y el
  botón **«Editar»** (RF-1). El agradecimiento es la copy `OK` para una confirmación y la **copy
  del rechazo** cuando el envío era un rechazo `rejected` (RF-12, §13).
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
- **En un rechazo (`rejected`) el panel de solo lectura cambia (§13, RF-13, D18 matizada solo en el
  mensaje):** se muestran el nombre, la fecha, el teléfono y **el mensaje** (si lo hay), pero **no** los
  asistentes, las restricciones ni los niños: esos campos no existen en un rechazo y no se pintan.

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
  declara ningún máximo artificial), el borde incluido, el `OVER_LIMIT` y el «cupo cero → solo
  rechazar» (D21) quedan **intactos**; las matizaciones son que con cupo 0 el combo **no** se muestra
  (D4) y el rango **por campo** (adultos `1..cupo` sin el 0, niños `0..cupo`).
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
- **004 D26, D8, D9, D15 — INTACTOS; 004 D17 — MATIZADA (igual que D18, solo en el mensaje).**
  Ningún requisito de la 004 queda derogado **por completo**: solo la frase de 004 RF-6 citada arriba
  y las formas de presentación indicadas. **004 D17** (los campos de la asistencia solo con «Sí,
  asistiré») se **enmienda solo en el mensaje** (el mensaje existe también con «No podré asistir»,
  RF-13); adultos, niños y alergias siguen solo con «Sí, asistiré».
- **[Cambio de §13 — los RF de la 004 que quedan afectados.]**
  - **004 RF-8 — MATIZADA (el mensaje también al rechazar).** La obligatoriedad de nombre y teléfono
    al rechazar y la llave por teléfono **no** cambian (D26 intacta); lo que se amplía es el
    **contenido** de un rechazo: el `mensaje` **sí viaja** (RF-13, §13). Alergias, adultos y niños
    **siguen** omitiéndose en un rechazo (004 RF-8/D26 y D18 matizada solo en el mensaje).
  - **004 D18 — MATIZADA solo en el mensaje (y esto es lo único que cambia de D18).** D18 seguía
    diciendo que un rechazo no muestra **nada** de la asistencia (ni adultos, niños, mensaje ni
    restricciones). El cambio de §13 **retira de D18 únicamente el mensaje**: el **mensaje** de un
    rechazo **se escribe, se envía y se lee** (panel de solo lectura en `respondido` y en `cerrado`
    con respuesta previa, y precarga al editar, RF-13). **Siguen sin mostrarse ni enviarse** en un
    rechazo los **adultos, los niños y las restricciones/alergias** (esos campos no existen con «No
    podré asistir»). Los asistentes de un rechazo en el libro siguen siendo 0 o vacío.
  - **004 RF-14 — MATIZADA (el aviso del rechazo).** El resultado del envío no cambia en sus
    códigos ni en la conservación del formulario; lo único que cambia es **qué agradecimiento** se
    muestra tras un `OK` cuyo contenido era un rechazo (RF-12, D20, §13).
  - **004 RF-13 — MATIZADA (el veredicto de la consulta deja de ser opaco).** El servicio sigue
    fallando de forma visible, pero una consulta de la genérica/pública **no** falla por una
    cabecera que no necesita (RF-15, §13); solo falla cuando **de verdad** no se puede leer la fila.
  - **004 RF-6 y RF-10 — INTACTAS.** La resolución de la personalizada, el `viewed` y la
    reversibilidad de los estados no se tocan en este cambio (§13).
- **[Cambio de §13 — qué NO cambia.]** El **modelo del libro** (`guests`: hojas, columnas,
  estados, códigos) no gana ni pierde nada; el **contrato** **no** cambia (la copy del rechazo es un
  rótulo de interfaz que vive con su componente, no una entrada del módulo), luego sigue `1.1.0`
  (RF-12, §13.4). Nada de esto toca la lista de códigos de error de 004 §4.1.
  **[Actualizado por §14:]** el §13 **sigue** sin cambiar el contrato (la copy no sube la versión);
  quien lo cambia es el **§14** (código `MALFORMED_GUEST` + regla de `PUBLIC` en boda genérica), que
  sube `CONTRACT_VERSION` a **`1.2.0`**. Lo de «nada de esto toca la lista de códigos de error» vale
  **solo para el §13**.
- **[Cambio de §14 — los RF y D de la 004 que quedan afectados.]**
  - **004 §4.1 — AMPLIADA (un código nuevo).** Gana **`MALFORMED_GUEST`** (código mal formado: existe
    pero su `limit` no cumple la regla de su tipo). Ninguna entrada se retira ni se renombra (RF-16).
  - **004 RF-13 — MATIZADA (el reparto del fallo de lectura).** El **código** con `limit` mal formado
    deja de ser `INVALID_DATA` y pasa a `MALFORMED_GUEST`; las demás causas de `INVALID_DATA` (maestro,
    libro, hoja, cabecera, `status`, cifras, personalizada) **no** cambian (RF-16, D21).
  - **004 RF-9 y 004 D12 — MATIZADAS (quién puede llevar `n`).** `n` sigue significando **sin tope** y
    la app sigue sin declarar un máximo (R1 intacta); lo que cambia es que el código **`PUBLIC`** de una
    boda **genérica** también lo lleva (RF-17, D22).
  - **004 RF-6, RF-7, RF-8, RF-10, RF-11, RF-17 y RF-18 — INTACTAS.** Ni el modelo del libro ni la
    escritura ni el `viewed` ni el plazo ni la caché cambian; solo cambia la **interpretación** de una
    fila de la hoja `generic` (RF-17) y el **reparto** de un código de error (RF-16).

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
- **[Cambio de §13 — documentos añadidos.]**
  - **`docs/servicio-invitados.md`.** Debe aclarar que la consulta `lookup` **tolera** las cabeceras
    `guest_name`/`status` ausentes (RF-15) y que un **rechazo puede llevar mensaje** (RF-13); **no**
    recoge la copy del rechazo (es un rótulo de interfaz que vive con su componente, §13.4). La
    prueba de sincronía (`test/serviceContract.test.js`) lo vigila en lo que **sí** es contrato.
  - **`gas/README.md`.** Debe **ampliar** la comprobación manual de `lookup` con los casos de §13.3
    (libro sin `guest_name`/`status` → no falla; sin `phone` → sí falla; caché ausente → no es un
    fallo) y el aviso de **redesplegar** por el cambio de comportamiento (RF-15).

Mientras esos documentos no se actualicen, el cambio de alcance no queda documentado donde la
constitución y las reglas permanentes lo exigen (I6).

## 6. Requisitos no funcionales

- **RNF-1 Accesibilidad del bloque, de los combos y del panel de lectura.**
  - **Botones:** «Responder invitación», «Continuar», «Editar» y «Reintentar» son **botones reales**,
    alcanzables por teclado y con foco visible; el que revela el panel anuncia su estado **expandido o
    contraído** (`aria-expanded` con el panel asociado).
  - **Cambios de estado:** cada transición relevante se anuncia en una **región viva**
    (`role="status"`), y al revelar un paso el foco va al **primer campo**; al pasar a `respondido`,
    al panel de datos (encabezado con `tabIndex={-1}`) (004 RNF-6 intacto). El **saludo** de RF-14 es
    texto visible (no un control) y no introduce foco propio.
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
- **Límite `n` (pública):** campo numérico libre con la validación existente (enteros ≥ 1; `min={1}`); la app no
  inventa un máximo y la 004 RF-9/D12 quedan íntegras (R1).
- **Rango del combo por campo:** adultos `1..cupo` (sin el 0; un 0 heredado se normaliza a 1) y niños
  `0..cupo`; elegir un total inválido se rechaza con el aviso de la validación existente
  (`OVER_LIMIT`); el servicio lo rechaza igual (RF-4, M1).
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
- **Saludo con el nombre (personalizada, §13):** al revelar «Responder invitación», el contenido abre
  con «Hola, \<nombre completo del titular\>» y luego el campo del nombre en solo lectura; el nombre
  no se recorta ni se adivina (RF-14). Con `guestName` presente siempre lo hay (la personalizada sin
  nombre no se personaliza: 004 RF-13/RF-6, ya resuelto antes del bloque).

**Mensaje y agradecimiento del rechazo (§13)**

- **Rechazo con mensaje:** con «No podré asistir» **existe** el campo del mensaje y, si el invitado
  escribe algo, el mensaje **se envía** (junto con nombre y teléfono, obligatorios al rechazar),
  **se muestra** en el panel de solo lectura de `respondido` y de `cerrado` con respuesta previa, y
  **se precarga** en el campo editable al pulsar «Editar»; alergias, adultos y niños **no** existen
  en un rechazo y **no** se envían (RF-13, D18 matizada **solo en el mensaje**).
- **Rechazo sin mensaje:** el rechazo se envía igual (el mensaje es opcional) y el aviso de
  `respondido` es la **copy del rechazo**, no la de `OK` (RF-12, D20). Un mensaje **sin escribir**
  **no** se pinta (ni en el panel ni en la precarga): no se inventa ni se muestra vacío.
- **`rejected` en lectura (arranque o tras `Editar`):** el panel de solo lectura de un rechazo
  muestra el **mensaje** registrado (si lo hay) y **no** muestra adultos, niños ni restricciones
  (D18 matizada solo en el mensaje); al pulsar «Editar», el mensaje se precarga en su campo junto con
  el nombre registrado (editable en la genérica/pública; en la personalizada, el titular sigue en solo
  lectura).
- **Rechazo antiguo con mensaje ya en el libro:** al abrirlo (arranque de la personalizada con
  respuesta previa, `respondido` de la consulta en la genérica/pública, o `cerrado` con respuesta
  previa), ese mensaje **se muestra** en el panel de lectura. **Esto no es un error de datos**: es la
  D18 matizada solo en el mensaje; los asistentes siguen sin mostrarse aunque el libro los tenga en 0.
- **Confirmación normal:** el aviso sigue siendo la copy `OK` (RF-12 no aplica) y el mensaje, si lo
  hay, se muestra como cualquier otro dato (sin cambios).

**Tolerancia de la consulta a las cabeceras (§13)**

- **Libro sin `guest_name`:** la consulta **no** falla; devuelve la fila con `name: null` (nombre
  registrado opcional, como el mensaje) y la app muestra la respuesta con nombre vacío y permite
  editarlo (RF-15, RF-10).
- **Libro sin `status`:** la fila se localiza por teléfono y se devuelve como **primera respuesta**
  (`response: null`): sin `status` no consta ninguna respuesta (RF-15, 004 RF-10).
- **Libro sin `phone`:** la consulta **no** puede localizar la fila: es un fallo **real** de lectura
  y sigue devolviendo `INVALID_DATA` con su aviso y su reintento (RF-15, 004 RF-13).
- **Cabecera `message`/`restrictions` ausente:** no invalida nada (ya era opcional); la respuesta va
  sin ese dato.
- **Maestro sin `generic_json_cache`:** no rompe la resolución (la caché es una copia, 004 RF-18); la
  consulta resuelve el código leyendo la hoja `generic` y **no** acaba en `INVALID_DATA` por eso
  (RF-15, D14 intacta).

## 8. Casos que no cambian (spec 004, íntegros)

- Los **tres tipos** decididos por el maestro y devueltos por el servicio (004 RF-5, D20); el
  parámetro `guest` y la configuración del despliegue (004 RF-2, RF-15); el **plazo** del maestro y
  su rechazo en el envío (004 RF-11); los **cuatro estados** del libro y su reversibilidad, y el
  `viewed` al abrir la personalizada (004 RF-10, RF-6); el **teléfono como llave** con deduplicación
  por fila, el `guest_id` autoincremental, el cupo escrito en `adults_guests` y el código no
  registrado (004 RF-7, RF-8, D5–D7); el cupo por envío y `n` sin tope (004 RF-9, D12); la **caché
  de códigos** (004 RF-18, matizada en D14); los **códigos de error** de 004 §4.1 (ninguno se retira
  ni se renombra; `lookup` no añade ninguno) **[matizado por §14: la tabla gana `MALFORMED_GUEST` y su
  causa, y `PUBLIC` con `"n"` pasa a valer en una boda genérica]**; la degradación visible y el bloque deshabilitado sin
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
- **[Cambio de §13 — lo que queda fuera de alcance.]**
  - **Mostrar los asistentes o las restricciones de un rechazo:** D18 sigue vigente para ellos (un
    rechazo no muestra adultos, niños ni restricciones). **El mensaje ya no está aquí**: el cambio de
    §13 lo **incluye** en el alcance (se muestra y se precarga, RF-13); esta viñeta solo deja claro
    que lo excluido son los otros campos.
  - **Renombrar o retirar códigos de error, o añadir uno nuevo**: la tolerancia de RF-15 se apoya en
    los códigos **existentes** de 004 §4.1 (`INVALID_DATA` solo cuando de verdad no se lee la fila).
    **[Derogada en su tercera parte por §14:]** el cambio de §14 **sí** añade un código nuevo
    (`MALFORMED_GUEST`, R14/RF-16) porque el reparto actual de `INVALID_DATA` es justo lo que confunde.
    Sigue vigente que no se retira ni se renombra ninguno.
  - **Subir `CONTRACT_VERSION`**: la copy del rechazo es un **rótulo de interfaz** que vive con su
    componente, **no** una entrada del módulo ni un cambio de forma del intercambio; el contrato sigue
    siendo `1.1.0` (§13.4). Cambiar la forma (campos, acciones, códigos) sí exigiría subirla y **no**
    es el caso.
    **[Matizada por §14:]** la viñeta era **del cambio de §13** y sigue vigente **para él** (una copy no
    sube la versión); pero el §14 **sí** cambia la forma (un código de error más) y por eso **sube** el
    contrato a `1.2.0` (RF-16, R14). Lo contrario («cambiar la forma sí exigiría subirla») es,
    precisamente, lo que el §14 aplica.
  - **Cambiar el modelo del libro** para el mensaje del rechazo: el mensaje ya se escribe en la
    columna `message` (la que existe); no se añade ninguna columna (004 §8).
  - **Exigir `guest_name` en la consulta**: deja de ser obligatorio para responder (RF-15); sigue
    escribiéndose en el envío (004 RF-8 intacta).
- **[Cambio de §14 — lo que queda fuera de alcance.]**
  - **Cambiar el `guest_type` del maestro** para que la boda con `PUBLIC` sea `public`: el cambio es de
    **interpretación** dentro de una boda `generic` (RF-17, D22), no de tipo de boda.
  - **Aceptar `"n"` en cualquier código de una boda genérica**: solo el código reservado `PUBLIC` lo
    lleva; un `limit` mal escrito en un `…_GEN` sigue siendo **`MALFORMED_GUEST`** (RF-17, RF-16).
  - **Borrrar la fila `PUBLIC` del libro como sustituto del código nuevo**: el arreglo de **datos**
    sigue siendo válido (y decidible por quien publica), pero **no** sustituye a RF-16: el reparto
    «existe y está mal formado» ≠ «no existe» ≠ «no se puede leer» es del **contrato**.
  - **Un código de error por cada causa de datos del maestro o del libro**: `INVALID_DATA` conserva sus
    causas; el único código nuevo es el del **código** mal formado (D21).
  - **Guardar el `limit` de una fila en el propio enlace o en la app**: el cupo lo sigue diciendo el
    **libro**, nunca la app (004 D20/RNF-3).

## 10. Verificación

- `npm test` (`node --test`, sin instalar nada) y `npm run build` en **verde**, como en cada tarea.
- **Pruebas de lógica pura (co-locadas):** la **máquina de estados** completa —los cinco estados de
  interacción más `cerrado` y `degradado`, con sus transiciones (arranque, «Responder invitación»,
  «Continuar», resultado de la consulta, «Editar», envío aceptado o fallido, vencimiento del
  plazo)—, con el «ahora» por parámetro donde haga falta; la precarga de la edición desde la
  respuesta previa (incluido `rejected`); los **rangos de los combos** por campo (adultos `1..cupo` sin
  el 0, niños `0..cupo`, cupo 0 sin combo, `n` campo libre con `min={1}`, y la normalización de un 0
  heredado de adultos a 1); la **interpretación de la respuesta de `lookup`** (fila con
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
  5. selección de asistentes: combos por campo (adultos `1..cupo` sin el 0, niños `0..cupo`), cupo 0
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
- **[Cambio de §13 — verificación automática.]** `npm test` y `npm run build` en verde. La lógica
  pura cubre: el **cuerpo del envío de un rechazo con mensaje** (el mensaje viaja; adultos, niños y
  restricciones no; `rsvpPayload`), que el **rechazo sin mensaje** sigue enviando un rechazo válido,
  y que **la composición del panel de solo lectura de un rechazo** (lógica pura, no el componente)
  **conserva el mensaje** y **omite** adultos, niños y restricciones. La **copy del rechazo** es un
  rótulo **de interfaz que vive con su componente** (`Rsvp.jsx`, §13.4) y se verifica **en la
  interfaz**: prueba **co-locada del componente** y/o el **punto manual 8** de abajo; **no** es un
  literal del módulo del contrato, así que **no** la vigila `test/serviceContract.test.js` (y ese
  contrato **no** cambia: sigue `1.1.0`). La **tolerancia del servicio** (RF-15) es de `gas/Code.gs`:
  no se prueba en la app; se comprueba **a mano** (abajo).
- **[Cambio de §13 — verificación manual nueva]** (se añade a la lista de arriba, que se conserva;
  el veredicto va en «Verificación» de `AGENTS.md`):
  8. **Mensaje al rechazar, su agradecimiento y su lectura:** en la **personalizada** y en la
     **genérica/pública**, elegir «No podré asistir» → **aparece el campo del mensaje** (y solo ese:
     ni alergias, ni asistentes, ni niños) → escribir un mensaje y enviar → el aviso es «Lamentamos
     que no puedas acompañarnos. Gracias por tu respuesta.» (no la de `OK`), **el mensaje se ve en el
     panel de solo lectura** y la fila del libro queda en `rejected` con el **mensaje escrito** y
     **sin** asistentes (0 o vacío) ni restricciones; un rechazo **sin** mensaje se envía igual (y no
     se pinta un mensaje vacío); una confirmación sigue mostrando el agradecimiento de `OK`.
  9. **Mensaje del rechazo en `cerrado`, al `Editar` y si ya estaba en el libro:** con la respuesta
     de un rechazo (recién enviada, traída por la consulta o **antigua** ya escrita en el libro), al
     abrir la invitación el **mensaje registrado se muestra** en el panel de solo lectura
     (`respondido` y `cerrado` con respuesta previa); al pulsar «Editar», el mensaje se **precarga**
     en su campo; en ningún caso se muestran adultos, niños ni restricciones de un rechazo.
  10. **Saludo con el nombre (personalizada):** al pulsar «Responder invitación» (`editando`), el
      contenido abre con «Hola, \<nombre completo\>» **antes** del nombre (solo lectura) y **antes**
      del aviso de lugares reservados; **antes** de pulsar el botón, el saludo **no** se ve; en
      `respondido` (respuesta previa o recién enviada), el saludo aparece **sobre el panel de solo
      lectura** (y no dentro de él).
  11. **Consulta tolerante (diagnóstico del `invalid data`):** con un libro de invitados **sin**
      `guest_name` (y/o **sin** `status`), la consulta de un teléfono **con fila** y **sin fila**
      responde bien (nombre vacío u `response: null` según el caso) y **no** devuelve `INVALID_DATA`;
      con el libro **sin** `phone`, devuelve `INVALID_DATA` con su aviso; con el maestro **sin**
      `generic_json_cache`, la resolución y la consulta siguen funcionando. La comprobación manual
      del servicio de §13.5 vive en `gas/README.md`.
- **[Cambio de §14 — verificación automática.]** `npm test` y `npm run build` en verde. El **módulo**
  declara `MALFORMED_GUEST` (código, mensaje y `retryable`) y su `CONTRACT_VERSION` es `1.2.0`; el
  **documento** lo reproduce y su tabla coincide **en conjunto y en el mensaje de cada código**;
  `gas/Code.gs` declara la **misma** versión (lo vigila `test/serviceContract.test.js`, sin cambio de
  regla). La **lógica pura** de la app cubre el ajuste de §14.7: `interpretInvitation` **e**
  `interpretLookup` aceptan `{ type: "generic", limit: "n" }` sin descartar la invitación y siguen
  rechazando un genérico con `limit` no entero > 0; `guestLimit`, `attendeeLimits`, `seatsText`,
  `isWithinGuestLimit` y `validateRsvp` se comportan como «sin tope» con ese modelo. El **servicio**
  (Apps Script) **no** tiene runner: su parte va **a mano** (abajo).
- **[Cambio de §14 — verificación manual nueva]** (la lista de arriba se conserva; el veredicto va en
  «Verificación» de `AGENTS.md`):
  12. **Código mal formado → `MALFORMED_GUEST` (no `INVALID_DATA`).** Con un libro de **prueba** cuya
      hoja `generic` tenga un código con `limit` inválido (`"x"`, `0` o vacío): `resolve` y `lookup` de
      ese código responden `MALFORMED_GUEST`; la app muestra el **aviso propio del código** (no «los
      datos de esta invitación están incompletos») con su reintento; un código **inexistente** sigue
      siendo `UNKNOWN_GUEST` y un libro **sin `phone`** sigue siendo `INVALID_DATA`.
  13. **`PUBLIC` en una boda genérica → sin tope.** Con una fila `PUBLIC` (`limit = "n"`) en la hoja
      `generic` de una boda **`generic`** de prueba: `resolve` y `lookup` responden `ok: true` con
      `type: "generic"` y `limit: "n"`; la app **no** descarta la invitación, anuncia **sin tope**,
      ofrece el **campo numérico libre** (sin máximo) y el envío con `PUBLIC` **no** da `OVER_LIMIT` por
      cupo. Un `PUBLIC` con `limit` **distinto** de `"n"` responde `MALFORMED_GUEST`. Los códigos
      corrientes `…_GEN` siguen resolviendo con su `limit` numérico.

## 11. Decisiones cerradas

**No queda ninguna pregunta abierta.** Las tres de la primera versión, las cuatro que abrió el QA, las
dos del cambio de requisitos de §13 (R12 y R13) y las dos del cambio de §14 (R14 y R15) están resueltas
e integradas en los requisitos:

1. **R1 — Combo con límite `n`.** «Si es `n`, es sin límite aparente; si es numérico, usar ese número
   como límite.» El combo se muestra **solo cuando el cupo es numérico** (adultos `1..adults_guests`
   en la personalizada, `1..limit` en la genérica con límite entero —sin el 0—, y niños `0..cupo`);
   cuando el límite es `n` se
   mantiene un **campo numérico libre** con la validación existente (enteros ≥ 1). **No** se declara
   ningún máximo artificial y **no** se deroga nada de la 004 RF-9/D12: `n` sigue significando sin
   tope (D4, RF-4). **[Matizada por §14 (R15, RF-17):]** desde el cambio de §14 un cupo `n` **también**
   puede llegar de una boda **genérica** (el código `PUBLIC` con `"n"`); la regla de este punto no
   cambia —`n` = sin tope y campo libre—, solo **quién** puede llevarlo.
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
8. **R12 (cambio de §13 · agradecimiento del rechazo) — El aviso de un rechazo deja de ser la copy
   `OK`.** Pasa a la **copy del rechazo** («Lamentamos que no puedas acompañarnos. Gracias por tu
   respuesta.»): afecta al estado `respondido` y al aviso del envío aceptado de un `rejected`; una
   confirmación sigue con la de `OK` (RF-12, D20).
9. **R13 (cambio de §13 · consulta tolerante) — La consulta no falla por una cabecera que no
   necesita.** `guest_name` y `status` dejan de ser obligatorios para responder; solo `phone` sigue
   siéndolo (sin él no hay fila que localizar). Un fallo pasa a ser legible para quien diagnostica
   (comprobación manual en `gas/README.md`) y su veredicto va en «Verificación» (RF-15, §13.3).
10. **R14 (cambio de §14 · código mal formado) — El código que existe pero no cumple la regla de su
    tipo tiene error propio (`MALFORMED_GUEST`).** Se decidió con quien pide el cambio: `INVALID_DATA`
    se **reserva** a lo que impide leer o escribir de verdad, `UNKNOWN_GUEST` sigue siendo «no existe» y
    el código mal formado pasa a `MALFORMED_GUEST`. Es un cambio **de forma** del contrato (un código
    más) y por eso sube `CONTRACT_VERSION` a **`1.2.0`** en módulo y script (RF-16, D21).
11. **R15 (cambio de §14 · `PUBLIC` en boda genérica) — `PUBLIC` con `"n"` vale por sin tope también en
    una boda genérica.** El `guest_type` del maestro **no** se toca; la excepción es **solo** para el
    código reservado `PUBLIC` con `limit = "n"` y cualquier otro `limit` que no cuadre con su regla cae
    en `MALFORMED_GUEST`. Obliga a ajustar la **lectura de la app** (`codeLimit`/interpretaciones,
    §14.7) para que no descarte una invitación sin tope de tipo genérico (RF-17, D22).

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
| **M1** rango del combo | **RF-4/D4**: el rango es **por campo** (adultos `1..cupo` **sin** el 0, niños `0..cupo`; un 0 heredado de adultos se normaliza a 1) y un total inválido se rechaza con el aviso existente (`OVER_LIMIT`), validación previa y servicio. |
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

### 12.1 Trazabilidad del cambio de requisitos (§13)

> **Nota de lectura (M4).** Este apartado pertenece al **cambio de §13**, que se redacta después; se
> deja aquí, junto a la trazabilidad del QA (§12), para no duplicar tablas. Se lee **conjuntamente**
> con §13: los identificadores (P6…P9, Diag.) y los RF/D/R (`RF-12`…`RF-15`, `D19`/`D20`, `R12`/`R13`)
> se detallan allí.

| Pedido / hallazgo | Cómo queda resuelto |
| --- | --- |
| **P6** mensaje al rechazar | **RF-13**: el campo `mensaje` existe también con «No podré asistir»; el rechazo **envía**, **muestra** (lectura en `respondido`/`cerrado` con respuesta previa) y **precarga** al editar ese mensaje; alergias, asistentes y niños siguen fuera del rechazo (D18 **matizada solo en el mensaje**; 004 D26 intacta). Ajusta `showsAttendanceFields` (deja de gatear el mensaje), la **región viva del rechazo** (`attendanceNotice`, deja de anunciar «ni mensaje»), `rsvpPayload`, `summaryData` y `ResponseSummary`, con la **composición del panel en lógica pura**. |
| **P7** agradecimiento del rechazo | **RF-12**, **D20**, **R12**: el aviso de un `rejected` pasa a la copy del rechazo en `respondido` y en el envío aceptado; una confirmación sigue con la de `OK`. La copy es un **rótulo de interfaz que vive con su componente** (`Rsvp.jsx`), **no** en el módulo del contrato; **no** cambia la versión ni la forma (§13.4). |
| **P8** saludo con el nombre (personalizada) | **RF-14**, **D19**: «Hola, \<nombre completo del titular\>» en el contenido revelado: en `editando` abre el contenido antes del nombre (solo lectura) y de los lugares reservados; en `respondido` va sobre el panel de solo lectura; nada del invitado en la vista colapsada (D15/HU-14 intactos). `Rsvp.jsx`. |
| **P9** `invalid data` en la consulta de la genérica | **RF-15**, **R13**: la consulta **tolera** la ausencia de `guest_name` (opcional) y `status` (primera respuesta); solo falla cuando **de verdad** no puede leer la fila (`phone` ausente). El fallo pasa a ser legible para quien diagnostica y su veredicto va en «Verificación»; comprobación manual en `gas/README.md`. Toca `gas/Code.gs`, `gas/README.md`, `docs/servicio-invitados.md`. |
| **Diag.** el servicio exige hoy `phone`+`guest_name`+`status` | Confirmado en el código (`lookupResponse_` de `gas/Code.gs`, ~líneas 566-578: `firstMissingColumn_(...) → INVALID_DATA`). Se relaja a **solo `phone`** (RF-15); la escritura (`registerCodeResponse_`) sigue exigiendo las suyas (004 RF-8 intacta). |
| **Diag.** `writeGenericCache_` retorna en silencio sin `generic_json_cache` | Es **correcto** (la caché es una copia y la columna es opcional, 004 RF-18/§1.1): la resolución lee la hoja `generic`. Se deja constancia en §13.3 y en la comprobación manual para que un código resuelto sin caché no se confunda con un fallo de la consulta. |
| **Diag.** `resolveCode_` puede acabar en `INVALID_DATA` | Solo por datos del **código** (código fuera de su hoja, límite ilegible), no por la caché ausente; el `invalid data` del reporte viene del bloque de cabeceras de `lookupResponse_` (arriba). Se documenta qué sigue siendo un fallo real. **[Matizado por §14:]** el «límite ilegible» de un código que **sí existe** deja de ser `INVALID_DATA` y pasa a **`MALFORMED_GUEST`** (RF-16); el «código fuera de su hoja» sigue siendo `UNKNOWN_GUEST`; el `invalid data` del reporte del §14 es, ya, **el propio caso del código mal formado** (§14.0). |

### 12.2 Trazabilidad del cambio de requisitos (§14)

> **Nota de lectura.** Este apartado pertenece al **cambio de §14**, que se redacta después; se deja
> aquí, junto a las otras tablas, para no duplicar. Los identificadores (P10/P11) y los RF/D/R
> (`RF-16`/`RF-17`, `D21`/`D22` de §14, `R14`/`R15`) se detallan allí.

| Pedido / hallazgo | Cómo queda resuelto |
| --- | --- |
| **P10** un código de error específico para la fila mal formada | **RF-16**, **D21**, **R14**: el código que **existe** pero cuyo `limit` no cumple la regla de su tipo responde **`MALFORMED_GUEST`** (nuevo) en vez de `INVALID_DATA`; `INVALID_DATA` queda para lo que impide leer o escribir de verdad y `UNKNOWN_GUEST` para el código que no existe. Es un cambio **de forma** (un código más) → `CONTRACT_VERSION` sube a **`1.2.0`** en módulo y script, y el documento lo declara. |
| **P11** `PUBLIC` en una boda genérica vale por sin tope | **RF-17**, **D22**, **R15**: dentro de una boda **`generic`**, el código reservado `PUBLIC` con `limit = "n"` se **acepta** y vale por **sin tope** (`limit: "n"`, cupo ilimitado), con el **tipo** de la boda intacto; cualquier otro `limit` que no cuadre con su regla (un genérico con `"x"`/`0`, o un `PUBLIC` que no sea `"n"`) es el error nuevo de P10. Obliga a **la app** (ver abajo). |
| **Diag.** la app descartaría hoy `type: "generic"` + `limit: "n"` | Confirmado **en el código** (`src/utils/invitation.js`): `codeLimit(type, value)` solo acepta `"n"` con `type === "public"` y, con `generic`, exige entero > 0, de modo que `interpretInvitation`/`interpretLookup` devolverían `INVALID_DATA` y **descartarían una invitación válida** (§14.7). El resto de la lectura **ya** es coherente (`guestLimit`, `seatsText`, `attendeeLimits`, `isWithinGuestLimit`, `validateRsvp`) y el servicio **ya** cubre `"n"` en la escritura. El plan ajusta `codeLimit`/ambas interpretaciones y sus pruebas. |
| **Diag.** la nota de `gas/README.md` (punto 8) decía «nunca resuelve» | **Matizada:** con RF-17 ese código **sí** resuelve (sin tope); la nota pasa a describir el **reparto** nuevo (`PUBLIC` con `"n"` → sin tope; otro `limit` → `MALFORMED_GUEST`) y a distinguirlo de `UNKNOWN_GUEST` y de `INVALID_DATA`. |

---

## 13. Cambio de requisitos posterior (mensaje al rechazar, agradecimiento del rechazo, saludo con el nombre y consulta tolerante)

Esta sección sigue el **mismo patrón** que el cambio anterior del formulario (Fase 5 de `tasks.md`:
RF-4/RF-11, D17/D18, R8–R11): se añade al final, con identificadores que **no** colisionan con los
existentes **dentro de esta spec** (RF-12…RF-15, D19/D20 y R12/R13 siguen a los del cuerpo —que llega
a **RF-10, D18 y R11**— sin repetir ninguno; el cuerpo **no** documenta un **RF-11** propio: RF-11 se
redactó en la **Fase 5 de `tasks.md`** y ahora este cambio añade RF-12…RF-15; las **R** (R8–R11) sí son
del cuerpo). **No-colisión con la
spec 004:** RF-12…RF-15 y D19/D20 **también existen** en la 004 con otro contenido; por eso, al citar
la anterior, se escribe siempre **«004» delante** (004 RF-12, 004 D19…) y los identificadores sin
prefijo son siempre los de **esta** spec. Dice **dónde toca** el cuerpo. Cuando algo de aquí
contradice el cuerpo, **manda esta sección**; los puntos del cuerpo señalados arriba ya llevan su
nota de actualización. El cambio lo pidió quien usa la invitación **después** de implementada y
verificada la 005; parte del **estado real del código** (no de un modelo imaginario).

### 13.1 Los cuatro pedidos y su reparto (interfaz ↔ contrato/servicio)

| # | Pedido (texto de quien la pide, resumido) | Requisitos | ¿Interfaz o contrato/servicio? |
| --- | --- | --- | --- |
| 6 | «A quien rechaza la invitación también se le permite dejar un mensaje para la pareja.» | **RF-13** | **Interfaz y composición del envío** (`Rsvp.jsx`, `rsvpPayload`). **No** cambia el contrato (el `message` ya es un campo del envío) ni el servicio (ya escribe `message`). |
| 7 | «En lugar de decirle gracias por tu respuesta, sería "Lamentamos que no puedas acompañarnos. Gracias por tu respuesta."» | **RF-12**, **D20** | **Interfaz** (copy de un aviso). La copy vive **con su componente** (`Rsvp.jsx`), **no** en el módulo del contrato; **no** cambia la forma del intercambio ni `CONTRACT_VERSION` (sigue `1.1.0`). |
| 8 | «En las personalizadas sí debería verse el nombre del invitado antes de dar Click en Responder invitación, con un saludo al invitado.» | **RF-14**, **D19** | **Interfaz** (`Rsvp.jsx`). No toca contrato ni servicio: el nombre ya viene en `resolve`. |
| 9 | «Al buscar un número ya registrado en las generales me contesta con invalid data.» | **RF-15**, **R13** | **Contrato/servicio** (`gas/Code.gs`, `docs/servicio-invitados.md`, `gas/README.md`). Puede además tocar la **interpretación** pura si un `name` vacío dejara de ser válido (hoy ya lo tolera: `interpretLookup`). |

**Lo que el pedido 8 NO pide (y no se hace):** invertir R6/D15. El saludo es un dato del invitado y
por eso vive **dentro** del contenido que revela el botón, **no** en la vista colapsada: antes de
pulsar «Responder invitación» el saludo **no** se ve. HU-14 queda intacta.

### 13.1-bis Decisiones del cambio (D19, D20)

- **D19 — Saludo con el nombre completo en el contenido revelado (personalizada).** El saludo es
  «Hola, \<nombre completo del titular\>», con el nombre **tal cual lo trae el registro** (no se
  adivina el nombre de pila) y se muestra **dentro** del contenido que revela «Responder
  invitación»; en `editando` abre el contenido y precede a los campos (nombre del titular en solo
  lectura + asistentes/mensaje) y en `respondido` va **sobre el panel de solo lectura** (RF-14).
  **No** aplica a genérica ni pública y **no** se ve en la vista colapsada (por eso **no** contradice
  R6/D15/HU-14). **Alternativa descartada:** mostrar solo el nombre de pila (exigiría adivinar por el
  primer token, prohibido por la constitución: nada se deduce) o poner el saludo en la vista colapsada
  (rompería D15/HU-14).
- **D20 — La copy del aviso del rechazo es propia del rechazo.** El aviso de un rechazo registrado
  (`respondido` y envío aceptado de un `rejected`) deja de ser la copy `OK` y pasa a ser «Lamentamos
  que no puedas acompañarnos. Gracias por tu respuesta.»; una confirmación sigue con la copy `OK`. Es
  un **rótulo de interfaz** que vive **con su componente** (`Rsvp.jsx`, `AGENTS.md`) y **no** en el
  módulo del contrato; **no** cambia el código `OK` ni el resultado del envío. **Alternativa
  descartada:** cambiar el servicio para que devuelva un código distinto en un rechazo aceptado
  (tocaría la forma del contrato y su versión por algo que es puro texto de interfaz); y declarar la
  copy en el módulo del contrato (la prueba de sincronía no la vigila y el módulo no aloja copy).

### 13.2 RF nuevos (criterios en EARS)
**RF-12 — Agradecimiento del rechazo** (pedido 7)

- CUANDO el bloque esté en **`respondido`** (porque el invitado acaba de enviar o porque la
  respuesta previa era un rechazo) **y** la respuesta registrada sea un **rechazo** (`rejected`), el
  aviso deberá ser la **copy del rechazo** —«Lamentamos que no puedas acompañarnos. Gracias por tu
  respuesta.»— en lugar de la copy `OK` del contrato (004 §4.1).
- CUANDO un envío termine **aceptado** (`OK`) y su contenido fuera un **rechazo**, el aviso del
  estado `respondido` será esa misma **copy del rechazo** (RF-9 de esta spec, matizado).
- CUANDO la respuesta sea una **confirmación** (`confirmed`/`updated`), el aviso seguirá siendo la
  copy `OK` (el cambio **no** la afecta).
- La copy del rechazo es un **texto de interfaz en español** y vive **con su componente**
  (`Rsvp.jsx`), como manda `AGENTS.md`; **no** se declara en el módulo del contrato (ese módulo aloja
  los literales del modelo del servicio, no copy de interfaz) y **no** se incrusta ningún dato del
  contrato en el componente (004 RF-17 intacto: la app sigue consumiendo el módulo para todo lo que
  **sí** es contrato).
- El código (`OK`) y su significado **no** cambian: lo que cambia es **qué copy** se pinta para un
  rechazo `OK`, no el resultado del envío (004 RF-14 intacto).
- El aviso se anuncia en la **región viva** como hoy (RNF-1 intacta).

**RF-13 — El mensaje también al rechazar** (pedido 6; matiza D18)

- DONDE la asistencia elegida sea «**No podré asistir**» (`rejected`), el campo del **mensaje** para
  la pareja **deberá existir** y ser **opcional**; el invitado podrá escribir y enviar un mensaje
  aunque no asista.
- CUANDO el invitado **rechace con un mensaje**, el envío **deberá incluir** ese mensaje (mismo campo
  del contrato, `message`).
- Los campos de **alergias (restricciones), adultos y niños** seguirán **sin existir** en un rechazo
  (no se pintan, no se envían): D18 matizada solo en el mensaje / 004 D26 intacta. Lo único que se
  **añade** al rechazo es el mensaje.
- El **anuncio de la región viva** de un rechazo deberá **dejar de decir que no se muestra el
  mensaje**: anunciará solo que no se muestran asistentes ni alergias (el mensaje **sí** se muestra).
- El **gating de los campos de la asistencia** deberá gobernar solo adultos, niños y alergias; el
  mensaje se pinta con «Sí, asistiré» **y** con «No podré asistir» (RF-13).
- CUANDO el invitado **rechace sin mensaje**, el rechazo se enviará igual (el mensaje es opcional) y
  el resultado será el mismo (004 RF-14 intacto).
- El **nombre** y el **teléfono** siguen **obligatorios también al rechazar** (004 RF-8/D26
  intactas): lo que se añade es el mensaje, **no** se relaja nada.
- El contrato **no** cambia: `message` ya es un campo del envío y el servicio ya lo escribe; el
  cambio es de la **app** (que deja de omitirlo en un rechazo) y de la **interfaz** (que ofrece el
  campo).
- La escritura en el libro no cambia: el mensaje se guarda en la columna `message` que ya existe
  (004 §8, sin columnas nuevas).
- **D18 matizada SOLO en el mensaje (y lo único que cambia de D18):** el **mensaje** de un rechazo
  **se muestra** en el panel de **solo lectura** de `respondido` y de `cerrado` con respuesta previa,
  y **se precarga** en el campo editable al pulsar «Editar»; esto vale también para un rechazo
  **antiguo** cuyo mensaje ya esté en el libro (no es un error de datos). Lo que **no** cambia: los
  **adultos, los niños y las restricciones/alergias** de un rechazo siguen **sin mostrarse** ni
  enviarse (esos campos no existen con «No podré asistir»), y un mensaje **sin escribir** no se pinta
  vacío. Los asistentes de un rechazo en el libro siguen siendo 0 o vacío.

**RF-14 — Saludo con el nombre en la invitación personalizada** (pedido 8; D19)

- DONDE la invitación sea **personalizada**, el saludo «Hola, \<nombre completo del titular\>» aparecerá
  **donde vive el contenido del invitado que revela «Responder invitación»**, en este orden por estado:
  - **`sin-respondido` / `telefono` / `consultando` / `cerrado` / `degradado`** (vista colapsada o sin
    contenido revelado): el saludo **no** se muestra (es un dato del invitado; D15, HU-14, R6).
  - **`editando`** (tras pulsar «Responder invitación»): el contenido revelado **abre** con el saludo y
    a continuación los campos (nombre del titular en **solo lectura**, RF-2, y asistentes/mensaje).
  - **`respondido`** (respuesta previa o recién enviada): **no** hay campo de nombre ni formulario (solo
    el panel de solo lectura y «Editar»); el saludo, **si** se muestra, va **sobre el panel de solo
    lectura** (antes que él), nunca dentro ni debajo de sus pares etiqueta/valor.
- El nombre del saludo es el **titular tal cual lo trae el registro** (`invitation.guestName`): no se
  adivina el **nombre de pila** ni se recorta nada (constitución: nada se deduce; 004 RF-13).
- El saludo es un dato del invitado y vive **dentro** del contenido revelado, **nunca** en la vista
  colapsada (D15, HU-14, R6 intactas).
- El saludo **no** aplica a la invitación **genérica** ni a la **pública** (no se conoce al titular
  hasta que el invitado escribe su nombre): solo la personalizada lo muestra (RF-3, RF-5).
- El saludo es **texto de interfaz en español**; en el código, los identificadores van en inglés
  (RAE/constitución, principio 6).
- El saludo se pintará con la **estructura accesible** de RNF-1 (texto visible; no es un control).

**RF-15 — La consulta tolera las cabeceras que no necesita** (pedido 9; R13)

- La consulta por teléfono (`lookup`, RF-5/RF-8) **deberá** responder con la **fila** del teléfono
  pedido aunque el libro de invitados **no declare** las cabeceras que esa consulta **no** necesita
  para responder: el **nombre registrado** (`guest_name`) es **opcional** (como el mensaje) y la
  **ausencia de `status`** se tratará como **primera respuesta** (`response: null`), no como error.
- La consulta **deberá** fallar con `INVALID_DATA` **solo** cuando **de verdad no pueda leer la
  fila**: sin la columna **`phone`** no hay forma de localizarla; ese caso sigue siendo un fallo real
  (004 RF-13 intacta), con su aviso y su reintento.
- DONDE falte `guest_name`, la respuesta **no** se rechazará: el nombre viajará **vacío** (`null`) y
  la app mostrará la respuesta con el nombre en blanco y permitirá editarlo (RF-10 intacta).
- El servicio **seguirá escribiendo** en el envío las columnas que su escritura necesita (004 RF-8
  intacta: `registerCodeResponse_` conserva sus comprobaciones); lo que se relaja es **solo** la
  **lectura** de la consulta.
- CUANDO la resolución del código **no** disponga de la caché del maestro (`generic_json_cache`
  ausente), la consulta **no** deberá acabar en `INVALID_DATA` por ese motivo: la caché es una
  **copia** y la resolución lee la hoja `generic` (004 RF-18/D13/D14 intactas). Un código que **no
  está** en su hoja sigue siendo `UNKNOWN_GUEST` y un límite ilegible, `INVALID_DATA` (fallos
  **reales** del código, no de la consulta).
- Un fallo del servicio **dejará de ser indistinguible** para quien lo diagnostica: la
  **comprobación manual** de `lookup` en `gas/README.md` se **amplía** para cubrir la consulta **sin**
  `guest_name`/`status` (no falla) y **sin** `phone` (sí falla), y para dejar constancia de que una
  caché ausente **no** es un fallo. El veredicto se anota en «Verificación» de `AGENTS.md` (§13.5).
- La **forma** de la respuesta de `lookup` **no** cambia (RF-8 intacto): sigue devolviendo
  `{ ok, action, type, limit, response, deadline }`, con `response.name` **pudiendo** ser `null`; no
  se añade ni se retira ningún campo y **no** se añade ningún código de error.
  **[Actualizado por §14:]** la parte «**no** se añade ningún código de error» **quedó derogada**: el
  cambio de **§14** añade el código **`MALFORMED_GUEST`** (RF-16, D21) y sube el contrato a `1.2.0`.
  Lo demás de esta viñeta sigue vigente (la forma de la respuesta correcta de `lookup` no cambia; el
  campo nuevo de §14 es un **código de error**, no un campo de la respuesta).

### 13.3 Diagnóstico del `invalid data` (lo que hoy hace el servicio y lo que cambia)

El reporte de quien la pide —boda `generic`, falla **al pulsar «Continuar»** (la consulta `lookup`),
con la **nueva versión ya desplegada**— encaja con este punto del código, **no** con un despliegue
viejo:

- **`lookupResponse_`** (`gas/Code.gs`, ~566-578) exige hoy en la hoja `guests` las cabeceras
  **`phone`, `guest_name` y `status`** y, si falta **cualquiera**, devuelve **`INVALID_DATA`**
  (`firstMissingColumn_(headerMap, [...]) → INVALID_DATA`). Es decir: la consulta **falla por una
  cabecera que no necesita**: el teléfono ya viene en la petición y el nombre registrado es
  **opcional**. **Cambio (RF-15):** de las tres, **solo `phone`** sigue siendo obligatoria.
- **`writeGenericCache_`** retorna **en silencio** cuando el maestro no declara
  `generic_json_cache`. Es **correcto** (la caché es una **copia** y la columna es **opcional**,
  004 RF-18/§1.1): el código se resuelve leyendo la hoja `generic`. No es el fallo del reporte, pero
  conviene que la comprobación manual lo diga para no confundirlo.
- **`resolveCode_`** puede llegar a `INVALID_DATA` **solo** por datos del **código** (código que no
  está en su hoja —que en realidad es `UNKNOWN_GUEST`— o un límite ilegible). **No** por la caché
  ausente.

Un fallo del servicio deja así de ser **indistinguible** para quien diagnostica: la comprobación
manual distingue «cabecera que no hacía falta» de «fila ilegible de verdad», que es lo que RF-15
exige.

### 13.4 Contrato: qué cambia y si sube de versión

- **La copy del rechazo NO vive en el módulo del contrato.** La copy «Lamentamos que no puedas
  acompañarnos. Gracias por tu respuesta.» (RF-12, D20) es un **rótulo de interfaz** y vive **con su
  componente** (`Rsvp.jsx`), como manda `AGENTS.md` («los rótulos de interfaz que no son datos viven
  con su componente»). **No** se declara en `src/constants/contract.js`: el módulo solo aloja los
  **literales del modelo del servicio** (hojas, columnas, estados, acciones, códigos), que son el
  objeto del contrato. Por eso el contrato **no cambia** por este texto.
- **La prueba de sincronía no cambia de regla.** `test/serviceContract.test.js` vigila una **lista
  cerrada** de objetos del módulo (`GUEST_TYPES`, `RESPONSE_STATES`, `SERVICE_ACTIONS`,
  `REQUEST_FIELDS`, `RESOLVE_FIELDS`, `LOOKUP_FIELDS`, nombres de hojas/columnas, `GUEST_PARAM`,
  `PUBLIC_CODE`, `NO_LIMIT`) contra el documento; una **copy de interfaz** no entraría en esa lista,
  así que **no** la vigila ni debe vigilarla. La verificación de la copy es la **de la interfaz**: la
  prueba **co-locada del componente** y/o el **punto manual 8** de §10. **No** se promete aquí ninguna
  garantía automática sobre la copy.
- **No cambia la forma del intercambio.** No se añade ni retira acción, campo, columna, estado del
  libro ni código de error; la respuesta de `lookup` sigue igual (`response.name` **puede** ser
  `null`, que ya era válido). Por eso **`CONTRACT_VERSION` NO sube: sigue `1.1.0`** (subir la versión
  se reserva para cambios **de forma**; una **copy de interfaz** no lo es). Si la implementación
  descubriera que hace falta un cambio de forma (no es el caso previsto), **parar y volver a esta
  decisión** antes de subirla.
  **[Actualizado por §14:]** esta viñeta **quedó derogada** por el cambio de requisitos de **§14**,
  que **sí** cambia la forma del intercambio (un **código de error nuevo**, `MALFORMED_GUEST`) y por
  eso sube el contrato de `1.1.0` a **`1.2.0`** (R14, RF-16). Lo que **sigue vigente** de aquí: que la
  **copy del rechazo** (RF-12, D20) **no** es motivo de subida —es un rótulo de interfaz— y que la
  versión se sube **a la vez** en el módulo y en el script.
- **El servicio sí cambia de comportamiento, sin cambiar de contrato:** la tolerancia de cabeceras
  (RF-15) es de **`gas/Code.gs`** y **exige volver a desplegar** el script para que la consulta
  funcione con un libro sin `guest_name`/`status` (004 RF-17/D18 intactas: se redespliega, como en
  `lookup`).
- **Nada del modelo del libro cambia** (§8): la columna `message` ya existe; `guest_name` deja de ser
  **obligatoria para la consulta**, pero **sigue** escribiéndose en el envío (004 RF-8 intacta).

### 13.5 Dónde toca el plan (sin redactar tareas)

El plan deberá abarcar, como mínimo, estos artefactos (los RF/D/R entre paréntesis):

- **Interfaz** (`Rsvp.jsx`): el campo del mensaje también con «No podré asistir» (RF-13), el
  aviso del rechazo (RF-12, D20) y el saludo «Hola, \<nombre\>» en el contenido revelado de la
  personalizada (RF-14, D19). **Dos ajustes concretos de la interfaz:**
  - **`showsAttendanceFields`** (`Rsvp.jsx:132-134`, hoy gatea los cuatro campos juntos): debe
    gobernar **solo** adultos, niños y alergias; el **mensaje** se pinta con «Sí, asistiré» **y**
    con «No podré asistir» (RF-13).
  - **La región viva del rechazo** (`attendanceNotice`, `Rsvp.jsx:140-148`): hoy anuncia «No se
    muestran los campos de asistentes, alergias **ni mensaje**.»; con RF-13 debe dejar de decir
    «ni mensaje» (el mensaje **sí** se muestra) y anunciar solo que no se muestran asistentes ni
    alergias.
  - `summaryData` **deja de borrar** el mensaje de un rechazo y `ResponseSummary` **lo muestra**
    (lectura y precarga al editar, RF-13); sigue **sin** mostrar adultos, niños ni restricciones de un
    rechazo (D18 matizada solo en el mensaje).
- **Lógica pura** (`src/utils/rsvp.js` y su prueba): `rsvpPayload` deja de omitir el `message` en un
  rechazo (RF-13); los demás campos del rechazo (adultos, niños, restricciones) se siguen omitiendo.
  **La composición del panel de lectura se hará en lógica pura** (una función que, con la respuesta y
  la asistencia, devuelva los datos a mostrar), no dentro del componente: su prueba co-locada cubre
  que un rechazo **conserva** el mensaje y **omite** adultos, niños y restricciones. (Coherente con
  RNF-4/RNF-9 y con el inventario de `src/utils/` de `AGENTS.md`.)
- **Documento del contrato** (`docs/servicio-invitados.md`): aclara que la consulta tolera
  `guest_name`/`status` ausentes (RF-15) y que un rechazo puede llevar mensaje (RF-13); **no** recoge
  la copy del rechazo (vive en el componente, §13.4). La prueba de sincronía
  (`test/serviceContract.test.js`) lo vigila en lo que **sí** es contrato.
- **Servicio** (`gas/Code.gs`): `lookupResponse_` solo exige `phone` (RF-15); la escritura
  (`registerCodeResponse_`) **no** cambia (004 RF-8 intacta).
- **Comprobación manual del servicio** (`gas/README.md`): los casos nuevos de §13.3 y el aviso de
  **redesplegar** por el cambio de comportamiento (RF-15).
- **Verificación** (§10 de esta spec y «Verificación» de `AGENTS.md`): los puntos manuales 8, 9 y 10
  nuevos, con su veredicto.
- **Gobernanza** (`AGENTS.md`, `MEMORY.md`, `PENDING_TASKS.md`): el mensaje al rechazar, la copy del
  rechazo, el saludo y la tolerancia de la consulta, al cerrar las tareas (I6).

### 13.6 Riesgos y su mitigación

- **Que el saludo rompa R6/D15.** Mitigación: el saludo vive **dentro** del contenido revelado (RF-14)
  y la verificación manual comprueba que **no** se ve antes de pulsar el botón.
- **Que «mostrar el mensaje en el rechazo» choque con D18.** Mitigación: la matización de D18 es **solo
  sobre el mensaje** (RF-13): el mensaje se escribe, se envía, se lee y se precarga; adultos, niños y
  restricciones de un rechazo siguen **sin** mostrarse (D18 vigente para ellos, §9 y RF-13).
- **Que la tolerancia de cabeceras oculte un fallo real.** Mitigación: RF-15 **solo** relaja
  `guest_name` y `status`; `phone` sigue obligatoria y los fallos del código siguen siendo
  `UNKNOWN_GUEST`/`INVALID_DATA`; la comprobación manual distingue ambos casos (§13.3).
- **Desplegar el script pero no actualizar el documento (o al revés).** Mitigación: §13.4 exige los
  tres artefactos del contrato a la vez y la prueba de sincronía lo vigila; el redespliegue se anota.
- **Que el cambio de copy se cuele como cambio de forma del contrato.** Mitigación: §13.4 fija que
  **no** sube `CONTRACT_VERSION` (y lo mantiene el §14: la copy no es motivo de subida); si hiciera
  falta subirla, parar y volver a decidir.
- **Riesgo operativo: el redespliegue no es detectable por la versión.** Como el contrato **no** sube
  de `1.1.0` (§13.4), una app y un `gas/Code.gs` desplegado viejo **coinciden en versión** y la
  tolerancia de cabeceras (RF-15) podría no estar activa sin que nada lo delate. Mitigación: el
  **redespliegue del Apps Script** es un **paso manual obligatorio** anotado en `gas/README.md`, y el
  **punto manual 11** de §10 falla si el script no se redesplegó (la consulta sin `guest_name` seguiría
  dando `INVALID_DATA`). No se añade un marcador de versión solo para esto: la comprobación manual es
  el control. **[Matizado por §14:]** desde el cambio de **§14** el contrato **sí** sube (`1.2.0`) y
  `gas/Code.gs` declara la misma versión; como la prueba de sincronía ya vigilaba esa igualdad **como
  texto**, un script viejo y una app nueva **sí** divergen y la prueba lo delata. Aun así, el
  redespliegue sigue siendo un **paso manual** y los puntos manuales nuevos de §14 lo cubren.

---

## 14. Cambio de requisitos posterior (código mal formado con error propio y `PUBLIC` sin tope en una boda genérica)

Esta sección sigue el **mismo patrón** que **§13** (y que el cambio anterior del formulario, Fase 5 de
`tasks.md`): se añade al final, con identificadores que **no** colisionan **dentro de esta spec**
(§13 llega a `RF-15`, `D20`, `R13`; aquí se usan **`RF-16`/`RF-17`**, **`D21`/`D22`** y **`R14`/`R15`**).
**Aviso de colisión con el cuerpo:** los identificadores `D21` y `D22` **existen** en el cuerpo de esta
spec (D21 «cupo cero → solo rechazar», citado en RF-4/RF-9, y D22 del registro) y **también** en la
**004** con otro contenido; por eso, en esta sección, **`D21`/`D22` son los de §14** y, al citar los
del cuerpo o los de la 004, se escribe **«cuerpo D21»** / **«004 D22»** delante. Los **RF** (`RF-16`,
`RF-17`) y las **R** (`R14`, `R15`) sí son nuevos y **no** colisionan con nada de esta spec ni de la
004. Dice **dónde toca** el cuerpo y **qué deroga o matiza** respecto de §13 y de la 004. Cuando algo
de aquí contradice el cuerpo o el §13, **manda esta sección**. El cambio lo pidió quien usa la
invitación **después** de implementadas y validadas la 005 y su §13, y parte del **estado real del
código y del libro** (no de un modelo imaginario).

### 14.0 Contexto: el caso real que motiva el cambio

- Una **boda real de prueba** tiene `guest_type = generic` en el maestro (hoja `files`) y su hoja
  `generic` contiene, además de sus diez códigos corrientes `…_GEN` con `limit` numérico correcto
  (1…10), una fila **`generic_id = PUBLIC`** con `limit = "n"`.
- El servicio, en **`resolveCode_`** (`gas/Code.gs`, ~líneas 377-384), aplica la regla del **tipo**:
  una boda **`public`** exige que el `limit` sea **exactamente** `"n"`; una boda **`generic`** exige un
  **entero mayor que cero**; cualquier otro valor devuelve **`INVALID_DATA`**.
- **Consecuencia confirmada en vivo:** en una boda `generic`, un código `PUBLIC` con `limit = "n"`
  **siempre** responde `INVALID_DATA` —con teléfono o sin él, en `resolve` y en `lookup`—. La app lo
  pinta como «Los datos de esta invitación están incompletos.»
- **La caché del maestro coincide con la hoja `generic`** (`generic_json_cache`): no era un problema
  de caché. Tampoco era un fallo del `lookup` ni de la app (la app **no** inventa `PUBLIC`: solo lo usa
  si el enlace lo trae).
- El veredicto es **opaco**: `INVALID_DATA` significa hoy «los datos del libro están mal» y mezcla
  cosas muy distintas —un libro inaccesible, una hoja o una cabecera ausente, una fila a medio
  escribir— con **un código que existe pero está mal formado para su tipo**. Quien diagnostica no puede
  saber cuál de todas es (la nota documental de §13.3 y de `gas/README.md` lo palía, pero no lo
  resuelve).

### 14.1 Los dos pedidos y su reparto (contrato/servicio ↔ datos)

| # | Pedido (texto de quien la pide, resumido) | Requisitos | ¿De quién es el cambio? |
| --- | --- | --- | --- |
| 10 | «Un código de error específico para la fila mal formada: que no se mezcle con `INVALID_DATA`.» | **RF-16**, **D21**, **R14** | **Contrato y servicio** (código de error nuevo; sube `CONTRACT_VERSION` a `1.2.0`). **No** es un cambio de datos: la fila sigue mal escrita y sigue sin resolver, pero **se distingue**. |
| 11 | «Un código `PUBLIC` en una boda `generic` se acepta como "sin tope".» | **RF-17**, **D22**, **R15** | **Servicio** (regla del tipo en `resolveCode_`). **No** cambia la forma del intercambio (no hay campo ni acción nuevos): el cambio de forma y la subida de versión los aporta el pedido 10. |

**Lo que el pedido 11 NO pide (y no se hace):** convertir la boda en `public`. La boda **sigue siendo
`generic`** (el maestro no se toca): lo que cambia es que, **dentro** de una boda genérica, el código
reservado `PUBLIC` **se acepta** y vale por **sin tope**, igual que en la pública.

### 14.2 Decisiones del cambio (D21, D22)

- **D21 — El código que existe pero no cumple la regla de su tipo tiene **error propio**:
  `MALFORMED_GUEST`.** `INVALID_DATA` se **reserva** para lo que de verdad impide trabajar (libro
  inaccesible, hoja o cabeceras ausentes, fila ilegible, estado fuera de los cuatro, cifras de
  asistentes que no son enteros ≥ 0). El reparto nuevo, sin ambigüedad: «el código **no existe**» sigue
  siendo `UNKNOWN_GUEST`; «el código **existe** pero su `limit` **no cumple la regla de su tipo**» pasa a
  ser `MALFORMED_GUEST`; «`INVALID_DATA`» queda para los datos que impiden leer o escribir. La regla del
  tipo es **la misma** que hoy (`public` → `"n"`; `generic` → entero > 0), **salvo** la excepción del
  pedido 11 (D22). Es un cambio **aditivo** de la forma del contrato (un código más) y por eso **sube
  `CONTRACT_VERSION` a `1.2.0`** (R14, RF-16).
  **Nombre elegido:** `MALFORMED_GUEST` («invitado mal formado»). Se prefiere a `INVALID_GUEST_CODE`
  porque el resto de la tabla nombra la **cosa** que falla y no el campo (`UNKNOWN_GUEST`,
  `GUEST_SHEET_UNAVAILABLE`, `INVALID_DATA`), y porque el fallo **no** es del enlace ni del parámetro:
  es de la **fila** del libro (el código existe y su `limit` está mal). `INVALID_GUEST_CODE` se leería
  como «el código del enlace es inválido», que es exactamente lo que **no** pasa.
  **Alternativas descartadas:** reutilizar `INVALID_DATA` (es el problema que este cambio corrige);
  reutilizar `UNKNOWN_GUEST` (diría que el código no está en su hoja, que es falso y llevaría a buscar
  donde no está); cambiar el **tipo** de error de todos los códigos mal formados del libro a un aviso
  «amable» que no fuera código de error (seguiría sin distinguirse en el contrato y no habría ni
  mensaje propio ni prueba).
- **D22 — `PUBLIC` en una boda `generic` vale por **sin tope**.** Dentro de una boda **genérica**, el
  código reservado **`PUBLIC`** con `limit = "n"` **deja de ser un fallo** y se acepta con el mismo
  significado que en la pública: **sin tope** (cupo ilimitado). Sigue siendo **un código, un tipo de
  boda**: la boda **no** cambia de `guest_type` (no se toca el maestro) y el resto de códigos genéricos
  conservan su regla (entero > 0). Un `limit` inválido que **no** sea el caso `PUBLIC` —por ejemplo un
  código genérico con `limit = "x"` o `limit = 0`, o un `PUBLIC` con un `limit` distinto de `"n"`— sigue
  siendo el **error nuevo** de D21 (`MALFORMED_GUEST`).
  **Alternativas descartadas:** arreglarlo **solo** con datos (borrar la fila `PUBLIC` de la hoja
  `generic`) —es lo que hace quien publica, pero no cubre el caso de que **vuelva** a escribirse la fila
  ni deja de ser un fallo opaco para quien diagnostica—; aceptar `PUBLIC` **con el `limit` de la fila**
  (`limit` arbitrario) —inventaría un cupo que la fila no declara—; permitir `"n"` **en cualquier**
  código de una boda genérica —convertiría un cupo mal escrito en una invitación sin tope, que es
  justo lo que no se quiere: solo el código reservado `PUBLIC` es «sin tope».

### 14.3 RF nuevos (criterios en EARS)

**RF-16 — Un código mal formado tiene error propio (`MALFORMED_GUEST`)** (pedido 10; D21)

- CUANDO el **código** de un enlace **exista** en la hoja que le toca por el tipo de la boda
  (`generic` en la genérica; `PUBLIC` en la pública; y `generic` **o** el reservado `PUBLIC` en la
  genérica, RF-17) **pero** su `limit` **no cumpla la regla de su tipo**, el servicio **deberá**
  responder con el código de error **`MALFORMED_GUEST`** —nuevo en el contrato— en lugar de
  `INVALID_DATA`.
- La regla del tipo que se aplica es la vigente (RF-9, 004 RF-13), **más** la excepción de RF-17: un
  código **genérico** (no `PUBLIC`) exige un **entero mayor que cero**; el código **`PUBLIC`** de una
  boda **pública** exige **exactamente** el texto `"n"`; el código **`PUBLIC`** de una boda **genérica**
  exige **exactamente** `"n"` (y con eso vale por sin tope).
- CUANDO el código **no** exista en la hoja que le toca por su tipo, el servicio **seguirá**
  respondiendo **`UNKNOWN_GUEST`** (004 RF-12/RF-13 intactas): el reparto entre «no existe» y «existe
  mal escrito» **no** se confunde.
- `INVALID_DATA` **deberá** quedar **reservado** a lo que impide de verdad leer o escribir: maestro o
  libro inaccesible, hoja o cabecera que se necesita y falta, `status` fuera de los cuatro estados,
  cifras de asistentes que no son enteros ≥ 0, y los datos incoherentes de la personalizada (004
  RF-13). **DONDE** el fallo sea una fila de **código** mal formada, el código **no** será
  `INVALID_DATA`.
- El aviso visible del **código nuevo** será **distinto** del de `INVALID_DATA`: dirá que el **código
  de la invitación** no es válido, **no** que los datos del libro estén incompletos. `MALFORMED_GUEST`
  es **reintentable** (`retryable: true`, como `INVALID_DATA`: quien publica puede corregir la fila),
  y su mensaje es de **interfaz en español** (004 RNF-7 intacta).
- `MALFORMED_GUEST` se comporta como los demás códigos del contrato: la app lo **consume del módulo**
  (ningún componente lleva el literal incrustado, 004 RF-17 intacta), el bloque queda **`degradado`**
  con ese aviso y su **reintento** (RF-7), y aparece **igual** en `resolve` que en `lookup`: el fallo
  ocurre al **resolver el código**, antes de mirar el teléfono.
- Como la **forma** de una respuesta de error **cambia** (un código más en la tabla), el contrato
  **deberá** subir su `CONTRACT_VERSION` a **`1.2.0`** **a la vez** en el **módulo**
  (`src/constants/contract.js`) y en el **script** (`gas/Code.gs`), y el **documento**
  (`docs/servicio-invitados.md`) **deberá** declarar el código y su causa (RF-18 de la 004, RF-8 de
  esta spec).

**RF-17 — `PUBLIC` en una boda genérica vale por sin tope** (pedido 11; D22)

- DONDE la boda sea **`generic`** y el código del enlace sea el **reservado `PUBLIC`** con `limit`
  **exactamente `"n"`**, el servicio **deberá** aceptarlo y devolver la invitación **sin tope**
  (`limit: "n"`), con el **mismo** significado que en una boda pública (RF-9, 004 D12: `n` = sin tope).
- El **tipo** de la boda **no** cambia: la respuesta sigue declarando `type: "generic"` (el maestro
  **no** se toca) y `lookup` sigue admitiendo esa boda según su tipo (RF-8).
- DONDE el código sea un **genérico** corriente (uno de los `…_GEN`), la regla **no** cambia: su `limit`
  tiene que ser un **entero mayor que cero** (004 RF-9) y su cupo es ese número.
- DONDE el `limit` **no** cuadre con la regla que le toca —un código genérico con `limit = "x"` o
  `0`, o un `PUBLIC` cuyo `limit` no sea **exactamente** `"n"`—, la respuesta será
  **`MALFORMED_GUEST`** (RF-16, D21): la excepción es **solo** para `PUBLIC` **con `"n"`**.
- El `n` de un `PUBLIC` de boda genérica significa **sin tope** en **todo** el camino, y el servicio
  sigue siendo la **autoridad**: `resolve` y `lookup` lo devuelven como `"n"`; la **escritura**
  (`registerCodeResponse_`) aplica la misma regla del tipo —que es la de hoy: `limit !== NO_LIMIT &&
  adults > limit → OVER_LIMIT`, de modo que con `"n"` no hay tope—, **sin** cambiar el modelo del libro
  ni las columnas.
- La invitación sin tope de una boda genérica **no** gana nada que la pública no tenga: **no** precarga
  titular ni cupo (004 RF-6 intacta), **no** pide niños (D12) y **no** cambia el paso del teléfono ni
  la consulta (RF-5).

### 14.4 Qué queda derogado o matizado (de la spec 004, de la 005 y de §13)

- **004 §4.1 (tabla de códigos de error) — AMPLIADA.** Gana **`MALFORMED_GUEST`** con su causa y su
  mensaje. Es la **primera** vez que esta tabla crece desde la 004: hasta ahora el §13 decía «ningún
  código nuevo» y la 005 §8 lo repetía. **Ninguna** entrada de la tabla se **retira** ni se **renombra**;
  lo único que cambia de las existentes es el **reparto** de `INVALID_DATA` (deja de incluir el código
  mal formado).
- **004 RF-13 — MATIZADA (el reparto del fallo de lectura).** Sigue considerando inválidos los mismos
  datos, pero un **código cuyo `limit` no cumple la regla de su tipo** **deja** de producir
  `INVALID_DATA` y produce **`MALFORMED_GUEST`**; un `INVALID_DATA` con «cabecera incompleta» sigue
  igual. **004 RF-13 no queda derogada**: se le retira **una** causa, que pasa al código nuevo.
- **004 D21 («cupo cero → solo rechazar») y cuerpo D21 — INTACTAS.** El `D21` de **§14** es otro
  identificador; el del cuerpo (combo con cupo 0, RF-4/RF-9) y el de la 004 **no** se tocan.
- **004 RF-9 y 004 D12 — MATIZADAS (la regla del tipo).** `n` sigue significando **sin tope** y la app
  sigue **sin** declarar un máximo (R1 intacta); lo que cambia es **quién** puede llevar `n`: además de
  la pública, el código reservado **`PUBLIC`** de una boda **genérica**. El campo sigue siendo numérico
  **libre** con `n` (RF-4, R1).
- **005 §8 («casos que no cambian») — MATIZADA.** «Los **códigos de error** de 004 §4.1 (ninguno se
  retira ni se renombra; `lookup` no añade ninguno)»: se mantiene que **no se retira ni se renombra**
  ninguno, y que `lookup` **no** añade ninguno **propio**; el código **nuevo** (`MALFORMED_GUEST`) no es
  de `lookup`, es de la **resolución del código** (y por eso aparece igual en `resolve`, `lookup` y
  `respond` cuando el código está mal formado).
- **005 §9 («fuera de alcance»: «Renombrar o retirar códigos de error, o añadir uno nuevo») — DEROGADA
  en su tercera parte.** Añadir un código nuevo **deja** de estar fuera de alcance: `MALFORMED_GUEST` es
  exactamente eso, decidido por quien pide el cambio (R14). Sigue vigente que **no** se retira ni se
  renombra ninguno.
- **005 §9 («fuera de alcance»: «Subir `CONTRACT_VERSION`») — MATIZADA.** La viñeta era **específica
  del cambio de §13** (la copy del rechazo **no** era motivo de subida) y eso **sigue** vigente: una
  copy de interfaz no sube la versión. Lo que cambia es el **alcance general**: como este cambio **sí**
  cambia la forma (un código de error más), el contrato **sube** a `1.2.0` (RF-16, R14).
- **§13.2 (RF-15) y §13.4 — MATIZADAS.** `INVALID_DATA` se reserva ahora **también** frente al código
  mal formado: la frase «un límite ilegible, `INVALID_DATA`» (RF-15, §13.3) pasa a ser
  **`MALFORMED_GUEST`** para el **código** mal formado; `INVALID_DATA` se queda con lo que impide de
  verdad leer la fila (`phone` ausente). §13.4 deja de mandar en lo tocante a la versión (ver arriba).
- **004 RF-6, RF-7, RF-8, RF-10, RF-11, RF-17, RF-18 — INTACTAS.** El modelo del libro, el `viewed`,
  la llave por teléfono, el plazo, la caché y el redespliegue no cambian; lo único que cambia del
  **libro** es **la interpretación** de una fila de la hoja `generic` (nunca sus columnas).

### 14.5 Contrato: qué cambia, qué sube de versión y qué no

- **Lo que cambia (forma):** la **tabla de códigos de error** gana **`MALFORMED_GUEST`** (su `code`, su
  `message` de interfaz y su `retryable: true`). El **reparto** de `INVALID_DATA` se reduce (deja de
  incluir el código mal formado). **No** cambian: los tipos, los estados, las acciones, los campos de
  petición ni de respuesta, las hojas ni las columnas, ni `NO_LIMIT`, ni `PUBLIC_CODE`, ni los dígitos
  del teléfono.
- **Versión:** `CONTRACT_VERSION` sube de `1.1.0` a **`1.2.0`** **a la vez** en el **módulo** y en el
  **script**; el **documento** reproduce el código y su causa. La prueba de sincronía
  (`test/serviceContract.test.js`) **no cambia de regla**: sigue exigiendo que el documento no omita
  ningún literal del módulo, que la **tabla de códigos coincida en conjunto y en el mensaje de cada
  uno** (el código nuevo entra solo, porque se deriva del módulo) y que `gas/Code.gs` declare la misma
  versión (leída como texto).
- **Lo que NO cambia:** la **forma de una respuesta correcta** de `resolve`, `lookup` y `respond`; el
  `guest_type` del maestro (una boda genérica **sigue** siendo genérica); el modelo del libro (hojas y
  columnas, `D7` de la 004 intacta: la hoja `guests` sigue sin columna del código); la copy del rechazo
  (rótulo de interfaz, §13.4); y el resto de la tabla de errores.
- **Redespliegue:** el cambio vive en `gas/Code.gs` y **exige** publicar una **versión nueva** del
  script (004 RF-17/D18); a diferencia del cambio de §13, aquí la **divergencia sí** la delata la
  prueba de sincronía de versión.

### 14.6 Dónde toca el plan (sin redactar tareas)

- **Contrato (módulo + documento):** `src/constants/contract.js` gana `MALFORMED_GUEST` en
  `SERVICE_ERRORS` y sube `CONTRACT_VERSION` a `1.2.0`; `docs/servicio-invitados.md` deriva el código
  nuevo (tabla y su prosa) y **deja de** decir que la versión es `1.1.0` (RF-16, R14; §13.4
  actualizado).
- **Servicio (`gas/Code.gs`):** `resolveCode_` devuelve **`MALFORMED_GUEST`** cuando el código existe
  pero su `limit` no cumple la regla de su tipo (RF-16) y **acepta `PUBLIC` con `"n"` en una boda
  genérica** (RF-17); `CONTRACT_VERSION` pasa a `1.2.0` (RF-16). **No** se toca `lookupResponse_`
  (salvo que dependa del código devuelto), ni `registerCodeResponse_` (la regla de escritura ya cubre
  `"n"`), ni `resolvePersonal_`.
- **Prueba de sincronía (`test/serviceContract.test.js`):** **no** cambia de regla; se verifica que el
  código nuevo y la versión nueva pasan sin tocar la prueba (y que sigue fallando si el documento se
  olvida del código). Se añade, si el plan lo estima, un caso que fije que **la tabla del módulo y la
  del documento** siguen coincidiendo con `MALFORMED_GUEST` (M6, RNF-5).
- **App (`src/utils/invitation.js` y su prueba):** comprobar qué hace hoy con `type: "generic"` +
  `limit: "n"` y, si la **incoherencia** de §14.7 se confirma, **ajustar la lectura** para que una
  invitación genérica sin tope se represente de forma **coherente** (`guestLimit`, `attendeeLimits`,
  `seatsText`, `validateRsvp`), con sus pruebas puras. **No** hace falta si la lectura ya es coherente
  (ver §14.7, que se resuelve en el plan con la evidencia del código).
- **`gas/README.md`:** la nota de diagnóstico (punto 8, la fila `PUBLIC` en una boda `generic`) **deja
  de** decir que ese caso «nunca resuelve» y pasa a describir el **reparto nuevo**: `PUBLIC` con `"n"`
  en boda genérica → **sin tope** (RF-17); cualquier otro `limit` que no cuadre con el tipo →
  **`MALFORMED_GUEST`** (RF-16), que ya **no** es `INVALID_DATA`; se añade el código nuevo a la tabla de
  distinción de fallos y el aviso de **redespliegue**.
- **Verificación (§10 de esta spec y «Verificación» de `AGENTS.md`):** puntos manuales nuevos (12, 13)
  para el código mal formado y para `PUBLIC` sin tope en una boda genérica, con su veredicto; y la
  verificación automática que sí se puede hacer sin el servicio vivo (contrato y lógica pura).
- **Gobernanza (`AGENTS.md`, `MEMORY.md`, `PENDING_TASKS.md`):** el código nuevo, la regla de `PUBLIC`
  en boda genérica, la versión `1.2.0` y la nota de `gas/README.md`, al cerrar las tareas (I6).

### 14.7 Incoherencia a resolver: `type: "generic"` + `limit: "n"` en la app (comprobado en el código)

El pedido 11 introduce en la app un modelo que, **leyendo el código real**, ya está contemplado:
`interpretInvitation` (`src/utils/invitation.js`) valida el `limit` con `codeLimit(type, value)`, que
**ya** acepta `"n"` **cuando el tipo es `public`** y, cuando el tipo es `generic`, exige un entero > 0
(misma regla que el servicio). Con el cambio del pedido 11, el servicio puede devolver
`{ type: "generic", limit: "n" }`, y ahí `interpretInvitation` **fallaría** con `INVALID_DATA` (el
código lo llama «dato incoherente»: `blankInvitation(CODES.INVALID_DATA)`): la app **descartaría una
invitación que el servicio considera válida**. Es un fallo **silencioso y peor** que el actual (el
servicio diría «vale» y la app diría «los datos están incompletos»).

Por tanto, **sí** obliga a tocar la app, y el plan debe cubrirlo:

- `interpretInvitation` **y** `interpretLookup` (`invitation.js`) tienen que aceptar `"n"` en una
  invitación de tipo `generic` (la regla pasa a ser «`"n"` es válido en `public` y en `generic`; en
  `generic` cualquier otro valor no entero > 0 sigue siendo un dato fuera de contrato»).
- El **resto de la lectura ya es coherente** y **no** necesita cambios (comprobado en el código):
  `guestLimit` devuelve `Infinity` cuando `limit === NO_LIMIT` **sin mirar el tipo** (`invitation.js`
  ~249-256); `seatsText` dice «sin tope» con `limit === NO_LIMIT` **sin mirar el tipo** (~280-288);
  `attendeeLimits` devuelve `adults: "n"` en genérica y pública por igual, y `children: 0` (~227-237);
  `isWithinGuestLimit(total, Infinity)` devuelve `true` (~260-267); `validateRsvp` usa
  `guestLimit(invitation)` para la rama no personalizada (~108), así que un cupo sin tope **pasa**; y el
  **servicio** ya trata `limit !== NO_LIMIT && adults > limit → OVER_LIMIT` (~850), de modo que con
  `"n"` no hay tope.
- **Lo que NO se hace:** convertir la boda en `public` en la app (el `type` sigue siendo `generic`), ni
  ofrecer niños en una genérica (D12), ni inventar un máximo: `n` = sin tope (R1 intacta).
- Si al implementar apareciera **otra** incoherencia (p. ej. algún punto que asuma `"n"` ⇔ `public`),
  el plan debe **añadir el caso a la lógica pura y su prueba** antes de tocar la interfaz (RNF-4/RNF-9);
  lo que **no** puede es dejarlo sin resolver ni inventar un comportamiento.

### 14.8 Verificación del cambio

- **Automática (`npm test` con `node --test`, con `npm run build` en verde), contra el módulo del
  contrato y la lógica pura (004 RNF-10 intacta; nunca contra el servicio vivo):**
  - **Contrato:** el módulo declara `MALFORMED_GUEST` con su mensaje y su `retryable`; su
    `CONTRACT_VERSION` es `1.2.0`; el documento lo reproduce y la tabla de códigos coincide **en
    conjunto y en el mensaje de cada código** (que es lo que `test/serviceContract.test.js` ya exige);
    `gas/Code.gs` declara la **misma** versión.
  - **Lógica pura de la app:** `interpretInvitation` **e** `interpretLookup` aceptan
    `{ type: "generic", limit: "n" }` sin descartar la invitación, y siguen rechazando un genérico con
    `limit` no entero > 0; `guestLimit`, `attendeeLimits`, `seatsText`, `isWithinGuestLimit` y
    `validateRsvp` se comportan como «sin tope» con ese modelo; el código nuevo del contrato lo
    consume la app **desde el módulo** (sin literales en componentes).
- **Manual (Apps Script en ejecución: no hay runner; el veredicto va en «Verificación» de
  `AGENTS.md`), con el script **redesplegado** y un libro de prueba:**
  12. **Código mal formado → `MALFORMED_GUEST`.** Con una hoja `generic` de prueba (no el libro real)
      que tenga un código con `limit = "x"` (o `0`, o vacío): `resolve` y `lookup` de ese código
      responden **`MALFORMED_GUEST`** (no `INVALID_DATA`) y la app muestra su **aviso propio** («el
      código de la invitación no es válido»), **no** el de «datos incompletos», con su reintento; un
      código **inexistente** sigue siendo `UNKNOWN_GUEST` y un libro **sin la columna `phone`** sigue
      siendo `INVALID_DATA`.
  13. **`PUBLIC` en una boda genérica → sin tope.** En la boda `generic` del libro de prueba, con una
      fila `PUBLIC` con `limit = "n"`: `resolve` y `lookup` de `PUBLIC` responden `ok: true` con
      `type: "generic"` y `limit: "n"`; la app **no** descarta la invitación (no aparece «los datos de
      esta invitación están incompletos»), anuncia **sin tope**, ofrece el campo **numérico libre**
      (sin máximo) y permite confirmar con cualquier número de adultos; el envío con `PUBLIC` **no**
      devuelve `OVER_LIMIT` por cupo. Un `PUBLIC` con un `limit` **distinto** de `"n"` (p. ej. `3`)
      responde **`MALFORMED_GUEST`**.
- **Regresión de lo que ya funcionaba:** los códigos corrientes `…_GEN` de esa boda siguen
  resolviendo con su `limit` numérico y su combo `1..cupo`; el punto manual 11 de §10 (tolerancia de
  cabeceras) sigue pasando; y el **reparto** de `INVALID_DATA` de §13.3 sigue distinguiendo «cabecera
  que no hacía falta» de «fila ilegible de verdad».

### 14.9 Riesgos y su mitigación

- **Que el código nuevo se quede sin documentar o sin declarar en el módulo.** Mitigación: el código se
  declara en `SERVICE_ERRORS` (fuente única) y la prueba de sincronía exige que el documento no lo
  omita ni cambie su mensaje; el plan lo incluye como paso propio.
- **Que subir la versión se olvide en uno de los dos lados.** Mitigación: `test/serviceContract.test.js`
  compara la versión del script con la del módulo (leída como texto) y falla si divergen; el módulo la
  declara como literal (`CONTRACT_VERSION = "1.2.0"`), también vigilado.
- **Que la app descarte una invitación genérica sin tope (la incoherencia de §14.7).** Mitigación: el
  plan incluye el ajuste de `interpretInvitation`/`interpretLookup` y sus pruebas puras; sin eso, el
  servicio diría «vale» y la app diría «datos incompletos».
- **Que `PUBLIC` sin tope sirva de puerta para un cupo mal escrito.** Mitigación: la excepción es
  **solo** para el código reservado `PUBLIC` **con `"n"`**; cualquier otro `limit` (genérico o no) cae
  en `MALFORMED_GUEST`, no en «sin tope» (D22, RF-17).
- **Que el diagnóstico vuelva a ser opaco en el otro sentido** (creer que todo `INVALID_DATA` es un
  código mal formado). Mitigación: `INVALID_DATA` conserva sus causas (libro, hoja, cabeceras, filas
  ilegibles) y `gas/README.md` recoge el **reparto** completo con la tabla de distinción.
- **Que la fila `PUBLIC` siga estorbando en el libro real.** El arreglo **de datos** sigue siendo
  válido y recomendable (borrarla si la boda es solo de genéricos), pero **ya no es obligatorio** para
  que el servicio responda: con RF-17 ese código resuelve. Quien publica decide si la deja.
- **Que la app asuma `"n"` ⇔ `public` en algún punto no inventariado.** Mitigación: §14.7 inventaría lo
  comprobado en el código; el plan debe probar los módulos puros afectados (`invitation.test.js`,
  `rsvp.test.js`) y añadir los casos que falten antes de tocar la interfaz.
