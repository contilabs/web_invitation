// Fichas de invitación de ejemplo (T6, RF-16, RF-17, RF-19, RNF-7).
//
// Estas fichas siguen la FORMA DEL CONTRATO DEL SERVICIO DE REGISTRO (Google Apps Script)
// como referencia de diseño. Los identificadores se mantienen en INGLÉS (excepción
// documentada en la constitución). El repositorio SOLO incluye fichas de ejemplo,
// sin datos personales reales.

export const guestCards = [
  // INVITACIÓN PERSONALIZADA
  {
    codigo: "karina-gerardo-inv-001",
    tipo: "personalizada",
    // Para personalizada: lugares reservados vienen de la ficha (cuando aplican).
    lugaresReservados: 2,
    // Campos con nombres del contrato GAS (referencia)
    guestName: "Familia Ejemplo",
    partnerName: null,
    adultsGuests: 2,
    childGuests: 0,
    tableGuests: null,
    placeGuests: "Mesas 1-2",
    emailGuests: "ejemplo@correo.com",
    phoneGuests: null,
    messageGuests: null,
    responseGuests: null,
    responseDate: null,
    responseIp: null,
  },

  // INVITACIONES REUTILIZABLES (hasta 10 enlaces, límite 1–10 cada uno)
  {
    codigo: "rec-001",
    tipo: "reutilizable",
    limite: 2,
  },
  {
    codigo: "rec-002",
    tipo: "reutilizable",
    limite: 2,
  },
  {
    codigo: "rec-003",
    tipo: "reutilizable",
    limite: 4,
  },
  {
    codigo: "rec-004",
    tipo: "reutilizable",
    limite: 2,
  },
  {
    codigo: "rec-005",
    tipo: "reutilizable",
    limite: 2,
  },
  {
    codigo: "rec-006",
    tipo: "reutilizable",
    limite: 1,
  },
  {
    codigo: "rec-007",
    tipo: "reutilizable",
    limite: 2,
  },
  {
    codigo: "rec-008",
    tipo: "reutilizable",
    limite: 2,
  },
  {
    codigo: "rec-009",
    tipo: "reutilizable",
    limite: 1,
  },
  {
    codigo: "rec-010",
    tipo: "reutilizable",
    limite: 1,
  },

  // INVITACIÓN GENÉRICA (1 enlace, sin lugares reservados)
  {
    codigo: "gen-001",
    tipo: "generica",
  },
];
