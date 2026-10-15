// Pruebas de `musica` (T10, RF-5): el estado siguiente es la alternancia simple.
import { strict as assert } from "node:assert";
import test from "node:test";
import { siguienteEstadoMusica } from "./musica.js";

test("alterna entre reproducir y pausar", () => {
  assert.equal(siguienteEstadoMusica(false), true);
  assert.equal(siguienteEstadoMusica(true), false);
});

test("alternar dos veces vuelve al estado inicial", () => {
  for (const inicial of [true, false]) {
    assert.equal(siguienteEstadoMusica(siguienteEstadoMusica(inicial)), inicial);
  }
});
