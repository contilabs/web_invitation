// Iconos de la plantilla clásica (T10, RF-2). Los iconos son **presentación**: el registro
// solo guarda una clave (p. ej. `momento.icono: "copas"`) y aquí se elige el archivo.
import iconFood from "../../../assets/icons/comida.png";
import liverpoolLight from "../../../assets/icons/liverpool_verde.png";
import liverpoolDark from "../../../assets/icons/liverpool_blanca.png";
import iconRings from "../../../assets/icons/anillos.png";
import iconGlasses from "../../../assets/icons/copas.png";
import iconDisco from "../../../assets/icons/disco.png";
import iconHotel from "../../../assets/icons/hotel.png";
import iconChurch from "../../../assets/icons/iglesia.png";
import ceremonyChurch from "../../../assets/photos/opt/ceremony-church-1448.png";
import receptionVenue from "../../../assets/photos/opt/reception-venue-1448.png";
import iconMansion from "../../../assets/icons/mansion.png";

// Iconos del itinerario, por la clave que trae el registro.
export const TIMELINE_ICONS = {
  iglesia: iconChurch,
  anillos: iconRings,
  mansion: iconMansion,
  copas: iconGlasses,
  comida: iconFood,
  disco: iconDisco,
};

// Iconos de los lugares, por la clave de la ubicación (`ceremonia` / `recepcion`).
export const LOCATION_ICONS = { ceremonia: ceremonyChurch, recepcion: receptionVenue };

// Icono de cada hotel (la plantilla clásica usa el mismo para todos).
export const HOTEL_ICON = iconHotel;
export const LIVERPOOL_CARD = { light: liverpoolLight, dark: liverpoolDark };

// Monograma original de la barra de navegación, sin filtros ni modificaciones.
export { default as HEADER_LOGO } from "../../../assets/icons/Simbolo_beige.png";
export { default as HEADER_LOGO_LIGHT } from "../../../assets/icons/Simbolo_olivo.png";
