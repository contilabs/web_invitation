// Nombres fijos que aparecen al dejar de verse el hero (T15/T28, RF-6). Los nombres salen
// del registro (`pareja`).
import { useEncabezado } from "../hooks/useEncabezado.js";
import { nombresDeLaPareja } from "../logica/pareja.js";

export function Encabezado({ pareja }) {
  const fijo = useEncabezado("inicio");
  const nombres = nombresDeLaPareja(pareja);

  return (
    <header className={`inicio${fijo ? " inicio--fijo" : ""}`} id="encabezado">
      <p className="inicio-titulo">
        {nombres.primera} <span className="amp">&amp;</span> {nombres.segunda}
      </p>
    </header>
  );
}
