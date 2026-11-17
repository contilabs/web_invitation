// Postal informativa: el contenido procede del registro; el ornamento es decorativo.
import { SectionDivider } from "../ui/SectionDivider.jsx";

function OrnamentalFrame({ className }) {
  return (
    <div className={className} aria-hidden="true">
      {["top-left", "top-right", "bottom-left", "bottom-right"].map((corner) => (
        <svg className={`adults-corner adults-corner-${corner}`} key={corner} viewBox="0 0 50 50" fill="none" focusable="false">
          <path d="M0 49A49 49 0 0 0 49 0" stroke="currentColor" strokeWidth="1" />
        </svg>
      ))}
    </div>
  );
}

export function AdultsOnly({ notice }) {
  return (
    <section className="adults-only reveal" id="solo-adultos" aria-labelledby="adults-only-title">
      <div className="adults-postcard">
        <OrnamentalFrame className="adults-frame adults-frame-outer" />
        <OrnamentalFrame className="adults-frame adults-frame-inner" />
        <div className="adults-copy">
          <p className="adults-greeting">{notice.saludo}</p>
          <h2 id="adults-only-title">{notice.titulo}</h2>
          <SectionDivider className="adults-divider" />
          <div className="adults-message">
            {(notice.parrafos ?? []).map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
          </div>
        </div>
      </div>
    </section>
  );
}
