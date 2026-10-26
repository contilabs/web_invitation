// Pruebas de `theme` (T9, RF-4). La resolución es pura: la preferencia guardada y
// la del sistema entran como parámetros; la persistencia vive en el hook (T12).
import { strict as assert } from "node:assert";
import test from "node:test";
import { resolveTheme } from "./theme.js";
import { THEME_STORAGE_KEY } from "../constants/theme.js";

test("una preferencia guardada válida manda sobre el sistema", () => {
  assert.equal(resolveTheme("dia", true), "dia");
  assert.equal(resolveTheme("noche", false), "noche");
});

test("sin preferencia guardada, se sigue el sistema", () => {
  assert.equal(resolveTheme(null, true), "noche");
  assert.equal(resolveTheme(null, false), "dia");
});

test("una preferencia guardada inválida se ignora", () => {
  for (const stored of ["dia ", "DIA", "claro", "oscuro", "true", ""]) {
    assert.equal(resolveTheme(stored, true), "noche");
    assert.equal(resolveTheme(stored, false), "dia");
  }
});

test("la clave de almacenamiento es la que lee el script del <head>", () => {
  assert.equal(THEME_STORAGE_KEY, "kg-tema");
});
