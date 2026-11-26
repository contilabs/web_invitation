# Especificación — Panel privado de respuestas RSVP

**Estado:** implementada en la rama de trabajo; queda pendiente la verificación manual contra
un Apps Script desplegado y un libro sintético.

## 1. Contexto y objetivo

La invitación pública ya registra las respuestas de los invitados en el servicio de
registro (`gas/Code.gs`). Hoy la pareja debe consultar el libro de invitados directamente
para saber quién respondió, cuántos asistentes confirmó y qué restricciones dejó.

Esta spec define una página web privada para que los novios puedan consultar y gestionar
las respuestas de una boda sin abrir el libro de datos ni reutilizar la interfaz pública de
la invitación.

El panel será de solo lectura en su primera entrega: mostrará un resumen fiable y un
listado filtrable de respuestas, con actualización manual. Las acciones que modifiquen
respuestas, el envío de recordatorios y la exportación se dejan fuera hasta que exista un
caso de uso y un control de permisos explícitos.

## 2. Alcance

### Dentro

- Seleccionar la boda autorizada y mostrar su estado (`is_active`), plazo y última
  actualización disponible.
- Mostrar métricas: invitaciones/códigos conocidos, respuestas recibidas, pendientes,
  aceptadas, rechazadas, adultos confirmados, niños confirmados y suma total.
- Listar respuestas de `guests` con nombre, teléfono enmascarado, tipo o código de
  invitación, asistentes, restricciones, mensaje, estado y fecha de actualización.
- Filtrar por estado, tipo de invitación, búsqueda textual y presencia de restricciones.
- Ordenar por fecha de actualización, nombre y estado.
- Ver el detalle de una respuesta sin exponer datos de otra fila por un error de selección.
- Mostrar estados de carga, servicio no configurado, sesión no autorizada, servicio caído,
  respuesta vacía y datos inválidos.
- Actualizar manualmente y conservar el filtro y el orden durante la actualización.
- Funcionar en escritorio y en un móvil; ser usable con teclado y lector de pantalla.

### Fuera de alcance

- Editar, borrar o crear respuestas desde el panel.
- Cambiar el maestro de bodas, códigos, cupos, plazo o estado de la boda.
- Mostrar el contenido de la invitación pública o resolver enlaces `guest`.
- Guardar teléfonos, nombres o respuestas en `localStorage`, cookies propias o la URL.
- Incluir libros reales, sesiones o datos personales en Git o en el build. La contraseña
  provisional se configura fuera de Git y se incluye en el build.
- Añadir dependencias de UI, tablas, autenticación o gráficos.

## 3. Usuarios y seguridad

1. Los novios comparten la contraseña con quien necesita consultar el panel.
2. La contraseña provisional `VITE_PASSWORD` queda en el JavaScript del panel y limita el
   acceso casual. Sustituirla por autenticación en servidor queda como deuda técnica.
3. Las acciones administrativas de lectura exigen una sesión en Apps Script asociada a la
   boda activa que identifica `VITE_WEDDING_SLUG`. Apps Script puede emitir una sesión para
   una llamada directa y el formulario comprueba la contraseña en el navegador.
4. Este despliegue atiende una sola boda. El servicio devuelve las columnas necesarias
   para el panel de la boda asociada a la sesión.
5. El teléfono se mostrará enmascarado por defecto. El panel no necesita mostrarlo
   completo para cumplir su objetivo.
6. Toda respuesta del servicio se validará antes de pintarse. Un error de una fila no
   debe convertir datos de otra fila en el detalle seleccionado.
7. Los logs de diagnóstico no incluirán nombres, teléfonos, mensajes ni restricciones.

## 4. Requisitos funcionales

### RF-1 — Entrada privada

Al abrir el panel, el usuario ve una pantalla de sesión o autorización. Si no está
autorizado, no se solicita ni se muestra el listado de invitados.

### RF-2 — Selección segura de boda

El servicio devuelve las bodas permitidas para la sesión o una única boda configurada por
la sesión. La interfaz no permite consultar una boda que el servidor no haya autorizado.

### RF-3 — Resumen

El panel muestra contadores derivados del mismo conjunto de respuestas que aparece en el
listado. Los totales de adultos y niños excluyen respuestas `declined`; los campos vacíos
de asistentes cuentan como cero, igual que en el contrato 1.4.0.

### RF-4 — Tabla de respuestas

Cada fila muestra, como mínimo, estado, nombre cuando exista, teléfono enmascarado,
asistentes, mensaje/restricciones resumidos y `datetime`. Las respuestas `viewed` sin
confirmación se distinguen de `accepted` y `declined`.

### RF-5 — Filtros y orden

El usuario puede combinar estado, tipo, texto y presencia de restricciones. El resultado
indica cuántas filas coinciden y ofrece limpiar filtros. El orden por defecto es la
actualización más reciente primero.

### RF-6 — Detalle

Al seleccionar una fila se abre un detalle accesible con todos los campos permitidos del
contrato, incluido el mensaje y las restricciones. El teléfono continúa enmascarado por
defecto y el cierre devuelve el foco al elemento que abrió el detalle.

### RF-7 — Actualización explícita

El panel solo consulta al cargar y cuando el usuario solicita «Actualizar». Mientras
consulta, conserva la última vista válida, deshabilita la acción duplicada y anuncia el
resultado o el error. No hace polling ni actualiza datos sin acción del usuario.

