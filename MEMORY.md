# MEMORY.md — Invitación digital
Memoria entre sesiones. Máximo ~80 líneas; las reglas permanentes viven en `AGENTS.md`.

## Estado actual
- Vestimenta formal omite el aviso de exclusividad para adultos; se conserva la sección «No niños».
- Bienvenida: ambos nombres y el signo «&» aparecen juntos con un fundido de 0,9 s
  sin máscara para conservar completos los adornos caligráficos.
- Historia sirve WebP de 480/768/1113 px desde `pintura2.png`, sin recorte y con carga diferida.
  Su Soft Mask Reveal dura 2,2 s y espera a que la imagen cargue y entre en pantalla.
- Las hojas del modal sirven WebP de 360/720 px, con transparencia conservada. Los PNG se guardan.
- Los títulos de la invitación vuelven a Erstoria, con precarga de su WOFF2 en el HTML.
- Itinerario: Cóctel y Cena muestran «hrs» con sus horarios actuales. El tamaño
  adaptable del título «No niños» se redujo un 15 %.
- Bienvenida: entrada CSS de 4,7 s. Fondo suave y máscara de hojas y marco; acuarela
  secuencial en mensaje, fecha, nombres, línea y botón. Movimiento reducido muestra todo de inmediato.
  La máscara de acuarela se retira al terminar para dejar completos los trazos caligráficos.
  Navegador: tiempos comprobados, «Ingresar» cierra, Escape funciona durante la entrada
  y el teclado puede mostrar el botón antes de que termine la secuencia.
- Bienvenida: hojas ampliadas en esquinas opuestas, recortadas por el panel con
  `overflow: hidden`. Marco SVG sobre las hojas. Verificado en móvil, horizontal y escritorio,
  con el texto libre y el botón «Ingresar» operativo.
- Footer más compacto: crédito en una línea, tipografía ligeramente menor y menos
  separación vertical; se conserva el enlace de contacto.
  `npm run check` en Docker: 263 de 267 pruebas pasaron; los fallos impidieron llegar al build.
- Favicon de Naomi y Andrés sustituido con el ICO facilitado (16–256 px); ruta existente
  `assets/icons/wax-seal.ico`. Copia verificada por SHA-256.
- Rama objetivo: `boda_nahomi_andres`. Integrados el rediseño de `WI-1-Project-Setup` y el
  panel privado de respuestas de `codex/panel-respuestas`.
- Integradas `codex/panel-respuestas` y `codex/seccion-padres-padrinos`, con la sección de
  padres/padrinos y sesión administrativa efímera de 15 minutos.
- Spec 004: T1–T16 hechas; T17 manual pendiente. Contrato público `1.4.0` y Apps Script.
- Spec 005: T1–T20, T22/T23 hechas; T21 manual pendiente. RSVP con lookup privado por teléfono,
  rechazo con mensaje, saludo personalizado y consulta tolerante.
- Spec 006: panel con respuestas, mensajes, enlaces por código, filtros, detalle accesible y
  revelación temporal del teléfono; la sesión efímera sustituye al token en lecturas.
- Panel admin: `src/components/admin/admin.css` alineado visualmente con la invitación Ascua
  (marfil, oliva, salvia, oro y tipografías de la plantilla); solo cambio visual, sin tocar lógica.
- Panel admin móvil: las tablas de respuestas, mensajes y enlaces se convierten en tarjetas
  apiladas con `data-label`, filtros a ancho completo y acciones cómodas para tocar.
- Popup RSVP: se amplió el área útil del marco, se ajustaron márgenes/scroll interno y se añadió
  un tratamiento móvil específico con viewport seguro, controles táctiles y botón de envío visible.
- Integrados en el árbol de trabajo los cambios pendientes de `WI-1-Project-Setup`: contacto
  original compacto en el footer y hojas decorativas originales para los títulos de familia.
- Portada: en escritorio (`min-width: 601px`) la frase del hero se ancla al fondo de la foto;
  el acomodo móvil conserva el flujo original. La frase usa una sombra clara en varias capas
  y un tamaño progresivo mayor para conservar contraste y legibilidad sobre la imagen. La mejora
  de contraste se resolvió con un contorno claro fino, sin añadir una banda visible; en escritorio
  se quitó la sombra al finalizar la animación para evitar el brillo posterior.
- Seguridad: `dev`, `preview`, `test` y `check` usan lanzadores Docker; `build` ejecuta Vite
  directamente para que CI/Netlify pueda publicar sin Docker.
- Configuración real: existe `.env.local` gitignorado con `VITE_SERVICE_URL` y
  `VITE_WEDDING_SLUG`; los lanzadores leen solo esas dos variables y no copian el archivo.

## Decisiones importantes
- `src/data/wedding.js` es el único registro de contenido; el invitado y RSVP vienen del servicio.
- Parámetro `guest`; teléfono solo en genérica/pública, diez dígitos y sin persistencia.
- Adultos `1..cupo`; niños `0..cupo`; un rechazo conserva únicamente el mensaje.
- `src/constants/contract.js` es fuente del contrato y `docs/servicio-invitados.md` su derivado.
- Plantilla por `useTemplate`, fotos por clave y variantes optimizadas; `base: "./"` se conserva.
- La maquetación pública se mantiene alineada con `WI-1-Project-Setup`: familia clásica,
  orden único de secciones y estilos sin tarjetas añadidas posteriormente.
- Tema inicial en el shell, `kg-tema`, colores por variables CSS y audio solo tras gesto.
- Controles flotantes elevados a 4.5 rem (4.25 rem en móvil) para no quedar bajo el botón de
  Netlify; la música hace un fundido de 0.05 a 0.65 durante 4 s al iniciar o reiniciar.
- El tema inicial se decide siempre por la hora local: día de 07:00 a 18:59 y noche el resto;
  el cambio manual solo dura la visita y no se persiste.
- En el panel admin móvil, los botones de copiar enlaces no repiten la etiqueta «Link»; el botón
  conserva el texto «Copiar link».
- El combo de boletos del RSVP usa la apariencia y los colores de la invitación, incluida una
  flecha propia en vez del indicador azul nativo.
- El hover/foco del botón de música conserva la superficie nocturna; el valor seleccionado del
  combo de boletos queda en oliva y su opción activa también.
- El hover del combo usa un verde olivo más claro mediante `--ember-suave`.
- RSVP genérico/público: después de un `lookup` válido, el teléfono queda bloqueado en el formulario
  y el envío conserva esa llave, incluso cuando no había respuesta previa.
- Los controles flotantes de tema/música aparecen cuando aproximadamente el 30% superior de padres
  y padrinos (`#familia`) ya entró en la ventana, con el hero como respaldo si se omite; el umbral se
  recalcula al redimensionar.

## Errores a evitar
- `PUBLIC` con `limit = "n"` en `generic` es `MALFORMED_GUEST`: corregir el libro, no la app.
- No probar `services/config.js` ni `services/photos.js` con Node; usan APIs de Vite.
- Paridad visual: servir el build y medir por DevTools Protocol, no con `--dump-dom`.
- La validación aislada de `npm run check` requiere Docker; el build de publicación no.
- `npm test` volvió a quedar bloqueado en esta sesión por Docker no instalado/activo.

## Pendiente
- `npm run check` queda pendiente porque Docker no está instalado/activo en este entorno.
- Verificaciones manuales de specs 003/004/005/006 contra servicio real, móvil y Watercolor Reveal.
