# Especificación — Modelo de datos reutilizable de la invitación

## 1. Contexto y objetivo

La invitación de Karina & Gerardo ya es funcional, pero **su información vive dentro de la
interfaz** y la personalización por invitado depende de un parámetro de la URL
(`?invitados=N`) que solo indica un número, sin saber quién es el invitado.

**Objetivo:** que **toda** la información de **la boda** viva en **un único registro de datos**
con el **catálogo completo** —pareja, evento, portada, cita, historia, ubicaciones, itinerario,
mesa de regalos, hoteles, restricciones, confirmación, galería, ajustes, marca y plantilla—, y
que la **información de cada invitación** viva en **fichas aparte** (RF-16 y RF-19), también como
datos. Así, reutilizar la invitación para otra pareja consiste en **cambiar ese registro y volver
a publicar**, y la publicación es **un despliegue por pareja**.

**Precisión de vocabulario (evita ambigüedad):** cuando esta spec dice «**el registro**» se
refiere al **registro único de la boda**; las **fichas de invitación** y sus **enlaces** son
estructuras de datos **separadas** (RF-16, RF-19), no forman parte del registro de la boda.

La personalización pasa a modelarse con **tres tipos de invitación** —personalizada, reutilizable
y genérica— que **sustituyen** a `?invitados=N`. El **registro del invitado** tomará la **forma
del contrato del servicio de registro (Google Apps Script)** ya documentado. En esta versión ese
contrato es **solo una referencia de diseño** —no se conecta ningún servicio— y **los datos del
invitado quedan fijos** en la aplicación, con **datos de ejemplo** en el repositorio (RNF-7).

## 2. Usuarios

- **Anfitriones (la pareja):** publican y actualizan su invitación editando solo el registro;
  definen el **máximo de asistentes de la boda** y las **fichas de invitación** (personalizadas,
  hasta diez reutilizables y una genérica).
- **Invitado:** abre su enlace (personalizado, reutilizable o genérico), ve la información, las
  fotos y la música, ve sus lugares reservados **cuando existan** y confirma su asistencia.
- **Quien reutiliza la plantilla:** parte de la misma invitación cambiando solo el registro y
  volviendo a publicar.
- **Quien comprueba los datos:** al publicar, verifica que el registro esté completo y correcto;
  un dato inválido debe verse al instante.

## 3. Historias de usuario

- **HU-1:** Como anfitrión quiero cambiar cualquier dato de la boda en un solo lugar para no
  dejar datos viejos repartidos.
- **HU-2:** Como anfitrión quiero publicar la invitación de otra pareja cambiando solo ese
  registro.
- **HU-3:** Como anfitrión quiero apagar o dejar vacía una sección opcional sin que queden
  huecos ni errores.
- **HU-4:** Como anfitrión quiero invitar a alguien con un enlace personalizado que ya traiga
  su nombre y sus boletos.
- **HU-5:** Como anfitrión quiero repartir enlaces reutilizables con un límite de lugares, o
  uno genérico para todos, sin tener que registrar nombres.
- **HU-6:** Como invitado quiero confirmar con mi nombre, cuántas personas asistirán, mis
  alergias y un mensaje.
- **HU-7:** Como quien comprueba los datos quiero que un dato inválido falle de forma visible
  para no publicar una invitación rota.

## 4. Requisitos funcionales (criterios en EARS)

**RF-1 — Registro único de la boda**
- El sistema deberá describir toda la información **de la boda** en un único registro de datos,
  **distinto de las fichas de invitación** (RF-16, RF-19).
- El sistema deberá tomar de ese registro los nombres de la pareja, la fecha y hora, los
  textos, las imágenes y los enlaces de todas las secciones.
- SI un dato del registro cambia, ENTONCES el sistema deberá reflejarlo en todas las secciones
  que lo usan, sin ediciones adicionales en la interfaz.
