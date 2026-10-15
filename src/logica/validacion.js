// Lógica pura: validación visible del registro (RF-15, RF-20).
// Devuelve ERRORES (requeridos inválidos, conflictos) y AVISOS (datos válidos pero
// no implementados, como una plantilla distinta de la clásica).

import { IMPLEMENTED_TEMPLATE_IDS } from "../constants/templates.js";
import { instanteDelEvento } from "./evento.js";
import { hayConflictoDeNinos } from "./restricciones.js";

export function plantillaImplementada(plantilla) {
  if (plantilla === null || plantilla === undefined) return "desconocida";
  const s = String(plantilla).trim().toLowerCase();
  if (!s) return "desconocida";
  return IMPLEMENTED_TEMPLATE_IDS.includes(s) ? "implementada" : "no-implementada";
}

function textoNoVacio(v) {
  return typeof v === "string" && v.trim().length > 0;
}

function imagenesDeGaleria(boda) {
  const galeria = boda?.galeria;
  if (!galeria) return [];
  if (Array.isArray(galeria)) return galeria;
  if (Array.isArray(galeria.imagenes)) return galeria.imagenes;
  return [];
}

export function erroresDelRegistro(boda, invitaciones) {
  const errores = [];
  if (!boda || typeof boda !== "object") {
    return [{ campo: "boda", mensaje: "No hay registro de la boda." }];
  }

  // Fecha del evento requerida y válida (RF-3, RF-20)
  const ms = instanteDelEvento(boda.evento ?? {});
  if (Number.isNaN(ms)) {
    errores.push({ campo: "evento.fechaInicio", mensaje: "La fecha del evento falta o es imposible." });
  }

  // Nombres de la pareja requeridos (RF-2)
  const pareja = boda.pareja ?? {};
  if (!pareja.nombre1 && !pareja.primera) {
    errores.push({ campo: "pareja.nombre1", mensaje: "Falta el nombre de la primera persona de la pareja." });
  }
  if (!pareja.nombre2 && !pareja.segunda) {
    errores.push({ campo: "pareja.nombre2", mensaje: "Falta el nombre de la segunda persona de la pareja." });
  }

  // Imágenes de galería resolubles (RF-9, RF-20)
  const imagenes = imagenesDeGaleria(boda);
  imagenes.forEach((img, i) => {
    const clave = img?.clave ?? img?.src ?? null;
    if (!textoNoVacio(clave)) {
      errores.push({ campo: `galeria.imagenes[${i}]`, mensaje: `La imagen ${i + 1} de la galería no tiene clave resoluble.` });
    }
  });

  // Conflicto de niños boda ↔ ficha (RF-12, RF-20)
  if (Array.isArray(invitaciones)) {
    for (const inv of invitaciones) {
      if (hayConflictoDeNinos(boda, inv)) {
        errores.push({
          campo: `invitaciones.${inv?.codigo ?? "?"}`,
          mensaje: `La invitación ${inv?.codigo ?? "?"} asigna niños pero la boda no los permite.`,
        });
      }
    }
  }

  return errores;
}

export function avisosDelRegistro(boda) {
  const avisos = [];
  const estado = plantillaImplementada(boda?.plantilla);
  if (estado === "no-implementada") {
    avisos.push({
      campo: "plantilla",
      mensaje: `La plantilla «${boda?.plantilla}» no está implementada; se usa la clásica.`,
    });
  } else if (estado === "desconocida") {
    avisos.push({ campo: "plantilla", mensaje: "El registro no indica plantilla; se usa la clásica." });
  }
  return avisos;
}
