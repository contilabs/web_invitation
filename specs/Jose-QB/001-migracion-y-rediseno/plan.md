# Plan técnico — Spec 001: Migración a React y rediseño

- **Spec:** `spec.md`
- **Constitución:** `docs/constitution.md`
- **Naturaleza:** plan (sí puede nombrar stack, archivos y arquitectura; la spec no).

## 0. Enfoque

Migrar la invitación (hoy estática, con Bootstrap 5 por CDN usado solo para el carrusel) a
una app **React con build (Vite)**, sin otras dependencias ni librerías, y sin herramientas
de test que instalar. Se **reutilizan** los tokens CSS y las imágenes optimizadas actuales.
La lógica se aísla en **módulos puros** (sin React y sin DOM) para poder probarla con el
runner integrado de Node.

## 1. Alineación con la constitución

| Principio | Cómo se cumple en este plan |
| --- | --- |
| 1. Stack React + Vite, sin otras dependencias | React es el runtime y Vite el build. **No se añade ninguna librería**: se retira Bootstrap y el carrusel/visor se reimplementan en React. |
| 2. Spec = código | El plan deriva de la spec; los datos del evento quedan en un **único** módulo (RNF-8). _La redacción literal del principio («HTML y su constante en JS») queda obsoleta tras la migración; ver `PENDING_TASKS.md`._ |
| 3. Interfaz separada de lógica | Lógica en `src/logica/*.js` (pura, sin React); interfaz en `src/componentes/*.jsx`. Los colores siguen en variables CSS. _La mención literal a `index.html` queda obsoleta; ver `PENDING_TASKS.md`._ |
| 4. Tests sin instalar nada | Se usa **`node --test`**, el runner integrado de Node: no se instala nada. La UI se verifica a mano. |
| 5. Datos del usuario a salvo | Lo único persistido sigue siendo el tema (`localStorage["kg-tema"]`). Sin terceros nuevos. |
| 6. Idioma | Identificadores, textos y comentarios en español; los comentarios explican el porqué. |

## 2. Archivos: qué se crea o se modifica

### Se modifican

- `index.html` — pasa a ser el punto de entrada de Vite: shell con `<div id="root">`, metas,
  fuentes y el **script anti-parpadeo del tema** en `<head>`. _RF-4, RNF-6, RNF-5._
- `styles.css` / `darkMode.css` — se conservan los tokens y estilos; se retiran las clases y
  estructuras exclusivas de Bootstrap. _RF-11, RNF-1, RNF-2._
- `package.json` — scripts `dev`, `build`, `preview`, `test` (`node --test`) y `"type": "module"`. _Soporte._
- `README.md` / `AGENTS.md` — actualizar el arranque (ahora hay build) y vaciar los puntos de sincronía obsoletos. _Documentación._
- `script.js` / `darkMode.js` — **se eliminan** al migrar; su comportamiento se reparte en la nueva estructura.

### Se crean

- `vite.config.js` — configuración del build y `base` para conservar la URL publicada (subruta de GitHub Pages). _RNF-6._
- `src/main.jsx` — monta React y fija el tema inicial antes de pintar. _RF-4._
- `src/App.jsx` — compone las secciones en orden (portada → secciones → confirmación → regalos → galería). _RF-1, RF-2, RF-6._

**Lógica pura — `src/logica/` (sin React, sin DOM, sin `Date.now()` interno):**

| Archivo | Responsabilidad | RF |
| --- | --- | --- |
| `datosEvento.js` | Único origen de fecha/hora, cuenta bancaria, titular y enlaces del evento. | RF-2, RF-3, RF-10 · RNF-8 |
| `cuentaRegresiva.js` | Cálculo del tiempo restante. | RF-3 |
| `invitados.js` | Lectura y validación de `?invitados` y formato de «lugares». | RF-9 |
| `galeria.js` | Salto circular de índices, total y elección de variante de imagen. | RF-7 |
| `tema.js` | Resolución y persistencia del tema. | RF-4 |
| `musica.js` | Estado siguiente y etiquetas accesibles de la música. | RF-5 |
| `etiquetas.js` | Textos de interfaz/aria en español. | RF-4, RF-5 |

