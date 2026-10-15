// Encabezado que aparece al dejar de verse la portada principal (T15, RF-6). Observa
// el hero y avisa; sin JavaScript el encabezado no se muestra, que es un estado válido.
import { useEffect, useState } from "react";

export function useEncabezado(idHero, { habilitado = true } = {}) {
  const [fijo, setFijo] = useState(false);

  useEffect(() => {
    if (!habilitado) {
      setFijo(false);
      return;
    }
    const hero = document.getElementById(idHero);
    if (!hero || typeof IntersectionObserver === "undefined") return;

    const observador = new IntersectionObserver(
      ([entrada]) => setFijo(!entrada.isIntersecting),
      { rootMargin: "0px 0px -70% 0px", threshold: 0 },
    );
    observador.observe(hero);

    return () => observador.disconnect();
  }, [idHero, habilitado]);

  return fijo;
}
