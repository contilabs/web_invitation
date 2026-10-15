// Panel flotante de controles (T23/T25, RF-5). Agrupa el interruptor de tema y el de música;
// queda `inert` mientras la portada está abierta, de modo que no se pueda interactuar con él.
import { MusicToggle } from "../ui/MusicToggle.jsx";
import { ThemeToggle } from "../ui/ThemeToggle.jsx";

export function ControlsPanel({ inert, withMusic, dark, playing, onToggleTheme, onToggleMusic }) {
  return (
    <div className="fixed-panel" inert={inert}>
      <ThemeToggle dark={dark} toggle={onToggleTheme} />
      {withMusic && <MusicToggle playing={playing} toggle={onToggleMusic} />}
    </div>
  );
}
