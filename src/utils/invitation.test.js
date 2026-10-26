// Pruebas de `invitation.js` (RF-2, RF-5, RF-6, RF-9, RF-12, RF-13).
//
// La app **no** deduce el tipo ni el cupo: los recibe ya resueltos del servicio (D20). La
// comparación normalizada del código (sin distinguir mayúsculas) es del **servicio** (D24):
// aquí solo se comprueba que la app lo **recorta**.
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import test from "node:test";

import { GUEST_TYPES, NO_LIMIT, SERVICE_ERRORS } from "../constants/contract.js";
import {
  INVITATION_TYPES,
  attendeeLimits,
  formatSeats,
  guestLimit,
  interpretInvitation,
  interpretLookup,
  isWithinGuestLimit,
  readGuestCode,
  reservedSeats,
  seatsText,
} from "./invitation.js";

// Respuestas de ejemplo del servicio (plan §7) con datos **ficticios**.
const PERSONAL_RESULT = {
  ok: true,
  action: "resolve",
  type: GUEST_TYPES.PERSONAL,
  guest: { name: "Titular Ejemplo", partner: "Acompañante Ejemplo", adultsGuests: 2, childGuests: 1 },
  limit: null,
  response: null,
  deadline: "2027-10-25T23:59:59-06:00",
};

const GENERIC_RESULT = {
  ok: true,
  action: "resolve",
  type: GUEST_TYPES.GENERIC,
  guest: {},
  limit: 3,
  response: null,
  deadline: null,
};

const PUBLIC_RESULT = {
  ok: true,
  action: "resolve",
  type: GUEST_TYPES.PUBLIC,
  guest: {},
  limit: NO_LIMIT,
  response: null,
  deadline: null,
};

const resolveError = (code) => ({ ok: false, action: "resolve", code });

test("readGuestCode lee el parámetro `guest` y lo recorta (RF-2)", () => {
  assert.equal(readGuestCode(new URLSearchParams("guest=inv-0001")), "inv-0001");
  // Recorta los extremos, pero **no** cambia mayúsculas: la comparación normalizada es del
  // servicio (D24).
  assert.equal(readGuestCode(new URLSearchParams("guest=%20%20AbC-0001%20%20")), "AbC-0001");
  assert.equal(readGuestCode({ guest: "gen-0007" }), "gen-0007");
});

test("readGuestCode: ausencia o vacío → null; los parámetros jubilados no valen (RF-2)", () => {
  assert.equal(readGuestCode(new URLSearchParams("")), null);
  assert.equal(readGuestCode(new URLSearchParams("guest=%20%20")), null);
  assert.equal(readGuestCode(new URLSearchParams("codigo=inv-0001")), null);
  assert.equal(readGuestCode(new URLSearchParams("code=inv-0001")), null);
  assert.equal(readGuestCode(new URLSearchParams("inv=inv-0001")), null);
  assert.equal(readGuestCode(null), null);
});

test("interpretInvitation: sin invitación no personaliza nada (RF-12)", () => {
  const invitation = interpretInvitation(resolveError("UNKNOWN_WEDDING"));
  assert.equal(invitation.type, INVITATION_TYPES.NONE);
  assert.equal(invitation.errorCode, "UNKNOWN_WEDDING");
  assert.equal(invitation.guestName, null);
  assert.equal(invitation.partnerName, null);
  assert.equal(invitation.adultsGuests, null);
  assert.equal(invitation.childGuests, null);
  assert.equal(invitation.limit, null);
  assert.equal(invitation.previousResponse, null);
  assert.equal(invitation.deadline, null);
});

test("interpretInvitation devuelve cada código de error del contrato tal cual (RF-12)", () => {
  for (const entry of SERVICE_ERRORS.filter((error) => error.code !== "OK")) {
    const invitation = interpretInvitation(resolveError(entry.code));
    assert.equal(invitation.errorCode, entry.code, `no devuelve ${entry.code}`);
    assert.equal(invitation.type, INVITATION_TYPES.NONE);
  }
  // Una respuesta que no respeta el contrato es «servicio no disponible» (D25).
  assert.equal(interpretInvitation({ ok: false }).errorCode, "SERVICE_UNAVAILABLE");
  assert.equal(interpretInvitation(null).errorCode, "SERVICE_UNAVAILABLE");
});

