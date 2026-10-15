// Lógica pura: restricciones con jerarquía boda → ficha (RF-12, RF-20)

function leerPermisoNinos(restricciones) {
  if (!restricciones || typeof restricciones !== "object") return undefined;
  if (typeof restricciones.permiteNinos === "boolean") return restricciones.permiteNinos;
  if (typeof restricciones.ninosPermitidos === "boolean") return restricciones.ninosPermitidos;
  if (typeof restricciones.ninos === "boolean") return restricciones.ninos;
  return undefined;
}

export function allowsChildren(boda) {
  const valor = leerPermisoNinos(boda?.restricciones);
  // Si no se indica, se permiten (RF-12)
  return valor === undefined ? true : valor;
}

export function hasChildrenConflict(boda, invitacion) {
  if (!allowsChildren(boda)) {
    const n = Number(invitacion?.childGuests ?? invitacion?.ninos ?? 0);
    return Number.isFinite(n) && n > 0;
  }
  return false;
}

export function restrictionMessages(restricciones) {
  const mensajes = [];
  if (!restricciones || typeof restricciones !== "object") return mensajes;
  const vestimenta = restricciones.codigoVestimenta ?? restricciones.vestimenta;
  if (typeof vestimenta === "string" && vestimenta.trim()) {
    mensajes.push(`Código de vestimenta: ${vestimenta.trim()}`);
  }
  const permite = leerPermisoNinos(restricciones);
  if (permite === false) {
    mensajes.push("Evento solo para adultos");
  } else if (permite === true) {
    mensajes.push("Los niños son bienvenidos");
  }
  const otras = restricciones.otrasIndicaciones ?? restricciones.otras;
  if (typeof otras === "string" && otras.trim()) {
    mensajes.push(otras.trim());
  } else if (Array.isArray(otras)) {
    for (const o of otras) {
      if (typeof o === "string" && o.trim()) mensajes.push(o.trim());
    }
  }
  return mensajes;
}
