// Contrato del servicio de registro (spec 004: RF-17; D18, D25, D27; spec 005: RF-8; D5).
//
// Este módulo es la **fuente única** del contrato: lo consume la app y su documento
// humano (`docs/servicio-invitados.md`) se **deriva** de él; `test/serviceContract.test.js`
// comprueba que el documento no olvide ningún literal ni ningún código de error.
//
// Nomenclatura (constitución, principio 6): los nombres del modelo —hojas, columnas,
// estados, valores especiales, acciones, parámetros y códigos de error— van en **inglés
// a propósito**, porque son los literales de los libros y de la interfaz del servicio y
// traducirlos rompería su mapeo. El **parámetro del enlace** es `guest`; los jubilados
// `codigo`, `code` e `inv` **no** tienen alias (RF-2). Los comentarios van en español y
// los mensajes de interfaz también.
//
// Sin React, sin DOM y sin `import.meta`: se importa tal cual desde `node --test`.
// Sin datos personales ni credenciales: aquí solo vive la **forma** del contrato (RNF-2).

// Versión del contrato. Se sube **a la vez** en la app y en el servicio cuando cambia la
// forma de una llamada o de una respuesta. No viaja en el enlace. `1.1.0` añade la acción
// `lookup` (spec 005, RF-8): cambio **aditivo**, sin retirar ni renombrar nada.
export const CONTRACT_VERSION = "1.1.0";

// Parámetro del enlace que identifica la invitación (RF-2). El `slug` de la boda es
// configuración del despliegue, nunca un parámetro del enlace.
export const GUEST_PARAM = "guest";

// Tipos de invitación (RF-5, D20): los declara `guest_type` en el maestro —**una boda, un
// tipo**— y los devuelve el servicio ya resueltos; la app **no** los deduce.
export const GUEST_TYPES = {
  PERSONAL: "personal",
  GENERIC: "generic",
  PUBLIC: "public",
};

// Maestro: una sola hoja y una fila por boda (§1.1). Se lee por el **nombre de la
// cabecera**, nunca por la posición de la columna (RF-4).
export const MASTER_SHEET = {
  name: "files",
  columns: {
    SLUG: "slug",
    IS_ACTIVE: "is_active",
    GUESTS_SHEET_ID: "guests_sheet_id",
    DEADLINE: "deadline",
    GUEST_TYPE: "guest_type",
    GENERIC_JSON_CACHE: "generic_json_cache",
  },
};

// Libro de invitados de **una** boda: hoja `guests` con las respuestas (§1.1).
export const GUEST_SHEET = {
  name: "guests",
  columns: {
    GUEST_ID: "guest_id",
    PHONE: "phone",
    GUEST_NAME: "guest_name",
    PARTNER_NAME: "partner_name",
    ADULTS_GUESTS: "adults_guests",
    ADULTS_ATTENDEES: "adults_attendees",
    CHILD_GUESTS: "child_guests",
    CHILD_ATTENDEES: "child_attendees",
    MESSAGE: "message",
    DIETARY_RESTRICTIONS: "dietary_restrictions",
    STATUS: "status",
    DATETIME: "datetime",
  },
};

// Libro de invitados: hoja `generic` con los códigos predefinidos (§1.1). Solo es
// obligatoria en las invitaciones genérica y pública (RF-4).
export const GENERIC_SHEET = {
  name: "generic",
  columns: {
    GENERIC_ID: "generic_id",
    LIMIT: "limit",
  },
};

// Estados de la respuesta (RF-10): los cuatro del libro, **todos reversibles** mientras el
// plazo esté abierto (no hay estado terminal) y se devuelven tal cual, sin traducir.
export const RESPONSE_STATES = {
  VIEWED: "viewed",
  CONFIRMED: "confirmed",
  UPDATED: "updated",
  REJECTED: "rejected",
};

// Estados que valen por «sin respuesta» (RF-10): `viewed`; un `status` vacío se trata
// igual y su fila queda **exenta** del cuadre de asistentes (D21).
export const NO_RESPONSE_STATES = [RESPONSE_STATES.VIEWED];

// Valor especial de `limit` (columna de la hoja `generic`): **sin tope** (RF-9, D12). Lo
// lleva el código reservado `PUBLIC`; la app no inventa un máximo.
export const NO_LIMIT = "n";

// Código reservado de la hoja `generic`: la invitación pública de la boda, la que se
// comparte con todos y no tiene tope (RF-5, RF-9).
export const PUBLIC_CODE = "PUBLIC";

// El teléfono se normaliza a **10 dígitos** y se guarda como **texto** (RF-8, D6, D23).
export const PHONE_DIGITS = 10;

// Tiempo de espera del contrato: si el servicio no responde en 10 s se da por **no
// disponible** (D25, RNF-4).
export const REQUEST_TIMEOUT_MS = 10000;

// Acciones del servicio (RF-14): resolver la invitación, registrar la respuesta y
// **consultar por teléfono** la respuesta de una fila (esta última, de la spec 005: RF-8).
export const SERVICE_ACTIONS = {
  RESOLVE: "resolve",
  RESPOND: "respond",
  LOOKUP: "lookup",
};