test("interpretInvitation recibe el tipo ya resuelto, sin deducirlo (RF-5, D20)", () => {
  assert.equal(interpretInvitation(PERSONAL_RESULT).type, INVITATION_TYPES.PERSONALIZED);
  assert.equal(interpretInvitation(GENERIC_RESULT).type, INVITATION_TYPES.GENERIC);
  assert.equal(interpretInvitation(PUBLIC_RESULT).type, INVITATION_TYPES.PUBLIC);
  assert.equal(INVITATION_TYPES.PERSONALIZED, GUEST_TYPES.PERSONAL);
});

test("la personalizada precarga titular, acompañante, cupos y plazo (RF-6)", () => {
  const invitation = interpretInvitation(PERSONAL_RESULT);
  assert.equal(invitation.errorCode, null);
  assert.equal(invitation.guestName, "Titular Ejemplo");
  assert.equal(invitation.partnerName, "Acompañante Ejemplo");
  assert.equal(invitation.adultsGuests, 2);
  assert.equal(invitation.childGuests, 1);
  assert.equal(invitation.limit, null);
  assert.equal(invitation.deadline, "2027-10-25T23:59:59-06:00");
  assert.equal(reservedSeats(invitation), 3);
  assert.equal(guestLimit(invitation), 3);
  assert.equal(invitation.seatsText, "3 lugares");
});

test("la personalizada sin acompañante y sin niños vale por cero niños (RF-9, RF-13)", () => {
  const invitation = interpretInvitation({
    ...PERSONAL_RESULT,
    guest: { name: "Titular Ejemplo", adultsGuests: 2 },
  });
  assert.equal(invitation.partnerName, null);
  assert.equal(invitation.childGuests, 0);
  assert.equal(invitation.seatsText, "2 lugares");
});

test("los asistentes ausentes o vacíos en la respuesta se leen como cero y no invalidan la invitación (RF-19, RF-20)", () => {
  const invitation = interpretInvitation({
    ...PERSONAL_RESULT,
    response: {
      state: "accepted",
      adultsAttendees: "",
      childAttendees: null,
      message: "",
      restrictions: null,
      datetime: "",
    },
  });
  assert.equal(invitation.type, INVITATION_TYPES.PERSONALIZED);
  assert.equal(invitation.errorCode, null);
  assert.deepEqual(invitation.previousResponse, {
    state: "accepted",
    adultsAttendees: 0,
    childAttendees: 0,
    message: null,
    restrictions: null,
    datetime: null,
  });
});

test("{ type: 'generic', limit: 'n' } (caída de D29) se acepta como sin tope: guestLimit, seatsText, attendeeLimits (RF-19)", () => {
  const invitation = interpretInvitation({ ...GENERIC_RESULT, limit: NO_LIMIT });
  assert.equal(invitation.type, INVITATION_TYPES.GENERIC);
  assert.equal(invitation.errorCode, null);
  assert.equal(invitation.limit, NO_LIMIT);
  assert.equal(guestLimit(invitation), Infinity);
  assert.equal(seatsText(invitation), "sin tope");
  assert.deepEqual(attendeeLimits(invitation), { adults: NO_LIMIT, children: 0 });
  assert.equal(isWithinGuestLimit(250, guestLimit(invitation)), true);
});

test("la personalizada con cupo cero solo cabe rechazar (RF-9, D21)", () => {
  const invitation = interpretInvitation({
    ...PERSONAL_RESULT,
    guest: { name: "Titular Ejemplo", adultsGuests: 0, childGuests: 0 },
  });
  assert.equal(invitation.adultsGuests, 0);
  assert.equal(guestLimit(invitation), 0);
  assert.equal(reservedSeats(invitation), 0);
  assert.equal(invitation.seatsText, "sin lugares");
  assert.equal(isWithinGuestLimit(0, guestLimit(invitation)), true);
});

test("la personalizada con respuesta previa la devuelve para poder editarla (RF-6)", () => {
  const invitation = interpretInvitation({
    ...PERSONAL_RESULT,
    response: {
      state: "accepted",
      adultsAttendees: 2,
      childAttendees: 0,
      message: "Un mensaje",
      restrictions: "Sin gluten",
      datetime: "2027-09-01T10:00:00-06:00",
    },
  });
  assert.deepEqual(invitation.previousResponse, {
    state: "accepted",
    adultsAttendees: 2,
    childAttendees: 0,
    message: "Un mensaje",
    restrictions: "Sin gluten",
    datetime: "2027-09-01T10:00:00-06:00",
  });
});

