// Iconos de la plantilla clásica (T10, RF-2). Los iconos son **presentación**: el registro
// solo guarda una clave (p. ej. `momento.icono: "copas"`) y aquí se elige el archivo.
import iconFood from "../../../assets/icons/comida.png";
import iconGlasses from "../../../assets/icons/copas.png";
import iconDisco from "../../../assets/icons/disco.png";
import iconHotel from "../../../assets/icons/hotel.png";
import iconChurch from "../../../assets/icons/iglesia.png";
import iconMansion from "../../../assets/icons/mansion.png";

// Iconos del itinerario, por la clave que trae el registro.
export const TIMELINE_ICONS = {
  iglesia: iconChurch,
  mansion: iconMansion,
  copas: iconGlasses,
  comida: iconFood,
  disco: iconDisco,
};

// Iconos de los lugares, por la clave de la ubicación (`ceremonia` / `recepcion`).
export const LOCATION_ICONS = { ceremonia: iconChurch, recepcion: iconMansion };

// Icono de cada hotel (la plantilla clásica usa el mismo para todos).
export const HOTEL_ICON = iconHotel;
