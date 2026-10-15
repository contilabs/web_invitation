// Invitación resuelta por código de enlace (T17, RF-16, RF-17). La lógica de resolución
// vive en `utils/invitation.js`; aquí solo se lee la URL una vez al montar y se formatea
// el texto de lugares para no repetir el formato en los componentes.
import { useState } from "react";

import { invitaciones as invitacionesPorDefecto } from "../data/guest-cards.js";
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
function textoDeLugares(resuelta) {
  if (resuelta.tipo === INVITATION_TYPES.PERSONALIZED) {
    const reservados = reservedSeats(resuelta);
    return reservados === null ? "un lugar" : formatSeats(reservados);
  }
  if (resuelta.tipo === INVITATION_TYPES.REUSABLE && Number.isInteger(resuelta.limite)) {
    return formatSeats(resuelta.limite);
  }
  return "un lugar";
}

export function useInvitacion(invitaciones = invitacionesPorDefecto, boda) {
  const [invitacion] = useState(() => {
    const parametros = new URLSearchParams(window.location.search);
    const codigo = readInvitationCode(parametros);
    const resuelta = resolveInvitation(invitaciones, codigo);
    return {
      ...resuelta,
      reservedSeats: reservedSeats(resuelta),
      limiteAsistentes: guestLimit(resuelta, boda),
      lugaresTexto: textoDeLugares(resuelta),
    };
  });

  return invitacion;
}