### RF-8 — Errores y datos incompletos

Los errores de autenticación, autorización, configuración, red y contrato tienen avisos
distintos y accionables. Una respuesta parcial nunca se presenta como completa.

### RF-9 — Sincronía con el RSVP

El contrato del panel reutiliza los literales del servicio existentes (`slug`, `guests`,
`phone`, `status`, `datetime`, `accepted`, `declined`, `viewed`) sin renombrarlos ni
traducirlos. La spec no cambia el contrato público usado por la invitación.

## 5. Requisitos no funcionales

- RNF-1: React + Vite, sin dependencias nuevas; lógica pura en `src/utils`, acceso HTTP en
  `src/services`, estado en hooks y presentación en componentes.
- RNF-2: La nomenclatura del código va en inglés; interfaz, comentarios y documentación en
  español; los literales del contrato del servicio conservan su forma en inglés.
- RNF-3: La respuesta administrativa no se cachea en `localStorage`, IndexedDB ni la URL.
- RNF-4: El panel no debe cargar fotos, audio ni la invitación completa; el build debe ser
  una entrada independiente y pequeña.
- RNF-5: Teclado, foco visible, nombres accesibles, tabla legible y soporte de movimiento
  reducido.
- RNF-6: `npm test` cubre la lógica pura, el contrato y la normalización de respuestas;
  `npm run build` debe generar la entrada del panel sin errores.
- RNF-7: La verificación manual cubre autorización, privacidad, filtros, actualización,
  datos vacíos y servicio caído con un libro de prueba sin datos personales reales.

## 6. Modelo de datos de lectura

El servicio administrativo devolverá un sobre versionado, independiente del resultado de
`resolve`, `lookup` y `respond`:

```text
{
  ok: true,
  contract: "1.0.0",
  wedding: { slug, name, isActive, deadline, updatedAt },
  summary: { total, viewed, accepted, declined, pending, adults, children },
  responses: [{ guestId, guestType, guestName, phoneMasked, adultsAttendees,
    childAttendees, message, dietaryRestrictions, status, datetime }]
}
```

La forma exacta, los nombres de la acción administrativa y los códigos de error deben
quedar en `src/constants/contract.js` y en `docs/servicio-invitados.md` antes de implementar
el endpoint. `responses` puede paginarse si el volumen real lo exige; no se debe introducir
una paginación ficticia en la primera versión.

## 7. Decisiones cerradas

- **D1 — Acceso provisional.** Un único campo de contraseña reemplaza el acceso por correo.
  El frontend toma la contraseña de `VITE_PASSWORD` en el build de Netlify.
- **D2 — Alcance de una sesión.** Una boda, identificada al iniciar sesión y conservada en
  memoria durante un máximo de 45 minutos. Cada lectura comprueba esa sesión.
- **D3 — Teléfono:** **Enmascarado siempre por defecto**, con **revelación temporal** tras una acción adicional, **sin persistir** el valor revelado.
  - **Alternativas descartadas:** mostrarlo completo por defecto (contrario al objetivo de minimizar exposición).
  - **Justificación:** cumple RF-6/RNF-3 y el principio de menor exposición; la revelación es efímera y no se guarda en `localStorage`, cookies, URL ni se envía a terceros.
- **D4 — Volumen:** **Consulta única sin paginación** en la primera entrega.
  - **Alternativas descartadas:** paginación del servidor desde el inicio (sin volumen real confirmado).
  - **Justificación:** `responses` puede paginarse si el volumen real lo exige, pero no se introduce paginación ficticia; se prioriza simplicidad y fiabilidad con el libro de prueba.

## 8. Criterio de aceptación

La spec se considerará implementada cuando una persona autorizada pueda abrir el panel,
ver un resumen que cuadre con el libro de prueba, filtrar y abrir el detalle de una fila,
actualizar manualmente sin duplicar solicitudes, y recibir un bloqueo claro sin filtración
de datos cuando no tenga autorización o el servicio falle. `npm test` y `npm run build`
deben estar en verde y la verificación manual debe quedar anotada en esta sección.

**Verificación automática de la entrega original:** `npm test` (234/234) y `npm run build` pasan; el build emite
`admin.html` como entrada independiente y el bundle administrativo no importa fotos ni audio.

**Verificación manual:** pendiente de ejecutar con el Apps Script redesplegado, contraseña y
libro sintético de `docs/panel-respuestas-pruebas.md`: autorización, privacidad, filtros,
actualización, datos vacíos y servicio caído.

## 9. Riesgos

- La contraseña en el build es recuperable y una llamada directa al servicio puede abrir una
  sesión para una boda activa del maestro. La migración a autenticación de servidor se registra en
  `PENDING_TASKS.md`.
- Un endpoint que devuelva todo el libro aumenta el impacto de una sesión comprometida;
  limitar columnas, boda y autorización es obligatorio.
- La suma de asistentes puede cambiar mientras el panel está abierto; por eso los totales
  solo representan la última lectura y deben mostrar su fecha de actualización.
- Las cabeceras tolerantes de la spec 005 pueden producir filas sin nombre o estado; el
  panel debe diferenciarlas de un fallo de autorización y no inventar valores.
