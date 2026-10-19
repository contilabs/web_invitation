// Pruebas del estado inicial de `useConfirmation` (RF-11, D9).
//
// El plazo entra **por parámetro** y el «ahora» lo lee el hook. Se monta con
// `renderToStaticMarkup` (React en el servidor) para comprobar la decisión del primer
// pintado sin navegador; el cierre programado al vencer el plazo se comprueba en el
// navegador (T10).
import { strict as assert } from "node:assert";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { useConfirmation } from "./useConfirmation.js";

function firstPaint(deadline) {
  let result = null;
  function Probe() {
    result = useConfirmation(deadline);
    return null;
  }
  renderToStaticMarkup(createElement(Probe));
  return result;
}

test("sin plazo la confirmación está abierta (RF-11)", () => {
  assert.equal(firstPaint(null).open, true);
  assert.equal(firstPaint(undefined).open, true);
  assert.equal(firstPaint("").open, true);
  assert.equal(firstPaint("no-es-una-fecha").open, true);
});

test("con el plazo por delante la confirmación está abierta (RF-11)", () => {
  const later = Date.now() + 60_000;
  assert.equal(firstPaint(new Date(later).toISOString()).open, true);
});

test("con el plazo pasado la confirmación está cerrada (RF-11)", () => {
  const earlier = Date.now() - 60_000;
  assert.equal(firstPaint(new Date(earlier).toISOString()).open, false);
  // Un plazo que no es un número finito no ofrece nada que esperar: cerrado.
  assert.equal(firstPaint(Number.NaN).open, false);
});
