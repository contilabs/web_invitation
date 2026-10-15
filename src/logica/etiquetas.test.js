// Pruebas de `etiquetas` (T10, RF-4 y RF-5). Los textos son los mismos que usaba
// la web anterior, para no cambiar lo que lee el invitado ni el lector de pantalla.
import { strict as assert } from "node:assert";
import test from "node:test";
import { etiquetaMusica, etiquetaTema, ETIQUETA_TEMA_ARIA } from "./etiquetas.js";

test("la etiqueta de la música dice qué hará el botón", () => {
  assert.equal(etiquetaMusica(true), "Pausar la música");
  assert.equal(etiquetaMusica(false), "Reproducir la música");
});

test("la etiqueta del tema dice a qué tema cambia", () => {
  assert.equal(etiquetaTema("noche"), "Cambiar a tema claro");
  assert.equal(etiquetaTema("dia"), "Cambiar a tema oscuro");
});

test("el control de tema tiene una etiqueta fija para el lector de pantalla", () => {
  assert.equal(ETIQUETA_TEMA_ARIA, "Cambiar entre tema claro y oscuro");
});
