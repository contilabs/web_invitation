import { strict as assert } from "node:assert";
import test from "node:test";
import { ADMIN_CONTRACT_VERSION } from "../constants/contract.js";
import { wedding } from "../data/wedding.js";
import { filterAdminResponses, invitationLink, invitationMessage, normalizeAdminResponse, sortAdminResponses } from "./adminResponses.js";

const response = (overrides = {}) => ({
  guestId: "1", guestType: "generic", guestName: "Ana", phoneMasked: "****1234",
  adultsAttendees: 2, childAttendees: 1, message: null, dietaryRestrictions: null,
  status: "accepted", datetime: "2027-01-01T10:00:00.000Z", ...overrides,
});

function envelope(responses) {
  return { ok: true, contract: ADMIN_CONTRACT_VERSION, wedding: { slug: "boda", isActive: true, updatedAt: "2027-01-01T10:00:00.000Z" }, responses };
}

test("normaliza filas y deriva el resumen excluyendo declined", () => {
  const result = normalizeAdminResponse(envelope([
    response(), response({ guestId: "2", status: "declined", adultsAttendees: 4, childAttendees: 3 }),
    response({ guestId: "3", status: "viewed", adultsAttendees: 0, childAttendees: 0, datetime: null }),
  ]));
  assert.equal(result.ok, true);
  assert.deepEqual(result.summary, { total: 3, viewed: 1, accepted: 1, declined: 1, pending: 1, adults: 2, children: 1 });
});

test("rechaza una respuesta parcial o una fila inválida", () => {
  assert.equal(normalizeAdminResponse({ ok: true }).ok, false);
  assert.equal(normalizeAdminResponse(envelope([response({ phoneMasked: "" })])).errorCode, "INVALID_RESPONSE");
});

test("combina filtros y conserva el orden solicitado", () => {
  const rows = [response(), response({ guestId: "2", guestName: "Bea", status: "viewed", dietaryRestrictions: "nueces", datetime: "2027-01-02T10:00:00.000Z" })];
  assert.equal(filterAdminResponses(rows, { restrictions: "yes" }).length, 1);
  assert.equal(sortAdminResponses(rows)[0].guestId, "2");
});

test("compone el mensaje del enlace con el cupo y pluraliza los lugares", () => {
  const { nombre: couple, mensajeEnlace, mensajeEnlaceSinLimite } = wedding.marca;
  const link = invitationLink("4236_GEN", "https://ejemplo.test/admin.html");
  assert.equal(
    invitationMessage(mensajeEnlace, { couple, limit: 2, link }),
    "¡Hola! Somos Naomi y Andrés y nos hace mucha ilusión compartir nuestra boda contigo. Hemos reservado 2 lugares para ti.\nAquí encontrarás los detalles y podrás confirmar tu asistencia:\nhttps://ejemplo.test/?guest=4236_GEN",
  );
  assert.match(invitationMessage(mensajeEnlace, { couple, limit: 1, link }), /Hemos reservado 1 lugar para ti\./);
  assert.match(invitationMessage(mensajeEnlaceSinLimite, { couple, limit: "n", link }), /Puedes venir con tus acompañantes\./);
});

test("genera enlaces sin index.html y conserva la subruta de publicación", () => {
  assert.equal(invitationLink("4236_GEN", "https://ejemplo.test/admin.html"), "https://ejemplo.test/?guest=4236_GEN");
  assert.equal(invitationLink("a+b", "https://ejemplo.test/boda/admin.html?otro=1#enlaces"), "https://ejemplo.test/boda/?guest=a%2Bb");
});
