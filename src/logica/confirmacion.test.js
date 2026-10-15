// Pruebas de `confirmacion.js` (RF-18)
import { strict as assert } from "node:assert";
import test from "node:test";
import { confirmacionAbierta, camposDeConfirmacion } from "./confirmacion.js";

const BODA = { confirmacion: { fechaLimite: "2027-10-25T23:59:59-06:00", camposHabilitados: ["nombre", "asistentes"] } };
const LIMITE = new Date("2027-10-25T23:59:59-06:00").getTime();

test("abierta antes de la fecha límite", () => {
  assert.equal(confirmacionAbierta(BODA, LIMITE - 1), true);
});

test("abierta justo en la fecha límite (borde incluido)", () => {
  assert.equal(confirmacionAbierta(BODA, LIMITE), true);
});

test("cerrada después de la fecha límite", () => {
  assert.equal(confirmacionAbierta(BODA, LIMITE + 1), false);
});

test("sin fecha límite se considera cerrada", () => {
  assert.equal(confirmacionAbierta({ confirmacion: {} }, 0), false);
});

test("camposDeConfirmacion devuelve los habilitados", () => {
  assert.deepEqual(camposDeConfirmacion(BODA.confirmacion), ["nombre", "asistentes"]);
  assert.ok(camposDeConfirmacion({}).length > 0);
});
