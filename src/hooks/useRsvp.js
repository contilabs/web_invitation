// Estado del envío de la respuesta (RF-14; RNF-3, RNF-9).
//
// Expone `{ status, errorCode, submit(form) }` con `status ∈ idle | sending | ok | error`.
// El «cuándo» vive aquí y el cálculo, en `utils/rsvp.js`: `submit` valida **antes** de
// llamar (`MISSING_FIELDS`, `INVALID_PHONE`, `OVER_LIMIT`), arma el cuerpo con los nombres
// de campo del contrato y traduce el resultado del servicio (incluida su respuesta
// rechazada, `INVALID_RESPONSE`).
//
// Mientras `sending` un segundo `submit` se ignora (nada de envíos dobles) y el hook **no
// persiste nada**: el teléfono solo viaja al servicio (RF-8, RNF-2, D11).
import { useCallback, useRef, useState } from "react";

import { SERVICE_ACTIONS, SERVICE_ERRORS } from "../constants/contract.js";
import { interpretRsvpResult, rsvpPayload, validateRsvp } from "../utils/rsvp.js";
import { readGuestCode } from "../utils/invitation.js";
import { SERVICE_STATES } from "../utils/service.js";
import { callService as defaultCallService } from "../services/registration.js";

const SERVICE_UNAVAILABLE =
  SERVICE_ERRORS.find((error) => error.code === "SERVICE_UNAVAILABLE")?.code ?? "SERVICE_UNAVAILABLE";
const MISSING_SLUG =
  SERVICE_ERRORS.find((error) => error.code === "MISSING_SLUG")?.code ?? "MISSING_SLUG";
const NOT_CONFIGURED =
  SERVICE_ERRORS.find((error) => error.code === "NOT_CONFIGURED")?.code ?? "NOT_CONFIGURED";

// El código de enlace: el que traiga el formulario o, si no, el de la URL.
function guestCode(form) {
  const provided = form?.code ?? form?.guest;
  if (provided !== null && provided !== undefined && String(provided).trim() !== "") {
    return String(provided).trim();
  }
  return readGuestCode(new URLSearchParams(window.location.search));
}

export function useRsvp({ config, invitation, callService = defaultCallService, timeoutMs, fetchImpl } = {}) {
  const [status, setStatus] = useState("idle");
  const [errorCode, setErrorCode] = useState(null);
  const sending = useRef(false);

  const submit = useCallback(
    async (form = {}) => {
      if (sending.current) return;
      // Sin servicio configurado no se envía nada: la causa es la de la configuración
      // (RF-12, RF-15), nunca un «no se pudo».
      if (config?.state !== SERVICE_STATES.READY) {
        setStatus("error");
        setErrorCode(config?.state === SERVICE_STATES.MISSING_SLUG ? MISSING_SLUG : NOT_CONFIGURED);
        return;
      }

      const validation = validateRsvp(form, invitation);
      if (!validation.ok) {
        setStatus("error");
        setErrorCode(validation.errorCode);
        return;
      }

      const payload = rsvpPayload({
        action: SERVICE_ACTIONS.RESPOND,
        slug: config.slug,
        code: guestCode(form),
        response: form.response,
        name: form.name,
        phone: form.phone,
        adults: form.adults,
        children: form.children,
        message: form.message,
        restrictions: form.restrictions,
      });

      sending.current = true;
      setStatus("sending");
      setErrorCode(null);

      try {
        const response = await callService(config.url, payload, { timeoutMs, fetchImpl });
        const result = interpretRsvpResult(response);
        setStatus(result.ok ? "ok" : "error");
        setErrorCode(result.ok ? null : result.errorCode);
      } catch {
        setStatus("error");
        setErrorCode(SERVICE_UNAVAILABLE);
      } finally {
        sending.current = false;
      }
    },
    [config, invitation, callService, timeoutMs, fetchImpl],
  );

  return { status, errorCode, submit };
}
