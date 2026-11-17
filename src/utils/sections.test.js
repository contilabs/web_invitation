// Pruebas de `secciones.js` (RF-4, RF-6, RF-7, RF-8, RF-9, RF-11, RF-14, RF-18)
import { strict as assert } from "node:assert";
import test from "node:test";
import { visibleSections, hasContent } from "./sections.js";

const base = () => ({
  cita: { texto: "Hola", autor: null },
  historia: { titulo: "H", parrafos: ["a", "b"] },
  familia: { titulo: "F", grupos: [{ titulo: "P", nombres: ["N"] }] },
  galeria: { imagenes: [{ clave: "foto1" }] },
  regalos: { opciones: [{ tipo: "tienda" }] },
  hoteles: [{ nombre: "Hotel" }],
  itinerario: [{ hora: "10:00", titulo: "x" }],
  confirmacion: { fechaLimite: "2027-10-25T23:59:59-06:00" },
  ajustes: { secciones: {} },
});

test("omite secciones opcionales ausentes", () => {
  const wedding = { confirmacion: {} };
  const visible = visibleSections(wedding);
  assert.deepEqual(visible.map((s) => s.key), ["confirmacion"]);
});

test("omite secciones opcionales vacías", () => {
  const wedding = { ...base(), cita: { texto: "   ", autor: null }, galeria: { imagenes: [] } };
  const visible = visibleSections(wedding).map((s) => s.key);
  assert.ok(!visible.includes("cita"));
  assert.ok(!visible.includes("galeria"));
});

test("incluye secciones con contenido", () => {
  const visible = visibleSections(base()).map((s) => s.key);
  assert.ok(visible.includes("cita"));
  assert.ok(visible.includes("hoteles"));
  assert.ok(visible.includes("itinerario"));
  assert.ok(visible.includes("familia"));
});

test("respeta el apagado por ajuste", () => {
  const wedding = base();
  wedding.ajustes.secciones.historiaVisible = false;
  const visible = visibleSections(wedding).map((s) => s.key);
  assert.ok(!visible.includes("historia"));
});

test("la confirmación siempre está presente aunque se apague", () => {
  const wedding = base();
  wedding.ajustes.secciones.confirmacionVisible = false;
  const visible = visibleSections(wedding).map((s) => s.key);
  assert.ok(visible.includes("confirmacion"));
});

test("hasContent detecta listas y párrafos vacíos", () => {
  assert.equal(hasContent("hoteles", []), false);
  assert.equal(hasContent("hoteles", [{ nombre: "x" }]), true);
  assert.equal(hasContent("historia", { parrafos: [] }), false);
  assert.equal(hasContent("historia", { parrafos: ["a"] }), true);
  assert.equal(hasContent("familia", { grupos: [{ titulo: "P", nombres: [] }] }), false);
  assert.equal(hasContent("familia", { grupos: [{ titulo: "P", nombres: ["N"] }] }), true);
});

test("la familia va entre Hero y cuenta regresiva y omitirla conserva el orden anterior", () => {
  const wedding = {
    pareja: { nombre1: "A", nombre2: "B" },
    familia: { texto: "Gracias por acompañarnos" },
    cita: { texto: "Una cita" },
  };
  assert.deepEqual(visibleSections(wedding).map(({ key }) => key), [
    "pareja", "familia", "cuentaRegresiva", "cita", "confirmacion",
  ]);
  delete wedding.familia;
  assert.deepEqual(visibleSections(wedding).map(({ key }) => key), [
    "pareja", "cuentaRegresiva", "cita", "confirmacion",
  ]);
});

test("familia no aparece con títulos solos o listas vacías y se puede ocultar", () => {
  assert.equal(hasContent("familia", { titulo: "Familia", grupos: [] }), false);
  assert.equal(hasContent("familia", { grupos: [{ titulo: "Padres", categorias: [{ titulo: "Novia", nombres: [] }] }] }), false);
  assert.equal(hasContent("familia", { grupos: [{ categorias: [{ nombres: ["Ana"] }] }] }), true);
  const wedding = { familia: { texto: "Gracias" }, ajustes: { secciones: { familiaVisible: false } } };
  assert.deepEqual(visibleSections(wedding).map(({ key }) => key), ["confirmacion"]);
});

test("ocultar pareja sigue ocultando tanto el Hero como la cuenta regresiva", () => {
  const wedding = { pareja: { nombre1: "A" }, ajustes: { secciones: { parejaVisible: false } } };
  assert.deepEqual(visibleSections(wedding).map(({ key }) => key), ["confirmacion"]);
});
