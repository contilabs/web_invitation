// Pruebas de `rsvpState.js` (RF-1, RF-7; D1, D2; B2, I1; M10): los siete estados del bloque
// de confirmación, la **única** regla de arranque y la tabla de transiciones, con los
// acontecimientos que no aplican devolviendo `null` (guarda del doble clic).
//
// Sin DOM, sin reloj y sin red: el plazo entra por `open` y la consulta por sus
// acontecimientos (RNF-4).
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import test from "node:test";

import { BLOCK_EVENTS, BLOCK_STATES, initialBlockState, nextBlockState } from "./rsvpState.js";

// Invitaciones de ejemplo: solo lo que mira la máquina (el tipo y la respuesta previa).
const PERSONALIZED = { type: "personal", previousResponse: null };
const PERSONALIZED_ANSWERED = {
  type: "personal",
  previousResponse: { state: "confirmed", adultsAttendees: 2, childAttendees: 0 },
};
const GENERIC = { type: "generic", limit: 2, previousResponse: null };
const PUBLIC = { type: "public", limit: "n", previousResponse: null };

// Los estados de interacción, que son los cinco desde los que se puede cerrar el plazo.
const INTERACTION_STATES = [
  BLOCK_STATES.NOT_ANSWERED,
  BLOCK_STATES.PHONE,
  BLOCK_STATES.LOOKING_UP,
  BLOCK_STATES.ANSWERED,
  BLOCK_STATES.EDITING,
];

test("los siete estados del bloque están declarados (RF-1, D1)", () => {
  assert.deepEqual(Object.keys(BLOCK_STATES).sort(), [
    "ANSWERED",
    "CLOSED",
    "DEGRADED",
    "EDITING",
    "LOOKING_UP",
    "NOT_ANSWERED",
    "PHONE",
  ]);
  // Cada estado vale por un literal propio y ninguno se repite.
  const values = Object.values(BLOCK_STATES);
  assert.equal(new Set(values).size, 7);
  for (const value of values) assert.equal(typeof value, "string");
});

test("los acontecimientos del bloque están declarados (RF-1)", () => {
  assert.deepEqual(Object.keys(BLOCK_EVENTS).sort(), [
    "CONTINUE",
    "DEADLINE",
    "EDIT",
    "LOOKUP_FAILED",
    "LOOKUP_FOUND",
    "LOOKUP_INVALID_PHONE",
    "LOOKUP_NONE",
    "REVEAL",
    "SUBMIT_FAIL",
    "SUBMIT_OK",
  ]);
  const values = Object.values(BLOCK_EVENTS);
  assert.equal(new Set(values).size, values.length);
});

test("arranque degradado: invitación sin resolver, modo demo o error (RF-1, RF-7; D2)", () => {
  assert.equal(initialBlockState({ status: "demo", invitation: null, open: true }), BLOCK_STATES.DEGRADED);
  assert.equal(initialBlockState({ status: "error", invitation: null, open: true }), BLOCK_STATES.DEGRADED);
  assert.equal(initialBlockState({ status: "loading", invitation: null, open: true }), BLOCK_STATES.DEGRADED);
  assert.equal(initialBlockState(), BLOCK_STATES.DEGRADED);
});

test("arranque cerrado: el plazo ya venció (RF-1, RF-7; D2, D8)", () => {
  assert.equal(initialBlockState({ status: "ready", invitation: PERSONALIZED, open: false }), BLOCK_STATES.CLOSED);
  assert.equal(initialBlockState({ status: "ready", invitation: GENERIC, open: false }), BLOCK_STATES.CLOSED);
});

test("arranque respondido: personalizada con respuesta previa (RF-1, RF-2; D2)", () => {
  assert.equal(
    initialBlockState({ status: "ready", invitation: PERSONALIZED_ANSWERED, open: true }),
    BLOCK_STATES.ANSWERED,
  );
});

test("arranque sin-respondido: personalizada sin respuesta y genérica/pública (RF-1, D2)", () => {
  assert.equal(initialBlockState({ status: "ready", invitation: PERSONALIZED, open: true }), BLOCK_STATES.NOT_ANSWERED);
  assert.equal(initialBlockState({ status: "ready", invitation: GENERIC, open: true }), BLOCK_STATES.NOT_ANSWERED);
  assert.equal(initialBlockState({ status: "ready", invitation: PUBLIC, open: true }), BLOCK_STATES.NOT_ANSWERED);
  // Solo la personalizada se da por contestada: la genérica y la pública necesitan el paso
  // del teléfono (RF-5).
  assert.equal(
    initialBlockState({
      status: "ready",
      invitation: { type: "generic", limit: 2, previousResponse: { state: "confirmed" } },
      open: true,
    }),
    BLOCK_STATES.NOT_ANSWERED,
  );
});

