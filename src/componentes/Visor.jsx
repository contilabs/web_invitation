// Visor a pantalla completa (T22, RF-7). Es un <dialog> nativo: se abre con showModal()
// (bloquea el fondo y atrapa el foco) y Escape lo cierra. Muestra siempre una variante
// optimizada de resolución intermedia, nunca el archivo original de cámara.
import { useEffect, useRef } from "react";

import { pickVariant } from "../utils/gallery.js";

const ANCHO_INTERMEDIO = 1400;

export function Visor({ foto, actual, total, onCerrar, onAnterior, onSiguiente }) {
  const dialogoRef = useRef(null);

  useEffect(() => {
    const dialogo = dialogoRef.current;
    if (dialogo && !dialogo.open) dialogo.showModal();
  }, []);

  // Flechas del teclado; el cierre con Escape lo gestiona el propio <dialog>.
  useEffect(() => {
    const dialogo = dialogoRef.current;
    if (!dialogo) return;

    const alTeclear = (evento) => {
      if (evento.key === "ArrowRight") {
        evento.preventDefault();
        onSiguiente();
      } else if (evento.key === "ArrowLeft") {
        evento.preventDefault();
        onAnterior();
      }
    };

    dialogo.addEventListener("keydown", alTeclear);
    return () => dialogo.removeEventListener("keydown", alTeclear);
  }, [onSiguiente, onAnterior]);

  const fuente = pickVariant(foto.srcSet, ANCHO_INTERMEDIO) ?? foto.src;

  return (
    <dialog
      ref={dialogoRef}
      className="lightbox"
      aria-label="Galería de fotos"
      onClose={onCerrar}
      onCancel={onCerrar}
      onClick={(evento) => {
        if (evento.target === dialogoRef.current) onCerrar();
      }}
    >
      <img src={fuente} alt={foto.alt} />
      <p className="lightbox-contador" aria-live="polite">
        Foto {actual} de {total}
      </p>
      <button type="button" className="lightbox-cerrar" aria-label="Cerrar" onClick={onCerrar}>
        ×
      </button>
      <button
        type="button"
        className="lightbox-nav lightbox-prev"
        aria-label="Foto anterior"
        onClick={onAnterior}
      >
        ‹
      </button>
      <button
        type="button"
        className="lightbox-nav lightbox-next"
        aria-label="Foto siguiente"
        onClick={onSiguiente}
      >
        ›
      </button>
    </dialog>
  );
}
