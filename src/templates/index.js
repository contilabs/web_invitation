// Registro de plantillas (T11, RF-2, RNF-3): hoy solo existe la clásica. Cualquier id
// desconocido cae en la plantilla por defecto. No hay control, parámetro de enlace ni ajuste
// para elegir plantilla: la activa sale del registro de la boda.
import { DEFAULT_TEMPLATE_ID } from "../constants/templates.js";
import classic from "./classic/index.js";

const TEMPLATES = { clasica: classic };

// Devuelve el descriptor de la plantilla pedida; si no existe (o no es un id válido), la de
// por defecto, para que la invitación siempre tenga una plantilla con la que pintarse.
export function resolveTemplate(id) {
  const key = typeof id === "string" ? id.trim().toLowerCase() : "";
  return TEMPLATES[key] ?? TEMPLATES[DEFAULT_TEMPLATE_ID];
}
