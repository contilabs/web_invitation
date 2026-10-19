// Lógica pura: la invitación que devuelve el servicio de registro (RF-2, RF-5, RF-6, RF-9,
// RF-12, RF-13) y la **consulta por teléfono** de la spec 005 (`lookup`: RF-4, RF-5, RF-8).
//
// La app **no** resuelve al invitado ni deduce su tipo: recibe el modelo ya resuelto (tipo,
// cupo, límite del código, estado previo y plazo) y aquí solo se **lee** y se comprueba que
// es coherente antes de usarlo (D20, DT-3). Sin React, sin DOM, sin reloj y sin red: el
// «ahora» y la red viven en `hooks/` y `services/` (RNF-9).
//
// La comparación **normalizada** del código (sin distinguir mayúsculas) es del **servicio**
// (D24): la app solo recorta el parámetro `guest` del enlace (RF-2).

import {
  GUEST_PARAM,
  GUEST_TYPES,
  NO_LIMIT,
  NO_RESPONSE_STATES,
  RESPONSE_STATES,
  SERVICE_ERRORS,
} from "../constants/contract.js";

// Tipos que puede resolver la app. `NONE` es la **ausencia** de invitación (RF-12): el
// bloque de confirmación se muestra deshabilitado, sin personalizar nada.
export const INVITATION_TYPES = {
  PERSONALIZED: GUEST_TYPES.PERSONAL,
  GENERIC: GUEST_TYPES.GENERIC,
  PUBLIC: GUEST_TYPES.PUBLIC,
  NONE: "none",
};

// Los códigos del contrato por nombre, para no repetir literales (RF-17).
const CODES = Object.fromEntries(SERVICE_ERRORS.map(({ code }) => [code, code]));

// El tipo resuelto tiene que ser uno de los tres (RF-5, RF-13).
const SERVICE_TYPES = Object.values(GUEST_TYPES);
const RESPONSE_STATE_VALUES = Object.values(RESPONSE_STATES);

// Texto no vacío y recortado, o `null`.
function text(value) {
  if (value === null || value === undefined) return null;
  const trimmed = String(value).trim();
  return trimmed === "" ? null : trimmed;
}

// Entero ≥ 0, o `null` si no se puede interpretar (RF-13). Un valor ausente vale por cero:
// así `child_guests` vacío es «ningún niño» (RF-9).
function count(value) {
  if (value === null || value === undefined || value === "") return 0;
  const number = Number(value);
  return Number.isInteger(number) && number >= 0 ? number : null;
}

// Entero ≥ 0 **obligatorio** (RF-13): `null` cuando falta, porque un cupo que el libro no
// declara no se inventa.
function requiredCount(value) {
  if (value === null || value === undefined || value === "") return null;
  return count(value);
}

// Estado de la respuesta (RF-10): `undefined` = todavía no hay respuesta (`status` vacío o
// `viewed`), `null` = estado desconocido (RF-13), o el estado literal.
function responseState(response) {
  const state = text(response?.state);
  if (!state || NO_RESPONSE_STATES.includes(state)) return undefined;
  return RESPONSE_STATE_VALUES.includes(state) ? state : null;
}

// La respuesta previa, tal cual la devuelve el servicio, para poder editarla (RF-6).
function attendance(response, state) {
  return {
    state,
    adultsAttendees: count(response?.adultsAttendees),
    childAttendees: count(response?.childAttendees),
    message: text(response?.message),
    restrictions: text(response?.restrictions),
    datetime: text(response?.datetime),
  };
}

// Límite del código (RF-9): la genérica exige un entero mayor que cero y la pública, el
// valor especial `n` (sin tope); cualquier otra cosa es un fallo visible (RF-13, D21).
function codeLimit(type, value) {
  if (type === GUEST_TYPES.PUBLIC) {
    return text(value) === NO_LIMIT ? NO_LIMIT : null;
  }
  const limit = count(value);
  return limit !== null && limit > 0 ? limit : null;
}

// Invitación ausente o inválida: el modelo completo, con su causa y sin ningún dato
// inventado (RF-12, RF-13).
function blankInvitation(errorCode) {
  const invitation = {
    type: INVITATION_TYPES.NONE,
    errorCode,
    guestName: null,
    partnerName: null,
    adultsGuests: null,
    childGuests: null,
    limit: null,
    previousResponse: null,
    deadline: null,
  };
  return { ...invitation, seatsText: seatsText(invitation), guestLimit: guestLimit(invitation) };
}

