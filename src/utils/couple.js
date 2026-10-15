// Lógica pura: composición de nombres de la pareja (RF-2)

export function composePersonName(persona) {
  if (!persona || typeof persona !== "object") return "";
  const partes = [];
  if (persona.nombre) {
    const v = String(persona.nombre).trim();
    if (v) partes.push(v);
  }
  if (persona.nombreIntermedio) {
    const v = String(persona.nombreIntermedio).trim();
    if (v) partes.push(v);
  }
  if (persona.apellidos) {
    const v = String(persona.apellidos).trim();
    if (v) partes.push(v);
  }
  if (persona.apellido1) {
    const v = String(persona.apellido1).trim();
    if (v) partes.push(v);
  }
  if (persona.apellido2) {
    const v = String(persona.apellido2).trim();
    if (v) partes.push(v);
  }
  return partes.join(" ");
}

export function coupleNames(pareja) {
  if (!pareja || typeof pareja !== "object") {
    return { primera: "", segunda: "", paraMostrar: "" };
  }
  const p1 = pareja.nombre1 ?? pareja.primera ?? pareja.persona1 ?? pareja[0];
  const p2 = pareja.nombre2 ?? pareja.segunda ?? pareja.persona2 ?? pareja[1];
  let primera = "";
  let segunda = "";
  if (typeof p1 === "string") primera = p1.trim();
  else primera = composePersonName(p1);
  if (typeof p2 === "string") segunda = p2.trim();
  else segunda = composePersonName(p2);
  const nombreParaMostrarBruto = pareja.nombreParaMostrar ?? pareja.paraMostrar ?? null;
  let paraMostrar = "";
  if (nombreParaMostrarBruto && String(nombreParaMostrarBruto).trim()) {
    paraMostrar = String(nombreParaMostrarBruto).trim();
  } else {
    const base = `${primera} y ${segunda}`.trim();
    paraMostrar = base;
  }
  return { primera, segunda, paraMostrar };
}
