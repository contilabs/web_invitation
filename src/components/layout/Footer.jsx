// Pie de la invitación (T15, RF-14). Compone la firma final: los nombres, la fecha, el lugar
// y el crédito salen del registro único.
import { coupleNames } from "../../utils/couple.js";

export function Footer({ couple, dateText, place, credit }) {
  const names = coupleNames(couple);

  return (
    <footer>
      <p className="footer-nombres">
        {names.first} <span className="amp">&amp;</span> {names.second}
      </p>
      <p className="footer-fecha">
        {dateText}
        {place ? ` · ${place}` : ""}
      </p>
      {credit && (
        <p className="footer-credito">
          Diseño de Invitación Digital ·{" "}
          <a href={credit} target="_blank" rel="noopener noreferrer">
            Más información aquí
          </a>
        </p>
      )}
    </footer>
  );
}
