// Cuenta regresiva (T13/T28, RF-3). Muestra días, horas, minutos y segundos, y el mensaje
// posterior al evento cuando ya pasó (lo decide el módulo puro). El instante y el texto de
// la fecha llegan desde el registro (App los resuelve con `utils/event.js`).
import { useCuentaRegresiva } from "../hooks/useCuentaRegresiva.js";

const dosCifras = (numero) => String(numero).padStart(2, "0");

function Caja({ numero, etiqueta }) {
  return (
    <div className="caja">
      <span className="caja-num">{numero}</span>
      <span className="caja-label">{etiqueta}</span>
    </div>
  );
}

export function CuentaRegresiva({ instanteMs, fechaTexto }) {
  const { dias, horas, minutos, segundos, terminado } = useCuentaRegresiva(instanteMs);

  return (
    <section className="Fecha reveal" id="fecha">
      <div className="banda-contenido">
        <p className="fecha-dia">{fechaTexto}</p>
        <p className="faltan">Faltan</p>

        <div id="cuenta-regresiva" className="cuenta-regresiva">
          {terminado ? (
            <p className="msg-post">¡Gracias por celebrar con nosotros!</p>
          ) : (
            <>
              <Caja numero={dias} etiqueta="Días" />
              <Caja numero={dosCifras(horas)} etiqueta="Horas" />
              <Caja numero={dosCifras(minutos)} etiqueta="Min" />
              <Caja numero={dosCifras(segundos)} etiqueta="Seg" />
            </>
          )}
        </div>
      </div>
    </section>
  );
}
