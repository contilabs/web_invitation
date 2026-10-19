// Pruebas de `rsvp.js` (RF-8, RF-9, RF-14): teléfono, validación previa al envío y cuerpo
// del envío. Nada de aquí toca la red: la llamada vive en `services/` (RNF-9).
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  GUEST_TYPES,
  LOOKUP_FIELDS,
  NO_LIMIT,
  REQUEST_FIELDS,
  RESPONSE_STATES,
  SERVICE_ACTIONS,
  SERVICE_ERRORS,
} from "../constants/contract.js";
import { interpretInvitation, interpretLookup } from "./invitation.js";
import {
  attendeeOptions,
  attendeeValue,
  attendanceForm,
  interpretRsvpResult,
  isPhoneComplete,
  lookupPayload,
  phoneDigits,
  rsvpPayload,
  validateRsvp,
} from "./rsvp.js";

// Invitaciones de ejemplo, resueltas con la misma función que usa la interfaz (datos ficticios).
const personalized = (guest) =>
  interpretInvitation({
    ok: true,
    action: "resolve",
    type: GUEST_TYPES.PERSONAL,
    guest: { name: "Titular Ejemplo", adultsGuests: 2, childGuests: 1, ...guest },
    response: null,
    deadline: null,
  });

const generic = (limit) =>
  interpretInvitation({
    ok: true,
    action: "resolve",
    type: GUEST_TYPES.GENERIC,
    guest: {},
    limit,
    response: null,
    deadline: null,
  });

const publicInvitation = () =>
  interpretInvitation({
    ok: true,
    action: "resolve",
    type: GUEST_TYPES.PUBLIC,
    guest: {},
    limit: NO_LIMIT,
    response: null,
    deadline: null,
  });

const codes = SERVICE_ERRORS.map((error) => error.code);

test("phoneDigits deja solo los dígitos (RF-8, D23)", () => {
  assert.equal(phoneDigits("55 1234 5678"), "5512345678");
  assert.equal(phoneDigits("(55) 1234-5678"), "5512345678");
  assert.equal(phoneDigits("+52 55 1234 5678"), "525512345678");
  assert.equal(phoneDigits(""), "");
  assert.equal(phoneDigits(null), "");
  assert.equal(phoneDigits(undefined), "");
  assert.equal(phoneDigits("sin números"), "");
});

test("isPhoneComplete exige exactamente diez dígitos (RF-8, D23)", () => {
  assert.equal(isPhoneComplete("5512345678"), true);
  assert.equal(isPhoneComplete("55 1234 5678"), true);
  assert.equal(isPhoneComplete("551234567"), false);
  assert.equal(isPhoneComplete("55123456789"), false);
  assert.equal(isPhoneComplete("+52 55 1234 5678"), false);
  assert.equal(isPhoneComplete(""), false);
  assert.equal(isPhoneComplete(null), false);
});

test("la personalizada se envía con sus cupos y sin teléfono (RF-7, RF-8)", () => {
  const invitation = personalized();
  assert.deepEqual(validateRsvp({ response: "confirmed", adults: 2, children: 1 }, invitation), {
    ok: true,
    errorCode: null,
  });
  // El borde del cupo es válido.
  assert.equal(validateRsvp({ response: "confirmed", adults: 2, children: 0 }, invitation).ok, true);
  // Sin nombre ni teléfono: en la personalizada no se piden (RF-5).
  assert.equal(validateRsvp({ response: "confirmed", adults: 1 }, invitation).ok, true);
});

test("la personalizada no admite más asistentes que su cupo (RF-9)", () => {
  const invitation = personalized();
  assert.equal(validateRsvp({ response: "confirmed", adults: 3, children: 0 }, invitation).errorCode, "OVER_LIMIT");
  assert.equal(validateRsvp({ response: "confirmed", adults: 1, children: 2 }, invitation).errorCode, "OVER_LIMIT");
  assert.equal(validateRsvp({ response: "confirmed", adults: 1, children: -1 }, invitation).errorCode, "OVER_LIMIT");
  assert.equal(validateRsvp({ response: "confirmed", adults: "dos", children: 0 }, invitation).errorCode, "OVER_LIMIT");
});

