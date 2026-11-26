// ============================================================================
// Servicio de invitados y confirmación — contrato de la spec 004 (RF-17, D16, D27).
//
// Este archivo es el **servicio de registro**: una aplicación web de Google Apps Script
// (V8, sin dependencias) que lee el **maestro** (una fila por boda) y el **libro de
// invitados** de esa boda, y escribe la respuesta del invitado. Implementa el contrato
// que la app consume desde `src/constants/contract.js` (misma `CONTRACT_VERSION`): los
// nombres de hoja, de columna, los estados, los valores especiales y los códigos de
// error son los mismos literales.
//
// **El id del maestro sale de las propiedades del script** (`MASTER_SHEET_ID`): aquí no
// hay ningún id, ni teléfono, ni nombre, ni credencial. Los libros reales (con datos
// personales) viven fuera del repositorio y no se versionan (RNF-2, D16, D19).
//
// **Cómo llama la app:** `POST` con `Content-Type: text/plain;charset=utf-8` y el cuerpo
// en **JSON**. Ese tipo de contenido es lo que **evita el preflight** de CORS: una
// aplicación web de Apps Script no atiende el `OPTIONS` (D27, RF-17). Todas las
// respuestas son **JSON** y con HTTP **200**: el veredicto va siempre en `ok` y en
// `code`, nunca en el código HTTP.
//
// Estado de la entrega: cabecera, constantes, intercambio HTTP, utilidades, lectura del
// maestro y las **tres acciones** del contrato: `resolve` (resolver la invitación),
// `respond` (registrar la respuesta) y `lookup` (consultar por teléfono la respuesta
// previa de una fila, spec 005), con el plazo y el cupo hechos valer y la caché de
// códigos del maestro.
// ============================================================================

// ============================================================================
// Constantes del contrato (los literales no se traducen: son los del libro y los de la
// app; traducirlos rompería su mapeo). Si cambia la forma de una llamada o de una
// respuesta, esta versión se sube **a la vez** que en `src/constants/contract.js`.
// ============================================================================

// Versión del contrato (literales, hojas, columnas, acciones y códigos de error). No
// viaja en el enlace. La `1.1.0` añade la acción `lookup` (spec 005, RF-8) y la `1.2.0` el
// código `MALFORMED_GUEST` (spec 005, RF-16): ambas son cambios **aditivos**, sin retirar
// ni renombrar nada. La `1.3.0` (spec 004 §10, D34) cambia el **modelo de los libros** —la
// hoja `public` y la columna `public_json_cache` del maestro— y **no** cambia la forma de
// las llamadas.
const CONTRACT_VERSION = '1.4.0';

// Hojas de los libros: el maestro tiene una sola (`files`) y cada boda tiene su libro de
// invitados con **hasta tres** (`guests` para las respuestas, `generic` para los códigos
// genéricos y `public` para los códigos públicos).
const SHEET_NAMES = {
  MASTER: 'files',
  GUESTS: 'guests',
  GENERIC: 'generic',
  PUBLIC: 'public',
};

// Maestro (`files`): una fila por boda. Se lee por el **nombre de la cabecera**, nunca
// por la posición de la columna (RF-3, RF-4).
const MASTER_COLUMNS = {
  SLUG: 'slug',
  IS_ACTIVE: 'is_active',
  GUESTS_SHEET_ID: 'guests_sheet_id',
  DEADLINE: 'deadline',
  GUEST_TYPE: 'guest_type',
  GENERIC_JSON_CACHE: 'generic_json_cache',
  PUBLIC_JSON_CACHE: 'public_json_cache',
  LANGUAGE: 'language',
};

// Columnas **obligatorias** del maestro: sin cualquiera de estas cuatro no se puede
// resolver la boda. `deadline`, `generic_json_cache` y `public_json_cache` pueden faltar o
// estar vacías (RF-13, D32).
const MASTER_REQUIRED_COLUMNS = [
  MASTER_COLUMNS.SLUG,
  MASTER_COLUMNS.IS_ACTIVE,
  MASTER_COLUMNS.GUESTS_SHEET_ID,
  MASTER_COLUMNS.GUEST_TYPE,
];

// Libro de invitados, hoja `guests`: las respuestas de los invitados de esa boda.
const GUEST_COLUMNS = {
  GUEST_ID: 'guest_id',
  PHONE: 'phone',
  GUEST_NAME: 'guest_name',
  PARTNER_NAME: 'partner_name',
  ADULTS_GUESTS: 'adults_guests',
  ADULTS_ATTENDEES: 'adults_attendees',
  CHILD_GUESTS: 'child_guests',
  CHILD_ATTENDEES: 'child_attendees',
  MESSAGE: 'message',
  DIETARY_RESTRICTIONS: 'dietary_restrictions',
  STATUS: 'status',
  DATETIME: 'datetime',
};

// Libro de invitados, hoja `generic`: los códigos predefinidos y su límite.
const GENERIC_COLUMNS = {
  GENERIC_ID: 'generic_id',
  LIMIT: 'limit',
};

// Libro de invitados, hoja `public`: los códigos públicos y su límite. Sus cabeceras se
// declaran **aparte** de las de `generic` porque el código se llama `public_id` (RF-19).
const PUBLIC_COLUMNS = {
  PUBLIC_ID: 'public_id',
  LIMIT: 'limit',
};

// Las dos hojas de **códigos** del libro de invitados, cada una con su cabecera de código, su
// columna de `limit`, su **columna de caché** en el maestro y su **regla de `limit`** (D30,
// D31): la hoja `generic` solo admite un **entero mayor que cero** (el código reservado `PUBLIC`
// **sale** de ella) y la hoja `public` admite además el texto `n` —sin tope—.
const CODE_SHEETS = {
  GENERIC: {
    name: SHEET_NAMES.GENERIC,
    idColumn: GENERIC_COLUMNS.GENERIC_ID,
    limitColumn: GENERIC_COLUMNS.LIMIT,
    cacheColumn: MASTER_COLUMNS.GENERIC_JSON_CACHE,
    allowsNoLimit: false,
  },
  PUBLIC: {
    name: SHEET_NAMES.PUBLIC,
    idColumn: PUBLIC_COLUMNS.PUBLIC_ID,
    limitColumn: PUBLIC_COLUMNS.LIMIT,
    cacheColumn: MASTER_COLUMNS.PUBLIC_JSON_CACHE,
    allowsNoLimit: true,
  },
};

// Estados de la respuesta: una respuesta aceptada o declinada puede editarse sin crear
// un estado adicional; `viewed` representa que aún no hay respuesta.
const RESPONSE_STATES = {
  VIEWED: 'viewed',
  ACCEPTED: 'accepted',
  DECLINED: 'declined',
};

// Valor especial de `limit`: **sin tope** (RF-9, D12, D30). Lo lleva el código reservado
// `PUBLIC`, que vive en la hoja `public` (D31): la hoja `generic` **no** lo admite.
const NO_LIMIT = 'n';

// Código reservado de la hoja `public`: la invitación pública de la boda (RF-5, RF-19, D31).
// El servicio **no** lo trata de forma especial: es un `public_id` más, con su propio `limit`
// (el texto `n` es «sin tope»).
const PUBLIC_CODE = 'PUBLIC';

// Tipos de invitación: los declara `guest_type` en el maestro —**una boda, un tipo**— y el
// servicio los devuelve ya resueltos (RF-5, D3, D20).
const GUEST_TYPES = {
  PERSONAL: 'personal',
  GENERIC: 'generic',
  PUBLIC: 'public',
};

// Los tres valores admitidos de `guest_type`, para comprobarlo de una vez.
const GUEST_TYPE_VALUES = [GUEST_TYPES.PERSONAL, GUEST_TYPES.GENERIC, GUEST_TYPES.PUBLIC];

// Estados de la respuesta que valen por «sin respuesta» (RF-10): `viewed`; un `status`
// vacío se trata igual y su fila queda exenta del cuadre de asistentes (D21).
const NO_RESPONSE_STATES = ['viewed'];

// Los tres estados que admite la columna `status` (RF-10): cualquier otro valor no vacío
// es un dato incoherente y se falla de forma visible (RF-13).
const RESPONSE_STATE_VALUES = [
  RESPONSE_STATES.VIEWED,
  RESPONSE_STATES.ACCEPTED,
  RESPONSE_STATES.DECLINED,
];

// Acciones del servicio (RF-14): resolver la invitación, registrar la respuesta y
// **consultar por teléfono** la respuesta previa de una fila (la última, de la spec 005).
const SERVICE_ACTIONS = {
  RESOLVE: 'resolve',
  RESPOND: 'respond',
  LOOKUP: 'lookup',
};

// Acciones administrativas (spec 006: panel privado de respuestas). Independientes del contrato público.
const ADMIN_SERVICE_ACTIONS = {
  LOGIN: 'adminLogin',
  LIST_RESPONSES: 'listResponses',
  LIST_CODES: 'listCodes',
  REVEAL_PHONE: 'revealPhone',
};

// Contrato administrativo.
const ADMIN_CONTRACT_VERSION = '2.0.0';
const ADMIN_SESSION_TTL_SECONDS = 45 * 60;

// Errores administrativos (no reemplazan los del contrato público).
const ADMIN_ERROR_CODES = {
  OK: 'OK',
  NOT_CONFIGURED: 'NOT_CONFIGURED',
  UNKNOWN_WEDDING: 'UNKNOWN_WEDDING',
  INACTIVE_WEDDING: 'INACTIVE_WEDDING',
  GUEST_SHEET_UNAVAILABLE: 'GUEST_SHEET_UNAVAILABLE',
  INVALID_DATA: 'INVALID_DATA',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  INVALID_RESPONSE: 'INVALID_RESPONSE',
  INVALID_PASSWORD: 'INVALID_PASSWORD',
  INVALID_TOKEN: 'INVALID_TOKEN',
};

// Códigos de error del contrato (§4.1). La app elige el aviso por `code`; el servicio solo
// devuelve el literal, nunca un mensaje traducido.
const ERROR_CODES = {
  OK: 'OK',
  MISSING_GUEST: 'MISSING_GUEST',
  MISSING_SLUG: 'MISSING_SLUG',
  NOT_CONFIGURED: 'NOT_CONFIGURED',
  UNKNOWN_WEDDING: 'UNKNOWN_WEDDING',
  INACTIVE_WEDDING: 'INACTIVE_WEDDING',
  UNKNOWN_GUEST: 'UNKNOWN_GUEST',
  GUEST_SHEET_UNAVAILABLE: 'GUEST_SHEET_UNAVAILABLE',
  // El código **existe** pero su `limit` no cumple la regla de su tipo (RF-16, D21): antes se
  // confundía con `INVALID_DATA`, que queda reservado a lo que impide leer o escribir.
  MALFORMED_GUEST: 'MALFORMED_GUEST',
  INVALID_DATA: 'INVALID_DATA',
  INVALID_RESPONSE: 'INVALID_RESPONSE',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  DEADLINE_EXPIRED: 'DEADLINE_EXPIRED',
  OVER_LIMIT: 'OVER_LIMIT',
  MISSING_FIELDS: 'MISSING_FIELDS',
  INVALID_PHONE: 'INVALID_PHONE',
};

