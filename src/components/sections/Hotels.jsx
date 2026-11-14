// Hospedaje (T15, RF-11). Cada hotel sale del registro; si trae enlace, la tarjeta entera es
// un enlace con el rótulo «Ver hotel».
import { useTemplate } from "../../hooks/useTemplate.js";

export function Hotels({ hotels }) {
  const { icons } = useTemplate();
  const list = Array.isArray(hotels?.lista) ? hotels.lista : [];

  return (
    <section className="hotels reveal" id="hospedaje">
      <div className="wrap">
        {hotels?.titulo && <h2>{hotels.titulo}</h2>}

        <div className="grid-3">
          {list.map((hotel, i) => {
            const link = hotel?.bookingUrl ?? hotel?.mapaUrl ?? null;
            const content = (
              <>
                <img className="icon" src={icons.hotel} alt="" loading="lazy" decoding="async" />
                <span className="hotel-name">{hotel?.nombre}</span>
                {hotel?.precio && <span className="hotel-price">{hotel.precio}</span>}
                {link && <span className="button button-outline hotel-link">Ver hotel</span>}
              </>
            );
            const key = `${hotel?.nombre ?? "hotel"}-${i}`;

            return link ? (
              <a
                className="hotel-card"
                href={link}
                target="_blank"
                rel="noopener noreferrer"
                key={key}
              >
                {content}
              </a>
            ) : (
              <article className="hotel-card" key={key}>
                {content}
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
