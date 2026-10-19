// Configuración del servicio desde variables de entorno de Vite (RF-15).
//
// `import.meta.env` es el límite de Vite: solo esta pieza lo conoce. `utils/service.js`
// normaliza el resultado para no arrastrar `import.meta` a la lógica pura.
// Los nombres de las variables vienen de `constants/service.js` (D17).
import { SERVICE_URL_VAR, WEDDING_SLUG_VAR, DEFAULT_SERVICE_URL, DEFAULT_WEDDING_SLUG } from "../constants/service.js";
import { resolveServiceConfig } from "../utils/service.js";

export function readServiceConfig(env = import.meta.env) {
  return resolveServiceConfig({
    url: env?.[SERVICE_URL_VAR] ?? DEFAULT_SERVICE_URL,
    slug: env?.[WEDDING_SLUG_VAR] ?? DEFAULT_WEDDING_SLUG,
  });
}
