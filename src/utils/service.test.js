// Pruebas de `service.js` (RF-15, D15): los tres estados de la configuración del despliegue.
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import test from "node:test";

import { DEFAULT_SERVICE_URL, DEFAULT_WEDDING_SLUG } from "../constants/service.js";
import { SERVICE_STATES, resolveServiceConfig } from "./service.js";

test("sin URL el sistema entra en modo demo (RF-15)", () => {
  const config = resolveServiceConfig({ url: "", slug: "boda-ficticia" });
  assert.equal(config.state, SERVICE_STATES.NOT_CONFIGURED);
  assert.equal(config.url, "");
  assert.equal(config.slug, "boda-ficticia");

  assert.equal(resolveServiceConfig({}).state, SERVICE_STATES.NOT_CONFIGURED);
  assert.equal(resolveServiceConfig().state, SERVICE_STATES.NOT_CONFIGURED);
  assert.equal(resolveServiceConfig(null).state, SERVICE_STATES.NOT_CONFIGURED);
  assert.equal(
    resolveServiceConfig({ url: DEFAULT_SERVICE_URL, slug: DEFAULT_WEDDING_SLUG }).state,
    SERVICE_STATES.NOT_CONFIGURED,
  );
  // Una URL en blanco es «sin URL»: no se llama a nadie.
  assert.equal(resolveServiceConfig({ url: "   ", slug: "boda-ficticia" }).state, SERVICE_STATES.NOT_CONFIGURED);
});

test("con URL pero sin `slug` la invitación no está configurada (RF-15)", () => {
  const config = resolveServiceConfig({ url: "https://ejemplo.invalid/exec", slug: "" });
  assert.equal(config.state, SERVICE_STATES.MISSING_SLUG);
  assert.equal(config.url, "https://ejemplo.invalid/exec");
  assert.equal(config.slug, "");

  assert.equal(
    resolveServiceConfig({ url: "https://ejemplo.invalid/exec", slug: "   " }).state,
    SERVICE_STATES.MISSING_SLUG,
  );
  assert.equal(resolveServiceConfig({ url: "https://ejemplo.invalid/exec" }).state, SERVICE_STATES.MISSING_SLUG);
});

test("con URL y `slug` la configuración está lista (RF-15)", () => {
  const config = resolveServiceConfig({ url: "https://ejemplo.invalid/exec", slug: "boda-ficticia" });
  assert.equal(config.state, SERVICE_STATES.READY);
  assert.equal(config.url, "https://ejemplo.invalid/exec");
  assert.equal(config.slug, "boda-ficticia");
});

test("la configuración se recorta y no deduce el `slug` de la URL (RF-15, D17)", () => {
  const config = resolveServiceConfig({
    url: "  https://ejemplo.invalid/exec  ",
    slug: "  boda-ficticia  ",
  });
  assert.deepEqual(config, {
    url: "https://ejemplo.invalid/exec",
    slug: "boda-ficticia",
    state: SERVICE_STATES.READY,
  });

  // Una URL con el slug dentro no lo convierte en configuración.
  const guessed = resolveServiceConfig({ url: "https://ejemplo.invalid/exec?slug=boda-ficticia" });
  assert.equal(guessed.state, SERVICE_STATES.MISSING_SLUG);
  assert.equal(guessed.slug, "");
});

test("el módulo es puro: sin DOM, sin reloj y sin red (RNF-9)", () => {
  const source = readFileSync(new URL("./service.js", import.meta.url), "utf8");
  for (const forbidden of [
    /\bdocument\b/,
    /\bwindow\b/,
    /\blocalStorage\b/,
    /\bfetch\s*\(/,
    /\bXMLHttpRequest\b/,
    /Date\.now/,
    /new Date\(\s*\)/,
    /import\.meta/,
    /from "react"/,
  ]) {
    assert.doesNotMatch(source, forbidden, `el módulo usa ${forbidden}`);
  }
});
