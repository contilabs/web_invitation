// Prueba de andamiaje (T2): vigila que el proyecto siga siendo ESM y que los scripts
// base y el shell de Vite sigan en su sitio. No prueba lógica de la invitación: eso
// vive en `src/utils/*.test.js` (T6–T11).
import { readFileSync, readdirSync } from "node:fs";
import { strict as assert } from "node:assert";
import test from "node:test";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");
const pkg = JSON.parse(read("../package.json"));

test("el paquete se ejecuta como ESM", () => {
  assert.equal(pkg.type, "module");
});

test("existen los scripts base", () => {
  for (const script of ["dev", "build", "preview", "test"]) {
    assert.equal(
      typeof pkg.scripts?.[script],
      "string",
      `falta el script «${script}»`,
    );
  }
});

test("las pruebas usan el runner integrado de Node", () => {
  assert.equal(pkg.scripts.test, "node scripts/safe-check.mjs test");
});

test("index.html monta la app de React y carga los CSS de la plantilla", () => {
  const html = read("../index.html");
  assert.match(html, /id="root"/);
  assert.match(html, /src="\/src\/app\/main\.jsx"/);
  assert.match(html, /href="\/src\/templates\/classic\/classic\.css"/);
  assert.match(html, /href="\/src\/templates\/classic\/classic-dark\.css"/);
});

// El script del <head> resuelve el tema antes de pintar (RF-4): si se mueve detrás del
// CSS o pierde la clave, vuelve el parpadeo del tema contrario al recargar.
test("el tema se resuelve en el <head> antes de cualquier estilo", () => {
  const html = read("../index.html");
  const head = html.slice(html.indexOf("<head>"), html.indexOf("</head>"));

  assert.match(head, /localStorage\.getItem\("kg-tema"\)/, "el script no lee kg-tema");
  assert.match(head, /classList\.add\("dark-mode"\)/, "el script no aplica dark-mode");

  const script = head.indexOf("kg-tema");
  const firstStylesheet = head.indexOf("<link rel=\"stylesheet\"");
  assert.ok(firstStylesheet > -1, "no hay hojas de estilo en el <head>");
  assert.ok(
    script < firstStylesheet,
    "el script del tema tiene que ir antes de las hojas de estilo",
  );
});

test("sin JavaScript se avisa en español", () => {
  const html = read("../index.html");
  assert.match(html, /<noscript>[\s\S]*JavaScript[\s\S]*<\/noscript>/);
});

// T25: el punto de referencia principal y el enlace para saltar a él.
test("la app ofrece un enlace para saltar al contenido dentro de <main>", () => {
  const app = read("../src/app/App.jsx");
  assert.match(app, /<main\b/, "no hay <main> en App.jsx");
  assert.match(app, /<SkipLink\s*\/>/, "App no pinta el enlace «saltar al contenido»");

  const skipLink = read("../src/components/layout/SkipLink.jsx");
  assert.match(skipLink, /className="skip-link"/, "no hay enlace «saltar al contenido»");
  assert.match(skipLink, /href="#inicio"/, "el enlace de salto no apunta al inicio");
});

// T5: Bootstrap se retiró del CSS y del shell. Se vigila que no vuelva a colarse
// (ni la librería ni sus clases), porque ya no se carga ninguna hoja suya.
test("no queda ninguna referencia a Bootstrap", () => {
  const patterns = [/bootstrap/i, /carousel/i, /data-bs/i, /--bs-/i];
  for (const file of [
    "../src/templates/classic/classic.css",
    "../src/templates/classic/classic-dark.css",
    "../index.html",
  ]) {
    const text = read(file);
    for (const pattern of patterns) {
      assert.doesNotMatch(text, pattern, `${file} menciona «${pattern.source}»`);
    }
  }

  const dependencies = { ...pkg.dependencies, ...pkg.devDependencies };
  for (const name of Object.keys(dependencies ?? {})) {
    assert.doesNotMatch(name, /bootstrap/i, `package.json depende de «${name}»`);
  }
});

// T30 (RF-16): `?invitados=N` se retiró en favor del código de enlace. Se vigila que no
// vuelva a leerse desde el código (los comentarios pueden mencionarlo como referencia).
test("la invitación ya no lee el parámetro ?invitados=N", () => {
  const root = new URL("../src/", import.meta.url);
  const files = readdirSync(root, { recursive: true })
    .map((path) => path.split(/[\\/]/).join("/"))
    .filter((path) => /\.(js|jsx)$/.test(path) && !/\.test\.js$/.test(path));

  for (const relative of files) {
    const text = readFileSync(new URL(relative, root), "utf8");
    const code = text
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/\/\/[^\n]*/g, "");
    assert.doesNotMatch(
      code,
      /\?invitados/,
      `src/${relative} todavía lee el parámetro ?invitados=N`,
    );
  }
});

// T26: las fotos solo pueden venir de las variantes optimizadas de `opt/`. Se vigila
// que ningún archivo de `src/` referencie `assets/photos/` sin pasar por `opt/` (el
// original de cámara no se copia al build y pesa de más).
test("ninguna foto se carga desde el original sin optimizar", () => {
  const root = new URL("../src/", import.meta.url);
  const files = readdirSync(root, { recursive: true })
    .map((path) => path.split(/[\\/]/).join("/"))
    .filter((path) => /\.(js|jsx)$/.test(path) && !/\.test\.js$/.test(path));

  assert.ok(files.length > 0, "no se encontraron fuentes en src/");

  for (const relative of files) {
    const text = readFileSync(new URL(relative, root), "utf8");
    // Se ignoran los comentarios: alguno menciona `assets/photos/` a propósito.
    const code = text
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/\/\/[^\n]*/g, "");
    assert.doesNotMatch(
      code,
      /assets\/photos\/(?!opt\/)/,
      `src/${relative} usa el original de assets/photos/ en vez de opt/`,
    );
  }
});
