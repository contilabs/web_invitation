// Lógica pura del panel: valida el sobre completo y deriva métricas, filtros y orden.
import { ADMIN_CONTRACT_VERSION } from "../constants/contract.js";

const STATUSES = new Set(["viewed", "accepted", "declined"]);
const TYPES = new Set(["personal", "generic", "public"]);

function text(value) {
  if (value === null || value === undefined) return null;
  const result = String(value).trim();
  return result === "" ? null : result;
}

function count(value) {
  if (value === "" || value === null || value === undefined) return 0;
  const number = Number(value);
  return Number.isInteger(number) && number >= 0 ? number : null;
}

function validDate(value) {
  const result = text(value);
  return result !== null && !Number.isNaN(Date.parse(result));
}

function deriveSummary(responses, supplied = {}) {
  const summary = {
    total: responses.length,
    viewed: 0,
    accepted: 0,
    declined: 0,
    pending: 0,
    adults: 0,
    children: 0,
  };
  if (Object.prototype.hasOwnProperty.call(supplied, "seatsIssued")) {
    summary.seatsIssued = supplied.seatsIssued;
    summary.seatsOccupied = supplied.seatsOccupied ?? 0;
    summary.seatsUnoccupied = supplied.seatsUnoccupied ?? null;
  }
  for (const response of responses) {
    summary[response.status] += 1;
    if (response.status === "viewed") summary.pending += 1;
    if (response.status === "accepted") {
      summary.adults += response.adultsAttendees;
      summary.children += response.childAttendees;
    }
  }
  return summary;
}

export function normalizeAdminResponse(data) {
  if (!data || data.ok !== true || data.contract !== ADMIN_CONTRACT_VERSION) {
    return { ok: false, errorCode: data?.code ?? "INVALID_RESPONSE" };
  }
  const wedding = data.wedding;
  if (!wedding || typeof wedding !== "object" || text(wedding.slug) === null ||
      typeof wedding.isActive !== "boolean" || !validDate(wedding.updatedAt)) {
    return { ok: false, errorCode: "INVALID_RESPONSE" };
  }
  if (!Array.isArray(data.responses)) return { ok: false, errorCode: "INVALID_RESPONSE" };

  const responses = [];
  for (const item of data.responses) {
    if (!item || typeof item !== "object" || text(item.guestId) === null ||
        !STATUSES.has(item.status) || (item.guestType !== null && !TYPES.has(item.guestType)) ||
        text(item.phoneMasked) === null || (item.datetime !== null && !validDate(item.datetime)) ||
        (item.status !== "viewed" && !validDate(item.datetime))) {
      return { ok: false, errorCode: "INVALID_RESPONSE" };
    }
    const adults = count(item.adultsAttendees);
    const children = count(item.childAttendees);
    if (adults === null || children === null) return { ok: false, errorCode: "INVALID_RESPONSE" };
    responses.push({
      guestId: text(item.guestId),
      guestType: item.guestType,
      guestName: text(item.guestName),
      phoneMasked: text(item.phoneMasked),
      adultsAttendees: adults,
      childAttendees: children,
      assignedAdults: count(item.assignedAdults),
      assignedChildren: count(item.assignedChildren),
      assignedSeats: item.assignedSeats === null ? null : count(item.assignedSeats),
      occupiedSeats: count(item.occupiedSeats) ?? adults + children,
      message: text(item.message),
      allergies: text(item.allergies ?? item.dietaryRestrictions),
      status: item.status,
      datetime: text(item.datetime),
    });
  }

  return { ok: true, wedding: { ...wedding, language: wedding.language === "english" ? "english" : "spanish" }, responses, summary: deriveSummary(responses, data.summary) };
}

export function normalizeAdminCodes(data) {
  if (!data || data.ok !== true || data.contract !== ADMIN_CONTRACT_VERSION || !Array.isArray(data.codes)) {
    return { ok: false, errorCode: data?.code ?? "INVALID_RESPONSE" };
  }
  const codes = [];
  for (const item of data.codes) {
    if (!item || typeof item !== "object" || text(item.code) === null ||
        !(item.limit === "n" || (Number.isInteger(item.limit) && item.limit > 0))) {
      return { ok: false, errorCode: "INVALID_RESPONSE" };
    }
    codes.push({ code: text(item.code), limit: item.limit });
  }
  codes.sort((left, right) => (left.limit === "n" ? Number.POSITIVE_INFINITY : left.limit) - (right.limit === "n" ? Number.POSITIVE_INFINITY : right.limit));
  return { ok: true, codes };
}

export function filterAdminResponses(responses, filters = {}) {
  const query = text(filters.query)?.toLocaleLowerCase() ?? "";
  return responses.filter((item) => {
    if (filters.status && item.status !== filters.status) return false;
    const allergies = item.allergies ?? item.dietaryRestrictions;
    if (filters.restrictions === "yes" && !allergies) return false;
    if (filters.restrictions === "no" && allergies) return false;
    if (query && ![item.guestName, item.message, allergies, item.guestId]
      .filter(Boolean).some((value) => value.toLocaleLowerCase().includes(query))) return false;
    return true;
  });
}

export function sortAdminResponses(responses, sort = "datetime") {
  return [...responses].sort((left, right) => {
    if (sort === "name") return (left.guestName ?? "").localeCompare(right.guestName ?? "", "es");
    if (sort === "status") return left.status.localeCompare(right.status, "en");
    return (Date.parse(right.datetime ?? "") || Number.NEGATIVE_INFINITY) -
      (Date.parse(left.datetime ?? "") || Number.NEGATIVE_INFINITY);
  });
}

// Sustituye los datos variables del mensaje que se copia desde el panel de enlaces.
export function invitationMessage(template, { couple, limit, link } = {}) {
  const places = limit === "n"
    ? "lugares sin límite"
    : `${Number(limit)} ${Number(limit) === 1 ? "lugar disponible" : "lugares disponibles"}`;
  return String(template ?? "")
    .replaceAll("{pareja}", String(couple ?? ""))
    .replaceAll("{lugares}", places)
    .replaceAll("{enlace}", String(link ?? ""));
}