test("con cupo cero solo cabe rechazar (RF-9, D21)", () => {
  const invitation = personalized({ adultsGuests: 0, childGuests: 0 });
  assert.equal(validateRsvp({ response: "confirmed", adults: 0, children: 0 }, invitation).errorCode, "OVER_LIMIT");
  assert.equal(validateRsvp({ response: "rejected", adults: 0, children: 0 }, invitation).ok, true);
});

test("la genérica exige nombre y teléfono, también al rechazar (RF-8, D26)", () => {
  const invitation = generic(3);
  assert.equal(validateRsvp({ response: "confirmed", adults: 2 }, invitation).errorCode, "MISSING_FIELDS");
  assert.equal(
    validateRsvp({ response: "confirmed", name: "Invitada Ficticia", adults: 2 }, invitation).errorCode,
    "MISSING_FIELDS",
  );
  assert.equal(
    validateRsvp({ response: "rejected", name: "Invitada Ficticia" }, invitation).errorCode,
    "MISSING_FIELDS",
  );
  assert.equal(
    validateRsvp({ response: "rejected", phone: "5512345678" }, invitation).errorCode,
    "MISSING_FIELDS",
  );
  assert.equal(validateRsvp({ response: "rejected" }, invitation).errorCode, "MISSING_FIELDS");
});

test("un teléfono que no llega a diez dígitos se rechaza antes de enviar (RF-8, D23)", () => {
  const invitation = generic(3);
  const form = { response: "confirmed", name: "Invitada Ficticia", adults: 2 };
  assert.equal(validateRsvp({ ...form, phone: "551234567" }, invitation).errorCode, "INVALID_PHONE");
  assert.equal(validateRsvp({ ...form, phone: "55123456789" }, invitation).errorCode, "INVALID_PHONE");
  assert.equal(validateRsvp({ ...form, phone: "+52 55 1234 5678" }, invitation).errorCode, "INVALID_PHONE");
  assert.equal(validateRsvp({ ...form, phone: "5512345678" }, invitation).ok, true);
});

test("la genérica acota los asistentes a su límite (RF-9)", () => {
  const invitation = generic(3);
  const form = { response: "confirmed", name: "Invitada Ficticia", phone: "5512345678" };
  assert.equal(validateRsvp({ ...form, adults: 3 }, invitation).ok, true);
  assert.equal(validateRsvp({ ...form, adults: 4 }, invitation).errorCode, "OVER_LIMIT");
  assert.equal(validateRsvp({ ...form, adults: 0 }, invitation).errorCode, "OVER_LIMIT");
  assert.equal(validateRsvp({ ...form }, invitation).errorCode, "OVER_LIMIT");
});

test("la pública (`n`) no tiene tope: la app no inventa un máximo (RF-9, D12)", () => {
  const invitation = publicInvitation();
  const form = { response: "confirmed", name: "Invitada Ficticia", phone: "5512345678" };
  assert.equal(validateRsvp({ ...form, adults: 12 }, invitation).ok, true);
  assert.equal(validateRsvp({ ...form, adults: 200 }, invitation).ok, true);
  assert.equal(validateRsvp({ ...form }, invitation).errorCode, "OVER_LIMIT");
});

