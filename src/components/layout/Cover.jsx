// Portada de bienvenida (T23, RF-1). Mientras está abierta, App marca el resto como
// inerte; aquí se dibuja, se enfoca «Ingresar» al aparecer y se cierra con Escape o con un
// clic fuera de la tarjeta, además del propio botón. Su contenido sale del registro
// (`portada` y `pareja`); la foto de fondo se marca como prioritaria (T26).
import { Fragment, useEffect, useRef } from "react";

import { useTemplate } from "../../hooks/useTemplate.js";
import { coverPhotos } from "../../services/photos.js";
import { coupleNames } from "../../utils/couple.js";

export function Cover({ cover, couple, dateText, onEnter }) {
  const buttonRef = useRef(null);
  const bodyRef = useRef(null);

  const { photoSizes } = useTemplate();
  const names = coupleNames(couple);
  const [background, card] = coverPhotos(cover, [photoSizes.fullWidth, photoSizes.coverCard]);
  const lines = String(cover?.texto ?? "").split("\n");

  useEffect(() => {
    buttonRef.current?.focus();
  }, []);

  // Escape cierra el diálogo (RF-1).
  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === "Escape") onEnter();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onEnter]);

  // Un clic fuera de la tarjeta (sobre el velo) también cierra (RF-1).
  const onBackdropClick = (event) => {
    if (bodyRef.current && !bodyRef.current.contains(event.target)) {
      onEnter();
    }
  };

  return (
    <div
      className="welcome-modal"
      id="portada"
      role="dialog"
      aria-modal="true"
      aria-labelledby="titulo-portada"
      onClick={onBackdropClick}
    >
      {background && (
        <img
          className="cover-backdrop"
          {...background}
          fetchPriority="high"
          decoding="async"
          aria-hidden="true"
        />
      )}
      <div className="cover-veil" aria-hidden="true"></div>

      <div className="welcome-modal-body" ref={bodyRef}>
        {card && (
          <div className="welcome-card">
            <img {...card} decoding="async" />
          </div>
        )}

        <h1 id="titulo-portada">
          {names.first} <span className="amp">&amp;</span> {names.second}
        </h1>

        <p className="welcome-date">{dateText}</p>

        <span className="rule" aria-hidden="true"></span>

        <p className="welcome-text">
          {lines.map((line, i) => (
            <Fragment key={i}>
              {i > 0 && <br />}
              {line}
            </Fragment>
          ))}
        </p>

        <button type="button" id="btn-ingresar" ref={buttonRef} onClick={onEnter}>
          Ingresar
        </button>
      </div>
    </div>
  );
}
