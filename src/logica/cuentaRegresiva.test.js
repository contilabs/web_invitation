// Pruebas de `cuentaRegresiva` (T7, RF-3). La función es pura: el «ahora» y el
// objetivo entran como milisegundos, así que todo es determinista (sin reloj interno).
import { strict as assert } from "node:assert";
import test from "node:test";
import { calcularRestante } from "./cuentaRegresiva.js";

const SEGUNDO = 1000;
const MINUTO = 60 * SEGUNDO;
const HORA = 60 * MINUTO;
const DIA = 24 * HORA;

test("reparte días, horas, minutos y segundos", () => {
  const ahora = 1_000_000;
  const objetivo = ahora + 2 * DIA + 3 * HORA + 4 * MINUTO + 5 * SEGUNDO;
  assert.deepEqual(calcularRestante(objetivo, ahora), {
    dias: 2,
    horas: 3,
    minutos: 4,
    segundos: 5,
    terminado: false,
  });
});

test("cuenta los días completos y recorta lo que sobra", () => {
  const ahora = 1_000_000;
  const objetivo = ahora + 31 * DIA;
  assert.deepEqual(calcularRestante(objetivo, ahora), {
    dias: 31,
    horas: 0,
    minutos: 0,
    segundos: 0,
    terminado: false,
  });
});

test("el segundo exacto cuenta como futuro", () => {
  assert.deepEqual(calcularRestante(SEGUNDO, 0), {
    dias: 0,
    horas: 0,
    minutos: 0,
    segundos: 1,
    terminado: false,
  });
});

test("trabaja con segundos incompletos (recorta, no redondea)", () => {
  assert.equal(calcularRestante(1999, 0).segundos, 1);
});

test("justo en la fecha del evento ya está terminado", () => {
  assert.equal(calcularRestante(5000, 5000).terminado, true);
});

test("si la fecha ya pasó, terminado y todo a cero", () => {
  assert.deepEqual(calcularRestante(0, 5000), {
    dias: 0,
    horas: 0,
    minutos: 0,
    segundos: 0,
    terminado: true,
  });
});

test("una fecha inválida (NaN) no esparce NaN: queda terminado", () => {
  // Guarda de T26: una errata en la fecha del registro deja el instante en NaN; la
  // interfaz no debe mostrar «NaN», así que se trata como terminado.
  assert.deepEqual(calcularRestante(NaN, 1_000_000), {
    dias: 0,
    horas: 0,
    minutos: 0,
    segundos: 0,
    terminado: true,
  });
  assert.deepEqual(calcularRestante(Infinity, 1_000_000), {
    dias: 0,
    horas: 0,
    minutos: 0,
    segundos: 0,
    terminado: true,
  });
});