// La asistencia elegida es obligatoria (RF-11, R11): la garantía **no** es el `required` de
// los radios del navegador —eso es una ayuda—, sino esta validación pura. Un formulario sin
// elegir asistencia recibiría, si no, un **rechazo silencioso** del servicio (trata cualquier
// respuesta distinta de `confirmed` como `rejected`).
test("sin asistencia elegida no se envía: lo rechaza la validación previa (RF-11, R11)", () => {
  const invitation = generic(3);
  const form = { name: "Invitada Ficticia", phone: "5512345678", adults: 2 };
  for (const response of ["", "   ", null, undefined, "si", "no", "CONFIRMED", "atenderé"]) {
    assert.equal(
      validateRsvp({ ...form, response }, invitation).errorCode,
      "INVALID_RESPONSE",
      `no rechaza con la asistencia «${String(response)}»`,
    );
  }
  // Falta el campo `response` entero (ni siquiera llega).
  const { response: _omitted, ...withoutResponse } = form;
  assert.equal(validateRsvp(withoutResponse, invitation).errorCode, "INVALID_RESPONSE");
  // En la **personalizada** pasa lo mismo: no pide nombre ni teléfono pero sí una asistencia.
  const personal = personalized();
  assert.equal(validateRsvp({ adults: 2, children: 1 }, personal).errorCode, "INVALID_RESPONSE");
  assert.equal(validateRsvp({ response: "", adults: 2 }, personal).errorCode, "INVALID_RESPONSE");
  // Y en la **pública** (`n`), también.
  assert.equal(
    validateRsvp({ response: "", name: "Invitada Ficticia", phone: "5512345678", adults: 2 }, publicInvitation())
      .errorCode,
    "INVALID_RESPONSE",
  );
  // El código es el **existente** del contrato: no se añade ninguno (R11).
  assert.ok(codes.includes("INVALID_RESPONSE"));
  // Un valor con espacios alrededor **sí** es válido: el texto se recorta como en el resto
  // del módulo (`text`), no es una asistencia distinta.
  assert.equal(validateRsvp({ ...form, response: " rejected " }, invitation).ok, true);
});

test("el orden de la validación se conserva: asistencia después de nombre y teléfono (RF-11, R11)", () => {
  const invitation = generic(3);
  // Sin nombre o sin teléfono manda `MISSING_FIELDS`, aunque tampoco haya asistencia elegida.
  assert.equal(validateRsvp({ response: "", adults: 2 }, invitation).errorCode, "MISSING_FIELDS");
  assert.equal(validateRsvp({ response: "", name: "Invitada Ficticia" }, invitation).errorCode, "MISSING_FIELDS");
  // Un teléfono mal formado manda `INVALID_PHONE`, antes que la asistencia.
  assert.equal(
    validateRsvp({ response: "", name: "Invitada Ficticia", phone: "551234567" }, invitation).errorCode,
    "INVALID_PHONE",
  );
  // Un rechazo **válido** sigue pasando sin mirar los asistentes (D26 intacta).
  assert.equal(
    validateRsvp({ response: "rejected", name: "Invitada Ficticia", phone: "5512345678" }, invitation).ok,
    true,
  );
  // Confirmar sin ningún asistente sigue dando `OVER_LIMIT` (uno de los dos valores válidos;
  // 004 RF-9/D21 intactas).
  assert.equal(
    validateRsvp({ response: "confirmed", name: "Invitada Ficticia", phone: "5512345678", adults: 0 }, invitation)
      .errorCode,
    "OVER_LIMIT",
  );
  // Sin invitación manda su código de error propio, no el de la asistencia (RF-12).
  assert.equal(
    validateRsvp({ response: "", adults: 1 }, interpretInvitation({ ok: false, code: "UNKNOWN_GUEST" })).errorCode,
    "UNKNOWN_GUEST",
  );
});

test("sin invitación no se envía: se hereda su código de error (RF-12)", () => {
  const invitation = interpretInvitation({ ok: false, code: "UNKNOWN_GUEST" });
  const result = validateRsvp({ response: "confirmed", adults: 1 }, invitation);
  assert.equal(result.ok, false);
  assert.equal(result.errorCode, "UNKNOWN_GUEST");
  // También con un código propio de la causa «sin `guest`» (RF-12).
  assert.equal(
    validateRsvp({ response: "confirmed", adults: 1 }, interpretInvitation({ ok: false, code: "MISSING_GUEST" })).errorCode,
    "MISSING_GUEST",
  );
  assert.equal(validateRsvp({ response: "confirmed", adults: 1 }, null).errorCode, "MISSING_GUEST");
});

