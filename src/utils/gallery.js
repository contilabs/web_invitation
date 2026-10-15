// Galería (T11, RF-7). Funciones puras.
//
// `nextIndex` da el salto circular entre fotos (total 0 o 1 no rompe).
// `pickVariant` lee el `srcset` y devuelve la variante optimizada más cercana al
// ancho objetivo; descarta las entradas sin ancho (`w`), que son las que apuntarían
// al archivo original de cámara. Si no hay objetivo, devuelve la variante mayor.

export function nextIndex(actual, total, paso = 1) {
  if (!Number.isInteger(total) || total <= 0) return 0;

  const base = Number.isInteger(actual) ? actual : 0;
  const salto = Number.isInteger(paso) ? paso : 1;
  return (((base + salto) % total) + total) % total;
}

export function pickVariant(srcset, anchoObjetivo) {
  if (typeof srcset !== "string") return null;

  const candidatos = srcset
    .split(",")
    .map((entrada) => entrada.trim())
    .filter((entrada) => entrada.length > 0)
    .map((entrada) => {
      const [url, descriptor] = entrada.split(/\s+/);
      const ancho =
        descriptor && descriptor.endsWith("w") ? parseInt(descriptor, 10) : null;
      return { url, ancho };
    })
    .filter((candidato) => Number.isInteger(candidato.ancho) && candidato.ancho > 0);

  if (candidatos.length === 0) return null;

  if (!Number.isFinite(anchoObjetivo)) {
    return candidatos.reduce((mayor, candidato) =>
      candidato.ancho > mayor.ancho ? candidato : mayor,
    ).url;
  }

  return candidatos.reduce((mejor, candidato) => {
    const distancia = Math.abs(candidato.ancho - anchoObjetivo);
    const distanciaMejor = Math.abs(mejor.ancho - anchoObjetivo);
    if (distancia < distanciaMejor) return candidato;
    if (distancia === distanciaMejor && candidato.ancho > mejor.ancho) return candidato;
    return mejor;
  }).url;
}
