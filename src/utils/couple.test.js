// Pruebas de `pareja.js` (RF-2)
import { strict as assert } from "node:assert";
import test from "node:test";
import { composePersonName, coupleNames } from "./couple.js";

test("composePersonName une solo campos presentes", () => {
  const nombre = composePersonName({ nombre: "Karina", apellidos: "Delgado Benítez" });
  assert.equal(nombre, "Karina Delgado Benítez");
});

test("composePersonName sin apellidos", () => {
  const nombre = composePersonName({ nombre: "Gerardo" });
  assert.equal(nombre, "Gerardo");
});

test("composePersonName con nombre intermedio", () => {
  const nombre = composePersonName({
    nombre: "María",
    nombreIntermedio: "José",
    apellido1: "López",
    apellido2: "García",
  });
  assert.equal(nombre, "María José López García");
});

test("composePersonName ignora campos vacíos", () => {
  const nombre = composePersonName({ nombre: "   ", apellidos: "Pérez" });
  assert.equal(nombre, "Pérez");
});

test("coupleNames compone paraMostrar cuando no se define", () => {
  const res = coupleNames({ nombre1: "Karina", nombre2: "Gerardo" });
  assert.equal(res.primera, "Karina");
  assert.equal(res.segunda, "Gerardo");
  assert.equal(res.paraMostrar, "Karina y Gerardo");
});

test("coupleNames usa nombreParaMostrar si existe", () => {
  const res = coupleNames({
    nombre1: { nombre: "Karina", apellidos: "Delgado" },
    nombre2: { nombre: "Gerardo", apellidos: "Flores" },
    nombreParaMostrar: "Karina & Gerardo",
  });
  assert.equal(res.paraMostrar, "Karina & Gerardo");
});

test("coupleNames usa paraMostrar alternativo", () => {
  const res = coupleNames({
    primera: { nombre: "A" },
    segunda: { nombre: "B" },
    paraMostrar: "A y B",
  });
  assert.equal(res.paraMostrar, "A y B");
});
