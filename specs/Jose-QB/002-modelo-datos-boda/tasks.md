# Tareas — Spec 002: Modelo de datos reutilizable de la invitación

Ordenadas por dependencia. Cada tarea es pequeña (≤ 20–30 min) e indica los RF que cubre.
Las tareas de `src/logica/` incluyen sus pruebas (`node --test`).

## Fase 0 — Gobernanza y documentos

- [x] **T1 · Enmendar `docs/constitution.md` (principios 2, 3, 5 y 6).** _RF: soporte (§8)._
  Hecho cuando: los cuatro principios describen el registro único, los textos fuera de la interfaz,
  el contrato del invitado como excepción de idioma y el GAS como mera referencia; ya no citan
  «HTML y su constante en JS» ni «los textos estáticos viven en `index.html`».
- [x] **T2 · Actualizar `AGENTS.md`.** _RF: RF-1, RF-16, RF-21, RNF-1._
  Hecho cuando: el «único origen» apunta a `src/datos/boda.js`, el inventario incluye **cita** e
  **historia** y la personalización se describe por enlace (`código`), sin `?invitados=N`.
- [x] **T3 · Actualizar `README.md`.** _RF: RF-21._
  Hecho cuando: explica cómo reutilizar la invitación para otra pareja (cambiar el registro y volver
  a publicar) y qué tocar (registro, fotos con las mismas claves y anchos, fichas de invitación).

## Fase 1 — Datos

- [x] **T4 · `src/datos/boda.js`: núcleo con los datos actuales.** _RF: RF-1, RF-2, RF-3, RF-5, RF-6, RF-11, RF-22._
  Hecho cuando: el registro existe con `plantilla`, `pareja`, `evento`, `portada`, `ubicaciones`,
  `itinerario` y `hoteles`, y conserva los nombres, la fecha, los lugares y los enlaces de hoy; un
  test lo importa sin error.
- [x] **T5 · `src/datos/boda.js`: secciones nuevas y ajustes.** _RF: RF-7, RF-8, RF-9, RF-10, RF-12, RF-13, RF-14, RF-18._
  Hecho cuando: el registro incluye `cita`, `historia`, `galeria`, `regalos` (con **datos copiables**),
  `restricciones` (con permiso de niños), `confirmacion` (plazo y **máximo de la boda**), `ajustes`
  (música, navegación y visibilidad de secciones) y `marca`.
- [x] **T6 · `src/datos/invitaciones.js`: fichas de ejemplo.** _RF: RF-16, RF-17, RF-19, RNF-7._
  Hecho cuando: hay fichas con la forma del contrato del GAS para los tres tipos (personalizada; hasta
  diez reutilizables con límite 1–10; una genérica) y **todas son de ejemplo** (sin datos reales).

## Fase 2 — Lógica pura (con tests)

- [x] **T7 · `logica/pareja.js` + tests.** _RF: RF-2._
  Hecho cuando: `node --test` pasa nombre completo, sin apellidos, con nombre intermedio, campos vacíos
  y nombre para mostrar definido/ausente.
- [x] **T8 · `logica/evento.js` + tests.** _RF: RF-3._
  Hecho cuando: `node --test` pasa el instante correcto en `America/Mexico_City`, sin zona → local,
  zona inválida → error detectable, y el formato «01 de noviembre de 2027» / «16:30 h».
- [x] **T9 · Ajustar `logica/cuentaRegresiva.js` + tests.** _RF: RF-3._
  Hecho cuando: `calcularRestante` recibe el instante calculado por `evento.js` y sus pruebas siguen
  pasando (futuro, pasado `terminado`, segundo exacto).
- [x] **T10 · `logica/secciones.js` + tests.** _RF: RF-4, RF-6, RF-7, RF-8, RF-9, RF-11, RF-14, RF-18._
  Hecho cuando: `node --test` pasa opcional ausente o **vacía** (se omite), sección apagada, listas
  vacías (galería, hoteles, itinerario, regalos, historia) y confirma que la confirmación siempre está.
