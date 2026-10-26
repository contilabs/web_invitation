# Especificación — Migración y rediseño de la invitación digital

## 1. Contexto y objetivo

La invitación actual es una página estática de una sola vista con todas sus funciones ya
operativas. La pareja quiere **trasladar la invitación a una nueva base técnica más
mantenible** (el stack concreto se fija en el plan) **y, a la vez, rediseñar su aspecto
visual**, sin perder ninguna función ni romper los enlaces ya repartidos.

**Objetivo:** que la invitación rediseñada sea funcionalmente equivalente a la actual
—mismas secciones, mismos comportamientos y mismo contenido— y que cualquier enlace ya
compartido siga funcionando. La equivalencia funcional se evalúa **con JavaScript activo**
(ver «Fuera de alcance»).

## 2. Usuarios

- **Invitado:** abre la invitación por un enlace (con o sin `?invitados=N`), consulta la
  información del evento, ve las fotos, escucha música, confirma su asistencia y copia los
  datos para regalar.
- **Anfitriones (la pareja):** encargan la invitación y deben poder actualizar los datos del
  evento (fecha, cuenta, enlaces) en un único lugar del código. No hay panel ni editor
  visual: la edición es sobre el propio código.

## 3. Historias de usuario

- **HU-1:** Como invitado quiero ver los nombres, la fecha y la cuenta regresiva para saber cuándo es el evento.
- **HU-2:** Como invitado quiero confirmar mi asistencia para avisar a los anfitriones.
- **HU-3:** Como invitado quiero ver las fotos en grande para recordarlas.
- **HU-4:** Como invitado quiero elegir tema claro u oscuro para leer cómodo.
- **HU-5:** Como invitado quiero escuchar música mientras recorro la invitación.
- **HU-6:** Como invitado quiero ver cuántos lugares tengo reservados.
- **HU-7:** Como invitado quiero copiar la cuenta para regalar.
- **HU-8:** Como invitado quiero ver ubicaciones y hoteles con enlaces para llegar.
- **HU-9:** Como anfitrión quiero actualizar los datos del evento en un único lugar para no olvidar ninguno.

## 4. Requisitos funcionales (criterios en EARS)

**RF-1 — Portada de bienvenida**
- El sistema deberá mostrar una portada de bienvenida al abrir la invitación.
- CUANDO el invitado pulse «Ingresar», el sistema deberá cerrar la portada y revelar el contenido.
- MIENTRAS la portada esté abierta, el sistema deberá impedir la interacción con el contenido de detrás.
- CUANDO se cierre la portada, el sistema deberá colocar la vista al inicio de la página.

**RF-2 — Contenido del evento**
- El sistema deberá mostrar el nombre de la pareja, la fecha y hora, y las secciones informativas (ceremonia, recepción, ubicaciones, hoteles, mesa de regalos).
- CUANDO el invitado active un enlace de ubicación, hotel o mesa de regalos, el sistema deberá abrir el destino correspondiente.
- El sistema deberá conservar los textos de contenido de la invitación actual (nombres, secciones y mensajes). Los textos de interfaz nuevos que exija el rediseño (etiquetas, ayudas y `aria-label`) son la única excepción.

**RF-3 — Cuenta regresiva**
- El sistema deberá mostrar días, horas, minutos y segundos restantes hasta la fecha y hora del evento.
- El sistema deberá actualizar la cuenta regresiva al menos cada segundo.
- SI la fecha del evento ya pasó, ENTONCES el sistema deberá mostrar un mensaje en lugar de la cuenta.
- El sistema deberá usar la misma fecha y hora del evento que el resto de la invitación.

**RF-4 — Tema claro/oscuro**
- El sistema deberá ofrecer un control para alternar entre tema claro y oscuro.
- CUANDO el invitado cambie de tema, el sistema deberá aplicarlo al instante y recordar la elección.
- El sistema deberá recordar la elección en el mismo navegador del invitado.
- SI el invitado nunca ha elegido, ENTONCES el sistema deberá respetar el tema del sistema operativo.
- MIENTRAS el invitado no haya elegido manualmente, el sistema deberá seguir los cambios de tema del sistema operativo.
- CUANDO la página cargue, el sistema deberá aplicar el tema recordado sin mostrar un parpadeo del tema contrario.

**RF-5 — Música de fondo**
- El sistema deberá ofrecer música de fondo con un control de reproducir/pausar.
- El sistema deberá reproducir la música en bucle hasta que el invitado la pause.
- CUANDO el invitado pulse «Ingresar» en la portada, el sistema deberá iniciar la música.
- CUANDO el invitado use el control de música, el sistema deberá alternar entre reproducir y pausar.
- El sistema deberá indicar visualmente si la música está sonando o en pausa.

**RF-6 — Navegación y aparición**
- CUANDO la portada principal (el título de apertura) deje de estar visible, el sistema deberá mostrar el encabezado.
- DONDE el sistema operativo solicite movimiento reducido, el sistema deberá suprimir las animaciones no esenciales, incluido el avance automático del carrusel.

