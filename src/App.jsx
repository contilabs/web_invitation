// App (T28, RF-19, RF-22). Es la raíz de composición: lee el registro único
// (`data/wedding.js`) y el catálogo de secciones (`utils/sections.js`) y pinta cada bloque
// con sus datos. No contiene datos ni textos de contenido incrustados. Mientras la portada
// está abierta, el contenido (dentro de <main>) y el panel quedan inertes (RF-1); al
// cerrarla, el foco pasa al inicio y arranca la música (RF-5). El audio no se descarga hasta
// el primer gesto (T26).
import { Fragment, useCallback, useEffect, useRef, useState } from "react";

import audioUrl from "../assets/audio.mp3";

import { boda } from "./data/wedding.js";
import { invitaciones } from "./data/guest-cards.js";
import { DEFAULT_TEMPLATE_ID } from "./constants/templates.js";
import { resolveTemplate } from "./templates/index.js";
import { TemplateProvider } from "./providers/TemplateProvider.jsx";
import { assertPhotoKeys } from "./services/photos.js";
import { formatDate, eventInstant, eventTimeZone } from "./utils/event.js";
import { visibleSections } from "./utils/sections.js";
import { registryWarnings, registryErrors, templateStatus } from "./utils/validation.js";

import { ErrorNotice } from "./components/layout/ErrorNotice.jsx";
import { Cover } from "./components/layout/Cover.jsx";
import { Header } from "./components/layout/Header.jsx";
import { Footer } from "./components/layout/Footer.jsx";
import { SkipLink } from "./components/layout/SkipLink.jsx";
import { ControlsPanel } from "./components/layout/ControlsPanel.jsx";
import { Cita } from "./componentes/Cita.jsx";
import { Confirmacion } from "./componentes/Confirmacion.jsx";
import { CuentaRegresiva } from "./componentes/CuentaRegresiva.jsx";
import { Galeria } from "./componentes/Galeria.jsx";
import { Historia } from "./componentes/Historia.jsx";
import { MesaDeRegalos } from "./componentes/MesaDeRegalos.jsx";
import {
  Hero,
  Hoteles,
  Itinerario,
  Lugares,
  Restricciones,
  Retrato,
} from "./componentes/Secciones.jsx";
import { useMusic } from "./hooks/useMusic.js";
import { useReveal } from "./hooks/useReveal.js";
import { useTheme } from "./hooks/useTheme.js";

// Todo lo que se deriva del registro se calcula una sola vez (el registro no cambia en
// tiempo de ejecución). La validación pura decide el aviso visible (RF-15, RF-20).
const SECCIONES = visibleSections(boda);
const ERRORES = registryErrors(boda, invitaciones);
const AVISOS = registryWarnings(boda);

const INSTANTE_EVENTO = eventInstant(boda.evento);
const FECHA_TEXTO = formatDate(INSTANTE_EVENTO, eventTimeZone(boda.evento));

const NAVEGACION = boda.ajustes?.navegacion ?? {};
const ENCABEZADO_VISIBLE = NAVEGACION.encabezadoVisible !== false;
const PANEL_VISIBLE = NAVEGACION.panelFlotanteVisible !== false;
const PIE_VISIBLE = NAVEGACION.pieVisible !== false;

const MUSICA_HABILITADA = boda.ajustes?.musica?.habilitada !== false;
const PORTADA_VISIBLE = SECCIONES.some((seccion) => seccion.key === "portada");

// La plantilla activa sale del registro; si no está implementada, la de por defecto (RF-2).
const TEMPLATE = resolveTemplate(
  templateStatus(boda.plantilla) === "implemented" ? boda.plantilla : DEFAULT_TEMPLATE_ID,
);

// Falla al arrancar si falta alguna variante optimizada (claves del registro y de la plantilla).
assertPhotoKeys(Object.values(TEMPLATE.structuralPhotos));

const CLAVES_CON_PORTADA = (seccion) => seccion.key !== "portada";

// Cada clave del catálogo se pinta con su componente; el bloque `pareja` agrupa el hero, la
// cuenta regresiva y el retrato.
function pintarSeccion({ key, data }) {
  switch (key) {
    case "pareja":
      return (
        <Fragment key="pareja">
          <Hero pareja={boda.pareja} fechaTexto={FECHA_TEXTO} />
          <CuentaRegresiva instanteMs={INSTANTE_EVENTO} fechaTexto={FECHA_TEXTO} />
          <Retrato />
        </Fragment>
      );
    case "cita":
      return <Cita key="cita" cita={data} />;
    case "historia":
      return <Historia key="historia" historia={data} />;
    case "ubicaciones":
      return <Lugares key="ubicaciones" ubicaciones={data} />;
    case "itinerario":
      return <Itinerario key="itinerario" itinerario={data} />;
    case "galeria":
      return <Galeria key="galeria" galeria={data} />;
    case "regalos":
      return <MesaDeRegalos key="regalos" regalos={data} />;
    case "hoteles":
      return <Hoteles key="hoteles" hoteles={data} />;
    case "restricciones":
      return <Restricciones key="restricciones" restricciones={data} />;
    case "confirmacion":
      return <Confirmacion key="confirmacion" boda={boda} />;
    default:
      return null;
  }
}

export function App() {
  const { dark, toggle: toggleTheme } = useTheme();
  const { audioRef, playing, toggle: toggleMusic, play } = useMusic({
    enabled: MUSICA_HABILITADA,
  });
  const [portadaAbierta, setPortadaAbierta] = useState(PORTADA_VISIBLE);
  const contenidoRef = useRef(null);

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
    if (portadaAbierta) return;
    const destino = document.getElementById("inicio") ?? contenidoRef.current;
    destino?.focus();
  }, [portadaAbierta]);

  // Cerrar la portada es un gesto: la música arranca aquí (RF-5).
  const ingresar = useCallback(() => {
    setPortadaAbierta(false);
    window.scrollTo({ top: 0, behavior: "auto" });
    play();
  }, [play]);

  return (
    <TemplateProvider template={TEMPLATE}>
      <ErrorNotice errors={ERRORES} warnings={AVISOS} />

      {portadaAbierta && (
        <Cover
          cover={boda.portada}
          couple={boda.pareja}
          dateText={FECHA_TEXTO}
          onEnter={ingresar}
        />
      )}

      {PANEL_VISIBLE && (
        <ControlsPanel
          inert={portadaAbierta}
          withMusic={MUSICA_HABILITADA}
          dark={dark}
          playing={playing}
          onToggleTheme={toggleTheme}
          onToggleMusic={toggleMusic}
        />
      )}

      {MUSICA_HABILITADA && (
        <audio ref={audioRef} loop preload="none">
          <source src={audioUrl} type="audio/mpeg" />
        </audio>
      )}

      <main className="contenido" ref={contenidoRef} tabIndex={-1} inert={portadaAbierta}>
        <SkipLink />

        {ENCABEZADO_VISIBLE && <Header couple={boda.pareja} />}

        {SECCIONES.filter(CLAVES_CON_PORTADA).map(pintarSeccion)}

        {PIE_VISIBLE && (
          <Footer
            couple={boda.pareja}
            dateText={FECHA_TEXTO}
            place={boda.evento?.lugar}
            credit={boda.marca?.enlaces?.credito}
          />
        )}
      </main>
    </TemplateProvider>
  );
}
