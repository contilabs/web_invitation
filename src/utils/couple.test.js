// Pruebas de `pareja.js` (RF-2)
import { strict as assert } from "node:assert";
import test from "node:test";
import { composePersonName, coupleNames } from "./couple.js";

test("composePersonName une solo campos presentes", () => {
  const name = composePersonName({ nombre: "Karina", apellidos: "Delgado Benítez" });
  assert.equal(name, "Karina Delgado Benítez");
});

test("composePersonName sin apellidos", () => {
  const name = composePersonName({ nombre: "Gerardo" });
  assert.equal(name, "Gerardo");
});

test("composePersonName con nombre intermedio", () => {
  const name = composePersonName({
    nombre: "María",
    nombreIntermedio: "José",
    apellido1: "López",
    apellido2: "García",
  });
  assert.equal(name, "María José López García");
});

test("composePersonName ignora campos vacíos", () => {
  const name = composePersonName({ nombre: "   ", apellidos: "Pérez" });
  assert.equal(name, "Pérez");
});

test("coupleNames compone paraMostrar cuando no se define", () => {
  const result = coupleNames({ nombre1: "Karina", nombre2: "Gerardo" });
  assert.equal(result.first, "Karina");
  assert.equal(result.second, "Gerardo");
  assert.equal(result.display, "Karina y Gerardo");
});

test("coupleNames usa nombreParaMostrar si existe", () => {
  const result = coupleNames({
    nombre1: { nombre: "Karina", apellidos: "Delgado" },
    nombre2: { nombre: "Gerardo", apellidos: "Flores" },
    nombreParaMostrar: "Karina & Gerardo",
  });
  assert.equal(result.display, "Karina & Gerardo");
});

test("coupleNames usa paraMostrar alternativo", () => {
  const result = coupleNames({
    primera: { nombre: "A" },
    segunda: { nombre: "B" },
    paraMostrar: "A y B",
  });
  assert.equal(result.display, "A y B");
});
