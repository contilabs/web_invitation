// Estado de apertura de la confirmación (RF-11; D9, D23).
//
// Recibe el plazo (`deadline`) por parámetro (valor resuelto del servicio). El «ahora»
// se lee dentro del hook. Programa cierre al pasar el plazo sin recargar (setTimeout).
// El cálculo puro vive en `utils/confirmation.js`.
import { useEffect, useState } from "react";

import { isConfirmationOpen, deadlineMs as deadlineMsUtil } from "../utils/confirmation.js";

export function useConfirmation(deadline) {
  const [open, setOpen] = useState(() => isConfirmationOpen(deadline, Date.now()));

  useEffect(() => {
    const evaluate = () => setOpen(isConfirmationOpen(deadline, Date.now()));
    evaluate();

    const ms = deadlineMsUtil(deadline);
    const remaining = ms - Date.now();
    if (!Number.isFinite(ms) || remaining <= 0) return undefined;
    const timer = setTimeout(evaluate, remaining + 1000);
    return () => clearTimeout(timer);
  }, [deadline]);

  return { open };
}