- El sistema no deberá exigir editar la interfaz para cambiar el contenido ni los datos del
  evento; los cambios se publican **volviendo a construir el sitio** (RF-21).

**RF-2 — Pareja**
- El sistema deberá mostrar los nombres de las dos personas y su nombre para mostrar.
- DONDE el registro defina apellidos o nombres intermedios, el sistema deberá componer el
  nombre completo **uniendo solo los campos presentes** (sin dejar espacios ni separadores
  sobrantes).
- SI el registro define un nombre para mostrar, ENTONCES el sistema deberá usarlo; si no,
  deberá componerlo a partir de los nombres.

**RF-3 — Evento (fecha y hora)**
- El sistema deberá mostrar la fecha y la hora del evento a partir del registro.
- El sistema deberá usar la misma fecha y hora del registro para la cuenta regresiva.
- DONDE el registro indique una zona horaria, el sistema deberá interpretar la fecha en esa
  zona. SI no la indica, ENTONCES deberá interpretarla en la **zona local de quien la ve**
  (comportamiento actual).
- SI la fecha del evento **ya pasó**, ENTONCES el sistema deberá mostrar el estado «terminado»
  de la cuenta regresiva; una fecha pasada **no** es un dato inválido.
- SI la fecha está ausente o es **imposible**, ENTONCES será un dato requerido inválido (RF-20).

**RF-4 — Secciones del catálogo y visibilidad**
- «**Sección**» significa **área de contenido del registro**. El sistema deberá contemplar en
  esta implementación **todas** las áreas del catálogo: portada, pareja, cita, historia,
  ubicaciones, itinerario, mesa de regalos, hoteles, restricciones, confirmación y galería,
  incluidas las que hoy no existen (**cita** e **historia**).
- Las áreas que hoy no existen se incorporan como **bloques visuales propios** (cita e
  historia); las demás alimentan bloques ya existentes (pareja en la portada y el encabezado;
  restricciones junto a la confirmación).
- El sistema deberá presentar las secciones visibles en este orden: portada, pareja, cita,
  historia, ubicaciones, itinerario, mesa de regalos, hoteles, restricciones, confirmación y
  **galería**. La galería **cierra** la invitación: va al final, inmediatamente **antes del pie**.
- DONDE el registro marque una sección como no visible, el sistema deberá omitirla por
  completo. **La confirmación no es apagable: siempre está presente (RF-18).**
- SI una sección **opcional** no está definida en el registro **o está definida pero sin
  contenido**, ENTONCES el sistema deberá omitirla sin dejar hueco ni mostrar un error.
- CUANDO el invitado active un enlace de ubicación, hotel o mesa de regalos, el sistema deberá
  abrir el destino indicado.

**RF-5 — Ubicaciones (ceremonia y recepción)**
- El sistema deberá mostrar los lugares de ceremonia y recepción con su nombre, dirección y
  hora.
- DONDE el registro incluya un enlace de mapa, el sistema deberá ofrecer abrirlo.
- SI no hay enlace de mapa, ENTONCES el sistema deberá ofrecer buscar la dirección.

**RF-6 — Itinerario**
- DONDE el registro incluya un itinerario, el sistema deberá mostrar sus momentos en orden,
  con hora, título y descripción.

**RF-7 — Cita**
- DONDE el registro incluya una cita, el sistema deberá mostrarla con su texto y, si lo trae,
  su autor.

**RF-8 — Historia**
- DONDE el registro incluya una historia, el sistema deberá mostrar su título y sus párrafos
  en orden.

**RF-9 — Galería**
- El sistema deberá mostrar las imágenes definidas en el registro, respetando su orden y su
  texto alternativo.
- El sistema deberá conservar el carrusel y el visor a pantalla completa actuales.
- SI una imagen referida por el registro **no se puede resolver**, ENTONCES será un dato
  requerido inválido (RF-20).

