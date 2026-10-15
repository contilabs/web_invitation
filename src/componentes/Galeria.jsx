// Galería (T24/T26, RF-7): carrusel de las fotos destacadas con contador, más la rejilla
// con el resto; cualquier foto se abre en el visor a pantalla completa. Las fotos y su
// corte salen del registro (`galeria.imagenes` y `galeria.destacadas`); la mecánica (qué
// foto se ve, el avance) la lleva `useGallery`; el fundido cruzado y el botón de cada
// diapositiva (para el teclado) son del rediseño.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useGallery } from "../hooks/useGallery.js";
import { useTemplate } from "../hooks/useTemplate.js";
import { galleryPhotos } from "../services/photos.js";
import { nextIndex } from "../utils/gallery.js";
import { Visor } from "./Visor.jsx";

export function Galeria({ galeria }) {
  const { photoSizes } = useTemplate();
  const { destacadas, rejilla } = useMemo(
    () => galleryPhotos(galeria, photoSizes),
    [galeria, photoSizes],
  );
  const totalDestacadas = destacadas.length;
  const { index, next, previous, pause, resume } = useGallery(totalDestacadas);
  const [anticipar, setAnticipar] = useState(false);
  const [visor, setVisor] = useState(null); // posición en TODAS, o null si está cerrado
  const contenedorRef = useRef(null);

  // El visor recorre todas las fotos: primero las destacadas y luego la rejilla.
  const todas = useMemo(() => [...destacadas, ...rejilla], [destacadas, rejilla]);

  const abrirVisor = useCallback(
    (posicion) => {
      setVisor(posicion);
      pause();
    },
    [pause],
  );

  const cerrarVisor = useCallback(() => {
    setVisor(null);
    resume();
  }, [resume]);

  const moverVisor = useCallback(
    (paso) => setVisor((actual) => nextIndex(actual, todas.length, paso)),
    [todas.length],
  );

  // Las diapositivas ocultas no se cargan con `loading="lazy"`: al acercarse la galería
  // se piden todas (con `eager`) para que al avanzar no aparezcan en blanco.
  useEffect(() => {
    const contenedor = contenedorRef.current;
    if (!contenedor || typeof IntersectionObserver === "undefined") return;

    const observador = new IntersectionObserver(
      ([entrada], propio) => {
        if (!entrada.isIntersecting) return;
        propio.disconnect();
        setAnticipar(true);
      },
      { rootMargin: "1500px 0px" },
    );
    observador.observe(contenedor);

    return () => observador.disconnect();
  }, []);

  return (
    <section className="galeria reveal" id="galeria-seccion">
      <div className="wrap">{galeria?.titulo && <h2>{galeria.titulo}</h2>}</div>

      {totalDestacadas > 0 && (
        <div className="galeria-carrusel" id="galeria" ref={contenedorRef}>
          {destacadas.map((foto, posicion) => {
            const activa = posicion === index;
            return (
              <div
                className={`diapositiva${activa ? " activa" : ""}`}
                key={foto.src}
                aria-hidden={!activa}
              >
                <button
                  type="button"
                  className="diapositiva-boton"
                  tabIndex={activa ? 0 : -1}
                  aria-label={`Ampliar: ${foto.alt}`}
                  onClick={() => abrirVisor(posicion)}
                >
                  <img
                    src={foto.src}
                    srcSet={foto.srcSet}
                    sizes={foto.sizes}
                    alt={foto.alt}
                    loading={anticipar ? "eager" : "lazy"}
                    decoding="async"
                  />
                </button>
              </div>
            );
          })}

          <button type="button" className="carrusel-flecha" onClick={previous}>
            <span className="carrusel-flecha-icono" aria-hidden="true"></span>
            <span className="visually-hidden">Foto anterior</span>
          </button>
          <button
            type="button"
            className="carrusel-flecha carrusel-flecha-siguiente"
            onClick={next}
          >
            <span className="carrusel-flecha-icono" aria-hidden="true"></span>
            <span className="visually-hidden">Foto siguiente</span>
          </button>

          <p className="galeria-contador" aria-live="off">
            <span id="galeria-actual">{index + 1}</span> /{" "}
            <span id="galeria-total">{totalDestacadas}</span>
          </p>
        </div>
      )}

      <div className="wrap">
        <div className="galeria-rejilla">
          {rejilla.map((foto, posicion) => (
            <button
              type="button"
              className="foto-mini"
              key={foto.src}
              onClick={() => abrirVisor(totalDestacadas + posicion)}
            >
              <img
                src={foto.src}
                srcSet={foto.srcSet}
                sizes={foto.sizes}
                alt={foto.alt}
                loading="lazy"
                decoding="async"
              />
            </button>
          ))}
        </div>
      </div>

      {visor !== null && (
        <Visor
          foto={todas[visor]}
          actual={visor + 1}
          total={todas.length}
          onCerrar={cerrarVisor}
          onAnterior={() => moverVisor(-1)}
          onSiguiente={() => moverVisor(1)}
        />
      )}
    </section>
  );
}
