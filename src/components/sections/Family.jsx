// Reconocimiento familiar: todos los títulos, grupos y nombres proceden del registro.
import { useWatercolorReveal } from "../../hooks/useReveal.js";
import { useTemplate } from "../../hooks/useTemplate.js";

export function Family({ family, dark }) {
  const { familyLetter } = useTemplate();
  const revealRef = useWatercolorReveal(".family-letter");

  return (
    <section ref={revealRef} className="family" id="familia" aria-labelledby="family-title">
      <img
        className="family-letter"
        src={dark ? familyLetter.dark : familyLetter.light}
        alt={family.imagenAlt}
        width={1080}
        height={1920}
        loading="lazy"
        decoding="async"
      />
      <div className="visually-hidden">
        <h2 id="family-title">{family.titulo}</h2>
        {family.texto && <p>{family.texto}</p>}
        {family.grupos?.map((group) => (
          <div key={group.titulo}>
            <h3>{group.titulo}</h3>
            {group.categorias.map((category) => (
              <div key={category.titulo}>
                <h4>{category.titulo}</h4>
                <ul>
                  {category.nombres.map((name) => <li key={name}>{name}</li>)}
                </ul>
              </div>
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}
