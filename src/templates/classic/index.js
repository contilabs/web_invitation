// Descriptor de la plantilla clásica (T11, RF-2): la única implementada hoy. Reúne lo que
// la interfaz necesita de una plantilla: identidad, iconos, tamaños de imagen y las **claves
// de las fotos estructurales** (las que no nombra el registro: hero, retrato y confirmación).
import { FAMILY_LEAVES, HEADER_LOGO, HEADER_LOGO_LIGHT, HOTEL_ICON, LOCATION_ICONS, TIMELINE_ICONS, LIVERPOOL_CARD } from "./icons.js";
import {
  SIZES_CONFIRMATION,
  SIZES_COVER_CARD,
  SIZES_FEATURED,
  SIZES_FULL_WIDTH,
  SIZES_GRID,
} from "./photoSizes.js";

const template = {
  id: "clasica",
  icons: {
    familyLeaves: FAMILY_LEAVES,
    timeline: TIMELINE_ICONS,
    locations: LOCATION_ICONS,
    hotel: HOTEL_ICON,
    liverpool: LIVERPOOL_CARD,
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