- [x] **T11 · `logica/restricciones.js` + tests.** _RF: RF-12, RF-20._
  Hecho cuando: `node --test` pasa vestimenta presente/ausente, niños permitidos/no/**no indicados
  (permitidos)** y el conflicto boda↔ficha.
- [x] **T12 · `logica/invitacion.js` + tests.** _RF: RF-16, RF-17._
  Hecho cuando: `node --test` pasa el código de los tres tipos, el límite por tipo, límite `0`/`> 10`
  (inválido), asistentes **igual** al límite (válido) y **por encima** (bloqueado), y código
  ausente/desconocido → invitación completa sin lugares.
- [x] **T13 · `logica/confirmacion.js` + tests.** _RF: RF-18._
  Hecho cuando: `node --test` pasa antes, **en** y después de la fecha límite, con la zona del evento,
  y la lista de campos habilitados.
- [x] **T14 · `logica/regalos.js` + tests.** _RF: RF-10._
  Hecho cuando: `node --test` pasa los tres tipos, la transferencia con **varios datos copiables**,
  efectivo sin datos copiables y enlace ausente frente a vacío.
- [x] **T15 · `logica/validacion.js` + tests.** _RF: RF-15, RF-20._
  Hecho cuando: `node --test` pasa fecha ausente/imposible, requerido ausente, conflicto de niños e
  imagen irresoluble como **errores**, y plantilla no clásica como **aviso** (no error), con mensajes
  en español.

## Fase 3 — Assets

- [x] **T16 · `componentes/fotos.js` por clave.** _RF: RF-9, RNF-4._
  Hecho cuando: `resolverFoto(clave)` devuelve `{ src, srcset, sizes }` de `assets/photos/opt/` y el
  módulo falla al arrancar si falta una clave esperada; ningún original entra en la primera carga.

## Fase 4 — Hooks

- [x] **T17 · `useInvitacion` (sustituye a `useInvitados`).** _RF: RF-16, RF-17._
  Hecho cuando: lee el código del enlace y devuelve tipo, límite, invitado y lugares reservados; se
  eliminó `useInvitados.js` y ningún import lo referencia.
- [x] **T18 · `useConfirmacion`.** _RF: RF-18._
  Hecho cuando: expone si el formulario está abierto y cambia al llegar la fecha límite sin recargar.
- [x] **T19 · Hooks existentes parametrizados por el registro.** _RF: RF-3, RF-13, RF-14._
  Hecho cuando: `useCuentaRegresiva`, `useMusica`, `useGaleria`, `useEncabezado` y `useReveal` reciben
  sus datos del registro (o de `secciones.js`) y no leen constantes incrustadas.

## Fase 5 — Interfaz

- [x] **T20 · `AvisoDeError.jsx`.** _RF: RF-15, RF-20._
  Hecho cuando: pinta de forma visible los errores (requeridos inválidos, conflicto) y los avisos
  (plantilla no implementada) del registro.
- [x] **T21 · `App.jsx` dirigido por secciones.** _RF: RF-1, RF-4, RF-14, RF-20._
  Hecho cuando: monta solo las secciones visibles y en orden (según `secciones.js`), incluye el panel
  de errores/avisos y fija `document.title` y la descripción desde el registro.
- [x] **T22 · `Cita.jsx` y `Historia.jsx`.** _RF: RF-7, RF-8._
  Hecho cuando: se muestran solo si el registro las trae, con texto/autor y título/párrafos en orden.
- [x] **T23 · `Portada.jsx` desde el registro.** _RF: RF-1, RF-2._
  Hecho cuando: la portada usa título, subtítulo e imágenes del registro y mantiene el bloqueo de
  fondo y el retorno de foco al cerrar.
- [x] **T24 · `Secciones.jsx` (Hero, Lugares, Itinerario, Hoteles, Pie) desde el registro.** _RF: RF-2, RF-5, RF-6, RF-11, RF-14._
  Hecho cuando: esas secciones no tienen textos ni datos incrustados y sus enlaces, precios y fechas
  salen del registro.
- [x] **T25 · `MesaDeRegalos.jsx` por tipos.** _RF: RF-10._
  Hecho cuando: muestra las tres clases de opción y copia los datos copiables con aviso de resultado.
- [x] **T26 · `Galeria.jsx` / `Visor.jsx` desde el registro.** _RF: RF-9._
  Hecho cuando: el carrusel y el visor iteran las imágenes del registro (orden y `alt`) usando las
  variantes optimizadas.
- [x] **T27 · `Confirmacion.jsx` (tipos, límites, plazo).** _RF: RF-17, RF-18._
  Hecho cuando: prellena y bloquea el nombre en la personalizada, muestra acompañante y lugares
  reservados, impide superar el límite e indica el cierre tras el plazo.
- [x] **T28 · `Encabezado.jsx` / `ControlMusica.jsx` según ajustes.** _RF: RF-13, RF-14._
  Hecho cuando: encabezado, panel flotante y música se muestran u omiten según `ajustes`, sin
  reproducción automática.

## Fase 6 — Limpieza

- [x] **T29 · Eliminar el código legado de datos.** _RF: RF-1, RF-16, RF-21._
  Hecho cuando: no existen `logica/datosEvento.js`/`.test.js` ni `logica/invitados.js`/`.test.js`, y
  ningún archivo los importa.

## Fase 7 — Verificación

- [x] **T30 · Prueba de no regresión del registro de ejemplo.** _RF: RF-1, RF-22, RF-19._
  Hecho cuando: `node --test` comprueba que `boda.js` conserva nombres, fecha, ubicaciones, cuenta y
  enlaces, y que las fichas tienen la forma del contrato.
- [x] **T31 · `npm test` y `npm run build` en verde.** _RF: soporte._
  Hecho cuando: `npm test` pasa completo y `npm run build` termina sin errores, con fuentes, iconos y
  audio emitidos en `dist/`.
- [x] **T32 · Verificación automática en Chrome headless.** _RF: RF-4, RF-9, RF-13, RF-18, RF-20, RNF-2._
  Hecho cuando: sin desbordamiento 320–1440 px en día y noche, las secciones se muestran u omiten
  según el registro, el plazo cierra el formulario y un registro inválido muestra el panel de error.
- [ ] **T33 · Verificación manual (criterios de finalización).** _RF: RF-1…RF-22._
  Hecho cuando: reutilizar con otro registro, copiar datos, audio tras «Ingresar», envío real del RSVP
  y una vuelta en un móvil físico quedan probados y anotados en «Verificación» de `AGENTS.md`.
- [x] **T34 · Actualizar `MEMORY.md` y depurar `PENDING_TASKS.md`.** _RF: soporte._
  Hecho cuando: MEMORY refleja el estado y las decisiones del spec 002 y PENDING ya no tiene entradas
  resueltas (contrato del GAS, `?invitados=N`, principios de la constitución).

## Fase 8 — Ajustes posteriores

- [x] **T35 · Un único botón «Copiar» en la mesa de regalos.** _RF-10._
  Hecho cuando: el registro marca **un solo** dato copiable por opción (`copiar: true`), la lógica
  pura lo expone (`datoCopiable`) y `MesaDeRegalos` muestra los datos como texto con un **único**
  botón; `node --test` cubre el dato marcado, el único dato sin marca y varios sin marca (→ sin
  botón). Enmienda RF-10 en `spec.md` y el contrato en `plan.md`.
- [x] **T36 · La galería cierra la invitación (al final, antes del pie).** _RF-4, RF-9._
  Hecho cuando: `ORDEN_SECCIONES` (`secciones.js`) deja `galeria` en último lugar, la prueba de
  orden de `src/datos/boda.test.js` lo refleja y el `Pie` sigue siendo el último bloque; `node
  --test` y `npm run build` en verde. Enmienda RF-4 en `spec.md` y el orden en `plan.md`.
