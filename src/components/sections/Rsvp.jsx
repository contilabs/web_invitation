// Confirmación de asistencia (spec 005: RF-1, RF-2, RF-3, RF-4, RF-5, RF-6, RF-7, RF-9,
// RF-10; D15; RNF-1, RNF-3).
//
// El bloque se deriva de la **máquina de estados** (`utils/rsvpState.js`): siete estados
// (`sin-respondido`, `telefono`, `consultando`, `respondido`, `editando`, `cerrado` y
// `degradado`) con una sola regla de arranque y una sola tabla de transiciones; aquí solo se
// pinta el estado y se lanzan los acontecimientos con `nextBlockState` (D1, D15, DT-3).
//
//   1. **`sin-respondido`**: solo el título del registro y «Responder invitación» —con
//      `aria-expanded` y el panel asociado por `id`—; nada del invitado a la vista (RF-3, R6);
//   2. **`telefono`** (genérica y pública): el teléfono y «Continuar» deshabilitado hasta los
//      diez dígitos (RF-5, M4);
//   3. **`consultando`**: teléfono y «Continuar» deshabilitados, sin formulario y el aviso en
//      la región viva (M3); el veredicto de `useGuestLookup` mueve el bloque: fila con
//      respuesta → `respondido`, sin fila → `editando` limpio, fallo → `degradado` (y
//      `INVALID_PHONE`/`MISSING_FIELDS` de vuelta a `telefono`, M4);
//   4. **`respondido`**: agradecimiento (copy `OK`, también para `rejected`), datos en solo
//      lectura (`ResponseSummary`, con el teléfono aportado) y «Editar» (RF-9, RF-10); en un
//      **rechazo** el panel no muestra nada de la asistencia (D18);
//   5. **`editando`**: el formulario en el orden de RF-3, con los combos de RF-4 (o campo
//      libre con `n`, con mínimo 1) y el nombre registrado editable; los **cuatro campos de
//      la asistencia** (adultos, niños, alergias y mensaje) solo existen con «Sí, asistiré»
//      (RF-11, D17) y, mientras están a la vista, el valor del combo se **normaliza** a una de
//      sus opciones para que lo que se ve sea lo que se envía (R10, DT-13);
//   6. **`cerrado`**: el aviso de plazo y, en la personalizada, sus datos en lectura —de un
//      rechazo, sin la asistencia (D18)—; sin «Responder invitación» ni «Editar» (RF-7);
//   7. **`degradado`**: el motivo, «Reintentar» cuando la causa lo permite y «Responder
//      invitación» deshabilitado (RF-7, 004 D10).
//
// Los datos del invitado **no** salen de las fichas de ejemplo ni se inventan (004 RF-1,
// RF-13): la resolución y la consulta llegan de los hooks y la configuración de
// `services/config.js`. El envío va al servicio (`useRsvp` → `services/registration.js`) y la
// copia de cada aviso sale del contrato (`SERVICE_ERRORS`, fuente única; RNF-7).
//
// Importa: `src/utils/rsvpState.js` (máquina), `src/utils/rsvp.js` + `src/utils/invitation.js`
// (decisiones puras), `src/hooks/useGuestLookup.js` (consulta), `src/hooks/useInvitation.js`
// (resolución), `src/hooks/useConfirmation.js` (plazo), `src/hooks/useRsvp.js` (envío) y las
// piezas `src/components/ui/AttendeeSelect.jsx` y `src/components/ui/ResponseSummary.jsx`.
import { useEffect, useMemo, useRef, useState } from "react";

import { NO_LIMIT, RESPONSE_STATES, SERVICE_ERRORS } from "../../constants/contract.js";
import { useConfirmation } from "../../hooks/useConfirmation.js";
import { useGuestLookup } from "../../hooks/useGuestLookup.js";
import { useInvitation } from "../../hooks/useInvitation.js";
import { useRsvp } from "../../hooks/useRsvp.js";
import { useTemplate } from "../../hooks/useTemplate.js";
import { readServiceConfig } from "../../services/config.js";
import { photoFor } from "../../services/photos.js";
import { confirmationFields, deadlineMs } from "../../utils/confirmation.js";
import { eventTimeZone, formatDate } from "../../utils/event.js";
import { attendeeLimits, guestLimit, INVITATION_TYPES } from "../../utils/invitation.js";
import {
  attendanceForm,
  attendeeOptions,
  attendeeValue,
  isPhoneComplete,
  phoneDigits,
} from "../../utils/rsvp.js";
import {
  BLOCK_EVENTS,
  BLOCK_STATES,
  initialBlockState,
  nextBlockState,
} from "../../utils/rsvpState.js";
import { AttendeeSelect } from "../ui/AttendeeSelect.jsx";
import { ResponseSummary } from "../ui/ResponseSummary.jsx";

