// Resolución del tema día/noche (T9, RF-4). Función pura: la preferencia guardada y
// la del sistema entran como parámetros. La persistencia en `localStorage` vive en
// el hook (T12), que usa esta misma clave. `CLAVE_TEMA` debe coincidir con el
// literal que lee el script del <head> (no puede importar este módulo).

export const CLAVE_TEMA = "kg-tema";
export const TEMA_DIA = "dia";
export const TEMA_NOCHE = "noche";

export function resolverTema(guardado, prefiereOscuro) {
  if (guardado === TEMA_DIA || guardado === TEMA_NOCHE) {
    return guardado;
  }
  return prefiereOscuro ? TEMA_NOCHE : TEMA_DIA;
}
