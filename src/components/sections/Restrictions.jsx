// Vestimenta del registro dentro de un marco vectorial simétrico; sin cabecera exterior.
import { restrictionMessages } from "../../utils/restrictions.js";

const FRAME_OUTLINE = "M300 16C360 16 390 52 418 52C430 90 458 122 500 130C505 170 522 198 551 220C568 315 582 377 582 480C582 583 568 645 551 740C522 762 505 790 500 830C458 838 430 870 418 908C390 908 360 944 300 944C240 944 210 908 182 908C170 870 142 838 100 830C95 790 78 762 49 740C32 645 18 583 18 480C18 377 32 315 49 220C78 198 95 170 100 130C142 122 170 90 182 52C210 52 240 16 300 16Z";

export function Restrictions({ restrictions }) {
  const dressCode = restrictions?.codigoVestimenta ?? restrictions?.vestimenta;
  const messages = restrictionMessages({ ...restrictions, codigoVestimenta: null, vestimenta: null });
  if (!dressCode && messages.length === 0) return null;

  return (
    <section className="restrictions reveal" id="restricciones" aria-labelledby={dressCode ? "dress-code-title" : undefined}>
      <div className="dress-code-frame">
        <svg className="dress-code-outline" viewBox="0 0 600 960" aria-hidden="true" focusable="false">
          <defs>
            <path id="dress-code-shape" d={FRAME_OUTLINE} />
            <pattern id="dress-code-diamonds" width="18" height="18" patternUnits="userSpaceOnUse">
              <path d="M9 0 18 9 9 18 0 9Z" fill="currentColor" fillOpacity="0.7" />
            </pattern>
            <mask id="dress-code-ribbon">
              <use href="#dress-code-shape" fill="white" />
              <use href="#dress-code-shape" transform="translate(300 480) scale(0.95 0.965) translate(-300 -480)" fill="black" />
            </mask>
          </defs>
          <use href="#dress-code-shape" fill="var(--dress-paper)" />
          <use href="#dress-code-shape" fill="url(#dress-code-diamonds)" mask="url(#dress-code-ribbon)" />
          <use href="#dress-code-shape" fill="none" stroke="currentColor" strokeWidth="1.5" />
          <use href="#dress-code-shape" transform="translate(300 480) scale(0.95 0.965) translate(-300 -480)" fill="none" stroke="currentColor" strokeWidth="1.25" />
        </svg>
        <div className="dress-code-content">
          {dressCode && <h2 id="dress-code-title">{dressCode}</h2>}
          {messages.map((message, i) => {
            const separator = message.indexOf(":");
            return (
              <p className={separator >= 0 ? "dress-code-rule" : "dress-code-note"} key={i}>
                {separator >= 0 ? <><strong>{message.slice(0, separator + 1)}</strong>{message.slice(separator + 1)}</> : message}
              </p>
            );
          })}
        </div>
      </div>
    </section>
  );
}
