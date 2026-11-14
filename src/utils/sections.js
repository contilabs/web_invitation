// Lógica pura: secciones visibles (RF-4, RF-6, RF-7, RF-8, RF-9, RF-11, RF-14, RF-18)

import { SECTION_ORDER } from "../constants/sections.js";

function isNonEmptyText(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function isNonEmpty(value) {
  if (value === null || value === undefined) return false;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "string") return value.trim().length > 0;
  // Un objeto con solo `titulo` no cuenta: un rótulo no muestra la sección.
  if (typeof value === "object") {
    return Object.entries(value).some(([key, item]) => key !== "titulo" && isNonEmpty(item));
  }
  return true;
}

export function hasContent(key, data) {
  if (!data) return false;
  if (key === "galeria") {
    const images = data?.imagenes ?? [];
    return Array.isArray(images) && images.length > 0;
  }
  if (key === "itinerario" || key === "hoteles") {
    // Forma nueva: `{ titulo, momentos }` / `{ titulo, lista }`. Se acepta la lista suelta
    // por compatibilidad con registros sencillos y con las pruebas de la fase 2.
    const list = Array.isArray(data)
      ? data
      : data?.momentos ?? data?.lista ?? data?.hoteles;
    return Array.isArray(list) && list.length > 0;
  }
  if (key === "regalos") {
    return Array.isArray(data?.opciones) && data.opciones.length > 0;
  }
  if (key === "historia") {
    return Array.isArray(data?.parrafos) && data.parrafos.length > 0;
  }
  if (key === "familia") {
    return isNonEmptyText(data.texto) || (Array.isArray(data.grupos) && data.grupos.some((group) =>
      Array.isArray(group.categorias) && group.categorias.some((category) =>
        Array.isArray(category.nombres) && category.nombres.some(isNonEmptyText))));
  }
  if (key === "cita") {
    return isNonEmptyText(data?.texto);
  }
  return isNonEmpty(data);
}

export function visibleSections(wedding) {
  if (!wedding || typeof wedding !== "object") return [];
  const settings = wedding.ajustes || {};
  const visibility = settings.secciones || {};
  const result = [];
  for (const key of SECTION_ORDER) {
    if (key === "confirmacion") {
      // Siempre presente (RF-18)
      result.push({ key, data: wedding.confirmacion ?? null });
      continue;
    }
    if (visibility[`${key}Visible`] === false) continue;
    // La cuenta tiene fecha propia; sin ella conserva el registro y el ajuste originales de pareja.
    if (key === "cuentaRegresiva" && visibility.parejaVisible === false) continue;
    const data = (key === "cuentaRegresiva" ? wedding.cuentaRegresiva ?? wedding.pareja : wedding[key]) ?? null;
    if (!data) continue;
    if (!hasContent(key, data)) continue;
    result.push({ key, data });
  }
  return result;
}
