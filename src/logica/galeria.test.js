// Pruebas de `galeria` (T11, RF-7): salto circular entre fotos y elección de la
// variante optimizada para el visor. La función nunca devuelve el original: las
// entradas sin ancho (`w`) se descartan.
import { strict as assert } from "node:assert";
import test from "node:test";
import { siguienteIndice, elegirVariante } from "./galeria.js";

test("avanza y retrocede con salto circular", () => {
  assert.equal(siguienteIndice(0, 7, 1), 1);
  assert.equal(siguienteIndice(5, 7, 2), 0);
  assert.equal(siguienteIndice(0, 7, -1), 6);
  assert.equal(siguienteIndice(1, 7, -3), 5);
});

test("con una sola foto el índice siempre es 0", () => {
  assert.equal(siguienteIndice(0, 1, 1), 0);
  assert.equal(siguienteIndice(0, 1, -1), 0);
});

test("sin fotos no hay índice (0) y no rompe", () => {
  assert.equal(siguienteIndice(0, 0, 1), 0);
  assert.equal(siguienteIndice(3, 0, -1), 0);
});

test("elige la variante más cercana al ancho objetivo", () => {
  const srcset = "foto2-900.jpg 900w, foto2-1800.jpg 1800w";
  assert.equal(elegirVariante(srcset, 1400), "foto2-1800.jpg");
  assert.equal(elegirVariante(srcset, 1000), "foto2-900.jpg");
});

test("en empate gana la variante mayor", () => {
  assert.equal(elegirVariante("a-900.jpg 900w, b-1800.jpg 1800w", 1350), "b-1800.jpg");
});

test("sin objetivo, devuelve la variante mayor", () => {
  assert.equal(elegirVariante("foto2-900.jpg 900w, foto2-1800.jpg 1800w"), "foto2-1800.jpg");
});

test("descarta entradas sin ancho: nunca devuelve el original", () => {
  assert.equal(elegirVariante("assets/photos/foto2.jpg"), null);
  assert.equal(elegirVariante("foto2.jpg, foto2-900.jpg 900w", 900), "foto2-900.jpg");
});

test("sin srcset no hay variante", () => {
  assert.equal(elegirVariante("", 1400), null);
  assert.equal(elegirVariante(null, 1400), null);
});
