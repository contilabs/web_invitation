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

import { AvisoDeError } from "./componentes/AvisoDeError.jsx";
import { Cita } from "./componentes/Cita.jsx";
import { Confirmacion } from "./componentes/Confirmacion.jsx";
import { ControlMusica } from "./componentes/ControlMusica.jsx";
import { ControlTema } from "./componentes/ControlTema.jsx";
import { CuentaRegresiva } from "./componentes/CuentaRegresiva.jsx";
import { Encabezado } from "./componentes/Encabezado.jsx";
import { Galeria } from "./componentes/Galeria.jsx";
import { Historia } from "./componentes/Historia.jsx";
import { MesaDeRegalos } from "./componentes/MesaDeRegalos.jsx";
import { Portada } from "./componentes/Portada.jsx";
import {
  Hero,
  Hoteles,
  Itinerario,
  Lugares,
  Pie,
  Restricciones,
  Retrato,
} from "./componentes/Secciones.jsx";
import { useMusica } from "./hooks/useMusica.js";
import { useReveal } from "./hooks/useReveal.js";
import { useTema } from "./hooks/useTema.js";

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
const PORTADA_VISIBLE = SECCIONES.some((seccion) => seccion.clave === "portada");

// La plantilla activa sale del registro; si no está implementada, la de por defecto (RF-2).
const TEMPLATE = resolveTemplate(
  templateStatus(boda.plantilla) === "implementada" ? boda.plantilla : DEFAULT_TEMPLATE_ID,
);

// Falla al arrancar si falta alguna variante optimizada (claves del registro y de la plantilla).
assertPhotoKeys(Object.values(TEMPLATE.structuralPhotos));

const CLAVES_CON_PORTADA = (seccion) => seccion.clave !== "portada";

// Cada clave del catálogo se pinta con su componente; el bloque `pareja` agrupa el hero, la
// cuenta regresiva y el retrato.
function pintarSeccion({ clave, datos }) {
  switch (clave) {
    case "pareja":
      return (
        <Fragment key="pareja">
          <Hero pareja={boda.pareja} fechaTexto={FECHA_TEXTO} />
          <CuentaRegresiva instanteMs={INSTANTE_EVENTO} fechaTexto={FECHA_TEXTO} />
          <Retrato />
        </Fragment>
      );
    case "cita":
      return <Cita key="cita" cita={datos} />;
    case "historia":
      return <Historia key="historia" historia={datos} />;
    case "ubicaciones":
      return <Lugares key="ubicaciones" ubicaciones={datos} />;
    case "itinerario":
      return <Itinerario key="itinerario" itinerario={datos} />;
    case "galeria":
      return <Galeria key="galeria" galeria={datos} />;
    case "regalos":
      return <MesaDeRegalos key="regalos" regalos={datos} />;
    case "hoteles":
      return <Hoteles key="hoteles" hoteles={datos} />;
    case "restricciones":
      return <Restricciones key="restricciones" restricciones={datos} />;
    case "confirmacion":
      return <Confirmacion key="confirmacion" boda={boda} />;
    default:
      return null;
  }
}

export function App() {
  const { oscuro, alternar: alternarTema } = useTema();
  const { audioRef, sonando, alternar: alternarMusica, reproducir } = useMusica({
    habilitada: MUSICA_HABILITADA,
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
    reproducir();
  }, [reproducir]);

  return (
    <TemplateProvider template={TEMPLATE}>
      <AvisoDeError errores={ERRORES} avisos={AVISOS} />

      {portadaAbierta && (
        <Portada
          portada={boda.portada}
          pareja={boda.pareja}
          fechaTexto={FECHA_TEXTO}
          onIngresar={ingresar}
        />
      )}

      {PANEL_VISIBLE && (
        <div className="fixed-panel" inert={portadaAbierta}>
          <ControlTema oscuro={oscuro} alternar={alternarTema} />
          {MUSICA_HABILITADA && <ControlMusica sonando={sonando} alternar={alternarMusica} />}
        </div>
      )}

      {MUSICA_HABILITADA && (
        <audio ref={audioRef} loop preload="none">
          <source src={audioUrl} type="audio/mpeg" />
        </audio>
      )}

      <main className="contenido" ref={contenidoRef} tabIndex={-1} inert={portadaAbierta}>
        <a className="saltar" href="#inicio">
          Saltar al contenido
        </a>

        {ENCABEZADO_VISIBLE && <Encabezado pareja={boda.pareja} />}

        {SECCIONES.filter(CLAVES_CON_PORTADA).map(pintarSeccion)}

        {PIE_VISIBLE && (
          <Pie
            pareja={boda.pareja}
            fechaTexto={FECHA_TEXTO}
            lugar={boda.evento?.lugar}
            credito={boda.marca?.enlaces?.credito}
          />
        )}
      </main>
    </TemplateProvider>
  );
}
