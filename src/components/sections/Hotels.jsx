// Hospedaje (T15, RF-11): información del registro y enlace exclusivo de reservación.
import { useTemplate } from "../../hooks/useTemplate.js";
import { SectionDivider } from "../ui/SectionDivider.jsx";

export function Hotels({ hotels }) {
  const { icons } = useTemplate();
  const list = Array.isArray(hotels?.lista) ? hotels.lista : [];

  return (
    <section className="hotels reveal" id="hospedaje">
      <div className="wrap">
        {hotels?.titulo && <h2><SectionDivider />{hotels.titulo}</h2>}
        <div className="hotel-list">
          {list.map((hotel, i) => {
            const link = hotel?.bookingUrl ?? null;
            const notes = hotel?.notas ?? "";
            const separator = notes.indexOf(":");
            return (
              <article className="hotel-card" key={`${hotel?.nombre ?? "hotel"}-${i}`}>
                <img className="icon hotel-image" src={icons.hotel} alt="" loading="lazy" decoding="async" />
                <h3 className="hotel-name">{hotel?.nombre}</h3>
                {notes && (
                  <p className="hotel-note">
                    {separator >= 0 ? <><strong>{notes.slice(0, separator + 1)}</strong>{notes.slice(separator + 1)}</> : notes}
                  </p>
                )}
                {hotel?.precio && <span className="hotel-price">{hotel.precio}</span>}
                {link && (
                  <a className="button button-solid hotel-link" href={link} target="_blank" rel="noopener noreferrer">
                    Reservar
                  </a>
                )}
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
