# 💌 Invitación Digital — Karina & Gerardo

Invitación de boda web construida con **React + Vite**. El build genera un sitio **estático**
en `dist/`, listo para servir en cualquier subruta. No hay backend ni panel: toda la boda vive en
un **registro único** (`src/data/wedding.js`) y las invitaciones en `src/data/guest-cards.js`; la
interfaz solo lee y pinta.

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

```bash
npm install       # instala React + Vite (no hay más dependencias)
npm run dev       # servidor de desarrollo
npm run build     # genera el sitio estático en dist/
npm run preview   # sirve el build de dist/
npm test          # pruebas de la lógica pura (node --test, sin instalar nada)
```

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
src/data/           # Registro de la boda (wedding.js) y fichas de invitación (guest-cards.js) + pruebas
src/utils/          # Funciones puras + pruebas (sin React, sin DOM, sin reloj)
src/hooks/          # Estado con efecto: tema, música, invitación, cuenta regresiva, galería…
src/components/     # Presentación: layout/ (estructura), sections/ (contenido) y ui/ (piezas reutilizables)
src/providers/      # TemplateProvider (publica la plantilla activa)
src/services/       # photos.js (resuelve las rutas de las fotos con Vite)
src/templates/      # Capa de presentación: index.js (registro) y classic/ (CSS, iconos, tamaños)
test/               # Andamiaje (andamiaje.test.js) y contratos (contracts.test.js)
assets/             # Fotos originales, iconos y audio
assets/photos/opt/  # Derivados JPEG optimizados: lo que la página carga de verdad
fonts/              # Erstoria + Kalista (locales)
```

## 🎨 Personalización (datos de la pareja y del evento)

Todo eso se edita en **`src/data/wedding.js`** (registro único de la boda). Las **fichas de
invitación** viven aparte, en **`src/data/guest-cards.js`**. No hay textos de contenido en los
componentes: la interfaz solo lee el registro y pinta.

| Qué | Clave en el registro |
| --- | --- |
| Nombres de los novios | `pareja` |
| Fecha, hora y zona del evento | `evento` (`fechaInicio`, `zonaHoraria`) |
| Ubicaciones (ceremonia y recepción) | `ubicaciones` |
| Itinerario, galería e historia | `itinerario`, `galeria`, `historia` |
| Cita y portada | `cita`, `portada` |
| Mesa de regalos | `regalos` (por tipo, con sus datos copiables) |
| Hoteles y restricciones | `hoteles`, `restricciones` |
| Confirmación (plazo y campos) | `confirmacion` |
| Música, navegación y visibilidad | `ajustes` |
| Crédito y correo del RSVP | `marca.enlaces` |
| Plantilla | `plantilla` (`"clasica"`) |

Para **reutilizar la invitación con otra pareja**: cambia el registro, deja las fotos con las
mismas claves y anchos en `assets/photos/opt/` y vuelve a publicar.

### Enlaces de invitación

La invitación se resuelve por **código de enlace** (no por `?invitados=N`). Hay tres tipos de
ficha en `src/data/guest-cards.js`:

```text
index.html?codigo=karina-gerardo-inv-001   # personalizada: nombre, boletos y lugares reservados
index.html?codigo=rec-003                  # reutilizable: límite de asistentes (1–10), sin nombre
index.html?codigo=gen-001                  # genérica: un enlace para todos, sin lugares reservados
```

Sin código (o con uno desconocido) se muestra la invitación completa con «un lugar».

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

`npm run build` deja el sitio en `dist/`. `vite.config.js` fija **`base: "./"`**, así que el
build usa rutas relativas y funciona en cualquier subruta o dominio (incluidos los enlaces ya
repartidos del tipo `…/index.html?codigo=…`). No hay URL de publicación confirmada todavía.
