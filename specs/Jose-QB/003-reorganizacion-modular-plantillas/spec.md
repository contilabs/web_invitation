# Especificación — Reorganización modular para soportar plantillas

## 1. Contexto y objetivo

La invitación ya es funcional y toda su información vive en un registro de datos único. Sin embargo, su
organización interna está pensada para **una sola forma de presentarla**: las piezas reutilizables, las
secciones de contenido y la presentación del diseño están mezcladas en el mismo espacio de nombres, con
una nomenclatura mixta en español e inglés.

**Objetivo:** dejar preparada la invitación para poder ofrecer **varias plantillas de diseño** en el
futuro —conservando una sola lógica, un solo conjunto de datos y unas mismas secciones— **sin cambiar
nada de lo que el invitado percibe en pantalla** (aspecto, contenido y comportamiento) en esta versión.

Para conseguirlo, esta versión **reorganiza los módulos** del proyecto y **unifica en inglés la
nomenclatura del código**, manteniendo **paridad visual y funcional estricta** con la invitación actual.

**Por qué:** hoy añadir un diseño distinto obligaría a duplicar o a mezclar lógica con presentación. Con
la separación entre *qué se muestra* (secciones y datos), *cómo se comporta* (lógica y flujos) y *cómo se
ve* (plantilla de presentación), una plantilla futura se podrá aportar sin tocar la lógica ni los datos.
El coste de no hacerlo ahora crece con cada sección que se añada.

**Precisión de vocabulario (evita ambigüedad):**

- **Plantilla:** la única capa que decide *cómo se ve* la invitación (aspecto y composición visual de las
  piezas: estilos, colores, tipografías, iconos, disposición y transiciones). **No** contiene datos, **no**
  contiene reglas de negocio y **no** decide qué secciones se muestran ni en qué orden.
- **Sección:** cada bloque de contenido del catálogo que el registro activa o desactiva (hero o inicio,
  fecha y cuenta regresiva, cita, historia, ubicaciones, itinerario, galería, mesa de regalos, hoteles,
  restricciones y confirmación).
- **Piezas de estructura:** la portada, el encabezado, el pie, los controles flotantes y el aviso del
  sistema. No son secciones del catálogo: existen siempre que el registro las active y su sitio es fijo.
- **Nomenclatura del código:** nombres de archivos y carpetas de código, módulos, componentes, hooks,
  funciones, variables, constantes, clases de estilo y pruebas.

**Referencia de paridad:** a efectos de esta spec, la **referencia** es la invitación tal como está hoy,
con los mismos datos, **fijada antes de empezar el cambio** (una copia del sitio ya construido). Sin esa
referencia congelada, la paridad no es comprobable.

## 2. Usuarios

- **Mantenedor del proyecto (usuario principal).** Quiere añadir o probar una plantilla de diseño nueva
  sin reescribir ni duplicar lógica, datos o comportamientos, y quiere que el código se lea de forma
  consistente (nomenclatura unificada en inglés).
- **Invitado (usuario final, secundario en esta versión).** No debe notar **ningún** cambio: ni en el
  aspecto, ni en el contenido, ni en cómo se comporta la invitación.

## 3. Historias de usuario

- **HU-1.** Como mantenedor, quiero que el proyecto esté organizado de forma modular, separando lo
  reutilizable, las secciones de contenido y la presentación del diseño, para poder añadir una plantilla
  nueva sin tocar la lógica ni los datos.
- **HU-2.** Como mantenedor, quiero que la nomenclatura del código esté unificada en inglés, para que el
  código sea consistente y reconocible, sin que ello altere nada de lo que ve el invitado.
- **HU-3.** Como invitado, quiero seguir viendo y usando la invitación exactamente igual que hasta
  ahora, para que la reorganización no me afecte en absoluto.

## 4. Requisitos funcionales (RF)

### RF-1 — Organización modular orientada a plantillas

**Descripción:** el proyecto DEBE quedar organizado en áreas separadas: lógica de negocio, datos, piezas
de interfaz reutilizables, secciones de contenido, piezas de estructura y presentación de la plantilla.
Esa separación DEBE ser **puramente organizativa**: no DEBE cambiar lo que el invitado ve ni cómo se
comporta la invitación.

**Criterios de aceptación:**

- **CUANDO** se presenta la invitación con los mismos datos, **EL SISTEMA DEBE** verse y comportarse
  igual que la referencia.
- **EL SISTEMA DEBE** mantener el mismo conjunto de secciones, en el mismo orden y con el mismo
  contenido que la referencia.
