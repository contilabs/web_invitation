// Constantes: configuración del despliegue del servicio (RF-15; D17, DT-4).
//
// Son los **nombres** de las variables de entorno que fija quien publica y sus valores
// por defecto, vacíos. Llevan el prefijo `VITE_` porque las lee `import.meta.env` (Vite):
// `services/config.js` las recoge y `utils/service.js` normaliza el resultado. No son
// datos de la boda ni contenido del repositorio: son valores por publicación.

export const SERVICE_URL_VAR = "VITE_SERVICE_URL";
export const WEDDING_SLUG_VAR = "VITE_WEDDING_SLUG";
export const WHATSAPP_PHONE_VAR = "VITE_WHATSAPP_PHONE";

// Valores por defecto: sin URL el sistema entra en **modo demo** (no llama a nadie) y sin
// `slug` se muestra «esta invitación no está configurada» (RF-15, D15).
export const DEFAULT_SERVICE_URL = "";
export const DEFAULT_WEDDING_SLUG = "";
export const DEFAULT_WHATSAPP_PHONE = "";
