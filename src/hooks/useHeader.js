// Encabezado que aparece al dejar de verse la portada principal (T15, RF-6). Observa
// el hero y avisa; sin JavaScript el encabezado no se muestra, que es un estado válido.
import { useEffect, useState } from "react";

export function useHeader(heroId, { enabled = true } = {}) {
  const [fixed, setFixed] = useState(false);

  useEffect(() => {
    if (!enabled) {
      setFixed(false);
      return;
    }
    const hero = document.getElementById(heroId);
    if (!hero || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      ([entry]) => setFixed(!entry.isIntersecting),
      { rootMargin: "0px 0px -70% 0px", threshold: 0 },
    );
    observer.observe(hero);

    return () => observer.disconnect();
  }, [heroId, enabled]);

  return fixed;
}
