// Nombres fijos que aparecen al dejar de verse el hero (T15/T28, RF-6). Los nombres salen
// del registro (`pareja`).
import { useHeader } from "../../hooks/useHeader.js";
import { coupleNames } from "../../utils/couple.js";

export function Header({ couple }) {
  const fixed = useHeader("inicio");
  const names = coupleNames(couple);

  return (
    <header className={`site-header${fixed ? " site-header--fixed" : ""}`} id="encabezado">
      <p className="site-header-title">
        {names.first} <span className="amp">&amp;</span> {names.second}
      </p>
    </header>
  );
}
