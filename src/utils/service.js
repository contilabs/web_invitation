// Lógica pura: configuración del despliegue del servicio (RF-15; D15, D17, DT-4).
//
// La ubicación del servicio y el `slug` de la boda son **configuración**, no datos: no
// viajan en el enlace, ni en el registro de la boda, ni en los datos del invitado. Aquí solo
// se **normaliza** lo que `services/config.js` recoge de las variables de entorno de Vite
// (la única pieza que conoce Vite) y se fija el **estado** de la configuración, que decide la
// causa visible.
//
// Sin React, sin DOM, sin variables de Vite y sin red: se puede importar desde `node --test`.

// Estados de la configuración (RF-15, D15):
// - `not-configured`: no hay URL → **modo demo**, no se llama a nadie (`NOT_CONFIGURED`);
// - `missing-slug`: hay URL y falta el `slug` → aviso propio y **sin reintento** (RF-15, I7);
// - `ready`: están las dos → se resuelve la invitación contra el servicio.
export const SERVICE_STATES = {
  NOT_CONFIGURED: "not-configured",
  MISSING_SLUG: "missing-slug",
  READY: "ready",
};

// Texto recortado (o cadena vacía): la configuración se recorta y **no** se deduce el `slug`
// de la URL (RF-15).
function trimmed(value) {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

// Normaliza la configuración cruda y fija su estado.
export function resolveServiceConfig(raw) {
  const url = trimmed(raw?.url);
  const slug = trimmed(raw?.slug);
  if (url === "") return { url: "", slug, state: SERVICE_STATES.NOT_CONFIGURED };
  if (slug === "") return { url, slug: "", state: SERVICE_STATES.MISSING_SLUG };
  return { url, slug, state: SERVICE_STATES.READY };
}
