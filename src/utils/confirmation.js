// Lógica pura: apertura del formulario de confirmación (RF-18)

export function deadlineMs(boda) {
  const conf = boda?.confirmacion ?? {};
  const valor = conf.fechaLimite ?? conf.limite ?? null;
  if (valor === null || valor === undefined) return Number.NaN;
  if (typeof valor === "number") return valor;
  const ms = new Date(String(valor)).getTime();
  return Number.isNaN(ms) ? Number.NaN : ms;
}

export function isConfirmationOpen(boda, ahoraMs) {
  const limite = deadlineMs(boda);
  if (Number.isNaN(limite)) return false;
  const ahora = Number(ahoraMs);
  if (!Number.isFinite(ahora)) return false;
  // Borde incluido: sigue abierta justo en la fecha límite
  return ahora <= limite;
}

export function confirmationFields(confirmacion) {
  const campos = confirmacion?.camposHabilitados;
  if (Array.isArray(campos)) return campos.slice();
  return ["nombre", "asistentes", "alergias", "mensaje"];
}
