// Lógica pura: resolución de la invitación por código de enlace (RF-16, RF-17).
// Sustituye a `?invitados=N`: el código identifica la ficha en `guest-cards.js`.

export const INVITATION_TYPES = {
  PERSONALIZED: "personalizada",
  REUSABLE: "reutilizable",
  GENERIC: "generica",
  UNKNOWN: "desconocida",
};

const LIMITE_REUTILIZABLE_MIN = 1;
const LIMITE_REUTILIZABLE_MAX = 10;
const CLAVES_CODIGO = ["codigo", "code", "inv"];

export function readInvitationCode(parametros) {
  if (!parametros) return null;
  const get = typeof parametros.get === "function" ? (k) => parametros.get(k) : (k) => parametros[k];
  for (const clave of CLAVES_CODIGO) {
    const valor = get(clave);
    if (valor !== null && valor !== undefined) {
      const s = String(valor).trim().toLowerCase();
      if (s) return s;
    }
  }
  return null;
}

function normalizarCodigo(codigo) {
  if (codigo === null || codigo === undefined) return null;
  const s = String(codigo).trim().toLowerCase();
  return s || null;
}

export function resolveInvitation(invitaciones, codigo) {
  const c = normalizarCodigo(codigo);
  if (!c) return { tipo: INVITATION_TYPES.UNKNOWN };
  if (!Array.isArray(invitaciones)) return { tipo: INVITATION_TYPES.UNKNOWN };
  const ficha = invitaciones.find((f) => normalizarCodigo(f?.codigo) === c);
  if (!ficha) return { tipo: INVITATION_TYPES.UNKNOWN };
  const tipo = ficha.tipo;
  if (tipo === INVITATION_TYPES.REUSABLE) {
    const limite = Number(ficha.limite);
    if (!Number.isInteger(limite) || limite < LIMITE_REUTILIZABLE_MIN || limite > LIMITE_REUTILIZABLE_MAX) {
      return { tipo: INVITATION_TYPES.UNKNOWN };
    }
    return { tipo, limite, ficha };
  }
  if (tipo === INVITATION_TYPES.PERSONALIZED) {
    return { tipo, invitado: ficha, ficha };
  }
  if (tipo === INVITATION_TYPES.GENERIC) {
    return { tipo, ficha };
  }
  return { tipo: INVITATION_TYPES.UNKNOWN };
}

export function reservedSeats(invitacion) {
  if (!invitacion || invitacion.tipo !== INVITATION_TYPES.PERSONALIZED) return null;
  const ficha = invitacion.ficha ?? invitacion.invitado;
  if (!ficha) return null;
  if (Number.isInteger(ficha.lugaresReservados) && ficha.lugaresReservados > 0) {
    return ficha.lugaresReservados;
  }
  const adultos = Number(ficha.adultsGuests ?? 0) || 0;
  const ninos = Number(ficha.childGuests ?? 0) || 0;
  const total = adultos + ninos;
  return total > 0 ? total : null;
}

export function guestLimit(invitacion, boda) {
  const maximoBoda = Number(boda?.confirmacion?.maximoBoda);
  const maxBoda = Number.isFinite(maximoBoda) && maximoBoda > 0 ? maximoBoda : Infinity;
  if (!invitacion || invitacion.tipo === INVITATION_TYPES.UNKNOWN) return maxBoda;
  if (invitacion.tipo === INVITATION_TYPES.REUSABLE) {
    return Math.min(invitacion.limite, maxBoda);
  }
  if (invitacion.tipo === INVITATION_TYPES.PERSONALIZED) {
    const reservados = reservedSeats(invitacion);
    if (reservados !== null) return Math.min(reservados, maxBoda);
    return maxBoda;
  }
  // genérica
  return maxBoda;
}

export function isWithinGuestLimit(cantidad, limite) {
  const n = Number(cantidad);
  if (!Number.isFinite(n)) return false;
  if (limite === Infinity) return true;
  return n <= limite;
}

export function formatSeats(total) {
  const n = Number(total);
  if (!Number.isFinite(n) || n <= 0) return "un lugar";
  return n === 1 ? "1 lugar" : `${n} lugares`;
}
