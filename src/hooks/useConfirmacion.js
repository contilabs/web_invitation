// Estado de apertura de la confirmación (T18, RF-18). El cálculo puro vive en
// `logica/confirmacion.js`; aquí solo se programa una revisión justo al pasar la fecha
// límite, para que el formulario se cierre sin recargar la página.
import { useEffect, useState } from "react";

import { confirmacionAbierta, fechaLimiteMs } from "../logica/confirmacion.js";

export function useConfirmacion(boda) {
  const [abierta, setAbierta] = useState(() =>
    confirmacionAbierta(boda, Date.now()),
  );

  useEffect(() => {
    const evaluar = () => setAbierta(confirmacionAbierta(boda, Date.now()));
    evaluar();

    const limite = fechaLimiteMs(boda);
    const restante = limite - Date.now();
    // Si no hay fecha límite válida o ya pasó, no hay nada que programar.
    if (!Number.isFinite(limite) || restante <= 0) return;

    const temporizador = setTimeout(evaluar, restante + 1000);
    return () => clearTimeout(temporizador);
  }, [boda]);

  return { abierta };
}
