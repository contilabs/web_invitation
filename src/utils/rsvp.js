// Lógica pura del envío de la respuesta (RF-8, RF-9, RF-14; D6, D23, D26) y de la **consulta
// por teléfono** de la spec 005 (RF-2, RF-4, RF-5, RF-10).
//
// Aquí se decide, sin entorno: cómo se normaliza el teléfono (llave de la genérica y la
// pública), qué se impide **antes** de enviar (`MISSING_FIELDS`, `INVALID_PHONE`,
// `OVER_LIMIT`), qué cuerpo JSON viaja al servicio (el del envío y el de la consulta), qué
// opciones ofrece el combo de asistentes y cómo se precarga el formulario desde una
// respuesta previa. La llamada vive en `src/services/registration.js` y el estado, en
// `src/hooks/` (RNF-9).
//
// Sin React, sin DOM, sin reloj y sin red: se puede importar desde `node --test`.

import {
  LOOKUP_FIELDS,
  PHONE_DIGITS,
  REQUEST_FIELDS,
  RESPONSE_STATES,
  SERVICE_ACTIONS,
  SERVICE_ERRORS,
} from "../constants/contract.js";
import { INVITATION_TYPES, guestLimit, isWithinGuestLimit } from "./invitation.js";

// Los códigos del contrato por nombre, para no repetir literales (RF-17).
const CODES = Object.fromEntries(SERVICE_ERRORS.map(({ code }) => [code, code]));

function text(value) {
  if (value === null || value === undefined) return null;
  const trimmed = String(value).trim();
  return trimmed === "" ? null : trimmed;
}

// Entero ≥ 0, o `null` si no se puede interpretar; un valor ausente vale por cero.
function count(value) {
  if (value === null || value === undefined || value === "") return 0;
  const number = Number(value);
  return Number.isInteger(number) && number >= 0 ? number : null;
}

// El invitado solo puede enviar una **confirmación** o un **rechazo** (RF-10, D26).
function isRejection(response) {
  return text(response) === RESPONSE_STATES.REJECTED;
}

// Teléfono (RF-8, D6, D23): se trata como texto y se normaliza a solo dígitos. El teléfono
// es la **llave dentro del libro de esa boda** y nunca se persiste en el navegador.
export function phoneDigits(value) {
  return String(value ?? "").replace(/\D+/g, "");
}

// Un teléfono completo tiene **exactamente** diez dígitos: el que no llega, o el que trae
// lada de país, se rechaza de forma visible (`INVALID_PHONE`) sin crear ni actualizar fila.
export function isPhoneComplete(value) {
  return phoneDigits(value).length === PHONE_DIGITS;
}

// Validación previa al envío (RF-8, RF-9, D21, D26). Devuelve `{ ok, errorCode }`.
//
// - Sin invitación no se envía: se hereda el código de la causa (RF-12).
// - La **personalizada** no pide nombre ni teléfono; acota los adultos y los niños a los
//   cupos de su fila (RF-9).
// - La **genérica** y la **pública** exigen nombre y teléfono **también al rechazar** (D26)
//   y acotan los adultos al límite del código, que en la pública no tiene tope (D12).
// - Confirmar exige **al menos un asistente**: con cupo cero solo cabe rechazar (RF-9, D21).
export function validateRsvp(form, invitation) {
  const type = invitation?.type ?? INVITATION_TYPES.NONE;
  if (type === INVITATION_TYPES.NONE) {
    return { ok: false, errorCode: invitation?.errorCode ?? CODES.MISSING_GUEST };
  }

  const rejecting = isRejection(form?.response);
  const personalized = type === INVITATION_TYPES.PERSONALIZED;

  if (!personalized) {
    if (text(form?.name) === null) return { ok: false, errorCode: CODES.MISSING_FIELDS };
    const digits = phoneDigits(form?.phone);
    if (digits === "") return { ok: false, errorCode: CODES.MISSING_FIELDS };
    if (!isPhoneComplete(digits)) return { ok: false, errorCode: CODES.INVALID_PHONE };
  }

  if (rejecting) return { ok: true, errorCode: null };

  const adults = count(form?.adults);
  const children = count(form?.children);
  if (adults === null || children === null) return { ok: false, errorCode: CODES.OVER_LIMIT };

  if (personalized) {
    const reservedAdults = invitation.adultsGuests;
    const reservedChildren = invitation.childGuests ?? 0;
    if (adults > reservedAdults || children > reservedChildren) {
      return { ok: false, errorCode: CODES.OVER_LIMIT };
    }
  } else if (!isWithinGuestLimit(adults, guestLimit(invitation))) {
    return { ok: false, errorCode: CODES.OVER_LIMIT };
  }

  if (adults + children === 0) return { ok: false, errorCode: CODES.OVER_LIMIT };
  return { ok: true, errorCode: null };
}

