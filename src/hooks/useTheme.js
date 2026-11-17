// Tema día/noche con estado (T12, RF-4). Reutiliza lo que el script del <head> ya
// aplicó (`data-tema` en <html>) para no volver a resolverlo ni provocar parpadeo
// (contrato de T4). El cambio manual solo vive durante la visita actual.
import { useCallback, useEffect, useState } from "react";

import { THEME_DAY, THEME_NIGHT } from "../constants/theme.js";

const BAR_COLOR = { [THEME_DAY]: "#f3efe4", [THEME_NIGHT]: "#20261d" };

// El tema ya resuelto por el script del <head>: no se recalcula.
function initialTheme() {
  if (typeof document === "undefined") return THEME_DAY;
  return document.documentElement.dataset.tema === THEME_NIGHT
    ? THEME_NIGHT
    : THEME_DAY;
}

// El color de la barra del navegador debe seguir el tema actual. La meta sin `media`
// prevalece sobre las metas del <head> que solo sirven como respaldo inicial.
function applyBarColor(theme) {
  let meta = document.querySelector('meta[name="theme-color"]:not([media])');
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
      return next;
    });
  }, []);

  return { theme, dark: theme === THEME_NIGHT, toggle };
}