**Pegamento con estado — `src/hooks/` (no puro):**
`useCuentaRegresiva.js` (RF-3) · `useInvitados.js` (RF-9) · `useTema.js` (RF-4) ·
`useMusica.js` (RF-5) · `useEncabezado.js` (RF-6) · `useReveal.js` (RF-6) · `useGaleria.js` (RF-7).

**Interfaz — `src/componentes/`:**
`Portada.jsx` (RF-1, RF-6) · `Encabezado.jsx` (RF-6) · `Secciones.jsx`: ceremonia, recepción,
ubicaciones, hoteles (RF-2, RF-8 enlaces) · `CuentaRegresiva.jsx` (RF-3) ·
`Galeria.jsx` + `Visor.jsx` (RF-7) · `Confirmacion.jsx` (RSVP, RF-8) ·
`MesaDeRegalos.jsx` + `BotonCopiar.jsx` (RF-10) · `ControlTema.jsx` (RF-4) ·
`ControlMusica.jsx` (RF-5).

**Pruebas:** `src/logica/*.test.js` (ver sección 4).

## 3. Funciones puras de lógica

Todas deterministas, sin DOM y sin leer el reloj por dentro (el «ahora» y el «sistema» entran
como parámetros).

| Función | Firma | Qué devuelve | RF |
| --- | --- | --- | --- |
| `calcularRestante` | `(fechaObjetivoMs, ahoraMs)` | `{ dias, horas, minutos, segundos, terminado }` | RF-3 |
| `leerInvitados` | `(parametro)` | `{ valido, cantidad }` | RF-9 |
| `formatearLugares` | `(valido, cantidad)` | `"un lugar"` · `"1 lugar"` · `"N lugares"` | RF-9 |
| `siguienteIndice` | `(actual, total, paso)` | índice con salto circular | RF-7 |
| `elegirVariante` | `(srcset, anchoObjetivo)` | URL de la variante optimizada más cercana al objetivo; si no hay, la mayor; nunca el original | RF-7 |
| `resolverTema` | `(guardado, prefiereOscuro)` | `"dia"` · `"noche"` | RF-4 |
| `siguienteEstadoMusica` | `(sonando)` | booleano | RF-5 |
| `etiquetaTema` / `etiquetaMusica` | `(estado)` | cadena en español (texto/aria) | RF-4, RF-5 |

Nota: `elegirVariante` implementa el «punto medio» de RF-7 — las variantes optimizadas
existentes son 900/1800 px (y casos 700/1400 y 900/1280), sin original de cámara en el
`srcset`; se elige la más cercana a un `anchoObjetivo` (p. ej. 1400).

## 4. Estrategia de tests con `node --test`

- **Qué se prueba:** solo las funciones puras de `src/logica/` (son `.js` sin JSX, Node las
  ejecuta directamente). Los componentes y efectos no se prueban aquí: se verifican a mano.
- **Cómo:** `package.json` con `"test": "node --test"`. Sin instalar nada (runner integrado)
  → respeta el principio 4.
- **Casos por RF:**
  - RF-3: fecha futura, fecha ya pasada (`terminado`), segundo exacto, cambio de día.
  - RF-9: ausente, `""`, `"1"`, `"2"`, `"3"`, `"0"`, `"-1"`, `"abc"`, `"2.5"`, `" 3"`, `"999999"`.
  - RF-7: salto circular adelante/atrás y extremos; total 0 y 1; elección de variante.
  - RF-4: guardado válido, guardado inválido, sin guardado + sistema claro/oscuro.
  - RF-5 y etiquetas: alternancia y cadenas en español.
- **Documentación:** anotar en la sección «Verificación» de `AGENTS.md` el comando y lo que
  queda como verificación manual (UI, audio, portapapeles, envío del RSVP).

