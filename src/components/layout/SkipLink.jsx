// Enlace «Saltar al contenido» (T25, RF-5). Es lo primero dentro de <main>: queda oculto
// hasta recibir foco (la clase vive en el CSS) y su destino sigue siendo el ancla `#inicio`.
export function SkipLink() {
  return (
    <a className="saltar" href="#inicio">
      Saltar al contenido
    </a>
  );
}