- **CUANDO** se ejecutan los flujos existentes (ingreso desde la portada, cambio de tema, música tras un
  gesto, cuenta regresiva, galería y visor, confirmación y copiado de datos), **EL SISTEMA DEBE**
  comportarse de forma idéntica a como lo hacía antes.
- **DONDE** una pieza la usen **dos o más** secciones y su resultado visible sea idéntico en todas ellas,
  **EL SISTEMA DEBE** exponerla como pieza común, en lugar de repetirla.
- **SI** dos piezas se parecen pero su resultado visible difiere, **ENTONCES EL SISTEMA DEBE** mantenerlas
  separadas: la paridad tiene prioridad sobre cualquier unificación.

### RF-2 — Una sola plantilla, sin forma de elegir otra

**Descripción:** la invitación DEBE presentarse **siempre** con la plantilla por defecto, que es la
actual. En esta versión **NO DEBE** existir ninguna forma de indicar otra plantilla, ni visible ni por
enlace. La presentación DEBE quedar concentrada en la capa de plantilla.

**Criterios de aceptación:**

- **CUANDO** el invitado abre la invitación, **EL SISTEMA DEBE** presentarla con la plantilla por defecto
  y solo con esa.
- **EL SISTEMA NO DEBE** ofrecer ningún control, menú, indicación, parámetro de enlace, ajuste ni modo de
  acceso para cambiar de plantilla.
- **CUANDO** se compara la plantilla por defecto con la referencia usando los mismos datos, **EL SISTEMA
  DEBE** producir la misma apariencia: mismas piezas visibles, misma estructura visible del contenido y
  mismo resultado visual efectivo (espaciados, alineaciones, tipografías, colores, bordes, redondeos,
  imágenes, iconos y transiciones).
- **EL SISTEMA DEBE** concentrar en la capa de plantilla todas las decisiones de aspecto, de modo que
  ninguna otra área contenga decisiones visuales.

**Dirección (no se evalúa en esta versión):** que una plantilla futura pueda incorporarse sin modificar la
lógica de negocio, los datos ni las secciones. No se comprueba con una plantilla real porque crear
plantillas adicionales queda **fuera de alcance**.

### RF-3 — Nomenclatura del código unificada en inglés

**Descripción:** los nombres del **código** —archivos y carpetas de código, módulos, componentes, hooks,
funciones, variables, constantes, nombres de clases de estilo y nombres de pruebas— DEBEN quedar
unificados en inglés, con **una sola** convención, sin alterar la apariencia ni el comportamiento.

La unificación **NO** alcanza a los datos, a los textos que ve el invitado, a los contratos ya publicados,
a los recursos ni a los comentarios y la documentación (ver el detalle en «Casos límite»).

**Criterios de aceptación:**

- **CUANDO** se presenta la invitación con los mismos datos, **EL SISTEMA DEBE** producir la misma
  apariencia que la referencia, aunque los nombres de los archivos y de las clases de estilo hayan
  cambiado.
- **MIENTRAS** se aplican los estilos, **EL SISTEMA DEBE** conservar el mismo resultado visual efectivo
  que la referencia, sin cambios en colores, tamaños, espaciados, alineaciones, tipografías, bordes,
  redondeos, imágenes, iconos ni transiciones.
- **EL SISTEMA DEBE** mantener sin cambios los atributos que afectan a lo visible y a la accesibilidad
  (textos alternativos, títulos y etiquetas accesibles).
- **EL SISTEMA NO DEBE** traducir al inglés ningún texto dirigido al invitado.
- **EL SISTEMA NO DEBE** renombrar los datos ni sus claves, los contratos ya publicados ni los recursos.
- **EL SISTEMA DEBE** usar una única convención de nombres en inglés para todo el código.

### RF-4 — Secciones, orden y contenido intactos

**Descripción:** todas las secciones existentes DEBEN conservarse con el mismo contenido, el mismo orden
y el mismo comportamiento, incluidas las que se omiten cuando no tienen datos.

**Criterios de aceptación:**

- **CUANDO** se resuelven las secciones que deben mostrarse con los datos actuales, **EL SISTEMA DEBE**
  devolver el mismo conjunto y el mismo orden que la referencia.
- **CUANDO** se muestra una sección, **EL SISTEMA DEBE** mostrar exactamente los mismos títulos,
  párrafos, listas, botones, enlaces, imágenes y datos que la referencia.