// El teléfono del invitado se normaliza a esta cantidad de dígitos (RF-8, D6, D23).
const PHONE_DIGITS = 10;

// Espera máxima por el bloqueo del script (`LockService`) antes de dar el envío por no
// disponible. **No es un valor del contrato**: es la espera interna del servicio, y es más
// corta que el tiempo de espera del contrato (10 s) para que la app reciba un veredicto
// antes de darse por vencida (D25).
const LOCK_WAIT_MS = 5000;

// ============================================================================
// Intercambio HTTP
// ============================================================================

// Salud del despliegue: confirma que el servicio responde y con qué versión del contrato.
// No toca ningún libro, así que también sirve para comprobar permisos de despliegue.
function doGet(e) {
  return response_({ ok: true, code: ERROR_CODES.OK, contract: CONTRACT_VERSION });
}

// Red de seguridad: el contrato evita el preflight (D27), pero si llega un `OPTIONS` se
// contesta vacío en vez de devolver la página de error de Apps Script.
function doOptions(e) {
  return ContentService.createTextOutput('');
}

// Entrada del contrato: cuerpo JSON con `action` (`resolve`, `respond` o `lookup`). Siempre
// se responde JSON (nunca HTML de error) porque la app espera interpretar `ok` y `code`.
function doPost(e) {
  let payload = null;
  try {
    payload = JSON.parse(e && e.postData && e.postData.contents ? e.postData.contents : '');
  } catch (error) {
    payload = null;
  }
  if (!payload || typeof payload !== 'object') {
    // El cuerpo no es JSON válido: no respeta el contrato, no hay nada que resolver ni que
    // registrar (RF-14).
    return response_({ ok: false, code: ERROR_CODES.INVALID_RESPONSE });
  }

  try {
    if (payload.action === SERVICE_ACTIONS.RESOLVE) return response_(resolveInvitation_(payload));
    if (payload.action === SERVICE_ACTIONS.RESPOND) return response_(registerResponse_(payload));
    if (payload.action === SERVICE_ACTIONS.LOOKUP) return response_(lookupResponse_(payload));
    if (payload.action === ADMIN_SERVICE_ACTIONS.LOGIN) return response_(loginAdmin_(payload));
    if (payload.action === ADMIN_SERVICE_ACTIONS.LIST_RESPONSES) {
      return response_(listResponsesAdmin_(payload));
    }
    if (payload.action === ADMIN_SERVICE_ACTIONS.LIST_CODES) {
      return response_(listCodesAdmin_(payload));
    }
    if (payload.action === ADMIN_SERVICE_ACTIONS.REVEAL_PHONE) {
      return response_(revealPhoneAdmin_(payload));
    }
    // Acción desconocida o ausente: el cuerpo no declara ninguna operación del contrato.
    return response_({ ok: false, code: ERROR_CODES.INVALID_RESPONSE });
  } catch (error) {
    // Última red: pase lo que pase, la app recibe JSON del contrato y no una página de
    // error de Apps Script (RF-14).
    console.error('doPost error: ' + (error && error.stack ? error.stack : error));
    const isAdminAction = [ADMIN_SERVICE_ACTIONS.LOGIN,
      ADMIN_SERVICE_ACTIONS.LIST_RESPONSES, ADMIN_SERVICE_ACTIONS.LIST_CODES,
      ADMIN_SERVICE_ACTIONS.REVEAL_PHONE].indexOf(payload.action) !== -1;
    return response_(isAdminAction
      ? { ok: false, code: ADMIN_ERROR_CODES.SERVICE_UNAVAILABLE, contract: ADMIN_CONTRACT_VERSION }
      : { ok: false, code: ERROR_CODES.SERVICE_UNAVAILABLE });
  }
}

// Respuesta del contrato: **siempre** JSON y **siempre** HTTP 200 (ContentService no fija
// el código de estado); el veredicto va en `ok` y en `code`.
function response_(body) {
  return ContentService.createTextOutput(JSON.stringify(body)).setMimeType(
    ContentService.MimeType.JSON
  );
}

// ---------------------------------------------------------------------------
// Acción `resolve`: resolver la invitación (RF-5, RF-6, RF-9, RF-18)
// ---------------------------------------------------------------------------

// Entra el cuerpo del `POST` (`{ action: "resolve", slug, code }`) y sale el **modelo ya
// resuelto** que consume la app —`{ ok, action, type, guest, limit, response, deadline }`—
// o `{ ok: false, code }`. El tipo lo declara el maestro (una boda, un tipo) y el servicio
// lo devuelve tal cual: la app **no** lo deduce del enlace ni de los datos (RF-5, D20).
function resolveInvitation_(payload) {
  // Sin `slug` no se sabe de qué boda es la invitación y sin código no hay a quién resolver
  // (RF-2, RF-12).
  const slug = text_(payload && payload.slug);
  if (slug === null) return { ok: false, code: ERROR_CODES.MISSING_SLUG };

  const code = normalizeCode_(payload && payload.code);
  if (code === null) return { ok: false, code: ERROR_CODES.MISSING_GUEST };

  const wedding = findWedding_(slug);
  if (!wedding.ok) return wedding;

  // El tipo manda sobre la hoja donde se busca el código (RF-4, RF-5). El código se compara
  // **normalizado** en los tres tipos (RF-2, D24).
  if (wedding.guestType === GUEST_TYPES.PERSONAL) return resolvePersonal_(wedding, code);
  return resolveCode_(wedding, code);
}

// Invitación **personalizada** (RF-5, RF-6): el código es un `guest_id` de la hoja `guests`
// y su fila está precargada con el titular, el acompañante y el cupo. El teléfono de la fila
// **no** se devuelve nunca: es un dato de la pareja y la app no lo necesita (RF-6, RNF-2).
function resolvePersonal_(wedding, code) {
  const book = openGuestBook_(wedding);
  if (!book.ok) return book;

  const sheet = book.book.getSheetByName(SHEET_NAMES.GUESTS);
  if (!sheet) return { ok: false, code: ERROR_CODES.INVALID_DATA };

  // Cabeceras que esta respuesta necesita (RF-4, RF-13): sin `guest_id` no hay fila que
  // localizar, sin `guest_name` no hay titular, sin `adults_guests` no hay cupo y sin
  // `status` no se sabe si el invitado ya contestó.
  const headerMap = readHeaderMap_(sheet);
  const requiredColumns = [
    GUEST_COLUMNS.GUEST_ID,
    GUEST_COLUMNS.GUEST_NAME,
    GUEST_COLUMNS.ADULTS_GUESTS,
    GUEST_COLUMNS.STATUS,
  ];
  for (let i = 0; i < requiredColumns.length; i += 1) {
    if (hasKey_(headerMap, requiredColumns[i])) continue;
    return { ok: false, code: ERROR_CODES.INVALID_DATA };
  }

  // La lectura del estado y la posible escritura de `viewed` tienen que compartir el mismo
  // bloqueo que la escritura de una respuesta: de lo contrario, un envío concurrente puede
  // quedar pisado por este resolver (RF-6, RF-10, D8).
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(LOCK_WAIT_MS);
  } catch (error) {
    return { ok: false, code: ERROR_CODES.SERVICE_UNAVAILABLE };
  }

  try {
  // El código se compara **normalizado** (RF-2, D24) y las filas sin `guest_id` no son filas
  // de invitado: se ignoran (RF-4).
  const rows = sheet.getDataRange().getValues();
  let row = null;
  let rowNumber = 0;
  for (let r = 1; r < rows.length; r += 1) {
    if (normalizeCode_(cellOf_(rows[r], headerMap, GUEST_COLUMNS.GUEST_ID)) !== code) continue;
    row = rows[r];
    rowNumber = r + 1; // la fila 1 de la hoja es la cabecera
    break;
  }
  if (row === null) return { ok: false, code: ERROR_CODES.UNKNOWN_GUEST };

  // Datos de la fila: se leen y se comprueban **antes** de escribir nada, para no dejar
  // `viewed` en una fila incoherente (RF-13). `child_guests` vacío vale por cero (RF-9);
  // `adults_guests` es obligatorio y ninguno de los dos puede ser negativo ni ilegible.
  const guestName = text_(cellOf_(row, headerMap, GUEST_COLUMNS.GUEST_NAME));
  const adultsGuests = parseCount_(cellOf_(row, headerMap, GUEST_COLUMNS.ADULTS_GUESTS));
  const childGuests = parseGuestCount_(cellOf_(row, headerMap, GUEST_COLUMNS.CHILD_GUESTS), true);
  const status = text_(cellOf_(row, headerMap, GUEST_COLUMNS.STATUS));
  if (guestName === null || adultsGuests === null || childGuests === null) {
    return { ok: false, code: ERROR_CODES.INVALID_DATA };
  }
  // Un `status` no vacío tiene que ser uno de los tres estados del libro (RF-10, RF-13);
  // el vacío y `viewed` valen por «sin respuesta» (RF-10, D8).
  if (status !== null && RESPONSE_STATE_VALUES.indexOf(status) === -1) {
    return { ok: false, code: ERROR_CODES.INVALID_DATA };
  }

  let response = null;
  if (status === null || NO_RESPONSE_STATES.indexOf(status) !== -1) {
    // La fila todavía **no tiene respuesta**: el servicio deja `viewed` en su `status` al
    // abrirla (RF-6, RF-10, D8) y no toca nada más. Una fila sin respuesta queda **exenta**
    // del cuadre de asistentes: sus celdas pueden estar vacías (D21). Si ya había respuesta
    // (`accepted` o `declined`) no se escribe nada: la rama de abajo solo lee.
    const statusColumn = headerMap[GUEST_COLUMNS.STATUS] + 1;
    sheet.getRange(rowNumber, statusColumn).setValue(RESPONSE_STATES.VIEWED);
  } else {
    // Respuesta previa, **tal cual** la trae el libro, para poder editarla (RF-6, RF-10). En
    // una fila con respuesta los asistentes tienen que ser enteros ≥ 0 (RF-13); un mensaje o
    // unas restricciones ausentes no invalidan nada (RF-13). Una celda vacía vale por cero
    // (D33, RF-20).
    const adultsAttendees = parseAttendees_(cellOf_(row, headerMap, GUEST_COLUMNS.ADULTS_ATTENDEES));
    const childAttendees = parseAttendees_(cellOf_(row, headerMap, GUEST_COLUMNS.CHILD_ATTENDEES));
    if (adultsAttendees === null || childAttendees === null) {
      return { ok: false, code: ERROR_CODES.INVALID_DATA };
    }
    response = {
      state: status,
      adultsAttendees: adultsAttendees,
      childAttendees: childAttendees,
      message: text_(cellOf_(row, headerMap, GUEST_COLUMNS.MESSAGE)),
      restrictions: text_(cellOf_(row, headerMap, GUEST_COLUMNS.DIETARY_RESTRICTIONS)),
      datetime: responseInstant_(
        cellOf_(row, headerMap, GUEST_COLUMNS.DATETIME),
        book.timeZone
      ),
    };
  }

  return {
    ok: true,
    action: SERVICE_ACTIONS.RESOLVE,
    type: GUEST_TYPES.PERSONAL,
    guest: {
      name: guestName,
      partner: text_(cellOf_(row, headerMap, GUEST_COLUMNS.PARTNER_NAME)),
      adultsGuests: adultsGuests,
      childGuests: childGuests,
    },
    limit: null,
    response: response,
    deadline: wedding.deadline,
  };
  } finally {
    try {
      SpreadsheetApp.flush();
    } finally {
      lock.releaseLock();
    }
  }
}

