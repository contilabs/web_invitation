// Pruebas de `validacion.js` (RF-15, RF-20)
import { strict as assert } from "node:assert";
import test from "node:test";
import { registryErrors, registryWarnings, templateStatus } from "./validation.js";

const BODA_OK = {
  plantilla: "clasica",
  pareja: { nombre1: "Karina", nombre2: "Gerardo" },
  evento: { fechaInicio: "2027-11-01T16:30:00", zonaHoraria: "America/Mexico_City" },
  galeria: { imagenes: [{ clave: "foto1", alt: "x" }] },
  restricciones: {},
};

test("templateStatus clasifica la plantilla", () => {
  assert.equal(templateStatus("clasica"), "implemented");
  assert.equal(templateStatus("moderna"), "not-implemented");
  assert.equal(templateStatus(null), "unknown");
});

test("un registro válido no tiene errores", () => {
  assert.deepEqual(registryErrors(BODA_OK, []), []);
});

test("fecha ausente o imposible es error", () => {
  const boda = { ...BODA_OK, evento: {} };
  assert.ok(registryErrors(boda, []).some((e) => e.field === "evento.fechaInicio"));
  const boda2 = { ...BODA_OK, evento: { fechaInicio: "no-es-fecha" } };
  assert.ok(registryErrors(boda2, []).some((e) => e.field === "evento.fechaInicio"));
});

test("nombre de la pareja ausente es error", () => {
  const boda = { ...BODA_OK, pareja: { nombre2: "Gerardo" } };
  assert.ok(registryErrors(boda, []).some((e) => e.field === "pareja.nombre1"));
});

test("imagen de galería sin clave es error", () => {
  const boda = { ...BODA_OK, galeria: { imagenes: [{ alt: "sin clave" }] } };
  assert.ok(registryErrors(boda, []).some((e) => e.field.startsWith("galeria")));
});

test("conflicto de niños es error", () => {
  const boda = { ...BODA_OK, restricciones: { permiteNinos: false } };
  const errores = registryErrors(boda, [{ codigo: "rec-001", childGuests: 2 }]);
  assert.ok(errores.some((e) => e.field.includes("rec-001")));
});

test("plantilla no clásica es aviso, no error", () => {
  const boda = { ...BODA_OK, plantilla: "moderna" };
  assert.deepEqual(registryErrors(boda, []), []);
  assert.ok(registryWarnings(boda).some((a) => a.field === "plantilla"));
});

test("plantilla clásica no genera avisos", () => {
  assert.deepEqual(registryWarnings(BODA_OK), []);
});