test("la regla de arranque se aplica en orden: degradado > cerrado > respondido (D2, I1)", () => {
  // Un fallo manda sobre el plazo vencido y sobre la respuesta previa.
  assert.equal(
    initialBlockState({ status: "error", invitation: PERSONALIZED_ANSWERED, open: false }),
    BLOCK_STATES.DEGRADED,
  );
  // El plazo vencido manda sobre la respuesta previa.
  assert.equal(
    initialBlockState({ status: "ready", invitation: PERSONALIZED_ANSWERED, open: false }),
    BLOCK_STATES.CLOSED,
  );
});

test("«Responder invitación» revela el paso que toca (RF-1, RF-3, RF-5)", () => {
  assert.equal(
    nextBlockState(BLOCK_STATES.NOT_ANSWERED, BLOCK_EVENTS.REVEAL, { personalized: true }),
    BLOCK_STATES.EDITING,
  );
  assert.equal(
    nextBlockState(BLOCK_STATES.NOT_ANSWERED, BLOCK_EVENTS.REVEAL, { personalized: false }),
    BLOCK_STATES.PHONE,
  );
  // Sin la opción, se asume la genérica/pública (el paso del teléfono).
  assert.equal(nextBlockState(BLOCK_STATES.NOT_ANSWERED, BLOCK_EVENTS.REVEAL), BLOCK_STATES.PHONE);
});

test("«Continuar» con el teléfono completo pasa a consultando (RF-1, RF-5)", () => {
  assert.equal(nextBlockState(BLOCK_STATES.PHONE, BLOCK_EVENTS.CONTINUE), BLOCK_STATES.LOOKING_UP);
});

test("el resultado de la consulta: respondido, editando o degradado (RF-1, RF-5, RF-7)", () => {
  assert.equal(nextBlockState(BLOCK_STATES.LOOKING_UP, BLOCK_EVENTS.LOOKUP_FOUND), BLOCK_STATES.ANSWERED);
  assert.equal(nextBlockState(BLOCK_STATES.LOOKING_UP, BLOCK_EVENTS.LOOKUP_NONE), BLOCK_STATES.EDITING);
  assert.equal(nextBlockState(BLOCK_STATES.LOOKING_UP, BLOCK_EVENTS.LOOKUP_FAILED), BLOCK_STATES.DEGRADED);
});

test("un INVALID_PHONE de la consulta vuelve a telefono sin degradar (RF-5, M4)", () => {
  assert.equal(
    nextBlockState(BLOCK_STATES.LOOKING_UP, BLOCK_EVENTS.LOOKUP_INVALID_PHONE),
    BLOCK_STATES.PHONE,
  );
  // Y desde ahí se puede volver a intentar.
  assert.equal(nextBlockState(BLOCK_STATES.PHONE, BLOCK_EVENTS.CONTINUE), BLOCK_STATES.LOOKING_UP);
});

test("«Editar» pasa de respondido a editando (RF-1, RF-2, RF-10)", () => {
  assert.equal(nextBlockState(BLOCK_STATES.ANSWERED, BLOCK_EVENTS.EDIT), BLOCK_STATES.EDITING);
});

test("el envío: aceptado pasa a respondido y fallido conserva editando (RF-1, RF-9)", () => {
  assert.equal(nextBlockState(BLOCK_STATES.EDITING, BLOCK_EVENTS.SUBMIT_OK), BLOCK_STATES.ANSWERED);
  assert.equal(nextBlockState(BLOCK_STATES.EDITING, BLOCK_EVENTS.SUBMIT_FAIL), BLOCK_STATES.EDITING);
});

test("el plazo vencido lleva a cerrado desde los cinco estados de interacción (RF-1, RF-7; D8)", () => {
  for (const state of INTERACTION_STATES) {
    assert.equal(nextBlockState(state, BLOCK_EVENTS.DEADLINE), BLOCK_STATES.CLOSED, `desde ${state}`);
  }
  // `cerrado` y `degradado` quedan fuera de la interacción: no se cierran dos veces ni salen
  // de su estado por el plazo (RF-7).
  assert.equal(nextBlockState(BLOCK_STATES.CLOSED, BLOCK_EVENTS.DEADLINE), null);
  assert.equal(nextBlockState(BLOCK_STATES.DEGRADED, BLOCK_EVENTS.DEADLINE), null);
});

