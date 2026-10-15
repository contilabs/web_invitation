// Itinerario del día (T15, RF-8). Cada momento trae su icono desde la plantilla; el título
// y las horas salen del registro.
import { useTemplate } from "../../hooks/useTemplate.js";

export function Timeline({ timeline }) {
  const { icons } = useTemplate();
  const moments = Array.isArray(timeline?.momentos) ? timeline.momentos : [];

  return (
    <section className="timeline-section reveal" id="itinerario">
      <div className="wrap">
        {timeline?.titulo && <h2>{timeline.titulo}</h2>}

        <ul className="timeline">
          {moments.map((moment, i) => (
            <li className="event" key={`${moment?.titulo ?? "moment"}-${i}`}>
              <span className="event-icon">
                {icons.timeline[moment?.icono] && (
                  <img
                    className="icon"
                    src={icons.timeline[moment.icono]}
                    alt=""
                    loading="lazy"
                    decoding="async"
                  />
                )}
              </span>
              <p className="time">{moment?.hora}</p>
              <p className="label">{moment?.titulo}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
