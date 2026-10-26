// Secciones de contenido de la invitación (T15/T24, RF-2, RF-4, RF-6, RF-11, RF-14). Todas
// leen del registro único (`data/wedding.js`): aquí no quedan nombres, fechas, lugares ni
// textos de contenido, solo el rótulo de interfaz («Cómo llegar», «Ver hotel»).
import { useTemplate } from "../../hooks/useTemplate.js";
import { photoFor } from "../../services/photos.js";
import { coupleNames } from "../../utils/couple.js";

export function Hero({ couple, dateText }) {
  const { structuralPhotos, photoSizes } = useTemplate();
  const names = coupleNames(couple);

  return (
    <section className="hero" id="inicio" tabIndex={-1}>
      <img
        className="hero-img"
        {...photoFor(structuralPhotos.hero, "", photoSizes.fullWidth)}
        alt={names.display}
        fetchPriority="low"
        decoding="async"
      />
      <div className="hero-veil" aria-hidden="true"></div>

      <div className="hero-text">
        <h1 className="hero-names">
          {names.first} <span className="amp">&amp;</span> {names.second}
        </h1>
        <p className="hero-date">{dateText}</p>
      </div>

      <a className="hero-arrow" href="#fecha" aria-label="Continuar con la invitación">
        <span aria-hidden="true"></span>
      </a>
    </section>
  );
}