test("rsvpPayload usa los nombres de campo del contrato (RF-14)", () => {
  const payload = rsvpPayload({
    slug: "boda-ficticia",
    code: "gen-0007",
    response: "confirmed",
    name: "  Invitada Ficticia  ",
    phone: "(55) 1234-5678",
    adults: 2,
    children: 0,
    message: "Un mensaje",
    restrictions: "Sin gluten",
  });
  assert.deepEqual(payload, {
    action: "respond",
    slug: "boda-ficticia",
    code: "gen-0007",
    response: "confirmed",
    adults: 2,
    children: 0,
    phone: "5512345678",
    name: "Invitada Ficticia",
    message: "Un mensaje",
    restrictions: "Sin gluten",
  });
  for (const key of Object.keys(payload)) {
    assert.ok(Object.values(REQUEST_FIELDS).includes(key), `el campo ${key} no está en el contrato`);
  }
});

test("rsvpPayload: en la personalizada no manda teléfono y omite lo opcional vacío (RF-8)", () => {
  const payload = rsvpPayload({ slug: "boda-ficticia", code: "inv-0001", response: "confirmed", adults: 1, children: 0 });
  assert.equal(REQUEST_FIELDS.PHONE in payload, false);
  assert.equal(REQUEST_FIELDS.NAME in payload, false);
  assert.equal(REQUEST_FIELDS.MESSAGE in payload, false);
  assert.equal(REQUEST_FIELDS.RESTRICTIONS in payload, false);
  assert.equal(payload[REQUEST_FIELDS.ACTION], "respond");
  assert.equal(payload[REQUEST_FIELDS.ADULTS], 1);
  assert.equal(payload[REQUEST_FIELDS.RESPONSE], "confirmed");
});

// Un rechazo **no** envía los campos ocultos (RF-11, D18): los asistentes, las alergias y el
// mensaje no se ven al rechazar, así que no viajan, aunque el formulario los tuviera escritos
// de antes. El servicio (sin cambios) escribe los asistentes en **0** y los textos **vacíos**
// cuando no llegan, así que el contrato no cambia (RF-8 intacto).
test("rsvpPayload: un rechazo no envía los campos de la asistencia (RF-11, D18)", () => {
  const payload = rsvpPayload({
    slug: "boda-ficticia",
    code: "gen-0007",
    response: "rejected",
    name: "  Invitada Ficticia  ",
    phone: "(55) 1234-5678",
    adults: 3,
    children: 2,
    message: "Un mensaje que ya no aplica",
    restrictions: "Sin gluten",
  });
  assert.deepEqual(payload, {
    action: "respond",
    slug: "boda-ficticia",
    code: "gen-0007",
    response: "rejected",
    phone: "5512345678",
    name: "Invitada Ficticia",
  });
  // El nombre y el teléfono **sí** viajan: son obligatorios también al rechazar (004 D26).
  for (const field of [REQUEST_FIELDS.ADULTS, REQUEST_FIELDS.CHILDREN, REQUEST_FIELDS.MESSAGE, REQUEST_FIELDS.RESTRICTIONS]) {
    assert.equal(field in payload, false, `un rechazo no debe llevar ${field}`);
  }
  // Todos los campos que sí viajan son del contrato.
  for (const key of Object.keys(payload)) {
    assert.ok(Object.values(REQUEST_FIELDS).includes(key), `el campo ${key} no está en el contrato`);
  }
  // Una **confirmación** los sigue llevando como hoy (nada cambia fuera del rechazo).
  const confirmed = rsvpPayload({
    slug: "boda-ficticia",
    code: "gen-0007",
    response: "confirmed",
    name: "Invitada Ficticia",
    phone: "5512345678",
    adults: 3,
    children: 2,
    message: "Un mensaje",
    restrictions: "Sin gluten",
  });
  assert.equal(confirmed[REQUEST_FIELDS.ADULTS], 3);
  assert.equal(confirmed[REQUEST_FIELDS.CHILDREN], 2);
  assert.equal(confirmed[REQUEST_FIELDS.MESSAGE], "Un mensaje");
  assert.equal(confirmed[REQUEST_FIELDS.RESTRICTIONS], "Sin gluten");
});

