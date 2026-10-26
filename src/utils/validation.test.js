// Pruebas de `validation.js` (RF-1, RF-13, RF-20).
//
// `registryErrors` valida **solo el registro** de la boda: el invitado lo resuelve el
// servicio, así que ya no recibe fichas y el caso «conflicto de niños es error» desaparece
// (DT-8, D22).
import { strict as assert } from "node:assert";
import test from "node:test";
import { registryErrors, registryWarnings, templateStatus } from "./validation.js";

const WEDDING_OK = {
  plantilla: "clasica",
  pareja: { nombre1: "Karina", nombre2: "Gerardo" },
  evento: { fechaInicio: "2027-11-01T16:30:00", zonaHoraria: "America/Mexico_City" },
  galeria: { imagenes: [{ clave: "foto1", alt: "x" }] },
};

test("templateStatus clasifica la plantilla", () => {
  assert.equal(templateStatus("clasica"), "implemented");
  assert.equal(templateStatus("moderna"), "not-implemented");
  assert.equal(templateStatus(null), "unknown");
});

test("un registro válido no tiene errores", () => {
  assert.deepEqual(registryErrors(WEDDING_OK), []);
});

test("fecha ausente o imposible es error", () => {
  const wedding = { ...WEDDING_OK, evento: {} };
  assert.ok(registryErrors(wedding).some((e) => e.field === "evento.fechaInicio"));
  const weddingBadDate = { ...WEDDING_OK, evento: { fechaInicio: "no-es-fecha" } };
  assert.ok(registryErrors(weddingBadDate).some((e) => e.field === "evento.fechaInicio"));
});

test("nombre de la pareja ausente es error", () => {
  const wedding = { ...WEDDING_OK, pareja: { nombre2: "Gerardo" } };
  assert.ok(registryErrors(wedding).some((e) => e.field === "pareja.nombre1"));
});

test("imagen de galería sin clave es error", () => {
  const wedding = { ...WEDDING_OK, galeria: { imagenes: [{ alt: "sin clave" }] } };
  assert.ok(registryErrors(wedding).some((e) => e.field.startsWith("galeria")));
});

test("plantilla no clásica es aviso, no error", () => {
  const wedding = { ...WEDDING_OK, plantilla: "moderna" };
  assert.deepEqual(registryErrors(wedding), []);
  assert.ok(registryWarnings(wedding).some((a) => a.field === "plantilla"));
});

test("plantilla clásica no genera avisos", () => {
  assert.deepEqual(registryWarnings(WEDDING_OK), []);
});
