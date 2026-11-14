// Visor a pantalla completa (T22, RF-7). Es un <dialog> nativo: se abre con showModal()
// (bloquea el fondo y atrapa el foco) y Escape lo cierra. Usa una variante intermedia cuando
// existe, o la foto DSC existente e intacta que recibe del servicio de fotos.
import { useEffect, useRef } from "react";

import { pickVariant } from "../../utils/gallery.js";

const INTERMEDIATE_WIDTH = 1400;

export function GalleryViewer({ photo, onClose, onPrevious, onNext }) {
  const dialogRef = useRef(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);

  // Flechas del teclado; el cierre con Escape lo gestiona el propio <dialog>.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const onKeyDown = (event) => {
      if (event.key === "ArrowRight") {
        event.preventDefault();
        onNext();
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        onPrevious();
      }
    };

    dialog.addEventListener("keydown", onKeyDown);
    return () => dialog.removeEventListener("keydown", onKeyDown);
  }, [onNext, onPrevious]);

  const source = pickVariant(photo.srcSet, INTERMEDIATE_WIDTH) ?? photo.src;

  return (
    <dialog
      ref={dialogRef}
      className="lightbox"
      aria-label="Galería de fotos"
      onClose={onClose}
      onClick={(event) => {
        if (event.target === dialogRef.current) dialogRef.current.close();
      }}
    >
      <img src={source} alt={photo.alt} />
      <button type="button" className="lightbox-close" aria-label="Cerrar" onClick={() => dialogRef.current?.close()}>
        ×
      </button>
      <button
        type="button"
        className="lightbox-nav lightbox-prev"
        aria-label="Foto anterior"
        onClick={onPrevious}
      >
        ‹
      </button>
      <button
        type="button"
        className="lightbox-nav lightbox-next"
        aria-label="Foto siguiente"
        onClick={onNext}
      >
        ›
      </button>
    </dialog>
  );
}
