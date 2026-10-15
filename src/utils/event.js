// Lógica pura: fecha, hora y zona horaria del evento (RF-3)

export function eventTimeZone(evento) {
  if (!evento || typeof evento !== "object") return null;
  const z = evento.zonaHoraria ?? evento.timeZone ?? evento.zona ?? null;
  if (z === null || z === undefined) return null;
  const s = String(z).trim();
  return s || null;
}

export function eventInstant(evento, zonaLocal) {
  if (!evento || typeof evento !== "object") return Number.NaN;
  const fechaInicio = evento.fechaInicio ?? evento.fechaHora ?? evento.inicio ?? evento.fechaIso ?? null;
  if (fechaInicio === null || fechaInicio === undefined) return Number.NaN;
  const s = String(fechaInicio).trim();
  if (!s) return Number.NaN;
  const zona = eventTimeZone(evento);
  // Si no hay zona, usar zona local (pasada como parámetro o ambiente)
  if (!zona) {
    const d = new Date(s);
    const ms = d.getTime();
    return Number.isNaN(ms) ? Number.NaN : ms;
  }
  // Intentar interpretar con zona horaria explícita usando Date.parse con toLocaleString-like approach
  // En Node moderno, Date puede parsear ISO; si incluye offset se usa. También probamos con formato
  try {
    // Si ya tiene offset o Z, Date lo parsea bien
    const d1 = new Date(s);
    if (!Number.isNaN(d1.getTime())) {
      // Verificar que zona es válida intentado formatear
      try {
        new Intl.DateTimeFormat("es-MX", { timeZone: zona }).format(d1);
      } catch (e) {
        return Number.NaN;
      }
      return d1.getTime();
    }
  } catch (e) {
    return Number.NaN;
  }
  return Number.NaN;
}

export function formatDate(ms, zonaHoraria, idioma = "es-MX") {
  if (typeof ms !== "number" || Number.isNaN(ms)) return "";
  try {
    return new Intl.DateTimeFormat(idioma, {
      timeZone: zonaHoraria || undefined,
      day: "2-digit",
      month: "long",
      year: "numeric",
    }).format(new Date(ms));
  } catch (e) {
    return "";
  }
}

export function formatTime(ms, zonaHoraria, idioma = "es-MX") {
  if (typeof ms !== "number" || Number.isNaN(ms)) return "";
  try {
    return new Intl.DateTimeFormat(idioma, {
      timeZone: zonaHoraria || undefined,
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(new Date(ms)) + " h";
  } catch (e) {
    return "";
  }
}
