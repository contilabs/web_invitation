import { strict as assert } from "node:assert";
import test from "node:test";
import { filterAdminResponses, normalizeAdminResponse, sortAdminResponses } from "./adminResponses.js";

const response = (overrides = {}) => ({
  guestId: "1", guestType: "generic", guestName: "Ana", phoneMasked: "****1234",
  adultsAttendees: 2, childAttendees: 1, message: null, dietaryRestrictions: null,
  status: "accepted", datetime: "2027-01-01T10:00:00.000Z", ...overrides,
});

function envelope(responses) {
  return { ok: true, contract: "1.1.0", wedding: { slug: "boda", isActive: true, updatedAt: "2027-01-01T10:00:00.000Z" }, responses };
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
