# Especificación — Servicio de invitados y confirmación

## 1. Contexto y objetivo

Hoy la invitación **resuelve al invitado con fichas de ejemplo locales** (enlaces con
`?codigo=`/`code`/`inv`) y **envía la confirmación a un servicio de correo externo
(FormSubmit.co)**. En paralelo ya existe un **servicio de registro** (Google Apps Script) que es
la fuente real de los invitados y el destino natural de las confirmaciones: lo consulta por
`slug` (la boda) y `guest` (el invitado), y escribe cada respuesta en su hoja.

**Objetivo:** conectar la invitación a ese **servicio de registro** para (1) **traer los datos del
invitado** a partir de su enlace y personalizar la invitación, y (2) **enviar la confirmación** al
servicio, retirando el canal de correo actual. El **contenido de la boda** (nombres, fecha,
secciones, fotos) **sigue viviendo en el repositorio**, como manda la spec 002; solo el invitado y
la confirmación salen del repositorio.

**Por qué:** hoy los datos del invitado son de mentira (fichas de ejemplo) y las confirmaciones se
pierden en un correo. Con el servicio, cada invitado ve sus lugares reales y la pareja recibe cada
respuesta en su hoja, sin pasar por el correo.

**Precisión de vocabulario (evita ambigüedad):** «**servicio de registro**» es el servicio externo
ya documentado (Google Apps Script); «**el registro**» es el registro único de la boda que vive en
el repositorio (spec 002); «**ficha de ejemplo**» es una ficha local ficticia usada solo para
desarrollo y pruebas.

### Decisiones de alcance (fijadas con quien pide la spec)

- **D1 — Solo invitado y RSVP vienen del servicio.** El contenido de la boda no se pide al
  servicio en esta versión; sigue en el registro local.
- **D2 — El enlace identifica por `slug` + `guest`.** Se adoptan los parámetros del contrato del
  servicio; `codigo`/`code`/`inv` se jubilan (excepción intencionada de continuidad, como se hizo
  con `?invitados=N`).
- **D3 — Dos tipos de invitación**, los del servicio: **personal** (con lugares asignados) y
  **genérica** (código reutilizable con un límite). La distinción anterior entre «reutilizable» y
  «genérica» desaparece del modelo; es una cuestión de datos.
- **D4 — Ciclo completo de la confirmación:** confirmar, editar, declinar/cancelar y respetar el
  estado terminal.
- **D5 — Degradación visible y confirmación bloqueada:** sin datos del invitado no se confirma; las
  fichas de ejemplo locales quedan solo para desarrollo y pruebas.

## 2. Usuarios

- **El invitado personal.** Abre su enlace, ve que tiene lugares reservados (adultos y, si los
  hay, niños) y a su acompañante, confirma cuántos asistirán, puede editar dentro del plazo y puede
  cancelar después de haber confirmado.
- **El invitado genérico.** Abre un enlace reutilizable, escribe su nombre y confirma o declina
  dentro del límite del código.
- **La pareja.** Ve en su hoja cada confirmación, edición, declive y cancelación, con el nombre de
  quien responde; no usa esta app para gestionar, pero depende de que las respuestas lleguen.
- **Quien publica y reutiliza la invitación.** Da de alta el enlace de cada invitado en el servicio
  y configura la invitación para hablar con él.
- **Quien comprueba la invitación.** Necesita que un fallo del servicio o un invitado desconocido
  se vean al instante y no se disfracen de una respuesta válida.

## 3. Historias de usuario

- **HU-1:** Como invitado personal quiero que mi enlace me muestre mis lugares reservados para saber
  cuántas personas puedo confirmar.
- **HU-2:** Como invitado genérico quiero escribir mi nombre y confirmar o declinar dentro del
  límite de mi enlace.
- **HU-3:** Como invitado quiero editar mi respuesta (o cancelarla) dentro del plazo, sin tener que
  avisar a nadie.
- **HU-4:** Como invitado quiero saber si mi confirmación se registró o si falló, para no quedarme
  con la duda.
- **HU-5:** Como pareja quiero que cada respuesta llegue a mi hoja con el nombre de quien responde,
  para planear los asientos.
