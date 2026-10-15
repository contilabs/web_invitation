// Pruebas de `tema` (T9, RF-4). La resolución es pura: la preferencia guardada y
// la del sistema entran como parámetros; la persistencia vive en el hook (T12).
import { strict as assert } from "node:assert";
import test from "node:test";
import { resolveTheme, CLAVE_TEMA } from "./theme.js";

test("una preferencia guardada válida manda sobre el sistema", () => {
  assert.equal(resolveTheme("dia", true), "dia");
  assert.equal(resolveTheme("noche", false), "noche");
});

test("sin preferencia guardada, se sigue el sistema", () => {
  assert.equal(resolveTheme(null, true), "noche");
  assert.equal(resolveTheme(null, false), "dia");
});

test("una preferencia guardada inválida se ignora", () => {
  for (const guardado of ["", "DIA", "claro", "oscuro", "true"]) {
    assert.equal(resolveTheme(guardado, true), "noche", `«${guardado}» debería ignorarse`);
    assert.equal(resolveTheme(guardado, false), "dia", `«${guardado}» debería ignorarse`);
  }
});

test("la clave de almacenamiento es la que usa el script del <head>", () => {
  assert.equal(CLAVE_TEMA, "kg-tema");
});
