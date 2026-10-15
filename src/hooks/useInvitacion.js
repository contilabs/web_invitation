// Invitación resuelta por código de enlace (T17, RF-16, RF-17). La lógica de resolución
// vive en `logica/invitacion.js`; aquí solo se lee la URL una vez al montar y se formatea
// el texto de lugares para no repetir el formato en los componentes.
import { useState } from "react";

import { invitaciones as invitacionesPorDefecto } from "../datos/invitaciones.js";
import {
  formatearLugares,
  limiteDeAsistentes,
  lugaresReservados,
  leerCodigoDeInvitacion,
  resolverInvitacion,
  TIPOS,
} from "../logica/invitacion.js";

// Texto de lugares para la interfaz. Mientras la sección no se rediseñe (T24): la
// personalizada usa sus lugares reservados, la reutilizable su límite y el resto «un lugar».
function textoDeLugares(resuelta) {
  if (resuelta.tipo === TIPOS.PERSONALIZADA) {
    const reservados = lugaresReservados(resuelta);
    return reservados === null ? "un lugar" : formatearLugares(reservados);
  }
  if (resuelta.tipo === TIPOS.REUTILIZABLE && Number.isInteger(resuelta.limite)) {
    return formatearLugares(resuelta.limite);
  }
  return "un lugar";
}

export function useInvitacion(invitaciones = invitacionesPorDefecto, boda) {
  const [invitacion] = useState(() => {
    const parametros = new URLSearchParams(window.location.search);
    const codigo = leerCodigoDeInvitacion(parametros);
    const resuelta = resolverInvitacion(invitaciones, codigo);
    return {
      ...resuelta,
      lugaresReservados: lugaresReservados(resuelta),
      limiteAsistentes: limiteDeAsistentes(resuelta, boda),
      lugaresTexto: textoDeLugares(resuelta),
    };
  });

  return invitacion;
}
