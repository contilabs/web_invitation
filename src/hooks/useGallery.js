// Estado del carrusel (T21, RF-7/RF-6). El salto circular vive en `utils/gallery.js`;
// aquí se controla qué diapositiva se ve, el avance automático y la pausa del visor.
import { useCallback, useEffect, useState } from "react";

import { nextIndex } from "../utils/gallery.js";

const DEFAULT_INTERVAL_MS = 5000;

// Con movimiento reducido no hay avance automático (RF-6). Se sigue vigilando por si
// el invitado cambia la preferencia del sistema durante la visita.
function useReducedMotion() {
  const [reduced, setReduced] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = (event) => setReduced(event.matches);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  return reduced;
}

export function useGallery(total, { intervalMs = DEFAULT_INTERVAL_MS } = {}) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const reducedMotion = useReducedMotion();

  const next = useCallback(
    () => setIndex((current) => nextIndex(current, total, 1)),
    [total],
  );

  const previous = useCallback(
    () => setIndex((current) => nextIndex(current, total, -1)),
    [total],
  );

  const pause = useCallback(() => setPaused(true), []);
  const resume = useCallback(() => setPaused(false), []);

  useEffect(() => {
    if (reducedMotion || paused || total <= 1) return;

    const interval = setInterval(
      () => setIndex((current) => nextIndex(current, total, 1)),
      intervalMs,
    );
    return () => clearInterval(interval);
  }, [reducedMotion, paused, total, intervalMs]);

  return { index, next, previous, pause, resume, reducedMotion };
}
