// Resolución del tema día/noche (T9, RF-4). Función pura: la preferencia guardada y
// la hora local entran como parámetros. `prefersDark` se conserva como respaldo para
// los consumidores antiguos.

import { THEME_DAY, THEME_NIGHT } from "../constants/theme.js";

export function isNightHour(hour) {
  return hour < 7 || hour >= 19;
}

export function resolveTheme(stored, prefersDark, hour = null) {
  if (stored === THEME_DAY || stored === THEME_NIGHT) {
    return stored;
  }
  if (Number.isFinite(hour)) {
    return isNightHour(hour) ? THEME_NIGHT : THEME_DAY;
  }
  return prefersDark ? THEME_NIGHT : THEME_DAY;
}