// Invitación **genérica** o **pública** (RF-5, RF-6, RF-9, RF-18, RF-19): el código se
// resuelve **por tipo** con la hoja que le toca; en la genérica puede caer en `public` si
// el código no está en `generic` (D29). Estas invitaciones no precargan ningún dato del
// invitado: al resolver todavía no hay teléfono, así que **no** devuelven ninguna respuesta
// previa; la de **esa** fila la consulta `lookup` con el teléfono que el invitado aporta en
// la página (spec 005, RF-8).
function resolveCode_(wedding, code) {
  const sheets = codeSheetsForType_(wedding.guestType);
  let lastMissingSheet = null;

  for (let s = 0; s < sheets.length; s += 1) {
    // Cada entrada combina la definición de la hoja (`def`) con si es obligatoria;
    // las funciones de lectura/validación reciben la definición interna, no el envoltorio.
    const sheetEntry = sheets[s];
    const sheetDef = sheetEntry.def;

    // Caché del maestro para **esta** hoja (D32): mientras traiga el código con un `limit`
    // válido para esa hoja, se resuelve sin abrir el libro.
    const cached = readCodeCache_(wedding[cacheFieldForSheet_(sheetDef.name)]);
    if (cached !== null && hasKey_(cached, code)) {
      const limit = validateCodeLimit_(cached[code], sheetDef);
      if (limit.ok) {
        return resolvedCodeResult_(wedding, limit.limit);
      }
      // La caché trae el código pero su `limit` no cumple la regla de esa hoja (p. ej. se
      // movió de `generic` a `public`): la hoja es la fuente y manda.
    }

    const read = readCodeLimits_(wedding, sheetEntry);
    if (!read.ok) {
      if (read.sheetMissing) {
        if (sheetEntry.required) {
          return { ok: false, code: ERROR_CODES.INVALID_DATA };
        }
        lastMissingSheet = sheetDef.name;
        continue;
      }
      return read;
    }
    if (read.cacheChanged) {
      writeCodeCache_(wedding.slug, sheetDef, read.limits);
    }
    if (!hasKey_(read.limits, code)) {
      continue;
    }
    const limit = validateCodeLimit_(read.limits[code], sheetDef);
    if (!limit.ok) {
      return { ok: false, code: limit.code };
    }
    return resolvedCodeResult_(wedding, limit.limit);
  }

  if (lastMissingSheet !== null) {
    // Se agotaron las hojas opcionales sin encontrar el código; si la única obligatoria
    // faltaba ya se habría devuelto `INVALID_DATA` arriba.
  }
  return { ok: false, code: ERROR_CODES.UNKNOWN_GUEST };
}

function codeSheetsForType_(guestType) {
  if (guestType === GUEST_TYPES.PUBLIC) {
    return [{ def: CODE_SHEETS.PUBLIC, required: true }];
  }
  if (guestType === GUEST_TYPES.GENERIC) {
    return [
      { def: CODE_SHEETS.GENERIC, required: true },
      { def: CODE_SHEETS.PUBLIC, required: false },
    ];
  }
  return [];
}

function cacheFieldForSheet_(sheetName) {
  if (sheetName === SHEET_NAMES.PUBLIC) return 'publicCache';
  return 'cache';
}

function validateCodeLimit_(limit, sheetDef) {
  const textLimit = text_(limit);
  if (textLimit === NO_LIMIT) {
    if (sheetDef.allowsNoLimit) {
      return { ok: true, limit: NO_LIMIT };
    }
    return { ok: false, code: ERROR_CODES.MALFORMED_GUEST };
  }
  const parsed = parseCount_(limit);
  if (parsed === null || parsed <= 0) {
    return { ok: false, code: ERROR_CODES.MALFORMED_GUEST };
  }
  return { ok: true, limit: parsed };
}

function resolvedCodeResult_(wedding, limit) {
  return {
    ok: true,
    action: SERVICE_ACTIONS.RESOLVE,
    type: wedding.guestType,
    // Ni nombre ni cupo: los escribe el invitado al contestar (RF-5, RF-6). El teléfono no
    // se devuelve nunca (RNF-2).
    guest: { name: null, partner: null, adultsGuests: null, childGuests: null },
    limit: limit,
    response: null,
    deadline: wedding.deadline,
  };
}

// Abre el **libro de invitados** de esa boda por el id que declara el maestro y devuelve
// `{ ok: true, book, timeZone }` (la zona del libro es la de sus fechas) o el error del
// contrato: un id vacío, un libro que no existe o un libro que el servicio no puede abrir
// son `GUEST_SHEET_UNAVAILABLE` (RF-3, RF-12).
function openGuestBook_(wedding) {
  if (wedding.guestsSheetId === null) {
    return { ok: false, code: ERROR_CODES.GUEST_SHEET_UNAVAILABLE };
  }
  try {
    const book = SpreadsheetApp.openById(wedding.guestsSheetId);
    return { ok: true, book: book, timeZone: book.getSpreadsheetTimeZone() };
  } catch (error) {
    // El libro no existe o el servicio no tiene permiso para abrirlo (RF-3).
    return { ok: false, code: ERROR_CODES.GUEST_SHEET_UNAVAILABLE };
  }
}

// Lee la hoja de códigos de una boda (RF-4, RF-18, RF-19) y devuelve
// `{ ok: true, limits }` con el mapa `código normalizado → límite` **tal cual lo trae la
// hoja**, que es la fuente de la caché. La hoja `guests` sigue siendo obligatoria aquí
// (RF-4): un libro al que le falta no es el libro de invitados de esa boda. Si la hoja no
// existe, devuelve `{ ok: false, code: INVALID_DATA, sheetMissing: true }` cuando es obligatoria
// o lo indica para que `resolveCode_` lo distinga (D29).
function readCodeLimits_(wedding, sheetEntry) {
  const sheetDef = sheetEntry.def;
  const book = openGuestBook_(wedding);
  if (!book.ok) return book;

  if (!book.book.getSheetByName(SHEET_NAMES.GUESTS)) {
    return { ok: false, code: ERROR_CODES.INVALID_DATA };
  }

  const sheet = book.book.getSheetByName(sheetDef.name);
  if (!sheet) {
    if (sheetEntry.required) {
      return { ok: false, code: ERROR_CODES.INVALID_DATA };
    }
    return { ok: false, code: ERROR_CODES.INVALID_DATA, sheetMissing: true };
  }

  const headerMap = readHeaderMap_(sheet);
  if (
    !hasKey_(headerMap, sheetDef.idColumn) ||
    !hasKey_(headerMap, sheetDef.limitColumn)
  ) {
    return { ok: false, code: ERROR_CODES.INVALID_DATA };
  }

  // Las filas sin el id de código no son filas de código y se ignoran (RF-4). El límite se
  // guarda como **texto** (`"n"`, `"3"`), que es lo que la caché guarda y lo que el propio
  // `parseCount_` vuelve a interpretar al resolver.
  const rows = sheet.getDataRange().getValues();
  const limits = Object.create(null);
  for (let r = 1; r < rows.length; r += 1) {
    const codeId = normalizeCode_(cellOf_(rows[r], headerMap, sheetDef.idColumn));
    if (codeId === null) continue;
    limits[codeId] = text_(cellOf_(rows[r], headerMap, sheetDef.limitColumn));
  }
  return { ok: true, limits: limits, cacheChanged: true };
}

// Caché del maestro (`generic_json_cache` / `public_json_cache`) leída como mapa
// `código → límite` con las claves **normalizadas** para comparar (RF-2, RF-18). Devuelve
// `null` si la celda está vacía, no es JSON o no es un objeto: quien la use entonces lee la
// hoja correspondiente, que es la fuente (D13, D32). Un mapa sin entradas tampoco resuelve
// ningún código.
function readCodeCache_(value) {
  const raw = text_(value);
  if (raw === null) return null;

  let parsed = null;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    return null;
  }
  if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) return null;

  const keys = Object.keys(parsed);
  if (keys.length === 0) return null;

  const cache = Object.create(null);
  for (let i = 0; i < keys.length; i += 1) {
    const key = normalizeCode_(keys[i]);
    if (key === null) continue;
    cache[key] = parsed[keys[i]];
  }
  return cache;
}

function readGenericCache_(value) {
  return readCodeCache_(value);
}

// Escribe en el maestro la **copia** de los códigos que se acaban de leer de la hoja de
// códigos (RF-18, D13, D32). Solo se llama desde `resolveCode_` y solo cuando la caché estaba
// vacía, era ilegible o no traía el código pedido.
function writeCodeCache_(slug, sheetDef, limits) {
  const master = readMaster_();
  if (!master.ok) return;
  // La columna puede **faltar** en el maestro (las cachés no son obligatorias, §1.1): sin
  // ella no hay dónde guardar la copia y la invitación se resuelve con lo leído.
  if (!hasKey_(master.headerMap, sheetDef.cacheColumn)) return;

  for (let r = 0; r < master.rows.length; r += 1) {
    if (text_(cellOf_(master.rows[r], master.headerMap, MASTER_COLUMNS.SLUG)) !== slug) continue;
    const column = master.headerMap[sheetDef.cacheColumn] + 1;
    try {
      master.sheet.getRange(r + 2, column).setValue(JSON.stringify(limits));
    } catch (error) {
      // La caché es una **copia**: si el servicio no puede escribirla (hoja protegida, sin
      // permiso), la invitación se resuelve igual con lo que se acaba de leer de la hoja.
    }
    return;
  }
}

function writeGenericCache_(slug, limits) {
  writeCodeCache_(slug, CODE_SHEETS.GENERIC, limits);
}

// Momento de la última respuesta (la celda `datetime` de la fila) como texto ISO 8601 en la
// **zona del libro de invitados**, o `null` si la celda está vacía o no es interpretable.
// Un número suelto no es una fecha sin adivinar su época (misma regla que el plazo, RF-11).
function responseInstant_(value, timeZone) {
  if (!(value instanceof Date) && typeof value !== 'string') return null;
  return instantText_(value, timeZone);
}

// ---------------------------------------------------------------------------
// Acción `lookup`: consultar por teléfono la respuesta de una fila (spec 005, RF-5, RF-8)
// ---------------------------------------------------------------------------

