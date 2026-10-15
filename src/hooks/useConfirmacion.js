// Estado de apertura de la confirmación (T18, RF-18). El cálculo puro vive en
// `utils/confirmation.js`; aquí solo se programa una revisión justo al pasar la fecha
// límite, para que el formulario se cierre sin recargar la página.
import { useEffect, useState } from "react";

import { isConfirmationOpen, deadlineMs } from "../utils/confirmation.js";

export function useConfirmacion(boda) {
  const [abierta, setAbierta] = useState(() =>
    isConfirmationOpen(boda, Date.now()),
  );

  useEffect(() => {
    const evaluar = () => setAbierta(isConfirmationOpen(boda, Date.now()));
    evaluar();

    const limite = deadlineMs(boda);
    const restante = limite - Date.now();
    // Si no hay fecha límite válida o ya pasó, no hay nada que programar.
    if (!Number.isFinite(limite) || restante <= 0) return;

    const temporizador = setTimeout(evaluar, restante + 1000);
    return () => clearTimeout(temporizador);
  }, [boda]);

  return { abierta };
}
