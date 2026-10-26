// Sección «historia» (T22, RF-8): el título y los párrafos del registro, en su orden.
export function Story({ story }) {
  const title = story?.titulo ? String(story.titulo).trim() : "";
  const paragraphs = Array.isArray(story?.parrafos) ? story.parrafos : [];

  return (
    <section className="story reveal" id="historia">
      <div className="wrap-narrow">
        {title && <h2>{title}</h2>}
        {paragraphs.map((paragraph, i) => (
          <p key={i}>{paragraph}</p>
        ))}
      </div>
    </section>
  );
}