// Entra el cuerpo del `POST` (`{ action: "lookup", slug, code, phone }`) y sale el modelo ya
// resuelto de `resolve` —`{ ok, action, type, limit, response, deadline }`— o
// `{ ok: false, code }`. La consulta es la que reconoce al invitado que **vuelve** a una
// invitación genérica o pública: con el teléfono que él mismo aporta, devuelve la respuesta
// previa de **esa** fila —o `null` si no hay fila o no tiene respuesta— para poder
// mostrarla y editarla (RF-5, RF-6).
//
// **Solo lee el libro de invitados:** no escribe ninguna celda de la hoja `guests` (el
// `viewed` sigue siendo **solo** de la invitación personalizada, RF-10) y no crea ni
// actualiza filas; del libro solo puede refrescar la **caché** del maestro al resolver el
// código, igual que la lectura normal (spec 005, D14). El teléfono **no** se devuelve en la
// respuesta (la app ya lo tiene en la página), aunque la petición sí lo mande (RF-6).
function lookupResponse_(payload) {
  // Sin `slug` no se sabe de qué boda es la invitación y sin código no hay hoja donde
  // consultar (RF-2, RF-12).
  const slug = text_(payload && payload.slug);
  if (slug === null) return { ok: false, code: ERROR_CODES.MISSING_SLUG };

  const code = normalizeCode_(payload && payload.code);
  if (code === null) return { ok: false, code: ERROR_CODES.MISSING_GUEST };

  const wedding = findWedding_(slug);
  if (!wedding.ok) return wedding;

  // La consulta **no aplica** a una boda personalizada: esa invitación identifica al invitado
  // por su código y su respuesta previa viene en `resolve` sin escribir nada más (RF-6). Un
  // cuerpo de `lookup` en esa boda no encaja en su contrato (RF-8).
  if (wedding.guestType === GUEST_TYPES.PERSONAL) {
    return { ok: false, code: ERROR_CODES.INVALID_RESPONSE };
  }

  // El teléfono es la **llave** de la consulta (RF-8, D6, D23): sin él, campos que faltan; si
  // no llega a diez dígitos —o trae lada de país—, teléfono inválido. Se comprueba antes de
  // resolver el código para que un teléfono mal escrito no acabe en un veredicto de código.
  const phone = phoneDigits_(payload && payload.phone);
  if (phone === '') return { ok: false, code: ERROR_CODES.MISSING_FIELDS };
  if (phone.length !== PHONE_DIGITS) return { ok: false, code: ERROR_CODES.INVALID_PHONE };

  // El límite del código sale del **mismo** camino que en `resolve` (RF-18, D23): la caché del
  // maestro y, si no lo trae, la hoja `generic`. Sus errores (`UNKNOWN_GUEST`, `INVALID_DATA`)
  // se devuelven tal cual. **No** se pasa por el camino de la personalizada, que es el único
  // que escribe `viewed` (spec 005, D14; DT-10).
  const resolved = resolveCode_(wedding, code);
  if (!resolved.ok) return resolved;

  const book = openGuestBook_(wedding);
  if (!book.ok) return book;

  const sheet = book.book.getSheetByName(SHEET_NAMES.GUESTS);
  if (!sheet) return { ok: false, code: ERROR_CODES.INVALID_DATA };

  // Cabeceras que esta consulta **necesita** (RF-15, R13): solo `phone`, que es la llave de
  // la fila. Las demás que lee son **toleradas**: `guest_name` es el nombre registrado, que
  // es opcional (como el `message`) porque el teléfono ya llega en la petición, y la
  // ausencia de `status` vale por **primera respuesta**: los lee `cellOf_`, que devuelve
  // vacío si la columna no está declarada. `phone` sigue siendo obligatoria: sin ella no hay
  // fila que localizar y el fallo es **real** (RF-13), no una cabecera que no hacía falta.
  const headerMap = readHeaderMap_(sheet);
  if (firstMissingColumn_(headerMap, [GUEST_COLUMNS.PHONE]) !== null) {
    return { ok: false, code: ERROR_CODES.INVALID_DATA };
  }

  // La fila se busca por el teléfono **normalizado a dígitos** dentro de **este** libro: la
  // primera que coincide es la de ese invitado (RF-8, D5). Sin fila no hay respuesta previa:
  // eso **no** es un error, es la primera respuesta del invitado (`response: null`).
  const rows = sheet.getDataRange().getValues();
  let row = null;
  for (let r = 1; r < rows.length; r += 1) {
    if (phoneDigits_(cellOf_(rows[r], headerMap, GUEST_COLUMNS.PHONE)) !== phone) continue;
    row = rows[r];
    break;
  }

  let response = null;
  if (row !== null) {
    // Un `status` no vacío tiene que ser uno de los tres estados del libro (RF-10, RF-13);
    // el vacío y `viewed` valen por «sin respuesta» (RF-10, D8) y se tratan como primera
    // respuesta.
    const status = text_(cellOf_(row, headerMap, GUEST_COLUMNS.STATUS));
    if (status !== null && RESPONSE_STATE_VALUES.indexOf(status) === -1) {
      return { ok: false, code: ERROR_CODES.INVALID_DATA };
    }
    if (status !== null && NO_RESPONSE_STATES.indexOf(status) === -1) {
      // Respuesta previa, **tal cual** la trae el libro y con el **nombre registrado**
      // (`guest_name`) dentro de `response` —es un dato de la respuesta, como `datetime`—:
      // es lo único que la consulta añade al modelo de `resolve` (RF-8, DT-2). Los
      // asistentes de una fila con respuesta son enteros ≥ 0 (RF-13); un mensaje o unas
      // restricciones ausentes no invalidan nada y la respuesta **no** lleva el teléfono.
      const adultsAttendees = parseAttendees_(
        cellOf_(row, headerMap, GUEST_COLUMNS.ADULTS_ATTENDEES)
      );
      const childAttendees = parseAttendees_(cellOf_(row, headerMap, GUEST_COLUMNS.CHILD_ATTENDEES));
      if (adultsAttendees === null || childAttendees === null) {
        return { ok: false, code: ERROR_CODES.INVALID_DATA };
      }
      response = {
        name: text_(cellOf_(row, headerMap, GUEST_COLUMNS.GUEST_NAME)),
        state: status,
        adultsAttendees: adultsAttendees,
        childAttendees: childAttendees,
        message: text_(cellOf_(row, headerMap, GUEST_COLUMNS.MESSAGE)),
        restrictions: text_(cellOf_(row, headerMap, GUEST_COLUMNS.DIETARY_RESTRICTIONS)),
        datetime: responseInstant_(
          cellOf_(row, headerMap, GUEST_COLUMNS.DATETIME),
          book.timeZone
        ),
      };
    }
  }

  return {
    ok: true,
    action: SERVICE_ACTIONS.LOOKUP,
    type: wedding.guestType,
    limit: resolved.limit,
    response: response,
    deadline: resolved.deadline,
  };
}

// ---------------------------------------------------------------------------
// Acción `respond`: registrar la respuesta (RF-7, RF-8, RF-9, RF-10, RF-11)
// ---------------------------------------------------------------------------

// Entra el cuerpo del `POST` (`{ action: "respond", slug, code, response, … }`) y sale
// `{ ok: true, code: "OK" }` o `{ ok: false, code }`. El servicio es la **autoridad** sobre
// la respuesta: hace valer el plazo del maestro y el cupo, decide el estado (`accepted` o
// `declined`) y escribe en el libro de invitados de esa boda (RF-14). El tipo lo
// declara el maestro (una boda, un tipo) y el camino de escritura es distinto en cada uno.
function registerResponse_(payload) {
  // Sin `slug` no se sabe de qué boda es el libro y sin código no hay a quién contestar
  // (RF-2, RF-12).
  const slug = text_(payload && payload.slug);
  if (slug === null) return { ok: false, code: ERROR_CODES.MISSING_SLUG };

  const code = normalizeCode_(payload && payload.code);
  if (code === null) return { ok: false, code: ERROR_CODES.MISSING_GUEST };

  // El invitado solo puede **confirmar** o **rechazar** (RF-10, D26): cualquier otro valor es
  // una respuesta que el contrato no admite (RF-14).
  const response = text_(payload && payload.response);
  if (response !== RESPONSE_STATES.ACCEPTED && response !== RESPONSE_STATES.DECLINED) {
    return { ok: false, code: ERROR_CODES.INVALID_RESPONSE };
  }

  const wedding = findWedding_(slug);
  if (!wedding.ok) return wedding;

  // El libro de invitados se abre **antes** de resolver el código: sin libro no hay dónde
  // escribir y el motivo visible es el mismo que en `resolve` (RF-3, RF-12).
  const book = openGuestBook_(wedding);
  if (!book.ok) return book;

  // El momento del registro es **uno**: con él se hace valer el plazo y se sella `datetime`
  // (RF-7, RF-11, D28).
  const now = new Date();
  if (deadlinePassed_(wedding.deadline, now)) {
    return { ok: false, code: ERROR_CODES.DEADLINE_EXPIRED };
  }

  // La lectura de la fila y la escritura de la respuesta van juntas y **dentro del bloqueo
  // del script**: dos altas simultáneas no pueden calcular el mismo `guest_id` ni pisarse la
  // respuesta (RF-8, D11). Si el bloqueo no se consigue, el envío se rechaza como servicio no
  // disponible —un fallo del que la app puede recuperarse— y **no** se escribe nada.
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(LOCK_WAIT_MS);
  } catch (error) {
    return { ok: false, code: ERROR_CODES.SERVICE_UNAVAILABLE };
  }
  try {
    if (wedding.guestType === GUEST_TYPES.PERSONAL) {
      return registerPersonalResponse_(book, code, payload, response, now);
    }
    return registerCodeResponse_(wedding, book, code, payload, response, now);
  } finally {
    try {
      SpreadsheetApp.flush();
    } finally {
      lock.releaseLock();
    }
  }
}

