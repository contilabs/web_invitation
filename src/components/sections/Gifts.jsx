// Mesa de regalos (T25, RF-10): pinta las opciones del registro según su tipo; las que
// traen datos copiables (transferencia, efectivo) los muestran como texto y llevan un
// **único** botón «Copiar» con el dato que el registro marca como copiable (la cuenta). Los
// logos son presentación y se eligen aquí por tipo.
import { giftOptions } from "../../utils/gifts.js";
import { CopyButton } from "../ui/CopyButton.jsx";

import icoBbva from "../../../assets/icons/bbva.png";
import icoLiverpool from "../../../assets/icons/liverpool.png";

const LOGOS = {
  tienda: icoLiverpool,
  transferencia: icoBbva,
  efectivo: null,
};

export function Gifts({ gifts }) {
  const options = giftOptions(gifts);

  return (
    <section className="mesaregalos reveal" id="regalos">
      <div className="wrap">
        {gifts?.titulo && <h2>{gifts.titulo}</h2>}
        {gifts?.mensaje && <p className="mesa-nota">{gifts.mensaje}</p>}

        <div className="rejilla-2">
          {options.map((option, i) => {
            const logo = LOGOS[option.type] ?? null;
            const copyables = Array.isArray(option.copyableFields)
              ? option.copyableFields
              : [];
            const copyable = option.copyableField ?? null;

            return (
              <article className="card-regalo" key={`${option.type ?? "regalo"}-${i}`}>
                {logo && (
                  <img
                    className="logo-regalo"
                    src={logo}
                    alt=""
                    loading="lazy"
                    decoding="async"
                  />
                )}

                <h3>{option.label}</h3>
                {option.description && <p className="regalo-titular">{option.description}</p>}

                {copyables.length > 0 && (
                  <ul className="regalo-datos">
                    {copyables.map((field, j) => (
                      <li className="regalo-dato" key={`${field.label}-${j}`}>
                        <span className="regalo-dato-texto">
                          <span className="regalo-titular">{field.label}</span>
                          <span className="regalo-cuenta">{field.value}</span>
                        </span>
                      </li>
                    ))}
                  </ul>
                )}

                {copyable && (
                  <CopyButton
                    value={copyable.value}
                    label={copyable.label}
                    buttonText={`Copiar ${copyable.label.toLowerCase()}`}
                  />
                )}

                {option.url && (
                  <a
                    className="boton boton-solido"
                    href={option.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Ver opción
                  </a>
                )}
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
