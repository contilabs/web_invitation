# AGENTS.md

## What this repo is

A static digital wedding invitation (**Spanish UI, `lang="es"`**) for *Karina & Gerardo*, built by
combining the best parts of three reference projects and using the **assets (photos, icons, audio)
and fonts from `../invitacionk-g`**. Plain HTML + CSS + vanilla JS + Bootstrap 5 (CDN):

- **No build step, no package manager, no tests, no lint.** There is no `package.json`.
- To preview: open `index.html` directly or serve the folder (VS Code **Live Server**,
  `python -m http.server`). Verify changes manually in a browser.

## Structure

```
index.html        # All invitation content (single page, sections commented ES: 1–14)
styles.css        # Light-theme styles (Montserrat + @font-face Erstoria/Kalista)
darkMode.css      # Dark theme + toggle switch styles
script.js         # Countdown, music, scroll reveal, guest personalization, copy bank data
darkMode.js       # Dark mode toggle handler
assets/           # Copied verbatim from invitacionk-g (photos, icons, audio)
fonts/            # Erstoria.woff2, Kalista Script Regular .woff2/.woff (copied from invitacionk-g)
```

`.reveal` sections animate in via `IntersectionObserver` (adds `.visible`). Bootstrap carousel
(`#galeria`) is the photo gallery.

## Reference projects (outside this repo — do not edit them from here)

| Path | Stack | Use |
| --- | --- | --- |
| `../invitacionk-g` | Bootstrap 5 + vanilla JS | **Asset source** + content (event data copied from here) |
| `../InvitacionD-R` | Bootstrap 5 + vanilla JS | Scroll animations, `?invitados=N` personalization, music-on-INGRESAR |
| `../invitaci-n-ByF` | Bootstrap 3 + jQuery | Considered only; legacy BS3 markup must not be mixed in |

This repo intentionally targets **Bootstrap 5 + vanilla JS**; never introduce jQuery, a bundler,
or a framework without asking.

## Hard-coded personalization (update per event, easy to miss)

- **Countdown target date** is the constant `fechaBoda` in `script.js` (`2027-11-01T16:30:00`)
  *and* appears as text in the welcome modal and `.Fecha` section of `index.html`. Keep in sync.
  After the date passes, the countdown area shows a fixed "thanks" message (see `actualizarCuenta()`).
- **Guest count** is read from `?invitados=N` and written into `#numero` in the RSVP section
  (defaults to "un lugar").
- **RSVP** posts to FormSubmit.co whose destination email is hardcoded in the form `action`
  in `index.html`. First submission triggers a confirmation step.
- **Bank-transfer data** (account + recipient name) is hardcoded in `copyInfo()` in `script.js`.
- Couple names, venue links, gift registry and hotel links are inline `href`/`h1` values in
  `index.html`.

## Gotchas

- **Asset availability is source-of-truth.** The k-g asset set does *not* contain every numbered
  photo: `foto15.jpg`, `foto17.jpg`, `foto18.jpg` do not exist (the gallery only uses slides that
  exist, currently `foto2..foto14, foto16, foto19`). When adding photos, verify the filename
  against `assets/photos/` first and match case exactly (case matters on GitHub Pages/Linux).
- **Background music cannot autoplay** in browsers; it is started by the INGRESAR button and the
  float-ing music button (`reproducirMusica()`/`pausarMusica()` in `script.js`). Keep the gesture.
- **Dark mode** toggles a `dark-mode` class on `<body>` (`darkMode.js`), styled in `darkMode.css`.
- The `.carousel` class name belongs to Bootstrap; the gallery `<section>` uses `.galeria` to avoid
  collisions — keep it that way.
- Keep all user-facing copy in **Spanish**, including new sections.