- **CUANDO** se abre la invitación con un enlace de invitado, **EL SISTEMA DEBE** mostrar la misma
  personalización que hoy (nombre, acompañante, lugares reservados y límite de asistentes), con el mismo
  comportamiento.
- **SI** una sección opcional no tiene datos, **ENTONCES EL SISTEMA DEBE** seguir omitiéndola, igual que
  ahora.

### RF-5 — Flujos, estado y accesibilidad intactos

**Descripción:** todos los comportamientos interactivos y de estado DEBEN mantenerse idénticos: portada,
tema (día/noche), música, cuenta regresiva, galería y visor, confirmación de asistencia, copiado de datos
y navegación por teclado.

**Criterios de aceptación:**

- **CUANDO** el invitado entra desde la portada, **EL SISTEMA DEBE** cerrarla, devolver el foco al inicio
  y comenzar la música como consecuencia del gesto, exactamente igual que hoy.
- **CUANDO** el invitado cambia el tema, o el sistema cambia su preferencia mientras no hay una elección
  guardada, **EL SISTEMA DEBE** aplicarlo y recordarlo igual que hoy, sin perder la elección ya guardada
  por invitados anteriores.
- **CUANDO** el invitado recorre la galería, **EL SISTEMA DEBE** mantener el mismo comportamiento de
  avance, pausa, visor a pantalla completa, contador, cierre y navegación por teclado.
- **CUANDO** el invitado envía la confirmación, **EL SISTEMA DEBE** enviarla al mismo destino, con los
  mismos datos y el mismo comportamiento de validación del navegador.
- **CUANDO** el invitado copia un dato de la mesa de regalos, **EL SISTEMA DEBE** dar la misma respuesta
  visible que hoy (incluido el aviso cuando no se puede copiar).
- **CUANDO** el invitado usa solo el teclado, **EL SISTEMA DEBE** mantener la misma navegación, el mismo
  foco visible y el mismo enlace para saltar al contenido.
- **CUANDO** el invitado no tiene JavaScript habilitado, **EL SISTEMA DEBE** seguir mostrando el mismo
  aviso en español.
- **CUANDO** el sistema expresa preferencia por movimiento reducido, **EL SISTEMA DEBE** seguir
  respetándola igual que hoy.

## 5. Requisitos no funcionales (RNF)

- **RNF-1 — Paridad visual estricta.**
  - Con los mismos datos, la invitación DEBE verse igual que la referencia.
  - **Cómo se determina:** comparando la referencia con el resultado del cambio, sobre el **resultado
    visible**: la estructura visible del contenido (piezas y su orden), los atributos que afectan a lo
    visible y los **estilos efectivos** resultantes; además, en los mismos anchos de pantalla y en los
    dos temas que ya usa la verificación del proyecto.
  - **Qué queda fuera de la comparación:** los nombres internos de archivos y de clases de estilo.
  - **Matriz mínima:** los tres tipos de invitación (personalizada, reutilizable y genérica), un registro
    inválido, una sección omitida por falta de datos, un aviso por plantilla no implementada y el estado
    de confirmación cerrada por plazo.
- **RNF-2 — Paridad funcional estricta.** Todos los flujos, estados, validaciones y comportamientos DEBEN
  conservarse sin cambios.
- **RNF-3 — Mantenibilidad.** La nueva organización DEBE dejar la presentación aislada del resto, de modo
  que sustituirla no obligue a tocar la lógica, los datos ni las secciones. Se evalúa por revisión de la
  organización, no creando una segunda plantilla.
- **RNF-4 — Datos intactos.** No se DEBEN transformar los datos ni los textos de contenido: el registro de
  la boda y las fichas de invitación DEBEN conservar su **forma y su significado**. Lo que puede cambiar
  es el nombre y la ubicación de los **archivos de código** que los leen.
- **RNF-5 — Accesibilidad y rendimiento no peores.** La reorganización NO DEBE empeorar la accesibilidad
  (foco visible, salto al contenido, navegación por teclado, contraste en ambos temas) ni la carga (se
  sigue sirviendo la misma variedad optimizada de imágenes y el audio no se descarga antes del gesto), ni
  el comportamiento del sitio publicado en su dirección actual.
- **RNF-6 — Idioma.** La **nomenclatura del código** pasa a inglés. Todo lo que ve el invitado —textos,
  etiquetas, avisos y mensajes— DEBE seguir **íntegramente en español**, igual que los comentarios y la
  documentación del proyecto.

## 6. Casos límite

