// Estado de la música (T10, RF-5). Función pura: alternar es simplemente invertir
// el estado; el control real del <audio> vive en el componente (T23).

export function siguienteEstadoMusica(sonando) {
  return !sonando;
}
