// Pruebas de `confirmacion.js` (RF-18)
import { strict as assert } from "node:assert";
import test from "node:test";
import { isConfirmationOpen, confirmationFields } from "./confirmation.js";

const WEDDING = { confirmacion: { fechaLimite: "2027-10-25T23:59:59-06:00", camposHabilitados: ["nombre", "asistentes"] } };
const DEADLINE = new Date("2027-10-25T23:59:59-06:00").getTime();

test("abierta antes de la fecha límite", () => {
  assert.equal(isConfirmationOpen(WEDDING, DEADLINE - 1), true);
});

test("abierta justo en la fecha límite (borde incluido)", () => {
  assert.equal(isConfirmationOpen(WEDDING, DEADLINE), true);
});

test("cerrada después de la fecha límite", () => {
  assert.equal(isConfirmationOpen(WEDDING, DEADLINE + 1), false);
});

test("sin fecha límite se considera cerrada", () => {
  assert.equal(isConfirmationOpen({ confirmacion: {} }, 0), false);
});

test("confirmationFields devuelve los habilitados", () => {
  assert.deepEqual(confirmationFields(WEDDING.confirmacion), ["nombre", "asistentes"]);
  assert.ok(confirmationFields({}).length > 0);
});
