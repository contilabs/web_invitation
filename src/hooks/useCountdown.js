// Cuenta regresiva con estado (T13, RF-3). El cálculo vive en `utils/countdown.js`;
// aquí solo se repite cada segundo y se detiene cuando el evento ya pasó.
import { useEffect, useState } from "react";

import { remainingParts } from "../utils/countdown.js";

export function useCountdown(targetMs) {
  const [remaining, setRemaining] = useState(() =>
    remainingParts(targetMs, Date.now()),
  );

  useEffect(() => {
    setRemaining(remainingParts(targetMs, Date.now()));

    const interval = setInterval(() => {
      const next = remainingParts(targetMs, Date.now());
      setRemaining(next);
      if (next.done) clearInterval(interval);
    }, 1000);

    return () => clearInterval(interval);
  }, [targetMs]);

  return remaining;
}
