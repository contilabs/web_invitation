// Pruebas de `invitacion.js` (RF-16, RF-17)
import { strict as assert } from "node:assert";
import test from "node:test";
import {
  readInvitationCode,
  resolveInvitation,
  reservedSeats,
  guestLimit,
  isWithinGuestLimit,
  formatSeats,
  INVITATION_TYPES,
} from "./invitation.js";

const CARDS = [
  { codigo: "karina-gerardo-inv-001", tipo: "personalizada", lugaresReservados: 2, adultsGuests: 2 },
  { codigo: "rec-001", tipo: "reutilizable", limite: 2 },
  { codigo: "rec-bad", tipo: "reutilizable", limite: 0 },
  { codigo: "gen-001", tipo: "generica" },
];

const WEDDING = { confirmacion: { maximoBoda: 100 } };

test("readInvitationCode lee, recorta y normaliza", () => {
  assert.equal(readInvitationCode(new URLSearchParams("codigo=REC-001")), "rec-001");
  assert.equal(readInvitationCode(new URLSearchParams("code=abc")), "abc");
  assert.equal(readInvitationCode(new URLSearchParams("")), null);
  assert.equal(readInvitationCode(null), null);
});

test("resolveInvitation resuelve los tres tipos", () => {
  assert.equal(resolveInvitation(CARDS, "karina-gerardo-inv-001").type, INVITATION_TYPES.PERSONALIZED);
  assert.equal(resolveInvitation(CARDS, "rec-001").type, INVITATION_TYPES.REUSABLE);
  assert.equal(resolveInvitation(CARDS, "gen-001").type, INVITATION_TYPES.GENERIC);
});

test("resolveInvitation: código ausente o desconocido → desconocida", () => {
  assert.equal(resolveInvitation(CARDS, null).type, INVITATION_TYPES.UNKNOWN);
  assert.equal(resolveInvitation(CARDS, "no-existe").type, INVITATION_TYPES.UNKNOWN);
});

test("resolveInvitation: límite fuera de 1–10 es inválido", () => {
  assert.equal(resolveInvitation(CARDS, "rec-bad").type, INVITATION_TYPES.UNKNOWN);
});

test("reservedSeats solo en personalizada", () => {
  assert.equal(reservedSeats(resolveInvitation(CARDS, "karina-gerardo-inv-001")), 2);
  assert.equal(reservedSeats(resolveInvitation(CARDS, "rec-001")), null);
  assert.equal(reservedSeats(resolveInvitation(CARDS, "gen-001")), null);
});

test("guestLimit por tipo", () => {
  assert.equal(guestLimit(resolveInvitation(CARDS, "rec-001"), WEDDING), 2);
  assert.equal(guestLimit(resolveInvitation(CARDS, "karina-gerardo-inv-001"), WEDDING), 2);
  assert.equal(guestLimit(resolveInvitation(CARDS, "gen-001"), WEDDING), 100);
});

test("isWithinGuestLimit incluye el borde", () => {
  assert.equal(isWithinGuestLimit(2, 2), true);
  assert.equal(isWithinGuestLimit(3, 2), false);
});

test("formatSeats en español", () => {
  assert.equal(formatSeats(1), "1 lugar");
  assert.equal(formatSeats(4), "4 lugares");
  assert.equal(formatSeats(0), "un lugar");
});
