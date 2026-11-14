// Monograma de la plantilla que aparece al dejar de verse el Hero; el texto alternativo sale del registro.
import { useTemplate } from "../../hooks/useTemplate.js";
import { useHeader } from "../../hooks/useHeader.js";
import { coupleNames } from "../../utils/couple.js";

export function Header({ couple }) {
  const fixed = useHeader("inicio");
  const { icons } = useTemplate();
  const names = coupleNames(couple);

  return (
    <header className={`site-header${fixed ? " site-header--fixed" : ""}`} id="encabezado">
      <p className="site-header-title">
        <img className="site-header-logo site-header-logo--day" src={icons.header.light} alt={names.display} width="1024" height="1024" />
        <img className="site-header-logo site-header-logo--night" src={icons.header.dark} alt={names.display} width="600" height="600" />
      </p>
    </header>
  );
}
