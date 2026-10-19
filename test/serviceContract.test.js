// Prueba de sincronía del contrato del servicio (T3; RF-17; RNF-10; D18, D25, D27; spec
// 005: RF-8, RNF-5, M6, I2, DT-11).
//
// `src/constants/contract.js` es la **fuente única** y `docs/servicio-invitados.md` su
// documento humano **derivado**. Esta prueba lee los archivos como texto y falla de
// verdad cuando el documento pierde un literal del módulo (hojas y columnas del modelo,
// tipos, estados, valores especiales, acciones —`lookup` incluida—, los campos del
// intercambio —los del envío, los de `resolve` y los del intercambio de `lookup`—, el
// parámetro `guest`, los 10 dígitos del teléfono y el tiempo de espera) o cuando su tabla
// de códigos de error deja de coincidir con `SERVICE_ERRORS` (mismo conjunto de códigos
// y, para cada uno, su mensaje exacto). Comprueba además que **la versión del contrato no
// pueda divergir**: `gas/Code.gs` la declara igual que el módulo (se lee el script como
// **texto**, sin ejecutarlo ni importar nada de él, DT-11). **No** comprueba `retryable`:
// es un booleano que el documento explica en prosa (spec 004 §8 y §12 del plan).
//
// Frontera de lo que esta prueba cubre (M6): vigila **literales** y la **versión**, no la
// prosa. Los nombres de campo de `lookup` se vigilan desde `LOOKUP_FIELDS` aunque hoy
// coincidan con los de `resolve`/`respond` (el intercambio reutiliza nombres): lo que
// garantiza es que el documento reproduzca **cada** literal que el módulo declara, y que
// un literal propio del intercambio nuevo (si se añade) no pueda quedarse sin documentar.
// La prosa de la sección de `lookup` (que `name` viaja dentro de `response`, que no hay
// objeto `guest` y que la consulta no escribe la hoja `guests`) se revisa a mano, como el
// resto de la documentación.
import { readFileSync } from "node:fs";
import { strict as assert } from "node:assert";
import test from "node:test";

import {
  CONTRACT_VERSION,
  GUEST_PARAM,
  GUEST_TYPES,
  MASTER_SHEET,
  GUEST_SHEET,
  GENERIC_SHEET,
  RESPONSE_STATES,
  NO_RESPONSE_STATES,
  NO_LIMIT,
  PUBLIC_CODE,
  PHONE_DIGITS,
  REQUEST_TIMEOUT_MS,
  SERVICE_ACTIONS,
  REQUEST_FIELDS,
  RESOLVE_FIELDS,
  LOOKUP_FIELDS,
  SERVICE_ERRORS,
} from "../src/constants/contract.js";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");

const moduleText = read("../src/constants/contract.js");
const documentText = read("../docs/servicio-invitados.md");
// El servicio (Apps Script), leído como **texto**: no se ejecuta ni se importa (DT-11).
const scriptText = read("../gas/Code.gs");

// Epígrafe del documento bajo el que vive la tabla de códigos de error. Todo lo que hay
// entre ese epígrafe y el siguiente nivel 2 es la tabla que se compara con el módulo.
const ERROR_TABLE_HEADING = "Tabla de códigos de error";

// Literales de texto del módulo que el documento debería reproducir al menos una vez.
// Se recogen del propio módulo (no de un listado escrito a mano) para que cambiar un
// valor en el módulo obligue a actualizar el documento.
const textLiterals = [
  ...new Set([
    ...Object.values(GUEST_TYPES),
    ...Object.values(RESPONSE_STATES),
    ...NO_RESPONSE_STATES,
    ...Object.values(SERVICE_ACTIONS),
    ...Object.values(REQUEST_FIELDS),
    ...Object.values(RESOLVE_FIELDS),
    // El intercambio de `lookup` (spec 005, RF-8): la petición y la respuesta se declaran
    // en su propio objeto, así que la prueba los vigila aunque sus nombres coincidan hoy
    // con los de `REQUEST_FIELDS`/`RESOLVE_FIELDS`.
    ...Object.values(LOOKUP_FIELDS),
    ...Object.values(MASTER_SHEET.columns),
    ...Object.values(GUEST_SHEET.columns),
    ...Object.values(GENERIC_SHEET.columns),
    MASTER_SHEET.name,
    GUEST_SHEET.name,
    GENERIC_SHEET.name,
    GUEST_PARAM,
    PUBLIC_CODE,
    NO_LIMIT,
  ]),
];

// Literales numéricos: el nombre con el que el módulo los declara y su valor.
const numericLiterals = [
  ["PHONE_DIGITS", PHONE_DIGITS],
  ["REQUEST_TIMEOUT_MS", REQUEST_TIMEOUT_MS],
];

// Versión que declara el **servicio** (`gas/Code.gs`) en el texto del script. Se busca la
// declaración literal (`const CONTRACT_VERSION = '…';`) y se falla con un mensaje claro si
// no está: sin ella no hay nada que comparar con el módulo (RF-8, DT-1, DT-11).
function scriptContractVersion() {
  const declaration = /const CONTRACT_VERSION = ['"]([^'"]+)['"];/.exec(scriptText);
  assert.ok(
    declaration,
    "gas/Code.gs no declara la versión del contrato (`const CONTRACT_VERSION = '…';`)",
  );
  return declaration[1];
}