**RF-10 — Mesa de regalos**
- El sistema deberá mostrar el título, el mensaje y las opciones de regalo del registro.
- Cada opción tendrá un **tipo**: **tienda o mesa**, **transferencia bancaria** o **efectivo**.
- El sistema deberá mostrar, por opción, su **etiqueta**, su **descripción** y su **enlace**
  cuando existan. Una opción de **transferencia** lleva además **datos copiables** (por
  ejemplo, banco, titular y cuenta/CLABE), de los que **como máximo uno** se marca como el dato
  que se copia (la cuenta); una de **efectivo** puede no llevar datos copiables.
- CUANDO el invitado solicite copiar, el sistema deberá copiar el **dato copiable marcado** de la
  opción —como máximo uno por opción— y avisar del resultado. Los demás datos se muestran como
  texto, sin botón.

**RF-11 — Hoteles**
- DONDE el registro incluya hoteles, el sistema deberá mostrarlos con nombre, dirección y
  notas, y ofrecer los enlaces de mapa y reserva cuando existan.
- DONDE el registro indique un precio, el sistema deberá mostrarlo.

**RF-12 — Restricciones (prioridad jerárquica)**
- DONDE el registro indique un código de vestimenta, el sistema deberá mostrarlo.
- DONDE el registro indique si se permiten niños u otras indicaciones, el sistema deberá
  mostrarlas.
- SI el registro **no indica** si se permiten niños, ENTONCES el sistema deberá considerarlos
  **permitidos** (sin restricción); la ausencia de este dato **no** es un dato inválido.
- El sistema deberá dar **prioridad jerárquica** a la configuración de la boda: en esta versión
  la jerarquía se aplica **al permiso de niños** (lo que define la boda se impone a la ficha);
  el resto de campos de la ficha son informativos.
- SI una ficha asigna boletos de niño mientras la boda no permite niños, ENTONCES el sistema
  deberá tratarlo como un **error de llenado** y fallar de forma visible (RF-20).

**RF-13 — Música**
- DONDE el registro habilite la música, el sistema deberá ofrecer el control de reproducir y
  pausar y usar la fuente indicada.
- SI la música está deshabilitada, ENTONCES el sistema deberá omitir el control.
- El sistema no deberá iniciar la música sin un gesto del invitado. **El registro no incluye
  ninguna opción de reproducción automática.**

**RF-14 — Navegación y marca**
- DONDE el registro habilite el encabezado o el panel flotante, el sistema deberá mostrarlos;
  si no, deberá omitirlos.
- DONDE el registro indique mostrar el pie de página, el sistema deberá mostrar el nombre y el
  sitio indicados.

**RF-15 — Plantilla visual**
- El sistema deberá permitir indicar en el registro la plantilla visual de la invitación.
- En esta versión el sistema deberá implementar únicamente la plantilla **clásica**, que es el
  **identificador del diseño actual**; las demás del catálogo serán **datos válidos** pero sin
  implementar.
- SI el registro indica una plantilla válida **no implementada**, ENTONCES el sistema deberá
  representar la invitación con la clásica y **avisar de forma visible** de que esa plantilla
  no está implementada (RF-20); no es un dato inválido.

**RF-16 — Tipos de invitación (sustituyen a `?invitados=N`)**
- El sistema deberá admitir tres tipos de invitación: **personalizada**, **reutilizable** y
  **genérica**.
- El **registro de invitaciones** contendrá **fichas con un código**; el sistema deberá componer
  el enlace a partir del código, de modo que el enlace **identifique la invitación** a la que
  pertenece.
- DONDE el tipo sea **personalizada**, el código deberá identificar además al invitado, y el
  sistema deberá traer de la ficha su nombre, su acompañante y sus boletos de adulto y de niño.
- DONDE el tipo sea **reutilizable**, la pareja definirá **hasta diez** fichas, cada una con un
  límite de lugares de **1 a 10** y **sin nombre** (la pareja no registra nombres); el sistema
  las ofrecerá como enlaces reutilizables.
