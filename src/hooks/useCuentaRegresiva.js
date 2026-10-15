// Cuenta regresiva con estado (T13, RF-3). El cálculo vive en `logica/cuentaRegresiva.js`;
// aquí solo se repite cada segundo y se detiene cuando el evento ya pasó.
import { useEffect, useState } from "react";

import { calcularRestante } from "../logica/cuentaRegresiva.js";

export function useCuentaRegresiva(fechaObjetivoMs) {
  const [restante, setRestante] = useState(() =>
    calcularRestante(fechaObjetivoMs, Date.now()),
  );

  useEffect(() => {
    setRestante(calcularRestante(fechaObjetivoMs, Date.now()));

    const intervalo = setInterval(() => {
      const siguiente = calcularRestante(fechaObjetivoMs, Date.now());
      setRestante(siguiente);
      if (siguiente.terminado) clearInterval(intervalo);
    }, 1000);

    return () => clearInterval(intervalo);
  }, [fechaObjetivoMs]);

  return restante;
}
