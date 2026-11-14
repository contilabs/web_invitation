# MEMORY.md — Invitación digital
Memoria entre sesiones. Máximo ~80 líneas; reglas permanentes en `AGENTS.md` y pendientes en `PENDING_TASKS.md`.

## Estado actual
- Contador: título único Faltan, cuatro valores permanentes que se detienen en cero. Fecha propia
  en cuentaRegresiva: 2027-03-13T00:00:00-06:00 / America/Mexico_City; resto de fechas intactas.
  Móvil 320 px y escritorio revisados; 262 pruebas/build. Resuelto el pendiente de viajeros del contador.
- Identidad web: título HTML/React/og:title Naomi & Andrés; marca.nombre actualizado. Favicon
  wax-seal.ico original (256 px), ruta nueva con huella Vite, sin sello.png en HTML. 261 pruebas/build.
- Navbar: originales Simbolo_olivo.png (día) y Simbolo_beige.png (noche), autorizados, sin filtros.
  Vía plantilla/useTemplate; solo un logo visible por CSS. Altura 56 px móvil / 64 px escritorio,
  scroll-padding sincronizado; comportamiento de scroll intacto. Ambos temas verificados; 259 pruebas/build.
- Familia: Family autorizado, nombres exactos en wedding.familia; beige/oliva, Kalista y reveal.
  Orden Hero → familia → cuenta regresiva; una columna móvil sin partir nombres, dos escritorio.
- Música: music.mp3 sustituye assets/audio.mp3 sin edición; inicio y ended desde 6 s, sin loop.
  Preload metadata y #t=6 autorizados; play en gesto, pausa conserva posición. 255 pruebas/build;
  inicio, pausa, reanudación y recarga verificados en navegador, repetición cubierta en pruebas.
- Hero: DSC00604 optimizada a 900/1800/2600 px (hero-naomi-andres). 100dvh, texto superior
  serif/oliva y velo beige; pareja/fecha/subtítulo de portada, frase Kalista. Cover al 65 %
  (horizontal 55 %). Revisados 320×400, 390×844, 1440×900. Original fuera del repo.
- Bienvenida: beige/oliva sin ilustraciones; papel rectangular y doble marco SVG con curvas
  cóncavas superior derecha e inferior izquierda. Datos Naomi/Andrés/13-mar-2027 en portada.
  Cierre, música y animación conservados; móvil/escritorio revisados y 249 pruebas/build.
- Rama de trabajo: `main`. Specs 001–003 terminadas salvo T27 manual y publicación;
  React completo, rediseño «Ascua», registro único y paridad T26 **30/30**.
- Spec 004: T1–T16 hechas; T17 manual pendiente. Apps Script (`gas/Code.gs`), contrato **1.4.0**,
  hoja `public`, caída `generic`→`public`, `MALFORMED_GUEST` y celdas vacías como cero.
- Spec 005: T1–T20, T22 y T23 hechas; T21 manual pendiente. RSVP con siete estados, consulta por
  teléfono, respuesta previa, mensaje del rechazo, saludo personalizado y consulta tolerante.
- **Seguridad Docker (2026-10-26):** adaptados los commits `104fb2f` y `ce2206d` de
  `Jose-QB/wedding_invitation`, incluidos sus lanzadores previos. Archivos nuevos autorizados.
  `dev`/`preview` usan `scripts/safe-dev.mjs`; `test`/`build`/`check`, `scripts/safe-check.mjs`.
  No se añadieron dependencias. Uso y límites en `docs/local-security.md`; reglas en `AGENTS.md`.

## Decisiones y motivos
- Docker instala desde los dos manifiestos en una fase con red, sin fuentes ni scripts npm;
  ejecuta el proyecto en otra fase sin red, privilegios ni montajes del host. Relay únicamente
  en `127.0.0.1:5173`; desarrollo y preview se ejecutan por separado. No hay alternativa en host.
- Se copian fotos optimizadas, iconos, audio y fuentes; no originales ni libros de invitados.
  Las comprobaciones incluyen solo `gas/Code.gs` para los guardarraíles del servicio.
