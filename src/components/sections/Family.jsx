// Sección «familia»: los nombres salen del registro y se agrupan por papel en la boda.
import { SectionDivider } from "../ui/SectionDivider.jsx";

export function Family({ family }) {
  const title = family?.titulo ? String(family.titulo).trim() : "";
  const groups = Array.isArray(family?.grupos) ? family.grupos : [];
  const visibleGroups = groups
    .map((group) => ({
      ...group,
      nombres: Array.isArray(group?.nombres)
        ? group.nombres.filter((name) => String(name ?? "").trim())
        : (group?.categorias ?? []).flatMap((category) => category?.nombres ?? [])
          .filter((name) => String(name ?? "").trim()),
    }))
    .filter((group) => group.nombres.length > 0);

  if (visibleGroups.length === 0) return null;

  return (
    <section className="family reveal" id="familia" aria-labelledby={title ? "familia-titulo" : undefined}>
      <div className="family-content">
        {title && <h2 id="familia-titulo">{title}</h2>}
        <div className="family-groups">
          {visibleGroups.map((group, groupIndex) => (
            <div className="family-group" key={group.titulo || groupIndex}>
              {groupIndex > 0 && <SectionDivider className="section-divider--family-group" />}
              {group.titulo && <h3>{group.titulo}</h3>}
              <ul>
                {group.nombres.map((name, index) => <li key={`${name}-${index}`}>{name}</li>)}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