test("un estado vacío o `viewed` no es una respuesta previa (RF-10)", () => {
  assert.equal(interpretInvitation(PERSONAL_RESULT).previousResponse, null);
  assert.equal(
    interpretInvitation({ ...PERSONAL_RESULT, response: { state: "viewed" } }).previousResponse,
    null,
  );
  assert.equal(
    interpretInvitation({ ...PERSONAL_RESULT, response: {} }).previousResponse,
    null,
  );
});

test("un estado desconocido falla de forma visible (RF-13)", () => {
  const invitation = interpretInvitation({ ...PERSONAL_RESULT, response: { state: "quizas" } });
  assert.equal(invitation.type, INVITATION_TYPES.NONE);
  assert.equal(invitation.errorCode, "INVALID_DATA");
});

test("un tipo que no es uno de los tres falla de forma visible (RF-5, RF-13)", () => {
  for (const type of [undefined, null, "", "personalizada", "reutilizable"]) {
    const invitation = interpretInvitation({ ...PERSONAL_RESULT, type });
    assert.equal(invitation.type, INVITATION_TYPES.NONE, `acepta el tipo ${type}`);
    assert.equal(invitation.errorCode, "INVALID_DATA");
  }
});

test("la personalizada sin nombre o con cupos ilegibles falla de forma visible (RF-13)", () => {
  const invalid = [
    { name: "" , adultsGuests: 2 },
    { adultsGuests: 2 },
    { name: "Titular Ejemplo" },
    { name: "Titular Ejemplo", adultsGuests: -1 },
    { name: "Titular Ejemplo", adultsGuests: "dos" },
    { name: "Titular Ejemplo", adultsGuests: 2, childGuests: -1 },
    { name: "Titular Ejemplo", adultsGuests: 2, childGuests: "dos" },
  ];
  for (const guest of invalid) {
    const invitation = interpretInvitation({ ...PERSONAL_RESULT, guest });
    assert.equal(invitation.errorCode, "INVALID_DATA", `acepta ${JSON.stringify(guest)}`);
  }
});

test("la genérica y la pública traen el límite del código, sin nombre ni cupo (RF-5, RF-6)", () => {
  const generic = interpretInvitation(GENERIC_RESULT);
  assert.equal(generic.type, INVITATION_TYPES.GENERIC);
  assert.equal(generic.guestName, null);
  assert.equal(generic.partnerName, null);
  assert.equal(generic.adultsGuests, null);
  assert.equal(generic.childGuests, null);
  assert.equal(generic.limit, 3);
  assert.equal(generic.previousResponse, null);
  assert.equal(generic.deadline, null);
  assert.equal(reservedSeats(generic), null);
  assert.equal(guestLimit(generic), 3);
  assert.equal(generic.seatsText, "3 lugares");

  const publicInvitation = interpretInvitation(PUBLIC_RESULT);
  assert.equal(publicInvitation.type, INVITATION_TYPES.PUBLIC);
  assert.equal(publicInvitation.limit, NO_LIMIT);
  assert.equal(guestLimit(publicInvitation), Infinity);
  assert.equal(publicInvitation.seatsText, "sin tope");
});

test("la genérica admite `n` (sin tope) igual que la pública (RF-17, D22; 004 RF-9/D12)", () => {
  // El código reservado `PUBLIC` con `limit = "n"` en una boda genérica vale por **sin tope**
  // (RF-17): la app **no** descarta esa invitación y el tipo sigue siendo genérico (no se
  // convierte en pública). El resto de la lectura lo trata como «sin tope» sin mirar el tipo.
  const invitation = interpretInvitation({ ...GENERIC_RESULT, limit: NO_LIMIT });
  assert.equal(invitation.type, INVITATION_TYPES.GENERIC);
  assert.equal(invitation.errorCode, null);
  assert.equal(invitation.limit, NO_LIMIT);
  assert.equal(guestLimit(invitation), Infinity);
  assert.equal(invitation.seatsText, "sin tope");
  assert.deepEqual(attendeeLimits(invitation, NO_LIMIT), { adults: NO_LIMIT, children: 0 });
  assert.equal(isWithinGuestLimit(200, guestLimit(invitation)), true);
});

