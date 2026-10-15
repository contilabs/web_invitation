// Botón flotante de música (T23, RF-5). El icono (silenciado / sonando) lo pone el CSS
// con una clase; aquí solo se refleja el estado y se cambia la etiqueta accesible.
import { musicLabel } from "../../utils/labels.js";

export function MusicToggle({ playing, toggle }) {
  return (
    <button
      type="button"
      className="music-toggle"
      aria-label={musicLabel(playing)}
      onClick={toggle}
    >
      <div className={playing ? "icon-playing" : "icon-muted"}></div>
    </button>
  );
}
