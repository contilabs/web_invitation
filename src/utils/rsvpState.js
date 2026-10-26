// Lógica pura: la máquina de estados del bloque de confirmación (RF-1, RF-7; D1, D2, D15;
// B2, I1; M10).
//
// Los siete estados son un **concepto de interfaz** (D1): en la spec se nombran en español
// (`sin-respondido`, `telefono`, `consultando`, `respondido`, `editando`, `cerrado` y
// `degradado`) y aquí, en el código, sus identificadores van en inglés (M5, constitución
// principio 6); cada estado lleva su nombre de la spec al lado. «Respondido» **no** es un
// estado del libro: los cuatro estados de la respuesta (004 RF-10) no cambian (D10).
//
// **Una sola regla de arranque** (D2, I1): `degradado` > `cerrado` > `respondido`
// (personalizada con respuesta previa) > `sin-respondido`. Y **una sola tabla de
// transiciones** (DT-3): un acontecimiento que no aplica en el estado actual **no cambia
// nada** y devuelve `null`, que es la guarda del doble clic (M10).
//
// Nada de React, nada de DOM, nada de reloj y nada de red (RNF-4, RNF-9): el estado de la
// invitación y el plazo (`open`) entran por parámetro desde `hooks/` —el cierre del plazo lo
// dispara `useConfirmation`— y el componente solo pinta el estado y lanza acontecimientos.

import { INVITATION_TYPES } from "./invitation.js";

// Los siete estados del bloque (RF-1, D1). El comentario da el nombre de la spec.
export const BLOCK_STATES = {
  NOT_ANSWERED: "not-answered", // sin-respondido
  PHONE: "phone", // telefono (solo genérica y pública, RF-5)
  LOOKING_UP: "looking-up", // consultando (la consulta en vuelo, M3)
  ANSWERED: "answered", // respondido
  EDITING: "editing", // editando
  CLOSED: "closed", // cerrado (plazo vencido, RF-7)
  DEGRADED: "degraded", // degradado (fallo, sin configuración o modo demo, RF-7)
};

// Los acontecimientos que mueven el bloque (RF-1, RF-5, RF-7, RF-9).
export const BLOCK_EVENTS = {
  REVEAL: "reveal", // «Responder invitación»
  CONTINUE: "continue", // «Continuar» con el teléfono completo
  LOOKUP_FOUND: "lookup-found", // la consulta devuelve una fila con respuesta
  LOOKUP_NONE: "lookup-none", // sin fila o fila sin respuesta: primera respuesta
  LOOKUP_FAILED: "lookup-failed", // la consulta no termina bien (R3)
  LOOKUP_INVALID_PHONE: "lookup-invalid-phone", // el servicio rechaza el teléfono (M4)
  EDIT: "edit", // «Editar»
  SUBMIT_OK: "submit-ok", // envío aceptado (RF-9)
  SUBMIT_FAIL: "submit-fail", // envío fallido: se conserva lo escrito (RF-9)
  DEADLINE: "deadline", // vence el plazo sin recargar (RF-7)
};

// El único `status` de `useInvitation` que significa «invitación resuelta» (su API no
// cambia, DT-7): con cualquier otro (`demo`, `loading`, `error`) el bloque no se puede
// contestar y arranca degradado (D2).
const INVITATION_READY = "ready";

// Tabla explícita de transiciones (RF-1, DT-3). Un estado sin entrada para ese
// acontecimiento **no** cambia: la pulsación repetida se ignora (M10). Solo el primer paso
// depende del tipo: la personalizada va directa al formulario (RF-3) y la genérica y la
// pública, al paso del teléfono (RF-5).
const TRANSITIONS = {
  [BLOCK_STATES.NOT_ANSWERED]: {
    [BLOCK_EVENTS.REVEAL]: ({ personalized }) =>
      personalized ? BLOCK_STATES.EDITING : BLOCK_STATES.PHONE,
    [BLOCK_EVENTS.DEADLINE]: BLOCK_STATES.CLOSED,
  },
  [BLOCK_STATES.PHONE]: {
    [BLOCK_EVENTS.CONTINUE]: BLOCK_STATES.LOOKING_UP,
    [BLOCK_EVENTS.DEADLINE]: BLOCK_STATES.CLOSED,
  },
  [BLOCK_STATES.LOOKING_UP]: {
    // Fila con respuesta → `respondido`; sin fila o fila sin respuesta → formulario limpio;
    // consulta fallida → `degradado` (RF-5, RF-7; R3).
    [BLOCK_EVENTS.LOOKUP_FOUND]: BLOCK_STATES.ANSWERED,
    [BLOCK_EVENTS.LOOKUP_NONE]: BLOCK_STATES.EDITING,
    [BLOCK_EVENTS.LOOKUP_FAILED]: BLOCK_STATES.DEGRADED,
    // El servicio vuelve a validar el teléfono y es la autoridad (M4): ese rechazo no
    // degrada el bloque, se corrige en el paso del teléfono.
    [BLOCK_EVENTS.LOOKUP_INVALID_PHONE]: BLOCK_STATES.PHONE,
    [BLOCK_EVENTS.DEADLINE]: BLOCK_STATES.CLOSED,
  },
  [BLOCK_STATES.ANSWERED]: {
    [BLOCK_EVENTS.EDIT]: BLOCK_STATES.EDITING,
    [BLOCK_EVENTS.DEADLINE]: BLOCK_STATES.CLOSED,
  },
  [BLOCK_STATES.EDITING]: {
    [BLOCK_EVENTS.SUBMIT_OK]: BLOCK_STATES.ANSWERED,
    // Un envío fallido deja el bloque editando, con el aviso y lo escrito intacto (RF-9).
    [BLOCK_EVENTS.SUBMIT_FAIL]: BLOCK_STATES.EDITING,
    [BLOCK_EVENTS.DEADLINE]: BLOCK_STATES.CLOSED,
  },
  // `cerrado` y `degradado` quedan fuera de la interacción normal: se sale de ellos
  // recargando o reintentando la resolución, no con un acontecimiento del bloque (RF-7).
  [BLOCK_STATES.CLOSED]: {},
  [BLOCK_STATES.DEGRADED]: {},
};

// Estado de arranque (RF-1, RF-7; D2, I1): la **única** regla, en este orden. La invitación
// resuelta es la que trae el tipo y la respuesta previa; `open` es el plazo (el «ahora» no
// entra aquí).
export function initialBlockState({ status, invitation, open } = {}) {
  if (status !== INVITATION_READY) return BLOCK_STATES.DEGRADED;
  if (!open) return BLOCK_STATES.CLOSED;
  if (invitation?.type === INVITATION_TYPES.PERSONALIZED && invitation.previousResponse) {
    return BLOCK_STATES.ANSWERED;
  }
  return BLOCK_STATES.NOT_ANSWERED;
}

// Transición del bloque (RF-1, DT-3): el estado siguiente, o `null` cuando el acontecimiento
// no aplica en el estado actual (doble clic y pulsaciones repetidas, M10). Solo la primera
// transición necesita saber si la invitación es personalizada.
export function nextBlockState(state, event, { personalized = false } = {}) {
  if (!Object.prototype.hasOwnProperty.call(TRANSITIONS, state)) return null;
  const row = TRANSITIONS[state];
  if (!Object.prototype.hasOwnProperty.call(row, event)) return null;
  const next = row[event];
  return typeof next === "function" ? next({ personalized }) : next;
}
