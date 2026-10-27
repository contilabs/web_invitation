// Pruebas de `evento.js` (RF-3)
import { strict as assert } from "node:assert";
import test from "node:test";
import {
  eventTimeZone,
  eventInstant,
  formatDate,
  formatTime,
} from "./event.js";

test("eventTimeZone devuelve zona explícita o null", () => {
  assert.equal(eventTimeZone({ zonaHoraria: "America/Mexico_City" }), "America/Mexico_City");
  assert.equal(eventTimeZone({}), null);
});

test("eventInstant con zona explícita devuelve ms válido", () => {
  const ms = eventInstant({ fechaInicio: "2027-11-01T16:30:00", zonaHoraria: "America/Mexico_City" });
  assert.ok(!Number.isNaN(ms));
});

test("eventInstant sin zona usa zona local", () => {
  const ms = eventInstant({ fechaInicio: "2027-11-01T16:30:00" });
  assert.ok(!Number.isNaN(ms));
});

test("eventInstant con zona inválida devuelve NaN", () => {
  const ms = eventInstant({ fechaInicio: "2027-11-01T16:30:00", zonaHoraria: "XYZ" });
  assert.ok(Number.isNaN(ms));
});

test("eventInstant sin fecha devuelve NaN", () => {
  const ms = eventInstant({ zonaHoraria: "America/Mexico_City" });
  assert.ok(Number.isNaN(ms));
});

test("formatDate y formatTime en español", () => {
  // El offset evita depender de la zona local del runner (UTC en Docker).
  const ms = eventInstant({ fechaInicio: "2027-11-01T16:30:00-06:00", zonaHoraria: "America/Mexico_City" });
  const dateText = formatDate(ms, "America/Mexico_City", "es-MX");
  const timeText = formatTime(ms, "America/Mexico_City", "es-MX");
  assert.ok(dateText.includes("2027"));
  assert.ok(timeText.includes("16"));
  assert.ok(timeText.includes("h"));
});
