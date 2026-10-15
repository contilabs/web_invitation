// Nombres fijos que aparecen al dejar de verse el hero (T15/T28, RF-6). Los nombres salen
// del registro (`pareja`).
import { useHeader } from "../hooks/useHeader.js";
import { coupleNames } from "../utils/couple.js";

export function Encabezado({ pareja }) {
  const fixed = useHeader("inicio");
  const names = coupleNames(pareja);

  return (
    <header className={`inicio${fixed ? " inicio--fijo" : ""}`} id="encabezado">
      <p className="inicio-titulo">
        {names.first} <span className="amp">&amp;</span> {names.second}
      </p>
    </header>
  );

}
