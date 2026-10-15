// Lógica pura: restricciones con jerarquía boda → ficha (RF-12, RF-20)

function readChildrenPermission(restrictions) {
  if (!restrictions || typeof restrictions !== "object") return undefined;
  if (typeof restrictions.permiteNinos === "boolean") return restrictions.permiteNinos;
  if (typeof restrictions.ninosPermitidos === "boolean") return restrictions.ninosPermitidos;
  if (typeof restrictions.ninos === "boolean") return restrictions.ninos;
  return undefined;
}

export function allowsChildren(wedding) {
  const value = readChildrenPermission(wedding?.restricciones);
  // Si no se indica, se permiten (RF-12)
  return value === undefined ? true : value;
}

export function hasChildrenConflict(wedding, invitation) {
  if (!allowsChildren(wedding)) {
    const count = Number(invitation?.childGuests ?? invitation?.ninos ?? 0);
    return Number.isFinite(count) && count > 0;
  }
  return false;
}

export function restrictionMessages(restrictions) {
  const messages = [];
  if (!restrictions || typeof restrictions !== "object") return messages;
  const dressCode = restrictions.codigoVestimenta ?? restrictions.vestimenta;
  if (typeof dressCode === "string" && dressCode.trim()) {
    messages.push(`Código de vestimenta: ${dressCode.trim()}`);
  }
  const allows = readChildrenPermission(restrictions);
  if (allows === false) {
    messages.push("Evento solo para adultos");
  } else if (allows === true) {
    messages.push("Los niños son bienvenidos");
  }
  const others = restrictions.otrasIndicaciones ?? restrictions.otras;
  if (typeof others === "string" && others.trim()) {
    messages.push(others.trim());
  } else if (Array.isArray(others)) {
    for (const item of others) {
      if (typeof item === "string" && item.trim()) messages.push(item.trim());
    }
  }
  return messages;
}
