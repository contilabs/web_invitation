// Resolución del tema día/noche (T9, RF-4). Función pura: la preferencia guardada y
// la del sistema entran como parámetros. La persistencia en `localStorage` vive en
// el hook (T12), que usa esta misma clave. Los valores viven en `constants/theme.js`
// y deben coincidir con el literal que lee el script del <head>.
//
// Nota (T13): los alias en español de abajo desaparecen cuando el hook pase a
// `hooks/useTheme.js` y lea `THEME_*` directamente de `constants/theme.js`.

import { THEME_DAY, THEME_NIGHT, THEME_STORAGE_KEY } from "../constants/theme.js";

export const CLAVE_TEMA = THEME_STORAGE_KEY;
export const TEMA_DIA = THEME_DAY;
export const TEMA_NOCHE = THEME_NIGHT;

export function resolveTheme(guardado, prefiereOscuro) {
  if (guardado === TEMA_DIA || guardado === TEMA_NOCHE) {
    return guardado;
  }
  return prefiereOscuro ? TEMA_NOCHE : TEMA_DIA;
}
