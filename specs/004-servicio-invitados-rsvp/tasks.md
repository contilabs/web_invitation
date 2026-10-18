# Tareas — Spec 004: Servicio de invitados y RSVP

Ordenadas por dependencia. Cada tarea es pequeña (≤ 20–30 min), indica los RF que cubre y tiene una
línea **Hecho cuando:** verificable. Los RF/RNF citados son los de la **spec 004** (`spec.md`), no los
de specs anteriores.

**Regla de cierre de cada tarea:** `npm test` en verde y `npm run build` sin errores. Ninguna prueba se
relaja: si vigila un nombre que cambia, se actualiza **comprobando lo mismo**. Nada se publica a medias.

**Prerequisito:** todo el plan respeta la constitución **enmendada** en T2. La lógica pura y sus
pruebas van **antes** que sus consumidores (§11 del plan).

**Orden de documentos:** la constitución se enmienda primero (T2); `README.md`, `AGENTS.md`,
`MEMORY.md` y `PENDING_TASKS.md` se actualizan **al final** (T10), porque describen rutas y
comportamiento y hacerlo antes dejaría la documentación en contradicción con el código.

## Fase 1 — Higiene y contrato

- [x] **T1 · Excluir los libros reales del repositorio.** _RF: RF-17; RNF-2; D19._
  Hecho cuando: `.gitignore` incluye la regla que excluye los libros (p. ej. `gas/*.xlsx`) y
  `git check-ignore gas/Master.xlsx gas/Guests_Karina-Gerardo.xlsx` responde con su ruta;
  `git status` no lista ningún `.xlsx`; el comentario obsoleto del archivo queda corregido.

- [x] **T2 · Enmendar la constitución.** _RF: RF-15, RF-17; RNF-1, RNF-2, RNF-6, RNF-7._
  Hecho cuando: el principio 5 dice que el teléfono entra en el alcance y es la llave de la genérica
  y la pública, que los libros reales se excluyen por `.gitignore` y que el contrato es un **módulo +
  documento**; el principio 6 amplía la excepción de idioma a hojas, columnas, estados y códigos de
  error; `npm test` y `npm run build` siguen en verde.

- [x] **T3 · Contrato del servicio: módulo, documento y sincronía.** _RF: RF-17; RNF-10; D18, D25,
  D27._
  Hecho cuando: existen `src/constants/contract.js` (versión, parámetro `guest`, hojas y columnas,
  estados, `"n"`, 10 dígitos, 10 s, acciones y la tabla §4.1), `src/constants/service.js` y
  `docs/servicio-invitados.md` (derivado del módulo); `test/serviceContract.test.js` **falla** si se
  quita del documento un campo o un código del módulo; `npm test` está en verde.

## Fase 2 — Lógica pura, servicios y presentación

- [x] **T4 · Lógica pura: invitación, plazo y envío.** _RF: RF-2, RF-5, RF-6, RF-8, RF-9, RF-11,
  RF-14; RNF-9._
  Hecho cuando: `utils/invitation.js` y `utils/confirmation.js` (reescritos) y `utils/service.js` y
  `utils/rsvp.js` (nuevos) exportan las funciones de §8 del plan, con pruebas co-locadas que cubren el
  código **recortado** y su ausencia (la comparación sin distinguir mayúsculas es del servicio), los
  tres estados de la configuración, los tres tipos, `"n"` sin tope, cupo 0, teléfono de 10 dígitos,
  `MISSING_FIELDS`/`INVALID_PHONE`/`OVER_LIMIT`, la respuesta rechazada (`INVALID_RESPONSE`) y el borde
  del plazo; ningún módulo toca el DOM, el reloj ni la red.

- [x] **T5 · Cliente del servicio y configuración.** _RF: RF-14, RF-15; RNF-4, RNF-8; D27._
  Hecho cuando: `services/registration.js` hace `POST` con `text/plain` y cuerpo JSON, espera 10 s con
  `AbortController` y devuelve `{ ok, data, errorCode }` **sin lanzar**; `services/config.js` lee las
  variables de entorno y `resolveServiceConfig` distingue los **tres** estados (sin URL →
  `not-configured`; URL sin `slug` → `missing-slug`; ambas → `ready`); `package.json` no gana
  dependencias.

