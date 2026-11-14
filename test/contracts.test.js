// Prueba de contratos (T8, RF-2, RF-14; spec 004, §9): vigila que lo que ya está publicado o
// compartido siga estable y que el modelo del servicio no vuelva atrás. No prueba lógica de la
// invitación: lee los archivos como texto y afirma que los contratos siguen ahí. Si alguien
// renombra «de paso» una clave o un ancla, reintroduce un parámetro jubilado del enlace o
// devuelve la confirmación a FormSubmit, esta prueba lo frena.
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
    "numero",
  ];
  for (const anchor of anchors) {
    assert.ok(code.includes(`id="${anchor}"`), `falta el ancla #${anchor}`);
  }
  assert.match(read("../index.html"), /id="root"/, "falta el punto de montaje #root");
});

test("el enlace identifica la invitación con el parámetro `guest`", () => {
  const contract = read("../src/constants/contract.js");
  assert.match(contract, /GUEST_PARAM = "guest"/, "cambió el parámetro del enlace");

  const invitation = read("../src/utils/invitation.js");
  assert.match(invitation, /GUEST_PARAM/, "la invitación no lee el parámetro del contrato");
});

test("los parámetros jubilados del enlace no vuelven", () => {
  const invitation = read("../src/utils/invitation.js");
  for (const retired of ["codigo", "code", "inv"]) {
    assert.ok(
      !invitation.includes(`"${retired}"`),
      `volvió el parámetro jubilado «${retired}» (RF-2)`,
    );
  }
});

test("la confirmación ya no usa FormSubmit ni lee el destino del registro", () => {
  assert.doesNotMatch(
    code,
    /enlaces\?\.rsvp/,
    "la confirmación volvió a leer el destino del registro (RF-14)",
  );
  assert.doesNotMatch(code, /formsubmit/i, "volvió el destino FormSubmit (RF-14)");

  const rsvp = read("../src/components/sections/Rsvp.jsx");
  assert.match(rsvp, /useRsvp/, "la confirmación ya no envía por el servicio");
});

test("el registro conserva sus claves y su plantilla, sin el plazo ni el envío", () => {
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
  assert.doesNotMatch(registry, /\bfechaLimite\b/, "volvió el plazo al registro (RF-11)");
  assert.doesNotMatch(registry, /\brsvp\b/, "volvió el destino del envío al registro (RF-14)");
});

test("los recursos publicados siguen en su ruta", () => {
  const html = read("../index.html");
  assert.match(html, /assets\/photos\/opt\/[\w.-]+\.jpg/, "cambió el og:image");
  assert.match(html, /assets\/icons\/wax-seal\.ico/, "falta el favicon actualizado");
  assert.doesNotMatch(html, /assets\/icons\/sello\.png/, "volvió la referencia al favicon anterior");
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

test("el título del documento y el de compartir muestran Naomi y Andrés", () => {
  const html = read("../index.html");
  assert.match(html, /<title>Naomi &amp; Andrés<\/title>/);
  assert.match(html, /property="og:title" content="Naomi &amp; Andrés"/);
  assert.equal((html.match(/rel="icon"/g) ?? []).length, 1);
  const icon = readFileSync(new URL("../assets/icons/wax-seal.ico", import.meta.url));
  assert.equal(icon.readUInt16LE(0), 0);
  assert.equal(icon.readUInt16LE(2), 1);
  assert.equal(icon.readUInt16LE(4), 1);
  assert.equal(icon[6], 0, "el icono conserva su ancho de 256 píxeles");
  assert.equal(icon[7], 0, "el icono conserva su alto de 256 píxeles");
});
