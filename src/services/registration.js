// Cliente HTTP del servicio de registro (RF-14; RNF-4, RNF-8; D25, D27).
//
// Es la **única** pieza que habla con el servicio: `POST` a la URL del despliegue con
// `Content-Type: text/plain;charset=utf-8` y **cuerpo JSON** (así se evita el *preflight*
// que Apps Script no responde, D27). Espera como mucho `REQUEST_TIMEOUT_MS` (10 s) con
// `AbortController` y devuelve `{ ok, data, errorCode }` **sin lanzar**: si la red falla,
// si se agota el tiempo o si el cuerpo no es JSON válido → `SERVICE_UNAVAILABLE` (D25).
//
// `INVALID_DATA` **no** se usa aquí: es un veredicto del **servicio** sobre los datos del
// libro (RF-13). No se añade ninguna librería de peticiones (`fetch` del navegador, RNF-8)
// y el módulo no persiste nada (RNF-2).
import { REQUEST_TIMEOUT_MS, SERVICE_ERRORS } from "../constants/contract.js";

// Código del contrato por nombre, para no repetir el literal (RF-17).
const SERVICE_UNAVAILABLE =
  SERVICE_ERRORS.find((error) => error.code === "SERVICE_UNAVAILABLE")?.code ?? "SERVICE_UNAVAILABLE";

// Texto no vacío y recortado, o `null`.
function text(value) {
  if (value === null || value === undefined) return null;
  const trimmed = String(value).trim();
  return trimmed === "" ? null : trimmed;
}

// Cuerpo de la respuesta: JSON siempre que se pueda; si el servicio contesta texto plano
// con un JSON dentro, también se interpreta (Apps Script devuelve `text/plain`).
async function readBody(response) {
  const contentType = response?.headers?.get?.("content-type") ?? "";
  if (contentType.includes("application/json")) {
    try {
      return await response.json();
    } catch {
      return null;
    }
  }

  let body = "";
  try {
    body = await response.text();
  } catch {
    return null;
  }

  const trimmed = body.trim();
  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    try {
      return JSON.parse(trimmed);
    } catch {
      return null;
    }
  }
  return null;
}

// Llamada al servicio. `options.signal` es la cancelación de quien llama (el desmontaje
// del hook) y se suma al tiempo de espera propio; `fetchImpl` existe para las pruebas.
export async function callService(url, payload, options = {}) {
  const fetchImpl = options.fetchImpl ?? globalThis.fetch;
  if (typeof fetchImpl !== "function") {
    return { ok: false, data: null, errorCode: SERVICE_UNAVAILABLE };
  }

  const controller = new AbortController();
  const external = options.signal;
  const abortFromOutside = () => controller.abort();
  if (external) {
    if (external.aborted) controller.abort();
    else external.addEventListener("abort", abortFromOutside, { once: true });
  }

  const timer = setTimeout(() => controller.abort(), options.timeoutMs ?? REQUEST_TIMEOUT_MS);

  try {
    const response = await fetchImpl(url, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload ?? {}),
      signal: controller.signal,
    });
    const data = await readBody(response);
    if (response?.ok && data?.ok === true) return { ok: true, data, errorCode: null };
    return { ok: false, data, errorCode: text(data?.code) ?? SERVICE_UNAVAILABLE };
  } catch {
    // Red caída, petición cancelada o tiempo agotado: el servicio no respondió como manda
    // el contrato (D25).
    return { ok: false, data: null, errorCode: SERVICE_UNAVAILABLE };
  } finally {
    clearTimeout(timer);
    if (external) external.removeEventListener("abort", abortFromOutside);
  }
}
