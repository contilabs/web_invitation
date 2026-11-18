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
  return text(response) === RESPONSE_STATES.DECLINED;
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

// Validación previa al envío (RF-8, RF-9, RF-11, D21, D26; R11). Devuelve `{ ok, errorCode }`.
//
// El **orden** de las comprobaciones importa y se conserva: invitación → nombre/teléfono →
// asistencia elegida → rechazo → cupos.
//
// - Sin invitación no se envía: se hereda el código de la causa (RF-12).
// - La **personalizada** no pide nombre ni teléfono; acota los adultos y los niños a los
//   cupos de su fila (RF-9).
// - La **genérica** y la **pública** exigen nombre y teléfono **también al rechazar** (D26)
//   y acotan los adultos al límite del código, que en la pública no tiene tope (D12).
// - La **asistencia elegida** es obligatoria (RF-11, R11): el formulario no se puede enviar
//   sin una de las dos opciones del contrato (`accepted`/`declined`). El `required` de los
//   radios del componente es solo una **ayuda de navegador**; la garantía es esta función.
//   El código es el **existente** `INVALID_RESPONSE` (no se añade ninguno al contrato, R11)
//   y va **después** del nombre y el teléfono —cuyas faltas mandan, D26— y **antes** del
//   rechazo y de los cupos.
// - Confirmar exige **al menos un asistente**: con cupo cero solo cabe rechazar (RF-9, D21).
export function validateRsvp(form, invitation) {
  const type = invitation?.type ?? INVITATION_TYPES.NONE;
  if (type === INVITATION_TYPES.NONE) {
    return { ok: false, errorCode: invitation?.errorCode ?? CODES.MISSING_GUEST };
  }

  const response = text(form?.response);
  const personalized = type === INVITATION_TYPES.PERSONALIZED;

  if (!personalized) {
    if (text(form?.name) === null) return { ok: false, errorCode: CODES.MISSING_FIELDS };
    const digits = phoneDigits(form?.phone);
    if (digits === "") return { ok: false, errorCode: CODES.MISSING_FIELDS };
    if (!isPhoneComplete(digits)) return { ok: false, errorCode: CODES.INVALID_PHONE };
  }

  // Sin asistencia elegida —ni `accepted` ni `declined`— no se compone ningún envío: el
  // servicio trataría cualquier otra cosa como un **rechazo silencioso** (RF-11, R11).
  if (response !== RESPONSE_STATES.ACCEPTED && response !== RESPONSE_STATES.DECLINED) {
    return { ok: false, errorCode: CODES.INVALID_RESPONSE };
  }

  const rejecting = response === RESPONSE_STATES.DECLINED;
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
//
// Un **rechazo** omite los campos de la asistencia **salvo el mensaje** (RF-11, RF-13; D18
// matizada solo en el mensaje): los asistentes y las alergias están **ocultos** cuando se
// rechaza —lo que el invitado no ve no viaja—, pero el **mensaje sí** (el invitado puede
// dejar una palabra aunque no asista). El servicio (sin cambios) escribe los asistentes en 0
// y las restricciones vacías al no recibirlos, así que el contrato no cambia (RF-8 intacto).
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
  };

  const digits = phoneDigits(phone);
  if (digits !== "") payload[REQUEST_FIELDS.PHONE] = digits;
  const guestName = text(name);
  if (guestName !== null) payload[REQUEST_FIELDS.NAME] = guestName;

  const note = text(message);
  if (isRejection(response)) {
    // En un rechazo solo se añade el mensaje; los demás campos de la asistencia quedan fuera.
    if (note !== null) payload[REQUEST_FIELDS.MESSAGE] = note;
    return payload;
  }

  payload[REQUEST_FIELDS.ADULTS] = count(adults);
  payload[REQUEST_FIELDS.CHILDREN] = count(children);
  if (note !== null) payload[REQUEST_FIELDS.MESSAGE] = note;
  const diet = text(restrictions);
  if (diet !== null) payload[REQUEST_FIELDS.RESTRICTIONS] = diet;

  return payload;
}