// Respuesta de una invitación **personalizada** (RF-7, RF-9, RF-10): se escribe **solo** en
// la fila precargada de ese `guest_id` —la identidad y el cupo se quedan como están— y
// **nunca** se crea una fila nueva.
function registerPersonalResponse_(book, code, payload, response, now) {
  const sheet = book.book.getSheetByName(SHEET_NAMES.GUESTS);
  if (!sheet) return { ok: false, code: ERROR_CODES.INVALID_DATA };

  // Columnas que esta escritura necesita (RF-4, RF-13): sin `guest_id` no hay fila que
  // localizar, sin el cupo no se puede acotar, sin los asistentes no hay dónde dejar lo que
  // asiste, sin `status` no se sabe si es la primera respuesta y sin `datetime` no queda
  // constancia del registro. `message` y `dietary_restrictions` también: la respuesta las
  // escribe, y una cabecera que la respuesta necesita no puede faltar (RF-7).
  const headerMap = readHeaderMap_(sheet);
  if (
    firstMissingColumn_(headerMap, [
      GUEST_COLUMNS.GUEST_ID,
      GUEST_COLUMNS.ADULTS_GUESTS,
      GUEST_COLUMNS.ADULTS_ATTENDEES,
      GUEST_COLUMNS.CHILD_ATTENDEES,
      GUEST_COLUMNS.MESSAGE,
      GUEST_COLUMNS.DIETARY_RESTRICTIONS,
      GUEST_COLUMNS.STATUS,
      GUEST_COLUMNS.DATETIME,
    ]) !== null
  ) {
    return { ok: false, code: ERROR_CODES.INVALID_DATA };
  }

  // El código se compara **normalizado** (RF-2, D24) y las filas sin `guest_id` no son filas
  // de invitado: se ignoran (RF-4). Un código sin fila no identifica a nadie (RF-12).
  const rows = sheet.getDataRange().getValues();
  let row = null;
  let rowNumber = 0;
  for (let r = 1; r < rows.length; r += 1) {
    if (normalizeCode_(cellOf_(rows[r], headerMap, GUEST_COLUMNS.GUEST_ID)) !== code) continue;
    row = rows[r];
    rowNumber = r + 1; // la fila 1 de la hoja es la cabecera
    break;
  }
  if (row === null) return { ok: false, code: ERROR_CODES.UNKNOWN_GUEST };

  // La fila se comprueba **antes** de escribir nada, para no dejar una respuesta en una fila
  // incoherente (RF-13): un `status` no vacío tiene que ser uno de los tres estados del
  // libro y los cupos, enteros ≥ 0 (un `child_guests` vacío vale por cero, RF-9).
  const status = text_(cellOf_(row, headerMap, GUEST_COLUMNS.STATUS));
  if (status !== null && RESPONSE_STATE_VALUES.indexOf(status) === -1) {
    return { ok: false, code: ERROR_CODES.INVALID_DATA };
  }
  const adultsGuests = parseCount_(cellOf_(row, headerMap, GUEST_COLUMNS.ADULTS_GUESTS));
  const childGuests = parseGuestCount_(cellOf_(row, headerMap, GUEST_COLUMNS.CHILD_GUESTS), true);
  if (adultsGuests === null || childGuests === null) {
    return { ok: false, code: ERROR_CODES.INVALID_DATA };
  }

  // Una fila con `status` vacío o `viewed` **no tiene respuesta** todavía: lo que llega es la
  // primera y deja `accepted`; una edición conserva el mismo estado (RF-10).

  let adultsAttendees = 0;
  let childAttendees = 0;
  let state = RESPONSE_STATES.DECLINED;
  if (response === RESPONSE_STATES.ACCEPTED) {
    const adults = parseCount_(payload && payload.adults);
    const children = parseCount_(payload && payload.children);
    // Los asistentes tienen que ser enteros ≥ 0 (RF-13) y no pueden superar el cupo de **su**
    // fila (RF-9). Confirmar sin ningún asistente no confirma a nadie: con cupo cero el único
    // camino válido es `declined` (D21).
    if (adults === null || children === null) {
      return { ok: false, code: ERROR_CODES.INVALID_RESPONSE };
    }
    if (adults > adultsGuests || children > childGuests) {
      return { ok: false, code: ERROR_CODES.OVER_LIMIT };
    }
    if (adults + children === 0) return { ok: false, code: ERROR_CODES.OVER_LIMIT };
    adultsAttendees = adults;
    childAttendees = children;
    state = RESPONSE_STATES.ACCEPTED;
  }
  // Al **declinar** se escriben los asistentes en cero y el estado es `declined` aunque ya
  // hubiera una respuesta: un rechazo no es la edición de una confirmación (RF-10).

  const message = text_(payload && payload.message);
  const restrictions = text_(payload && payload.restrictions);
  const values = {};
  values[GUEST_COLUMNS.ADULTS_ATTENDEES] = adultsAttendees;
  values[GUEST_COLUMNS.CHILD_ATTENDEES] = childAttendees;
  values[GUEST_COLUMNS.MESSAGE] = message === null ? '' : message;
  values[GUEST_COLUMNS.DIETARY_RESTRICTIONS] = restrictions === null ? '' : restrictions;
  values[GUEST_COLUMNS.STATUS] = state;
  values[GUEST_COLUMNS.DATETIME] = nowText_(now, book.timeZone);
  writeResponse_(sheet, rowNumber, headerMap, values);

  return { ok: true, code: ERROR_CODES.OK };
}

// Respuesta de una invitación **genérica** o **pública** (RF-8, RF-9, D5, D6, D7, D11, D26):
// el **teléfono** —normalizado a 10 dígitos y guardado como texto— es la llave **dentro del
// libro de esa boda**. Si ya hay una fila con ese teléfono se **actualiza** y, si no, se
// **añade** una al final con el `guest_id` entero autoincremental. El código del enlace **no
// se registra** en ninguna columna: su límite vive en `adults_guests` (D7).
function registerCodeResponse_(wedding, book, code, payload, response, now) {
  const sheet = book.book.getSheetByName(SHEET_NAMES.GUESTS);
  if (!sheet) return { ok: false, code: ERROR_CODES.INVALID_DATA };

  // Columnas que esta escritura necesita (RF-4, RF-13): `guest_id` (de él sale el
  // autoincremental de las filas nuevas), las dos mitades de la llave (`phone`), el nombre
  // de quien responde, el cupo que se escribe (`adults_guests`), lo que asiste, los cupos y
  // asistentes de niños que se dejan **vacíos**, el mensaje, las restricciones, el estado y
  // el momento del registro: la respuesta escribe todas y ninguna puede faltar (RF-8).
  const headerMap = readHeaderMap_(sheet);
  if (
    firstMissingColumn_(headerMap, [
      GUEST_COLUMNS.GUEST_ID,
      GUEST_COLUMNS.PHONE,
      GUEST_COLUMNS.GUEST_NAME,
      GUEST_COLUMNS.ADULTS_GUESTS,
      GUEST_COLUMNS.ADULTS_ATTENDEES,
      GUEST_COLUMNS.CHILD_GUESTS,
      GUEST_COLUMNS.CHILD_ATTENDEES,
      GUEST_COLUMNS.MESSAGE,
      GUEST_COLUMNS.DIETARY_RESTRICTIONS,
      GUEST_COLUMNS.STATUS,
      GUEST_COLUMNS.DATETIME,
    ]) !== null
  ) {
    return { ok: false, code: ERROR_CODES.INVALID_DATA };
  }

  // El código se resuelve **igual que al leer** la invitación: con la caché del maestro y, si
  // esta no lo trae, con la hoja correspondiente (`generic` o, en una boda genérica, `public`
  // si no está en `generic`) (RF-18, RF-19, D23, D29). De ahí sale el **cupo** de esta
  // respuesta: un entero mayor que cero en la genérica y `"n"` —sin tope— en la pública o
  // en un código `public` de una boda genérica (RF-9, D21, D30). El código no cuadra con el
  // tipo o el límite es ilegible → dato incoherente.
  const resolved = resolveCode_(wedding, code);
  if (!resolved.ok) return resolved;
  const limit = resolved.limit;
  // La genérica y la pública identifican por **teléfono**, así que exigen nombre y teléfono
  // **también al rechazar**: el rechazo necesita los mismos datos que la confirmación
  // (RF-8, D26).
  const guestName = text_(payload && payload.name);
  if (guestName === null) return { ok: false, code: ERROR_CODES.MISSING_FIELDS };
  const phone = phoneDigits_(payload && payload.phone);
  if (phone === '') return { ok: false, code: ERROR_CODES.MISSING_FIELDS };
  // El teléfono es la llave: si no llega a 10 dígitos —o trae lada de país— se rechaza **sin
  // crear ni actualizar ninguna fila** (RF-8, D23).
  if (phone.length !== PHONE_DIGITS) return { ok: false, code: ERROR_CODES.INVALID_PHONE };

  // Estos tipos solo cuentan **adultos** (D12) y la cifra tiene que ser un entero ≥ 0: si el
  // cuerpo trae otra cosa, la respuesta es inválida, nunca un cupo adivinado (RF-13, RF-14).
  let adultsAttendees = 0;
  if (response === RESPONSE_STATES.ACCEPTED) {
    const adults = parseCount_(payload && payload.adults);
    if (adults === null) return { ok: false, code: ERROR_CODES.INVALID_RESPONSE };
    // El cupo es el del código de **este** envío y `PUBLIC` (`"n"`) no tiene tope (RF-9).
    if (limit !== NO_LIMIT && adults > limit) return { ok: false, code: ERROR_CODES.OVER_LIMIT };
    // Confirmar sin ningún asistente no confirma a nadie: el único envío válido con cero
    // asistentes es el rechazo (D21).
    if (adults === 0) return { ok: false, code: ERROR_CODES.OVER_LIMIT };
    adultsAttendees = adults;
  }

  const rows = sheet.getDataRange().getValues();
  let row = null;
  let rowNumber = 0;
  let lastGuestId = 0;
  for (let r = 1; r < rows.length; r += 1) {
    // El autoincremental mira **solo** los `guest_id` que son enteros: los que son texto son
    // de las invitaciones personalizadas —que no llevan ids numéricos— y se ignoran (RF-8).
    const candidate = cellOf_(rows[r], headerMap, GUEST_COLUMNS.GUEST_ID);
    if (typeof candidate === 'number' && Number.isInteger(candidate) && candidate > lastGuestId) {
      lastGuestId = candidate;
    }
    // La llave es el teléfono **dentro de este libro**, comparado normalizado a dígitos: la
    // primera fila que coincide es la que se actualiza (RF-8, D5).
    if (rowNumber === 0 && phoneDigits_(cellOf_(rows[r], headerMap, GUEST_COLUMNS.PHONE)) === phone) {
      row = rows[r];
      rowNumber = r + 1; // la fila 1 de la hoja es la cabecera
    }
  }

  // La fila de ese teléfono se comprueba **antes** de escribir nada (RF-13): un `status` no
  // vacío que no sea uno de los tres estados del libro es un dato incoherente. Con la fila
  // delante se decide el estado (RF-10): una aceptación o declinación reemplaza la respuesta
  // anterior sin crear un estado adicional; al declinar el estado es `declined`.
  const status = row === null ? null : text_(cellOf_(row, headerMap, GUEST_COLUMNS.STATUS));
  if (status !== null && RESPONSE_STATE_VALUES.indexOf(status) === -1) {
    return { ok: false, code: ERROR_CODES.INVALID_DATA };
  }
  let state = RESPONSE_STATES.DECLINED;
  if (response === RESPONSE_STATES.ACCEPTED) {
    state = RESPONSE_STATES.ACCEPTED;
  }

  const message = text_(payload && payload.message);
  const restrictions = text_(payload && payload.restrictions);
  const values = {};
  values[GUEST_COLUMNS.PHONE] = phone;
  values[GUEST_COLUMNS.GUEST_NAME] = guestName;
  // El cupo de la fila es el límite del código del enlace (D7); en la pública, «sin tope», se
  // deja el cupo **vacío** y no se acota nada. El código usado **no** se registra en ninguna
  // columna: la hoja no la declara y aquí no se inventa (RF-8).
  values[GUEST_COLUMNS.ADULTS_GUESTS] = limit === NO_LIMIT ? '' : limit;
  values[GUEST_COLUMNS.ADULTS_ATTENDEES] = adultsAttendees;
  // La genérica y la pública no ofrecen niños: sus cupos y sus asistentes quedan vacíos (D12).
  values[GUEST_COLUMNS.CHILD_GUESTS] = '';
  values[GUEST_COLUMNS.CHILD_ATTENDEES] = '';
  values[GUEST_COLUMNS.MESSAGE] = message === null ? '' : message;
  values[GUEST_COLUMNS.DIETARY_RESTRICTIONS] = restrictions === null ? '' : restrictions;
  values[GUEST_COLUMNS.STATUS] = state;
  values[GUEST_COLUMNS.DATETIME] = nowText_(now, book.timeZone);

  if (row === null) {
    // Alta: la fila se añade al final de la hoja con `guest_id` = **mayor entero existente
    // + 1** (RF-8). El teléfono ya está validado, así que no se ha creado nada antes de
    // comprobarlo (D23).
    rowNumber = sheet.getLastRow() + 1;
    values[GUEST_COLUMNS.GUEST_ID] = lastGuestId + 1;
  }
  writeResponse_(sheet, rowNumber, headerMap, values);

  return { ok: true, code: ERROR_CODES.OK };
}

