// Servicio de fotos (T12, RF-9 · RF-2 · RNF-4). Resuelve las rutas con Vite para que las
// imágenes entren al build con huella y funcionen en cualquier `base`, en dev y en el sitio
// publicado (a diferencia de una ruta escrita a mano, que no se copia a `dist/`).
//
// **No decide presentación**: los `sizes` y las claves de las fotos estructurales se reciben
// de la plantilla. La unidad es la **clave** (la base del nombre, p. ej. `foto5`); las
// variantes optimizadas viven en `assets/photos/opt/` y el nombre termina en su ancho
// (`foto5-900.jpg`). Nunca se usa el original de cámara.
import { wedding } from "../data/wedding.js";

const modules = import.meta.glob("../../assets/photos/opt/*.{jpg,jpeg,png}", {
  eager: true,
  query: "?url",
  import: "default",
});

// Fotos DSC ya disponibles: se usan intactas y se excluyen las copias del inventario.
const dscModules = import.meta.glob([
  "../../assets/photos/opt/future/DSC*.{jpg,jpeg,png}",
  "!../../assets/photos/opt/future/DSC00743*[Cc]opy*.{jpg,jpeg,png}",
], { eager: true, query: "?url", import: "default" });
const dscPhotosByKey = new Map(Object.entries(dscModules).map(([path, url]) => [
  path.split("/").pop().replace(/\.[^.]+$/, ""), url,
]));

// clave de la foto ("foto5") -> (ancho -> URL)
const variantsByKey = new Map();
for (const [modulePath, url] of Object.entries(modules)) {
  const file = modulePath.split("/").pop() ?? "";
  const parts = file.match(/^(.+)-(\d+)\.(?:jpg|jpeg|png)$/i);
  if (!parts) continue;

  const [, key, width] = parts;
  if (!variantsByKey.has(key)) variantsByKey.set(key, new Map());
  variantsByKey.get(key).set(Number(width), url);
}

// Elige la variante mayor como `src` y todas en `srcSet`; sin variantes, falla de forma
// visible para que un nombre mal escrito se vea al instante (RF-20).
export function photoFor(key, alt = "", sizes) {
  if (dscPhotosByKey.has(key)) return { src: dscPhotosByKey.get(key), sizes, alt };
  const variants = variantsByKey.get(key);
  if (!variants || variants.size === 0) {
    throw new Error(`No hay variantes optimizadas para «${key}» en assets/photos/opt/`);
  }

  const sorted = [...variants.entries()].sort((a, b) => a[0] - b[0]);
  return {
    src: sorted[sorted.length - 1][1],
    srcSet: sorted.map(([width, url]) => `${url} ${width}w`).join(", "),
    sizes,
    alt,
  };
}

// Portada: la primera imagen es el fondo y la segunda la tarjeta. Los `sizes` los fija la
// plantilla; el registro decide cuántas imágenes hay y con qué `alt`.
export function coverPhotos(cover, sizes) {
  const images = cover?.imagenes ?? [];
  return images.map((image, i) =>
    photoFor(image?.clave, image?.alt ?? "", sizes[i] ?? sizes[0]),
  );
}

// Galería: las primeras `destacadas` van al carrusel y el resto a la rejilla.
export function galleryPhotos(gallery, sizes) {
  const images = gallery?.imagenes ?? [];
  const featuredCount = Number.isInteger(gallery?.destacadas)
    ? gallery.destacadas
    : images.length;
  const limit = Math.max(0, Math.min(featuredCount, images.length));
  const resolve = (image, size) => photoFor(image?.clave, image?.alt ?? "", size);

  return {
    featured: images.slice(0, limit).map((image) => resolve(image, sizes.featured)),
    grid: images.slice(limit).map((image) => resolve(image, sizes.grid)),
  };
}

// Claves que el registro manda resolver (portada + galería).
function registryPhotoKeys() {
  const keys = [];
  for (const image of wedding?.portada?.imagenes ?? []) {
    if (image?.clave) keys.push(image.clave);
  }
  for (const image of wedding?.galeria?.imagenes ?? []) {
    if (image?.clave) keys.push(image.clave);
  }
  return keys;
}

// Falla al arrancar si falta una clave esperada: así un nombre mal escrito en el registro (o
// en la plantilla) o una variante sin optimizar se ve al instante en vez de dejar un hueco o
// un 404 (RF-9, RF-20). La app la llama con las claves estructurales de la plantilla activa.
export function assertPhotoKeys(structuralKeys) {
  for (const key of [...structuralKeys, ...registryPhotoKeys()]) {
    photoFor(key, "");
  }
}
