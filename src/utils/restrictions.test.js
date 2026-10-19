// Pruebas de `restrictions.js` (RF-12, RF-20).
//
// Se retiró `hasChildrenConflict` (spec 004, T8; DT-8, D22): solo tenía sentido contra una
// ficha local. Se conservan las pruebas de `allowsChildren` y `restrictionMessages`.
import { strict as assert } from "node:assert";
import test from "node:test";
import { allowsChildren, restrictionMessages } from "./restrictions.js";

test("permiteNinos: no indicado → permitidos", () => {
  assert.equal(allowsChildren({ restricciones: {} }), true);
  assert.equal(allowsChildren({}), true);
});

test("permiteNinos: explícito", () => {
  assert.equal(allowsChildren({ restricciones: { permiteNinos: true } }), true);
  assert.equal(allowsChildren({ restricciones: { permiteNinos: false } }), false);
  assert.equal(allowsChildren({ restricciones: { ninosPermitidos: false } }), false);
});

test("mensajes de restricciones en español", () => {
  const msgs = restrictionMessages({
    codigoVestimenta: "Formal",
    permiteNinos: false,
    otrasIndicaciones: "Sin mascotas",
  });
  assert.ok(msgs.some((m) => m.includes("Formal")));
  assert.ok(msgs.some((m) => m.includes("adultos")));
  assert.ok(msgs.some((m) => m.includes("Sin mascotas")));
});

test("mensajes vacíos sin restricciones", () => {
  assert.deepEqual(restrictionMessages(null), []);
  assert.deepEqual(restrictionMessages({}), []);
});
