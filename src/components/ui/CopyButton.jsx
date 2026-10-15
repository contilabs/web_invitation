// Botón «Copiar» y su aviso (T25, RF-10). Recibe el valor a copiar, una etiqueta para el aviso
// y la tecnología de asistencia, y el texto visible (p. ej. «Copiar cuenta»). La mesa de regalos
// pone un único botón por opción, con el dato que el registro marca como copiable. Si el
// portapapeles falla, avisa para copiar a mano.
import { useCallback, useEffect, useRef, useState } from "react";

const NOTICE_DURATION_MS = 5000;

function copyToClipboard(text) {
  // `navigator.clipboard` no existe al abrir el archivo con file:// ni sin contexto seguro.
  if (navigator.clipboard && window.isSecureContext) {
    return navigator.clipboard.writeText(text);
  }

  return new Promise((resolve, reject) => {
    const area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.top = "-100vh";
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(area);
    ok ? resolve() : reject(new Error("No se pudo copiar"));
  });
}

export function CopyButton({ value, label = "", buttonText = "Copiar" }) {
  const [message, setMessage] = useState("");
  const [phase, setPhase] = useState("hidden");
  const fadeTimer = useRef(null);
  const hideTimer = useRef(null);

  const notify = useCallback((text) => {
    setMessage(text);
    setPhase("visible");
    clearTimeout(fadeTimer.current);
    fadeTimer.current = setTimeout(() => setPhase("fading"), NOTICE_DURATION_MS);
  }, []);

  useEffect(() => {
    if (phase !== "fading") return;
    hideTimer.current = setTimeout(() => setPhase("hidden"), 300);
    return () => clearTimeout(hideTimer.current);
  }, [phase]);

  useEffect(
    () => () => {
      clearTimeout(fadeTimer.current);
      clearTimeout(hideTimer.current);
    },
    [],
  );

  const copy = useCallback(async () => {
    const text = String(value ?? "");
    try {
      await copyToClipboard(text);
      notify(label ? `Copiado: ${label}` : "Copiado");
    } catch (error) {
      console.error("Error al copiar al portapapeles: ", error);
      notify(`No se pudo copiar. El dato es: ${text}`);
    }
  }, [value, label, notify]);

  const onScreen = phase !== "hidden";
  const opaque = phase === "visible";
  // Si el texto visible ya nombra el dato, no se repite para lectores de pantalla.
  const labelAlreadyVisible =
    !!label && buttonText.toLowerCase().includes(label.toLowerCase());

  return (
    <>
      <button type="button" className="boton boton-linea boton-copiar" onClick={copy}>
        {buttonText}
        {label && !labelAlreadyVisible && <span className="visually-hidden"> {label}</span>}
      </button>

      <div
        className="copia-aviso"
        role="status"
        style={{ display: onScreen ? "block" : "none", opacity: opaque ? 1 : 0 }}
      >
        {message}
      </div>
    </>
  );
}