- **HU-6:** Como quien comprueba quiero que un servicio caído, una boda o un invitado desconocidos
  se vean de forma clara y que la app no confirme a ciegas.

## 4. Requisitos funcionales (criterios en EARS)

**RF-1 — El invitado se trae del servicio de registro**
- CUANDO la invitación se abra con un identificador de boda y de invitado, el sistema deberá traer
  los datos del invitado desde el servicio de registro para personalizar la invitación.
- El sistema no deberá tomar los datos del invitado de las fichas de ejemplo locales.
- El sistema no deberá versionar datos personales reales de invitados; en un despliegue real, los
  datos llegan del servicio.

**RF-2 — Identificación por enlace (`slug` + `guest`)**
- El sistema deberá identificar la boda por el parámetro `slug` y al invitado por el parámetro
  `guest`.
- El sistema deberá dejar de usar los parámetros `codigo`/`code`/`inv` (excepción intencionada de
  continuidad con los enlaces actuales).
- DONDE el enlace no traiga `guest`, el sistema deberá mostrar la invitación sin personalización
  (RF-9).

**RF-3 — Dos tipos de invitación (personal y genérica)**
- El sistema deberá reconocer dos tipos de invitado: **personal** y **genérica**.
- DONDE el invitado sea **personal**, el sistema deberá mostrar su nombre, su acompañante cuando
  exista, y sus lugares reservados de adultos y de niños.
- DONDE el invitado sea **genérica**, el sistema deberá pedir el nombre de quien confirma y acotar
  los asistentes al límite del código, sin ofrecer lugares de niño.
- SI el servicio indica un tipo distinto de los dos, ENTONCES el sistema deberá tratarlo como fallo
  visible (RF-11).

**RF-4 — Límites de asistencia**
- El sistema deberá acotar el número de asistentes al cupo que corresponda: los lugares de la
  invitación personal (adultos y niños) o el límite del código genérico (solo adultos).
- Un número **igual** al límite deberá ser válido; un número **por encima** deberá impedirse e
  indicarse de forma visible.
- DONDE la invitación sea personal, el sistema deberá mostrar los lugares reservados junto al
  formulario.

**RF-5 — La confirmación se envía al servicio (se retira el correo)**
- CUANDO el invitado confirme o decline, el sistema deberá enviar la respuesta al servicio de
  registro.
- El sistema deberá dejar de enviar la confirmación al servicio de correo (FormSubmit.co).
- El sistema deberá enviar al servicio la decisión de asistencia, el número de adultos, el número de
  niños cuando aplique, el nombre cuando corresponda, las restricciones alimentarias y el mensaje.

**RF-6 — Confirmar y editar dentro del plazo**
- MIENTRAS el plazo esté abierto y el estado no sea terminal, el sistema deberá permitir confirmar y
  volver a enviar para editar la respuesta.
- CUANDO el invitado personal ya haya confirmado, el sistema deberá mostrar su respuesta actual para
  editarla.
- DONDE la invitación sea genérica, el sistema no deberá ofrecer editar: no existe una respuesta
  previa que actualizar.

**RF-7 — Declinar y cancelar (estado terminal)**
- El sistema deberá permitir **declinar** la invitación, personal o genérica (esta última siempre
  con nombre), dentro del plazo.
- DONDE la invitación sea personal y ya esté confirmada, el sistema deberá permitir además
  **cancelar**.
- DONDE el estado del invitado sea terminal (declinado o cancelado), el sistema deberá mostrar el
  formulario bloqueado e indicarlo.
- El sistema no deberá permitir confirmar ni editar a quien ya declinó o canceló.

**RF-8 — Plazo de la confirmación**
- El sistema deberá cerrar el formulario al superar la fecha límite, interpretada con la misma zona
  horaria que el evento.
- SI el servicio rechaza el envío por plazo vencido, ENTONCES el sistema deberá mostrarlo de forma
  visible.

**RF-9 — Sin invitado identificado o servicio no disponible**
- SI falta `slug` o `guest`, o el invitado o la boda son desconocidos, o el servicio no responde,
  ENTONCES el sistema deberá mostrar la invitación completa **sin personalización**, con un aviso
  visible y opción de reintentar.
