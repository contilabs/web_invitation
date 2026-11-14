// Mesa de regalos (T25, RF-10): pinta las opciones del registro según su tipo; las que
// traen datos copiables (transferencia, efectivo) los muestran como texto y llevan un
// **único** botón «Copiar» con el dato que el registro marca como copiable (la cuenta). Los
// La tarjeta de Liverpool llega desde la plantilla y es el enlace a la mesa.
import { giftOptions } from "../../utils/gifts.js";
import { useTemplate } from "../../hooks/useTemplate.js";
import { CopyButton } from "../ui/CopyButton.jsx";

import icoBbva from "../../../assets/icons/bbva.png";

const LOGOS = {
  transferencia: icoBbva,
  efectivo: null,
};

export function Gifts({ gifts }) {
  const options = giftOptions(gifts);
  const { icons } = useTemplate();

  return (
    <section className="gifts reveal" id="regalos">
      <div className="wrap">
        {gifts?.titulo && <h2>{gifts.titulo}</h2>}

        <div className="grid-2">
          {options.map((option, i) => {
            if (option.type === "tienda" && option.url) {
              return (
                <a
                  className="gift-store-link"
                  href={option.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Abrir mesa de regalos de ${option.label} (en una nueva pestaña)`}
                  key={`${option.type}-${i}`}
                >
                  <img className="gift-store-image gift-store-image-day" src={icons.liverpool.light} alt="" loading="lazy" decoding="async" />
                  <img className="gift-store-image gift-store-image-night" src={icons.liverpool.dark} alt="" loading="lazy" decoding="async" />
                </a>
              );
            }
            const logo = LOGOS[option.type] ?? null;
            const copyables = Array.isArray(option.copyableFields)
              ? option.copyableFields
              : [];
            const copyable = option.copyableField ?? null;

            return (
              <article className="gift-card" key={`${option.type ?? "regalo"}-${i}`}>
                {logo && (
                  <img
                    className="gift-logo"
                    src={logo}
                    alt=""
                    loading="lazy"
                    decoding="async"
                  />
                )}

                <h3>{option.label}</h3>
                {option.description && <p className="gift-holder">{option.description}</p>}

                {copyables.length > 0 && (
                  <ul className="gift-details">
                    {copyables.map((field, j) => (
                      <li className="gift-detail" key={`${field.label}-${j}`}>
                        <span className="gift-detail-text">
                          <span className="gift-holder">{field.label}</span>
                          <span className="gift-account">{field.value}</span>
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
                    className="button button-solid"
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
