// Invitación resuelta contra el servicio de registro (RF-1, RF-11, RF-12, RF-14; RNF-5).
//
// Expone `{ status, invitation, errorCode }`, con `status ∈ demo | loading | ready | error`
// (plan §5.4):
// - la configuración **sin URL** (`not-configured`) deja el modo **demo** y **no** llama a
//   nadie: la invitación se ve completa, sin personalización (RF-15, D15);
// - la configuración **con URL y sin `slug`** (`missing-slug`) da `error` con
//   `MISSING_SLUG` y **sin reintento**: no se vuelve a llamar sola (RF-15, I7);
// - la configuración **lista** (`ready`) llama al servicio en un `useEffect` con
//   `AbortController` y pasa por `loading` antes de `ready` o `error`, **sin bloquear** el
//   primer pintado (RNF-5, DT-9).
//
// El código de enlace entra por `readGuestCode` (parámetro `guest`, recortado) y el cuerpo
// de la llamada es el del contrato (`action: resolve`). El modelo resuelto lo normaliza
// `utils/invitation.js`: aquí no se deduce el tipo ni el cupo (D20).
import { useEffect, useState } from "react";

import { REQUEST_FIELDS, SERVICE_ACTIONS, SERVICE_ERRORS } from "../constants/contract.js";
import { interpretInvitation, readGuestCode } from "../utils/invitation.js";
import { SERVICE_STATES } from "../utils/service.js";
import { callService as defaultCallService } from "../services/registration.js";

const MISSING_SLUG =
  SERVICE_ERRORS.find((error) => error.code === "MISSING_SLUG")?.code ?? "MISSING_SLUG";
const SERVICE_UNAVAILABLE =
  SERVICE_ERRORS.find((error) => error.code === "SERVICE_UNAVAILABLE")?.code ?? "SERVICE_UNAVAILABLE";

// Estado del hook: el modelo solo existe cuando la invitación se resolvió (`ready`).
function state(status, invitation, errorCode) {
  return { status, invitation, errorCode };
}

// Código del enlace desde la URL de la página.
function guestCodeFromLocation() {
  return readGuestCode(new URLSearchParams(window.location.search));
}

export function useInvitation({
  config,
  callService = defaultCallService,
  timeoutMs,
  fetchImpl,
  // Giro opcional para volver a pedir la invitación sin remontar el componente (RF-12):
  // la interfaz lo cambia cuando la causa de la degradación **sí** tiene reintento. Es
  // aditivo y no cambia nada más de la API del hook.
  retryToken = 0,
} = {}) {
  const configState = config?.state ?? null;
  const url = config?.url ?? "";
  const slug = config?.slug ?? "";

  const [result, setResult] = useState(() => {
    if (configState === SERVICE_STATES.NOT_CONFIGURED) return state("demo", null, null);
    if (configState === SERVICE_STATES.MISSING_SLUG) return state("error", null, MISSING_SLUG);
    return state("loading", null, null);
  });

  useEffect(() => {
    // Modo demo: no hay servicio al que llamar (RF-15, D15).
    if (configState === SERVICE_STATES.NOT_CONFIGURED) {
      setResult(state("demo", null, null));
      return undefined;
    }
    // Hay URL y falta el `slug`: causa propia y **sin reintento** (RF-12, I7).
    if (configState === SERVICE_STATES.MISSING_SLUG) {
      setResult(state("error", null, MISSING_SLUG));
      return undefined;
    }
    if (configState !== SERVICE_STATES.READY) return undefined;

    const controller = new AbortController();
    let active = true;
    setResult(state("loading", null, null));

    const payload = {
      [REQUEST_FIELDS.ACTION]: SERVICE_ACTIONS.RESOLVE,
      [REQUEST_FIELDS.SLUG]: slug,
      [REQUEST_FIELDS.CODE]: guestCodeFromLocation(),
    };

    callService(url, payload, { timeoutMs, signal: controller.signal, fetchImpl })
      .then((response) => {
        if (!active) return;
        const invitation = interpretInvitation(
          response?.ok === true ? response.data : { ok: false, code: response?.errorCode },
        );
        if (invitation.errorCode) {
          setResult(state("error", null, invitation.errorCode));
          return;
        }
        setResult(state("ready", invitation, null));
      })
      .catch(() => {
        if (!active) return;
        setResult(state("error", null, SERVICE_UNAVAILABLE));
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [configState, url, slug, callService, timeoutMs, fetchImpl, retryToken]);

  return result;
}
