// Plantilla activa (T11, RF-2). Es la **única vía de acceso**: los componentes no importan
// la plantilla concreta, la reciben del `TemplateProvider` que publica `App`.
import { useContext } from "react";

import { TemplateContext } from "../providers/TemplateProvider.jsx";

export function useTemplate() {
  const template = useContext(TemplateContext);
  if (!template) {
    throw new Error("useTemplate necesita un TemplateProvider por encima.");
  }
  return template;
}