test("interpretRsvpResult distingue el resultado del envío (RF-14)", () => {
  assert.deepEqual(interpretRsvpResult({ ok: true, code: "OK" }), { ok: true, errorCode: null });
  // Las causas que solo el servicio puede detectar se devuelven tal cual.
  for (const code of ["INVALID_RESPONSE", "DEADLINE_EXPIRED", "OVER_LIMIT", "SERVICE_UNAVAILABLE", "INVALID_PHONE"]) {
    assert.deepEqual(interpretRsvpResult({ ok: false, code }), { ok: false, errorCode: code }, `no devuelve ${code}`);
  }
  // El cliente (`services/registration.js`) devuelve `errorCode` cuando no hay respuesta válida.
  assert.deepEqual(interpretRsvpResult({ ok: false, errorCode: "SERVICE_UNAVAILABLE" }), {
    ok: false,
    errorCode: "SERVICE_UNAVAILABLE",
  });
  // Una respuesta que no respeta el contrato es «servicio no disponible» (D25).
  assert.deepEqual(interpretRsvpResult(null), { ok: false, errorCode: "SERVICE_UNAVAILABLE" });
  assert.deepEqual(interpretRsvpResult({}), { ok: false, errorCode: "SERVICE_UNAVAILABLE" });
  // Todos los códigos usados existen en la tabla del contrato.
  for (const code of ["OK", "MISSING_FIELDS", "INVALID_PHONE", "OVER_LIMIT", "INVALID_RESPONSE"]) {
    assert.ok(codes.includes(code), `el código ${code} no está en el contrato`);
  }
});

// --- Consulta por teléfono y precarga (spec 005: RF-2, RF-4, RF-5, RF-8, RF-10) ---

// Respuesta de la consulta, montada con la misma función que usará la interfaz.
const lookupRow = (response) =>
  interpretLookup({
    ok: true,
    action: "lookup",
    type: GUEST_TYPES.GENERIC,
    limit: 3,
    response,
    deadline: null,
  });

const REGISTERED_ROW = {
  name: "Invitada Ficticia",
  state: "confirmed",
  adultsAttendees: 2,
  childAttendees: 0,
  message: "Un mensaje",
  restrictions: "Sin gluten",
  datetime: "2027-09-01T10:00:00-06:00",
};

test("lookupPayload arma el cuerpo de la consulta con el teléfono normalizado (RF-5, RF-8)", () => {
  const payload = lookupPayload({
    slug: "  boda-ficticia  ",
    code: " gen-0007 ",
    phone: "(55) 1234-5678",
  });
  assert.deepEqual(payload, {
    action: "lookup",
    slug: "boda-ficticia",
    code: "gen-0007",
    phone: "5512345678",
  });
  // La consulta solo manda los campos de su contrato (LOOKUP_FIELDS), ni uno más.
  for (const key of Object.keys(payload)) {
    assert.ok(Object.values(LOOKUP_FIELDS).includes(key), `el campo ${key} no está en el contrato`);
  }
  assert.equal(payload[LOOKUP_FIELDS.ACTION], SERVICE_ACTIONS.LOOKUP);
  assert.equal(payload[LOOKUP_FIELDS.ACTION], "lookup");
});