// Extrae la tabla de códigos de error del documento: una fila por código, con la forma
// `| `CÓDIGO` | causa | mensaje |`. Las dos primeras filas (cabecera y separador) se
// saltan solas: su primera celda no tiene forma de código.
function documentErrorTable() {
  const heading = new RegExp(`^##\\s.*${ERROR_TABLE_HEADING}\\s*$`, "m").exec(documentText);
  assert.ok(
    heading,
    `el documento no tiene el epígrafe «${ERROR_TABLE_HEADING}»`,
  );

  const rest = documentText.slice(heading.index + heading[0].length);
  const end = rest.indexOf("\n## ");
  const table = end === -1 ? rest : rest.slice(0, end);

  const rows = new Map();
  for (const line of table.split("\n")) {
    if (!line.trim().startsWith("|")) continue;
    const cells = line.split("|").map((cell) => cell.trim());
    const code = (cells[1] ?? "").replace(/`/g, "");
    if (!/^[A-Z][A-Z_]*$/.test(code)) continue;
    rows.set(code, (cells[3] ?? "").replace(/^«|»$/g, "").trim());
  }
  return rows;
}

test("el módulo declara sus literales tal cual y es la fuente única", () => {
  for (const literal of textLiterals) {
    assert.ok(
      moduleText.includes(`"${literal}"`),
      `el módulo no declara el literal «${literal}»`,
    );
  }
  for (const [name, value] of numericLiterals) {
    assert.ok(
      moduleText.includes(`${name} = ${value}`),
      `el módulo no declara «${name} = ${value}»`,
    );
  }
  assert.ok(
    moduleText.includes(`CONTRACT_VERSION = "${CONTRACT_VERSION}"`),
    `el módulo no declara «CONTRACT_VERSION = "${CONTRACT_VERSION}"» como literal: la versión se sube a mano en los dos lados (DT-1)`,
  );
});

test("el servicio declara la misma versión del contrato que el módulo", () => {
  assert.equal(
    scriptContractVersion(),
    CONTRACT_VERSION,
    "la versión de `gas/Code.gs` y la del módulo no coinciden: se suben **a la vez** cuando cambia la forma de una llamada o de una respuesta (RF-8, DT-1)",
  );
});

test("la acción `lookup` sigue declarada en el módulo y documentada", () => {
  // El listado de literales se deriva del módulo: si la acción desapareciera de
  // `SERVICE_ACTIONS`, dejaría de vigilarse en silencio. Por eso se comprueba aparte.
  assert.equal(
    SERVICE_ACTIONS.LOOKUP,
    "lookup",
    "el módulo ya no declara la acción `lookup` (spec 005, RF-8): el documento y `gas/Code.gs` no pueden quedarse sin su fuente única",
  );
  assert.ok(
    documentText.includes(SERVICE_ACTIONS.LOOKUP),
    "el documento no documenta la acción `lookup` del módulo (spec 005, RF-8)",
  );
});

test("el documento reproduce cada literal del módulo", () => {
  for (const literal of textLiterals) {
    assert.ok(
      documentText.includes(literal),
      `el documento no reproduce el literal «${literal}» del módulo`,
    );
  }
  for (const [name, value] of numericLiterals) {
    assert.ok(
      documentText.includes(String(value)),
      `el documento no reproduce el valor de «${name}» (${value})`,
    );
  }
});

test("la tabla del módulo es coherente", () => {
  const codes = SERVICE_ERRORS.map((error) => error.code);
  assert.equal(
    new Set(codes).size,
    codes.length,
    "hay códigos de error repetidos en el módulo",
  );
  for (const { code, message } of SERVICE_ERRORS) {
    assert.match(code, /^[A-Z][A-Z_]*$/, `el código «${code}» no tiene la forma esperada`);
    assert.equal(typeof message, "string", `«${code}» no tiene mensaje`);
    assert.ok(message.trim().length > 0, `«${code}» tiene el mensaje vacío`);
  }
});

test("la tabla de códigos de error del documento coincide con la del módulo", () => {
  const table = documentErrorTable();
  assert.deepEqual(
    [...table.keys()],
    SERVICE_ERRORS.map((error) => error.code),
    "el documento no tiene los mismos códigos (y en el mismo orden) que el módulo",
  );

  for (const { code, message } of SERVICE_ERRORS) {
    assert.equal(
      table.get(code),
      message,
      `el mensaje de «${code}» no coincide con el del módulo`,
    );
  }
});

// El id del maestro sale de una **propiedad del script** y se lee por el **nombre** de esa
// propiedad. El 17/10 se descubrió que `readMaster_` le pasaba el **valor** (el id) a
// `getProperty`, que devuelve `null`: con cualquier maestro bien formado, el servicio
// respondía `INVALID_DATA` siempre. `npm test` no ejecuta Apps Script, así que la vigilancia
// es estática (no sustituye la verificación manual contra el despliegue vivo).
test("el servicio lee el id del maestro por el nombre de la propiedad, nunca por su valor", () => {
  assert.match(
    scriptText,
    /getProperty\(\s*'MASTER_SHEET_ID'\s*\)/,
    "gas/Code.gs no lee el id del maestro por el nombre de la propiedad",
  );

  // Una constante que guarda el *valor* de una propiedad no puede pasarse a `getProperty`
  // como si fuera el *nombre*: es el defecto que se corrige aquí.
  const holders = [
    ...scriptText.matchAll(/const\s+([A-Za-z_$][\w$]*)\s*=\s*[^\n]*getProperty\(/g),
  ];
  for (const [, name] of holders) {
    assert.doesNotMatch(
      scriptText,
      new RegExp(`getProperty\\(\\s*${name}\\s*\\)`),
      `«${name}» guarda un valor; no puede usarse como nombre de propiedad`,
    );
  }
});
