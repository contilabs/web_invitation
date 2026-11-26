# 💌 Invitación Digital — Naomi y Andrés

Invitación de boda web construida con **React + Vite**. El build genera un sitio **estático**
en `dist/`, listo para servir en cualquier subruta. No hay panel: todo el contenido de la boda vive
en un **registro único** (`src/data/wedding.js`) y la interfaz solo lee y pinta. Las **respuestas
de los invitados** (confirmación de asistencia) van a un **servicio de registro** (Apps Script)
configurado por variables de entorno al publicar (ver «Servicio de invitados y confirmación»).

## 🔥 Concepto: «Fuego cálido: día y noche»

El fuego es la imagen que la pareja usa para hablar de su amor, así que la paleta gira en
torno a la brasa:

- **Día**: papel marfil, tinta café espresso y cobre de brasa.
- **Noche**: luz de vela — oscuros cálidos y una brasa más viva.

El estilo es **minimalista y editorial**: superficies de línea de 1 px sin sombras, un único
bloque oscuro (la cuenta regresiva) y la brasa reservada como acento. Cada sección abre con el
mismo gesto —un rombo de brasa sobre el título y un filete debajo— y el formulario ofrece la
asistencia como dos opciones claras.

Ambos temas se controlan **solo con variables CSS** (`:root` en `classic.css` para el día,
`html.dark-mode` en `classic-dark.css` para la noche), y el interruptor recuerda la elección.

## ▶️ Cómo verla

Requisitos: **Node.js 22.12+ y npm** para los lanzadores, y **Docker Desktop con
contenedores Linux** (macOS/Windows) o Docker Engine (Linux), instalado y en marcha.
No hace falta instalar dependencias en el host. Revisa `package.json`, `scripts/`, `.npmrc`
y el lockfile antes de ejecutar un checkout nuevo.

```bash
npm run dev       # Vite en Docker, con recarga al editar
npm run preview   # compila y sirve en Docker; reiniciar tras editar
npm run build     # build de publicacion con Vite (tambien en Netlify)
npm test          # pruebas de aplicación y seguridad con node --test dentro de Docker
npm run check     # pruebas y build en una sola sesión aislada
```

