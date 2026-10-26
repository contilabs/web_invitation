// Sección «cita» (T22, RF-7): el texto del registro y, si lo trae, su autor. Sustituye a
// la antigua `Frase`, conservando el bloque de cita.
export function Quote({ quote }) {
  const text = quote?.texto ? String(quote.texto).trim() : "";
  const author = quote?.autor ? String(quote.autor).trim() : "";

  return (
    <section className="quote reveal" id="cita">
      <div className="wrap-narrow">
        <blockquote>
          <p>{text}</p>
          {author && <footer className="quote-author">— {author}</footer>}
        </blockquote>
      </div>
    </section>
  );
}
