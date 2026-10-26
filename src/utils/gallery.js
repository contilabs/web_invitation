// Galería (T11, RF-7). Funciones puras.
//
// `nextIndex` da el salto circular entre fotos (total 0 o 1 no rompe).
// `pickVariant` lee el `srcset` y devuelve la variante optimizada más cercana al
// ancho objetivo; descarta las entradas sin ancho (`w`), que son las que apuntarían
// al archivo original de cámara. Si no hay objetivo, devuelve la variante mayor.

export function nextIndex(current, total, step = 1) {
  if (!Number.isInteger(total) || total <= 0) return 0;

  const base = Number.isInteger(current) ? current : 0;
  const jump = Number.isInteger(step) ? step : 1;
  return (((base + jump) % total) + total) % total;
}

export function pickVariant(srcset, targetWidth) {
  if (typeof srcset !== "string") return null;

  const candidates = srcset
    .split(",")
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0)
    .map((entry) => {
      const [url, descriptor] = entry.split(/\s+/);
      const width =
        descriptor && descriptor.endsWith("w") ? parseInt(descriptor, 10) : null;
      return { url, width };
    })
    .filter((candidate) => Number.isInteger(candidate.width) && candidate.width > 0);

  if (candidates.length === 0) return null;

  if (!Number.isFinite(targetWidth)) {
    return candidates.reduce((largest, candidate) =>
      candidate.width > largest.width ? candidate : largest,
    ).url;
  }

  return candidates.reduce((best, candidate) => {
    const distance = Math.abs(candidate.width - targetWidth);
    const bestDistance = Math.abs(best.width - targetWidth);
    if (distance < bestDistance) return candidate;
    if (distance === bestDistance && candidate.width > best.width) return candidate;
    return best;
  }).url;
}