// Composición del **panel de solo lectura** (`ResponseSummary`, RF-13, RF-10; DT-14): desde
// la respuesta interpretada (`answer`) y el tipo de invitación (`personalized`) devuelve el
// objeto que consume la pieza, con los mismos campos que hoy (`name`, `adultsAttendees`,
// `childAttendees`, `message`, `restrictions`, `datetime`, `phone`) y **además** el `state`.
//
// La decisión de **qué se muestra en un rechazo** es de negocio, no de presentación, y por
// eso vive aquí y no en el componente: en un **rechazo** se conserva el `message` (RF-13; el
// invitado puede dejar una palabra aunque no asista) y se pasan **ausentes** —`undefined`,
// no `0` ni `""`, que sí se pintarían— los adultos, los niños y las restricciones (D18
// vigente para ellos). En una **confirmación** se devuelven como hoy. Los **niños** solo
// existen en la personalizada (004 D12): fuera de ella se omiten. Sin respuesta → `null`.
// Sin React, sin DOM y sin reloj (RNF-4/RNF-9).
//
// El `state` se conserva porque el «Editar» alimenta `attendanceForm` con **esta misma**
// composición (`answeredData`, DT-17): sin él, la precarga no encontraba el estado y caía a
// `accepted`, así que «Editar» sobre un rechazo precargaba una aceptación. `ResponseSummary`
// **no** lo pinta (su API es una **lista cerrada** de props y `state` no está entre ellas):
// el estado no es un campo visible, solo el dato que necesita la precarga.
export function responseSummaryData(answer, personalized) {
  if (!answer) return null;
  const rejected = isRejection(answer.state);
  return {
    name: answer.name,
    state: answer.state,
    adultsAttendees: rejected ? undefined : answer.adultsAttendees,
    childAttendees: rejected || !personalized ? undefined : answer.childAttendees,
    message: text(answer.message) ?? undefined,
    restrictions: rejected ? undefined : answer.restrictions,
    datetime: answer.datetime,
    phone: answer.phone,
  };
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

// Opciones del combo de asistentes (RF-4, D4, R1, R8), con **rango por campo** (DT-13):
//   - **adultos**: los enteros de **1** al cupo (el 0 **no** se ofrece: nunca es una
//     confirmación válida —confirmar exige al menos un asistente— y ofrecerlo invitaba a
//     elegirlo y recibir un aviso de error que la interfaz ya sabía inevitable, M1);
//   - **niños**: los enteros de **0** al cupo (0 niños con adultos confirmados **sí** es una
//     respuesta válida).
// `null` cuando no hay combo que ofrecer: con cupo 0 (no hay ninguna opción: solo cabe
// rechazar, D21) y con un límite que no es un número entero, que es lo que pasa con el `"n"`
// de la pública (sin tope → **campo numérico libre** con mínimo 1, la app no declara ningún
// máximo, D12/R9).
//
// El campo entra por parámetro; su valor por defecto es «adultos», el único que ofrece un
// rango con el 0 fuera.
export function attendeeOptions(limit, field = "adults") {
  if (!Number.isInteger(limit) || limit < 1) return null;
  const first = field === "children" ? 0 : 1;
  return Array.from({ length: limit - first + 1 }, (_, index) => first + index);
}

// Normalización de un valor guardado a una opción válida del combo (RF-4, R10; DT-13): la
// decisión vive aquí —y no en lo que se pinta— para que lo que el invitado **ve** sea lo que
// **viaja** al enviar. Si el valor ya está entre las opciones se devuelve tal cual (el 0
// heredado de un rechazo o de una respuesta con 0 adultos no es una opción de adultos y vale
// por la **opción menor**: 1 en adultos y 0 en niños). Sin opciones (`null`/vacío: cupo 0 o
// el campo libre de `"n"`) no hay nada que normalizar y el valor se queda como está.
export function attendeeValue(value, options) {
  const current = String(value ?? "");
  const values = Array.isArray(options) ? options : [];
  if (values.length === 0) return current;
  return values.map(String).includes(current) ? current : String(values[0]);
}

// Precarga del formulario de respuesta (RF-2, RF-5, RF-10): de la respuesta previa —la que
// trae la personalizada o la que devolvió la consulta por teléfono— o de los valores por
// defecto de hoy cuando todavía no hay ninguna. La asistencia se conserva: «rechazar» para
// `declined` y «aceptar» para cualquier otra respuesta registrada (`accepted`),
// y sin respuesta no se elige nada. El **nombre** es el registrado de la fila y, en la
// personalizada, el titular de la invitación; la **condición de editable** la decide el
// componente (el titular lleva `readOnly`, RF-2; el registrado se edita, RF-10). Los
// **adultos** se precargan **normalizados** con `attendeeValue` (un 0 heredado se muestra
// como **1**, R10; DT-13) **siempre que el cupo de adultos sea mayor que cero**: con cupo 0
// no hay combo y solo cabe rechazar, así que la normalización no aplica (004 D21). El
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

  const previousAdults = String(count(previousResponse.adultsAttendees));
  // El cupo de adultos del combo: en la personalizada, el reservado (que no cambia durante la
  // sesión); en la genérica y la pública, el `limit` de la resolución —la consulta puede
  // afinarlo, pero quien normaliza la precarga es la resolución, que es la lectura de la
  // página—. Con cupo 0 no hay combo y la normalización **no** aplica (004 D21).
  const adultLimit = personalized
    ? count(invitation?.adultsGuests)
    : guestLimit(invitation);
  const adultOptions = attendeeOptions(adultLimit, "adults");

  return {
    ...form,
    response:
      text(previousResponse.state) === RESPONSE_STATES.DECLINED
        ? RESPONSE_STATES.DECLINED
        : RESPONSE_STATES.ACCEPTED,
    // La identidad manda por tipo: el titular de la personalizada (que no se edita, RF-2) o
    // el nombre registrado de la fila en la genérica y la pública (editable, RF-10).
    name: personalized ? form.name : (text(previousResponse.name) ?? form.name),
    adults: adultOptions === null ? previousAdults : attendeeValue(previousAdults, adultOptions),
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

// Texto prellenado para que el invitado pueda compartir por WhatsApp la respuesta que
// acaba de registrar. El teléfono del invitado nunca forma parte de este mensaje: solo se
// usa como llave del servicio y el destino sale de la configuración del despliegue.
export function whatsappMessage({
  coupleName,
  name,
  response,
  adults,
  children,
  restrictions,
} = {}) {
  const lines = [];
  const couple = text(coupleName);
  const guest = text(name);
  if (couple) lines.push(`Hola, ${couple}.`);
  if (guest) lines.push(`Soy ${guest}.`);
  lines.push(
    `Mi respuesta para la boda es: ${isRejection(response) ? "No podré asistir" : "Sí, asistiré"}.`,
  );

  if (!isRejection(response)) {
    lines.push(`Adultos: ${count(adults)}.`);
    // Las invitaciones genéricas y públicas no contemplan niños: `undefined` significa que
    // ese campo no forma parte de la respuesta, mientras que `0` sí es válido en la
    // personalizada y debe conservarse en el mensaje.
    if (children !== undefined && children !== null) lines.push(`Niños: ${count(children)}.`);
    const diet = text(restrictions);
    if (diet) lines.push(`Restricciones alimentarias: ${diet}.`);
  }

  return lines.join("\n");
}

// Enlace oficial de WhatsApp con el texto precargado. El número debe venir en formato
// internacional, solo con dígitos, como requiere `wa.me`.
export function whatsappUrl(phone, message) {
  const digits = phoneDigits(phone);
  if (!digits) return "";
  return `https://wa.me/${digits}?text=${encodeURIComponent(String(message ?? ""))}`;
}