- DONDE el tipo sea **genérica**, la pareja definirá **una** ficha, sin nombre ni lugares
  preasignados, acotada por el **máximo de la boda**.
- El sistema deberá dejar de usar el parámetro `?invitados=N`; esta retirada es una **excepción
  intencionada** a la continuidad de RF-22.

**RF-17 — Personalización del invitado y límites**
- Los tres tipos deberán permitir registrar el **nombre** de quien confirma: en la
  personalizada viene de la ficha y **no es editable**; en la reutilizable y la genérica lo
  escribe el invitado.
- Los tres tipos deberán permitir registrar **cuántas personas asistirán** (adultos y **niños
  cuando la boda los permita**), **sus alergias o restricciones alimentarias** y un **mensaje
  para la pareja**.
- El sistema deberá aplicar el límite que corresponda **según el tipo**: en la personalizada,
  los boletos de su propia ficha; en la reutilizable, el límite del enlace (1 a 10); en la
  genérica, el máximo de la boda.
- El límite contará **a todas las personas** que ocupen lugar (adultos y niños); en la
  personalizada, el acompañante forma parte de los boletos de la ficha.
- SI el número de asistentes indicado **supera** el límite aplicable, ENTONCES el sistema deberá
  impedirlo e indicarlo; un número **igual** al límite es válido.
- DONDE la ficha incluya un acompañante, el sistema deberá **mostrarlo** (no editable, como el
  titular de la personalizada).
- SI no hay invitado definido —no llega código, el código es **desconocido** o el tipo no tiene
  ficha (reutilizable y genérica)—, ENTONCES el sistema deberá mostrar la invitación completa,
  sin personalización ni lugares reservados; en la reutilizable y la genérica el límite se usa
  solo como **máximo seleccionable**.

**RF-18 — Confirmación (abierta hasta la fecha límite)**
- El sistema deberá mantener la confirmación disponible haya o no un invitado identificado,
  **hasta la fecha límite** indicada en el registro. **La confirmación siempre se muestra**
  (no está sujeta al apagado de secciones de RF-4).
  - **Derogación (spec 004):** para el caso «sin invitado identificado o servicio no
    disponible», `specs/004-servicio-invitados-rsvp/spec.md` **deroga** este «siempre se
    muestra»: el bloque de confirmación sigue **visible**, pero se muestra **deshabilitado**,
    con el motivo y la opción de reintentar (nunca se confirma a ciegas).
- El plazo se interpreta con la **misma zona horaria que el evento** (RF-3).
- El envío es válido mientras el instante actual **no supere** la fecha límite; al superarla, el
  sistema deberá cerrar el formulario e indicarlo de forma visible.
- El sistema deberá conservar los campos de la invitación actual (nombre, decisión de
  asistencia, comentarios) y añadir los que describen al invitado (número de asistentes,
  alergias, mensaje).
- El sistema deberá mostrar los lugares reservados del invitado junto al formulario **cuando
  existan** (invitación personalizada).

**RF-19 — Registro del invitado (fuente)**
- El sistema deberá tomar los datos del invitado de una **ficha con la forma del contrato del
  servicio de registro** (Google Apps Script) documentado; en esta versión ese contrato se toma
  como **referencia de diseño**, no como dependencia conectada.
- En esta versión, el sistema deberá leer esa ficha de un **registro fijo incluido en la
  aplicación**, sin consultar el servicio; el repositorio solo incluirá **fichas de ejemplo**
  (RNF-7).
- SI el servicio de registro no está disponible o no está conectado, ENTONCES el sistema
  deberá seguir mostrando la invitación con el registro fijo.

**RF-20 — Datos inválidos: fallo visible**

