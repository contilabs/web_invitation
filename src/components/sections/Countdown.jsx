// Cuenta regresiva (T13/T28, RF-3). Muestra días, horas, minutos y segundos, y el mensaje
// posterior al evento cuando ya pasó (lo decide el módulo puro). El instante y el texto de
// la fecha llegan desde el registro (App los resuelve con `utils/event.js`).
import { useCountdown } from "../../hooks/useCountdown.js";

const twoDigits = (number) => String(number).padStart(2, "0");

function Box({ number, label }) {
  return (
    <div className="box">
      <span className="box-number">{number}</span>
      <span className="box-label">{label}</span>
    </div>
  );
}

export function Countdown({ instantMs, dateText }) {
  const { days, hours, minutes, seconds, done } = useCountdown(instantMs);

  return (
    <section className="countdown-date reveal" id="fecha">
      <div className="band-content">
        <p className="date-day">{dateText}</p>
        <p className="remaining">Faltan</p>

        <div id="cuenta-regresiva" className="countdown">
          {done ? (
            <p className="post-message">¡Gracias por celebrar con nosotros!</p>
          ) : (
            <>
              <Box number={days} label="Días" />
              <Box number={twoDigits(hours)} label="Horas" />
              <Box number={twoDigits(minutes)} label="Min" />
              <Box number={twoDigits(seconds)} label="Seg" />
            </>
          )}
        </div>
      </div>
    </section>
  );
}
