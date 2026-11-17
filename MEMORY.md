# MEMORY.md — Invitación digital
Memoria entre sesiones. Máximo ~80 líneas; reglas permanentes en `AGENTS.md` y pendientes en `PENDING_TASKS.md`.
## Estado actual
- PR #3: registro oficial Naomi Muñoz Macías y Andrés Calzada Asencio; nombre público Naomi y Andrés.
  Evento 13/03/2027 16:00 -06:00, San Juan de los Lagos, Jalisco, México; recepción 19:30 intacta.
  SEO/OG corregidos, JPEG actual existente; sin Twitter previo. URL absoluta pendiente: aún no hay dominio.
  Tests ajustados; `npm run check` bloqueado antes de pruebas/build por Docker no disponible (sin alternativa host).
- Familia: cuatro categorías con peso 600. Música desde 00:00 sin fragmento temporal;
  pausa conserva posición, repetición desde cero. Navegador confirmado; 263 pruebas/build Docker correctos.
- Nombres: Relyna WOFF local, `--fuente-nombres` + preload en portada/Hero/footer; & en Kalista. Revisado móvil/desktop.
- Títulos: Romantica Serif TTF local, `--fuente-titulo` + preload; `--fuente-display` conserva
  Erstoria en cifras/avisos. RSVP/vestimenta ajustados, móvil/desktop revisados; check Docker correcto.
- Bienvenida: textos secundarios mayores, separador SVG; botón sin contorno salvo foco de teclado 2px.
- Separadores: `SectionDivider` SVG, línea fina, puntas simétricas/tres puntos; títulos y familia,
  espacios intactos y oliva/contraste por tema. Escritorio/móvil revisados; check Docker correcto.
- Hero: Kalista 32–37.6px móvil, 29.6–32px tablet/desktop, ajuste para poca altura; escritura SVG
  3.2 s tras portada, dos líneas móvil 320/390. Movimiento reducido/resize completan; check correcto.
- Ubicaciones: Watercolor Reveal 2.3 s individual tras carga, nueve manchas, una vez; originales
  intactos, sin fade/slide. Máscara retirada al finalizar, movimiento reducido directo; revisión visual pendiente.
- Restricciones: silueta SVG 5:8 intacta, doble línea fina interior según referencia (sin rombos).
  Logo de navegación por tema (base +20 % y escala visual 1.5, sin mover el resto) → título → indicaciones;
  cinco colores en seminegrita. Marco 21rem (antes 30), móvil legible; reveal/paleta intactos.
  Escritorio y móvil 320 en ambos temas revisados; 262 pruebas/build Docker correctos.
- Footer: nombres/fecha desde portada; footer/galería con `--paper` continuo en ambos temas.
- Confirmación: DSC01036.jpg intacta de fondo cover, mensaje del registro y enlace Kalista 20px arriba.
  Confirma aquí abre dialog nativo con rsvp.png original autorizado sobre oliva #6A6A53; campos 14px,
  botones 50px, scroll interior, foco circular, fondo bloqueado y restauración exacta de scroll/foco.
  Escape/X/exterior cierran; conserva datos al reabrir. Móvil/escritorio y ambos temas revisados.
  Modal en carga/error: al resolver o reintentar ofrece «Continuar» en NOT_ANSWERED; handleReveal
  exige ready y plazo abierto. Consultas/envíos intactos; npm run check correcto en Docker.
- Galería: originales intactos, 57 WebP 480/768/1200; srcSet/sizes, activa±1 y pausa fuera de pantalla.
- Hoteles: El Refugio, imagen 45.5%/14rem; Reservar como Ubicación, Reservatio con NAOMIYANDRES.
- Regalos: Liverpool con originales verde/blanco vía plantilla según tema, enlace original en
  imagen accesible, grande y centrada. BBVA comentada en el registro (código/recursos intactos):
  restaurar solo con datos correctos verificados. Liverpool 51688096 heredado de la boda anterior,
  sin modificar; titular actual no verificable por web.
- Solo adultos: título reducido 25 %, sin hojas/flores; centro con `SectionDivider` compartido.
  Marco cóncavo, mensajes y temas intactos; escritorio/móvil 320 y ambos temas revisados.
  Contenido desde `wedding.soloAdultos`; RSVP intacto.
- Itinerario vertical centrado, sin tarjetas; ceremonia 16:00, recepción/cóctel 19:30,
  civil sin hora (confirmado), cena 20:00. Anillos originales vía plantilla, hover oscuro #FAF7EF.
- Ubicaciones: nombre → hora → dirección → botón. Hora Montserrat/ember 0.95rem (antes 0.85),
  dirección 1rem (antes 1.0625), espacio nombre/hora ajustado; imágenes/animaciones intactas.
  Ceremonia 16:00 hrs (`ceremonyTime` del registro); recepción 19:30 hrs. Botones con pin.
  Ajuste compartido móvil/escritorio; 262 pruebas/build Docker correctos.
- Contador: marco fino horizontal; ramas SVG solo arriba-izquierda/abajo-derecha, según referencia.
  Sin separadores ni fondo añadido; colores/cálculos intactos (2027-03-13T00:00:00-06:00).
  Móvil 320 y escritorio revisados en ambos temas; 262 pruebas/build Docker correctos.
- Spec 004: T1–T16 hechas, T17 manual pendiente; contrato 1.4.0. Servicio detallado en `AGENTS.md`.
- Spec 005: T1–T20, T22/T23 hechas; T21 manual pendiente. RSVP y consulta tolerante implementados.
- Seguridad Docker: `dev`/`preview` → `scripts/safe-dev.mjs`; `test`/`build`/`check` →
  `scripts/safe-check.mjs`. Uso/límites en `docs/local-security.md`; reglas en `AGENTS.md`.
## Decisiones y motivos
- Docker instala desde manifiestos sin fuentes/scripts npm; ejecuta sin red, privilegios
  ni montajes del host. Relay `127.0.0.1:5173`; dev/preview separados, sin alternativa en host.
- Se copian derivados, iconos, audio/fuentes y `gas/Code.gs`; no originales ni libros reales.
- Solo se transmiten `VITE_SERVICE_URL` y `VITE_WEDDING_SLUG` del entorno del proceso; son públicas.
  No se leen ni copian `.env*`. Los builds locales son desechables, sin `dist/` exportado;
  publicar requiere conservarlo desde un entorno aislado de CI/hosting (README).
- RSVP: lookup privado por diez dígitos, solo genérica/pública, sin escritura ni persistencia.
  Tras enviar, `lookupPhone` conserva la llave de `submitted.current` para «Editar».
  Adultos 1..cupo (0 heredado → 1); niños 0..cupo. Rechazo conserva solo mensaje; saludo personal
  desde `invitation.guestName`, solo al revelar. Detalles permanentes en `AGENTS.md`.
- Contrato: `src/constants/contract.js` fuente única; `docs/servicio-invitados.md` derivado;
  `test/serviceContract.test.js` vigila sincronía. Literales del servicio en inglés por excepción.
- Servicio: texto escapado sin fórmulas; números/vacíos intactos. `ScriptLock` compartido,
  `flush()` antes de liberar y `releaseLock()` en `finally`.
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
