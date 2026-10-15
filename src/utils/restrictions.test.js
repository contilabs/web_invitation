// Pruebas de `restricciones.js` (RF-12, RF-20)
import { strict as assert } from "node:assert";
import test from "node:test";
import { allowsChildren, hasChildrenConflict, restrictionMessages } from "./restrictions.js";

test("permiteNinos: no indicado → permitidos", () => {
  assert.equal(allowsChildren({ restricciones: {} }), true);
  assert.equal(allowsChildren({}), true);
});

test("permiteNinos: explícito", () => {
  assert.equal(allowsChildren({ restricciones: { permiteNinos: true } }), true);
  assert.equal(allowsChildren({ restricciones: { permiteNinos: false } }), false);
  assert.equal(allowsChildren({ restricciones: { ninosPermitidos: false } }), false);
});

test("no hay conflicto si la boda permite niños", () => {
  assert.equal(hasChildrenConflict({ restricciones: {} }, { childGuests: 2 }), false);
});

test("conflicto cuando la ficha trae niños y la boda no los permite", () => {
  const boda = { restricciones: { permiteNinos: false } };
  assert.equal(hasChildrenConflict(boda, { childGuests: 2 }), true);
  assert.equal(hasChildrenConflict(boda, { childGuests: 0 }), false);
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