Abre [http://127.0.0.1:5173](http://127.0.0.1:5173); desarrollo y preview comparten el puerto,
así que se ejecutan de uno en uno. Ctrl+C elimina los recursos temporales. No se admiten
argumentos extra en los lanzadores Docker. `npm run build` es el comando de publicacion y no
requiere Docker.

Los contenedores de ejecución no tienen red ni montajes del host. Las dependencias se instalan
antes, con red, solo desde los manifiestos y sin scripts de instalación. El build y su `dist/`
quedan **dentro del contenedor y se descartan**; `preview` genera su propio build.
Consulta [Seguridad local](docs/local-security.md) para configuración del RSVP, límites,
limpieza y publicación.

## 🧱 Stack

- **React 19** + **Vite 8** con `@vitejs/plugin-react`. Nada de librerías de UI, CSS o
  animación: los estilos son propios y el estado vive en hooks.

## 🗂️ Organización y convención de nombres

El proyecto separa **qué se muestra** (datos y secciones), **cómo se comporta** (lógica pura,
hooks y servicios) y **cómo se ve** (la **capa de plantilla**). La presentación (estilos,
iconos, tamaños de imagen y fotos estructurales) queda concentrada en `src/templates/`, de modo
que otra plantilla pueda añadirse sin tocar la lógica ni los datos. Hoy solo existe la plantilla
`clasica` y **no hay ninguna forma de elegir otra** (ni control, ni parámetro, ni ajuste).

La **nomenclatura del código** (archivos, módulos, componentes, hooks, funciones, variables y
clases de estilo) va en **inglés**. Se quedan en **español** los **textos visibles**, los
**datos** (incluidas sus claves), los **comentarios** y esta **documentación**. Los **ids de
ancla** de la página (`#inicio`, `#fecha`…) también se conservan porque son enlaces ya
compartibles.

## 📁 Estructura

```
index.html          # Shell de Vite (<div id="root">) + script de tema anti-parpadeo + metas
src/app/            # main.jsx (monta React), App.jsx (compone) y sectionRenderers.jsx (mapa clave → componente)
src/constants/      # Constantes compartidas: orden de secciones, tema y plantillas
src/data/           # Registro de la boda (wedding.js) + ejemplos ficticios de invitados (guest-cards.js, solo fixtures)
src/utils/          # Funciones puras + pruebas (sin React, sin DOM, sin reloj)
src/hooks/          # Estado con efecto: tema, música, invitación, cuenta regresiva, galería…
src/components/     # Presentación: layout/ (estructura), sections/ (contenido) y ui/ (piezas reutilizables)
src/providers/      # TemplateProvider (publica la plantilla activa)
src/services/       # photos.js (resuelve las rutas de las fotos con Vite)
src/templates/      # Capa de presentación: index.js (registro) y classic/ (CSS, iconos, tamaños)
test/               # Andamiaje, contratos y sincronía del contrato del servicio
gas/                # El servicio de registro (Apps Script) y su puesta en marcha
docs/               # Constitución y contrato del servicio (servicio-invitados.md)
assets/             # Fotos originales, iconos y audio
assets/photos/opt/  # Derivados JPEG optimizados: lo que la página carga de verdad
fonts/              # Erstoria + Kalista (locales)
scripts/            # Lanzadores Docker, transporte local y pruebas de seguridad
```

## 🎨 Personalización (datos de la pareja y del evento)

Todo eso se edita en **`src/data/wedding.js`** (registro único de la boda). Las **fichas de
invitación** de antes ya no personalizan nada: `src/data/guest-cards.js` son **ejemplos
ficticios** (fixtures de las pruebas) y la app no los importa en ejecución. No hay textos de
contenido en los componentes: la interfaz solo lee el registro y pinta.

| Qué | Clave en el registro |
| --- | --- |
| Nombres de los novios | `pareja` |
| Fecha, hora y zona del evento | `evento` (`fechaInicio`, `zonaHoraria`) |
| Ubicaciones (ceremonia y recepción) | `ubicaciones` |
| Itinerario, galería e historia | `itinerario`, `galeria`, `historia` |
| Cita y portada | `cita`, `portada` |
| Mesa de regalos | `regalos` (por tipo, con sus datos copiables) |
| Hoteles y restricciones | `hoteles`, `restricciones` |
| Confirmación (título, descripción y campos) | `confirmacion` |
| Música, navegación y visibilidad | `ajustes` |
| Crédito | `marca.enlaces` |
| Plantilla | `plantilla` (`"clasica"`) |

El **plazo** de confirmación y los **invitados** no viven en el registro: los resuelve el
servicio (ver «Servicio de invitados y confirmación»).

Para **reutilizar la invitación con otra pareja**: cambia el registro, deja las fotos con las
mismas claves y anchos en `assets/photos/opt/`, da de alta la boda en el maestro del servicio
(`gas/README.md`) y vuelve a publicar.

### Enlaces de invitación

La invitación se identifica con el parámetro **`guest`** y se resuelve contra el servicio de
registro según el **tipo** que declara la boda en su maestro (los antiguos `?codigo=…` y
`?invitados=N` están jubilados):

- **personalizada** (`guest` = el identificador de la fila precargada): nombre, acompañante y
  cupo vienen dados y **no** se pide teléfono.
- **genérica** (`guest` = un código con su propio cupo): nombre y teléfono, **también para
  rechazar**; el teléfono es la llave de la fila (una respuesta con el mismo teléfono
  actualiza la fila, no la duplica).
- **pública** (`guest` = el código reservado `PUBLIC`): un enlace para todos, **sin tope**,
  nombre y teléfono también para rechazar.

```text
index.html?guest=karina-001     # personalizada: nombre, acompañante y lugares reservados
index.html?guest=gen-familia    # genérica: cupo del código, sin nombre precargado
index.html?guest=PUBLIC         # pública: sin tope
```

Si el servicio no está configurado, la invitación se muestra completa y **sin personalizar**
(modo demo, con su aviso).

### Música

El navegador bloquea el autoplay: la música inicia al pulsar **Ingresar** en la portada (o con
el botón flotante). Reemplaza `assets/audio.mp3` si quieres otra canción.

### Tema día / noche

El interruptor está en el panel fijo (arriba a la derecha). La elección se guarda en el
navegador; si el visitante nunca la cambia, se respeta el tema del sistema operativo. El script
del `<head>` resuelve el tema **antes de pintar** para que no haya parpadeo.

### Tipografías

`Erstoria` (nombres y títulos, local) y `Source Serif 4` (texto) + `Montserrat` (etiquetas,
Google Fonts). La caligrafía `Kalista` sigue disponible para los nombres cambiando un solo
token: `--fuente-nombres: var(--fuente-script)`.

## 📬 Servicio de invitados y confirmación

La confirmación de asistencia **no** es un formulario nativo ni va por correo: la app habla con
un **servicio de registro** (Google Apps Script, `gas/Code.gs`) que lee y escribe los libros de
invitados. El contrato vive en **módulo + documento**: `src/constants/contract.js` es la fuente
única que consume la app y `docs/servicio-invitados.md` es el documento derivado (una prueba
vigila que no se desincronicen). La puesta en marcha del servicio (maestro, libros y
publicación) está explicada en `gas/README.md`.

La configuración del despliegue **no** está en el repo: son valores por publicación, que se
fijan con variables públicas de Vite. Los lanzadores Docker solo transmiten estas tres
variables del entorno del proceso; no leen ni copian `.env.local` ni otros archivos `.env`:

```bash
export VITE_SERVICE_URL="https://script.google.com/macros/s/EJEMPLO/exec"
export VITE_WEDDING_SLUG="mi-boda"
export VITE_WHATSAPP_NUMBER="521234567890"
npm run dev  # también se aplican a preview, build y check
```

Tras guardar el RSVP, «Notificar por WhatsApp» abre un mensaje opcional para Naomi con el
nombre del invitado, su asistencia y el total confirmado cuando corresponda.
`VITE_WHATSAPP_NUMBER` es el número de Naomi en formato internacional, con código de país y
solo dígitos. Si está ausente o vacía, el build acepta `VITE_WHATSAPP_PHONE` de publicaciones
anteriores. La opción se oculta si el número resultante está vacío o tiene un formato inválido.

- **Sin URL** → **modo demo**: la invitación se ve completa y sin personalizar, y la
  confirmación queda deshabilitada con su aviso (no se llama a nadie).
- **URL sin `slug`** → aviso «esta invitación no está configurada», sin reintento.
- **Ambas** → la app resuelve la invitación al abrirla y registra la respuesta al enviarla
  (espera de 10 s; si el servicio no responde, degradación visible con botón de reintento).

El **plazo** de confirmación también sale del servicio (el `deadline` de la fila de la boda en
el maestro), no del registro local.

## ♿ Accesibilidad

Enlace «Saltar al contenido», foco visible, operación por teclado de la portada, el carrusel y
el visor, textos alternativos en las fotos y respeto por la preferencia de **movimiento
reducido** (las animaciones se desactivan y el carrusel deja de avanzar solo).

## 🖼️ Fotos: originales y derivados

Las fotos de `assets/photos/` son las originales (sin tocar, ~83 MB). La página **no** las carga
directamente: usa las versiones optimizadas de `assets/photos/opt/` (dos anchos por foto,
declarados con `srcset` y `sizes`). Las rutas se resuelven con `src/services/photos.js` a partir
de la **clave** (la base del nombre, p. ej. `foto5`).

> ⚠️ Si cambias una foto original, vuelve a generar sus derivados con los mismos nombres y anchos
> (por ejemplo `foto5-900.jpg` y `foto5-1800.jpg`). Si no, el `srcset` pedirá archivos que no existen.

> ⚠️ Rutas sensibles a mayúsculas: en macOS/Linux/GitHub Pages los nombres de archivo deben
> coincidir exactamente (por ejemplo `foto1.jpg`, no `Foto1.JPG`). Nota: en `opt/` todas son
> `.jpg` (p. ej. `foto9-900.jpg`), aunque el original de `assets/photos/` sea de otra extensión.

## 🚀 Despliegue

`npm run check` comprueba el sitio en un contenedor desechable y no exporta `dist/` al host.
Para publicar, el entorno de CI o de hosting debe instalar con `npm ci --ignore-scripts` y
ejecutar `npm run build`, conservar `dist/` y publicarlo como sitio estático. Netlify ejecuta
este comando directamente en su runner Node, sin Docker.

`vite.config.js` fija **`base: "./"`**, así que el
build usa rutas relativas y funciona en cualquier subruta o dominio (incluidos los enlaces ya
repartidos del tipo `…/index.html?guest=…`). Para que la confirmación hable con el servicio,
configura `VITE_SERVICE_URL` y `VITE_WEDDING_SLUG` para el build. El panel usa la misma
`VITE_SERVICE_URL`. Para habilitar WhatsApp, añade `VITE_WHATSAPP_NUMBER` a las variables de
entorno del build en Netlify y vuelve a desplegar.
Sin URL del servicio, el sitio se publica en modo demo. No hay URL de publicación
confirmada todavía.