// Los códigos del contrato por nombre, para no repetir literales (RF-17).
const CODES = Object.fromEntries(SERVICE_ERRORS.map(({ code }) => [code, code]));

// Id del panel que asocia el botón que revela el contenido (RNF-1, DT-9).
const PANEL_ID = "rsvp-respuesta";

// Aviso por código: el mensaje y si la causa se puede reintentar viven en el contrato
// (`SERVICE_ERRORS`), nunca escritos aquí (004 RF-12, RNF-7). Un código desconocido se trata
// como el fallo del servicio, que es el aviso más honesto.
function serviceNotice(code) {
  return (
    SERVICE_ERRORS.find((error) => error.code === code) ??
    SERVICE_ERRORS.find((error) => error.code === CODES.SERVICE_UNAVAILABLE)
  );
}

// Cifra de un campo numérico: un campo vacío vale cero (004 RF-9).
const toCount = (value) => (value === "" ? 0 : Number(value));

// Texto de ayuda del cupo (004 RF-9, D12): la personalizada anuncia los lugares de su fila y
// la genérica y la pública, el límite vigente; `PUBLIC` («n») no tiene tope.
function seatsHint(invitation) {
  if (invitation?.type === INVITATION_TYPES.PERSONALIZED) {
    const adults = invitation.adultsGuests ?? 0;
    const children = invitation.childGuests ?? 0;
    const parts = [`${adults} ${adults === 1 ? "adulto" : "adultos"}`];
    if (children > 0) parts.push(`${children} ${children === 1 ? "niño" : "niños"}`);
    return `Tu invitación reserva ${parts.join(" y ")}.`;
  }
  const limit = guestLimit(invitation);
  if (!Number.isFinite(limit)) return "Esta invitación no tiene tope.";
  return `Puedes confirmar hasta ${limit} ${limit === 1 ? "persona" : "personas"}.`;
}

// Ayuda del cupo de niños (solo la personalizada ofrece niños, 004 D12).
function childrenHint(limit) {
  return `Puedes llevar hasta ${limit} ${limit === 1 ? "niño" : "niños"}.`;
}

// El resumen de un **rechazo** no muestra nada de la asistencia (D18, DT-15): quien no
// asiste no confirmó adultos, ni niños, ni mensaje, ni restricciones, así que esos datos se
// pasan **ausentes** —`undefined`, no un `0` ni una cadena vacía, que sí se pintarían
// (`ResponseSummary` pinta todo lo que no esté vacío)—. En una confirmación se muestran como
// hoy. Los niños, además, solo existen en la personalizada (004 D12); la decisión es de quien
// usa el panel, que no cambia de API (RF-9, RF-11).
function summaryData(answer, personalized) {
  if (!answer) return null;
  const rejected = answer.state === RESPONSE_STATES.REJECTED;
  return {
    name: answer.name,
    adultsAttendees: rejected ? undefined : answer.adultsAttendees,
    childAttendees: rejected || !personalized ? undefined : answer.childAttendees,
    message: rejected ? undefined : answer.message,
    restrictions: rejected ? undefined : answer.restrictions,
    datetime: answer.datetime,
    phone: answer.phone,
  };
}

// Los cuatro campos de la asistencia —adultos, niños, alergias y mensaje— **solo existen**
// con «Sí, asistiré» (RF-11, D17): con «No podré asistir» o sin elegir nada no se pintan
// —no se esconden por CSS ni quedan deshabilitados de adorno— y sus `<label>`/ayudas se van
// con ellos (sin etiquetas huérfanas, RNF-1). El **nombre** y el **teléfono** no dependen de
// esto y se pintan siempre, también al rechazar (004 RF-8/D26 intactas).
function showsAttendanceFields(response) {
  return response === RESPONSE_STATES.CONFIRMED;
}

// Aviso de esa aparición o desaparición para la **región viva** (RNF-1): es una región
// `visually-hidden` que existe **siempre** —para que su cambio se anuncie— y solo cambia de
// texto; el mismo texto repetido no vuelve a anunciarse, así que las escrituras del
// formulario no la hacen hablar.
function attendanceNotice(response) {
  if (response === RESPONSE_STATES.CONFIRMED) {
    return "Se muestran los campos de asistentes, alergias y mensaje.";
  }
  if (response === RESPONSE_STATES.REJECTED) {
    return "No se muestran los campos de asistentes, alergias ni mensaje.";
  }
  return "Los campos de asistentes, alergias y mensaje aparecen al elegir «Sí, asistiré».";
}

