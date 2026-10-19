// Pruebas de la consulta por teléfono de `useGuestLookup` (RF-5; M4, M10; RNF-2).
//
// El hook se monta con `renderToStaticMarkup` (React en el servidor) y se le pasa un cliente
// del servicio **de prueba**: así se comprueba, sin navegador, el **primer pintado**, que no
// se llama con el teléfono incompleto ni sin servicio configurado, que el cuerpo lleva los
// literales del contrato de `lookup` y nada más, que un segundo `lookup` no cuela mientras el
// primero sigue (doble clic) y que ni el fallo del servicio ni el de un cliente averiado
// llegan al componente.
//
// La **interpretación** de la respuesta la prueba `utils/invitation.test.js` (`interpretLookup`)
// y el cuerpo de la consulta, `utils/rsvp.test.js` (`lookupPayload`). El estado del bloque que
// sale de las transiciones (`en curso` → `respondido`/`formulario`/`degradado`) se pinta y se
// comprueba en el navegador (T8, T10): un render estático no vuelve a pintar tras el `await`.
import { strict as assert } from "node:assert";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { LOOKUP_FIELDS, SERVICE_ACTIONS } from "../constants/contract.js";
import { resolveServiceConfig } from "../utils/service.js";
import { useGuestLookup } from "./useGuestLookup.js";

const READY = resolveServiceConfig({ url: "https://ejemplo.invalid/exec", slug: "boda-ficticia" });
const NOT_CONFIGURED = resolveServiceConfig({ url: "", slug: "boda-ficticia" });
const MISSING_SLUG = resolveServiceConfig({ url: "https://ejemplo.invalid/exec", slug: "" });

// El código del enlace entra por parámetro (así la prueba no necesita el `window` del
// navegador); el `phone` es el de una fila ficticia cualquiera.
const CODE = "gen-0007";
const PHONE = "5512345678";

// Cliente de prueba: apunta las llamadas y responde con lo que se le diga. Sin respuesta
// indicada, deja la consulta en curso; con un error, falla como una red caída.
function spyClient(answer) {
  const calls = [];
  const callService = (...args) => {
    calls.push(args);
    if (answer === undefined) return new Promise(() => {});
    if (answer instanceof Error) return Promise.reject(answer);
    return Promise.resolve(answer);
  };
  return { calls, callService };
}

// Monta el hook una vez y devuelve lo que expuso.
function mount(props) {
  let result = null;
  function Probe() {
    result = useGuestLookup(props);
    return null;
  }
  renderToStaticMarkup(createElement(Probe));
  return result;
}

test("el primer pintado está en reposo (`idle`), sin causa y sin resultado (RF-5)", () => {
  const client = spyClient();
  const hook = mount({ config: READY, code: CODE, callService: client.callService });

  assert.equal(hook.status, "idle");
  assert.equal(hook.errorCode, null);
  assert.equal(hook.result, null);
  assert.equal(client.calls.length, 0, "el primer pintado no consulta a nadie");
});

test("sin servicio listo no se consulta: manda la causa de la configuración (RF-15)", async () => {
  for (const config of [NOT_CONFIGURED, MISSING_SLUG]) {
    const client = spyClient();
    const hook = mount({ config, code: CODE, callService: client.callService });

    await hook.lookup(PHONE);

    assert.equal(client.calls.length, 0, "sin servicio configurado no hay a quién preguntar");
  }
});

test("el teléfono incompleto no llega al servicio (RF-5, M4)", async () => {
  const client = spyClient();
  const hook = mount({ config: READY, code: CODE, callService: client.callService });

  // Vacío, con nueve dígitos y con lada de país: ninguno es un teléfono de diez dígitos.
  await hook.lookup("");
  await hook.lookup("551234567");
  await hook.lookup("15512345678");

  assert.equal(client.calls.length, 0, "se valida antes de llamar");
});

test("la consulta va al servicio con el cuerpo del contrato y nada más (RF-5, RF-8)", async () => {
  const client = spyClient({ ok: false, data: null, errorCode: null });
  const hook = mount({ config: READY, code: CODE, callService: client.callService });

  await hook.lookup("(55) 1234 5678");

  assert.equal(client.calls.length, 1);
  const [url, body, options] = client.calls[0];
  assert.equal(url, READY.url, "la consulta usa la URL de la configuración");
  assert.equal(body[LOOKUP_FIELDS.ACTION], SERVICE_ACTIONS.LOOKUP);
  assert.equal(body[LOOKUP_FIELDS.SLUG], READY.slug);
  assert.equal(body[LOOKUP_FIELDS.CODE], CODE, "el código del enlace viaja recortado");
  assert.equal(body[LOOKUP_FIELDS.PHONE], PHONE, "el teléfono viaja normalizado a dígitos");
  // Ni el nombre, ni la respuesta, ni los asistentes viajan en una consulta: el cuerpo es
  // exactamente el de `lookup` (RNF-2, I8).
  assert.deepEqual(
    Object.values(LOOKUP_FIELDS).filter((literal) => literal in body).sort(),
    ["action", "code", "phone", "slug"],
  );
  assert.equal(options.signal instanceof AbortSignal, true, "la consulta se puede cancelar");
});

test("mientras una consulta está en curso no cuela otra (RF-5, M10)", () => {
  const client = spyClient();
  const hook = mount({ config: READY, code: CODE, callService: client.callService });

  hook.lookup(PHONE);
  hook.lookup(PHONE);

  assert.equal(client.calls.length, 1, "el doble clic no consulta dos veces");
});

test("cuando la consulta termina, otra vuelve a caber (RF-5, RF-7)", async () => {
  const client = spyClient({ ok: false, data: null, errorCode: null });
  const hook = mount({ config: READY, code: CODE, callService: client.callService });

  await hook.lookup(PHONE);
  await hook.lookup(PHONE);

  assert.equal(client.calls.length, 2, "el candado se suelta al terminar (reintento)");
});

test("el fallo del servicio se traduce y no lanza al componente (RF-5)", async () => {
  const service = {
    ok: false,
    data: { ok: false, action: SERVICE_ACTIONS.LOOKUP, code: "UNKNOWN_GUEST" },
    errorCode: "UNKNOWN_GUEST",
  };
  const hook = mount({ config: READY, code: CODE, callService: spyClient(service).callService });

  await assert.doesNotReject(() => hook.lookup(PHONE));
});

test("un cliente averiado tampoco lanza al componente (RF-5)", async () => {
  const client = spyClient(new Error("la red se cayó"));
  const hook = mount({ config: READY, code: CODE, callService: client.callService });

  await assert.doesNotReject(() => hook.lookup(PHONE));
  assert.equal(client.calls.length, 1);
});
