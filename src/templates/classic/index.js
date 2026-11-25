// Descriptor de la plantilla clásica (T11, RF-2): la única implementada hoy. Reúne lo que
// la interfaz necesita de una plantilla: identidad, iconos, tamaños de imagen y las **claves
// de las fotos estructurales** (las que no nombra el registro: hero, retrato y confirmación).
import familyLetter from "../../../assets/icons/family-letter.png";
import familyLetterDark from "../../../assets/icons/family-letter-dark.png";
import { HEADER_LOGO, HEADER_LOGO_LIGHT, HOTEL_ICON, LOCATION_ICONS, TIMELINE_ICONS, LIVERPOOL_CARD, TRANSFER_CARDS } from "./icons.js";
import {
  SIZES_CONFIRMATION,
  SIZES_COVER_CARD,
  SIZES_FEATURED,
  SIZES_FULL_WIDTH,
  SIZES_GRID,
} from "./photoSizes.js";

const template = {
  id: "clasica",
  familyLetter: { light: familyLetter, dark: familyLetterDark },
  icons: {
    timeline: TIMELINE_ICONS,
    locations: LOCATION_ICONS,
    hotel: HOTEL_ICON,
    liverpool: LIVERPOOL_CARD,
    transfers: TRANSFER_CARDS,
    header: { light: HEADER_LOGO_LIGHT, dark: HEADER_LOGO },
  },
  photoSizes: {
    fullWidth: SIZES_FULL_WIDTH,
    featured: SIZES_FEATURED,
    grid: SIZES_GRID,
    coverCard: SIZES_COVER_CARD,
    confirmation: SIZES_CONFIRMATION,
  },
  structuralPhotos: { hero: "hero-naomi-andres", portrait: "foto9", confirmation: "foto7" },
};

export default template;