test("un límite de código inválido falla de forma visible (RF-9, RF-13, D21)", () => {
  // El límite ilegible de la genérica **sigue** siendo un dato fuera de contrato: el código
  // `MALFORMED_GUEST` lo emite el **servicio** al resolver (RF-16); la app solo lee.
  for (const limit of [0, -1, "0", "x", "tres", null, undefined, ""]) {
    const invitation = interpretInvitation({ ...GENERIC_RESULT, limit });
    assert.equal(invitation.errorCode, "INVALID_DATA", `acepta el límite ${limit} en la genérica`);
  }
  // La pública (y desde RF-17 la genérica) solo admiten `n` o un entero mayor que cero.
  for (const limit of [3, 0, "N", "PUBLIC", null, undefined]) {
    const invitation = interpretInvitation({ ...PUBLIC_RESULT, limit });
    const expected = limit === 3 ? 3 : null;
    assert.equal(invitation.limit, expected, `interpreta el límite ${limit} de la pública`);
  }
  for (const limit of [0, "N", "PUBLIC", null, undefined]) {
    const invitation = interpretInvitation({ ...PUBLIC_RESULT, limit });
    assert.equal(invitation.errorCode, "INVALID_DATA", `acepta el límite ${limit} en la pública`);
  }
});

// --- Consulta por teléfono (`lookup`, spec 005: RF-4, RF-5, RF-8, RF-10; D5, DT-2, M2) ---

// Respuestas de ejemplo de la consulta: el modelo de `resolve` **sin** objeto `guest` (la
// genérica y la pública no precargan titular ni cupo) y con `name` dentro de `response`.
const LOOKUP_GENERIC = {
  ok: true,
  action: "lookup",
  type: GUEST_TYPES.GENERIC,
  limit: 3,
  response: null,
  deadline: null,
};

const LOOKUP_PUBLIC = { ...LOOKUP_GENERIC, type: GUEST_TYPES.PUBLIC, limit: NO_LIMIT };

const LOOKUP_GENERIC_NO_LIMIT = { ...LOOKUP_GENERIC, limit: NO_LIMIT };

const LOOKUP_ROW = {
  name: "  Invitada Ficticia  ",
  state: "accepted",
  adultsAttendees: 2,
  childAttendees: 0,
  message: "Un mensaje",
  restrictions: "Sin gluten",
  datetime: "2027-09-01T10:00:00-06:00",
};

const lookupError = (code) => ({ ok: false, action: "lookup", code });

test("interpretLookup: sin fila es una primera respuesta, no un error (RF-5, RF-8)", () => {
  const lookup = interpretLookup(LOOKUP_GENERIC);
  assert.equal(lookup.ok, true);
  assert.equal(lookup.errorCode, null);
  assert.equal(lookup.type, INVITATION_TYPES.GENERIC);
  assert.equal(lookup.limit, 3);
  assert.equal(lookup.deadline, null);
  assert.equal(lookup.previousResponse, null);
  // `guest` **no** existe en la consulta: no hay titular ni cupo que precargar (DT-2).
  assert.equal("guest" in lookup, false);
});

test("interpretLookup: una fila sin respuesta vale por primera respuesta (RF-5)", () => {
  assert.equal(
    interpretLookup({ ...LOOKUP_GENERIC, response: { state: "viewed", name: "Invitada Ficticia" } })
      .previousResponse,
    null,
  );
  assert.equal(interpretLookup({ ...LOOKUP_GENERIC, response: {} }).previousResponse, null);
  assert.equal(interpretLookup(LOOKUP_GENERIC).previousResponse, null);
});

test("interpretLookup devuelve el modelo de la respuesta **más** `name` (RF-8, DT-2, M9)", () => {
  const lookup = interpretLookup({ ...LOOKUP_GENERIC, deadline: "2027-10-25T23:59:59-06:00", response: LOOKUP_ROW });
  assert.equal(lookup.ok, true);
  assert.equal(lookup.errorCode, null);
  assert.equal(lookup.deadline, "2027-10-25T23:59:59-06:00");
  assert.deepEqual(lookup.previousResponse, {
    name: "Invitada Ficticia",
    state: "accepted",
    adultsAttendees: 2,
    childAttendees: 0,
    message: "Un mensaje",
    restrictions: "Sin gluten",
    datetime: "2027-09-01T10:00:00-06:00",
  });
});

