// Botón «Copiar» y su aviso (T25, RF-10). Recibe el valor a copiar, una etiqueta para el aviso
// y la tecnología de asistencia, y el texto visible (p. ej. «Copiar cuenta»). La mesa de regalos
// pone un único botón por opción, con el dato que el registro marca como copiable. Si el
// portapapeles falla, avisa para copiar a mano.
import { useCallback, useEffect, useRef, useState } from "react";

const DURACION_AVISO_MS = 5000;

function copiarAlPortapapeles(texto) {
  // `navigator.clipboard` no existe al abrir el archivo con file:// ni sin contexto seguro.
  if (navigator.clipboard && window.isSecureContext) {
    return navigator.clipboard.writeText(texto);
  }

  return new Promise((resolver, rechazar) => {
    const area = document.createElement("textarea");
    area.value = texto;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.top = "-100vh";
    document.body.appendChild(area);
    area.select();
    const correcto = document.execCommand("copy");
    document.body.removeChild(area);
    correcto ? resolver() : rechazar(new Error("No se pudo copiar"));
  });
}

export function BotonCopiar({ valor, etiqueta = "", textoBoton = "Copiar" }) {
  const [mensaje, setMensaje] = useState("");
  const [fase, setFase] = useState("oculto");
  const desvanecer = useRef(null);
  const ocultar = useRef(null);

  const avisar = useCallback((texto) => {
    setMensaje(texto);
    setFase("visible");
    clearTimeout(desvanecer.current);
    desvanecer.current = setTimeout(() => setFase("desvaneciendo"), DURACION_AVISO_MS);
  }, []);

  useEffect(() => {
    if (fase !== "desvaneciendo") return;
    ocultar.current = setTimeout(() => setFase("oculto"), 300);
    return () => clearTimeout(ocultar.current);
  }, [fase]);

  useEffect(
    () => () => {
      clearTimeout(desvanecer.current);
      clearTimeout(ocultar.current);
    },
    [],
  );

  const copiar = useCallback(async () => {
    const texto = String(valor ?? "");
    try {
      await copiarAlPortapapeles(texto);
      avisar(etiqueta ? `Copiado: ${etiqueta}` : "Copiado");
    } catch (error) {
      console.error("Error al copiar al portapapeles: ", error);
      avisar(`No se pudo copiar. El dato es: ${texto}`);
    }
  }, [valor, etiqueta, avisar]);

  const enPantalla = fase !== "oculto";
  const opaco = fase === "visible";
  // Si el texto visible ya nombra el dato, no se repite para lectores de pantalla.
  const etiquetaYaVisible =
    !!etiqueta && textoBoton.toLowerCase().includes(etiqueta.toLowerCase());

  return (
    <>
      <button type="button" className="boton boton-linea boton-copiar" onClick={copiar}>
        {textoBoton}
        {etiqueta && !etiquetaYaVisible && <span className="visually-hidden"> {etiqueta}</span>}
      </button>

      <div
        className="copia-aviso"
        role="status"
        style={{ display: enPantalla ? "block" : "none", opacity: opaco ? 1 : 0 }}
      >
        {mensaje}
      </div>
    </>
  );
}