// El foco entra al primer campo del paso revelado (RNF-1).
function focusFirstField(container) {
  const first = container?.querySelector?.("input, select, textarea");
  if (first) first.focus();
  else container?.focus?.();
}

// Campo de asistentes (RF-4, R1, R8): combo con las opciones de **su** campo cuando el cupo
// es numérico —adultos `1..cupo`, sin el 0; niños `0..cupo`— y campo numérico libre cuando es
// `n` (sin tope: la app no declara ningún máximo, pero con **mínimo 1**, R9: confirmar exige
// al menos un asistente). Con cupo 0 no hay nada que ofrecer y el campo no se muestra (solo
// cabe rechazar, 004 D21).
//
// El valor que llega ya viene **normalizado** a una de las opciones del combo (R10, DT-13): la
// normalización vive en el estado del formulario, no en lo que se pinta, para no tener dos
// fuentes de verdad. El servicio sigue siendo la autoridad al enviar (004 RF-9, `OVER_LIMIT`).
function AttendeeField({ id, label, limit, field = "adults", value, helpText, onChange }) {
  const options = attendeeOptions(limit, field);

  if (options === null) {
    if (limit === NO_LIMIT) {
      return (
        <div className="field">
          <label htmlFor={id}>{label}</label>
          <input
            type="number"
            id={id}
            name={id}
            min={1}
            step={1}
            inputMode="numeric"
            value={value}
            onChange={(event) => onChange(event.target.value)}
            aria-describedby={`${id}-help`}
            required
          />
          <p className="help-text" id={`${id}-help`}>
            {helpText}
          </p>
        </div>
      );
    }
    return null;
  }

  return (
    <AttendeeSelect
      id={id}
      label={label}
      value={value}
      options={options.map((option) => ({ value: String(option), label: String(option) }))}
      onChange={onChange}
      helpText={helpText}
    />
  );
}

