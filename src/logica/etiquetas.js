// Textos de interfaz en español (T10, RF-4 y RF-5). Se conservan los rótulos que ya
// usaba la web anterior para no cambiar lo que lee el invitado ni el lector de
// pantalla. Función pura.

export const ETIQUETA_TEMA_ARIA = "Cambiar entre tema claro y oscuro";

export function etiquetaMusica(sonando) {
  return sonando ? "Pausar la música" : "Reproducir la música";
}

export function etiquetaTema(tema) {
  return tema === "noche" ? "Cambiar a tema claro" : "Cambiar a tema oscuro";
}
