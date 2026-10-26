// Lógica pura: plazo de la confirmación (RF-11; D9, D23).
//
// El plazo **lo da el servicio**: es el `deadline` del maestro y el único que existe (el
// registro local ya no declara ninguno). La app solo lo interpreta y decide si el formulario
// se ofrece. El **«ahora» entra por parámetro**: el módulo no lee el reloj (RNF-9).
//
// Sin React, sin DOM y sin red: se puede importar desde `node --test`.

// Milisegundos del plazo, o `null` si viene vacío o no se puede interpretar: un `deadline`
// vacío o ilegible significa **sin plazo** y la invitación se puede contestar siempre
// (RF-11). Un número no finito se devuelve tal cual (`NaN`) para poder tratarlo aparte.
export function deadlineMs(value) {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "number") return Number.isFinite(value) ? value : Number.NaN;
  const ms = new Date(String(value)).getTime();
  return Number.isNaN(ms) ? null : ms;
}

// ¿Se puede contestar? El plazo entra tal cual lo devuelve el servicio (texto, número o
// `null`):
// - `null` (vacío o ilegible) = **sin plazo**: siempre abierto (RF-11);
// - un valor no finito = cerrado (no hay plazo válido que ofrecer);
// - si no, abierto hasta el plazo **con el borde incluido**.
// Sin un «ahora» finito no se abre la confirmación.
export function isConfirmationOpen(deadline, nowMs) {
  const now = Number(nowMs);
  if (!Number.isFinite(now)) return false;
  const ms = deadlineMs(deadline);
  if (ms === null) return true;
  if (!Number.isFinite(ms)) return false;
  return now <= ms;
}

// Campos del formulario que habilita el registro de la boda (RF-8): los sigue declarando el
// registro; la confirmación no se apaga aunque cambien.
export function confirmationFields(confirmation) {
  const fields = confirmation?.camposHabilitados;
  if (Array.isArray(fields)) return fields.slice();
  return ["nombre", "asistentes", "alergias", "mensaje"];
}
