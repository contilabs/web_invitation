// Lógica pura: resolución de la invitación por código de enlace (RF-16, RF-17).
// Sustituye a `?invitados=N`: el código identifica la ficha en `guest-cards.js`.

export const INVITATION_TYPES = {
  PERSONALIZED: "personalizada",
  REUSABLE: "reutilizable",
  GENERIC: "generica",
  UNKNOWN: "desconocida",
};

const REUSABLE_MIN_LIMIT = 1;
const REUSABLE_MAX_LIMIT = 10;
const CODE_KEYS = ["codigo", "code", "inv"];

export function readInvitationCode(params) {
  if (!params) return null;
  const get = typeof params.get === "function" ? (k) => params.get(k) : (k) => params[k];
  for (const key of CODE_KEYS) {
    const value = get(key);
    if (value !== null && value !== undefined) {
      const code = String(value).trim().toLowerCase();
      if (code) return code;
    }
  }
  return null;
}

function normalizeCode(code) {
  if (code === null || code === undefined) return null;
  const normalized = String(code).trim().toLowerCase();
  return normalized || null;
}

export function resolveInvitation(guestCards, code) {
  const wanted = normalizeCode(code);
  if (!wanted) return { type: INVITATION_TYPES.UNKNOWN };
  if (!Array.isArray(guestCards)) return { type: INVITATION_TYPES.UNKNOWN };
  const card = guestCards.find((item) => normalizeCode(item?.codigo) === wanted);
  if (!card) return { type: INVITATION_TYPES.UNKNOWN };
  const type = card.tipo;
  if (type === INVITATION_TYPES.REUSABLE) {
    if (
      !Number.isInteger(card.limite) ||
      card.limite < REUSABLE_MIN_LIMIT ||
      card.limite > REUSABLE_MAX_LIMIT
    ) {
      return { type: INVITATION_TYPES.UNKNOWN };
    }
    return { type, limit: card.limite, card };
  }
  if (type === INVITATION_TYPES.PERSONALIZED) {
    return { type, guest: card, card };
  }
  if (type === INVITATION_TYPES.GENERIC) {
    return { type, card };
  }
  return { type: INVITATION_TYPES.UNKNOWN };
}

export function reservedSeats(invitation) {
  if (!invitation || invitation.type !== INVITATION_TYPES.PERSONALIZED) return null;
  const card = invitation.card ?? invitation.guest;
  if (!card) return null;
  if (Number.isInteger(card.lugaresReservados) && card.lugaresReservados > 0) {
    return card.lugaresReservados;
  }
  const adults = Number(card.adultsGuests ?? 0) || 0;
  const children = Number(card.childGuests ?? 0) || 0;
  const total = adults + children;
  return total > 0 ? total : null;
}

export function guestLimit(invitation, wedding) {
  const weddingMax = Number(wedding?.confirmacion?.maximoBoda);
  const cap = Number.isFinite(weddingMax) && weddingMax > 0 ? weddingMax : Infinity;
  if (!invitation || invitation.type === INVITATION_TYPES.UNKNOWN) return cap;
  if (invitation.type === INVITATION_TYPES.REUSABLE) {
    return Math.min(invitation.limit, cap);
  }
  if (invitation.type === INVITATION_TYPES.PERSONALIZED) {
    const reserved = reservedSeats(invitation);
    if (reserved !== null) return Math.min(reserved, cap);
    return cap;
  }
  // genérica
  return cap;
}

export function isWithinGuestLimit(count, limit) {
  const value = Number(count);
  if (!Number.isFinite(value)) return false;
  if (limit === Infinity) return true;
  return value <= limit;
}

export function formatSeats(total) {
  const count = Number(total);
  if (!Number.isFinite(count) || count <= 0) return "un lugar";
  return count === 1 ? "1 lugar" : `${count} lugares`;
}
