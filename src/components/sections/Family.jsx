// Sección «familia»: los nombres salen del registro y se agrupan por papel en la boda.
export function Family({ family }) {
  const title = family?.titulo ? String(family.titulo).trim() : "";
  const groups = Array.isArray(family?.grupos) ? family.grupos : [];
  const visibleGroups = groups.filter((group) =>
    Array.isArray(group?.nombres) && group.nombres.some((name) => String(name ?? "").trim()),
  );

  if (visibleGroups.length === 0) return null;

  return (
    <section
      className="family reveal"
      id="familia"
      aria-labelledby={title ? "familia-titulo" : undefined}
    >
      <div className="wrap-narrow">
        {title && <h2 id="familia-titulo">{title}</h2>}
        <div className="family-groups">
          {visibleGroups.map((group) => {
            const names = group.nombres.filter((name) => String(name ?? "").trim());
            const groupTitle = group.titulo ? String(group.titulo).trim() : "";

            return (
              <div className="family-group" key={groupTitle || names.join("-")}>
                {groupTitle && <h3>{groupTitle}</h3>}
                <ul>
                  {names.map((name, index) => <li key={`${name}-${index}`}>{name}</li>)}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
