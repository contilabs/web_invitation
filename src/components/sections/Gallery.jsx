// Todas las fotos comparten un carrusel. El visor conserva el mismo orden y
// el gesto horizontal deja libre el desplazamiento vertical de la página.
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

import { useGallery } from "../../hooks/useGallery.js";
import { useTemplate } from "../../hooks/useTemplate.js";
import { galleryPhotos } from "../../services/photos.js";
import { nextIndex } from "../../utils/gallery.js";
import { GalleryViewer } from "../ui/GalleryViewer.jsx";

export function Gallery({ gallery }) {
  const { photoSizes } = useTemplate();
  const photos = useMemo(() => {
    const { featured, grid } = galleryPhotos(gallery, { ...photoSizes, grid: photoSizes.featured });
    return [...featured, ...grid];
  }, [gallery, photoSizes]);
  const total = photos.length;
  const [focused, setFocused] = useState(false);
  const [touching, setTouching] = useState(false);
  const [preload, setPreload] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(null);
  const { index, next, previous } = useGallery(total, {
    suspended: focused || touching || viewerIndex !== null,
  });
  const containerRef = useRef(null);
  const activeButton = useRef(null);
  const restoreSlideFocus = useRef(false);
  const gesture = useRef(null);
  const ignoreClick = useRef(false);

  const moveViewer = useCallback(
    (step) => setViewerIndex((current) => nextIndex(current, total, step)),
    [total],
  );

  useLayoutEffect(() => {
    if (!restoreSlideFocus.current) return;
    restoreSlideFocus.current = false;
    activeButton.current?.focus({ preventScroll: true });
  }, [index]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      ([entry], self) => {
        if (!entry.isIntersecting) return;
        self.disconnect();
        setPreload(true);
      },
      { rootMargin: "300px 0px" },
    );
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  function navigate(step) {
    restoreSlideFocus.current = document.activeElement === activeButton.current;
    (step > 0 ? next : previous)();
  }

  function handleKeyDown(event) {
    if (total < 2 || (event.key !== "ArrowLeft" && event.key !== "ArrowRight")) return;
    event.preventDefault();
    navigate(event.key === "ArrowRight" ? 1 : -1);
  }

  function startGesture(event) {
    if (!event.isPrimary) return;
    ignoreClick.current = false;
    if (event.pointerType !== "touch" || total < 2 || !event.target.closest(".slide-button")) return;
    gesture.current = { id: event.pointerId, x: event.clientX, y: event.clientY };
    setTouching(true);
  }

  function endGesture(event) {
    const start = gesture.current;
    if (start?.id !== event.pointerId) return;
    gesture.current = null;
    setTouching(false);
    if (event.type === "pointercancel") return;
    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    if (Math.abs(dx) < 36 || Math.abs(dx) <= Math.abs(dy) * 1.25) return;
    ignoreClick.current = true;
    navigate(dx < 0 ? 1 : -1);
  }

  return (
    <section className="gallery reveal" id="galeria-seccion">

      {total > 0 && (
        <div
          className="gallery-strip"
          id="galeria"
          ref={containerRef}
          role="group"
          aria-label="Galería de fotos"
          onFocus={() => setFocused(true)}
          onBlur={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false);
          }}
          onKeyDown={handleKeyDown}
          onPointerDown={startGesture}
          onPointerUp={endGesture}
          onPointerCancel={endGesture}
          onClickCapture={(event) => {
            if (!ignoreClick.current || event.detail === 0) return;
            ignoreClick.current = false;
            event.stopPropagation();
          }}
        >
          {photos.map((photo, position) => {
            const active = position === index;
            const nearby = active || position === nextIndex(index, total, -1)
              || position === nextIndex(index, total, 1);
            return (
              <div
                className={`slide${active ? " slide-active" : ""}`}
                key={`${photo.src}-${position}`}
                aria-hidden={!active}
              >
                <button
                  type="button"
                  className="slide-button"
                  ref={active ? activeButton : undefined}
                  tabIndex={active ? 0 : -1}
                  aria-label={`Ampliar: ${photo.alt}`}
                  onClick={() => setViewerIndex(position)}
                >
                  {nearby && <img {...photo} loading={preload ? "eager" : "lazy"} decoding="async" />}
                </button>
              </div>
            );
          })}

          {total > 1 && (
            <>
              <button type="button" className="gallery-arrow" onClick={previous}>
                <span className="gallery-arrow-icon" aria-hidden="true"></span>
                <span className="visually-hidden">Foto anterior</span>
              </button>
              <button type="button" className="gallery-arrow gallery-arrow-next" onClick={next}>
                <span className="gallery-arrow-icon" aria-hidden="true"></span>
                <span className="visually-hidden">Foto siguiente</span>
              </button>
            </>
          )}

        </div>
      )}

      {viewerIndex !== null && (
        <GalleryViewer
          photo={photos[viewerIndex]}
          onClose={() => setViewerIndex(null)}
          onPrevious={() => moveViewer(-1)}
          onNext={() => moveViewer(1)}
        />
      )}
    </section>
  );
}