- Solo se transmiten `VITE_SERVICE_URL` y `VITE_WEDDING_SLUG` del entorno del proceso; son públicas.
  No se leen ni copian `.env*`. Los builds locales son desechables, sin `dist/` exportado;
  publicar requiere conservarlo desde un entorno aislado de CI/hosting (README).
- Spec 005: `lookup` exige diez dígitos, solo genérica/pública, no escribe `guests`, no devuelve
  teléfono ni datos ajenos y no persiste teléfono en navegador/URL. Riesgo aceptado documentado.
- Después de enviar genérica/pública, `Rsvp` copia el teléfono de `submitted.current` a
  `lookupPhone`; «Editar» conserva la llave aunque no hubiera consulta. Campo bloqueado al enviar.
- Combos por campo: adultos `1..cupo`, niños `0..cupo`; `attendeeValue` normaliza adultos 0 a 1.
  `validateRsvp` exige elegir asistencia. Con «Sí» hay cuatro campos; con «No», solo mensaje.
  El rechazo envía mensaje sin asistentes/restricciones; `responseSummaryData` conserva mensaje
  y estado para editar. Copy del rechazo local; saludo desde `invitation.guestName`, solo al revelar.
- `lookupResponse_` exige solo `phone`; tolera ausencia de `guest_name`/`status`.
- Contrato: `src/constants/contract.js` fuente única; `docs/servicio-invitados.md` derivado;
  `test/serviceContract.test.js` vigila sincronía. Literales del servicio en inglés por excepción.
- Servicio: cadenas escapadas como texto antes de escribir, sin fórmulas; números y vacíos conservan
  su forma. Resolución personalizada y escritura bajo el mismo `ScriptLock`; `flush()` antes de
  liberarlo, con `releaseLock()` en un `finally` interno.
- Invitado y cupos del servicio, parámetro `guest` sin alias. Teléfono como llave de genérica/pública:
  segunda respuesta actualiza, no duplica. Plazo del maestro; config por publicación; POST
  `text/plain` + JSON, espera de 10 s. Libros reales gitignorados.
- Plantilla: `useTemplate` única vía; fotos por clave, con fallo de arranque si falta variante.
  Mantener `base: "./"`, tema anti-parpadeo, `audio.play()` en gesto y tokens «Ascua».
- `visibleSections` omite opcionales vacíos y fuerza confirmación; `allowsChildren` por defecto true;
  `isConfirmationOpen` distingue plazo ausente/ilegible y compara con «ahora» recibido.

## Errores a evitar
- No ejecutar herramientas ni importar archivos del proyecto en el host: usar lanzadores Docker.
  `services/config.js` usa `import.meta.env` y `photos.js`, `import.meta.glob`: no importarlos en tests Node.
- Confirmar archivos y `git diff`; no usar sustituciones masivas que alteren comentarios/textos.
- Maestro por nombre: `getProperty('MASTER_SHEET_ID')`, no por valor. Los tests no ejecutan Apps Script.
- Código `PUBLIC` con `limit = "n"` en `generic` es `MALFORMED_GUEST`: borrar fila y pasarla a `public`;
  no corregir la app. `INVALID_DATA` al resolver indica otros datos inválidos; ver `gas/README.md`.
- Chrome: servir el build y medir por DevTools, no `--dump-dom`. Parches de verificación temporales
  deben restaurarse. Fotos estructurales y claves del registro requieren variantes optimizadas.
- Mesa de regalos: solo copia el dato marcado `copiar: true`; no adivinar entre varios datos.

## Próximos pasos
- Completar T10 de 004, T21 de 005 y T27 de 003 contra servicio vivo y móvil físico; anotar veredictos
  en `AGENTS.md`. Usar código genérico real, no PUBLIC en generic, y redesplegar el script.
- Publicación, `og:image` absoluto, fuentes autoalojadas y demás pendientes: `PENDING_TASKS.md`.
