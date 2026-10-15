// Restricciones (T15, RF-12). Los mensajes los compone la lógica pura (`utils/restrictions.js`)
// a partir de la jerarquía boda → ficha; la sección no se pinta si no hay mensajes.
import { restrictionMessages } from "../../utils/restrictions.js";

export function Restrictions({ restrictions }) {
  const messages = restrictionMessages(restrictions);
  if (messages.length === 0) return null;

  return (
    <section className="restricciones reveal" id="restricciones">
      <div className="wrap-estrecho">
        {restrictions?.titulo && <h2>{restrictions.titulo}</h2>}
        <ul className="restricciones-lista">
          {messages.map((message, i) => (
            <li key={i}>{message}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}
