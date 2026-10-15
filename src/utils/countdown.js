// Cuenta regresiva (T7, RF-3). Función pura: el objetivo y el «ahora» llegan como
// milisegundos, así que no depende del reloj ni de la zona horaria. Devuelve los
// días completos y el resto en horas, minutos y segundos. Cuando el objetivo ya
// pasó (diferencia <= 0) marca `done` y pone todo a cero, para que la interfaz
// muestre el mensaje en lugar de la cuenta.

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

export function remainingParts(targetMs, nowMs) {
  // Guarda (T26): si el instante objetivo no es un número finito (por ejemplo, una
  // fecha imposible resuelta por `event.js` deja NaN) o el «ahora» no lo es, se
  // devuelve el estado terminado en lugar de esparcir NaN por la interfaz. El instante
  // objetivo lo calcula `event.js` (fecha + zona) a partir del registro.
  if (!Number.isFinite(targetMs) || !Number.isFinite(nowMs)) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, done: true };
  }

  const difference = targetMs - nowMs;

  if (difference <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, done: true };
  }

  return {
    days: Math.floor(difference / DAY),
    hours: Math.floor((difference % DAY) / HOUR),
    minutes: Math.floor((difference % HOUR) / MINUTE),
    seconds: Math.floor((difference % MINUTE) / SECOND),
    done: false,
  };
}