// Consulta que no se puede usar: el modelo vacío con su causa (RF-12, RF-13). Se distingue
// de una consulta correcta por `ok`; el código lo elige el **servicio** (`INVALID_PHONE`,
// `MISSING_FIELDS`, …) o el **cliente** cuando no hubo respuesta válida (D25).
function blankLookup(errorCode) {
  return {
    ok: false,
    errorCode,
    type: null,
    limit: null,
    deadline: null,
    previousResponse: null,
  };
}

// Código de enlace (RF-2): el parámetro `guest`, **recortado**, o `null` si falta o viene en
// blanco. Los parámetros `codigo`/`code`/`inv` están jubilados, sin alias.
export function readGuestCode(params) {
  if (!params) return null;
  const get = typeof params.get === "function" ? (key) => params.get(key) : (key) => params[key];
  return text(get(GUEST_PARAM));
}

// Modelo que consume la interfaz a partir de la respuesta ya resuelta del servicio (plan §7):
// `{ ok: true, type, guest, limit, response, deadline }` o `{ ok: false, code }`. La app **no**
// deduce el tipo ni el cupo: los recibe (D20); un dato incoherente es un fallo visible
// (RF-13) y nunca se personaliza con datos incompletos (RNF-3).
export function interpretInvitation(result) {
  if (!result || result.ok !== true) {
    return blankInvitation(text(result?.code) ?? CODES.SERVICE_UNAVAILABLE);
  }

  const type = text(result.type);
  if (!SERVICE_TYPES.includes(type)) return blankInvitation(CODES.INVALID_DATA);

  const state = responseState(result.response);
  if (state === null) return blankInvitation(CODES.INVALID_DATA);

  const guest = result.guest && typeof result.guest === "object" ? result.guest : {};
  const invitation = {
    type,
    errorCode: null,
    guestName: null,
    partnerName: null,
    adultsGuests: null,
    childGuests: null,
    limit: null,
    previousResponse: state === undefined ? null : attendance(result.response, state),
    deadline: text(result.deadline),
  };

  if (type === GUEST_TYPES.PERSONAL) {
    invitation.guestName = text(guest.name);
    invitation.partnerName = text(guest.partner);
    invitation.adultsGuests = requiredCount(guest.adultsGuests);
    invitation.childGuests = count(guest.childGuests);
    // La personalizada sin nombre o con cupos ilegibles o negativos no se personaliza
    // (RF-13).
    if (
      invitation.guestName === null ||
      invitation.adultsGuests === null ||
      invitation.childGuests === null
    ) {
      return blankInvitation(CODES.INVALID_DATA);
    }
  } else {
    const limit = codeLimit(type, result.limit);
    if (limit === null) return blankInvitation(CODES.INVALID_DATA);
    invitation.limit = limit;
  }

  return {
    ...invitation,
    seatsText: seatsText(invitation),
    guestLimit: guestLimit(invitation),
  };
}

// Respuesta de la **consulta por teléfono** (`lookup`, spec 005: RF-5, RF-8; D5, DT-2, M9).
// El servicio devuelve el mismo modelo que `resolve` —tipo, límite y plazo— **sin** objeto
// `guest` (la genérica y la pública no precargan titular ni cupo) más la respuesta previa de
// **esa** fila, con su **nombre registrado** (`response.name`, un dato de la respuesta, como
// `datetime`). Devuelve `{ ok, errorCode, type, limit, deadline, previousResponse }`:
// `previousResponse` es `null` cuando no hay fila **o** la fila no tiene respuesta (`viewed`
// o `status` vacío: eso es una primera respuesta, no un error) y, cuando la hay, el modelo
// de la respuesta **más `name`** (un nombre ausente no invalida la fila, como el `message`
// opcional). El teléfono **no** viaja en la respuesta (lo tiene la app en la página, RNF-2).
export function interpretLookup(result) {
  if (!result || result.ok !== true) {
    return blankLookup(text(result?.code) ?? text(result?.errorCode) ?? CODES.SERVICE_UNAVAILABLE);
  }

  const type = text(result.type);
  // La consulta solo aplica a la genérica y la pública (RF-6, RF-8): la personalizada la
  // resuelve `resolve` y un tipo ajeno es un dato fuera de contrato (RF-13).
  if (type !== GUEST_TYPES.GENERIC && type !== GUEST_TYPES.PUBLIC) {
    return blankLookup(CODES.INVALID_DATA);
  }

  const limit = codeLimit(type, result.limit);
  if (limit === null) return blankLookup(CODES.INVALID_DATA);

  const state = responseState(result.response);
  if (state === null) return blankLookup(CODES.INVALID_DATA);

  return {
    ok: true,
    errorCode: null,
    type,
    limit,
    deadline: text(result.deadline),
    previousResponse:
      state === undefined ? null : { ...attendance(result.response, state), name: text(result.response?.name) },
  };
}

