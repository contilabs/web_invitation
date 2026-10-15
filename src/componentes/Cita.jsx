// Sección «cita» (T22, RF-7): el texto del registro y, si lo trae, su autor. Sustituye a
// la antigua `Frase`, conservando el bloque de cita.
export function Cita({ cita }) {
  const texto = cita?.texto ? String(cita.texto).trim() : "";
  const autor = cita?.autor ? String(cita.autor).trim() : "";

  return (
    <section className="Intro reveal" id="cita">
      <div className="wrap-estrecho">
        <blockquote>
          <p>{texto}</p>
          {autor && <footer className="cita-autor">— {autor}</footer>}
        </blockquote>
      </div>
    </section>
  );
}
