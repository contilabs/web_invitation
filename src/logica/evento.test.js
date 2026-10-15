// Pruebas de `evento.js` (RF-3)
import { strict as assert } from "node:assert";
import test from "node:test";
import {
  zonaHorariaDelEvento,
  instanteDelEvento,
  formatearFecha,
  formatearHora,
} from "./evento.js";

test("zonaHorariaDelEvento devuelve zona explícita o null", () => {
  assert.equal(zonaHorariaDelEvento({ zonaHoraria: "America/Mexico_City" }), "America/Mexico_City");
  assert.equal(zonaHorariaDelEvento({}), null);
});

test("instanteDelEvento con zona explícita devuelve ms válido", () => {
  const ms = instanteDelEvento({ fechaInicio: "2027-11-01T16:30:00", zonaHoraria: "America/Mexico_City" });
  assert.ok(!Number.isNaN(ms));
});

test("instanteDelEvento sin zona usa zona local", () => {
  const ms = instanteDelEvento({ fechaInicio: "2027-11-01T16:30:00" });
  assert.ok(!Number.isNaN(ms));
});

test("instanteDelEvento con zona inválida devuelve NaN", () => {
  const ms = instanteDelEvento({ fechaInicio: "2027-11-01T16:30:00", zonaHoraria: "XYZ" });
  assert.ok(Number.isNaN(ms));
});

test("instanteDelEvento sin fecha devuelve NaN", () => {
  const ms = instanteDelEvento({ zonaHoraria: "America/Mexico_City" });
  assert.ok(Number.isNaN(ms));
});

test("formatearFecha y formatearHora en español", () => {
  const ms = instanteDelEvento({ fechaInicio: "2027-11-01T16:30:00", zonaHoraria: "America/Mexico_City" });
  const fecha = formatearFecha(ms, "America/Mexico_City", "es-MX");
  const hora = formatearHora(ms, "America/Mexico_City", "es-MX");
  assert.ok(fecha.includes("2027"));
  assert.ok(hora.includes("16"));
  assert.ok(hora.includes("h"));
});
