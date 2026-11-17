# MEMORY.md — Invitación digital
Memoria entre sesiones. Máximo ~80 líneas; las reglas permanentes viven en `AGENTS.md`.

## Estado actual
- Rama objetivo: `boda_nahomi_andres`. Se integró `WI-1-Project-Setup` (rediseño visual,
  fuentes, fotos optimizadas, RSVP y registro Naomi/Andrés).
- Spec 004: T1–T16 hechas; T17 manual pendiente. Contrato público `1.4.0` y servicio Apps Script.
- Spec 005: T1–T20, T22/T23 hechas; T21 manual pendiente. RSVP con lookup privado por teléfono,
  rechazo con mensaje, saludo personalizado y consulta tolerante.
- Spec 006: panel privado integrado hasta T17. Incluye respuestas, mensajes, enlaces por código,
  filtros, detalle accesible y revelación temporal de teléfono.
- Panel: la versión administrativa es `1.2.0` para enlaces; la corrección posterior de sesión
  efímera (`1.3.0`) queda pendiente de integrar desde `codex/seccion-padres-padrinos`.
- Seguridad: los lanzadores Docker aíslan `dev`, `preview`, `test`, `build` y `check`; no ejecutar
  herramientas del proyecto directamente en el host.
- Sección de padres/padrinos todavía pendiente de integrar desde `codex/seccion-padres-padrinos`.

## Decisiones importantes
- `src/data/wedding.js` es el único registro de contenido; el invitado y RSVP vienen del servicio.
- Parámetro de invitación: `guest`; teléfono solo en genérica/pública, diez dígitos, sin persistencia.
- Adultos `1..cupo`; niños `0..cupo`; un rechazo conserva únicamente el mensaje.
- `src/constants/contract.js` es fuente del contrato y `docs/servicio-invitados.md` su derivado.
- La plantilla usa `useTemplate`; fotos por clave y variantes optimizadas; `base: "./"` se conserva.
- Tema inicial en el shell, preferencia `kg-tema`, colores por variables CSS y audio solo tras gesto.

## Errores a evitar
- `PUBLIC` con `limit = "n"` en `generic` es `MALFORMED_GUEST`: corregir el libro, no la app.
- No probar `services/config.js` ni `services/photos.js` con Node; usan APIs de Vite.
- Paridad visual: servir el build y medir por DevTools Protocol, no con `--dump-dom`.

## Pendiente
- Integrar `codex/seccion-padres-padrinos`, conservando enlaces del panel y aplicando la sesión efímera.
- Ejecutar `npm run check` en Docker después de completar los merges.
- Verificaciones manuales de specs 003/004/005/006 contra servicio real, móvil y Watercolor Reveal.