test("lookupPayload no manda nada del envío ni inventa campos (RF-8, RF-5)", () => {
  const payload = lookupPayload({ slug: "boda-ficticia", code: "gen-0007", phone: "55 1234 5678" });
  assert.deepEqual(Object.keys(payload).sort(), ["action", "code", "phone", "slug"]);
  for (const field of [REQUEST_FIELDS.RESPONSE, REQUEST_FIELDS.NAME, REQUEST_FIELDS.ADULTS]) {
    assert.equal(field in payload, false);
  }
  // Un teléfono con lada de país viaja tal cual se escribió, sin recortar (la autoridad es
  // el servicio: `INVALID_PHONE`, M4).
  assert.equal(
    lookupPayload({ slug: "boda-ficticia", code: "gen-0007", phone: "+52 55 1234 5678" })[
      LOOKUP_FIELDS.PHONE
    ],
    "525512345678",
  );
});

// Rango del combo por campo (RF-4, D4, R8; DT-13): los **adultos** se eligen de 1 al cupo —el
// 0 nunca es una confirmación válida y ofrecerlo invitaba a elegirlo (M1)— y los **niños** de
// 0 al cupo (0 niños con adultos confirmados sí es válido).
test("attendeeOptions: adultos de 1..cupo, sin el 0 (RF-4, D4, R8)", () => {
  assert.deepEqual(attendeeOptions(1, "adults"), [1]);
  assert.deepEqual(attendeeOptions(4, "adults"), [1, 2, 3, 4]);
  const wide = attendeeOptions(12, "adults");
  assert.equal(wide.length, 12);
  assert.equal(wide[0], 1);
  assert.equal(wide[wide.length - 1], 12);
});

test("attendeeOptions: niños de 0..cupo, con el 0 incluido (RF-4, D4, R8)", () => {
  assert.deepEqual(attendeeOptions(1, "children"), [0, 1]);
  assert.deepEqual(attendeeOptions(4, "children"), [0, 1, 2, 3, 4]);
  const wide = attendeeOptions(12, "children");
  assert.equal(wide.length, 13);
  assert.equal(wide[0], 0);
  assert.equal(wide[12], 12);
});

test("attendeeOptions: sin combo con cupo 0, con `n` ni con un límite ilegible (RF-4, R1)", () => {
  // Cupo 0: no hay ninguna opción que ofrecer y solo cabe rechazar (D21), para los dos campos.
  assert.equal(attendeeOptions(0, "adults"), null);
  assert.equal(attendeeOptions(0, "children"), null);
  // `n` = sin tope: campo numérico libre, la app no inventa un máximo (D12, R1).
  for (const field of ["adults", "children"]) {
    assert.equal(attendeeOptions(NO_LIMIT, field), null);
    assert.equal(attendeeOptions(Infinity, field), null);
    assert.equal(attendeeOptions(null, field), null);
    assert.equal(attendeeOptions(undefined, field), null);
    assert.equal(attendeeOptions(-1, field), null);
    assert.equal(attendeeOptions(2.5, field), null);
    assert.equal(attendeeOptions("4", field), null);
    // Un límite ilegible tampoco ofrece combo, aunque sea una cifra en texto.
    assert.equal(attendeeOptions("n", field), null);
    assert.equal(attendeeOptions("cuatro", field), null);
  }
});

