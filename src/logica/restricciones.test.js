// Pruebas de `restricciones.js` (RF-12, RF-20)
import { strict as assert } from "node:assert";
import test from "node:test";
import { permiteNinos, hayConflictoDeNinos, mensajesDeRestricciones } from "./restricciones.js";

test("permiteNinos: no indicado → permitidos", () => {
  assert.equal(permiteNinos({ restricciones: {} }), true);
  assert.equal(permiteNinos({}), true);
});

test("permiteNinos: explícito", () => {
  assert.equal(permiteNinos({ restricciones: { permiteNinos: true } }), true);
  assert.equal(permiteNinos({ restricciones: { permiteNinos: false } }), false);
  assert.equal(permiteNinos({ restricciones: { ninosPermitidos: false } }), false);
});

test("no hay conflicto si la boda permite niños", () => {
  assert.equal(hayConflictoDeNinos({ restricciones: {} }, { childGuests: 2 }), false);
});

test("conflicto cuando la ficha trae niños y la boda no los permite", () => {
  const boda = { restricciones: { permiteNinos: false } };
  assert.equal(hayConflictoDeNinos(boda, { childGuests: 2 }), true);
  assert.equal(hayConflictoDeNinos(boda, { childGuests: 0 }), false);
});

test("mensajes de restricciones en español", () => {
  const msgs = mensajesDeRestricciones({
    codigoVestimenta: "Formal",
    permiteNinos: false,
    otrasIndicaciones: "Sin mascotas",
  });
  assert.ok(msgs.some((m) => m.includes("Formal")));
  assert.ok(msgs.some((m) => m.includes("adultos")));
  assert.ok(msgs.some((m) => m.includes("Sin mascotas")));
});

test("mensajes vacíos sin restricciones", () => {
  assert.deepEqual(mensajesDeRestricciones(null), []);
  assert.deepEqual(mensajesDeRestricciones({}), []);
});
