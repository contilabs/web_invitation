// Ejemplos ficticios de invitación (spec 004, T8; RF-1, RF-2, RF-11, RF-13, RF-14; D22).
//
// La app **no** usa este módulo en ejecución: la invitación la resuelve el servicio de
// registro (RF-1), y el modo demo tampoco los usa (RF-15). Se conservan como **fixtures** de
// `guest-cards.test.js` para ejercer la **forma nueva** del contrato: los tres tipos
// (`personal`, `generic`, `public`), el teléfono, los límites (incluido `"n"` del código
// reservado `PUBLIC`) y los cuatro estados reversibles (`viewed`, `confirmed`, `updated`,
// `rejected`).
//
// Solo lleva **datos ficticios** (nunca reales): el repositorio no versiona datos personales
// de invitados (RNF-2). Los identificadores del modelo —nombres de columna, tipos y
// estados— van en **inglés** a propósito (excepción documentada en la constitución).

export const guestCards = [
  // Invitación personalizada recién abierta: su fila todavía no tiene respuesta (`viewed`).
  {
    guest_type: "personal",
    guest_id: "titular-001",
    phone: "3310000001",
    guest_name: "Titular de ejemplo",
    partner_name: "Acompañante de ejemplo",
    adults_guests: 2,
    child_guests: 2,
    adults_attendees: null,
    child_attendees: null,
    status: "viewed",
  },

  // Invitación personalizada ya confirmada: conserva su cupo y su respuesta.
  {
    guest_type: "personal",
    guest_id: "titular-002",
    phone: "3310000002",
    guest_name: "Familia de ejemplo",
    partner_name: null,
    adults_guests: 3,
    child_guests: 0,
    adults_attendees: 3,
    child_attendees: 0,
    status: "confirmed",
  },

  // Invitación genérica: el servicio asignó el `guest_id` y el cupo es el `limit` del código.
  {
    guest_type: "generic",
    guest_id: 1,
    phone: "3310000003",
    guest_name: "Invitado genérico de ejemplo",
    partner_name: null,
    limit: 4,
    adults_attendees: 2,
    child_attendees: null,
    status: "updated",
  },

  // Invitación pública: el código reservado `PUBLIC` no tiene tope (`limit: "n"`).
  {
    guest_type: "public",
    guest_id: 2,
    phone: "3310000004",
    guest_name: "Invitado público de ejemplo",
    partner_name: null,
    limit: "n",
    adults_attendees: 0,
    child_attendees: null,
    status: "rejected",
  },
];
