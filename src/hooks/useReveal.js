// Aparición de las secciones al hacer scroll (T16, RF-6). Añade la clase `visible` a
// cada `.reveal` la primera vez que entra en pantalla. Con movimiento reducido el CSS
// lo muestra igual, así que no hace falta una rama aparte.
import { useEffect } from "react";

export function useReveal() {
  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.1 },
    );

    document.querySelectorAll(".reveal").forEach((node) => observer.observe(node));

    return () => observer.disconnect();
  }, []);
}
