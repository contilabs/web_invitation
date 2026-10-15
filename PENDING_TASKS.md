# PENDING_TASKS.md — Invitación digital

Casos límite, dudas y trabajo diferido que complementan `MEMORY.md`.
No es un histórico: **al resolverse o dejar de ser relevante, cada entrada se elimina.**

## Casos límite por cubrir

1. Audio: si `play()` falla (o falta `assets/audio.mp3`, que rompe el **build**), `useMusic`
   registra en consola y deja el botón en pausa, pero **no hay aviso al invitado**. Falta decidir
   el aviso visible.
2. RSVP: error de red o servidor caído; el formulario nativo sale de la página y no hay mensaje
   de error propio.
3. Estado de carga con conexión lenta: `#root` queda vacío hasta que React monta (el caso **sin
   JavaScript** está cubierto con un `<noscript>` en español).
4. Zona horaria del invitado (viajeros): el registro ya declara `evento.zonaHoraria` y la fecha
   **visible** se formatea en esa zona, pero `eventInstant` interpreta `evento.fechaInicio`
   (sin offset) en la zona del navegador, así que la **cuenta regresiva** de un invitado fuera de
   Guadalajara puede ir corrida. Decidir si se fija un offset explícito.
5. Entrada por enlace con ancla/hash (`#seccion`): los anclajes internos sí funcionan, pero
   `app/main.jsx` fija `scrollRestoration = "manual"`, así que recargar con hash no
   restaura la posición.
6. Vista previa al compartir el enlace (WhatsApp/redes): el build emite `og:image` con **ruta
   relativa y con hash** (`./assets/foto2-1800-<hash>.jpg`), y los rastreadores necesitan una URL
   **absoluta**. Hace falta el host real (o un absoluto fijo) al confirmar la publicación.
7. Publicación: no hay ninguna confirmada (sin CNAME, sin workflows, Pages devuelve 404). El build
   usa `base: "./"` para no adivinar; cuando exista host, revisar si sigue siendo lo adecuado y
   desplegar (el despliegue no está en `tasks.md`).
8. Imagen de la galería que no carga: ¿marcador o se omite?
9. Semántica: con la portada abierta hay **dos `<h1>`** en el DOM (portada + hero). Hoy es
   correcto por `aria-modal` + `inert` (el hero no se expone), pero valorar si conviene bajar el
   del hero a `<h2>`/`<p>` mientras la portada está abierta.

## Trabajo diferido

- **Tope global de asistentes (spec 002).** Definir si el máximo de una boda cuenta la suma de
  todas las respuestas (no solo la genérica) y qué ocurre cuando se agota (bloquear
  confirmaciones, avisar, etc.). Fuera de alcance en la primera iteración del modelo de datos.
- **Límites fuera de rango (spec 002).** `resolveInvitation` convierte un `limite` de reutilizable
  fuera de 1–10 en `desconocida` **sin avisar**, y `guestLimit` recorta el límite de la ficha al
  `maximoBoda` también en silencio. La spec pedía **fallo visible** en estos casos: decidir si
  `registryErrors` los marca como error.
- **Datos copiables sin marca (spec 002).** Si una opción de la mesa de regalos trae varios
  datos y ninguno con `copiar: true`, no se muestra botón (a propósito, no se adivina la cuenta).
  Valorar si `utils/validation.js` debería avisarlo como aviso del registro.
- **`services/photos.js`.** Resuelve por clave y **lanza al arrancar** si falta una clave esperada
  (las estructurales de la plantilla `foto1`/`foto9`/`foto7` y las del registro: portada y
  galería). Es un guardarraíl a propósito, pero acopla el registro con `assets/photos/opt/`: al
  cambiar fotos o claves hay que mantener las variantes (revisar si conviene un error visible en
  vez de uno de arranque).
- Autoalojar **Montserrat y Source Serif 4**: hoy se cargan desde el CDN de Google Fonts
  (`preconnect` + hoja externa). Se mantiene por ser preexistente y conservar la tipografía
  (RF-11), pero autoalojarlas reduciría peticiones a terceros (RNF-7). Requiere los archivos.
- **`src/types/*.js` (spec 003, T28).** El `plan.md` (§3 y §6) lista `types/wedding.js` y
  `types/guestCard.js` (`@typedef` en JSDoc, sin código en ejecución), pero **ninguna tarea los
  crea** y no existen (tampoco hay `@typedef` en `src/`). Decidir si se añaden o se retiran del
  plan: son documentación de tipos, no afectan al comportamiento ni a la paridad.

## Gobernanza (detectado en la revisión QA; sin resolver)

- Decidir si el rediseño puede usar librerías de UI (el principio 1 solo permite el stack elegido).
