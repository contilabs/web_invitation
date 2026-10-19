// Pruebas de `confirmation.js` (RF-11): el plazo lo da el servicio y el «ahora» entra
// **por parámetro** (el módulo no lee el reloj).
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import test from "node:test";

import { confirmationFields, deadlineMs, isConfirmationOpen } from "./confirmation.js";

const DEADLINE = "2027-10-25T23:59:59-06:00";
const DEADLINE_MS = new Date(DEADLINE).getTime();

test("deadlineMs interpreta el plazo del servicio (RF-11)", () => {
  assert.equal(deadlineMs(DEADLINE), DEADLINE_MS);
  assert.equal(deadlineMs("2027-10-25"), new Date("2027-10-25").getTime());
  assert.equal(deadlineMs(DEADLINE_MS), DEADLINE_MS);
});

test("deadlineMs devuelve null si el plazo está vacío o no se puede interpretar (RF-11)", () => {
  assert.equal(deadlineMs(null), null);
  assert.equal(deadlineMs(undefined), null);
  assert.equal(deadlineMs(""), null);
  assert.equal(deadlineMs("no-es-una-fecha"), null);
  assert.equal(deadlineMs(true), null);
});

test("abierta antes del plazo y justo en el borde (RF-11)", () => {
  assert.equal(isConfirmationOpen(DEADLINE, DEADLINE_MS - 1), true);
  assert.equal(isConfirmationOpen(DEADLINE, DEADLINE_MS), true);
});

test("cerrada después del plazo (RF-11)", () => {
  assert.equal(isConfirmationOpen(DEADLINE, DEADLINE_MS + 1), false);
});

test("sin plazo (vacío o ilegible) la invitación se puede contestar siempre (RF-11)", () => {
  assert.equal(isConfirmationOpen(null, DEADLINE_MS), true);
  assert.equal(isConfirmationOpen(undefined, DEADLINE_MS), true);
  assert.equal(isConfirmationOpen("", DEADLINE_MS), true);
  assert.equal(isConfirmationOpen("no-es-una-fecha", DEADLINE_MS), true);
});

test("un plazo que no es un número finito se trata como cerrado (RF-11)", () => {
  assert.equal(isConfirmationOpen(Number.NaN, DEADLINE_MS), false);
  assert.equal(isConfirmationOpen(Infinity, DEADLINE_MS), false);
  // Un «ahora» que no es un número tampoco abre la confirmación.
  assert.equal(isConfirmationOpen(DEADLINE, Number.NaN), false);
  assert.equal(isConfirmationOpen(DEADLINE, undefined), false);
  assert.equal(isConfirmationOpen(DEADLINE, "ahora"), false);
});

test("confirmationFields devuelve los campos habilitados del registro (RF-8)", () => {
  assert.deepEqual(confirmationFields({ camposHabilitados: ["nombre", "asistentes"] }), [
    "nombre",
    "asistentes",
  ]);
  assert.ok(confirmationFields({}).length > 0);
  assert.ok(confirmationFields(null).length > 0);
});

test("el módulo es puro: sin DOM, sin reloj y sin red (RNF-9)", () => {
  const source = readFileSync(new URL("./confirmation.js", import.meta.url), "utf8");
  for (const forbidden of [
    /\bdocument\b/,
    /\bwindow\b/,
    /\blocalStorage\b/,
    /\bfetch\s*\(/,
    /\bXMLHttpRequest\b/,
    /Date\.now/,
    /new Date\(\s*\)/,
    /import\.meta/,
    /from "react"/,
  ]) {
    assert.doesNotMatch(source, forbidden, `el módulo usa ${forbidden}`);
  }
});