- MIENTRAS no haya datos del invitado, el formulario de confirmación deberá quedar **bloqueado** e
  indicarlo; el sistema no deberá confirmar a ciegas.
- El sistema no deberá sustituir silenciosamente los datos del invitado por valores de ejemplo.

**RF-10 — Resultado del envío**
- CUANDO un envío termine, el sistema deberá mostrar de forma visible si la confirmación se registró
  o si falló, distinguiendo el fallo del servicio del plazo vencido.
- MIENTRAS un envío esté en curso, el sistema deberá impedir envíos repetidos.
- El sistema no deberá dar por confirmada una respuesta que el servicio no aceptó.

**RF-11 — Respuesta inválida del servicio: fallo visible**
- SI la respuesta del servicio es inválida o incoherente (tipo desconocido, falta un dato
  requerido), ENTONCES el sistema deberá fallar de forma visible sin personalizar con datos
  incompletos.
- El sistema no deberá inventar nombre, cupos ni acompañante que el servicio no entregue.

**RF-12 — Configuración del servicio**
- El sistema deberá tomar la ubicación del servicio de registro de la **configuración**, no del
  contenido de la boda ni de los datos del invitado.
- SI la ubicación del servicio no está configurada, ENTONCES el sistema no deberá intentar la
  llamada y mostrará la invitación sin personalización (RF-9).

**RF-13 — El contenido de la boda sigue local**
- El sistema deberá seguir tomando todo el contenido de la boda del **registro local** (spec 002);
  esta spec no lo mueve al servicio.
- El sistema deberá conservar los comportamientos actuales (portada, tema, música, cuenta
  regresiva, galería y visor) salvo los cambios de esta spec.

## 5. Requisitos no funcionales

- **RNF-1 Mantenibilidad.** La ubicación del servicio y el `slug` son configuración; los datos del
  invitado no se incrustan en la interfaz. Atender a otro invitado no exige editar la app.
- **RNF-2 Privacidad.** Ningún dato personal real de invitados se versiona. Lo único que el
  navegador recuerda sigue siendo el tema; no se persisten respuestas ni datos del invitado.
- **RNF-3 Fallo visible.** Un servicio caído, un invitado desconocido o una respuesta inválida se
  ven; nunca se finge una confirmación registrada.
- **RNF-4 Compatibilidad.** La conexión con el servicio debe funcionar con la invitación publicada
  en cualquier subruta y desde un móvil.
- **RNF-5 Rendimiento.** La personalización no debe bloquear el despliegue del contenido de la
  boda; la confirmación no debe añadir descargas pesadas.
- **RNF-6 Accesibilidad.** Los avisos y los estados de envío se anuncian a las tecnologías de
  asistencia; el formulario sigue siendo operable por teclado y con foco visible.
- **RNF-7 Idioma.** Los textos visibles y los mensajes del sistema van en **español**; los
  identificadores del **contrato del servicio** (cuerpo de la confirmación y parámetros) conservan
  su forma en inglés como **excepción documentada**.
- **RNF-8 Sin dependencias nuevas.** La conexión se hace con lo que ya permite la constitución
  (React + Vite); no se añaden librerías, servicios ni herramientas.

## 6. Casos límite

- **Servicio caído, lento o sin respuesta:** la invitación se muestra sin personalización, con aviso
  y reintento; la confirmación queda bloqueada (RF-9).
- **Boda desconocida (`slug` sin ficha en el servicio):** sin personalización, aviso y confirmación
  bloqueada.
- **Invitado desconocido (`guest` sin fila):** sin personalización, aviso y confirmación bloqueada.
- **Sin `guest` en el enlace:** invitación completa sin personalización y sin confirmación.
- **Servicio no configurado** (desarrollo/demo): no se llama; invitación sin personalización.
- **Estado terminal** (cupos en negativo): el formulario se muestra bloqueado; confirmar o editar
  vuelve a fallar.
- **Plazo vencido:** el formulario está cerrado; si aun así se envía, el servicio lo rechaza y se
  muestra.
- **Zona horaria:** la fecha límite se interpreta en la zona del evento; un instante exacto en el
  límite es válido y deja de serlo al superarlo.
- **Genérica con varios envíos:** cada confirmación añade una respuesta nueva; el sistema no ofrece
  editar para no duplicar (RF-6).
