// Lógica pura: validación del registro (RF-1, RF-8, RF-12, RF-20)

import { IMPLEMENTED_TEMPLATE_IDS } from "../constants/templates.js";

import { eventInstant } from "./event.js";
import { hasChildrenConflict } from "./restrictions.js";

export function templateStatus(template) {
  if (template === null || template === undefined) return "unknown";
  const value = String(template).trim().toLowerCase();
  if (!value) return "unknown";
  return IMPLEMENTED_TEMPLATE_IDS.includes(value) ? "implemented" : "not-implemented";
}

function isNonEmptyText(text) {
  return typeof text === "string" && text.trim().length > 0;
}

function galleryImages(wedding) {
  const gallery = wedding?.galeria;
  if (!gallery) return [];
  if (Array.isArray(gallery)) return gallery;
  if (Array.isArray(gallery.imagenes)) return gallery.imagenes;
  return [];
}

export function registryErrors(wedding, guestCards) {
  const errors = [];
  if (!wedding || typeof wedding !== "object") {
    return [{ field: "boda", message: "No hay registro de la boda." }];
  }

  // Fecha del evento requerida y válida (RF-3, RF-20)
  const ms = eventInstant(wedding.evento ?? {});
  if (Number.isNaN(ms)) {
    errors.push({ field: "evento.fechaInicio", message: "La fecha del evento falta o es imposible." });
  }

  // Nombres de la pareja requeridos (RF-2)
  const couple = wedding.pareja ?? {};
  if (!couple.nombre1 && !couple.primera) {
    errors.push({ field: "pareja.nombre1", message: "Falta el nombre de la primera persona de la pareja." });
  }
  if (!couple.nombre2 && !couple.segunda) {
    errors.push({ field: "pareja.nombre2", message: "Falta el nombre de la segunda persona de la pareja." });
  }

  // Imágenes de galería resolubles (RF-9, RF-20)
  const images = galleryImages(wedding);
  images.forEach((image, index) => {
    const key = image?.clave ?? image?.src ?? null;
    if (!isNonEmptyText(key)) {
      errors.push({ field: `galeria.imagenes[${index}]`, message: `La imagen ${index + 1} de la galería no tiene clave resoluble.` });
    }
  });

  // Conflicto de niños boda ↔ ficha (RF-12, RF-20)
  if (Array.isArray(guestCards)) {
    for (const card of guestCards) {
      if (hasChildrenConflict(wedding, card)) {
        errors.push({
          field: `invitaciones.${card?.codigo ?? "?"}`,
          message: `La invitación ${card?.codigo ?? "?"} asigna niños pero la boda no los permite.`,
        });
      }
    }
  }

  return errors;
}

export function registryWarnings(wedding) {
  const warnings = [];
  const status = templateStatus(wedding?.plantilla);
  if (status === "not-implemented") {
    warnings.push({
      field: "plantilla",
      message: `La plantilla «${wedding?.plantilla}» no está implementada; se usa la clásica.`,
    });
  } else if (status === "unknown") {
    warnings.push({ field: "plantilla", message: "El registro no indica plantilla; se usa la clásica." });
  }
  return warnings;
}