// Normalización del valor fuera de rango (RF-4, R10; DT-13): la decisión vive en la lógica
// pura —no en lo que se pinta— para que lo que el invitado **ve** sea lo que **viaja**.
test("attendeeValue: una opción válida se conserva, y lo de fuera de rango vale por la menor (RF-4, R10)", () => {
  const adults = attendeeOptions(4, "adults");
  const children = attendeeOptions(4, "children");

  // Un valor que ya es una opción del combo se devuelve tal cual, como texto (el `<select>`).
  for (const value of ["1", "2", "4", 1, 4]) {
    assert.equal(attendeeValue(value, adults), String(value));
  }
  assert.equal(attendeeValue("2", children), "2");
  assert.equal(attendeeValue(0, children), "0");

  // Fuera de rango: el 0 heredado (de un rechazo o de una respuesta con 0 adultos) y las
  // cifras fuera del cupo valen por la **opción menor**: 1 en adultos y 0 en niños.
  assert.equal(attendeeValue("0", adults), "1");
  assert.equal(attendeeValue(0, adults), "1");
  assert.equal(attendeeValue("9", adults), "1");
  assert.equal(attendeeValue("-3", adults), "1");
  assert.equal(attendeeValue("dos", adults), "1");
  assert.equal(attendeeValue(null, adults), "1");
  assert.equal(attendeeValue(undefined, adults), "1");

  // En niños la opción menor es el 0, así que un valor fuera de rango se normaliza a 0.
  assert.equal(attendeeValue("9", children), "0");
  assert.equal(attendeeValue("-1", children), "0");
  assert.equal(attendeeValue("dos", children), "0");
  assert.equal(attendeeValue(null, children), "0");
});

test("attendeeValue: sin combo no hay nada que normalizar y el valor se queda tal cual (RF-4)", () => {
  // Con `n` (campo libre) o cupo 0 no hay `<select>`: no se debe reventar ni inventar un valor.
  assert.equal(attendeeValue("7", null), "7");
  assert.equal(attendeeValue("7", []), "7");
  assert.equal(attendeeValue("", null), "");
  assert.equal(attendeeValue(null, undefined), "");
  // Un valor válido del campo libre tampoco se toca.
  const free = attendeeOptions(NO_LIMIT, "adults");
  assert.equal(free, null);
  assert.equal(attendeeValue("12", free), "12");
});

test("attendanceForm: sin respuesta previa usa los valores por defecto de hoy (RF-2, RF-9)", () => {
  // La personalizada precarga su titular y sus cupos (como hoy), sin asistencia elegida.
  assert.deepEqual(attendanceForm(personalized(), null), {
    response: "",
    name: "Titular Ejemplo",
    adults: "2",
    children: "1",
    message: "",
    restrictions: "",
  });
  // La genérica y la pública arrancan en blanco: el nombre lo escribe el invitado (R2).
  assert.deepEqual(attendanceForm(generic(3), null), {
    response: "",
    name: "",
    adults: "1",
    children: "0",
    message: "",
    restrictions: "",
  });
  // Con cupo cero la personalizada sigue precargando ceros: solo cabe rechazar (D21) y no
  // hay combo de adultos, así que la normalización no aplica (004 D21).
  assert.equal(attendanceForm(personalized({ adultsGuests: 0, childGuests: 0 }), null).adults, "0");
  assert.equal(attendanceForm(personalized({ adultsGuests: 0, childGuests: 0 }), null).children, "0");
});

test("attendanceForm: precarga la fila de la consulta, con el nombre registrado (RF-5, RF-10)", () => {
  const lookup = lookupRow(REGISTERED_ROW);
  assert.deepEqual(attendanceForm(generic(3), lookup.previousResponse), {
    response: RESPONSE_STATES.CONFIRMED,
    name: "Invitada Ficticia",
    adults: "2",
    children: "0",
    message: "Un mensaje",
    restrictions: "Sin gluten",
  });
});

