// Interruptor de tema (T12, RF-4). El aspecto (sol/luna, posición del pulgar) lo
// pone el CSS según `html.dark-mode`; aquí solo se refleja el estado accesible.
import { THEME_ARIA_LABEL, themeLabel } from "../utils/labels.js";

export function ControlTema({ oscuro, alternar }) {
  return (
    <button
      type="button"
      className="toggle-btn"
      aria-label={THEME_ARIA_LABEL}
      aria-pressed={oscuro}
      title={themeLabel(oscuro ? "noche" : "dia")}
      onClick={alternar}
    >
      <span className="toggle-thumb" aria-hidden="true"></span>
      <span className="icons" aria-hidden="true">
        <svg className="sun" viewBox="0 0 24 24" focusable="false">
          <circle cx="12" cy="12" r="4.4" />
          <path d="M12 1.8v2.6M12 19.6v2.6M1.8 12h2.6M19.6 12h2.6M4.7 4.7l1.9 1.9M17.4 17.4l1.9 1.9M19.3 4.7l-1.9 1.9M6.6 17.4l-1.9 1.9" />
        </svg>
        <svg className="moon" viewBox="0 0 24 24" focusable="false">
          <path d="M20.2 14.6A8.6 8.6 0 0 1 9.4 3.8a8.6 8.6 0 1 0 10.8 10.8Z" />
        </svg>
      </span>
    </button>
  );
}
