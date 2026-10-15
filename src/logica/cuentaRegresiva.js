// Cuenta regresiva (T7, RF-3). Función pura: el objetivo y el «ahora» llegan como
// milisegundos, así que no depende del reloj ni de la zona horaria. Devuelve los
// días completos y el resto en horas, minutos y segundos. Cuando el objetivo ya
// pasó (diferencia <= 0) marca `terminado` y pone todo a cero, para que la interfaz
// muestre el mensaje en lugar de la cuenta.

const SEGUNDO = 1000;
const MINUTO = 60 * SEGUNDO;
const HORA = 60 * MINUTO;
const DIA = 24 * HORA;

export function calcularRestante(fechaObjetivoMs, ahoraMs) {
  // Guarda (T26): si el instante objetivo no es un número finito (por ejemplo, una
  // fecha imposible resuelta por `evento.js` deja NaN) o el «ahora» no lo es, se
  // devuelve el estado terminado en lugar de esparcir NaN por la interfaz. El instante
  // objetivo lo calcula `evento.js` (fecha + zona) a partir del registro.
  if (!Number.isFinite(fechaObjetivoMs) || !Number.isFinite(ahoraMs)) {
    return { dias: 0, horas: 0, minutos: 0, segundos: 0, terminado: true };
  }

  const diferencia = fechaObjetivoMs - ahoraMs;

  if (diferencia <= 0) {
    return { dias: 0, horas: 0, minutos: 0, segundos: 0, terminado: true };
  }

  return {
    dias: Math.floor(diferencia / DIA),
    horas: Math.floor((diferencia % DIA) / HORA),
    minutos: Math.floor((diferencia % HORA) / MINUTO),
    segundos: Math.floor((diferencia % MINUTO) / SEGUNDO),
    terminado: false,
  };
}
