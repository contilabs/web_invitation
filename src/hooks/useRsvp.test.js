// Pruebas del envío de `useRsvp` (RF-8, RF-9, RF-14).
//
// El hook se monta con `renderToStaticMarkup` (React en el servidor) y se le pasa un
// cliente del servicio **de prueba**: así se comprueba, sin navegador, que no se envía nada
// cuando no hay servicio o el formulario no pasa la validación, que el cuerpo usa los
// nombres de campo del contrato y que un segundo envío no cuela mientras el primero sigue
// en curso. La traducción del resultado la prueba `utils/rsvp.test.js`.
import { strict as assert } from "node:assert";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { GUEST_TYPES, REQUEST_FIELDS, SERVICE_ACTIONS } from "../constants/contract.js";
import { interpretInvitation } from "../utils/invitation.js";
import { resolveServiceConfig } from "../utils/service.js";
import { useRsvp } from "./useRsvp.js";

const READY = resolveServiceConfig({ url: "https://ejemplo.invalid/exec", slug: "boda-ficticia" });

const genericInvitation = (limit) =>
  interpretInvitation({
    ok: true,
    action: "resolve",
    type: GUEST_TYPES.GENERIC,
    guest: {},
    limit,
    response: null,
    deadline: null,
  });

// Cliente de prueba: apunta las llamadas y responde con lo que se le diga. Sin respuesta
// indicada, deja el envío en curso.
function spyClient(answer) {
  const calls = [];
  const callService = (...args) => {
    calls.push(args);
    return answer === undefined ? new Promise(() => {}) : Promise.resolve(answer);
  };
  return { calls, callService };
}

// Monta el hook una vez y devuelve lo que expuso.
function mount(props) {
  let result = null;
  function Probe() {
    result = useRsvp(props);
    return null;
  }
  renderToStaticMarkup(createElement(Probe));
  return result;
}

const VALID_FORM = {
  code: "gen-0007",
  response: "accepted",
  name: "Titular Ejemplo",
  phone: "5512345678",
  adults: 1,
};

test("sin servicio configurado no se envía nada (RF-15)", async () => {
  const client = spyClient({ ok: true, data: { ok: true }, errorCode: null });
  const config = resolveServiceConfig({ url: "", slug: "boda-ficticia" });
  const hook = mount({ config, invitation: genericInvitation(3), callService: client.callService });

  await hook.submit(VALID_FORM);

  assert.equal(client.calls.length, 0, "sin servicio no hay a quién enviar");
});

test("lo que no pasa la validación no llega al servicio (RF-8)", async () => {
  const client = spyClient({ ok: true, data: { ok: true }, errorCode: null });
  const hook = mount({ config: READY, invitation: genericInvitation(3), callService: client.callService });

  // La genérica exige teléfono: sin él no hay envío (RF-8, D23).
  await hook.submit({ ...VALID_FORM, phone: "" });

  assert.equal(client.calls.length, 0);
});

test("el envío va al servicio con el cuerpo del contrato (RF-14)", async () => {
  const client = spyClient({ ok: true, data: { ok: true }, errorCode: null });
  const hook = mount({ config: READY, invitation: genericInvitation(3), callService: client.callService });

  await hook.submit({ ...VALID_FORM, phone: "(55) 1234 5678", adults: 2 });

  assert.equal(client.calls.length, 1);
  const [url, body] = client.calls[0];
  assert.equal(url, READY.url);
  assert.equal(body[REQUEST_FIELDS.ACTION], SERVICE_ACTIONS.RESPOND);
  assert.equal(body[REQUEST_FIELDS.SLUG], READY.slug);
  assert.equal(body[REQUEST_FIELDS.CODE], "gen-0007");
  assert.equal(body[REQUEST_FIELDS.PHONE], "5512345678", "el teléfono viaja normalizado a dígitos");
  assert.equal(body[REQUEST_FIELDS.NAME], "Titular Ejemplo");
  assert.equal(body[REQUEST_FIELDS.ADULTS], 2);
  assert.equal(body[REQUEST_FIELDS.RESPONSE], "accepted");
});

test("mientras un envío está en curso no cuela otro (RF-14)", () => {
  const client = spyClient();
  const hook = mount({ config: READY, invitation: genericInvitation(3), callService: client.callService });

  hook.submit(VALID_FORM);
  hook.submit(VALID_FORM);

  assert.equal(client.calls.length, 1, "el segundo envío se ignora mientras el primero sigue");
});

test("el primer pintado está en reposo (`idle`) y sin error (RF-14)", () => {
  const client = spyClient();
  const hook = mount({ config: READY, invitation: genericInvitation(3), callService: client.callService });

  assert.equal(hook.status, "idle");
  assert.equal(hook.errorCode, null);
});
