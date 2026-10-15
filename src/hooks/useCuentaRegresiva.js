// Cuenta regresiva con estado (T13, RF-3). El cálculo vive en `utils/countdown.js`;
// aquí solo se repite cada segundo y se detiene cuando el evento ya pasó.
import { useEffect, useState } from "react";

import { remainingParts } from "../utils/countdown.js";

export function useCuentaRegresiva(fechaObjetivoMs) {
  const [restante, setRestante] = useState(() =>
    remainingParts(fechaObjetivoMs, Date.now()),
  );

  useEffect(() => {
    setRestante(remainingParts(fechaObjetivoMs, Date.now()));

    const intervalo = setInterval(() => {
      const siguiente = remainingParts(fechaObjetivoMs, Date.now());
      setRestante(siguiente);
      if (siguiente.terminado) clearInterval(intervalo);
    }, 1000);

    return () => clearInterval(intervalo);
  }, [fechaObjetivoMs]);

  return restante;
}