// Cupos que pinta el combo de asistentes (RF-4, M2): en la personalizada, los de su fila
// (que no cambian durante la sesión); en la genérica y la pública, el `limit` de la
// **consulta** —la lectura vigente y la única disponible cuando el formulario aparece— y,
// si todavía no hay consulta, el de la resolución: **manda la consulta** cuando difiere. El
// valor `"n"` viaja tal cual (sin tope; la app no declara ningún máximo, R1) y la genérica y
// la pública no ofrecen niños (D12). Sin invitación no hay ningún cupo que ofrecer.
export function attendeeLimits(invitation, lookupLimit) {
  const type = invitation?.type;
  if (type === INVITATION_TYPES.PERSONALIZED) {
    return { adults: count(invitation.adultsGuests), children: count(invitation.childGuests) };
  }
  if (type === INVITATION_TYPES.GENERIC || type === INVITATION_TYPES.PUBLIC) {
    const limit = lookupLimit ?? invitation.limit ?? null;
    return { adults: limit === NO_LIMIT ? NO_LIMIT : count(limit), children: 0 };
  }
  return { adults: 0, children: 0 };
}

// Lugares reservados (RF-9): solo la personalizada trae cupo precargado (adultos + niños);
// en la genérica y la pública el cupo es el límite del código, que se lee con `guestLimit`.
export function reservedSeats(invitation) {
  if (!invitation || invitation.type !== INVITATION_TYPES.PERSONALIZED) return null;
  return count(invitation.adultsGuests) + count(invitation.childGuests);
}

// Tope de asistentes de la invitación (RF-9): el total reservado en la personalizada y el
// límite del código en la genérica y la pública (`n`/`PUBLIC` = **sin tope**). Sin
// invitación no hay ningún lugar disponible.
export function guestLimit(invitation) {
  const type = invitation?.type;
  if (type === INVITATION_TYPES.PERSONALIZED) return reservedSeats(invitation) ?? 0;
  if (type === INVITATION_TYPES.GENERIC || type === INVITATION_TYPES.PUBLIC) {
    return invitation.limit === NO_LIMIT ? Infinity : count(invitation.limit);
  }
  return 0;
}

// Cupo respetado con el borde incluido; una cifra que no es un número entero ≥ 0 no cabe
// (RF-9).
export function isWithinGuestLimit(total, limit) {
  const value = Number(total);
  if (!Number.isFinite(value) || value < 0) return false;
  if (limit === Infinity) return true;
  const max = Number(limit);
  if (!Number.isFinite(max) || max < 0) return false;
  return value <= max;
}

// Texto de lugares para la interfaz (RF-9).
export function formatSeats(total) {
  if (total === null || total === undefined || total === "") return "un lugar";
  const seats = Number(total);
  if (!Number.isFinite(seats)) return "un lugar";
  if (seats <= 0) return "sin lugares";
  return seats === 1 ? "1 lugar" : `${seats} lugares`;
}

// Lugares que se anuncian al invitado: el cupo de su fila o el límite de su código; `n` es
// «sin tope» y la app no inventa un máximo (RF-9, D12).
export function seatsText(invitation) {
  const type = invitation?.type;
  if (type === INVITATION_TYPES.PERSONALIZED) return formatSeats(reservedSeats(invitation));
  if (type === INVITATION_TYPES.GENERIC || type === INVITATION_TYPES.PUBLIC) {
    if (invitation.limit === NO_LIMIT) return "sin tope";
    return formatSeats(invitation.limit);
  }
  return "un lugar";
}
