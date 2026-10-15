// Prueba de andamiaje (T2): vigila que el proyecto siga siendo ESM y que los scripts
// base y el shell de Vite sigan en su sitio. No prueba lógica de la invitación: eso
// vive en `src/utils/*.test.js` (T6–T11).
import { readFileSync, readdirSync } from "node:fs";
import { strict as assert } from "node:assert";
import test from "node:test";

const leer = (ruta) => readFileSync(new URL(ruta, import.meta.url), "utf8");
const paquete = JSON.parse(leer("../package.json"));

test("el paquete se ejecuta como ESM", () => {
  assert.equal(paquete.type, "module");
});

test("existen los scripts base", () => {
  for (const script of ["dev", "build", "preview", "test"]) {
    assert.equal(
      typeof paquete.scripts?.[script],
      "string",
      `falta el script «${script}»`,
    );
  }
});

test("las pruebas usan el runner integrado de Node", () => {
  assert.equal(paquete.scripts.test, "node --test");
});

test("index.html monta la app de React", () => {
  const html = leer("../index.html");
  assert.match(html, /id="root"/);
  assert.match(html, /src="\/src\/app\/main\.jsx"/);
});

// El script del <head> resuelve el tema antes de pintar (RF-4): si se mueve detrás del
// CSS o pierde la clave, vuelve el parpadeo del tema contrario al recargar.
test("el tema se resuelve en el <head> antes de cualquier estilo", () => {
  const html = leer("../index.html");
  const head = html.slice(html.indexOf("<head>"), html.indexOf("</head>"));

  assert.match(head, /localStorage\.getItem\("kg-tema"\)/, "el script no lee kg-tema");
  assert.match(head, /classList\.add\("dark-mode"\)/, "el script no aplica dark-mode");

  const script = head.indexOf("kg-tema");
  const primerEstilo = head.indexOf("<link rel=\"stylesheet\"");
  assert.ok(primerEstilo > -1, "no hay hojas de estilo en el <head>");
  assert.ok(
    script < primerEstilo,
    "el script del tema tiene que ir antes de las hojas de estilo",
  );
});

test("sin JavaScript se avisa en español", () => {
  const html = leer("../index.html");
  assert.match(html, /<noscript>[\s\S]*JavaScript[\s\S]*<\/noscript>/);
});

// T25: el punto de referencia principal y el enlace para saltar a él.
test("la app ofrece un enlace para saltar al contenido dentro de <main>", () => {
  const app = leer("../src/app/App.jsx");
  assert.match(app, /<main\b/, "no hay <main> en App.jsx");
  assert.match(app, /<SkipLink\s*\/>/, "App no pinta el enlace «saltar al contenido»");

  const salto = leer("../src/components/layout/SkipLink.jsx");
  assert.match(salto, /className="skip-link"/, "no hay enlace «saltar al contenido»");
  assert.match(salto, /href="#inicio"/, "el enlace de salto no apunta al inicio");
});

// T5: Bootstrap se retiró del CSS y del shell. Se vigila que no vuelva a colarse
// (ni la librería ni sus clases), porque ya no se carga ninguna hoja suya.
test("no queda ninguna referencia a Bootstrap", () => {
  const cosas = [/bootstrap/i, /carousel/i, /data-bs/i, /--bs-/i];
  for (const archivo of [
    "../src/templates/classic/classic.css",
    "../src/templates/classic/classic-dark.css",
    "../index.html",
  ]) {
    const texto = leer(archivo);
    for (const cosa of cosas) {
      assert.doesNotMatch(texto, cosa, `${archivo} menciona «${cosa.source}»`);
    }
  }

  const dependencias = { ...paquete.dependencies, ...paquete.devDependencies };
  for (const nombre of Object.keys(dependencias ?? {})) {
    assert.doesNotMatch(nombre, /bootstrap/i, `package.json depende de «${nombre}»`);
  }
});

// T30 (RF-16): `?invitados=N` se retiró en favor del código de enlace. Se vigila que no
// vuelva a leerse desde el código (los comentarios pueden mencionarlo como referencia).
test("la invitación ya no lee el parámetro ?invitados=N", () => {
  const raiz = new URL("../src/", import.meta.url);
  const archivos = readdirSync(raiz, { recursive: true })
    .map((ruta) => ruta.split(/[\\/]/).join("/"))
    .filter((ruta) => /\.(js|jsx)$/.test(ruta) && !/\.test\.js$/.test(ruta));

  for (const relativo of archivos) {
    const texto = readFileSync(new URL(relativo, raiz), "utf8");
    const codigo = texto
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/\/\/[^\n]*/g, "");
    assert.doesNotMatch(
      codigo,
      /\?invitados/,
      `src/${relativo} todavía lee el parámetro ?invitados=N`,
    );
  }
});

// T26: las fotos solo pueden venir de las variantes optimizadas de `opt/`. Se vigila
// que ningún archivo de `src/` referencie `assets/photos/` sin pasar por `opt/` (el
// original de cámara no se copia al build y pesa de más).
test("ninguna foto se carga desde el original sin optimizar", () => {
  const raiz = new URL("../src/", import.meta.url);
  const archivos = readdirSync(raiz, { recursive: true })
    .map((ruta) => ruta.split(/[\\/]/).join("/"))
    .filter((ruta) => /\.(js|jsx)$/.test(ruta) && !/\.test\.js$/.test(ruta));

  assert.ok(archivos.length > 0, "no se encontraron fuentes en src/");

  for (const relativo of archivos) {
    const texto = readFileSync(new URL(relativo, raiz), "utf8");
    // Se ignoran los comentarios: alguno menciona `assets/photos/` a propósito.
    const codigo = texto
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/\/\/[^\n]*/g, "");
    assert.doesNotMatch(
      codigo,
      /assets\/photos\/(?!opt\/)/,
      `src/${relativo} usa el original de assets/photos/ en vez de opt/`,
    );
  }
});