// Escribe la respuesta en **una fila** por **nombre de columna** (RF-4): solo toca las
// columnas que el libro declara —las que no declara se quedan como están; inventarlas está
// prohibido— y deja **en blanco** las que la respuesta no trae, para que una edición no
// conserve un mensaje o unas restricciones que el invitado retiró.
//
// El **teléfono** se escribe además como **texto**: su celda se marca con formato de texto
// (`@`) **antes** de escribir el valor, porque un teléfono con ceros a la izquierda
// (`0123456789`) con formato automático se guardaría como número, perdería esos ceros y
// dejaría de ser la llave del libro (RF-8, D6).
function writeResponse_(sheet, rowNumber, headerMap, values) {
  const columns = Object.keys(values);
  for (let i = 0; i < columns.length; i += 1) {
    const column = columns[i];
    if (!hasKey_(headerMap, column)) continue;
    const cell = sheet.getRange(rowNumber, headerMap[column] + 1);
    const value = values[column];
    if (typeof value === 'string') {
      // Las cadenas que vienen del invitado deben ser texto literal: sin el apóstrofo,
      // Sheets puede interpretar un valor que empieza por `=` como fórmula y exponer
      // datos de otras filas cuando después se consulta la respuesta.
      cell.setNumberFormat('@');
      cell.setValue(value === '' ? '' : "'" + value);
    } else {
      cell.setValue(value);
    }
  }
}

// ---------------------------------------------------------------------------
// Utilidades de lectura
// ---------------------------------------------------------------------------

// Mapa **nombre de columna → índice** a partir de la **fila 1**. El servicio lee por
// cabecera, nunca por posición, porque el orden de las columnas puede cambiar y las que no
// necesita pueden quedarse vacías (RF-4). Si un nombre se repite, manda el primero.
function readHeaderMap_(sheet) {
  const map = Object.create(null);
  const lastColumn = sheet.getLastColumn();
  if (lastColumn < 1) return map;
  const header = sheet.getRange(1, 1, 1, lastColumn).getValues()[0];
  for (let i = 0; i < header.length; i += 1) {
    const name = text_(header[i]);
    if (name !== null && !hasKey_(map, name)) map[name] = i;
  }
  return map;
}

// Valor de una columna por su **nombre**. Una columna que el libro no declara devuelve
// `null` en vez de fallar aquí: quien la necesite decide si su ausencia es un error (RF-4,
// RF-13).
function cellOf_(row, headerMap, columnName) {
  if (!hasKey_(headerMap, columnName)) return null;
  return row[headerMap[columnName]];
}

// Lector tolerante de asistentes: una celda **vacía** vale por **cero**; una celda
// **presente** con un valor que no sea un entero ≥ 0 es incoherente y devuelve `null`
// (D33, RF-20).
function parseAttendees_(value) {
  const textValue = text_(value);
  if (textValue === null) return 0;
  return parseCount_(value);
}

// Un `child_guests` vacío vale por cero; `adults_guests` es obligatorio (RF-9, RF-13).
function parseGuestCount_(value, allowZero) {
  const textValue = text_(value);
  if (textValue === null) return allowZero ? 0 : null;
  const parsed = parseCount_(value);
  if (parsed === null) return null;
  return parsed;
}

// Teléfono **normalizado a solo dígitos** (RF-8, D6, D23). La celda del libro puede traer el
// teléfono como número —con o sin espacios, guiones o paréntesis— y el del envío puede venir
// en cualquier formato: lo que se compara y lo que se guarda son sus dígitos. Se queda con
// todos los dígitos, así que un teléfono con lada de país no se recorta: no cuadra con los
// 10 exigidos y se rechaza de forma visible.
function phoneDigits_(value) {
  const raw = value === null || value === undefined ? '' : String(value);
  return raw.replace(/\D+/g, '');
}

// Primera columna de la lista que el libro **no** declara, o `null` si están todas. Sirve
// para comprobar de una vez las cabeceras que una escritura necesita: si falta cualquiera de
// ellas no se escribe nada y se falla de forma visible (RF-4, RF-13).
function firstMissingColumn_(headerMap, columnNames) {
  for (let i = 0; i < columnNames.length; i += 1) {
    if (!hasKey_(headerMap, columnNames[i])) return columnNames[i];
  }
  return null;
}

// Entero no negativo, o `null` si el valor está vacío o no representa un entero.
// Las hojas pueden devolver números o texto; no se aceptan decimales, booleanos ni
// valores coercionados como fechas/objetos para evitar inventar cupos.
function parseCount_(value) {
  if (typeof value === 'number') {
    return Number.isFinite(value) && Number.isInteger(value) && value >= 0 ? value : null;
  }
  if (typeof value !== 'string') return null;

  const raw = value.trim();
  if (!/^\d+$/.test(raw)) return null;

  const parsed = Number(raw);
  return Number.isSafeInteger(parsed) ? parsed : null;
}

// Texto recortado, o `null` si está vacío: para el servicio, una celda vacía y una ausente
// son lo mismo (RF-13).
function text_(value) {
  if (value === null || value === undefined) return null;
  const text = String(value).trim();
  return text === '' ? null : text;
}

// Código comparable: recortado y **en mayúsculas solo para comparar** (RF-2, D24): `PUBLIC`
// y los códigos en mayúsculas resuelven aunque el enlace llegue en minúsculas. Lo que se
// guarda o se devuelve es el valor de la hoja, nunca el normalizado.
function normalizeCode_(value) {
  const code = text_(value);
  return code === null ? null : code.toUpperCase();
}

// `is_active` del libro como booleano (RF-3): la hoja entrega `true`/`false` de verdad,
// pero también se aceptan los textos «true»/«false» en cualquier caja y `1`/`0`. Vacío o
// ilegible devuelve `null`, que quien lee trata como fila inválida (RF-13).
function isActive_(value) {
  if (value === true || value === false) return value;
  if (typeof value === 'number') {
    if (value === 1) return true;
    if (value === 0) return false;
    return null;
  }
  const text = text_(value);
  if (text === null) return null;
  const lowered = text.toLowerCase();
  if (lowered === 'true' || lowered === '1') return true;
  if (lowered === 'false' || lowered === '0') return false;
  return null;
}

// ¿El mapa trae esa clave? Hace falta un `hasOwnProperty`: un índice **0** es válido y no
// se puede comprobar con `if (mapa[clave])`, y así no cuentan las claves heredadas.
function hasKey_(map, key) {
  return Object.prototype.hasOwnProperty.call(map, key);
}

// ============================================================================
// Fechas
// ============================================================================

// Instante de una celda del libro como texto **ISO 8601 en la zona del libro** (D23), o
// `null` si la celda está vacía o no se puede interpretar. El desfase va incluido para que
// la app no tenga que adivinar la zona. Un plazo vacío o ilegible significa **sin plazo**
// (RF-11): no es un error.
function instantText_(value, timeZone) {
  if (value === null || value === undefined || value === '') return null;
  const date = value instanceof Date ? value : new Date(value);
  if (isNaN(date.getTime())) return null;
  const zone = timeZone || Session.getScriptTimeZone();
  const offset = Utilities.formatDate(date, zone, 'Z');
  const isoOffset = offset.length === 5 ? offset.slice(0, 3) + ':' + offset.slice(3) : offset;
  return Utilities.formatDate(date, zone, "yyyy-MM-dd'T'HH:mm:ss") + isoOffset;
}

// Momento del registro como **valor fijo** escrito en texto y en la zona del libro: es lo
// que se escribe en `datetime` (RF-7, D28). No vale una fórmula como `NOW()`, que cambiaría
// sola y no dejaría rastro del momento real. La zona entra por parámetro (quien abre el
// libro la conoce); sin ella se usa la del script como último recurso.
function nowText_(date, timeZone) {
  return instantText_(date instanceof Date ? date : new Date(), timeZone);
}

// ¿El plazo del maestro ya pasó? El `deadline` se leyó como instante ISO **con su desfase**
// (el de la zona del libro), así que comparar instantes es exacto y el «ahora» no necesita
// convertirse de zona. Un plazo **sin valor** (`null`) o ilegible significa **sin plazo** y
// nunca rechaza una respuesta: la invitación se puede contestar siempre (RF-11).
function deadlinePassed_(deadline, now) {
  const value = text_(deadline);
  if (value === null) return false;
  const limit = new Date(value).getTime();
  if (isNaN(limit)) return false;
  return now.getTime() > limit;
}

// ============================================================================
// El maestro (`files`)
// ============================================================================

