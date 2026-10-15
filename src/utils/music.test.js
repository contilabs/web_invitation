// Pruebas de `musica` (T10, RF-5): el estado siguiente es la alternancia simple.
import { strict as assert } from "node:assert";
import test from "node:test";
import { nextMusicState } from "./music.js";

test("alterna entre reproducir y pausar", () => {
  assert.equal(nextMusicState(false), true);
  assert.equal(nextMusicState(true), false);
});

test("alternar dos veces vuelve al estado inicial", () => {
  for (const inicial of [true, false]) {
    assert.equal(nextMusicState(nextMusicState(inicial)), inicial);
  }
});
