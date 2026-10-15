// Invitación resuelta por código de enlace (T17, RF-16, RF-17). La lógica de resolución
// vive en `utils/invitation.js`; aquí solo se lee la URL una vez al montar y se formatea
// el texto de lugares para no repetir el formato en los componentes.
import { useState } from "react";

import { invitaciones as defaultGuestCards } from "../data/guest-cards.js";
import {
  formatSeats,
  guestLimit,
  reservedSeats,
  readInvitationCode,
  resolveInvitation,
  INVITATION_TYPES,
} from "../utils/invitation.js";

// Texto de lugares para la interfaz. Mientras la sección no se rediseñe (T24): la
// personalizada usa sus lugares reservados, la reutilizable su límite y el resto «un lugar».
function seatsText(resolved) {
  if (resolved.type === INVITATION_TYPES.PERSONALIZED) {
    const reserved = reservedSeats(resolved);
    return reserved === null ? "un lugar" : formatSeats(reserved);
  }
  if (resolved.type === INVITATION_TYPES.REUSABLE && Number.isInteger(resolved.limit)) {
    return formatSeats(resolved.limit);
  }
  return "un lugar";
}

export function useInvitation(guestCards = defaultGuestCards, wedding) {
  const [invitation] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const code = readInvitationCode(params);
    const resolved = resolveInvitation(guestCards, code);
    return {
      ...resolved,
      reservedSeats: reservedSeats(resolved),
      guestLimit: guestLimit(resolved, wedding),
      seatsText: seatsText(resolved),
    };
  });

  return invitation;
}
