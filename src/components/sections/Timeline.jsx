// Itinerario del día (T15, RF-8). Cada momento trae su icono desde la plantilla; el título
// y las horas salen del registro.
import { useTemplate } from "../../hooks/useTemplate.js";
import { SectionDivider } from "../ui/SectionDivider.jsx";

export function Timeline({ timeline }) {
  const { icons } = useTemplate();
  const moments = Array.isArray(timeline?.momentos) ? timeline.momentos : [];

  return (
    <section className="timeline-section reveal" id="itinerario">
      <div className="wrap">
        {timeline?.titulo && <h2><SectionDivider />{timeline.titulo}</h2>}

        <ul className="timeline">
          {moments.map((moment, i) => (
            <li className="event" key={`${moment?.titulo ?? "moment"}-${i}`}>
              {icons.timeline[moment?.icono] && (
                <img
                  className="icon event-icon"
                  src={icons.timeline[moment.icono]}
                  alt=""
                  loading="lazy"
                  decoding="async"
                />
              )}
              <div className="event-detail">
                {moment?.hora && <p className="time">{moment.hora}</p>}
                <p className="label">{moment?.titulo}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