test("attendanceForm: precarga la respuesta previa de la personalizada con su titular (RF-2)", () => {
  const invitation = interpretInvitation({
    ok: true,
    action: "resolve",
    type: GUEST_TYPES.PERSONAL,
    guest: { name: "Titular Ejemplo", adultsGuests: 2, childGuests: 1 },
    limit: null,
    response: {
      state: "updated",
      adultsAttendees: 1,
      childAttendees: 1,
      message: "Un mensaje",
      restrictions: "Sin gluten",
      datetime: "2027-09-01T10:00:00-06:00",
    },
    deadline: null,
  });
  const form = attendanceForm(invitation, invitation.previousResponse);
  assert.equal(form.response, RESPONSE_STATES.CONFIRMED);
  // El titular de la invitación manda: la identidad de la personalizada no se cambia (RF-2),
  // aunque la respuesta previa trajera otro nombre (la consulta no aplica a ese tipo).
  assert.equal(form.name, "Titular Ejemplo");
  assert.equal(
    attendanceForm(invitation, { ...invitation.previousResponse, name: "Otro Nombre" }).name,
    "Titular Ejemplo",
  );
  assert.equal(form.adults, "1");
  assert.equal(form.children, "1");
  assert.equal(form.message, "Un mensaje");
  assert.equal(form.restrictions, "Sin gluten");
});

test("attendanceForm: un rechazo previo se precarga como «rechazar» y es reversible (RF-2)", () => {
  const lookup = lookupRow({ ...REGISTERED_ROW, state: RESPONSE_STATES.REJECTED, adultsAttendees: 0 });
  const form = attendanceForm(generic(3), lookup.previousResponse);
  assert.equal(form.response, RESPONSE_STATES.REJECTED);
  assert.equal(form.name, "Invitada Ficticia");
  // El 0 heredado de un rechazo no es una opción del combo de adultos: se normaliza a 1
  // (RF-4, R10; DT-13), y en el de niños el 0 sí es una opción válida.
  assert.equal(form.adults, "1");
  assert.equal(form.children, "0");
  assert.equal(form.message, "Un mensaje");
});

// Los adultos que lleguen fuera del rango del combo (el 0 heredado) se muestran como **1**
// (RF-4, R10; DT-13): lo que se ve es lo que se envía.
test("attendanceForm: precarga los adultos normalizados y conserva el valor fuera del rango (RF-4, R10)", () => {
  // Genérica con cupo 4: el 0 heredado de un rechazo se muestra como 1.
  const rejected = lookupRow({ ...REGISTERED_ROW, state: RESPONSE_STATES.REJECTED, adultsAttendees: 0 });
  const form = attendanceForm(generic(4), rejected.previousResponse);
  assert.equal(form.response, RESPONSE_STATES.REJECTED);
  assert.equal(form.adults, "1");

  // Personalizada con cupo de adultos 2: una respuesta con más adultos que el cupo también
  // se normaliza al menor (1)... pero un valor que **sí** es una opción del combo se conserva.
  const personalizedPrevious = {
    state: "confirmed",
    adultsAttendees: 2,
    childAttendees: 1,
    message: "",
    restrictions: "",
  };
  const personalizedForm = attendanceForm(personalized(), personalizedPrevious);
  assert.equal(personalizedForm.adults, "2");
  assert.equal(personalizedForm.children, "1");

  // Cupo de adultos 0 (sin combo, solo cabe rechazar): la normalización **no** aplica (004 D21).
  const empty = attendanceForm(personalized({ adultsGuests: 0, childGuests: 0 }), {
    state: "rejected",
    adultsAttendees: 0,
    childAttendees: 0,
    message: "",
    restrictions: "",
  });
  assert.equal(empty.adults, "0");
});

test("attendanceForm: el teléfono no forma parte de la precarga (RF-5, M8)", () => {
  // Es lo que el invitado escribió: vive en el componente y cambiarlo no borra la
  // precarga ni dispara otra consulta (M8).
  assert.equal("phone" in attendanceForm(generic(3), null), false);
  assert.equal(
    "phone" in attendanceForm(generic(3), { ...REGISTERED_ROW, phone: "5512345678" }),
    false,
  );
});

test("el módulo es puro: sin DOM, sin reloj y sin red (RNF-9)", () => {
  const source = readFileSync(new URL("./rsvp.js", import.meta.url), "utf8");
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
