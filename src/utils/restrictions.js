// Lógica pura: restricciones de la boda (RF-12, RF-20).
//
// Se retiró `hasChildrenConflict` (spec 004, T8): solo tenía sentido contra una ficha local,
// y el invitado se resuelve en el servicio (DT-8, D22). `allowsChildren` y
// `restrictionMessages` se conservan tal cual.

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

export function restrictionMessages(restrictions, { includeAdultsOnlyNotice = true } = {}) {
  const messages = [];
  if (!restrictions || typeof restrictions !== "object") return messages;
  const dressCode = restrictions.codigoVestimenta ?? restrictions.vestimenta;
  if (typeof dressCode === "string" && dressCode.trim()) {
    messages.push(`Código de vestimenta: ${dressCode.trim()}`);
  }
  const allows = readChildrenPermission(restrictions);
  if (allows === false && includeAdultsOnlyNotice) {
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