// Abre el maestro, comprueba que se puede usar y devuelve lo necesario para buscar bodas:
// `{ ok: true, sheet, headerMap, rows, timeZone }` (las `rows` empiezan en la fila 2 de la
// hoja), o `{ ok: false, code }`.
//
// **Sin maestro no hay servicio:** el maestro es la raíz (D4) —de él salen el tipo de
// invitación, el plazo, si la boda está activa y **dónde** están sus invitados—, así que
// sin la propiedad del script o sin poder abrir el libro no se puede resolver nada.
//
// **De dónde sale el id:** de la propiedad del script `MASTER_SHEET_ID`, y se lee **por el
// nombre** de esa propiedad (`getProperty('MASTER_SHEET_ID')`). El **valor** de la
// propiedad es ya el id del libro: pasarlo a `getProperty` devuelve `null` (es el defecto
// que se corrigió, porque con cualquier maestro bien formado el servicio respondía
// `INVALID_DATA` siempre). El id no se escribe en el código, así que no se versiona
// (RNF-2).
function readMaster_() {
  const masterId = text_(PropertiesService.getScriptProperties().getProperty('MASTER_SHEET_ID'));
  if (masterId === null) {
    // Falta el id: el despliegue no está configurado, no se puede resolver ninguna boda.
    return { ok: false, code: ERROR_CODES.INVALID_DATA };
  }

  let book;
  try {
    book = SpreadsheetApp.openById(masterId);
  } catch (error) {
    // El libro no existe o el servicio no tiene permiso para abrirlo.
    return { ok: false, code: ERROR_CODES.INVALID_DATA };
  }

  const sheet = book.getSheetByName(SHEET_NAMES.MASTER);
  if (!sheet) return { ok: false, code: ERROR_CODES.INVALID_DATA };

  const headerMap = readHeaderMap_(sheet);
  for (let i = 0; i < MASTER_REQUIRED_COLUMNS.length; i += 1) {
    if (!hasKey_(headerMap, MASTER_REQUIRED_COLUMNS[i])) {
      return { ok: false, code: ERROR_CODES.INVALID_DATA };
    }
  }

  // Fila 1 = cabecera; las filas sin `slug` son filas sin datos y se ignoran (RF-4).
  const rows = sheet.getDataRange().getValues().slice(1);

  // Unicidad del maestro (RF-3, D28): dos filas con el mismo `slug` invalidan el maestro
  // entero, y dos filas **activas** con el mismo `guests_sheet_id` también (el modelo es un
  // libro de invitados por boda). Se falla siempre, no solo cuando toca la fila buscada.
  const slugs = Object.create(null);
  const activeSheetIds = Object.create(null);
  for (let r = 0; r < rows.length; r += 1) {
    const row = rows[r];
    const rowSlug = text_(cellOf_(row, headerMap, MASTER_COLUMNS.SLUG));
    if (rowSlug === null) continue;
    if (hasKey_(slugs, rowSlug)) return { ok: false, code: ERROR_CODES.INVALID_DATA };
    slugs[rowSlug] = true;

    if (isActive_(cellOf_(row, headerMap, MASTER_COLUMNS.IS_ACTIVE)) === true) {
      const sheetId = text_(cellOf_(row, headerMap, MASTER_COLUMNS.GUESTS_SHEET_ID));
      if (sheetId !== null) {
        if (hasKey_(activeSheetIds, sheetId)) return { ok: false, code: ERROR_CODES.INVALID_DATA };
        activeSheetIds[sheetId] = true;
      }
    }
  }

  return {
    ok: true,
    sheet: sheet,
    headerMap: headerMap,
    rows: rows,
    timeZone: sheet.getParent().getSpreadsheetTimeZone(),
  };
}

// Busca la fila de la boda por su `slug` (**exacto**) y devuelve
// `{ ok: true, slug, isActive, guestsSheetId, guestType, deadline, cache }`, o el error que
// corresponda: sin fila → `UNKNOWN_WEDDING`; `is_active` falso → `INACTIVE_WEDDING`;
// `is_active` vacío o ilegible → `INVALID_DATA`; `guest_type` fuera de los tres →
// `INVALID_DATA`.
//
// `guestsSheetId` y `cache` se devuelven como texto (o `null`): abrir el libro de invitados
// y leer la caché es trabajo de las acciones, que fallan con `GUEST_SHEET_UNAVAILABLE`
// cuando el id está vacío o el libro no responde (RF-3).
function findWedding_(slug) {
  const wanted = text_(slug);
  const master = readMaster_();
  if (!master.ok) return master;

  // Sin `slug` no hay fila que buscar (las filas sin `slug` se ignoran): boda desconocida.
  if (wanted === null) return { ok: false, code: ERROR_CODES.UNKNOWN_WEDDING };

  let row = null;
  let rowNumber = 0;
  for (let r = 0; r < master.rows.length; r += 1) {
    const candidate = text_(cellOf_(master.rows[r], master.headerMap, MASTER_COLUMNS.SLUG));
    if (candidate === wanted) {
      row = master.rows[r];
      rowNumber = r + 2; // la fila 1 de la hoja es la cabecera
      break;
    }
  }
  if (row === null) return { ok: false, code: ERROR_CODES.UNKNOWN_WEDDING };

  const isActive = isActive_(cellOf_(row, master.headerMap, MASTER_COLUMNS.IS_ACTIVE));
  if (isActive === null) return { ok: false, code: ERROR_CODES.INVALID_DATA };
  if (isActive === false) return { ok: false, code: ERROR_CODES.INACTIVE_WEDDING };

  // El tipo de invitación es **una boda, un tipo** (RF-5, D3) y se compara literal: el
  // maestro es configuración de quien organiza, no se adivina ni se corrige.
  const guestType = text_(cellOf_(row, master.headerMap, MASTER_COLUMNS.GUEST_TYPE));
  if (GUEST_TYPE_VALUES.indexOf(guestType) === -1) {
    return { ok: false, code: ERROR_CODES.INVALID_DATA };
  }

  const deadline = readDeadline_(master, rowNumber);
  if (!deadline.ok) return deadline;

  // El objeto de la boda gana las cachés (D32): `cache` para la hoja `generic` y `publicCache`
  // para la hoja `public`. La columna puede faltar en el maestro (opcional).
  return {
    ok: true,
    slug: wanted,
    isActive: isActive,
    guestsSheetId: text_(cellOf_(row, master.headerMap, MASTER_COLUMNS.GUESTS_SHEET_ID)),
    guestType: guestType,
    deadline: deadline.value,
    cache: text_(cellOf_(row, master.headerMap, MASTER_COLUMNS.GENERIC_JSON_CACHE)),
    publicCache: text_(cellOf_(row, master.headerMap, MASTER_COLUMNS.PUBLIC_JSON_CACHE)),
    language: normalizeLanguage_(cellOf_(row, master.headerMap, MASTER_COLUMNS.LANGUAGE)),
  };
}

function normalizeLanguage_(value) {
  return text_(value)?.toLowerCase() === 'english' ? 'english' : 'spanish';
}

// `deadline` de la fila: `{ ok: true, value }` con `null` si la columna falta o la celda
// está vacía, o con el instante en la **zona del libro** como texto ISO si es un valor
// fijo; `{ ok: false, code: "INVALID_DATA" }` si la celda tiene **fórmula**. Una celda con
// `NOW()` se recalcula al guardar: su valor es el momento del guardado, no un plazo, y el
// plazo **nunca vencería** (RF-11, D28).
function readDeadline_(master, rowNumber) {
  if (!hasKey_(master.headerMap, MASTER_COLUMNS.DEADLINE)) return { ok: true, value: null };
  const cell = master.sheet.getRange(rowNumber, master.headerMap[MASTER_COLUMNS.DEADLINE] + 1);
  if (text_(cell.getFormula()) !== null) return { ok: false, code: ERROR_CODES.INVALID_DATA };

  // Solo se interpreta una **fecha de verdad** o un texto con fecha. Un número suelto (un
  // serial sin formato de fecha) no se puede convertir sin adivinar su época —daría un
  // plazo absurdo— y un booleano no es una fecha: en esos casos no hay plazo (RF-11).
  const value = cell.getValue();
  if (!(value instanceof Date) && typeof value !== 'string') return { ok: true, value: null };

  return { ok: true, value: instantText_(value, master.timeZone) };
}

// ============================================================================
// Panel administrativo (spec 006) — lectura de respuestas
// ============================================================================

// Enmascara un teléfono a 10 dígitos mostrando solo los últimos 4. No persiste ni revela
// completo por defecto (D3). Si no hay suficientes dígitos, devuelve solo asteriscos.
function maskPhone_(value) {
  const digits = phoneDigits_(value);
  if (digits.length < 4) {
    return '****';
  }
  const lastFour = digits.slice(-4);
  return '****' + lastFour;
}

// La contraseña se configura en las propiedades del script por slug, sin escribir el libro.
function loginAdmin_(payload) {
  const slug = typeof payload.slug === 'string' ? text_(payload.slug) : null;
  const password = slug === null ? null : PropertiesService.getScriptProperties().getProperty('ADMIN_PASSWORD_' + slug);
  if (password === null || password.trim() === '') {
    return { ok: false, code: ADMIN_ERROR_CODES.NOT_CONFIGURED, contract: ADMIN_CONTRACT_VERSION };
  }
  if (payload.password !== password) {
    return { ok: false, code: ADMIN_ERROR_CODES.INVALID_PASSWORD, contract: ADMIN_CONTRACT_VERSION };
  }
  const wedding = findWedding_(slug);
  if (!wedding.ok) return { ok: false, code: wedding.code, contract: ADMIN_CONTRACT_VERSION };

  const session = Utilities.getUuid().replace(/-/g, '') + Utilities.getUuid().replace(/-/g, '');
  CacheService.getScriptCache().put('admin-password-session:' + session, wedding.slug, ADMIN_SESSION_TTL_SECONDS);
  return { ok: true, code: ADMIN_ERROR_CODES.OK, contract: ADMIN_CONTRACT_VERSION, session: session };
}

function authorizeAdmin_(session) {
  if (typeof session !== 'string' || !/^[a-f0-9]{64}$/i.test(session)) {
    return { ok: false, code: ADMIN_ERROR_CODES.INVALID_TOKEN };
  }
  const slug = CacheService.getScriptCache().get('admin-password-session:' + session);
  if (slug === null) return { ok: false, code: ADMIN_ERROR_CODES.INVALID_TOKEN };
  const wedding = findWedding_(slug);
  if (!wedding.ok) return wedding;
  return { ok: true, wedding: wedding };
}

