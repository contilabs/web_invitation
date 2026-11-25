// Mesa de regalos (T25, RF-10): pinta las opciones del registro según su tipo; las que
// traen datos copiables (transferencia, efectivo) los muestran como texto y llevan un
// único botón «Copiar». Las imágenes de Liverpool y de depósitos vienen de la plantilla.
import { useEffect, useId, useRef, useState } from "react";
import { giftOptions } from "../../utils/gifts.js";
import { useTemplate } from "../../hooks/useTemplate.js";
import { CopyButton } from "../ui/CopyButton.jsx";
import { SectionDivider } from "../ui/SectionDivider.jsx";

import icoBbva from "../../../assets/icons/bbva.png";

const LOGOS = {
  transferencia: icoBbva,
  efectivo: null,
};

function TransferCard({ option, images }) {
  const [open, setOpen] = useState(false);
  const detailsId = useId();
  const triggerRef = useRef(null);
  const closeRef = useRef(null);
  const copyable = option.copyableField;

  useEffect(() => {
    if (open) closeRef.current?.focus({ preventScroll: true });
  }, [open]);

  function close() {
    setOpen(false);
    triggerRef.current?.focus({ preventScroll: true });
  }

  return (
    <div className="gift-store-link gift-transfer">
      <img className="gift-store-image gift-store-image-day" src={images.light} alt="" loading="lazy" decoding="async" width={1679} height={937} />
      <img className="gift-store-image gift-store-image-night" src={images.dark} alt="" loading="lazy" decoding="async" width={1678} height={937} />
      <button
        type="button"
        className="gift-transfer-trigger"
        ref={triggerRef}
        aria-label={`Ver datos de depósito de ${option.label}`}
        aria-expanded={open}
        aria-controls={detailsId}
        tabIndex={open ? -1 : undefined}
        onClick={() => setOpen(true)}
      />
      <div
        className="gift-transfer-overlay"
        id={detailsId}
        hidden={!open}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            event.stopPropagation();
            close();
          }
        }}
      >
        {open && (
          <>
            <button
              type="button"
              className="gift-transfer-close"
              ref={closeRef}
              aria-label="Cerrar datos de depósito"
              onClick={close}
            >
              <span aria-hidden="true">×</span>
            </button>
            <dl>
              {option.copyableFields.map(({ label, value }) => (
                <div key={label}>
                  <dt className={label === copyable?.label ? undefined : "visually-hidden"}>{label}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
            {copyable && <CopyButton value={copyable.value} label={copyable.label} inline />}
          </>
        )}
      </div>
    </div>
  );
}

export function Gifts({ gifts }) {
  const options = giftOptions(gifts);
  const { icons } = useTemplate();

  return (
    <section className="gifts reveal" id="regalos">
      <div className="wrap">
        {gifts?.titulo && <h2><SectionDivider />{gifts.titulo}</h2>}

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
            const transferImages = icons.transfers?.[option.imageKey];
            if (transferImages) {
              return <TransferCard key={`${option.type}-${i}`} option={option} images={transferImages} />;
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
