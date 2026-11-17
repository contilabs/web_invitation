// Reconocimiento familiar: todos los títulos, grupos y nombres proceden del registro.
import { SectionDivider } from "../ui/SectionDivider.jsx";
import { useTemplate } from "../../hooks/useTemplate.js";

export function Family({ family }) {
  const { icons } = useTemplate();
  const groups = family?.grupos ?? [];

  return (
    <section className="family reveal" id="familia" aria-labelledby="family-title">
      <div className="family-content">
        <h2 className="visually-hidden" id="family-title">{family.titulo}</h2>
        {family.texto && <p className="family-intro">{family.texto}</p>}
        {groups.map((group, groupIndex) => (
          <div className="family-group" key={group.titulo}>
            {groupIndex > 0 && <SectionDivider className="section-divider--family-group" />}
            <h3>{group.titulo}</h3>
            <div className="family-grid">
              {group.categorias.map((category, categoryIndex) => (
                <div className="family-category" key={category.titulo}>
                  {categoryIndex > 0 && <SectionDivider className="section-divider--family-category" />}
                  <div className="family-category-heading">
                    <img className="family-leaves" src={icons.familyLeaves.left} alt="" aria-hidden="true" loading="lazy" decoding="async" />
                    <h4>{category.titulo}</h4>
                    <img className="family-leaves" src={icons.familyLeaves.right} alt="" aria-hidden="true" loading="lazy" decoding="async" />
                  </div>
                  <ul>
                    {category.nombres.map((name) => <li key={name}>{name}</li>)}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
