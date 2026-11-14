// Cuenta regresiva: recibe el instante objetivo del registro y conserva los cuatro valores
// en cero al llegar a la fecha, sin cambiar la distribución visual.
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

export function Countdown({ instantMs }) {
  const { days, hours, minutes, seconds } = useCountdown(instantMs);

  return (
    <section className="countdown-date reveal" id="fecha">
      <div className="band-content">
        <p className="date-day">Faltan</p>

        <div id="cuenta-regresiva" className="countdown">
          <Box number={days} label="Días" />
          <Box number={twoDigits(hours)} label="Horas" />
          <Box number={twoDigits(minutes)} label="Min" />
          <Box number={twoDigits(seconds)} label="Seg" />
        </div>
      </div>
    </section>
  );
}