export function Rsvp({ wedding }) {
  const template = useTemplate();
  // La configuración del despliegue se resuelve una vez al montar (004 RF-15): no es un dato
  // del invitado ni cambia en caliente.
  const config = useMemo(() => readServiceConfig(), []);
  const [retryToken, setRetryToken] = useState(0);

  const { status, invitation, errorCode } = useInvitation({ config, retryToken });
  const { open } = useConfirmation(invitation?.deadline ?? null);
  const {
    status: lookupStatus,
    errorCode: lookupErrorCode,
    result: lookupResult,
    lookup,
  } = useGuestLookup({ config });

  const personalized = invitation?.type === INVITATION_TYPES.PERSONALIZED;

  // El cupo que pinta el combo y acota la validación: manda la consulta cuando difiere
  // (RF-4, M2); sin consulta vigente, el de la resolución.
  const lookupLimit = lookupStatus === "ok" ? (lookupResult?.limit ?? null) : null;
  const limits = attendeeLimits(invitation, lookupLimit);

  // La invitación que ve la validación previa del envío lleva ese mismo cupo (DT-6): el combo
  // y la comprobación usan un solo criterio y el servicio sigue siendo la autoridad.
  const effectiveInvitation = useMemo(() => {
    if (!invitation || personalized) return invitation ?? null;
    const limit = lookupLimit ?? invitation.limit;
    return limit === invitation.limit ? invitation : { ...invitation, limit };
  }, [invitation, personalized, lookupLimit]);

  const { status: sendStatus, errorCode: sendErrorCode, submit } = useRsvp({
    config,
    invitation: effectiveInvitation,
  });

  // Estado del bloque: la regla única de arranque y, después, solo los acontecimientos (D2,
  // DT-3). No se usa `useReducer` para no enredar la reinicialización (DT-3).
  const [block, setBlock] = useState(() => initialBlockState({ status, invitation, open }));
  const [form, setForm] = useState(() => attendanceForm(null, null));
  const [phone, setPhone] = useState("");
  const [answered, setAnswered] = useState(null);
  const [lookupNotice, setLookupNotice] = useState(null);
  const [sendNotice, setSendNotice] = useState(null);

  const submitted = useRef(null);
  const lookupPhone = useRef(null);
  const phoneRef = useRef(null);
  const formRef = useRef(null);
  const attendanceRef = useRef(null);
  const submitRef = useRef(null);
  const summaryRef = useRef(null);
  const noticeRef = useRef(null);

  const confirmation = wedding?.confirmacion ?? {};
  const fields = confirmationFields(confirmation);
  const hasField = (name) => fields.includes(name);
  const partner = personalized ? (invitation?.partnerName ?? "") : "";
  const deadlineText = invitation?.deadline
    ? formatDate(deadlineMs(invitation.deadline), eventTimeZone(wedding?.evento))
    : "";

  // Lo que se muestra en lectura: la respuesta de esta sesión o la que ya traía la
  // personalizada (D13: el estado «respondido» se construye con lo que la app ya tiene). Un
  // **rechazo** limpia los campos de la asistencia antes de pintarlos (D18, DT-15).
  const answer =
    answered ??
    (personalized && invitation?.previousResponse
      ? { ...invitation.previousResponse, name: invitation.guestName, phone: null }
      : null);
  const answeredData = summaryData(answer, personalized);

  // Causa del bloque deshabilitado: la configuración (modo demo o error de resolución) o el
  // fallo de la consulta, que es el único camino que deja `degradado` con el servicio listo.
  const cause =
    status === "demo"
      ? CODES.NOT_CONFIGURED
      : status === "error"
        ? errorCode
        : status === "ready" && block === BLOCK_STATES.DEGRADED
          ? (lookupErrorCode ?? CODES.SERVICE_UNAVAILABLE)
          : null;
  const causeNotice = cause ? serviceNotice(cause) : null;

  const phoneComplete = isPhoneComplete(phone);
  const looking = block === BLOCK_STATES.LOOKING_UP;
  // Los cuatro campos de la asistencia solo existen con «Sí, asistiré» (RF-11, D17).
  const showsAttendance = showsAttendanceFields(form.response);
  const phoneChanged =
    !personalized &&
    lookupPhone.current !== null &&
    phoneDigits(phone) !== phoneDigits(lookupPhone.current);

  // Las opciones del combo de cada campo, por **su** rango (RF-4, R8): adultos `1..cupo` (sin
  // el 0) y niños `0..cupo`; `null` con cupo 0 (sin combo) o con un límite sin tope. Se
  // memorizan por el cupo para que el efecto de normalización no corra en cada pintado.
  const adultOptions = useMemo(() => attendeeOptions(limits.adults, "adults"), [limits.adults]);
  const childOptions = useMemo(() => attendeeOptions(limits.children, "children"), [limits.children]);

  // Lo que se **ve** es lo que se **envía** (R10, DT-13): mientras los campos de la asistencia
  // estén a la vista, el valor del combo se normaliza a una de sus opciones con
  // `attendeeValue` —el 0 heredado de una respuesta previa se ve y se envía como **1**—. Cubre
  // también el valor que llega **después** de mostrarse el formulario (una precarga). El efecto
  // solo escribe cuando el valor no era válido —`attendeeValue` de una opción válida es ella
  // misma—, así que converge en una pasada y no se realimenta. Sin combo (cupo 0, campo libre
  // de `n`) no hay nada que normalizar (004 D21; R9).
  useEffect(() => {
    if (!showsAttendance) return;
    setForm((current) => {
      const adults = attendeeValue(current.adults, adultOptions);
      const children = attendeeValue(current.children, childOptions);
      if (adults === current.adults && children === current.children) return current;
      return { ...current, adults, children };
    });
  }, [showsAttendance, adultOptions, childOptions, form.adults, form.children]);

  // El bloque vuelve a su arranque cuando cambia lo que lo decide: la invitación resuelta, el
  // plazo (el cierre sin recargar lo dispara `useConfirmation`) o el reintento (RF-1, RF-7;
  // D2). Un envío aceptado no cambia esos valores, así que `respondido` se mantiene.
  useEffect(() => {
    setBlock(initialBlockState({ status, invitation, open }));
  }, [status, invitation, open, retryToken]);

  // El veredicto de la consulta mueve el bloque (RF-5, RF-7). El efecto corre **solo** al
  // cambiar `lookupStatus`: mientras consulta, el campo del teléfono está deshabilitado, así
  // que ni el teléfono ni el modelo cambian bajo los pies del efecto.
  useEffect(() => {
    if (lookupStatus === "ok") {
      const previous = lookupResult?.previousResponse ?? null;
      setLookupNotice(null);
      if (previous) {
        // Fila con respuesta → `respondido`; el teléfono aportado se muestra en el panel
        // (M9) y no se persiste en ninguna parte (RNF-2).
        lookupPhone.current = phone;
        setAnswered({ ...previous, phone: phoneDigits(phone) });
        setBlock(
          (current) =>
            nextBlockState(current, BLOCK_EVENTS.LOOKUP_FOUND, { personalized }) ?? current,
        );
      } else {
        // Sin fila o fila sin respuesta → primera respuesta con el formulario limpio (D5).
        setForm(attendanceForm(invitation, null));
        setBlock(
          (current) =>
            nextBlockState(current, BLOCK_EVENTS.LOOKUP_NONE, { personalized }) ?? current,
        );
      }
      return;
    }
    if (lookupStatus !== "error") return;

    // El servicio vuelve a validar el teléfono y es la autoridad (M4): ese rechazo no
    // degrada el bloque, vuelve al paso del teléfono con su aviso.
    if (lookupErrorCode === CODES.INVALID_PHONE || lookupErrorCode === CODES.MISSING_FIELDS) {
      setLookupNotice(serviceNotice(lookupErrorCode).message);
      setBlock(
        (current) =>
          nextBlockState(current, BLOCK_EVENTS.LOOKUP_INVALID_PHONE, { personalized }) ?? current,
      );
      return;
    }

    // Cualquier otra causa degrada el bloque, sin formulario: sin consulta no se sabe si hay
    // respuesta previa y responder a ciegas podría sobrescribirla (RF-7, R3).
    setLookupNotice(null);
    setBlock(
      (current) =>
        nextBlockState(current, BLOCK_EVENTS.LOOKUP_FAILED, { personalized }) ?? current,
    );
  }, [lookupStatus]);

  // El veredicto del envío (RF-9): aceptado pasa a `respondido` con los datos de esta sesión;
  // fallido deja el bloque `editando`, con el aviso y lo escrito intactos (004 RF-14).
  useEffect(() => {
    if (sendStatus === "ok") {
      setSendNotice(null);
      setAnswered(submitted.current ?? null);
      setBlock(
        (current) => nextBlockState(current, BLOCK_EVENTS.SUBMIT_OK, { personalized }) ?? current,
      );
    } else if (sendStatus === "error") {
      setSendNotice(serviceNotice(sendErrorCode).message);
      setBlock(
        (current) => nextBlockState(current, BLOCK_EVENTS.SUBMIT_FAIL, { personalized }) ?? current,
      );
    }
  }, [sendStatus]);

  // RNF-1: al revelar un paso el foco va a su primer campo (el teléfono o el formulario) y,
  // al pasar a `respondido`, al panel de datos.
  useEffect(() => {
    if (block === BLOCK_STATES.PHONE) phoneRef.current?.focus();
    else if (block === BLOCK_STATES.EDITING) focusFirstField(formRef.current);
    else if (block === BLOCK_STATES.ANSWERED) summaryRef.current?.focus();
  }, [block]);

  // El foco queda en el aviso del envío fallido: es lo que hay que leer (004 RNF-6).
  useEffect(() => {
    if (sendStatus === "error") noticeRef.current?.focus();
  }, [sendStatus]);

  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  // Cambiar de opinión **no** vacía el formulario (RF-11, D17): los cuatro campos se dejan de
  // pintar y lo ya escrito se queda en el estado, listo para reaparecer al reelegir «Sí,
  // asistiré» (el efecto de normalización devuelve el 0 heredado de adultos como 1, R10). Si el
  // foco estaba en uno de los campos que desaparecen se lleva al bloque de asistencia, para que no
  // se quede en un control que ya no está (RNF-1).
  function changeAttendance(response) {
    update("response", response);
    const active = formRef.current?.ownerDocument?.activeElement;
    if (active && active !== formRef.current && formRef.current?.contains(active)) {
      if (!showsAttendanceFields(response) || !active.closest?.(".attendance")) {
        attendanceRef.current?.focus();
      }
    }
  }

  // Guarda del foco **antes** de pintar el cambio (RF-11, RNF-1): si el foco estaba dentro de
  // uno de los cuatro campos que van a desaparecer, se lleva al botón de enviar —que existe en
  // los dos casos— al final del repintado. El foco de los radios de la asistencia, que siguen
  // ahí, no se toca.
  function keepFocusVisible(event) {
    const active = event.currentTarget.ownerDocument?.activeElement;
    if (active?.closest?.(".attendance-fields")) submitRef.current?.focus();
  }

  function handleReveal() {
    const next = nextBlockState(block, BLOCK_EVENTS.REVEAL, { personalized });
    if (next === null) return;
    setLookupNotice(null);
    setSendNotice(null);
    // La personalizada va directa al formulario con su respuesta previa (RF-2); la genérica
    // y la pública, al paso del teléfono (RF-5).
    if (next === BLOCK_STATES.EDITING) {
      setForm(attendanceForm(invitation, invitation?.previousResponse ?? null));
    }
    setBlock(next);
  }

  function handleContinue(event) {
    event.preventDefault();
    // El doble clic no consulta dos veces: el candado está en el hook y el estado no cambia
    // si el acontecimiento no aplica (M10).
    if (nextBlockState(block, BLOCK_EVENTS.CONTINUE, { personalized }) === null) return;
    if (!phoneComplete) return;
    setLookupNotice(null);
    setBlock(BLOCK_STATES.LOOKING_UP);
    lookup(phone);
  }

  function handleEdit() {
    if (nextBlockState(block, BLOCK_EVENTS.EDIT, { personalized }) === null) return;
    setSendNotice(null);
    // La precarga sale de lo que ya se muestra: la respuesta previa o la de esta sesión
    // (RF-2, RF-5, RF-10); el teléfono no forma parte de ella (vive en el componente).
    setForm(attendanceForm(effectiveInvitation, answeredData));
    setBlock(BLOCK_STATES.EDITING);
  }

  function handleSubmit(event) {
    event.preventDefault();
    submitted.current = {
      state: form.response,
      name: form.name,
      adultsAttendees: toCount(form.adults),
      childAttendees: personalized ? toCount(form.children) : 0,
      message: form.message.trim() === "" ? null : form.message.trim(),
      restrictions: form.restrictions.trim() === "" ? null : form.restrictions.trim(),
      // El envío solo devuelve `OK`: la fecha se muestra cuando existe y no se inventa
      // cuando no (004 RF-13).
      datetime: null,
      phone: personalized ? null : phoneDigits(phone),
    };
    submit({
      response: form.response,
      name: form.name,
      phone,
      adults: toCount(form.adults),
      children: personalized ? toCount(form.children) : 0,
      message: form.message,
      restrictions: form.restrictions,
    });
  }

  const companionRow =
    personalized && invitation?.partnerName
      ? [{ id: "companero", label: "Acompañante", value: invitation.partnerName }]
      : [];

  return (
    <section className="rsvp reveal" id="confirmar">
      <div className="wrap">
        {confirmation.titulo && <h2>{confirmation.titulo}</h2>}

        <div className="rsvp-grid">
          <figure className="rsvp-photo">
            <img
              {...photoFor(
                template.structuralPhotos.confirmation,
                "",
                template.photoSizes.confirmation,
              )}
              loading="lazy"
              decoding="async"
            />
          </figure>

          <div className="rsvp-panel">
            {status === "loading" ? (
              /* La carga no bloquea el resto de la página (004 RNF-5). */
              <p className="help-text" role="status">
                Estamos revisando tu invitación…
              </p>
            ) : (
              <>
                {/* Vista colapsada: solo «Responder invitación», con su estado anunciado
                    (RF-3, D15, RNF-1). En `degradado` se ofrece deshabilitado (RF-7). */}
                {(block === BLOCK_STATES.NOT_ANSWERED || block === BLOCK_STATES.DEGRADED) && (
                  <button
                    type="button"
                    className="button button-solid"
                    aria-expanded={false}
                    aria-controls={PANEL_ID}
                    disabled={block === BLOCK_STATES.DEGRADED}
                    onClick={handleReveal}
                  >
                    Responder invitación
                  </button>
                )}

                {/* degradado: el motivo, «Reintentar» cuando la causa lo permite y sin
                    «Editar» (RF-7, 004 RF-12/D10). */}
                {block === BLOCK_STATES.DEGRADED && causeNotice && (
                  <>
                    <p className="rsvp-lead" role="status">
                      {causeNotice.message}
                    </p>
                    {causeNotice.retryable && (
                      <button
                        type="button"
                        className="button button-outline"
                        onClick={() => setRetryToken((token) => token + 1)}
                      >
                        Reintentar
                      </button>
                    )}
                  </>
                )}

                {/* Contenido revelado: vive dentro del panel asociado al botón (RNF-1). */}
                <div id={PANEL_ID}>
                  {/* telefono / consultando (solo genérica y pública, RF-5). */}
                  {(block === BLOCK_STATES.PHONE || looking) && (
                    <form onSubmit={handleContinue}>
                      <div className="field">
                        <label htmlFor="telefono">Tu teléfono</label>
                        <input
                          type="tel"
                          id="telefono"
                          name="telefono"
                          placeholder="10 dígitos"
                          autoComplete="tel"
                          inputMode="numeric"
                          value={phone}
                          onChange={(event) => setPhone(event.target.value)}
                          ref={phoneRef}
                          disabled={looking}
                          required
                        />
                        <p className="help-text">
                          Diez dígitos: así reconocemos tu respuesta si vuelves a contestar.
                        </p>
                      </div>

                      {/* consultando: sin formulario y el estado en la región viva (M3). */}
                      {looking && (
                        <p className="help-text" role="status">
                          Estamos buscando tu respuesta…
                        </p>
                      )}
                      {!looking && lookupNotice && (
                        <p className="help-text" role="status">
                          {lookupNotice}
                        </p>
                      )}

                      <button
                        type="submit"
                        className="button button-solid"
                        disabled={looking || !phoneComplete}
                      >
                        Continuar
                      </button>
                    </form>
                  )}

                  {/* respondido: agradecimiento, datos en lectura y «Editar» (RF-9). */}
                  {block === BLOCK_STATES.ANSWERED && answeredData && (
                    <>
                      <p className="rsvp-lead" role="status" tabIndex={-1} ref={summaryRef}>
                        {serviceNotice(CODES.OK).message}
                      </p>
                      <ResponseSummary
                        name={answeredData.name}
                        adultsAttendees={answeredData.adultsAttendees}
                        childAttendees={answeredData.childAttendees}
                        message={answeredData.message}
                        restrictions={answeredData.restrictions}
                        datetime={answeredData.datetime}
                        phone={answeredData.phone}
                        extraRows={companionRow}
                      />
                      <button type="button" className="button button-solid" onClick={handleEdit}>
                        Editar
                      </button>
                    </>
                  )}

                  {/* editando: el orden de RF-3 y los combos de RF-4 (RF-2, RF-10). */}
                  {block === BLOCK_STATES.EDITING && invitation && (
                    <form ref={formRef} onSubmit={handleSubmit}>
                      {/* El teléfono de la genérica y la pública queda visible y editable
                          por encima del resto de campos (D6); cambiarlo **no** vuelve a
                          consultar (M8) y la respuesta se guarda con el que se escriba. */}
                      {!personalized && (
                        <div className="field">
                          <label htmlFor="telefono">Tu teléfono</label>
                          <input
                            type="tel"
                            id="telefono"
                            name="telefono"
                            placeholder="10 dígitos"
                            autoComplete="tel"
                            inputMode="numeric"
                            value={phone}
                            onChange={(event) => setPhone(event.target.value)}
                            required
                          />
                          <p className="help-text">
                            Diez dígitos: así reconocemos tu respuesta si vuelves a contestar.
                          </p>
                          {phoneChanged && (
                            <p className="help-text" role="status">
                              Guardaremos tu respuesta con el teléfono que escribas.
                            </p>
                          )}
                        </div>
                      )}

                      <p className="rsvp-lead">
                        Hemos reservado <span id="numero">{invitation.seatsText}</span> en tu honor
                      </p>

                      {hasField("nombre") && (
                        <div className="field">
                          <label htmlFor="nombre">
                            {personalized ? "Esta invitación está a nombre de" : "Tu nombre"}
                          </label>
                          <input
                            type="text"
                            id="nombre"
                            name="nombre"
                            placeholder="Escribe tu nombre"
                            autoComplete="name"
                            value={form.name}
                            onChange={(event) => update("name", event.target.value)}
                            // El titular de la personalizada no se edita (004 RF-7, RF-2).
                            readOnly={personalized}
                            required
                          />
                        </div>
                      )}

                      {/* El acompañante, después del nombre y antes de la asistencia
                          (RF-3); su forma visible no cambia. */}
                      {partner && <p className="help-text">Te acompañará <strong>{partner}</strong>.</p>}

                      <div
                        className="field attendance"
                        role="radiogroup"
                        aria-labelledby="asistencia-titulo"
                        ref={attendanceRef}
                        tabIndex={-1}
                      >
                        <p className="attendance-title" id="asistencia-titulo">
                          ¿Nos acompañarás?
                        </p>
                        <div className="attendance-options">
                          <label className="attendance-option">
                            <input
                              type="radio"
                              name="asistencia"
                              value={RESPONSE_STATES.CONFIRMED}
                              checked={form.response === RESPONSE_STATES.CONFIRMED}
                              onChange={() => changeAttendance(RESPONSE_STATES.CONFIRMED)}
                              disabled={sendStatus === "sending"}
                              required
                            />
                            <span>Sí, asistiré</span>
                          </label>
                          <label className="attendance-option">
                            <input
                              type="radio"
                              name="asistencia"
                              value={RESPONSE_STATES.REJECTED}
                              checked={form.response === RESPONSE_STATES.REJECTED}
                              onChange={() => changeAttendance(RESPONSE_STATES.REJECTED)}
                              disabled={sendStatus === "sending"}
                              required
                            />
                            <span>No podré asistir</span>
                          </label>
                        </div>
                      </div>

                      {/* Los cuatro campos de la asistencia (RF-11, D17): existen **solo**
                          con «Sí, asistiré»; el aparecer/desaparecer se anuncia en la
                          región viva de justo debajo. */}
                      <div
                        className="attendance-fields contents"
                        onBlurCapture={keepFocusVisible}
                      >
                        {showsAttendance && hasField("asistentes") && (
                          <AttendeeField
                            id="asistentes"
                            label={personalized ? "Adultos que asistirán" : "Cuántos asistirán"}
                            limit={limits.adults}
                            field="adults"
                            value={form.adults}
                            helpText={seatsHint(effectiveInvitation)}
                            onChange={(value) => update("adults", value)}
                          />
                        )}

                        {showsAttendance && personalized && limits.children > 0 && (
                          <AttendeeField
                            id="ninos"
                            label="Niños que asistirán"
                            limit={limits.children}
                            field="children"
                            value={form.children}
                            helpText={childrenHint(limits.children)}
                            onChange={(value) => update("children", value)}
                          />
                        )}

                        {showsAttendance && hasField("alergias") && (
                          <div className="field">
                            <label htmlFor="alergias">Alergias o restricciones alimentarias</label>
                            <input
                              type="text"
                              id="alergias"
                              name="alergias"
                              placeholder="Opcional"
                              autoComplete="off"
                              value={form.restrictions}
                              onChange={(event) => update("restrictions", event.target.value)}
                            />
                          </div>
                        )}

                        {showsAttendance && hasField("mensaje") && (
                          <div className="field">
                            <label htmlFor="mensaje">Mensaje para los novios</label>
                            <textarea
                              id="mensaje"
                              name="mensaje"
                              placeholder="Déjanos unas palabras"
                              rows={3}
                              value={form.message}
                              onChange={(event) => update("message", event.target.value)}
                            ></textarea>
                          </div>
                        )}
                      </div>

                      {/* La región viva del aparecer/desaparecer vive **debajo** de los
                          campos que anuncia y **fuera** del bloque condicional: así sigue
                          en el documento cuando los campos se van (el foco no cae en un
                          aviso que desaparece) y solo su texto cambia (RNF-1, RF-11). */}
                      <p className="visually-hidden" role="status">
                        {attendanceNotice(form.response)}
                      </p>

                      {/* El resultado se anuncia en una región viva y recibe el foco
                          (004 RNF-6). */}
                      {sendStatus === "sending" && (
                        <p className="help-text" role="status">
                          Estamos enviando tu respuesta…
                        </p>
                      )}
                      {sendNotice && (
                        <p className="help-text" role="status" tabIndex={-1} ref={noticeRef}>
                          {sendNotice}
                        </p>
                      )}

                      <button
                        type="submit"
                        className="button button-solid"
                        disabled={sendStatus === "sending"}
                        ref={submitRef}
                      >
                        Enviar confirmación
                      </button>
                    </form>
                  )}

                  {/* cerrado: el aviso de plazo y, si la personalizada ya contestó, sus
                      datos en lectura; sin «Responder invitación» ni «Editar» (RF-7, D8). */}
                  {block === BLOCK_STATES.CLOSED && (
                    <div className="rsvp-closed" role="status">
                      <p className="section-note">{serviceNotice(CODES.DEADLINE_EXPIRED).message}</p>
                      {deadlineText && (
                        <p className="help-text">La confirmación cerró el {deadlineText}.</p>
                      )}
                      {answeredData && (
                        <ResponseSummary
                          name={answeredData.name}
                          adultsAttendees={answeredData.adultsAttendees}
                          childAttendees={answeredData.childAttendees}
                          message={answeredData.message}
                          restrictions={answeredData.restrictions}
                          datetime={answeredData.datetime}
                          phone={answeredData.phone}
                          extraRows={companionRow}
                        />
                      )}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