// Campos del cuerpo JSON que la app manda al servicio al **responder** (plan §7). El
// teléfono solo se manda en la genérica y la pública, donde es obligatorio (D26).
export const REQUEST_FIELDS = {
  ACTION: "action",
  SLUG: "slug",
  CODE: "code",
  NAME: "name",
  PHONE: "phone",
  ADULTS: "adults",
  CHILDREN: "children",
  MESSAGE: "message",
  RESTRICTIONS: "restrictions",
  RESPONSE: "response",
};

// Campos de la **respuesta resuelta** del servicio (plan §7, RF-6): la app no recibe
// filas, recibe el modelo ya resuelto (tipo y cupo incluidos).
export const RESOLVE_FIELDS = {
  OK: "ok",
  ACTION: "action",
  TYPE: "type",
  GUEST: "guest",
  NAME: "name",
  PARTNER: "partner",
  ADULTS_GUESTS: "adultsGuests",
  CHILD_GUESTS: "childGuests",
  PHONE: "phone",
  LIMIT: "limit",
  RESPONSE: "response",
  STATE: "state",
  ADULTS_ATTENDEES: "adultsAttendees",
  CHILD_ATTENDEES: "childAttendees",
  MESSAGE: "message",
  RESTRICTIONS: "restrictions",
  DATETIME: "datetime",
  DEADLINE: "deadline",
  CODE: "code",
};

// Campos del intercambio de la **consulta por teléfono** (spec 005, RF-8; D5, DT-2). La app
// solo la usa en la **genérica** y la **pública**, con el teléfono que aporta el invitado:
// devuelve el modelo ya resuelto de `resolve` —tipo, límite y plazo— más la respuesta previa
// de **esa** fila, con su **nombre registrado** dentro de `response` (es un dato de la
// respuesta, como `datetime`): **no** hay objeto `guest` ni viaja el teléfono en la respuesta.
// Los literales se declaran aquí para que el documento no pueda omitirlos.
export const LOOKUP_FIELDS = {
  // Petición: `{ action: "lookup", slug, code, phone }`, con el teléfono normalizado.
  ACTION: "action",
  SLUG: "slug",
  CODE: "code",
  PHONE: "phone",
  // Respuesta correcta: `{ ok: true, action: "lookup", type, limit, response, deadline }`.
  OK: "ok",
  TYPE: "type",
  LIMIT: "limit",
  RESPONSE: "response",
  DEADLINE: "deadline",
  // Respuesta de error: `{ ok: false, code }` (códigos existentes, ninguno nuevo).
  CODE: "code",
  // Dentro de `response`, cuando hay fila con respuesta.
  NAME: "name",
  STATE: "state",
  ADULTS_ATTENDEES: "adultsAttendees",
  CHILD_ATTENDEES: "childAttendees",
  MESSAGE: "message",
  RESTRICTIONS: "restrictions",
  DATETIME: "datetime",
};

// Tabla de códigos de error (§4.1). La app elige el aviso por `code` y muestra `message`
// como copy de interfaz en español (RNF-7). `retryable` dice si la causa tiene algo que
// **reintentar** (RF-12): las que dependen de la configuración, de la boda o del plazo no
// lo tienen. El «cuándo» y el «estado» del envío viven en `src/hooks/` (RNF-9).
export const SERVICE_ERRORS = [
  {
    code: "OK",
    message: "¡Gracias! Tu respuesta quedó registrada.",
    retryable: false,
  },
  {
    code: "MISSING_GUEST",
    message: "Este enlace no identifica ninguna invitación.",
    retryable: false,
  },
  {
    code: "MISSING_SLUG",
    message: "Esta invitación no está configurada.",
    retryable: false,
  },
  {
    code: "NOT_CONFIGURED",
    message: "La confirmación no está disponible en este momento.",
    retryable: false,
  },
  {
    code: "UNKNOWN_WEDDING",
    message: "No encontramos esta boda.",
    retryable: false,
  },
  {
    code: "INACTIVE_WEDDING",
    message: "Esta boda ya no está disponible.",
    retryable: false,
  },
  {
    code: "UNKNOWN_GUEST",
    message: "No encontramos esta invitación.",
    retryable: true,
  },
  {
    code: "GUEST_SHEET_UNAVAILABLE",
    message: "No pudimos abrir la lista de invitados.",
    retryable: true,
  },
  {
    code: "INVALID_DATA",
    message: "Los datos de esta invitación están incompletos.",
    retryable: true,
  },
  {
    code: "INVALID_RESPONSE",
    message: "No pudimos registrar tu respuesta con esos datos.",
    retryable: true,
  },
  {
    code: "SERVICE_UNAVAILABLE",
    message: "No pudimos conectar. Inténtalo de nuevo.",
    retryable: true,
  },
  {
    code: "DEADLINE_EXPIRED",
    message: "El plazo para confirmar ya terminó.",
    retryable: false,
  },
  {
    code: "OVER_LIMIT",
    message: "Superaste el número de lugares de tu invitación.",
    retryable: true,
  },
  {
    code: "MISSING_FIELDS",
    message: "Escribe tu nombre y tu teléfono para responder.",
    retryable: true,
  },
  {
    code: "INVALID_PHONE",
    message: "Revisa el teléfono: deben ser 10 dígitos.",
    retryable: true,
  },
];
