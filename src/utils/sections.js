// Lógica pura: secciones visibles (RF-4, RF-6, RF-7, RF-8, RF-9, RF-11, RF-14, RF-18)

import { SECTION_ORDER } from "../constants/sections.js";

function esTextoNoVacio(valor) {
  return typeof valor === "string" && valor.trim().length > 0;
}

function esNoVacio(valor) {
  if (valor === null || valor === undefined) return false;
  if (Array.isArray(valor)) return valor.length > 0;
  if (typeof valor === "string") return valor.trim().length > 0;
  if (typeof valor === "object") {
    // `titulo` es solo rótulo: por sí solo no hace visible una sección.
    return Object.entries(valor).some(([clave, v]) => clave !== "titulo" && esNoVacio(v));
  }
  return true;
}

export function hasContent(clave, seccion) {
  if (!seccion) return false;
  if (clave === "galeria") {
    const imgs = seccion?.imagenes ?? [];
    return Array.isArray(imgs) && imgs.length > 0;
  }
  if (clave === "itinerario" || clave === "hoteles") {
    // Forma nueva: `{ titulo, momentos }` / `{ titulo, lista }`. Se acepta la lista suelta
    // por compatibilidad con registros sencillos y con las pruebas de la fase 2.
    const lista = Array.isArray(seccion)
      ? seccion
      : seccion?.momentos ?? seccion?.lista ?? seccion?.hoteles;
    return Array.isArray(lista) && lista.length > 0;
  }
  if (clave === "regalos") {
    return Array.isArray(seccion?.opciones) && seccion.opciones.length > 0;
  }
  if (clave === "historia") {
    return Array.isArray(seccion?.parrafos) && seccion.parrafos.length > 0;
  }
  if (clave === "cita") {
    return esTextoNoVacio(seccion?.texto);
  }
  return esNoVacio(seccion);
}

export function visibleSections(boda) {
  if (!boda || typeof boda !== "object") return [];
  const ajustes = boda.ajustes || {};
  const visibilidad = ajustes.secciones || {};
  const resultado = [];
  for (const clave of SECTION_ORDER) {
    if (clave === "confirmacion") {
      // Siempre presente (RF-18)
      resultado.push({ clave, datos: boda.confirmacion ?? null });
      continue;
    }
    if (visibilidad[`${clave}Visible`] === false) continue;
    const datos = boda[clave] ?? null;
    if (!datos) continue;
    if (!hasContent(clave, datos)) continue;
    resultado.push({ clave, datos });
  }
  return resultado;
}
