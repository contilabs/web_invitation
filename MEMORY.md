# MEMORY.md — Invitación digital
Memoria entre sesiones. Máximo ~80 líneas; reglas permanentes en `AGENTS.md` y pendientes en `PENDING_TASKS.md`.
## Estado actual
- Restricciones: tras Confirmación; Formal y texto exacto del registro dentro de silueta SVG 5:8,
  curvas simétricas y borde de rombos, sin título exterior. Oliva/champagne invertidos en noche.
  Reveal conservado; móvil 320, tablet y escritorio revisados, 262 pruebas/build correctos.
- Footer: Naomi & Andrés/13-mar-2027 desde portada; N & A accesible, Kalista, sin créditos/borde, compacto.
- Confirmación: DSC01036.jpg intacta de fondo cover, mensaje del registro y enlace Kalista 20px arriba.
  Confirma aquí abre dialog nativo con rsvp.png original autorizado sobre oliva #6A6A53; campos 14px,
  botones 50px, scroll interior, foco circular, fondo bloqueado y restauración exacta de scroll/foco.
  Escape/X/exterior cierran; conserva datos al reabrir. Móvil/escritorio y ambos temas revisados.
  Modal en carga/error: al resolver o reintentar ofrece «Continuar» en NOT_ANSWERED; handleReveal
  exige ready y plazo abierto. Consultas/envíos intactos; npm run check correcto en Docker.
- Galería: originales DSC intactos (SHA-256); 57 WebP en opt/gallery a 480/768/1200 px.
  Pillow/Lanczos, EXIF orientado, calidad 80/método 6, sin recorte; photoFor/visor con srcSet/sizes.
  Activa±1, carga diferida y pausa fuera de pantalla. Chrome 375 px 1x/2x: tres fotos 79/160 KB
  vs 11,46 MB JPG; escritorio 364 KB. 19 decodificadas, marco estable, visor/flechas correctos.
  262 pruebas/build Docker correctos; imágenes y diseño originales conservados.
- Hoteles: Hotel El Refugio, hotel.png reducido otro 30% a 45.5%/14rem; Reservar igual que Ubicación.
  Sugerencia exacta en notas con prefijo en negrita; Reservar abre Reservatio con NAOMIYANDRES.
- Regalos: Liverpool con originales verde/blanco vía plantilla según tema, enlace original en
  imagen accesible, grande y centrada. BBVA comentada en el registro (código/recursos intactos):
  restaurar solo con datos correctos verificados. Liverpool 51688096 heredado de la boda anterior,
  sin modificar; titular actual no verificable por web.
- Solo adultos: postal compacta autorizada tras Itinerario; wedding.soloAdultos, Kalista, marco
  cóncavo y flores SVG, mensaje abreviado. Oliva/blanco y noche beige/oliva; RSVP intacto.
- Itinerario: composición vertical de referencia, fondo uniforme como Ubicaciones, sin tarjetas.
  Ceremonia religiosa 16:00 hrs; Recepción 19:30 hrs; Cóctel 19:30 h; Boda civil sin hora
  (confirmado); Cena 20:00 h. Anillos originales autorizados vía plantilla, tamaños coherentes.
  Bloque centrado. Hover oscuro #FAF7EF con texto oscuro; normales, radios 50px y transiciones intactos.
- Ubicaciones: acuarelas originales sin filtro ni tarjetas; Santísima Trinidad y Monte Piedra.
  Recepción 19:30 hrs; ceremonia 16:00 hrs igual en Ubicaciones e Itinerario. Botones con pin.
  `ceremonyTime` en wedding.js centraliza hora de inicio y rótulo; demás horas/fecha intactas.
  Búsqueda estática sin hora anterior en registro/componentes; pruebas/build correctos en Docker.
- Contador: Faltan, cuatro valores hasta cero; fecha propia 2027-03-13T00:00:00-06:00/Mexico_City.
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
- Código `PUBLIC` con `limit = "n"` en `generic` es `MALFORMED_GUEST`: borrar fila y pasarla a `public`;
  no corregir la app. `INVALID_DATA` al resolver indica otros datos inválidos; ver `gas/README.md`.
- Chrome: servir build y medir por DevTools, no `--dump-dom`; restaurar parches temporales.
## Próximos pasos
- Completar T10 de 004, T21 de 005 y T27 de 003 contra servicio vivo y móvil físico; anotar veredictos
  en `AGENTS.md`. Usar código genérico real, no PUBLIC en generic, y redesplegar el script.
- Publicación, `og:image` absoluto, fuentes autoalojadas y demás pendientes: `PENDING_TASKS.md`.