Datos **requeridos**: los nombres de la pareja, la fecha del evento, la fecha límite de
confirmación, el máximo de la boda y la plantilla. Datos **opcionales**: portada, cita, historia,
itinerario, galería, hoteles, mesa de regalos, restricciones, marca, encabezado/panel/pie y
música.

- SI un dato **requerido** está ausente o es inválido (por ejemplo, una fecha imposible, una
  zona horaria inexistente o una imagen referida que no se resuelve), ENTONCES el sistema deberá
  **fallar de forma visible**, de modo que quien comprueba los datos lo note al instante.
- SI hay un **conflicto de configuración** (por ejemplo, boletos de niño cuando la boda no
  permite niños), ENTONCES el sistema deberá tratarlo como error de llenado y fallar de forma
  visible.
- El sistema no deberá sustituir silenciosamente un dato inválido por un valor por defecto.
- El sistema deberá distinguir «**sección opcional ausente o vacía**» (se omite en silencio) de
  «**dato requerido inválido**» (falla visiblemente).
- SI la plantilla es un dato **válido no implementado**, ENTONCES el sistema deberá avisar de
  forma visible sin tratarlo como dato inválido (RF-15).

**RF-21 — Reutilización para otra pareja**
- El sistema deberá permitir reutilizar la invitación para otra pareja cambiando únicamente el
  registro de datos, sin modificar la interfaz, y **volviendo a publicar**.
- El sistema deberá publicar una invitación por pareja (**un despliegue por pareja**).
- El sistema no deberá exigir base de datos, panel de administración ni autenticación para
  publicar otra invitación.

**RF-22 — Continuidad con la invitación actual**
- El sistema deberá conservar el contenido actual (mismos nombres, textos, fotos y enlaces),
  ahora expresado en el registro.
- El sistema deberá conservar los comportamientos actuales: portada, tema claro y oscuro,
  música, cuenta regresiva, galería y visor, confirmación y copiado de datos.
- La única excepción de continuidad es la retirada de `?invitados=N` (RF-16).

## 5. Requisitos no funcionales

- **RNF-1 Mantenibilidad:** ningún texto de contenido ni dato del evento en la interfaz; todo
  se lee del registro. **Una vez implementadas las áreas del catálogo (RF-4)**, añadir o quitar
  su contenido es un cambio de datos, no de interfaz.
- **RNF-2 Accesibilidad:** contraste suficiente en ambos temas, foco visible y navegación por
  teclado en **todas las secciones**, incluida la portada, el visor, los controles y las
  secciones nuevas (cita e historia).
- **RNF-3 Movimiento:** respetar la preferencia de movimiento reducido.
- **RNF-4 Rendimiento:** la primera carga no descarga los originales de gran tamaño.
- **RNF-5 Idioma:** el **registro de la boda** y los **textos visibles** van en español. La
  **ficha del invitado** conserva los identificadores del **contrato del servicio** (en inglés)
  como **excepción documentada** (enmienda del principio 6 de la constitución).
- **RNF-6 Compatibilidad:** navegadores modernos de escritorio y móvil, una sola vista
  adaptable.
- **RNF-7 Privacidad:** los **datos personales reales** de los invitados **no** se versionan en
  el repositorio. El repositorio solo lleva **fichas de ejemplo**; en un despliegue real, los
  datos del invitado llegan **sin versionarse** (un fichero local no versionado o, más adelante,
  el servicio de registro).
- **RNF-8 Validación:** en esta versión la validación del registro es **manual**; la
  comprobación programática es posterior (por eso RF-20 exige que el fallo se vea).

## 6. Casos límite

Se detallan aquí los que definen comportamiento; el resto se depuran en `../../PENDING_TASKS.md`.

- **Secciones y contenido:** sección opcional ausente; lista vacía (galería, hoteles, itinerario,
  opciones de regalo, párrafos de la historia); sección marcada como visible **pero vacía** (se
  omite sin hueco); imagen referida que **no se resuelve** (fallo visible); enlace de mapa o
  reserva **ausente** frente a **vacío**; enlace con esquema inválido.
