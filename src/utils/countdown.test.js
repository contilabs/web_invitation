// Pruebas de `countdown` (T7, RF-3). La función es pura: el «ahora» y el
// objetivo entran como milisegundos, así que todo es determinista (sin reloj interno).
import { strict as assert } from "node:assert";
import test from "node:test";
import { remainingParts } from "./countdown.js";

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

test("reparte días, horas, minutos y segundos", () => {
  const now = 1_000_000;
  const target = now + 2 * DAY + 3 * HOUR + 4 * MINUTE + 5 * SECOND;
  assert.deepEqual(remainingParts(target, now), {
    days: 2,
    hours: 3,
    minutes: 4,
    seconds: 5,
    done: false,
  });
});

test("cuenta los días completos y recorta lo que sobra", () => {
  const now = 1_000_000;
  const target = now + 31 * DAY;
  assert.deepEqual(remainingParts(target, now), {
    days: 31,
    hours: 0,
    minutes: 0,
    seconds: 0,
    done: false,
  });
});

test("el segundo exacto cuenta como futuro", () => {
  assert.deepEqual(remainingParts(SECOND, 0), {
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 1,
    done: false,
  });
});

test("trabaja con segundos incompletos (recorta, no redondea)", () => {
  assert.equal(remainingParts(1999, 0).seconds, 1);
});

test("justo en la fecha del evento ya está terminado", () => {
  assert.equal(remainingParts(5000, 5000).done, true);
});

test("si la fecha ya pasó, terminado y todo a cero", () => {
  assert.deepEqual(remainingParts(0, 5000), {
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    done: true,
  });
});

test("una fecha inválida (NaN) no esparce NaN: queda terminado", () => {
  // Guarda de T26: una errata en la fecha del registro deja el instante en NaN; la
  // interfaz no debe mostrar «NaN», así que se trata como terminado.
  assert.deepEqual(remainingParts(NaN, 1_000_000), {
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    done: true,
  });
  assert.deepEqual(remainingParts(Infinity, 1_000_000), {
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    done: true,
  });
});
