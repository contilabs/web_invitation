// Sección «historia» (T22, RF-8): el título y los párrafos del registro, en su orden.
export function Historia({ historia }) {
  const titulo = historia?.titulo ? String(historia.titulo).trim() : "";
  const parrafos = Array.isArray(historia?.parrafos) ? historia.parrafos : [];

  return (
    <section className="historia reveal" id="historia">
      <div className="wrap-estrecho">
        {titulo && <h2>{titulo}</h2>}
        {parrafos.map((parrafo, i) => (
          <p key={i}>{parrafo}</p>
        ))}
      </div>
    </section>
  );
}
