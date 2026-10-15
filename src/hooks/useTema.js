// Tema día/noche con estado (T12, RF-4). Reutiliza lo que el script del <head> ya
// aplicó (`data-tema` en <html>) para no volver a resolverlo ni provocar parpadeo
// (contrato de T4). Solo aquí vive la persistencia en `localStorage`.
import { useCallback, useEffect, useState } from "react";

import { CLAVE_TEMA, TEMA_DIA, TEMA_NOCHE } from "../utils/theme.js";

const COLOR_BARRA = { [TEMA_DIA]: "#f0ebe0", [TEMA_NOCHE]: "#14100d" };

// El tema ya resuelto por el script del <head>: no se recalcula.
function temaInicial() {
  if (typeof document === "undefined") return TEMA_DIA;
  return document.documentElement.dataset.tema === TEMA_NOCHE
    ? TEMA_NOCHE
    : TEMA_DIA;
}

function leerGuardado() {
  try {
    const valor = localStorage.getItem(CLAVE_TEMA);
    return valor === TEMA_DIA || valor === TEMA_NOCHE ? valor : null;
  } catch {
    return null;
  }
}

// El color de la barra del navegador debe seguir la elección del invitado. Las metas
// del <head> traen el valor del sistema; si hay elección guardada, manda una meta sin
// `media` que siempre coincide.
function aplicarColorBarra(tema) {
  let meta = document.querySelector('meta[name="theme-color"]:not([media])');

  if (leerGuardado() === null) {
    if (meta) meta.remove();
    return;
  }

  if (!meta) {
    meta = document.createElement("meta");
    meta.setAttribute("name", "theme-color");
    document.head.appendChild(meta);
  }
  meta.setAttribute("content", COLOR_BARRA[tema]);
}

export function useTema() {
  const [tema, setTema] = useState(temaInicial);

  // Aplica el tema al <html> (la clase que leen los tokens de darkMode.css).
  useEffect(() => {
    const raiz = document.documentElement;
    raiz.classList.toggle("dark-mode", tema === TEMA_NOCHE);
    raiz.dataset.tema = tema;
    aplicarColorBarra(tema);
  }, [tema]);

  const alternar = useCallback(() => {
    setTema((actual) => {
      const nuevo = actual === TEMA_NOCHE ? TEMA_DIA : TEMA_NOCHE;
      try {
        localStorage.setItem(CLAVE_TEMA, nuevo);
      } catch {
        /* sin almacenamiento disponible: se aplica igual, no se recuerda */
      }
      return nuevo;
    });
  }, []);

  // Mientras el invitado no haya elegido manualmente, seguir el tema del sistema.
  useEffect(() => {
    const consulta = window.matchMedia("(prefers-color-scheme: dark)");
    const alCambiar = (evento) => {
      if (leerGuardado() !== null) return;
      setTema(evento.matches ? TEMA_NOCHE : TEMA_DIA);
    };
    consulta.addEventListener("change", alCambiar);
    return () => consulta.removeEventListener("change", alCambiar);
  }, []);

  return { tema, oscuro: tema === TEMA_NOCHE, alternar };
}
