// Hospedaje (T15, RF-11). Cada hotel sale del registro; si trae enlace, la tarjeta entera es
// un enlace con el rótulo «Ver hotel».
import { useTemplate } from "../../hooks/useTemplate.js";

export function Hotels({ hotels }) {
  const { icons } = useTemplate();
  const list = Array.isArray(hotels?.lista) ? hotels.lista : [];

  return (
    <section className="hoteles reveal" id="hospedaje">
      <div className="wrap">
        {hotels?.titulo && <h2>{hotels.titulo}</h2>}

        <div className="rejilla-3">
          {list.map((hotel, i) => {
            const link = hotel?.bookingUrl ?? hotel?.mapaUrl ?? null;
            const content = (
              <>
                <img className="ico" src={icons.hotel} alt="" loading="lazy" decoding="async" />
                <span className="hotel-nombre">{hotel?.nombre}</span>
                {hotel?.precio && <span className="hotel-precio">{hotel.precio}</span>}
                {link && <span className="hotel-enlace">Ver hotel</span>}
              </>
            );
            const key = `${hotel?.nombre ?? "hotel"}-${i}`;

            return link ? (
              <a
                className="card-hotel"
                href={link}
                target="_blank"
                rel="noopener noreferrer"
                key={key}
              >
                {content}
              </a>
            ) : (
              <article className="card-hotel" key={key}>
                {content}
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
