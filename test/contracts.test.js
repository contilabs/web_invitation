// Prueba de contratos (T23, RF-3, RF-5): vigila que el renombrado de la spec 003 no toque lo
// que ya está publicado o compartido (§9 del plan). No prueba lógica de la invitación: lee los
// archivos como texto y afirma que los contratos siguen ahí. Si alguien renombra «de paso» una
// clave, un ancla o un `name`, esta prueba lo frena.
import { readFileSync, readdirSync } from "node:fs";
import { strict as assert } from "node:assert";
import test from "node:test";

const leer = (ruta) => readFileSync(new URL(ruta, import.meta.url), "utf8");

// Todo el código de `src/` (sin pruebas) como un solo texto, para buscar anclas y contratos
// que viven repartidos entre componentes.
const raiz = new URL("../src/", import.meta.url);
const archivos = readdirSync(raiz, { recursive: true })
  .map((ruta) => ruta.split(/[\\/]/).join("/"))
  .filter((ruta) => /\.(js|jsx)$/.test(ruta) && !/\.test\.js$/.test(ruta));
const codigo = archivos
  .map((relativo) => readFileSync(new URL(relativo, raiz), "utf8"))
  .join("\n");

test("el tema conserva la clave, los valores y el intercambio de atributos", () => {
  const tema = leer("../src/constants/theme.js");
  assert.match(tema, /THEME_STORAGE_KEY = "kg-tema"/, "cambió la clave de almacenamiento");
  assert.match(tema, /THEME_DAY = "dia"/, "cambió el valor de día");
  assert.match(tema, /THEME_NIGHT = "noche"/, "cambió el valor de noche");

  const html = leer("../index.html");
  assert.match(html, /localStorage\.getItem\("kg-tema"\)/, "el shell no lee kg-tema");
  assert.match(html, /classList\.add\("dark-mode"\)/, "el shell no aplica dark-mode");
  assert.match(html, /dataset\.tema/, "el shell no publica data-tema");

  assert.match(codigo, /classList\.toggle\("dark-mode"/, "useTheme no aplica dark-mode");
  assert.match(codigo, /dataset\.tema = theme/, "useTheme no publica data-tema");
});

test("las anclas publicadas siguen con el mismo id en español", () => {
  const anclas = [
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
  for (const ancla of anclas) {
    assert.ok(codigo.includes(`id="${ancla}"`), `falta el ancla #${ancla}`);
  }
  assert.match(leer("../index.html"), /id="root"/, "falta el punto de montaje #root");
});

test("el código de enlace sigue aceptando los mismos parámetros", () => {
  const invitacion = leer("../src/utils/invitation.js");
  assert.match(invitacion, /\["codigo", "code", "inv"\]/, "cambiaron los parámetros del enlace");
});

test("la confirmación conserva el destino y los name del envío", () => {
  const rsvp = leer("../src/components/sections/Rsvp.jsx");
  for (const campo of [
    "_subject",
    "asistencia",
    "nombre",
    "acompanante",
    "asistentes",
    "alergias",
    "mensaje",
  ]) {
    assert.ok(rsvp.includes(`name="${campo}"`), `falta el campo «${campo}» del formulario`);
  }
  assert.match(codigo, /enlaces\?\.rsvp/, "la confirmación ya no lee el destino del registro");
});

test("el registro y las fichas conservan sus claves y sus valores de tipo", () => {
  const registro = leer("../src/data/wedding.js");
  for (const clave of [
    "plantilla:",
    "pareja:",
    "evento:",
    "confirmacion:",
    "marca:",
    "ajustes:",
    "galeria:",
    "regalos:",
  ]) {
    assert.ok(registro.includes(clave), `falta la clave «${clave}» en el registro`);
  }
  assert.match(registro, /plantilla: "clasica"/, "cambió el id de la plantilla del registro");

  const fichas = leer("../src/data/guest-cards.js");
  for (const clave of ["codigo:", "tipo:", "lugaresReservados:", "guestName:", "partnerName:"]) {
    assert.ok(fichas.includes(clave), `falta la clave «${clave}» en las fichas`);
  }
  for (const tipo of ['"personalizada"', '"reutilizable"', '"generica"']) {
    assert.ok(fichas.includes(tipo), `falta el tipo de invitación ${tipo}`);
  }
});

test("los recursos publicados siguen en su ruta", () => {
  const html = leer("../index.html");
  assert.match(html, /assets\/photos\/opt\/[\w.-]+\.jpg/, "cambió el og:image");
  assert.match(html, /assets\/icons\/sello\.png/, "cambió el favicon");
  assert.match(html, /\/src\/app\/main\.jsx/, "cambió el entry del shell");
  assert.match(html, /\/src\/templates\/classic\/classic\.css/, "cambió el CSS de la plantilla");
  assert.match(html, /\/src\/templates\/classic\/classic-dark\.css/, "cambió el CSS de noche");

  assert.match(codigo, /assets\/audio\.mp3/, "el audio ya no entra por el código");
  assert.match(
    leer("../src/services/photos.js"),
    /assets\/photos\/opt\//,
    "la resolución de fotos ya no lee de opt/",
  );
  assert.match(codigo, /assets\/icons\//, "los iconos de la plantilla cambiaron de ruta");
});
