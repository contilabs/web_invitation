// Renderizadores de sección (T22, RF-1, RF-4). Es el mapa clave → componente que antes vivía
// en el `switch` de `App`: cada clave del catálogo de secciones (`utils/sections.js`) se pinta
// con su componente y el bloque `pareja` agrupa el hero, la cuenta regresiva y el retrato. Los
// datos entran por parámetros (el registro, el texto de la fecha y el instante del evento), no
// se leen desde aquí.
import { Fragment } from "react";

import { Countdown } from "../components/sections/Countdown.jsx";
import { Gallery } from "../components/sections/Gallery.jsx";
import { Gifts } from "../components/sections/Gifts.jsx";
import { Hero } from "../components/sections/Hero.jsx";
import { Hotels } from "../components/sections/Hotels.jsx";
import { Locations } from "../components/sections/Locations.jsx";
import { Portrait } from "../components/sections/Portrait.jsx";
import { Quote } from "../components/sections/Quote.jsx";
import { Restrictions } from "../components/sections/Restrictions.jsx";
import { Rsvp } from "../components/sections/Rsvp.jsx";
import { Story } from "../components/sections/Story.jsx";
import { Timeline } from "../components/sections/Timeline.jsx";

const RENDERERS = {
  pareja: ({ wedding, dateText, eventInstant }) => (
    <Fragment key="pareja">
      <Hero couple={wedding.pareja} dateText={dateText} />
      <Countdown instantMs={eventInstant} dateText={dateText} />
      <Portrait />
    </Fragment>
  ),
  cita: ({ data }) => <Quote key="cita" quote={data} />,
  historia: ({ data }) => <Story key="historia" story={data} />,
  ubicaciones: ({ data }) => <Locations key="ubicaciones" locations={data} />,
  itinerario: ({ data }) => <Timeline key="itinerario" timeline={data} />,
  galeria: ({ data }) => <Gallery key="galeria" gallery={data} />,
  regalos: ({ data }) => <Gifts key="regalos" gifts={data} />,
  hoteles: ({ data }) => <Hotels key="hoteles" hotels={data} />,
  restricciones: ({ data }) => <Restrictions key="restricciones" restrictions={data} />,
  confirmacion: ({ wedding }) => <Rsvp key="confirmacion" wedding={wedding} />,
};

// Pinta una sección del catálogo con sus datos; una clave sin renderizador no pinta nada.
export function renderSection({ key, data }, context) {
  const render = RENDERERS[key];
  return render ? render({ ...context, data }) : null;
}