- **Fechas:** fecha ausente o imposible (fallo visible); fecha **ya pasada** (estado
  «terminado», no es error); fecha límite en una zona distinta a la del evento (se usa la del
  evento); **instante exacto** de la fecha límite (el envío es válido hasta ese instante, deja de
  serlo al superarlo); fecha límite anterior al evento.
- **Invitaciones:** código **ausente**, **desconocido**, **duplicado** o con distinta
  mayúsculas/espacios (se normaliza y, si no se reconoce, se trata como «sin invitado»);
  reutilizable con límite **0** o **mayor que 10** (fallo visible: dato inválido); asistentes
  **iguales** al límite (válido) o **por encima** (bloqueado); personalizada con **0 boletos**;
  ficha con **más boletos que el máximo de la boda**; **invitado compartido** (alguien que recibe
  el enlace de otro): la personalizada conserva el nombre de la ficha y **no deja editarlo** —es
  una limitación conocida—; **dos pestañas** con códigos distintos resuelven cada una su código.
- **Restricciones:** niños no indicados (permitidos); conflicto boda↔ficha (fallo visible).
- **Plantilla:** válida no implementada (render clásico + aviso visible); plantilla desconocida.
- **Reutilización:** referencias de imagen o de enlace **huérfanas** al cambiar de pareja (fallo
  visible las requeridas).

## 7. Fuera de alcance

- No hay backend propio, base de datos, panel de administración, CMS ni autenticación.
- No hay **multi-inquilino**: un despliegue por pareja (implica volver a publicar al cambiar el
  registro).
- **No se conecta el servicio de registro (Google Apps Script):** es solo una **referencia de
  contrato**; en esta iteración no se da de alta ningún tercero nuevo. La conexión queda para la
  siguiente iteración.
- **No se define el tope global de asistentes** (la suma de todas las respuestas y qué ocurre
  al agotarse): se anota como pendiente para más adelante.
- No hay **validación automática** del registro (queda manual).
- No se implementan plantillas visuales distintas de la **clásica**.
- No se cambia el canal externo de la confirmación ni los destinos externos.
- No se rehace el contenido fotográfico ni se reescribe el texto del evento.
- El tema claro/oscuro sigue siendo una preferencia del invitado, no un dato de la boda.

## 8. Criterios de finalización

- **El registro de la boda** (pareja, evento, secciones, ajustes, marca y plantilla) y las
  **fichas de invitación** son datos; la interfaz no contiene textos de contenido codificados.
- Cambiar el registro por los datos de otra pareja produce una invitación coherente tras volver
  a publicar, sin tocar la interfaz (verificado a mano).
- Las secciones nuevas del catálogo (**cita** e **historia**) se muestran cuando el registro
  las trae.
- Los tres tipos de invitación se comportan como se describe, con el límite correcto en cada
  uno, y `?invitados=N` ya no se usa.
- Cada sección del catálogo se muestra u omite según el registro, sin huecos ni errores.
- Un dato requerido inválido o un conflicto de configuración produce un fallo **visible**; una
  plantilla válida no implementada produce un **aviso visible**; la confirmación se cierra al
  superar la fecha límite.
- Los comportamientos actuales siguen operativos (salvo `?invitados=N`): portada, tema, música,
  cuenta regresiva, galería y visor, confirmación y copiado de datos.
- Verificación manual en navegador, escritorio y móvil, anotada en la sección «Verificación».
- **Gobernanza:** `../../docs/constitution.md` (principios 2, 3, 5 y 6), `AGENTS.md` y `README.md` se
  actualizan con el nuevo modelo (registro único, textos fuera de la interfaz, contrato del
  invitado).

## 9. Dudas abiertas

- Ninguna pendiente por ahora. Los casos límite y las dudas que surjan se registran y depuran
  en `../../PENDING_TASKS.md`.
