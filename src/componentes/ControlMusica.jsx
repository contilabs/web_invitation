// Botón flotante de música (T23, RF-5). El icono (silenciado / sonando) lo pone el CSS
// con una clase; aquí solo se refleja el estado y se cambia la etiqueta accesible.
import { musicLabel } from "../utils/labels.js";

export function ControlMusica({ sonando, alternar }) {
  return (
    <button
      type="button"
      className="btn-musica"
      aria-label={musicLabel(sonando)}
      onClick={alternar}
    >
      <div className={sonando ? "icono-sonando" : "icono-silencio"}></div>
    </button>
  );
}
