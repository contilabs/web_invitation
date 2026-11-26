// Configuración del servicio desde variables de entorno de Vite (RF-15).
//
// `import.meta.env` es el límite de Vite: solo esta pieza lo conoce. `utils/service.js`
// normaliza el resultado para no arrastrar `import.meta` a la lógica pura.
// Los nombres de las variables vienen de `constants/service.js` (D17).
import {
  SERVICE_URL_VAR,
  WEDDING_SLUG_VAR,
  WHATSAPP_PHONE_VAR,
  LEGACY_WHATSAPP_PHONE_VAR,
  DEFAULT_SERVICE_URL,
  DEFAULT_WEDDING_SLUG,
  DEFAULT_WHATSAPP_PHONE,
} from "../constants/service.js";
import { resolveServiceConfig } from "../utils/service.js";

export function readServiceConfig(env = import.meta.env) {
  return resolveServiceConfig({
    url: env?.[SERVICE_URL_VAR] ?? DEFAULT_SERVICE_URL,
    slug: env?.[WEDDING_SLUG_VAR] ?? DEFAULT_WEDDING_SLUG,
  });
}

// El número de destino es configuración pública del despliegue, no contenido de la boda.
// Se normaliza en la lógica pura al construir el enlace de WhatsApp.
export function readWhatsAppPhone(env = import.meta.env) {
  const phone = String(env?.[WHATSAPP_PHONE_VAR] ?? "").trim();
  return phone || String(env?.[LEGACY_WHATSAPP_PHONE_VAR] ?? DEFAULT_WHATSAPP_PHONE).trim();
}
