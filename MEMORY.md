# MEMORY.md — Invitación digital
Memoria entre sesiones. Máximo ~80 líneas; las reglas permanentes viven en `AGENTS.md`.

## Estado actual
- Rama objetivo: `boda_nahomi_andres`. Integrados el rediseño de `WI-1-Project-Setup` y el
  panel privado de respuestas de `codex/panel-respuestas`.
- Integradas `codex/panel-respuestas` y `codex/seccion-padres-padrinos`, con la sección de
  padres/padrinos y sesión administrativa efímera de 15 minutos.
- Spec 004: T1–T16 hechas; T17 manual pendiente. Contrato público `1.4.0` y Apps Script.
- Spec 005: T1–T20, T22/T23 hechas; T21 manual pendiente. RSVP con lookup privado por teléfono,
  rechazo con mensaje, saludo personalizado y consulta tolerante.
- Spec 006: panel con respuestas, mensajes, enlaces por código, filtros, detalle accesible y
  revelación temporal del teléfono; la sesión efímera sustituye al token en lecturas.
- Seguridad: `dev`, `preview`, `test`, `build` y `check` usan lanzadores Docker; no ejecutar
  herramientas del proyecto directamente en el host.
- Configuración real: existe `.env.local` gitignorado con `VITE_SERVICE_URL` y
  `VITE_WEDDING_SLUG`; los lanzadores leen solo esas dos variables y no copian el archivo.

## Decisiones importantes
- `src/data/wedding.js` es el único registro de contenido; el invitado y RSVP vienen del servicio.
- Parámetro `guest`; teléfono solo en genérica/pública, diez dígitos y sin persistencia.
- Adultos `1..cupo`; niños `0..cupo`; un rechazo conserva únicamente el mensaje.
- `src/constants/contract.js` es fuente del contrato y `docs/servicio-invitados.md` su derivado.
- Plantilla por `useTemplate`, fotos por clave y variantes optimizadas; `base: "./"` se conserva.
- Tema inicial en el shell, `kg-tema`, colores por variables CSS y audio solo tras gesto.

## Errores a evitar
- `PUBLIC` con `limit = "n"` en `generic` es `MALFORMED_GUEST`: corregir el libro, no la app.
- No probar `services/config.js` ni `services/photos.js` con Node; usan APIs de Vite.
- Paridad visual: servir el build y medir por DevTools Protocol, no con `--dump-dom`.

## Pendiente
- `npm run check` queda pendiente porque Docker no está instalado/activo en este entorno.
- Verificaciones manuales de specs 003/004/005/006 contra servicio real, móvil y Watercolor Reveal.
