// Consulta por teléfono de la respuesta previa (spec 005: RF-5; M4, M10; RNF-2, RNF-4; DT-4).
//
// Expone `{ status, errorCode, result, lookup(phone) }`, con `status ∈ idle | looking | ok |
// error` (plan §4.3):
// - `idle`: todavía no se ha preguntado nada; no hay `result` ni causa;
// - `looking`: la consulta va en camino (el bloque la pinta como `consultando`);
// - `ok`: el servicio contestó conforme al contrato y `result` es el modelo **interpretado**
//   (`utils/invitation.js` → `interpretLookup`): el límite vigente, el plazo y la respuesta
//   previa de **esa** fila —o `null` si no hay fila o no tiene respuesta, que es una primera
//   respuesta—. Con eso decide el bloque si pasa a «respondido» o al formulario (RF-1);
// - `error`: no se pudo preguntar; la causa está en `errorCode` (un código del contrato).
//
// Reglas:
// - el teléfono se valida **antes** de llamar (`isPhoneComplete`, M4): con menos de diez
//   dígitos no se llama y la causa es `INVALID_PHONE`;
// - mientras hay una consulta en curso, un segundo `lookup` **se ignora** (doble clic, M10):
//   el candado es un `useRef`, como el del envío en `useRsvp`;
// - sin servicio listo (`not-configured` → `NOT_CONFIGURED`; `missing-slug` → `MISSING_SLUG`)
//   no se llama a nadie: la causa es la de la configuración, no un «no se pudo» (RF-15);
// - el cuerpo es el del contrato (`lookupPayload`, con el código del enlace recortado) y la
//   llamada usa el **mismo** cliente que el envío (`services/registration.js`), que ya acota
//   el tiempo de espera;
// - la consulta se cancela al desmontar y, una vez cancelada, **no** pinta nada: el hook
//   **nunca** lanza al componente ni pisa el estado con una respuesta tardía;
// - el hook **no** decide el estado del bloque: `INVALID_PHONE`/`MISSING_FIELDS` los trata el
//   paso del teléfono y el resto degrada; eso se decide al pintarlo (RF-5, RF-7; DT-4);
// - **no** persiste nada y el teléfono solo viaja al servicio: la consulta **no** lo escribe
//   en el libro ni lo deja en el navegador (RNF-2).
import { useCallback, useEffect, useRef, useState } from "react";

import { SERVICE_ERRORS } from "../constants/contract.js";
import { interpretLookup, readGuestCode } from "../utils/invitation.js";
import { isPhoneComplete, lookupPayload } from "../utils/rsvp.js";
import { SERVICE_STATES } from "../utils/service.js";
import { callService as defaultCallService } from "../services/registration.js";

// Los códigos del contrato por nombre, para no repetir literales (RF-17).
const CODES = Object.fromEntries(SERVICE_ERRORS.map(({ code }) => [code, code]));

// Estado del hook: la consulta en reposo, en camino, resuelta o con causa.
function state(status, errorCode, result) {
  return { status, errorCode, result };
}

// Código de enlace (RF-2): el que entre por parámetro o, si no, el `guest` de la URL —
// recortado—, el mismo camino que usa el envío.
function linkCode(provided) {
  if (provided !== null && provided !== undefined && String(provided).trim() !== "") {
    return provided;
  }
  return readGuestCode(new URLSearchParams(window.location.search));
}

export function useGuestLookup({
  config,
  code,
  callService = defaultCallService,
  timeoutMs,
  fetchImpl,
} = {}) {
  const [result, setResult] = useState(() => state("idle", null, null));

  // El candado del doble clic **y** el mango de cancelación de la consulta en curso (M10,
  // RNF-4): mientras no sea `null`, hay una consulta viva y las siguientes se ignoran.
  const inFlight = useRef(null);

  // Al desmontar se cancela lo que esté en curso: su respuesta ya no pinta nada.
  useEffect(
    () => () => {
      inFlight.current?.abort();
      inFlight.current = null;
    },
    [],
  );

  const lookup = useCallback(
    async (phone) => {
      // Doble clic (M10): la consulta en curso manda y la siguiente no la sustituye.
      if (inFlight.current) return;

      // Sin servicio listo no hay a quién preguntar: la causa es la de la configuración
      // (RF-15), nunca un fallo de red inventado.
      if (config?.state !== SERVICE_STATES.READY) {
        setResult(
          state(
            "error",
            config?.state === SERVICE_STATES.MISSING_SLUG ? CODES.MISSING_SLUG : CODES.NOT_CONFIGURED,
            null,
          ),
        );
        return;
      }

      // El teléfono se valida antes de llamar (M4): ni se envía ni se consulta a medias.
      if (!isPhoneComplete(phone)) {
        setResult(state("error", CODES.INVALID_PHONE, null));
        return;
      }

      const controller = new AbortController();
      inFlight.current = controller;
      setResult(state("looking", null, null));

      try {
        const response = await callService(
          config.url,
          lookupPayload({ slug: config.slug, code: linkCode(code), phone }),
          { timeoutMs, signal: controller.signal, fetchImpl },
        );
        // Cancelada (desmontaje): la respuesta tardía no pisa el estado ni el del bloque.
        if (controller.signal.aborted) return;
        const lookup = interpretLookup(
          response?.ok === true ? response.data : { ok: false, code: response?.errorCode },
        );
        // Una consulta correcta sin fila (`previousResponse: null`) **no** es un error: es
        // una primera respuesta y la decide el bloque (RF-5).
        setResult(lookup.ok ? state("ok", null, lookup) : state("error", lookup.errorCode, null));
      } catch {
        // El cliente del contrato no lanza, pero una avería suya tampoco rompe la página.
        if (!controller.signal.aborted) setResult(state("error", CODES.SERVICE_UNAVAILABLE, null));
      } finally {
        if (inFlight.current === controller) inFlight.current = null;
      }
    },
    [config, code, callService, timeoutMs, fetchImpl],
  );

  return { status: result.status, errorCode: result.errorCode, result: result.result, lookup };
}