test("interpretLookup: un nombre que falta no invalida la fila (RF-8, DT-2)", () => {
  const lookup = interpretLookup({
    ...LOOKUP_GENERIC,
    response: { state: "accepted", adultsAttendees: 1 },
  });
  assert.equal(lookup.ok, true);
  assert.equal(lookup.previousResponse.name, null);
  assert.equal(lookup.previousResponse.message, null);
  assert.equal(lookup.previousResponse.adultsAttendees, 1);
});

test("interpretLookup: el teléfono no viaja en la respuesta (RF-6, RNF-2)", () => {
  // La app ya lo tiene en la página: por eso no se devuelve (M9).
  assert.equal("phone" in interpretLookup({ ...LOOKUP_GENERIC, response: LOOKUP_ROW }), false);
  // Aunque el servicio lo colara, no se propaga al modelo de la respuesta.
  const lookup = interpretLookup({
    ...LOOKUP_GENERIC,
    response: { ...LOOKUP_ROW, phone: "5512345678" },
  });
  assert.equal("phone" in lookup.previousResponse, false);
});

test("interpretLookup: la pública viaja con `n` sin tope (RF-8, M2)", () => {
  const lookup = interpretLookup(LOOKUP_PUBLIC);
  assert.equal(lookup.type, INVITATION_TYPES.PUBLIC);
  assert.equal(lookup.limit, NO_LIMIT);
  // Un entero mayor que cero también es un límite legible (la regla del **tipo** es del
  // servicio: él emitiría `MALFORMED_GUEST`, RF-16; la app solo lee el número).
  assert.equal(interpretLookup({ ...LOOKUP_PUBLIC, limit: 4 }).limit, 4);
});

test("interpretLookup: la genérica sin tope (`n`) no se descarta (RF-17, D22)", () => {
  // La consulta de un código `PUBLIC` con `"n"` en una boda genérica devuelve el mismo modelo
  // que la pública: la app lo acepta y el tipo sigue siendo genérico (RF-17).
  const lookup = interpretLookup(LOOKUP_GENERIC_NO_LIMIT);
  assert.equal(lookup.ok, true);
  assert.equal(lookup.errorCode, null);
  assert.equal(lookup.type, INVITATION_TYPES.GENERIC);
  assert.equal(lookup.limit, NO_LIMIT);
});

test("interpretLookup: la consulta no aplica a la personalizada ni a un tipo ajeno (RF-8)", () => {
  for (const type of [GUEST_TYPES.PERSONAL, "personalizada", "", null, undefined]) {
    const lookup = interpretLookup({ ...LOOKUP_GENERIC, type });
    assert.equal(lookup.ok, false, `acepta el tipo ${type}`);
    assert.equal(lookup.errorCode, "INVALID_DATA");
    assert.equal(lookup.type, null);
    assert.equal(lookup.limit, null);
    assert.equal(lookup.previousResponse, null);
  }
});

test("interpretLookup: un límite o un estado fuera de contrato fallan visiblemente (RF-8, RF-13)", () => {
  // Un límite que no sea legible ni `n` sigue siendo un dato fuera de contrato (el
  // `MALFORMED_GUEST` del servicio es cosa suya, RF-16); el `"n"` se acepta en ambas.
  for (const limit of [0, -1, "0", "x", "tres", null, undefined]) {
    assert.equal(
      interpretLookup({ ...LOOKUP_GENERIC, limit }).errorCode,
      "INVALID_DATA",
      `acepta el límite ${limit} en la genérica`,
    );
  }
  for (const limit of [0, -1, "0", "N", null, undefined]) {
    assert.equal(
      interpretLookup({ ...LOOKUP_PUBLIC, limit }).errorCode,
      "INVALID_DATA",
      `acepta el límite ${limit} en la pública`,
    );
  }
  for (const state of ["quizas", 1, true]) {
    const lookup = interpretLookup({ ...LOOKUP_GENERIC, response: { state } });
    assert.equal(lookup.errorCode, "INVALID_DATA", `acepta el estado ${state}`);
  }
});

test("interpretLookup devuelve cada código de error de la consulta tal cual (RF-8, M4)", () => {
  for (const entry of SERVICE_ERRORS.filter((error) => error.code !== "OK")) {
    const lookup = interpretLookup(lookupError(entry.code));
    assert.equal(lookup.ok, false);
    assert.equal(lookup.errorCode, entry.code, `no devuelve ${entry.code}`);
    assert.equal(lookup.previousResponse, null);
  }
  // El cliente (`services/registration.js`) devuelve `errorCode` cuando no hubo respuesta
  // válida (D25); una respuesta que no respeta el contrato es «servicio no disponible».
  assert.equal(interpretLookup({ ok: false, errorCode: "INVALID_PHONE" }).errorCode, "INVALID_PHONE");
  assert.equal(interpretLookup({ ok: false }).errorCode, "SERVICE_UNAVAILABLE");
  assert.equal(interpretLookup(null).errorCode, "SERVICE_UNAVAILABLE");
});