- [x] **T6 · Hooks de la invitación, el plazo y el envío.** _RF: RF-1, RF-11, RF-12, RF-14; RNF-3,
  RNF-5._
  Hecho cuando: `useInvitation` expone `{ status, invitation, errorCode }` (sin URL → `demo` sin
  llamar; con URL y sin `slug` → `error` con `MISSING_SLUG` y **sin reintento**), `useConfirmation`
  recibe el plazo por parámetro y `useRsvp` expone `{ status, errorCode, submit }`; la app compila y el
  primer pintado no queda bloqueado.

- [x] **T7 · La sección de confirmación con sus cinco estados.** _RF: RF-8, RF-12, RF-14; RNF-3,
  RNF-6._
  Hecho cuando: `Rsvp.jsx` pinta modo demo, carga, degradación con **reintento** (salvo en las causas
  sin reintento), plazo cerrado y formulario; en la genérica y la pública pide nombre y teléfono
  **también para rechazar**; conserva el ancla `#confirmar` y el `<h2>` del registro; anuncia los
  avisos en regiones vivas y mueve el foco al resultado.

## Fase 3 — Registro, servicio y cierre

- [x] **T8 · Registro, ejemplos ficticios y contratos.** _RF: RF-1, RF-2, RF-11, RF-13, RF-14._
  Hecho cuando: `data/wedding.js` ya no tiene `confirmacion.fechaLimite` ni `marca.enlaces.rsvp` y
  **ningún** cálculo usa `maximoBoda`; `App.jsx`, `useInvitation.js`, `Rsvp.jsx` y `validation.js`
  dejan de importar `guest-cards.js` en ejecución —`registryErrors(wedding)` valida **solo el
  registro** y se reescriben `data/wedding.test.js` (deja de pasarle las fichas),
  `utils/validation.test.js` (desaparece el caso «conflicto de niños es error», que llamaba
  `registryErrors(wedding, [{…}])`) y `utils/restrictions.test.js` (se retira `hasChildrenConflict`)—
  y las fichas quedan como **fixtures** de `guest-cards.test.js` con la forma nueva (tres tipos,
  teléfono y los cuatro estados); `test/contracts.test.js` vigila los contratos nuevos (parámetro
  `guest` y ausencia de `codigo`/`code`/`inv`, de `enlaces?.rsvp` y de FormSubmit, claves del registro
  y anclas); `npm test` en verde.

- [x] **T9 · El servicio (Apps Script) y su puesta en marcha.** _RF: RF-3…RF-11, RF-13, RF-14, RF-18;
  D5, D6, D7, D14, D20, D21, D23, D24, D26, D28._
  Hecho cuando: `gas/Code.gs` implementa el contrato (maestro por `slug` con `slug` y
  `guests_sheet_id` únicos y `is_active`, libro abierto por `guests_sheet_id`, lectura/escritura por
  cabecera, `viewed` al abrir la personalizada sin respuesta, teléfono como llave con `guest_id`
  autoincremental, cupo en `adults_guests`, los cuatro estados, el plazo y la caché) y responde con los
  códigos de error de §4.1 (`INVALID_DATA` en la lectura y `INVALID_RESPONSE` en una respuesta
  rechazada); `gas/README.md` explica la puesta en marcha. (La comprobación contra el servicio vivo va
  en T10.)

- [ ] **T10 · Documentación y verificación manual.** _RF: RF-16; RNF-3, RNF-6._
  Hecho cuando: `README.md` (enlaces con `guest` y los tres tipos), `AGENTS.md`, `MEMORY.md` y
  `PENDING_TASKS.md` están al día (en `PENDING_TASKS.md` desaparecen las entradas que dejan de
  aplicar: el RSVP sin servicio y los límites fuera de rango; y en `MEMORY.md`, la retirada del tope
  `maximoBoda` de la lógica de cupos); `npm test` y `npm run build` en verde; contra un **despliegue
  real** del Apps Script, los tres tipos se resuelven y una respuesta aparece en la fila correcta del
  libro correcto; y la pasada manual de §13 del plan (edición por el mismo teléfono, boda inactiva,
  código desconocido, sin `slug`, modo demo, teléfono corto, cupo 0, plazo vencido y servicio caído)
  está hecha y anotada en «Verificación».
