// Servicio de fotos (T12, RF-9 · RF-2 · RNF-4). Resuelve las rutas con Vite para que las
// imágenes entren al build con huella y funcionen en cualquier `base`, en dev y en el sitio
// publicado (a diferencia de una ruta escrita a mano, que no se copia a `dist/`).
//
// **No decide presentación**: los `sizes` y las claves de las fotos estructurales se reciben
// de la plantilla. La unidad es la **clave** (la base del nombre, p. ej. `foto5`); las
// variantes optimizadas viven en `assets/photos/opt/` y el nombre termina en su ancho
// (`foto5-900.jpg`). Nunca se usa el original de cámara.
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
export function photoFor(clave, alt = "", sizes) {
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

// Portada: la primera imagen es el fondo y la segunda la tarjeta. Los `sizes` los fija la
// plantilla; el registro decide cuántas imágenes hay y con qué `alt`.
export function coverPhotos(portada, sizes) {
  const imagenes = portada?.imagenes ?? [];
  return imagenes.map((imagen, i) =>
    photoFor(imagen?.clave, imagen?.alt ?? "", sizes[i] ?? sizes[0]),
  );
}

// Galería: las primeras `destacadas` van al carrusel y el resto a la rejilla.
export function galleryPhotos(galeria, sizes) {
  const imagenes = galeria?.imagenes ?? [];
  const corte = Number.isInteger(galeria?.destacadas) ? galeria.destacadas : imagenes.length;
  const limite = Math.max(0, Math.min(corte, imagenes.length));
  const resolver = (imagen, size) => photoFor(imagen?.clave, imagen?.alt ?? "", size);

  return {
    destacadas: imagenes.slice(0, limite).map((imagen) => resolver(imagen, sizes.featured)),
    rejilla: imagenes.slice(limite).map((imagen) => resolver(imagen, sizes.grid)),
  };
}

// Claves que el registro manda resolver (portada + galería).
function registryPhotoKeys() {
  const claves = [];
  for (const imagen of boda?.portada?.imagenes ?? []) {
    if (imagen?.clave) claves.push(imagen.clave);
  }
  for (const imagen of boda?.galeria?.imagenes ?? []) {
    if (imagen?.clave) claves.push(imagen.clave);
  }
  return claves;
}

// Falla al arrancar si falta una clave esperada: así un nombre mal escrito en el registro (o
// en la plantilla) o una variante sin optimizar se ve al instante en vez de dejar un hueco o
// un 404 (RF-9, RF-20). La app la llama con las claves estructurales de la plantilla activa.
export function assertPhotoKeys(structuralKeys) {
  for (const clave of [...structuralKeys, ...registryPhotoKeys()]) {
    photoFor(clave, "");
  }
}
