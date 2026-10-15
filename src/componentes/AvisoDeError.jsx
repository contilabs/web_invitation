// Aviso visible del registro (T20, RF-15, RF-20). Pinta los errores (requeridos
// inválidos, conflictos) y los avisos (plantilla válida no implementada) que devuelve la
// validación pura. Vive fuera de <main> y por encima de la portada: si el registro falla,
// se ve al instante.
export function AvisoDeError({ errores = [], avisos = [] }) {
  if (errores.length === 0 && avisos.length === 0) return null;

  return (
    <section className="aviso-registro" role="alert" aria-live="assertive">
      {errores.length > 0 && (
        <div className="aviso-bloque aviso-errores">
          <p className="aviso-titulo">Hay datos inválidos en el registro de la boda</p>
          <ul>
            {errores.map((error, i) => (
              <li key={`error-${error.campo}-${i}`}>
                <strong>{error.campo}</strong>: {error.mensaje}
              </li>
            ))}
          </ul>
        </div>
      )}

      {avisos.length > 0 && (
        <div className="aviso-bloque aviso-avisos">
          <p className="aviso-titulo">Avisos del registro</p>
          <ul>
            {avisos.map((aviso, i) => (
              <li key={`aviso-${aviso.campo}-${i}`}>
                <strong>{aviso.campo}</strong>: {aviso.mensaje}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
