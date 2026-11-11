// Cliente del endpoint administrativo. Reutiliza el transporte público para conservar
// el POST text/plain y el timeout, pero nunca envía un slug ni secretos desde el navegador.
import { callService } from "./registration.js";
import { ADMIN_SERVICE_ACTIONS } from "../constants/contract.js";

export function listAdminResponses(url, options = {}) {
  return callService(url, { action: ADMIN_SERVICE_ACTIONS.LIST_RESPONSES, email: options.email, token: options.token }, options);
}

export function revealAdminPhone(url, guestId, options = {}) {
  return callService(
    url,
    { action: ADMIN_SERVICE_ACTIONS.REVEAL_PHONE, email: options.email, token: options.token, guestId },
    options,
  );
}

export function requestAdminToken(url, email, options = {}) {
  return callService(url, { action: ADMIN_SERVICE_ACTIONS.REQUEST_TOKEN, email }, options);
}

export function verifyAdminToken(url, email, token, options = {}) {
  return callService(url, { action: ADMIN_SERVICE_ACTIONS.VERIFY_TOKEN, email, token }, options);
}
