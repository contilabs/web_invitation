// Resolución del tema día/noche (T9, RF-4). Función pura: la preferencia guardada y
// la del sistema entran como parámetros. La persistencia en `localStorage` vive en
// el hook (T12), que usa esta misma clave. Los valores viven en `constants/theme.js`
// y deben coincidir con el literal que lee el script del <head>.

import { THEME_DAY, THEME_NIGHT } from "../constants/theme.js";

export function resolveTheme(stored, prefersDark) {
  if (stored === THEME_DAY || stored === THEME_NIGHT) {
    return stored;
  }
  return prefersDark ? THEME_NIGHT : THEME_DAY;
}