- **Genérica sin nombre:** no se confirma ni se declina (el nombre es obligatorio).
- **Niños en invitación genérica:** no se ofrecen; si el servicio los rechaza, se muestra el motivo.
- **Asistentes por encima del cupo:** se impide antes de enviar y el servicio también lo rechaza.
- **Invitación personal con 0 lugares:** no se puede confirmar asistencia (solo declinar/cancelar).
- **Doble clic / dos pestañas:** se impide el envío repetido mientras hay uno en curso (RF-10).
- **Campos opcionales ausentes en la respuesta** (mensaje, restricciones): no rompen la
  personalización.
- **Envío sin conexión:** se muestra el fallo y se ofrece reintentar; no se pierde el formulario.
- **Divergencia entre el plazo del registro local y el del servicio** (ver dudas abiertas).

## 7. Fuera de alcance

- **Traer la información de la boda del servicio:** el contenido sigue en el registro local
  (spec 002).
- **Teléfono y notificaciones premium** (por ejemplo, avisar a la pareja por WhatsApp): no se
  registra el teléfono ni se notifica.
- **Invalidación de caché del servicio:** sigue siendo una operación manual.
- **Desplegar o configurar el servicio** (publicar el script, dar de alta bodas o invitados): es
  trabajo externo a la app.
- **Panel de administración** para crear bodas o editar hojas.
- **Migración** de respuestas ya escritas en hojas o canales anteriores.
- **Cambiar el modelo del servicio** (añadir tipos, campos o códigos): esta spec consume el contrato
  existente.
- **Los tres tipos anteriores (personalizada/reutilizable/genérica)** como modelo: se sustituyen por
  los dos del servicio.
- **Otros destinos externos del RSVP** además del servicio de registro.

## 8. Criterios de finalización

- La invitación personaliza al invitado **personal** y a la **genérica** a partir del servicio, con
  el límite correcto en cada caso.
- La confirmación se envía al servicio y **ya no** a FormSubmit.co; `codigo`/`code`/`inv` dejan de
  usarse.
- Se cubre el **ciclo completo**: confirmar, editar (personal), declinar (ambos), cancelar
  (personal) y respetar el estado terminal.
- Servicio caído, boda/invitado desconocidos o sin `guest` producen **degradación visible con
  confirmación bloqueada**, nunca una confirmación falsa.
- El **contenido de la boda** sigue viniendo del registro local y los comportamientos actuales
  (portada, tema, música, cuenta regresiva, galería y visor) se conservan.
- Verificación automática con el contrato real del servicio y `npm test` + `npm run build` en verde;
  verificación manual en navegador (escritorio y móvil) anotada en la sección «Verificación».
- **Gobernanza:** `docs/constitution.md` (principios 2, 3, 5, 6), `AGENTS.md` y `README.md` se
  actualizan: el contrato del servicio deja de ser «solo referencia» y el enlace pasa a
  `slug` + `guest`.

## 9. Dudas abiertas

- **[NECESITA ACLARACIÓN] Plazo visible.** La lectura de un invitado no devuelve el plazo: ¿de dónde
  sale el plazo que ve el invitado —se consulta también la boda al servicio, se añade al contrato
  del invitado, o se usa el del registro local con el riesgo de que diverja del que aplica el
  servicio?
- **[NECESITA ACLARACIÓN] Tipo del invitado.** La lectura de un invitado no devuelve explícitamente
  el tipo personal/genérica: ¿se añade al contrato, se infiere de los datos, o se consulta también
  la boda?
- **[NECESITA ACLARACIÓN] Coincidencia de `slug`.** ¿El `slug` del enlace debe coincidir con la boda
  del registro local? ¿Qué debe pasar si un mismo despliegue recibe el `slug` de otra boda?
- **[NECESITA ACLARACIÓN] Reconfirmación genérica.** Como cada envío genérico añade una respuesta,
  ¿basta con bloquear el reenvío en la misma sesión o debe impedirse siempre tras la primera?
- **[NECESITA ACLARACIÓN] Entorno sin servicio.** ¿La invitación debe poder funcionar sin servicio
  alguno (solo con el registro local) para desarrollo y demo, o exige un servicio configurado?
