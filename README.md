# 💌 Invitación Digital — Karina & Gerardo

Invitación de boda web construida con **React + Vite**. El build genera un sitio **estático**
en `dist/`, listo para servir en cualquier subruta. No hay backend ni panel: toda la boda vive en
un **registro único** (`src/datos/boda.js`) y las invitaciones en `src/datos/invitaciones.js`; la
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

Ambos temas se controlan **solo con variables CSS** (`:root` en `styles.css` para el día,
`html.dark-mode` en `darkMode.css` para la noche), y el interruptor recuerda la elección.

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

## 📁 Estructura

```
index.html          # Shell de Vite (<div id="root">) + script de tema anti-parpadeo + metas
src/main.jsx        # Monta React
src/App.jsx         # Compone la invitación y orquesta portada, música e inert
src/datos/          # El registro de la boda y las fichas de invitación (solo datos)
src/logica/         # Funciones puras + pruebas (sin React, sin DOM, sin reloj)
src/hooks/          # Estado con efecto: tema, cuenta regresiva, música, galería, invitación…
src/componentes/    # Presentación (JSX en español)
test/               # Prueba de andamiaje (ESM, shell, Bootstrap retirado, fotos optimizadas)
assets/             # Fotos originales, iconos y audio
assets/photos/opt/  # Derivados JPEG optimizados: lo que la página carga de verdad
fonts/              # Erstoria + Kalista (locales)
```

## 🎨 Personalización (datos de la pareja y del evento)

Todo eso se edita en **`src/datos/boda.js`** (registro único de la boda). Las **fichas de
invitación** viven aparte, en **`src/datos/invitaciones.js`**. No hay textos de contenido en los
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
ficha en `src/datos/invitaciones.js`:

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
declarados con `srcset` y `sizes`).

> ⚠️ Si cambias una foto original, vuelve a generar sus derivados con los mismos nombres y anchos
> (por ejemplo `foto5-900.jpg` y `foto5-1800.jpg`). Si no, el `srcset` pedirá archivos que no existen.

> ⚠️ Rutas sensibles a mayúsculas: en macOS/Linux/GitHub Pages los nombres de archivo deben
> coincidir exactamente (por ejemplo `foto1.jpg`, no `Foto1.JPG`). Nota: los originales incluyen
> `foto9.png` (no `.jpg`) y `backgrond3.jpg` (con esa grafía).

## 🚀 Despliegue

`npm run build` deja el sitio en `dist/`. `vite.config.js` fija **`base: "./"`**, así que el
build usa rutas relativas y funciona en cualquier subruta o dominio (incluidos los enlaces ya
repartidos del tipo `…/index.html?codigo=…`). No hay URL de publicación confirmada todavía.
