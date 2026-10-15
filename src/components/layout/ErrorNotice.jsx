// Aviso visible del registro (T20, RF-15, RF-20). Pinta los errores (requeridos
// inválidos, conflictos) y los avisos (plantilla válida no implementada) que devuelve la
// validación pura. Vive fuera de <main> y por encima de la portada: si el registro falla,
// se ve al instante.
export function ErrorNotice({ errors = [], warnings = [] }) {
  if (errors.length === 0 && warnings.length === 0) return null;

  return (
    <section className="registry-notice" role="alert" aria-live="assertive">
      {errors.length > 0 && (
        <div className="notice-block notice-errors">
          <p className="notice-title">Hay datos inválidos en el registro de la boda</p>
          <ul>
            {errors.map((error, i) => (
              <li key={`error-${error.field}-${i}`}>
                <strong>{error.field}</strong>: {error.message}
              </li>
            ))}
          </ul>
        </div>
      )}

      {warnings.length > 0 && (
        <div className="notice-block notice-warnings">
          <p className="notice-title">Avisos del registro</p>
          <ul>
            {warnings.map((warning, i) => (
              <li key={`aviso-${warning.field}-${i}`}>
                <strong>{warning.field}</strong>: {warning.message}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
