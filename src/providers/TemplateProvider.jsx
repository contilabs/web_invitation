// Proveedor de la plantilla activa (T11, RF-2). Publica por contexto el descriptor que
// resuelve `templates/index.js`; las piezas que la necesitan lo leen con `useTemplate()` y
// no importan la plantilla concreta.
import { createContext } from "react";

export const TemplateContext = createContext(null);

export function TemplateProvider({ template, children }) {
  return <TemplateContext.Provider value={template}>{children}</TemplateContext.Provider>;
}
