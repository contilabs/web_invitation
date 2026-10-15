// Pruebas de `pareja.js` (RF-2)
import { strict as assert } from "node:assert";
import test from "node:test";
import { componerNombrePersona, nombresDeLaPareja } from "./pareja.js";

test("componerNombrePersona une solo campos presentes", () => {
  const nombre = componerNombrePersona({ nombre: "Karina", apellidos: "Delgado Benítez" });
  assert.equal(nombre, "Karina Delgado Benítez");
});

test("componerNombrePersona sin apellidos", () => {
  const nombre = componerNombrePersona({ nombre: "Gerardo" });
  assert.equal(nombre, "Gerardo");
});

test("componerNombrePersona con nombre intermedio", () => {
  const nombre = componerNombrePersona({
    nombre: "María",
    nombreIntermedio: "José",
    apellido1: "López",
    apellido2: "García",
  });
  assert.equal(nombre, "María José López García");
});

test("componerNombrePersona ignora campos vacíos", () => {
  const nombre = componerNombrePersona({ nombre: "   ", apellidos: "Pérez" });
  assert.equal(nombre, "Pérez");
});

test("nombresDeLaPareja compone paraMostrar cuando no se define", () => {
  const res = nombresDeLaPareja({ nombre1: "Karina", nombre2: "Gerardo" });
  assert.equal(res.primera, "Karina");
  assert.equal(res.segunda, "Gerardo");
  assert.equal(res.paraMostrar, "Karina y Gerardo");
});

test("nombresDeLaPareja usa nombreParaMostrar si existe", () => {
  const res = nombresDeLaPareja({
    nombre1: { nombre: "Karina", apellidos: "Delgado" },
    nombre2: { nombre: "Gerardo", apellidos: "Flores" },
    nombreParaMostrar: "Karina & Gerardo",
  });
  assert.equal(res.paraMostrar, "Karina & Gerardo");
});

test("nombresDeLaPareja usa paraMostrar alternativo", () => {
  const res = nombresDeLaPareja({
    primera: { nombre: "A" },
    segunda: { nombre: "B" },
    paraMostrar: "A y B",
  });
  assert.equal(res.paraMostrar, "A y B");
});
