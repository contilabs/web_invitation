# 💌 Invitación Digital — Karina &amp; Gerardo

Invitación de boda web 100% estática (HTML + CSS + JS + Bootstrap 5), construida tomando lo
mejor de tres proyectos de invitaciones y usando los **assets de `invitacionk-g`**.

## ▶️ Cómo verla

No hay build ni dependencias. Opciones:

- Abre `index.html` directamente en el navegador.
- O sirve la carpeta con un servidor estático simple (VS Code **Live Server**,
  `python -m http.server`, etc.)

Verifica manualmente en el navegador (no hay tests ni lint).

## 📁 Estructura

```
index.html        # Todo el contenido de la invitación
styles.css        # Estilos principales (tema claro)
darkMode.css      # Estilos del modo oscuro
script.js         # Cuenta regresiva, música, scroll, personalización, copiar cuenta
darkMode.js       # Toggle de modo oscuro
assets/           # Fotos, iconos y audio (copiados de invitacionk-g)
fonts/            # Erstoria + Kalista (copiadas de invitacionk-g)
```

## 🎨 Personalización (datos de la pareja y del evento)

| Qué | Dónde cambia |
| --- | --- |
| Nombre de los novios | `<h1>` del modal y del `header.inicio` en `index.html` |
| Fecha del evento | Sección `.Fecha` y modal en `index.html` |
| Fecha de la cuenta regresiva | Constante `fechaBoda` en `script.js` (**debe coincidir con el HTML**) |
| Correo del formulario RSVP | `action` del `<form>` en `index.html` (FormSubmit.co; el primer envío pide confirmación) |
| Cuenta bancaria / beneficiario | `copyInfo()` en `script.js` |
| Enlaces de ubicaciones, mesa de regalos y hoteles | Anclas `href` en `index.html` |
| Fotos de la galería | `<div class="carousel-inner">` en `index.html` |

### Enlace personalizado por invitado

La invitación lee `?invitados=N` de la URL y muestra lo reservado en la sección de confirmación:

```text
index.html?invitados=3
```

### Música

El navegador bloquea el autoplay: la música inicia al pulsar **INGRESAR** en el modal de
bienvenida (o con el botón flotante de música). Reemplaza `assets/audio.mp3` si quieres otra canción.

> ⚠️ Rutas de assets sensibles a mayúsculas: en macOS/Linux/GitHub Pages los nombres dearchivo
> deben coincidir exactamente (por ejemplo, `foto1.jpg`, no `Foto1.JPG`).