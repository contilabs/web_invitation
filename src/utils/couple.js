// Lógica pura: nombres de la pareja (RF-2)

export function composePersonName(person) {
  if (!person || typeof person !== "object") return "";
  const parts = [];
  if (person.nombre) {
    const value = String(person.nombre).trim();
    if (value) parts.push(value);
  }
  if (person.nombreIntermedio) {
    const value = String(person.nombreIntermedio).trim();
    if (value) parts.push(value);
  }
  if (person.apellidos) {
    const value = String(person.apellidos).trim();
    if (value) parts.push(value);
  }
  if (person.apellido1) {
    const value = String(person.apellido1).trim();
    if (value) parts.push(value);
  }
  if (person.apellido2) {
    const value = String(person.apellido2).trim();
    if (value) parts.push(value);
  }
  return parts.join(" ");
}

export function coupleNames(pair) {
  if (!pair || typeof pair !== "object") {
    return { first: "", second: "", display: "" };
  }
  const p1 = pair.nombre1 ?? pair.primera ?? pair.persona1 ?? pair[0];
  const p2 = pair.nombre2 ?? pair.segunda ?? pair.persona2 ?? pair[1];
  let first = "";
  let second = "";
  if (typeof p1 === "string") first = p1.trim();
  else first = composePersonName(p1);
  if (typeof p2 === "string") second = p2.trim();
  else second = composePersonName(p2);
  const rawDisplay = pair.nombreParaMostrar ?? pair.paraMostrar ?? null;
  let display = "";
  if (rawDisplay && String(rawDisplay).trim()) {
    display = String(rawDisplay).trim();
  } else {
    display = `${first} y ${second}`.trim();
  }
  return { first, second, display };
}
