// Pruebas de `validacion.js` (RF-15, RF-20)
import { strict as assert } from "node:assert";
import test from "node:test";
import { erroresDelRegistro, avisosDelRegistro, plantillaImplementada } from "./validacion.js";

const BODA_OK = {
  plantilla: "clasica",
  pareja: { nombre1: "Karina", nombre2: "Gerardo" },
  evento: { fechaInicio: "2027-11-01T16:30:00", zonaHoraria: "America/Mexico_City" },
  galeria: { imagenes: [{ clave: "foto1", alt: "x" }] },
  restricciones: {},
};

test("plantillaImplementada clasifica la plantilla", () => {
  assert.equal(plantillaImplementada("clasica"), "implementada");
  assert.equal(plantillaImplementada("moderna"), "no-implementada");
  assert.equal(plantillaImplementada(null), "desconocida");
});

test("un registro válido no tiene errores", () => {
  assert.deepEqual(erroresDelRegistro(BODA_OK, []), []);
});

test("fecha ausente o imposible es error", () => {
  const boda = { ...BODA_OK, evento: {} };
  assert.ok(erroresDelRegistro(boda, []).some((e) => e.campo === "evento.fechaInicio"));
  const boda2 = { ...BODA_OK, evento: { fechaInicio: "no-es-fecha" } };
  assert.ok(erroresDelRegistro(boda2, []).some((e) => e.campo === "evento.fechaInicio"));
});

test("nombre de la pareja ausente es error", () => {
  const boda = { ...BODA_OK, pareja: { nombre2: "Gerardo" } };
  assert.ok(erroresDelRegistro(boda, []).some((e) => e.campo === "pareja.nombre1"));
});

test("imagen de galería sin clave es error", () => {
  const boda = { ...BODA_OK, galeria: { imagenes: [{ alt: "sin clave" }] } };
  assert.ok(erroresDelRegistro(boda, []).some((e) => e.campo.startsWith("galeria")));
});

test("conflicto de niños es error", () => {
  const boda = { ...BODA_OK, restricciones: { permiteNinos: false } };
  const errores = erroresDelRegistro(boda, [{ codigo: "rec-001", childGuests: 2 }]);
  assert.ok(errores.some((e) => e.campo.includes("rec-001")));
});

test("plantilla no clásica es aviso, no error", () => {
  const boda = { ...BODA_OK, plantilla: "moderna" };
  assert.deepEqual(erroresDelRegistro(boda, []), []);
  assert.ok(avisosDelRegistro(boda).some((a) => a.campo === "plantilla"));
});

test("plantilla clásica no genera avisos", () => {
  assert.deepEqual(avisosDelRegistro(BODA_OK), []);
});
