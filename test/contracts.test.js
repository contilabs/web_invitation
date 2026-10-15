// Prueba de contratos (T23, RF-3, RF-5): vigila que el renombrado de la spec 003 no toque lo
// que ya está publicado o compartido (§9 del plan). No prueba lógica de la invitación: lee los
// archivos como texto y afirma que los contratos siguen ahí. Si alguien renombra «de paso» una
// clave, un ancla o un `name`, esta prueba lo frena.
import { readFileSync, readdirSync } from "node:fs";
import { strict as assert } from "node:assert";
import test from "node:test";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");

// Todo el código de `src/` (sin pruebas) como un solo texto, para buscar anclas y contratos
// que viven repartidos entre componentes.
const root = new URL("../src/", import.meta.url);
const files = readdirSync(root, { recursive: true })
  .map((path) => path.split(/[\\/]/).join("/"))
  .filter((path) => /\.(js|jsx)$/.test(path) && !/\.test\.js$/.test(path));
const code = files
  .map((relative) => readFileSync(new URL(relative, root), "utf8"))
  .join("\n");

test("el tema conserva la clave, los valores y el intercambio de atributos", () => {
  const theme = read("../src/constants/theme.js");
  assert.match(theme, /THEME_STORAGE_KEY = "kg-tema"/, "cambió la clave de almacenamiento");
  assert.match(theme, /THEME_DAY = "dia"/, "cambió el valor de día");
  assert.match(theme, /THEME_NIGHT = "noche"/, "cambió el valor de noche");

  const html = read("../index.html");
  assert.match(html, /localStorage\.getItem\("kg-tema"\)/, "el shell no lee kg-tema");
  assert.match(html, /classList\.add\("dark-mode"\)/, "el shell no aplica dark-mode");
  assert.match(html, /dataset\.tema/, "el shell no publica data-tema");

  assert.match(code, /classList\.toggle\("dark-mode"/, "useTheme no aplica dark-mode");
  assert.match(code, /dataset\.tema = theme/, "useTheme no publica data-tema");
});

test("las anclas publicadas siguen con el mismo id en español", () => {
  const anchors = [
    "inicio",
    "fecha",
    "cita",
    "historia",
    "lugares",
    "itinerario",
    "galeria",
    "galeria-seccion",
    "confirmar",
    "regalos",
    "restricciones",
    "hospedaje",
    "cuenta-regresiva",
  ];
  for (const anchor of anchors) {
    assert.ok(code.includes(`id="${anchor}"`), `falta el ancla #${anchor}`);
  }
  assert.match(read("../index.html"), /id="root"/, "falta el punto de montaje #root");
});

test("el código de enlace sigue aceptando los mismos parámetros", () => {
  const invitation = read("../src/utils/invitation.js");
  assert.match(invitation, /\["codigo", "code", "inv"\]/, "cambiaron los parámetros del enlace");
});

test("la confirmación conserva el destino y los name del envío", () => {
  const rsvp = read("../src/components/sections/Rsvp.jsx");
  for (const field of [
    "_subject",
    "asistencia",
    "nombre",
    "acompanante",
    "asistentes",
    "alergias",
    "mensaje",
  ]) {
    assert.ok(rsvp.includes(`name="${field}"`), `falta el campo «${field}» del formulario`);
  }
  assert.match(code, /enlaces\?\.rsvp/, "la confirmación ya no lee el destino del registro");
});

test("el registro y las fichas conservan sus claves y sus valores de tipo", () => {
  const registry = read("../src/data/wedding.js");
  for (const key of [
    "plantilla:",
    "pareja:",
    "evento:",
    "confirmacion:",
    "marca:",
    "ajustes:",
    "galeria:",
    "regalos:",
  ]) {
    assert.ok(registry.includes(key), `falta la clave «${key}» en el registro`);
  }
  assert.match(registry, /plantilla: "clasica"/, "cambió el id de la plantilla del registro");

  const cards = read("../src/data/guest-cards.js");
  for (const key of ["codigo:", "tipo:", "lugaresReservados:", "guestName:", "partnerName:"]) {
    assert.ok(cards.includes(key), `falta la clave «${key}» en las fichas`);
  }
  for (const type of ['"personalizada"', '"reutilizable"', '"generica"']) {
    assert.ok(cards.includes(type), `falta el tipo de invitación ${type}`);
  }
});

test("los recursos publicados siguen en su ruta", () => {
  const html = read("../index.html");
  assert.match(html, /assets\/photos\/opt\/[\w.-]+\.jpg/, "cambió el og:image");
  assert.match(html, /assets\/icons\/sello\.png/, "cambió el favicon");
  assert.match(html, /\/src\/app\/main\.jsx/, "cambió el entry del shell");
  assert.match(html, /\/src\/templates\/classic\/classic\.css/, "cambió el CSS de la plantilla");
  assert.match(html, /\/src\/templates\/classic\/classic-dark\.css/, "cambió el CSS de noche");

  assert.match(code, /assets\/audio\.mp3/, "el audio ya no entra por el código");
  assert.match(
    read("../src/services/photos.js"),
    /assets\/photos\/opt\//,
    "la resolución de fotos ya no lee de opt/",
  );
  assert.match(code, /assets\/icons\//, "los iconos de la plantilla cambiaron de ruta");
});
