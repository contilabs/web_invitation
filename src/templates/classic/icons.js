// Iconos de la plantilla clásica (T10, RF-2). Los iconos son **presentación**: el registro
// solo guarda una clave (p. ej. `momento.icono: "copas"`) y aquí se elige el archivo.
import icoComida from "../../../assets/icons/comida.png";
import icoCopas from "../../../assets/icons/copas.png";
import icoDisco from "../../../assets/icons/disco.png";
import icoHotel from "../../../assets/icons/hotel.png";
import icoIglesia from "../../../assets/icons/iglesia.png";
import icoMansion from "../../../assets/icons/mansion.png";

// Iconos del itinerario, por la clave que trae el registro.
export const TIMELINE_ICONS = {
  iglesia: icoIglesia,
  mansion: icoMansion,
  copas: icoCopas,
  comida: icoComida,
  disco: icoDisco,
};

// Iconos de los lugares, por la clave de la ubicación (`ceremonia` / `recepcion`).
export const LOCATION_ICONS = { ceremonia: icoIglesia, recepcion: icoMansion };

// Icono de cada hotel (la plantilla clásica usa el mismo para todos).
export const HOTEL_ICON = icoHotel;
