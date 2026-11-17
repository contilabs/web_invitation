// Firma discreta: nombres y fecha proceden del registro de la portada.
import { coupleNames } from "../../utils/couple.js";

export function Footer({ couple, dateText, credit }) {
  const names = coupleNames(couple);

  return (
    <footer aria-label={`${names.first.charAt(0)} & ${names.second.charAt(0)}`}>
      <p className="footer-names">
        {names.first} <span className="amp">&amp;</span> {names.second}
      </p>
      <p className="footer-date">
        {dateText}
      </p>
      {credit && (
        <p className="footer-contact">
          Diseño de invitación y{" "}
          <a className="footer-contact-link" href={credit} target="_blank" rel="noopener noreferrer">
            más info aquí
          </a>
        </p>
      )}
    </footer>
  );
}
