// Cliente del endpoint administrativo. Reutiliza el transporte público para conservar
// el POST text/plain y el timeout. La contraseña solo se envía al iniciar sesión.
import { callService } from "./registration.js";
import { ADMIN_SERVICE_ACTIONS } from "../constants/contract.js";

export function loginAdmin(url, slug, password, options = {}) {
  return callService(url, { action: ADMIN_SERVICE_ACTIONS.LOGIN, slug, password }, options);
}

export function listAdminResponses(url, options = {}) {
  return callService(url, { action: ADMIN_SERVICE_ACTIONS.LIST_RESPONSES, session: options.session }, options);
}

export function listAdminCodes(url, options = {}) {
  return callService(url, { action: ADMIN_SERVICE_ACTIONS.LIST_CODES, session: options.session }, options);
}

export function revealAdminPhone(url, guestId, options = {}) {
  return callService(
    url,
    { action: ADMIN_SERVICE_ACTIONS.REVEAL_PHONE, session: options.session, guestId },
    options,
  );
}
