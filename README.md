# 💌 Invitación Digital — Karina &amp; Gerardo

Invitación de boda web 100% estática (HTML + CSS + JS + Bootstrap 5), construida tomando lo
mejor de tres proyectos de invitaciones y usando los **assets de `invitacionk-g`**.

## 🔥 Concepto: «Fuego cálido: día y noche»

El fuego es la imagen que la pareja usa para hablar de su amor, así que la paleta gira en
torno a la brasa:

- **Día**: papel marfil, tinta café espresso y cobre de brasa.
- **Noche**: luz de vela — oscuros cálidos y una brasa más viva.

Ambos temas se controlan **solo con variables CSS** (`:root` en `styles.css` para el día,
`html.dark-mode` en `darkMode.css` para la noche), y el interruptor recuerda la elección.

El estilo es **minimalista y editorial**: dos tipografías (Erstoria para nombres y títulos,
Montserrat para el texto), superficies de línea de 1 px sin sombras, un único bloque oscuro (la
cuenta regresiva) y la brasa reservada como acento. La caligrafía Kalista sigue disponible para los
nombres cambiando un solo token (`--fuente-nombres`).

## ▶️ Cómo verla

No hay build ni dependencias. Opciones:

- Abre `index.html` directamente en el navegador.
- O sirve la carpeta con un servidor estático simple (VS Code **Live Server**,
  `python -m http.server`, etc.)

Verifica manualmente en el navegador (no hay tests ni lint).

## 📁 Estructura

```
index.html        # Todo el contenido de la invitación (secciones 1–14 comentadas)
styles.css        # Estilos del tema día (Erstoria para nombres/títulos + Montserrat)
darkMode.css      # Estilos del tema noche + interruptor de tema
script.js         # Cuenta regresiva, música, aparición al hacer scroll, galería/visor,
                  # personalización por invitado y copiar datos bancarios
darkMode.js       # Interruptor de tema (día / noche)
assets/           # Fotos originales, iconos y audio (copiados de invitacionk-g)
assets/photos/opt # Derivados JPEG optimizados: lo que la página carga de verdad
fonts/            # Erstoria + Kalista (copiadas de invitacionk-g)
```

## 🎨 Personalización (datos de la pareja y del evento)

| Qué | Dónde cambia |
| --- | --- |
| Nombre de los novios | `<h1>` del modal y del `header.inicio` en `index.html` |
| Fecha del evento | Modal, portada, banda de cuenta regresiva y pie en `index.html` |
| Fecha de la cuenta regresiva | Constante `fechaBoda` en `script.js` (**debe coincidir con el HTML**) |
| Correo del formulario RSVP | `action` del `<form>` en `index.html` (FormSubmit.co; el primer envío pide confirmación) |
| Cuenta bancaria / beneficiario | Constante `DATOS_BANCARIOS` en `script.js` |
| Enlaces de ubicaciones, mesa de regalos y hoteles | Anclas `href` en `index.html` |
| Fotos de la galería | Carrusel (`#galeria`) y cuadrícula (`.galeria-rejilla`) en `index.html` |

### Enlace personalizado por invitado

La invitación lee `?invitados=N` de la URL y muestra lo reservado en la sección de confirmación:

```text
index.html?invitados=3
```

### Música

El navegador bloquea el autoplay: la música inicia al pulsar **INGRESAR** en el modal de
bienvenida (o con el botón flotante de música). Reemplaza `assets/audio.mp3` si quieres otra canción.

### Tema día / noche

El interruptor está en el panel fijo (arriba a la derecha). La elección se guarda en el
navegador; si el visitante nunca la cambia, se respeta el tema del sistema operativo.

## 🖼️ Fotos: originales y derivados

Las fotos de `assets/photos/` son las originales (sin tocar, ~83 MB). La página **no** las carga
directamente: usa las versiones optimizadas de `assets/photos/opt/` (dos anchos por foto,
declarados con `srcset` y `sizes`).

> ⚠️ Si cambias una foto original, vuelve a generar sus derivados con los mismos nombres y anchos
> (por ejemplo `foto5-900.jpg` y `foto5-1800.jpg`). Si no, el `srcset` pedirá archivos que no existen.

> ⚠️ Rutas sensibles a mayúsculas: en macOS/Linux/GitHub Pages los nombres de archivo deben
> coincidir exactamente (por ejemplo `foto1.jpg`, no `Foto1.JPG`). Nota: los originales incluyen
> `foto9.png` (no `.jpg`) y `backgrond3.jpg` (con esa grafía).
