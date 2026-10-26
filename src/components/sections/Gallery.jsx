// Galería (T24/T26, RF-7): carrusel de las fotos destacadas con contador, más la rejilla
// con el resto; cualquier foto se abre en el visor a pantalla completa. Las fotos y su
// corte salen del registro (`galeria.imagenes` y `galeria.destacadas`); la mecánica (qué
// foto se ve, el avance) la lleva `useGallery`; el fundido cruzado y el botón de cada
// diapositiva (para el teclado) son del rediseño.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useGallery } from "../../hooks/useGallery.js";
import { useTemplate } from "../../hooks/useTemplate.js";
import { galleryPhotos } from "../../services/photos.js";
import { nextIndex } from "../../utils/gallery.js";
import { GalleryViewer } from "../ui/GalleryViewer.jsx";

export function Gallery({ gallery }) {
  const { photoSizes } = useTemplate();
  const { featured, grid } = useMemo(
    () => galleryPhotos(gallery, photoSizes),
    [gallery, photoSizes],
  );
  const featuredCount = featured.length;
  const { index, next, previous, pause, resume } = useGallery(featuredCount);
  const [preload, setPreload] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(null); // posición en TODAS, o null si está cerrado
  const containerRef = useRef(null);

  // El visor recorre todas las fotos: primero las destacadas y luego la rejilla.
  const all = useMemo(() => [...featured, ...grid], [featured, grid]);

  const openViewer = useCallback(
    (position) => {
      setViewerIndex(position);
      pause();
    },
    [pause],
  );

  const closeViewer = useCallback(() => {
    setViewerIndex(null);
    resume();
  }, [resume]);

  const moveViewer = useCallback(
    (step) => setViewerIndex((current) => nextIndex(current, all.length, step)),
    [all.length],
  );

  // Las diapositivas ocultas no se cargan con `loading="lazy"`: al acercarse la galería
  // se piden todas (con `eager`) para que al avanzar no aparezcan en blanco.
  useEffect(() => {
    const container = containerRef.current;
    if (!container || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      ([entry], self) => {
        if (!entry.isIntersecting) return;
        self.disconnect();
        setPreload(true);
      },
      { rootMargin: "1500px 0px" },
    );
    observer.observe(container);

    return () => observer.disconnect();
  }, []);

  return (
    <section className="gallery reveal" id="galeria-seccion">
      <div className="wrap">{gallery?.titulo && <h2>{gallery.titulo}</h2>}</div>

      {featuredCount > 0 && (
        <div className="gallery-strip" id="galeria" ref={containerRef}>
          {featured.map((photo, position) => {
            const active = position === index;
            return (
              <div
                className={`slide${active ? " slide-active" : ""}`}
                key={photo.src}
                aria-hidden={!active}
              >
                <button
                  type="button"
                  className="slide-button"
                  tabIndex={active ? 0 : -1}
                  aria-label={`Ampliar: ${photo.alt}`}
                  onClick={() => openViewer(position)}
                >
                  <img
                    src={photo.src}
                    srcSet={photo.srcSet}
                    sizes={photo.sizes}
                    alt={photo.alt}
                    loading={preload ? "eager" : "lazy"}
                    decoding="async"
                  />
                </button>
              </div>
            );
          })}

          <button type="button" className="gallery-arrow" onClick={previous}>
            <span className="gallery-arrow-icon" aria-hidden="true"></span>
            <span className="visually-hidden">Foto anterior</span>
          </button>
          <button
            type="button"
            className="gallery-arrow gallery-arrow-next"
            onClick={next}
          >
            <span className="gallery-arrow-icon" aria-hidden="true"></span>
            <span className="visually-hidden">Foto siguiente</span>
          </button>

          <p className="gallery-counter" aria-live="off">
            <span id="galeria-actual">{index + 1}</span> /{" "}
            <span id="galeria-total">{featuredCount}</span>
          </p>
        </div>
      )}

      <div className="wrap">
        <div className="gallery-grid">
          {grid.map((photo, position) => (
            <button
              type="button"
              className="gallery-thumb"
              key={photo.src}
              onClick={() => openViewer(featuredCount + position)}
            >
              <img
                src={photo.src}
                srcSet={photo.srcSet}
                sizes={photo.sizes}
                alt={photo.alt}
                loading="lazy"
                decoding="async"
              />
            </button>
          ))}
        </div>
      </div>

      {viewerIndex !== null && (
        <GalleryViewer
          photo={all[viewerIndex]}
          current={viewerIndex + 1}
          total={all.length}
          onClose={closeViewer}
          onPrevious={() => moveViewer(-1)}
          onNext={() => moveViewer(1)}
        />
      )}
    </section>
  );
}