- **Cualquier diferencia perceptible es una regresión.** Si con los mismos datos cambia un color, un
  espaciado, una alineación, una tipografía, un borde, un redondeo, una imagen, un icono o una transición,
  no se cumple RF-1 ni RNF-1, aunque el cambio parezca menor.
- **Los nombres de las clases de estilo y de los archivos pueden cambiar; su efecto, no.** El marcado
  interno no forma parte de lo que percibe el invitado: lo que se exige es que el resultado visible sea
  el mismo. **Decidido.**
- **Qué NO se renombra (ni se mueve).** **Decidido:** (a) los textos que ve el invitado; (b) los datos del
  registro de la boda y de las fichas, incluidas sus claves; (c) los **contratos ya publicados**: el
  parámetro del enlace de invitación, la clave con la que se recuerda el tema en el navegador, las anclas
  internas de la página y el enlace para saltar al contenido, y los nombres de los campos que se envían al
  confirmar la asistencia; (d) los **recursos** (imágenes, iconos y audio), porque el registro los
  referencia por sus nombres y su resolución no debe cambiar; (e) los comentarios y la documentación, que
  se quedan en español.
- **Una sola convención.** Si al pasar los nombres a inglés dos elementos distintos coinciden, el conflicto
  se resuelve sin alterar nada de lo visible.
- **La paridad manda sobre la reutilización.** Ante la duda entre unificar dos piezas parecidas o
  conservarlas como están, se conservan.
- **Las comprobaciones existentes siguen vigentes.** Las pruebas y guardarraíles del proyecto DEBEN
  seguir pasando; si alguna vigila un nombre que cambia, se actualiza **sin relajarla** y sin dejar de
  comprobar lo mismo.
- **Solo una plantilla activa.** Aunque la estructura admita varias, en esta versión solo existe y se usa
  la plantilla por defecto; no se expone ninguna elección y **no se crea ninguna plantilla adicional, ni
  siquiera de prueba**.
- **El acceso no cambia.** El invitado sigue entrando por la misma dirección publicada y con el mismo
  parámetro de enlace, también en subrutas. No se añade ninguna pantalla nueva visible (ni de
  demostración ni de aviso de dirección desconocida).
- **Portada y foco.** El orden observable de los eventos al entrar (cerrar la portada → devolver el foco
  al inicio → comenzar la música) DEBE conservarse tal cual; cualquier alteración de ese orden cuenta como
  regresión.
- **Título y descripción de la página.** Lo que aparece en la pestaña y en los metadatos de la página se
  considera parte de lo que percibe quien la comparte y DEBE conservarse igual.
- **Fallos en tiempo de ejecución.** Si el portapapeles no está disponible, si el navegador bloquea la
  música, si el almacenamiento del navegador no está disponible o si falta la preferencia de movimiento
  reducido, el comportamiento DEBE ser el mismo de la referencia.
- **Sección omitida por falta de datos.** Una sección sin datos debe seguir sin aparecer y sin dejar hueco
  perceptible, igual que hoy.
- **Estado intermedio.** Mientras la reorganización esté a medias no se publica: no deben quedar piezas
  duplicadas ni archivos huérfanos que rompan la paridad.
- **Referencia congelada.** La comparación se hace contra la copia fijada antes de empezar; si no existe,
  la paridad no puede darse por buena.

## 7. Fuera de alcance

- Implementar una segunda plantilla real (tampoco una de prueba) o cualquier cambio de aspecto. En esta
  versión solo se prepara la **capacidad**.
- Añadir un selector de plantilla, una vista previa de plantillas o cualquier ajuste visible relacionado
  con ellas.
- Cambiar estilos, colores, espaciados, alineaciones, tipografías, imágenes, iconos, animaciones o
  transiciones.
- Cambiar datos, textos visibles, enlaces o la forma del registro de la boda y de las fichas de
  invitación.
- Adoptar un lenguaje tipado, un framework de pruebas, un enrutador o cualquier otra herramienta o
  dependencia nueva: la invitación se sigue construyendo solo con lo que el proyecto ya usa, sin librerías
  de interfaz, estilos o animación.
- Cambiar flujos funcionales, reglas de personalización por enlace, comportamiento de la confirmación o
  requisitos de accesibilidad ya existentes.
- Renombrar o mover recursos (imágenes, iconos, audio) de forma que cambie su resolución efectiva o la
  apariencia.
- Añadir pantallas, direcciones o modos de acceso nuevos para el invitado.
- Traducir al inglés cualquier texto visible, comentario o documento del proyecto.

## 8. Criterios de finalización

**Del producto:**

