// Portada de bienvenida (T23, RF-1). Mientras está abierta, App marca el resto como
// inerte; aquí se dibuja, se enfoca «Ingresar» al aparecer y se cierra con Escape o con un
// clic fuera de la tarjeta, además del propio botón. Su contenido sale del registro
// (`portada` y `pareja`); la foto de fondo se marca como prioritaria (T26).
import { Fragment, useEffect, useRef } from "react";

import { useTemplate } from "../hooks/useTemplate.js";
import { coverPhotos } from "../services/photos.js";
import { coupleNames } from "../utils/couple.js";

export function Portada({ portada, pareja, fechaTexto, onIngresar }) {
  const botonRef = useRef(null);
  const cuerpoRef = useRef(null);

  const { photoSizes } = useTemplate();
  const nombres = coupleNames(pareja);
  const [fondo, tarjeta] = coverPhotos(portada, [photoSizes.fullWidth, photoSizes.coverCard]);
  const lineas = String(portada?.texto ?? "").split("\n");

  useEffect(() => {
    botonRef.current?.focus();
  }, []);

  // Escape cierra el diálogo (RF-1).
  useEffect(() => {
    const alTeclear = (evento) => {
      if (evento.key === "Escape") onIngresar();
    };
    document.addEventListener("keydown", alTeclear);
    return () => document.removeEventListener("keydown", alTeclear);
  }, [onIngresar]);

  // Un clic fuera de la tarjeta (sobre el velo) también cierra (RF-1).
  const alClicFondo = (evento) => {
    if (cuerpoRef.current && !cuerpoRef.current.contains(evento.target)) {
      onIngresar();
    }
  };

  return (
    <div
      className="modal-bienvenida"
      id="portada"
      role="dialog"
      aria-modal="true"
      aria-labelledby="titulo-portada"
      onClick={alClicFondo}
    >
      {fondo && (
        <img
          className="portada-fondo"
          {...fondo}
          fetchPriority="high"
          decoding="async"
          aria-hidden="true"
        />
      )}
      <div className="portada-velo" aria-hidden="true"></div>

      <div className="modal-bienvenida-body" ref={cuerpoRef}>
        {tarjeta && (
          <div className="modal-intro-img">
            <img {...tarjeta} decoding="async" />
          </div>
        )}

        <h1 id="titulo-portada">
          {nombres.first} <span className="amp">&amp;</span> {nombres.second}
        </h1>

        <p className="modal-fecha">{fechaTexto}</p>

        <span className="filete" aria-hidden="true"></span>

        <p className="modal-invitacion">
          {lineas.map((linea, i) => (
            <Fragment key={i}>
              {i > 0 && <br />}
              {linea}
            </Fragment>
          ))}
        </p>

        <button type="button" id="btn-ingresar" ref={botonRef} onClick={onIngresar}>
          Ingresar
        </button>
      </div>
    </div>
  );
}
