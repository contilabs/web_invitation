// Pruebas de `secciones.js` (RF-4, RF-6, RF-7, RF-8, RF-9, RF-11, RF-14, RF-18)
import { strict as assert } from "node:assert";
import test from "node:test";
import { seccionesVisibles, tieneContenido } from "./secciones.js";

const base = () => ({
  cita: { texto: "Hola", autor: null },
  historia: { titulo: "H", parrafos: ["a", "b"] },
  galeria: { imagenes: [{ clave: "foto1" }] },
  regalos: { opciones: [{ tipo: "tienda" }] },
  hoteles: [{ nombre: "Hotel" }],
  itinerario: [{ hora: "10:00", titulo: "x" }],
  confirmacion: { fechaLimite: "2027-10-25T23:59:59-06:00" },
  ajustes: { secciones: {} },
});

test("omite secciones opcionales ausentes", () => {
  const boda = { confirmacion: {} };
  const visibles = seccionesVisibles(boda);
  assert.deepEqual(visibles.map((s) => s.clave), ["confirmacion"]);
});

test("omite secciones opcionales vacías", () => {
  const boda = { ...base(), cita: { texto: "   ", autor: null }, galeria: { imagenes: [] } };
  const visibles = seccionesVisibles(boda).map((s) => s.clave);
  assert.ok(!visibles.includes("cita"));
  assert.ok(!visibles.includes("galeria"));
});

test("incluye secciones con contenido", () => {
  const visibles = seccionesVisibles(base()).map((s) => s.clave);
  assert.ok(visibles.includes("cita"));
  assert.ok(visibles.includes("hoteles"));
  assert.ok(visibles.includes("itinerario"));
});

test("respeta el apagado por ajuste", () => {
  const boda = base();
  boda.ajustes.secciones.historiaVisible = false;
  const visibles = seccionesVisibles(boda).map((s) => s.clave);
  assert.ok(!visibles.includes("historia"));
});

test("la confirmación siempre está presente aunque se apague", () => {
  const boda = base();
  boda.ajustes.secciones.confirmacionVisible = false;
  const visibles = seccionesVisibles(boda).map((s) => s.clave);
  assert.ok(visibles.includes("confirmacion"));
});

test("tieneContenido detecta listas y párrafos vacíos", () => {
  assert.equal(tieneContenido("hoteles", []), false);
  assert.equal(tieneContenido("hoteles", [{ nombre: "x" }]), true);
  assert.equal(tieneContenido("historia", { parrafos: [] }), false);
  assert.equal(tieneContenido("historia", { parrafos: ["a"] }), true);
});
