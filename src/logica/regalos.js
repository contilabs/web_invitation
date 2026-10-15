// Lógica pura: normalización de opciones de regalo (RF-10)

export const TIPOS_REGALO = {
  TIENDA: "tienda",
  TRANSFERENCIA: "transferencia",
  EFECTIVO: "efectivo",
};

function normalizarTipo(tipo) {
  const t = String(tipo ?? "").trim().toLowerCase();
  if (t === "tienda" || t === "mesa" || t === "tienda/mesa") return TIPOS_REGALO.TIENDA;
  if (t === "transferencia" || t === "transfer") return TIPOS_REGALO.TRANSFERENCIA;
  if (t === "efectivo" || t === "cash") return TIPOS_REGALO.EFECTIVO;
  return t;
}

function urlValida(url) {
  if (url === null || url === undefined) return null;
  const s = String(url).trim();
  return s || null;
}

function normalizarDato(d) {
  if (!d || typeof d !== "object") return null;
  const etiqueta = String(d.etiqueta ?? d.label ?? "").trim();
  const valor = d.valor ?? d.value;
  if (!etiqueta || valor === null || valor === undefined) return null;
  const v = String(valor).trim();
  if (!v) return null;
  // `copiar` marca el dato que el botón único de la opción pone en el portapapeles (RF-10).
  return { etiqueta, valor: v, copiar: d.copiar === true || d.copy === true };
}

export function datosCopiables(opcion) {
  if (!opcion || typeof opcion !== "object") return [];
  const fuente = opcion.datosCopiables ?? opcion.datos ?? [];
  if (!Array.isArray(fuente)) return [];
  return fuente
    .map(normalizarDato)
    .filter(Boolean)
    .map(({ etiqueta, valor }) => ({ etiqueta, valor }));
}

// Dato que copia el botón de la opción: el que el registro marca con `copiar: true`. Si la
// opción solo trae un dato copiable, ese. Si hay varios sin marca (o más de una marca), no hay
// botón: no se adivina cuál es la cuenta.
export function datoCopiable(opcion) {
  if (!opcion || typeof opcion !== "object") return null;
  const fuente = opcion.datosCopiables ?? opcion.datos ?? [];
  if (!Array.isArray(fuente)) return null;
  const datos = fuente.map(normalizarDato).filter(Boolean);
  const marcados = datos.filter((d) => d.copiar);
  if (marcados.length === 1) return { etiqueta: marcados[0].etiqueta, valor: marcados[0].valor };
  if (marcados.length === 0 && datos.length === 1) {
    return { etiqueta: datos[0].etiqueta, valor: datos[0].valor };
  }
  return null;
}

export function opcionesDeRegalo(regalos) {
  const opciones = regalos?.opciones;
  if (!Array.isArray(opciones)) return [];
  return opciones.map((o) => {
    const tipo = normalizarTipo(o?.tipo);
    const opcion = {
      tipo,
      etiqueta: String(o?.etiqueta ?? o?.titulo ?? "").trim(),
      descripcion: o?.descripcion ? String(o.descripcion).trim() : null,
      url: urlValida(o?.url ?? o?.enlace),
    };
    if (tiposConDatos(tipo)) {
      opcion.datosCopiables = datosCopiables(o);
      opcion.datoCopiable = datoCopiable(o);
    }
    return opcion;
  });
}

function tiposConDatos(tipo) {
  return tipo === TIPOS_REGALO.TRANSFERENCIA || tipo === TIPOS_REGALO.EFECTIVO;
}
