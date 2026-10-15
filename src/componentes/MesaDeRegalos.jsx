// Mesa de regalos (T25, RF-10): pinta las opciones del registro según su tipo; las que
// traen datos copiables (transferencia, efectivo) los muestran como texto y llevan un
// **único** botón «Copiar» con el dato que el registro marca como copiable (la cuenta). Los
// logos son presentación y se eligen aquí por tipo.
import { opcionesDeRegalo } from "../logica/regalos.js";
import { BotonCopiar } from "./BotonCopiar.jsx";

import icoBbva from "../../assets/icons/bbva.png";
import icoLiverpool from "../../assets/icons/liverpool.png";

const LOGOS = {
  tienda: icoLiverpool,
  transferencia: icoBbva,
  efectivo: null,
};

export function MesaDeRegalos({ regalos }) {
  const opciones = opcionesDeRegalo(regalos);

  return (
    <section className="mesaregalos reveal" id="regalos">
      <div className="wrap">
        {regalos?.titulo && <h2>{regalos.titulo}</h2>}
        {regalos?.mensaje && <p className="mesa-nota">{regalos.mensaje}</p>}

        <div className="rejilla-2">
          {opciones.map((opcion, i) => {
            const logo = LOGOS[opcion.tipo] ?? null;
            const copiables = Array.isArray(opcion.datosCopiables)
              ? opcion.datosCopiables
              : [];
            const copiable = opcion.datoCopiable ?? null;

            return (
              <article className="card-regalo" key={`${opcion.tipo ?? "regalo"}-${i}`}>
                {logo && (
                  <img
                    className="logo-regalo"
                    src={logo}
                    alt=""
                    loading="lazy"
                    decoding="async"
                  />
                )}

                <h3>{opcion.etiqueta}</h3>
                {opcion.descripcion && <p className="regalo-titular">{opcion.descripcion}</p>}

                {copiables.length > 0 && (
                  <ul className="regalo-datos">
                    {copiables.map((dato, j) => (
                      <li className="regalo-dato" key={`${dato.etiqueta}-${j}`}>
                        <span className="regalo-dato-texto">
                          <span className="regalo-titular">{dato.etiqueta}</span>
                          <span className="regalo-cuenta">{dato.valor}</span>
                        </span>
                      </li>
                    ))}
                  </ul>
                )}

                {copiable && (
                  <BotonCopiar
                    valor={copiable.valor}
                    etiqueta={copiable.etiqueta}
                    textoBoton={`Copiar ${copiable.etiqueta.toLowerCase()}`}
                  />
                )}

                {opcion.url && (
                  <a
                    className="boton boton-solido"
                    href={opcion.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Ver opción
                  </a>
                )}
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
