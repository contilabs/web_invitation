// Lógica pura: apertura del formulario de confirmación (RF-18)

export function deadlineMs(wedding) {
  const confirmation = wedding?.confirmacion ?? {};
  const deadline = confirmation.fechaLimite ?? confirmation.limite ?? null;
  if (deadline === null || deadline === undefined) return Number.NaN;
  if (typeof deadline === "number") return deadline;
  const ms = new Date(String(deadline)).getTime();
  return Number.isNaN(ms) ? Number.NaN : ms;
}

export function isConfirmationOpen(wedding, nowMs) {
  const deadline = deadlineMs(wedding);
  if (Number.isNaN(deadline)) return false;
  const now = Number(nowMs);
  if (!Number.isFinite(now)) return false;
  // Borde incluido: sigue abierta justo en la fecha límite
  return now <= deadline;
}

export function confirmationFields(confirmation) {
  const fields = confirmation?.camposHabilitados;
  if (Array.isArray(fields)) return fields.slice();
  return ["nombre", "asistentes", "alergias", "mensaje"];
}