test("attendeeLimits: la personalizada usa sus cupos; la genérica y la pública, su límite (RF-4)", () => {
  assert.deepEqual(attendeeLimits(interpretInvitation(PERSONAL_RESULT), 5), { adults: 2, children: 1 });
  assert.deepEqual(attendeeLimits(interpretInvitation(GENERIC_RESULT), 3), { adults: 3, children: 0 });
  assert.deepEqual(attendeeLimits(interpretInvitation(GENERIC_RESULT), null), { adults: 3, children: 0 });
  // La genérica y la pública no ofrecen niños (D12).
  assert.deepEqual(attendeeLimits(interpretInvitation(PUBLIC_RESULT), NO_LIMIT), {
    adults: NO_LIMIT,
    children: 0,
  });
});

test("attendeeLimits: manda la consulta cuando difiere de la resolución (RF-4, M2)", () => {
  const resolved = interpretInvitation(GENERIC_RESULT); // límite 3
  assert.deepEqual(attendeeLimits(resolved, 5), { adults: 5, children: 0 });
  assert.deepEqual(attendeeLimits(resolved, 1), { adults: 1, children: 0 });
  // `n` viaja tal cual (sin tope: campo libre) y una consulta sin límite usa el resuelto.
  assert.deepEqual(attendeeLimits(interpretInvitation(PUBLIC_RESULT), 4), { adults: 4, children: 0 });
  assert.deepEqual(attendeeLimits(interpretInvitation(PUBLIC_RESULT), NO_LIMIT), {
    adults: NO_LIMIT,
    children: 0,
  });
  assert.deepEqual(attendeeLimits(resolved), { adults: 3, children: 0 });
});

test("attendeeLimits: sin invitación no hay ningún cupo que ofrecer (RF-4)", () => {
  assert.deepEqual(attendeeLimits(interpretInvitation(resolveError("UNKNOWN_WEDDING")), 3), {
    adults: 0,
    children: 0,
  });
  assert.deepEqual(attendeeLimits(null, null), { adults: 0, children: 0 });
});

test("seatsText y guestLimit en español, con `n` = sin tope (RF-9)", () => {
  assert.equal(seatsText({ type: INVITATION_TYPES.PERSONALIZED, adultsGuests: 1, childGuests: 0 }), "1 lugar");
  assert.equal(seatsText({ type: INVITATION_TYPES.PERSONALIZED, adultsGuests: 0, childGuests: 0 }), "sin lugares");
  assert.equal(seatsText({ type: INVITATION_TYPES.GENERIC, limit: 4 }), "4 lugares");
  assert.equal(seatsText({ type: INVITATION_TYPES.PUBLIC, limit: NO_LIMIT }), "sin tope");
  assert.equal(guestLimit({ type: INVITATION_TYPES.NONE }), 0);
});

test("isWithinGuestLimit incluye el borde y no acepta cifras inválidas (RF-9)", () => {
  assert.equal(isWithinGuestLimit(2, 2), true);
  assert.equal(isWithinGuestLimit(3, 2), false);
  assert.equal(isWithinGuestLimit(0, 0), true);
  assert.equal(isWithinGuestLimit(0, -1), false);
  assert.equal(isWithinGuestLimit(-1, 2), false);
  assert.equal(isWithinGuestLimit(12, Infinity), true);
  assert.equal(isWithinGuestLimit("dos", 2), false);
});

test("formatSeats en español (RF-9)", () => {
  assert.equal(formatSeats(1), "1 lugar");
  assert.equal(formatSeats(4), "4 lugares");
  assert.equal(formatSeats(0), "sin lugares");
  assert.equal(formatSeats(null), "un lugar");
});

test("el módulo es puro: sin DOM, sin reloj y sin red (RNF-9)", () => {
  const source = readFileSync(new URL("./invitation.js", import.meta.url), "utf8");
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
  ]) {
    assert.doesNotMatch(source, forbidden, `el módulo usa ${forbidden}`);
  }
});