## 5. Cobertura de requisitos (RF ↔ partes)

| RF | Dónde se resuelve | Prueba |
| --- | --- | --- |
| RF-1 Portada | `Portada.jsx`, `App.jsx` | manual |
| RF-2 Contenido | `Secciones.jsx`, `datosEvento.js` | manual |
| RF-3 Cuenta regresiva | `cuentaRegresiva.js`, `useCuentaRegresiva.js`, `CuentaRegresiva.jsx` | `node --test` |
| RF-4 Tema | `tema.js`, `useTema.js`, `ControlTema.jsx`, `main.jsx`, script en `index.html` | `node --test` |
| RF-5 Música | `musica.js`, `useMusica.js`, `ControlMusica.jsx` | `node --test` + manual (audio) |
| RF-6 Navegación/aparición | `useEncabezado.js`, `useReveal.js`, `Encabezado.jsx` | manual |
| RF-7 Galería | `galeria.js`, `useGaleria.js`, `Galeria.jsx`, `Visor.jsx` | `node --test` + manual |
| RF-8 RSVP | `Confirmacion.jsx` | manual (envío externo) |
| RF-9 Invitados | `invitados.js`, `useInvitados.js` | `node --test` |
| RF-10 Regalos | `datosEvento.js`, `MesaDeRegalos.jsx`, `BotonCopiar.jsx` | manual (portapapeles) |
| RF-11 Rediseño | `styles.css`, `darkMode.css`, componentes | manual |

## 6. Decisiones técnicas (y alternativa descartada)

1. **JavaScript con JSX (sin TypeScript).** _Descartado:_ TypeScript — añade configuración y
   una herramienta más; no aporta con la constitución (P1/P4).
2. **Sin Bootstrap.** El carrusel/visor se reimplementan en React. _Descartado:_ mantener el
   carrusel de Bootstrap — es una dependencia ajena al stack y mezclaría JS imperativo con
   React.
3. **Lógica pura separada de los hooks.** _Descartado:_ meter todo en hooks/componentes —
   no sería testeable sin DOM y rompería el principio 3.
4. **El «ahora» es parámetro, no `Date.now()` interno.** _Descartado:_ leer el reloj dentro
   de la función — resultados no deterministas y no testables.
5. **`node --test` en vez de Jest/Vitest.** _Descartado:_ Jest/Vitest — hay que instalarlos
   (P4).
6. **Datos del evento en un único módulo.** _Descartado:_ datos repartidos por componente —
   rompe RNF-8 y el principio 2.
7. **CSS existente con variables, sin CSS-in-JS.** _Descartado:_ styled-components — una
   librería extra (P1) e inlining de colores que P3 prohíbe.
8. **Tema sin parpadeo.** Script mínimo en `<head>` + resolución en `main.jsx` antes del
   primer render. _Descartado:_ aplicar el tema en `useEffect` — provoca flash (RF-4).
9. **Sin router.** `?invitados=N` se lee con `URLSearchParams`. _Descartado:_ React Router —
   dependencia innecesaria, solo hay una vista (P1, RNF-6).
10. **`<audio loop>` con arranque por gesto.** _Descartado:_ Web Audio API — complejidad
    innecesaria para RF-5.

## 7. Riesgos y pendientes

- **Constitución desactualizada:** los principios 2 y 3 siguen describiendo el stack estático.
  Actualizarlos antes o durante la implementación (ya en `PENDING_TASKS.md`).
- **Retirar Bootstrap:** hay que reproducir fielmente el carrusel (avance, controles, pausa)
  para no romper RF-7.
- **`base` de Vite:** confirmar la URL real de publicación para no romper los enlaces ya
  repartidos (RNF-6).
- **Casos límite pendientes** (audio que falla, RSVP sin red, imagen que no carga, etc.):
  viven en `PENDING_TASKS.md` y se cubrirán en iteraciones posteriores.