test("los acontecimientos que no aplican no cambian el estado: null (RF-1, M10)", () => {
  assert.equal(nextBlockState(BLOCK_STATES.NOT_ANSWERED, BLOCK_EVENTS.CONTINUE), null);
  assert.equal(nextBlockState(BLOCK_STATES.PHONE, BLOCK_EVENTS.EDIT), null);
  assert.equal(nextBlockState(BLOCK_STATES.ANSWERED, BLOCK_EVENTS.SUBMIT_OK), null);
  assert.equal(nextBlockState(BLOCK_STATES.NOT_ANSWERED, BLOCK_EVENTS.LOOKUP_FOUND), null);
});

test("el doble clic no mueve nada: una segunda pulsación se ignora (RF-5, M10)", () => {
  // «Responder invitación» dos veces: la segunda no dispara otro paso.
  const first = nextBlockState(BLOCK_STATES.NOT_ANSWERED, BLOCK_EVENTS.REVEAL, { personalized: false });
  assert.equal(first, BLOCK_STATES.PHONE);
  assert.equal(nextBlockState(first, BLOCK_EVENTS.REVEAL, { personalized: false }), null);

  // «Continuar» mientras la consulta está en vuelo: ninguna consulta más.
  assert.equal(nextBlockState(BLOCK_STATES.LOOKING_UP, BLOCK_EVENTS.CONTINUE), null);

  // «Editar» ya editando: no se vuelve a precargar nada.
  assert.equal(nextBlockState(BLOCK_STATES.EDITING, BLOCK_EVENTS.EDIT), null);

  // El plazo no reabre un bloque cerrado.
  assert.equal(nextBlockState(BLOCK_STATES.CLOSED, BLOCK_EVENTS.REVEAL), null);
  assert.equal(nextBlockState(BLOCK_STATES.DEGRADED, BLOCK_EVENTS.EDIT), null);
});

test("un estado o un acontecimiento desconocidos no producen transición (RF-1)", () => {
  assert.equal(nextBlockState("sin-estado", BLOCK_EVENTS.REVEAL), null);
  assert.equal(nextBlockState(BLOCK_STATES.NOT_ANSWERED, "sin-acontecimiento"), null);
  assert.equal(nextBlockState(), null);
  // Ni los nombres heredados del prototipo cuentan como estado ni como acontecimiento.
  assert.equal(nextBlockState("toString", BLOCK_EVENTS.REVEAL), null);
  assert.equal(nextBlockState(BLOCK_STATES.NOT_ANSWERED, "toString"), null);
});

test("ninguna transición devuelve un estado fuera del modelo (RF-1, B2)", () => {
  const states = Object.values(BLOCK_STATES);
  const known = new Set(states);
  for (const state of states) {
    for (const event of Object.values(BLOCK_EVENTS)) {
      for (const personalized of [true, false]) {
        const next = nextBlockState(state, event, { personalized });
        assert.ok(next === null || known.has(next), `${state} + ${event} → ${next}`);
      }
    }
  }
});

test("la misma entrada devuelve siempre la misma transición (RF-1)", () => {
  const once = nextBlockState(BLOCK_STATES.NOT_ANSWERED, BLOCK_EVENTS.REVEAL, { personalized: true });
  const twice = nextBlockState(BLOCK_STATES.NOT_ANSWERED, BLOCK_EVENTS.REVEAL, { personalized: true });
  assert.equal(once, twice);
  assert.equal(once, BLOCK_STATES.EDITING);
});

test("el módulo es puro: sin React, sin DOM, sin reloj y sin red (RNF-4, RNF-9)", () => {
  const source = readFileSync(new URL("./rsvpState.js", import.meta.url), "utf8");
  for (const forbidden of [
    /\bdocument\b/,
    /\bwindow\b/,
    /\blocalStorage\b/,
    /\bfetch\s*\(/,
    /\bXMLHttpRequest\b/,
    /Date\.now/,
    /new Date\(\s*\)/,
    /import\.meta/,
    /from "react"/,
    /from "\.\.\/services\//,
    /from "\.\.\/hooks\//,
  ]) {
    assert.doesNotMatch(source, forbidden, `el módulo usa ${forbidden}`);
  }
});