**RF-7 — Galería**
- El sistema deberá mostrar una galería con un carrusel de las fotos destacadas definidas en el contenido.
- CUANDO el carrusel cambie de foto, el sistema deberá actualizar el contador «foto actual / total», donde el total es el número de fotos destacadas.
- CUANDO el invitado seleccione una foto, el sistema deberá abrirla en un visor a pantalla completa.
- MIENTRAS el visor esté abierto, el sistema deberá permitir ver la foto anterior y la siguiente, y cerrar el visor.
- CUANDO el visor esté abierto, el sistema deberá pausar el avance automático del carrusel y reanudarlo al cerrarse, salvo que el invitado tenga activado el movimiento reducido.
- El sistema deberá permitir operar el visor con el teclado (flechas y cierre).
- CUANDO el invitado amplíe una foto, el sistema deberá mostrar una variante optimizada de resolución intermedia; si no existiera, la mayor variante optimizada, y nunca el archivo original de cámara.

**RF-8 — Confirmación (RSVP)**
- El sistema deberá mostrar un formulario con el nombre del invitado, la decisión de asistencia («Sí, asistiré» / «No podré asistir») y un campo de comentarios.
- El sistema deberá marcar como requeridos los mismos campos que la invitación actual: decisión de asistencia, nombre y comentarios.
- CUANDO el invitado envíe el formulario con los campos requeridos completos, el sistema deberá enviarlo al canal de confirmación ya configurado, sin cambiar ese canal.
- SI faltan campos requeridos, ENTONCES el sistema deberá impedir el envío e indicarlo.

**RF-9 — Personalización por invitado**
- DONDE la dirección incluya `?invitados=N` con N entero mayor que cero, el sistema deberá mostrar «1 lugar» (N=1) o «N lugares» (N≥2) dentro de la frase de reserva de la sección de confirmación.
- SI el valor de `invitados` no es un entero mayor que cero, ENTONCES el sistema deberá mostrar «un lugar».

**RF-10 — Datos para regalar**
- El sistema deberá mostrar el banco, el titular y la cuenta.
- CUANDO el invitado solicite copiar la cuenta, el sistema deberá copiarla al portapapeles y mostrar una notificación visible con el resultado.
- SI la copia al portapapeles falla, ENTONCES el sistema deberá mostrar la cuenta para copiarla a mano.

**RF-11 — Rediseño visual (evolución del diseño actual)**
- El sistema deberá presentar la invitación como una evolución del diseño actual, no como un aspecto nuevo desde cero.
- El sistema deberá conservar la identidad «fuego cálido» en tema claro y oscuro: misma paleta, tipografías y elementos de acento.
- El sistema deberá mantener la estructura de secciones, el contenido y la jerarquía de los elementos actuales.
- El rediseño podrá modificar la disposición, los espaciados, los tamaños y las transiciones, pero no la identidad visual ni el contenido.

## 5. Requisitos no funcionales

- **RNF-1 Accesibilidad:** contraste suficiente en ambos temas, foco visible, navegación por teclado en portada, visor y controles, y estado anunciado (ARIA) en los controles de tema y música.
- **RNF-2 Movimiento:** respetar la preferencia de movimiento reducido del sistema.
- **RNF-3 Rendimiento:** la primera carga no debe descargar los originales de gran tamaño; las imágenes se sirven en versiones y tamaños optimizados.
- **RNF-4 Compatibilidad:** navegadores modernos de escritorio y móvil, diseño adaptable de una sola vista.
- **RNF-5 Idioma:** textos visibles en español.
- **RNF-6 URLs:** se conserva la misma dirección base; los enlaces ya repartidos, incluidos los que terminan en `index.html?invitados=N`, deben seguir abriendo la invitación y mostrando el valor correcto.
- **RNF-7 Privacidad:** solo se envía lo que el invitado escribe en el RSVP; en el navegador únicamente se guarda la preferencia de tema.
- **RNF-8 Mantenibilidad:** los datos del evento (fecha, cuenta, enlaces) deben residir en un único punto editable del código; no hay panel de administración.

## 6. Casos límite

- Se aplazan y se irán detallando y depurando en `../../PENDING_TASKS.md` (raíz del repo).

## 7. Fuera de alcance

- No se añaden funciones nuevas de cara al invitado: esta versión es migración + rediseño. La única mejora interna es que los datos del evento queden en un único punto editable (RNF-8).
- No hay backend propio, panel de administración ni autenticación.
- No hay analítica, rastreo ni CMS.
- No se cambia el canal externo del RSVP ni los destinos externos (ubicaciones, hoteles, WhatsApp, mesa de regalos).
- No se rehace el contenido fotográfico ni se reescribe el texto del evento.
- Revisar o cambiar el canal y la implementación del RSVP (incluido el manejo de doble envío): se hará en futuras iteraciones.
- No se garantiza que la invitación se vea sin JavaScript: esta versión puede requerir JavaScript. La paridad funcional se evalúa con JavaScript activo.

## 8. Criterios de finalización

- Cada RF verificada manualmente en navegador, escritorio y móvil (sin instalar herramientas de test).
- Paridad funcional con la actual (con JavaScript activo): tema, música, cuenta regresiva, galería + visor, RSVP, copiar datos, `?invitados=N` y encabezado, presentes y operativos.
- El rediseño, entendido como evolución, aplicado de forma consistente en ambos temas y conservando la identidad y la paleta actuales.
- Los enlaces ya repartidos (`index.html?invitados=3`) siguen funcionando.
- Verificación anotada en la sección «Verificación».
- Gobernanza: el principio 1 de la constitución queda enmendado para permitir el stack elegido.

## 9. Dudas abiertas

- Ninguna pendiente por ahora. Los casos límite y las dudas que surjan se registran y depuran en `../../PENDING_TASKS.md`.
