// Reconocimiento familiar: todos los títulos, grupos y nombres proceden del registro.
export function Family({ family }) {
  const groups = family?.grupos ?? [];

  return (
    <section className="family reveal" id="familia" aria-labelledby="family-title">
      <div className="family-content">
        <h2 className="visually-hidden" id="family-title">{family.titulo}</h2>
        {family.texto && <p className="family-intro">{family.texto}</p>}
        {groups.map((group) => (
          <div className="family-group" key={group.titulo}>
            <h3>{group.titulo}</h3>
            <div className="family-grid">
              {group.categorias.map((category) => (
                <div className="family-category" key={category.titulo}>
                  <h4>{category.titulo}</h4>
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