// Cuerpo JSON del envío (plan §7, RF-14): los nombres de campo son los del contrato y solo
// viaja lo que tiene valor. En la **personalizada** no se manda teléfono (RF-8); el
// teléfono de la genérica y la pública viaja **normalizado a dígitos** porque es la llave
// del libro (D6).
export function rsvpPayload({
  action,
  slug,
  code,
  response,
  name,
  phone,
  adults,
  children,
  message,
  restrictions,
} = {}) {
  const payload = {
    [REQUEST_FIELDS.ACTION]: text(action) ?? SERVICE_ACTIONS.RESPOND,
    [REQUEST_FIELDS.SLUG]: text(slug),
    [REQUEST_FIELDS.CODE]: text(code),
    [REQUEST_FIELDS.RESPONSE]: text(response),
    [REQUEST_FIELDS.ADULTS]: count(adults),
    [REQUEST_FIELDS.CHILDREN]: count(children),
  };

  const digits = phoneDigits(phone);
  if (digits !== "") payload[REQUEST_FIELDS.PHONE] = digits;
  const guestName = text(name);
  if (guestName !== null) payload[REQUEST_FIELDS.NAME] = guestName;
  const note = text(message);
  if (note !== null) payload[REQUEST_FIELDS.MESSAGE] = note;
  const diet = text(restrictions);
  if (diet !== null) payload[REQUEST_FIELDS.RESTRICTIONS] = diet;

  return payload;
}

// Cuerpo JSON de la **consulta por teléfono** (`lookup`, spec 005: RF-5, RF-8; D5, I8): los
// literales del contrato de `lookup` y el teléfono **normalizado a dígitos**, que es la llave
// de la fila. El teléfono se **envía** aquí y en el envío, pero se **escribe** solo en el
// envío: la consulta no deja rastro (I8, RNF-2).
export function lookupPayload({ slug, code, phone } = {}) {
  return {
    [LOOKUP_FIELDS.ACTION]: SERVICE_ACTIONS.LOOKUP,
    [LOOKUP_FIELDS.SLUG]: text(slug),
    [LOOKUP_FIELDS.CODE]: text(code),
    [LOOKUP_FIELDS.PHONE]: phoneDigits(phone),
  };
}

// Opciones del combo de asistentes (RF-4, D4, R1): los enteros de 0 al cupo, **con la opción
// 0 incluida** (el rango es completo; elegir 0 con «confirmar» lo rechaza la validación
// previa y el servicio, M1). `null` cuando no hay combo que ofrecer: con cupo 0 (no hay
// ninguna opción: solo cabe rechazar, D21) y con un límite que no es un número entero, que
// es lo que pasa con el `"n"` de la pública (sin tope → **campo numérico libre**, la app no
// declara ningún máximo, D12).
export function attendeeOptions(limit) {
  if (!Number.isInteger(limit) || limit < 1) return null;
  return Array.from({ length: limit + 1 }, (_, index) => index);
}

// Precarga del formulario de respuesta (RF-2, RF-5, RF-10): de la respuesta previa —la que
// trae la personalizada o la que devolvió la consulta por teléfono— o de los valores por
// defecto de hoy cuando todavía no hay ninguna. La asistencia se conserva: «rechazar» para
// `rejected` y «confirmar» para cualquier otra respuesta registrada (`confirmed`/`updated`),
// y sin respuesta no se elige nada. El **nombre** es el registrado de la fila y, en la
// personalizada, el titular de la invitación; la **condición de editable** la decide el
// componente (el titular lleva `readOnly`, RF-2; el registrado se edita, RF-10). El
// **teléfono** no forma parte del modelo: vive en el componente, que es lo que el invitado
// escribió, así que cambiarlo no borra la precarga ni dispara otra consulta (M8).
export function attendanceForm(invitation, previousResponse) {
  const personalized = invitation?.type === INVITATION_TYPES.PERSONALIZED;
  const form = {
    response: "",
    name: text(invitation?.guestName) ?? "",
    adults: personalized ? String(count(invitation?.adultsGuests)) : "1",
    children: personalized ? String(count(invitation?.childGuests)) : "0",
    message: "",
    restrictions: "",
  };
  if (!previousResponse) return form;

  return {
    ...form,
    response:
      text(previousResponse.state) === RESPONSE_STATES.REJECTED
        ? RESPONSE_STATES.REJECTED
        : RESPONSE_STATES.CONFIRMED,
    // La identidad manda por tipo: el titular de la personalizada (que no se edita, RF-2) o
    // el nombre registrado de la fila en la genérica y la pública (editable, RF-10).
    name: personalized ? form.name : (text(previousResponse.name) ?? form.name),
    adults: String(count(previousResponse.adultsAttendees)),
    children: String(count(previousResponse.childAttendees)),
    message: text(previousResponse.message) ?? "",
    restrictions: text(previousResponse.restrictions) ?? "",
  };
}

// Resultado del envío (RF-14): `{ ok, errorCode }`. El código lo elige el **servicio**
// (`INVALID_RESPONSE`, `OVER_LIMIT`, `DEADLINE_EXPIRED`, `MISSING_FIELDS`, `INVALID_PHONE`)
// o el **cliente** cuando no hubo respuesta válida (`SERVICE_UNAVAILABLE`, D25). El
// resultado correcto no lleva código: la interfaz usa el copy de `OK`.
export function interpretRsvpResult(result) {
  if (result?.ok === true) return { ok: true, errorCode: null };
  const code = text(result?.code) ?? text(result?.errorCode);
  return { ok: false, errorCode: code ?? CODES.SERVICE_UNAVAILABLE };
}
