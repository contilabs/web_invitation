// Lógica pura: resolución de la invitación por código de enlace (RF-16, RF-17).
// Sustituye a `?invitados=N`: el código identifica la ficha en `invitaciones.js`.

export const TIPOS = {
  PERSONALIZADA: "personalizada",
  REUTILIZABLE: "reutilizable",
  GENERICA: "generica",
  DESCONOCIDA: "desconocida",
};

const LIMITE_REUTILIZABLE_MIN = 1;
const LIMITE_REUTILIZABLE_MAX = 10;
const CLAVES_CODIGO = ["codigo", "code", "inv"];

export function leerCodigoDeInvitacion(parametros) {
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

export function resolverInvitacion(invitaciones, codigo) {
  const c = normalizarCodigo(codigo);
  if (!c) return { tipo: TIPOS.DESCONOCIDA };
  if (!Array.isArray(invitaciones)) return { tipo: TIPOS.DESCONOCIDA };
  const ficha = invitaciones.find((f) => normalizarCodigo(f?.codigo) === c);
  if (!ficha) return { tipo: TIPOS.DESCONOCIDA };
  const tipo = ficha.tipo;
  if (tipo === TIPOS.REUTILIZABLE) {
    const limite = Number(ficha.limite);
    if (!Number.isInteger(limite) || limite < LIMITE_REUTILIZABLE_MIN || limite > LIMITE_REUTILIZABLE_MAX) {
      return { tipo: TIPOS.DESCONOCIDA };
    }
    return { tipo, limite, ficha };
  }
  if (tipo === TIPOS.PERSONALIZADA) {
    return { tipo, invitado: ficha, ficha };
  }
  if (tipo === TIPOS.GENERICA) {
    return { tipo, ficha };
  }
  return { tipo: TIPOS.DESCONOCIDA };
}

export function lugaresReservados(invitacion) {
  if (!invitacion || invitacion.tipo !== TIPOS.PERSONALIZADA) return null;
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

export function limiteDeAsistentes(invitacion, boda) {
  const maximoBoda = Number(boda?.confirmacion?.maximoBoda);
  const maxBoda = Number.isFinite(maximoBoda) && maximoBoda > 0 ? maximoBoda : Infinity;
  if (!invitacion || invitacion.tipo === TIPOS.DESCONOCIDA) return maxBoda;
  if (invitacion.tipo === TIPOS.REUTILIZABLE) {
    return Math.min(invitacion.limite, maxBoda);
  }
  if (invitacion.tipo === TIPOS.PERSONALIZADA) {
    const reservados = lugaresReservados(invitacion);
    if (reservados !== null) return Math.min(reservados, maxBoda);
    return maxBoda;
  }
  // genérica
  return maxBoda;
}

export function asistentesDentroDelLimite(cantidad, limite) {
  const n = Number(cantidad);
  if (!Number.isFinite(n)) return false;
  if (limite === Infinity) return true;
  return n <= limite;
}

export function formatearLugares(total) {
  const n = Number(total);
  if (!Number.isFinite(n) || n <= 0) return "un lugar";
  return n === 1 ? "1 lugar" : `${n} lugares`;
}
