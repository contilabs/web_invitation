// App (T28, RF-19, RF-22). Es la raíz de composición: lee el registro único
// (`data/wedding.js`) y el catálogo de secciones (`utils/sections.js`) y pinta cada bloque
// con sus datos (el mapa clave → componente vive en `app/sectionRenderers.jsx`). No contiene
// datos ni textos de contenido incrustados. Mientras la portada está abierta, el contenido
// (dentro de <main>) y el panel quedan inertes (RF-1); al cerrarla, el foco pasa al inicio y
// arranca la música (RF-5). El audio no se descarga hasta el primer gesto (T26).
import { useCallback, useEffect, useRef, useState } from "react";

import audioUrl from "../../assets/audio.mp3";

import { boda } from "../data/wedding.js";
import { invitaciones } from "../data/guest-cards.js";
import { DEFAULT_TEMPLATE_ID } from "../constants/templates.js";
import { resolveTemplate } from "../templates/index.js";
import { TemplateProvider } from "../providers/TemplateProvider.jsx";
import { assertPhotoKeys } from "../services/photos.js";
import { formatDate, eventInstant, eventTimeZone } from "../utils/event.js";
import { visibleSections } from "../utils/sections.js";
import { registryWarnings, registryErrors, templateStatus } from "../utils/validation.js";

import { ErrorNotice } from "../components/layout/ErrorNotice.jsx";
import { Cover } from "../components/layout/Cover.jsx";
import { Header } from "../components/layout/Header.jsx";
import { Footer } from "../components/layout/Footer.jsx";
import { SkipLink } from "../components/layout/SkipLink.jsx";
import { ControlsPanel } from "../components/layout/ControlsPanel.jsx";
import { useMusic } from "../hooks/useMusic.js";
import { useReveal } from "../hooks/useReveal.js";
import { useTheme } from "../hooks/useTheme.js";

import { renderSection } from "./sectionRenderers.jsx";

// Todo lo que se deriva del registro se calcula una sola vez (el registro no cambia en
// tiempo de ejecución). La validación pura decide el aviso visible (RF-15, RF-20).
const SECTIONS = visibleSections(boda);
const ERRORS = registryErrors(boda, invitaciones);
const WARNINGS = registryWarnings(boda);

const EVENT_INSTANT = eventInstant(boda.evento);
const DATE_TEXT = formatDate(EVENT_INSTANT, eventTimeZone(boda.evento));

const NAVIGATION = boda.ajustes?.navegacion ?? {};
const HEADER_VISIBLE = NAVIGATION.encabezadoVisible !== false;
const PANEL_VISIBLE = NAVIGATION.panelFlotanteVisible !== false;
const FOOTER_VISIBLE = NAVIGATION.pieVisible !== false;

const MUSIC_ENABLED = boda.ajustes?.musica?.habilitada !== false;
const COVER_VISIBLE = SECTIONS.some((section) => section.key === "portada");

// La plantilla activa sale del registro; si no está implementada, la de por defecto (RF-2).
const TEMPLATE = resolveTemplate(
  templateStatus(boda.plantilla) === "implemented" ? boda.plantilla : DEFAULT_TEMPLATE_ID,
);

// Falla al arrancar si falta alguna variante optimizada (claves del registro y de la plantilla).
assertPhotoKeys(Object.values(TEMPLATE.structuralPhotos));

const KEYS_WITH_COVER = (section) => section.key !== "portada";

// La portada no se pinta dentro de <main>: el resto de secciones recibe aquí sus datos.
const SECTION_CONTEXT = { wedding: boda, dateText: DATE_TEXT, eventInstant: EVENT_INSTANT };

export function App() {
  const { dark, toggle: toggleTheme } = useTheme();
  const { audioRef, playing, toggle: toggleMusic, play } = useMusic({
    enabled: MUSIC_ENABLED,
  });
  const [coverOpen, setCoverOpen] = useState(COVER_VISIBLE);
  const contentRef = useRef(null);

  useReveal();

  // El título de la pestaña y la descripción salen del registro (T28, RF-19).
  useEffect(() => {
    document.title = boda.marca?.nombre ?? boda.evento?.titulo ?? document.title;

    const descripcion = boda.evento?.descripcion;
    if (!descripcion) return;
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "description");
      document.head.appendChild(meta);
    }
    meta.setAttribute("content", descripcion);
  }, []);

  // Al cerrar la portada, el foco pasa al inicio de la invitación (RF-1).
  useEffect(() => {
    if (coverOpen) return;
    const destino = document.getElementById("inicio") ?? contentRef.current;
    destino?.focus();
  }, [coverOpen]);

  // Cerrar la portada es un gesto: la música arranca aquí (RF-5).
  const ingresar = useCallback(() => {
    setCoverOpen(false);
    window.scrollTo({ top: 0, behavior: "auto" });
    play();
  }, [play]);

  return (
    <TemplateProvider template={TEMPLATE}>
      <ErrorNotice errors={ERRORS} warnings={WARNINGS} />

      {coverOpen && (
        <Cover
          cover={boda.portada}
          couple={boda.pareja}
          dateText={DATE_TEXT}
          onEnter={ingresar}
        />
      )}

      {PANEL_VISIBLE && (
        <ControlsPanel
          inert={coverOpen}
          withMusic={MUSIC_ENABLED}
          dark={dark}
          playing={playing}
          onToggleTheme={toggleTheme}
          onToggleMusic={toggleMusic}
        />
      )}

      {MUSIC_ENABLED && (
        <audio ref={audioRef} loop preload="none">
          <source src={audioUrl} type="audio/mpeg" />
        </audio>
      )}

      <main className="site-content" ref={contentRef} tabIndex={-1} inert={coverOpen}>
        <SkipLink />

        {HEADER_VISIBLE && <Header couple={boda.pareja} />}

        {SECTIONS.filter(KEYS_WITH_COVER).map((section) => renderSection(section, SECTION_CONTEXT))}

        {FOOTER_VISIBLE && (
          <Footer
            couple={boda.pareja}
            dateText={DATE_TEXT}
            place={boda.evento?.lugar}
            credit={boda.marca?.enlaces?.credito}
          />
        )}
      </main>
    </TemplateProvider>
  );
}