// Lista respuestas para el panel administrativo. Solo lee, no escribe. Resuelve la boda
// por la sesión autorizada (D2). Devuelve solo columnas mínimas,
// teléfonos enmascarados (D3), totales excluyendo declined para adultos/niños, asistentes
// vacíos como 0. Sin paginación (D4). Sin PII en logs.
function listResponsesAdmin_(payload) {
  // Acción conocida; sin campos extra obligatorios (autorización resuelve en servidor).
  const auth = authorizeAdmin_(payload && payload.session);
  if (!auth.ok) {
    // El diagnóstico registra únicamente el código del error.
    console.info('admin: auth_failed code=' + auth.code);
    return { ok: false, code: auth.code, contract: ADMIN_CONTRACT_VERSION };
  }

  const wedding = auth.wedding;
  if (!wedding.ok) {
    console.info('admin: wedding_resolve_failed code=' + wedding.code);
    return { ok: false, code: wedding.code, contract: ADMIN_CONTRACT_VERSION };
  }

  const book = openGuestBook_(wedding);
  if (!book.ok) {
    console.info('admin: guest_sheet_unavailable');
    return { ok: false, code: ADMIN_ERROR_CODES.GUEST_SHEET_UNAVAILABLE, contract: ADMIN_CONTRACT_VERSION };
  }

  const sheet = book.book.getSheetByName(SHEET_NAMES.GUESTS);
  if (!sheet) {
    console.info('admin: guest_sheet_missing');
    return { ok: false, code: ADMIN_ERROR_CODES.INVALID_DATA, contract: ADMIN_CONTRACT_VERSION };
  }

  const headerMap = readHeaderMap_(sheet);
  const isPersonal = wedding.guestType === GUEST_TYPES.PERSONAL;
  // Columnas necesarias para construir el listado administrativo.
  const required = [
    GUEST_COLUMNS.GUEST_ID,
    GUEST_COLUMNS.GUEST_NAME,
    GUEST_COLUMNS.PHONE,
    GUEST_COLUMNS.ADULTS_GUESTS,
    GUEST_COLUMNS.ADULTS_ATTENDEES,
    GUEST_COLUMNS.CHILD_ATTENDEES,
    GUEST_COLUMNS.MESSAGE,
    GUEST_COLUMNS.DIETARY_RESTRICTIONS,
    GUEST_COLUMNS.STATUS,
    GUEST_COLUMNS.DATETIME,
  ];
  for (let i = 0; i < required.length; i += 1) {
    if (!hasKey_(headerMap, required[i])) {
      console.info('admin: invalid_data missing_column');
      return { ok: false, code: ADMIN_ERROR_CODES.INVALID_DATA, contract: ADMIN_CONTRACT_VERSION };
    }
  }

  const rows = sheet.getDataRange().getValues();
  let total = 0;
  let viewed = 0;
  let accepted = 0;
  let declined = 0;
  let pending = 0;
  let adultsSum = 0;
  let childrenSum = 0;
  let seatsOccupied = 0;
  let seatsIssued = 0;
  let latestDatetime = null;
  const responses = [];

  for (let r = 1; r < rows.length; r += 1) {
    const row = rows[r];
    const guestIdValue = cellOf_(row, headerMap, GUEST_COLUMNS.GUEST_ID);
    // Omitir filas completamente vacías sin colapsar con error de autorización.
    const guestNameVal = text_(cellOf_(row, headerMap, GUEST_COLUMNS.GUEST_NAME));
    const phoneVal = cellOf_(row, headerMap, GUEST_COLUMNS.PHONE);
    const statusVal = text_(cellOf_(row, headerMap, GUEST_COLUMNS.STATUS));
    const hasAny = guestIdValue !== null && guestIdValue !== '' || guestNameVal !== null || phoneVal !== null && phoneVal !== '' || statusVal !== null;
    if (!hasAny) {
      continue;
    }

    total += 1;
    // Solo las invitaciones personalizadas tienen el estado `viewed`; genéricas y públicas
    // aparecen en el panel únicamente cuando ya hay una respuesta.
    const state = isPersonal ? (statusVal === null ? RESPONSE_STATES.VIEWED : statusVal) : statusVal;
    if (!isPersonal && state === null) continue;
    if (RESPONSE_STATE_VALUES.indexOf(state) === -1) {
      // Datos incoherentes pero no errores de autorización/configuración.
      console.info('admin: row_invalid_state skipped_context');
      continue;
    }
    if (state === RESPONSE_STATES.VIEWED) {
      viewed += 1;
      pending += 1;
    } else if (state === RESPONSE_STATES.ACCEPTED) {
      accepted += 1;
    } else if (state === RESPONSE_STATES.DECLINED) {
      declined += 1;
    }

    // Asistentes vacíos como 0; valores incoherentes se omiten en conteo seguro (no romper listado).
    const adultsAtt = parseAttendees_(cellOf_(row, headerMap, GUEST_COLUMNS.ADULTS_ATTENDEES));
    const childAtt = parseAttendees_(cellOf_(row, headerMap, GUEST_COLUMNS.CHILD_ATTENDEES));
    if (adultsAtt === null || childAtt === null) {
      console.info('admin: row_invalid_attendees');
      return { ok: false, code: ADMIN_ERROR_CODES.INVALID_DATA, contract: ADMIN_CONTRACT_VERSION };
    }
    const adultsAttCount = adultsAtt;
    const childAttCount = childAtt;
    const adultsGuest = parseGuestCount_(cellOf_(row, headerMap, GUEST_COLUMNS.ADULTS_GUESTS), false);
    const childGuest = isPersonal
      ? parseGuestCount_(cellOf_(row, headerMap, GUEST_COLUMNS.CHILD_GUESTS), true)
      : 0;
    const assignedAdults = adultsGuest === null ? 0 : adultsGuest;
    const assignedChildren = childGuest === null ? 0 : childGuest;
    const assignedSeats = adultsGuest;
    const occupiedSeats = state === RESPONSE_STATES.ACCEPTED ? adultsAttCount + childAttCount : 0;
    if (assignedSeats !== null) seatsIssued += assignedSeats;
    seatsOccupied += occupiedSeats;
    if (state === RESPONSE_STATES.ACCEPTED) {
      adultsSum += adultsAttCount;
      childrenSum += childAttCount;
    }
    // declined: excluidos de totales de adultos/niños (según contrato)

    const guestIdStr = typeof guestIdValue === 'number' ? String(guestIdValue) : text_(guestIdValue);
    const datetime = responseInstant_(cellOf_(row, headerMap, GUEST_COLUMNS.DATETIME), book.timeZone);
    if (datetime !== null && (latestDatetime === null || Date.parse(datetime) > Date.parse(latestDatetime))) {
      latestDatetime = datetime;
    }
    responses.push({
      guestId: guestIdStr,
      guestType: wedding.guestType,
      guestName: guestNameVal,
      phoneMasked: maskPhone_(phoneVal),
      adultsAttendees: adultsAttCount,
      childAttendees: childAttCount,
      assignedAdults: assignedAdults,
      assignedChildren: assignedChildren,
      assignedSeats: assignedSeats,
      occupiedSeats: occupiedSeats,
      message: text_(cellOf_(row, headerMap, GUEST_COLUMNS.MESSAGE)),
      allergies: text_(cellOf_(row, headerMap, GUEST_COLUMNS.DIETARY_RESTRICTIONS)),
      status: state,
      datetime: datetime,
    });
  }

  // Logs seguros: sin nombres, teléfonos, mensajes, restricciones.
  console.info('admin: list_ok count=' + responses.length);

  return {
    ok: true,
    contract: ADMIN_CONTRACT_VERSION,
    wedding: {
      slug: wedding.slug,
      name: null,
      isActive: wedding.isActive,
      deadline: wedding.deadline,
      updatedAt: latestDatetime ?? nowText_(new Date(), book.timeZone),
      guestType: wedding.guestType,
      language: wedding.language,
    },
    summary: {
      total: total,
      viewed: viewed,
      accepted: accepted,
      declined: declined,
      pending: pending,
      adults: adultsSum,
      children: childrenSum,
      seatsIssued: seatsIssued,
      seatsOccupied: seatsOccupied,
      seatsUnoccupied: Math.max(seatsIssued - seatsOccupied, 0),
    },
    responses: responses,
  };
}

// Lista los códigos de enlace de la hoja que corresponde al tipo de boda. Solo devuelve
// identificadores y cupos; la autorización y la boda se resuelven server-side.
function listCodesAdmin_(payload) {
  const auth = authorizeAdmin_(payload && payload.session);
  if (!auth.ok) return { ok: false, code: auth.code, contract: ADMIN_CONTRACT_VERSION };
  const wedding = auth.wedding;
  if (!wedding.ok) return { ok: false, code: wedding.code, contract: ADMIN_CONTRACT_VERSION };
  if (wedding.guestType === GUEST_TYPES.PERSONAL) {
    return { ok: true, contract: ADMIN_CONTRACT_VERSION, wedding: { guestType: wedding.guestType }, codes: [] };
  }

  const sheetDef = wedding.guestType === GUEST_TYPES.PUBLIC ? CODE_SHEETS.PUBLIC : CODE_SHEETS.GENERIC;
  const cached = readCodeCache_(wedding.guestType === GUEST_TYPES.PUBLIC ? wedding.publicCache : wedding.cache);
  if (cached === null) return { ok: false, code: ADMIN_ERROR_CODES.INVALID_DATA, contract: ADMIN_CONTRACT_VERSION };

  const codes = [];
  const keys = Object.keys(cached).sort();
  for (let i = 0; i < keys.length; i += 1) {
    const code = keys[i];
    const limit = validateCodeLimit_(cached[code], sheetDef);
    if (!limit.ok) return { ok: false, code: ADMIN_ERROR_CODES.INVALID_DATA, contract: ADMIN_CONTRACT_VERSION };
    codes.push({ code: code, limit: limit.limit });
  }
  return {
    ok: true,
    contract: ADMIN_CONTRACT_VERSION,
    wedding: { guestType: wedding.guestType },
    codes: codes,
  };
}

// Revelación puntual y efímera del teléfono. Requiere la misma autorización server-side y
// el guest_id de una fila ya recibida; nunca acepta una posición ni devuelve otra fila.
function revealPhoneAdmin_(payload) {
  const auth = authorizeAdmin_(payload && payload.session);
  if (!auth.ok) return { ok: false, code: auth.code, contract: ADMIN_CONTRACT_VERSION };
  const wedding = auth.wedding;
  if (!wedding.ok) return { ok: false, code: wedding.code, contract: ADMIN_CONTRACT_VERSION };
  const guestId = normalizeCode_(payload && payload.guestId);
  if (guestId === null) return { ok: false, code: ADMIN_ERROR_CODES.INVALID_RESPONSE, contract: ADMIN_CONTRACT_VERSION };
  const book = openGuestBook_(wedding);
  if (!book.ok) return { ok: false, code: ADMIN_ERROR_CODES.GUEST_SHEET_UNAVAILABLE, contract: ADMIN_CONTRACT_VERSION };
  const sheet = book.book.getSheetByName(SHEET_NAMES.GUESTS);
  if (!sheet) return { ok: false, code: ADMIN_ERROR_CODES.INVALID_DATA, contract: ADMIN_CONTRACT_VERSION };
  const headerMap = readHeaderMap_(sheet);
  if (!hasKey_(headerMap, GUEST_COLUMNS.GUEST_ID) || !hasKey_(headerMap, GUEST_COLUMNS.PHONE)) {
    return { ok: false, code: ADMIN_ERROR_CODES.INVALID_DATA, contract: ADMIN_CONTRACT_VERSION };
  }
  const rows = sheet.getDataRange().getValues();
  for (let r = 1; r < rows.length; r += 1) {
    if (normalizeCode_(cellOf_(rows[r], headerMap, GUEST_COLUMNS.GUEST_ID)) !== guestId) continue;
    const phone = phoneDigits_(cellOf_(rows[r], headerMap, GUEST_COLUMNS.PHONE));
    if (phone.length !== PHONE_DIGITS) return { ok: false, code: ADMIN_ERROR_CODES.INVALID_DATA, contract: ADMIN_CONTRACT_VERSION };
    return { ok: true, contract: ADMIN_CONTRACT_VERSION, phone: phone };
  }
  return { ok: false, code: ADMIN_ERROR_CODES.INVALID_RESPONSE, contract: ADMIN_CONTRACT_VERSION };
}
