// Pruebas del estado inicial de `useInvitation` (RF-12, RF-15; RNF-5, RNF-9).
//
// El hook se monta con `renderToStaticMarkup` (React en el servidor): así se comprueba el
// **primer pintado** sin navegador y sin efectos. Los efectos (la llamada al servicio y el
// cierre al pasar el plazo) van a la comprobación en el navegador (T7/T10).
import { strict as assert } from "node:assert";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { SERVICE_ERRORS } from "../constants/contract.js";
import { resolveServiceConfig } from "../utils/service.js";
import { useInvitation } from "./useInvitation.js";

const codeOf = (name) => SERVICE_ERRORS.find((error) => error.code === name)?.code ?? name;

// Monta el hook una vez y devuelve lo que expuso en ese primer pintado.
function firstPaint(props) {
  let result = null;
  function Probe() {
    result = useInvitation(props);
    return null;
  }
  renderToStaticMarkup(createElement(Probe));
  return result;
}

// Cliente del servicio que cuenta las llamadas y nunca responde: si el hook lo usara en el
// primer pintado, la llamada se vería aquí.
function countingClient() {
  const calls = [];
  return {
    calls,
    callService: (...args) => {
      calls.push(args);
      return new Promise(() => {});
    },
  };
}

test("sin URL configurada el primer pintado es el modo demo y no se llama a nadie (RF-15, D15)", () => {
  const client = countingClient();
  const config = resolveServiceConfig({ url: "", slug: "boda-ficticia" });

  const result = firstPaint({ config, callService: client.callService });

  assert.equal(result.status, "demo");
  assert.equal(result.invitation, null);
  assert.equal(result.errorCode, null);
  assert.equal(client.calls.length, 0, "el modo demo no llama al servicio");
});

test("con URL y sin `slug` el primer pintado es error con MISSING_SLUG y sin reintento (RF-12, RF-15)", () => {
  const client = countingClient();
  const config = resolveServiceConfig({ url: "https://ejemplo.invalid/exec", slug: "" });

  const result = firstPaint({ config, callService: client.callService });

  assert.equal(result.status, "error");
  assert.equal(result.errorCode, codeOf("MISSING_SLUG"));
  assert.equal(result.invitation, null);
  assert.equal(client.calls.length, 0, "una causa sin reintento no vuelve a llamar sola");
});

test("con la configuración lista el primer pintado no espera al servicio (RNF-5)", () => {
  const client = countingClient();
  const config = resolveServiceConfig({ url: "https://ejemplo.invalid/exec", slug: "boda-ficticia" });

  const result = firstPaint({ config, callService: client.callService });

  assert.equal(result.status, "loading");
  assert.equal(result.invitation, null);
  assert.equal(result.errorCode, null);
});
