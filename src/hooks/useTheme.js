// Tema día/noche con estado (T12, RF-4). Reutiliza lo que el script del <head> ya
// aplicó (`data-tema` en <html>) para no volver a resolverlo ni provocar parpadeo
// (contrato de T4). Solo aquí vive la persistencia en `localStorage`.
import { useCallback, useEffect, useState } from "react";

import { THEME_DAY, THEME_NIGHT, THEME_STORAGE_KEY } from "../constants/theme.js";

const BAR_COLOR = { [THEME_DAY]: "#f0ebe0", [THEME_NIGHT]: "#14100d" };

// El tema ya resuelto por el script del <head>: no se recalcula.
function initialTheme() {
  if (typeof document === "undefined") return THEME_DAY;
  return document.documentElement.dataset.tema === THEME_NIGHT
    ? THEME_NIGHT
    : THEME_DAY;
}

function readStored() {
  try {
    const value = localStorage.getItem(THEME_STORAGE_KEY);
    return value === THEME_DAY || value === THEME_NIGHT ? value : null;
  } catch {
    return null;
  }
}

// El color de la barra del navegador debe seguir la elección del invitado. Las metas
// del <head> traen el valor del sistema; si hay elección guardada, manda una meta sin
// `media` que siempre coincide.
function applyBarColor(theme) {
  let meta = document.querySelector('meta[name="theme-color"]:not([media])');

  if (readStored() === null) {
    if (meta) meta.remove();
    return;
  }

  if (!meta) {
    meta = document.createElement("meta");
    meta.setAttribute("name", "theme-color");
    document.head.appendChild(meta);
  }
  meta.setAttribute("content", BAR_COLOR[theme]);
}

export function useTheme() {
  const [theme, setTheme] = useState(initialTheme);

  // Aplica el tema al <html> (la clase que leen los tokens de darkMode.css).
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark-mode", theme === THEME_NIGHT);
    root.dataset.tema = theme;
    applyBarColor(theme);
  }, [theme]);

  const toggle = useCallback(() => {
    setTheme((current) => {
      const next = current === THEME_NIGHT ? THEME_DAY : THEME_NIGHT;
      try {
        localStorage.setItem(THEME_STORAGE_KEY, next);
      } catch {
        /* sin almacenamiento disponible: se aplica igual, no se recuerda */
      }
      return next;
    });
  }, []);

  // Mientras el invitado no haya elegido manualmente, seguir el tema del sistema.
  useEffect(() => {
    const query = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = (event) => {
      if (readStored() !== null) return;
      setTheme(event.matches ? THEME_NIGHT : THEME_DAY);
    };
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  return { theme, dark: theme === THEME_NIGHT, toggle };
}
