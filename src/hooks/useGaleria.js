// Estado del carrusel (T21, RF-7/RF-6). El salto circular vive en `logica/galeria.js`;
// aquí se controla qué diapositiva se ve, el avance automático y la pausa del visor.
import { useCallback, useEffect, useState } from "react";

import { siguienteIndice } from "../logica/galeria.js";

const INTERVALO_MS_POR_DEFECTO = 5000;

// Con movimiento reducido no hay avance automático (RF-6). Se sigue vigilando por si
// el invitado cambia la preferencia del sistema durante la visita.
function useMovimientoReducido() {
  const [reducido, setReducido] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );

  useEffect(() => {
    const consulta = window.matchMedia("(prefers-reduced-motion: reduce)");
    const alCambiar = (evento) => setReducido(evento.matches);
    consulta.addEventListener("change", alCambiar);
    return () => consulta.removeEventListener("change", alCambiar);
  }, []);

  return reducido;
}

export function useGaleria(total, { intervaloMs = INTERVALO_MS_POR_DEFECTO } = {}) {
  const [indice, setIndice] = useState(0);
  const [pausado, setPausado] = useState(false);
  const movimientoReducido = useMovimientoReducido();

  const siguiente = useCallback(
    () => setIndice((actual) => siguienteIndice(actual, total, 1)),
    [total],
  );

  const anterior = useCallback(
    () => setIndice((actual) => siguienteIndice(actual, total, -1)),
    [total],
  );

  const pausar = useCallback(() => setPausado(true), []);
  const reanudar = useCallback(() => setPausado(false), []);

  useEffect(() => {
    if (movimientoReducido || pausado || total <= 1) return;

    const intervalo = setInterval(
      () => setIndice((actual) => siguienteIndice(actual, total, 1)),
      intervaloMs,
    );
    return () => clearInterval(intervalo);
  }, [movimientoReducido, pausado, total, intervaloMs]);

  return { indice, siguiente, anterior, pausar, reanudar, movimientoReducido };
}
