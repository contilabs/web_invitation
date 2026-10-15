// Lógica pura: normalización de opciones de regalo (RF-10)

export const GIFT_TYPES = {
  STORE: "tienda",
  TRANSFER: "transferencia",
  CASH: "efectivo",
};

function normalizeGiftType(type) {
  const value = String(type ?? "").trim().toLowerCase();
  if (value === "tienda" || value === "mesa" || value === "tienda/mesa") return GIFT_TYPES.STORE;
  if (value === "transferencia" || value === "transfer") return GIFT_TYPES.TRANSFER;
  if (value === "efectivo" || value === "cash") return GIFT_TYPES.CASH;
  return value;
}

function validUrl(url) {
  if (url === null || url === undefined) return null;
  const value = String(url).trim();
  return value || null;
}

function normalizeField(field) {
  if (!field || typeof field !== "object") return null;
  const label = String(field.etiqueta ?? field.label ?? "").trim();
  const raw = field.valor ?? field.value;
  if (!label || raw === null || raw === undefined) return null;
  const value = String(raw).trim();
  if (!value) return null;
  // `copiar` marca el dato que el botón único de la opción pone en el portapapeles (RF-10).
  return { label, value, copy: field.copiar === true || field.copy === true };
}

export function copyableFields(option) {
  if (!option || typeof option !== "object") return [];
  const source = option.datosCopiables ?? option.datos ?? [];
  if (!Array.isArray(source)) return [];
  return source
    .map(normalizeField)
    .filter(Boolean)
    .map(({ label, value }) => ({ label, value }));
}

// Dato que copia el botón de la opción: el que el registro marca con `copiar: true`. Si la
// opción solo trae un dato copiable, ese. Si hay varios sin marca (o más de una marca), no hay
// botón: no se adivina cuál es la cuenta.
export function copyableField(option) {
  if (!option || typeof option !== "object") return null;
  const source = option.datosCopiables ?? option.datos ?? [];
  if (!Array.isArray(source)) return null;
  const fields = source.map(normalizeField).filter(Boolean);
  const marked = fields.filter((field) => field.copy);
  if (marked.length === 1) return { label: marked[0].label, value: marked[0].value };
  if (marked.length === 0 && fields.length === 1) {
    return { label: fields[0].label, value: fields[0].value };
  }
  return null;
}

export function giftOptions(gifts) {
  const options = gifts?.opciones;
  if (!Array.isArray(options)) return [];
  return options.map((item) => {
    const type = normalizeGiftType(item?.tipo);
    const option = {
      type,
      label: String(item?.etiqueta ?? item?.titulo ?? "").trim(),
      description: item?.descripcion ? String(item.descripcion).trim() : null,
      url: validUrl(item?.url ?? item?.enlace),
    };
    if (isCopyableType(type)) {
      option.copyableFields = copyableFields(item);
      option.copyableField = copyableField(item);
    }
    return option;
  });
}

function isCopyableType(type) {
  return type === GIFT_TYPES.TRANSFER || type === GIFT_TYPES.CASH;
}
