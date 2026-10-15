// Estado de apertura de la confirmación (T18, RF-18). El cálculo puro vive en
// `utils/confirmation.js`; aquí solo se programa una revisión justo al pasar la fecha
// límite, para que el formulario se cierre sin recargar la página.
import { useEffect, useState } from "react";

import { isConfirmationOpen, deadlineMs } from "../utils/confirmation.js";

export function useConfirmation(wedding) {
  const [open, setOpen] = useState(() =>
    isConfirmationOpen(wedding, Date.now()),
  );

  useEffect(() => {
    const evaluate = () => setOpen(isConfirmationOpen(wedding, Date.now()));
    evaluate();

    const deadline = deadlineMs(wedding);
    const remaining = deadline - Date.now();
    // Si no hay fecha límite válida o ya pasó, no hay nada que programar.
    if (!Number.isFinite(deadline) || remaining <= 0) return;

    const timer = setTimeout(evaluate, remaining + 1000);
    return () => clearTimeout(timer);
  }, [wedding]);

  return { open };
}
