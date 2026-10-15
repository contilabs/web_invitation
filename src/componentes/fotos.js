// Inventario de fotos (T16, RF-9 · RNF-4). Resuelve las rutas con Vite para que las
// imágenes entren al build con huella y funcionen en cualquier `base`, en dev y en el
// sitio publicado (a diferencia de una ruta escrita a mano, que no se copia a `dist/`).
//
// La unidad es la **clave** (la base del nombre, p. ej. `foto5`). `resolverFoto(clave)`
// devuelve lo que espera un `<img>` de React. Las variantes optimizadas viven en
// `assets/photos/opt/` y el nombre termina en su ancho (`foto5-900.jpg`). Nunca se usa el
// original de cámara.
//
// En la fase 5 la **portada** y la **galería** salen del registro (`wedding.js`); las fotos
// estructurales (hero, retrato y confirmación) siguen resolviéndose aquí.
import { boda } from "../data/wedding.js";

const modulos = import.meta.glob("../../assets/photos/opt/*.{jpg,jpeg,png}", {
  eager: true,
  query: "?url",
  import: "default",
});

// clave ("foto5") -> (ancho -> URL)
const variantesPorClave = new Map();
for (const [ruta, url] of Object.entries(modulos)) {
  const archivo = ruta.split("/").pop() ?? "";
  const partes = archivo.match(/^(.+)-(\d+)\.(?:jpg|jpeg|png)$/i);
  if (!partes) continue;

  const [, clave, ancho] = partes;
  if (!variantesPorClave.has(clave)) variantesPorClave.set(clave, new Map());
  variantesPorClave.get(clave).set(Number(ancho), url);
}

// Devuelve lo que espera un <img> de React: `src`, `srcSet`, `sizes` y `alt` (se puede
// esparcir directamente sobre el elemento). Toma la variante mayor como `src` y todas en
// `srcSet`. Si la clave no tiene variantes optimizadas, falla de forma visible (RF-20).
export function resolverFoto(clave, alt = "", sizes) {
  const variantes = variantesPorClave.get(clave);
  if (!variantes || variantes.size === 0) {
    throw new Error(`No hay variantes optimizadas para «${clave}» en assets/photos/opt/`);
  }

  const ordenadas = [...variantes.entries()].sort((a, b) => a[0] - b[0]);
  return {
    src: ordenadas[ordenadas.length - 1][1],
    srcSet: ordenadas.map(([ancho, url]) => `${url} ${ancho}w`).join(", "),
    sizes,
    alt,
  };
}

const SIZES_ANCHO_COMPLETO = "100vw";
const SIZES_DESTACADA = "(max-width: 1180px) 100vw, 1180px";
const SIZES_REJILLA = "(max-width: 620px) 48vw, (max-width: 900px) 31vw, 23vw";
const SIZES_PORTADA_TARJETA = "14rem";
const SIZES_CONFIRMACION = "(max-width: 860px) 90vw, 34vw";

// Fotos estructurales de la interfaz: no las nombra el registro (el hero, el retrato y la
// foto junto al formulario). El texto alternativo lo pone el componente cuando importa.
const CLAVES_ESTRUCTURALES = ["foto1", "foto9", "foto7"];

export const FOTO_HERO = resolverFoto("foto1", "", SIZES_ANCHO_COMPLETO);
export const FOTO_RETRATO = resolverFoto("foto9", "", SIZES_ANCHO_COMPLETO);
export const FOTO_CONFIRMACION = resolverFoto("foto7", "", SIZES_CONFIRMACION);

// Claves que el registro manda resolver (portada + galería).
function clavesDelRegistro() {
  const claves = [];
  for (const imagen of boda?.portada?.imagenes ?? []) {
    if (imagen?.clave) claves.push(imagen.clave);
  }
  for (const imagen of boda?.galeria?.imagenes ?? []) {
    if (imagen?.clave) claves.push(imagen.clave);
  }
  return claves;
}

// Falla al arrancar si falta una clave esperada: así un nombre mal escrito en el registro
// (o una variante sin optimizar) se ve al instante en vez de dejar un hueco o un 404 (RF-9, RF-20).
for (const clave of [...CLAVES_ESTRUCTURALES, ...clavesDelRegistro()]) {
  resolverFoto(clave, "");
}

// Portada: la primera imagen es el fondo y la segunda la tarjeta. El registro decide
// cuántas hay y con qué `alt`.
export function fotosDePortada(portada = boda?.portada) {
  const imagenes = portada?.imagenes ?? [];
  const sizes = [SIZES_ANCHO_COMPLETO, SIZES_PORTADA_TARJETA];
  return imagenes.map((imagen, i) =>
    resolverFoto(imagen?.clave, imagen?.alt ?? "", sizes[i] ?? SIZES_ANCHO_COMPLETO),
  );
}

// Fotos de la galería: las primeras `destacadas` van al carrusel y el resto a la rejilla.
export function fotosDeGaleria(galeria = boda?.galeria) {
  const imagenes = galeria?.imagenes ?? [];
  const corte = Number.isInteger(galeria?.destacadas) ? galeria.destacadas : imagenes.length;
  const limite = Math.max(0, Math.min(corte, imagenes.length));
  const resolver = (imagen, sizes) =>
    resolverFoto(imagen?.clave, imagen?.alt ?? "", sizes);

  return {
    destacadas: imagenes.slice(0, limite).map((imagen) => resolver(imagen, SIZES_DESTACADA)),
    rejilla: imagenes.slice(limite).map((imagen) => resolver(imagen, SIZES_REJILLA)),
  };
}
