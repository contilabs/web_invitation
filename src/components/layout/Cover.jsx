// Portada de bienvenida (T23, RF-1). Mientras está abierta, App marca el resto como
// inerte; aquí se dibuja, se enfoca «Ingresar» al aparecer y se cierra con Escape o con un
// clic fuera del contenido, además del propio botón. El contenido sale del registro.
import { Fragment, useEffect, useRef } from "react";

import { coupleNames } from "../../utils/couple.js";

// Estilos acotados a la portada: la invitación conserva los tokens de su plantilla.
const coverStyles = `
  #portada.welcome-modal {
    box-sizing: border-box; width: 100%; height: 100vh; height: 100dvh;
    padding: max(.75rem, env(safe-area-inset-top)) max(.75rem, env(safe-area-inset-right))
      max(.75rem, env(safe-area-inset-bottom)) max(.75rem, env(safe-area-inset-left));
    overflow-y: auto; isolation: isolate; color-scheme: light; z-index: 10000;
    background: var(--welcome-backdrop); color: var(--welcome-ink);
  }
  #portada .welcome-modal-body {
    box-sizing: border-box; width: min(100%, 28rem);
    min-height: 25rem; height: min(41rem, calc(100svh - 1.5rem));
    margin: auto; padding: 3.75rem 2.5rem; flex-shrink: 0;
    border: 0; border-radius: 0; outline: none;
    box-shadow: var(--sombra-suave); isolation: isolate;
    background: var(--welcome-paper); display: flex; flex-direction: column;
    align-items: center; justify-content: center;
  }
  #portada .welcome-border {
    position: absolute; inset: .7rem;
    width: calc(100% - 1.4rem); height: calc(100% - 1.4rem);
    overflow: visible; fill: none; stroke: var(--welcome-line);
    pointer-events: none; z-index: -1;
  }
  #portada h1 {
    font-family: var(--fuente-titulo); font-size: clamp(2.35rem, 10.5vw, 3.8rem);
    font-weight: 400; line-height: 1.12; letter-spacing: .025em;
    color: var(--welcome-ink); margin: 0; max-width: 100%;
  }
  #portada .welcome-name { display: block; }
  #portada .amp {
    display: block; font-family: var(--fuente-script); font-size: .65em;
    line-height: 1; font-weight: 400; margin: .12em 0;
  }
  #portada .welcome-text {
    order: -1; font-family: var(--fuente-texto); color: var(--welcome-ink);
    font-size: clamp(.62rem, 2.5vw, .75rem); line-height: 1.8;
    text-transform: uppercase; letter-spacing: .13em; margin: 0 0 1.8rem;
  }
  #portada .welcome-date {
    font-family: var(--fuente-texto); color: var(--welcome-ink);
    font-size: clamp(.7rem, 2.8vw, .85rem); font-weight: 400;
    letter-spacing: .13em; line-height: 1.7; margin: 1.75rem 0 0;
  }
  #portada .rule {
    width: 3.25rem; height: 1px; flex-shrink: 0;
    background: var(--welcome-line); margin: 1.4rem auto 0;
  }
  #portada #btn-ingresar {
    width: min(100%, 11rem); min-height: 48px; padding: .85rem 1rem;
    border: 1px solid var(--welcome-ink); border-radius: .35rem;
    margin-top: 1.4rem; background: var(--welcome-ink); color: var(--welcome-paper);
    letter-spacing: .2em; transition: background-color .25s ease, border-color .25s ease;
  }
  #portada #btn-ingresar:hover, #portada #btn-ingresar:active {
    background: var(--welcome-active); border-color: var(--welcome-active);
  }
  #portada #btn-ingresar:focus-visible {
    outline: 2px solid var(--welcome-active); outline-offset: 4px;
  }
  @media (max-height: 600px) {
    #portada .welcome-modal-body { padding-top: 2.5rem; padding-bottom: 2.5rem; }
    #portada h1 { font-size: clamp(2.2rem, 8dvh, 2.8rem); }
    #portada .welcome-text { margin-bottom: 1.15rem; }
    #portada .welcome-date { margin-top: 1.1rem; }
    #portada .rule { margin-top: .9rem; }
    #portada #btn-ingresar { margin-top: 1rem; }
  }
  @media (max-height: 450px) {
    #portada .welcome-modal-body { min-height: 22rem; padding-top: 2rem; padding-bottom: 2rem; }
    #portada .welcome-text { margin-bottom: .65rem; }
    #portada .welcome-date { margin-top: .75rem; }
    #portada .rule { margin-top: .6rem; }
    #portada #btn-ingresar { margin-top: .75rem; }
  }
  @media (prefers-reduced-motion: reduce) {
    #portada .welcome-modal-body { animation: none; }
    #portada #btn-ingresar { transition: none; }
  }
`;

export function Cover({ cover, couple, dateText, onEnter }) {
  const buttonRef = useRef(null);
  const bodyRef = useRef(null);

  const names = coupleNames(cover?.pareja ?? couple);
  const lines = String(cover?.texto ?? "").split("\n");

  useEffect(() => {
    buttonRef.current?.focus();
  }, []);

  // Escape cierra el diálogo (RF-1).
  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === "Escape") onEnter();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onEnter]);

  // Se conserva el cierre exterior para cualquier clic fuera del contenido.
  const onBackdropClick = (event) => {
    if (bodyRef.current && !bodyRef.current.contains(event.target)) {
      onEnter();
    }
  };

  return (
    <div
      className="welcome-modal"
      id="portada"
      role="dialog"
      aria-modal="true"
      aria-labelledby="titulo-portada"
      onClick={onBackdropClick}
    >
      <style>{coverStyles}</style>
      <div className="welcome-modal-body" ref={bodyRef}>
        <svg className="welcome-border" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true" focusable="false">
          <path d="M0 0H91A9 6 0 0 0 100 6V100H9A9 6 0 0 0 0 94Z" strokeWidth=".65" vectorEffect="non-scaling-stroke" />
          <path d="M1 .65H90A9 6 0 0 0 99 6.65V99.35H10A9 6 0 0 0 1 93.35Z" strokeWidth=".35" vectorEffect="non-scaling-stroke" />
        </svg>
        <h1 id="titulo-portada">
          <span className="welcome-name">{names.first}</span>{" "}
          <span className="amp">&amp;</span>{" "}
          <span className="welcome-name">{names.second}</span>
        </h1>

        <p className="welcome-date">{cover?.fecha ?? dateText}</p>

        <span className="rule" aria-hidden="true"></span>

        <p className="welcome-text">
          {lines.map((line, i) => (
            <Fragment key={i}>
              {i > 0 && <br />}
              {line}
            </Fragment>
          ))}
        </p>

        <button type="button" id="btn-ingresar" ref={buttonRef} onClick={onEnter}>
          Ingresar
        </button>
      </div>
    </div>
  );
}