1. Se cumple paridad visual y funcional estricta (RNF-1 y RNF-2): con los mismos datos, la invitación es
   indistinguible de la referencia en la matriz mínima de comprobación.
2. Existe una sola plantilla activa (la actual) y ninguna forma de elegir otra.
3. La presentación está concentrada en la capa de plantilla y la nomenclatura del código está unificada en
   inglés, con los textos del invitado, los datos, los contratos publicados y los recursos intactos.
4. Las comprobaciones existentes siguen en verde y sin regresiones.
5. La verificación se anota donde el proyecto la documenta hoy.

**Del documento:**

6. Todos los RF tienen criterios de aceptación en notación EARS en español, verificables sin ambigüedad.
7. No queda ninguna duda marcada como **[NECESITA ACLARACIÓN]**.

## 9. Decisiones adoptadas y dudas abiertas

- **DO-1 (resuelta) · ¿Nombres de clases literales o efecto visual equivalente?** Basta el **efecto visual
  equivalente**: los nombres pueden cambiar (es lo que pide RF-3) siempre que el resultado visible sea
  idéntico. Se exige paridad sobre el resultado, no sobre los nombres, porque el invitado nunca ve el
  código y exigir la coincidencia literal impediría unificar la nomenclatura.
- **DO-2 (resuelta) · ¿Algo del legado exento de renombrar?** No hay excepciones por componente, pero la
  unificación **no alcanza** a los textos visibles, a los datos del registro y de las fichas, a los
  contratos ya publicados, a los recursos ni a los comentarios y la documentación (detalle en «Casos
  límite»).
- **D-3 · Referencia y método de paridad.** Se compara contra la invitación actual **fijada antes de
  empezar**, sobre el resultado visible (estructura, atributos visibles y estilos efectivos), en los
  anchos y temas que ya usa la verificación, y con la matriz mínima de casos. Los nombres internos quedan
  fuera de la comparación.
- **D-4 · Prioridad.** La paridad manda sobre la reutilización: solo se extrae una pieza común si dos o
  más secciones la usan con resultado visible idéntico.
- **D-5 · Vocabulario.** La plantilla decide el aspecto, nunca los datos ni las secciones ni su orden; la
  portada, el encabezado, el pie y los controles se consideran piezas de estructura, no secciones.
- **D-6 · Alcance del renombrado.** Solo alcanza al **código**. Quedan excluidos los textos visibles, los
  datos y sus claves, los contratos ya publicados (enlace, tema recordado, anclas internas, campos del
  envío), los recursos y los comentarios/documentación. La mezcla resultante (código en inglés, datos y
  textos en español) es **deliberada** y se documenta como tal.
- **D-7 · Convención.** Debe ser **una sola** y en inglés; la elección concreta de mayúsculas y separadores
  se fija en el plan.
- **D-8 · Sin plantillas adicionales.** No se crea ninguna plantilla nueva en esta versión, ni siquiera de
  prueba; la sustituibilidad se demuestra concentrando la presentación en una sola capa.
- **D-9 · Sin herramientas nuevas.** No se adopta lenguaje tipado, framework de pruebas, enrutador ni
  ninguna dependencia, herramienta o librería adicional.
- **D-10 · El marcado servido no es percepción.** Los nombres de clases y de archivos pueden cambiar; lo
  que no puede cambiar es lo que se ve en pantalla.

No quedan dudas abiertas marcadas como **[NECESITA ACLARACIÓN]** en esta versión.

## 10. Gobernanza y documentación

El objetivo de esta spec **exige enmendar la constitución del proyecto**, porque hoy fija lo contrario:

- **Principio de idioma:** hoy exige que el código y los identificadores vayan en español. Debe pasar a
  exigir la nomenclatura del código en inglés, conservando en español los textos visibles, los datos y la
  documentación.
- **Principios que fijan el modelo de datos y la separación de capas:** mencionan ubicaciones concretas de
  archivos que la reorganización puede cambiar. Deben reformularse para describir las capas y su
  responsabilidad, no rutas literales.
- **Principio de pruebas sin instalar nada:** debe aclarar qué cuenta como verificación automática y cómo
  se anota la verificación manual.
- **Principio de datos del usuario a salvo:** se mantiene; la clave con la que se recuerda el tema no
  cambia (es un contrato ya publicado).

Además, esta spec obliga a actualizar la documentación del proyecto (guía y descripción general) para
reflejar la nueva organización y la nueva convención de nombres. Esa actualización forma parte del alcance,
aunque no cambie nada de lo que ve el invitado.
