// Lógica pura: fecha, hora y zona horaria del evento (RF-3)

export function eventTimeZone(event) {
  if (!event || typeof event !== "object") return null;
  const zone = event.zonaHoraria ?? event.timeZone ?? event.zona ?? null;
  if (zone === null || zone === undefined) return null;
  const text = String(zone).trim();
  return text || null;
}

export function eventInstant(event, localZone) {
  if (!event || typeof event !== "object") return Number.NaN;
  const start = event.fechaInicio ?? event.fechaHora ?? event.inicio ?? event.fechaIso ?? null;
  if (start === null || start === undefined) return Number.NaN;
  const raw = String(start).trim();
  if (!raw) return Number.NaN;
  const zone = eventTimeZone(event);
  // Si no hay zona, usar zona local (pasada como parámetro o ambiente)
  if (!zone) {
    const date = new Date(raw);
    const ms = date.getTime();
    return Number.isNaN(ms) ? Number.NaN : ms;
  }
  // Intentar interpretar con zona horaria explícita usando Date.parse con toLocaleString-like approach
  // En Node moderno, Date puede parsear ISO; si incluye offset se usa. También probamos con formato
  try {
    // Si ya tiene offset o Z, Date lo parsea bien
    const parsed = new Date(raw);
    if (!Number.isNaN(parsed.getTime())) {
      // Verificar que zona es válida intentado formatear
      try {
        new Intl.DateTimeFormat("es-MX", { timeZone: zone }).format(parsed);
      } catch (error) {
        return Number.NaN;
      }
      return parsed.getTime();
    }
  } catch (error) {
    return Number.NaN;
  }
  return Number.NaN;
}

export function formatDate(ms, timeZone, locale = "es-MX") {
  if (typeof ms !== "number" || Number.isNaN(ms)) return "";
  try {
    return new Intl.DateTimeFormat(locale, {
      timeZone: timeZone || undefined,
      day: "2-digit",
      month: "long",
      year: "numeric",
    }).format(new Date(ms));
  } catch (error) {
    return "";
  }
}

export function formatTime(ms, timeZone, locale = "es-MX") {
  if (typeof ms !== "number" || Number.isNaN(ms)) return "";
  try {
    return new Intl.DateTimeFormat(locale, {
      timeZone: timeZone || undefined,
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(new Date(ms)) + " h";
  } catch (error) {
    return "";
  }
}
