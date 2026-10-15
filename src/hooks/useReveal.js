// Aparición de las secciones al hacer scroll (T16, RF-6). Añade la clase `visible` a
// cada `.reveal` la primera vez que entra en pantalla. Con movimiento reducido el CSS
// lo muestra igual, así que no hace falta una rama aparte.
import { useEffect } from "react";

export function useReveal() {
  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;

    const observador = new IntersectionObserver(
      (entradas) => {
        entradas.forEach((entrada) => {
          if (!entrada.isIntersecting) return;
          entrada.target.classList.add("visible");
          observador.unobserve(entrada.target);
        });
      },
      { threshold: 0.1 },
    );

    document.querySelectorAll(".reveal").forEach((el) => observador.observe(el));

    return () => observador.disconnect();
  }, []);
}
