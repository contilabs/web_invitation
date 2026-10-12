# AGENTS.md

## What this repo is

A static digital wedding invitation (**Spanish UI, `lang="es"`**) for *Karina & Gerardo*, built by
combining the best parts of three reference projects and using the **assets (photos, icons, audio)
and fonts from `../invitacionk-g`**. Plain HTML + CSS + vanilla JS + Bootstrap 5 (CDN):

- **No build step, no package manager, no tests, no lint.** There is no `package.json`.
- To preview: open `index.html` directly or serve the folder (VS Code **Live Server**,
  `python -m http.server`). Verify changes manually in a browser.

## Design concept: «Fuego cálido: día y noche»

Fire is the couple's own metaphor for their love, so the whole palette is ember-driven:

- **Día** (light) = ivory paper (`--papel`), espresso ink (`--tinta`), ember copper (`--ember`).
- **Noche** (dark) = candlelit night: near-black warm browns, brighter ember.

Both themes are driven **only** by CSS custom properties: the `:root` block in `styles.css` (day)
and the `html.dark-mode` block in `darkMode.css` (night). Never hard-code a colour in a rule —
add/override a token instead, in both files.

## Structure

```
index.html        # All invitation content (single page, sections commented ES: 1–14)
styles.css        # Day theme tokens + layout/component styles (Montserrat + @font-face Erstoria/Kalista)
darkMode.css      # Night theme tokens + the theme-switch control
script.js         # Countdown, music, scroll reveal, guest personalization, gallery/lightbox, copy bank data
darkMode.js       # Theme-switch handler (toggles the class on <html>)
assets/           # Copied verbatim from invitacionk-g (photos, icons, audio)
assets/photos/opt/# Optimized JPEG derivatives — what index.html actually loads (see below)
fonts/            # Erstoria.woff2, Kalista Script Regular .woff2/.woff (copied from invitacionk-g)
```

- `.reveal` sections animate in via `IntersectionObserver` (adds `.visible`).
- The gallery (§13, the last section before the footer) is **carousel + grid + lightbox**: Bootstrap's `.carousel` (`#galeria`) shows 7
  featured photos, `.galeria-rejilla` shows the other 6, and a `<dialog id="lightbox">` opens any of
  the 13 full-size on click. The carousel preloads its slides when the section nears the viewport
  (`script.js` §8.b) — hidden slides are never lazily loaded by the browser.

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
  *and* appears as text ("01 de noviembre de 2027") in the welcome modal, the hero, the countdown
  band and the footer of `index.html`. Keep them in sync. After the date passes, the countdown area
  shows a fixed "thanks" message (see `actualizarCuenta()`).
- **Guest count** is read from `?invitados=N` and written into `#numero` in the RSVP section
  (defaults to "un lugar").
- **RSVP** posts to FormSubmit.co whose destination email is hardcoded in the form `action`
  in `index.html`. First submission triggers a confirmation step.
- **Bank-transfer data** (account + recipient name) lives in the single constant `DATOS_BANCARIOS`
  in `script.js`; `copyInfo()` paints it into `[data-banco-cuenta]`/`[data-banco-titular]`.
- Couple names, venue links, gift registry and hotel links are inline `href`/`h1` values in
  `index.html`.

## Gotchas

- **Asset availability is source-of-truth.** The k-g asset set does *not* contain every numbered
  photo: `foto15.jpg`, `foto17.jpg`, `foto18.jpg` do not exist. Used today: `foto1` (hero),
  `foto2/4/6/10/13/16/19` (carousel), `foto3/5/8/11/12/14` (grid), `foto7` (RSVP side), `foto9`
  (countdown band), `foto20` (modal arch), `backgrond3` (modal background). Verify the filename
  against `assets/photos/` before adding a photo, and match case exactly — case matters on GitHub
  Pages/Linux.
- **`index.html` loads the optimized derivatives in `assets/photos/opt/`, never the originals in
  `assets/photos/`.** Each photo has two widths (900/1800 for `foto2`–`foto8`, `foto10`–`foto14`,
  `foto16`, `foto19`; 700/1400 for `foto20`; 900/1280 for `foto9`; 1400/2400 for `backgrond3`;
  900/1800 for `foto1`) declared with `srcset` + `sizes`. If you replace a source photo you **must**
  regenerate its derivatives with matching names/widths, or the `srcset` will 404. Do not "fix" a
  broken image by pointing back at the original — keep the derivative pipeline.
- **The hero framing is tuned to `foto1`'s content.** `foto1` is portrait (2048×3072) but the PC
  hero is a wide `object-fit: cover` band, so only a slice of its height shows. The couple sits at
  ~49–72 % of the photo's height (faces ~51–58 %), hence `.hero-img { object-position: 50% 62% }`:
  that keeps them whole from 1280 px to 2560 px wide. On phones there is no vertical crop (the
  overflow is horizontal), so the value has no effect there. Swapping `foto1` for a different shot
  means re-tuning that percentage.
- **Background music cannot autoplay** in browsers; it is started by the INGRESAR button and the
  floating music button (`reproducirMusica()`/`pausarMusica()` in `script.js`). Keep the gesture.
- **The theme class lives on `<html>`, not `<body>`** — the inline `<head>` script in `index.html`
  applies it before first paint (no flash), reading/remembering `localStorage` key `kg-tema`, and
  falling back to `prefers-color-scheme`. `darkMode.js` only handles the switch clicks;
  `darkMode.css` holds every `html.dark-mode` override.
- **Icons are `<img class="ico">` tinted by a CSS `filter: var(--filtro-ico)` — not CSS masks.**
  Chrome blocks `mask-image` on `file://`, so masks were abandoned. `--filtro-ico` begins with
  `brightness(0)`, which makes the source pixel colour irrelevant, so any monochrome PNG icons will
  do. The chain is defined twice (light in `styles.css`, dark in `darkMode.css`) and must stay in
  sync with the `--ember` tokens of each theme.
- The `.carousel` class name belongs to Bootstrap; the gallery `<section>` uses `.galeria` and its
  id is `galeria-seccion` (the carousel keeps `#galeria`) — keep it that way.
- **The vertical itinerary (≤900 px) turns the rail 90° and centres it.** The rail (`.timeline::before/::after`)
  becomes a 1 px line at `left: calc(50% - 0.5px)` with a `180deg` gradient, and each `.event` stacks like
  on desktop (icon, time, label, all centred). The line would otherwise cross the text, so `.time`/`.label`
  are painted on `background-color: var(--paper)` with `z-index: 1` (the icon already did the same with its
  `box-shadow` ring). If that section ever gets a background other than `--paper`, the veil will show as a
  rectangle. `--riel-y` is now only the *desktop* rail's `top` offset.
- Keep all user-facing copy in **Spanish**, including new sections.
