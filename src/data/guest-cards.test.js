// Forma del contrato y reglas de las fichas de ejemplo (T30, RF-16, RF-17, RF-19, RNF-7).
//
// El repositorio solo lleva fichas de ejemplo: comprueba que tienen la forma del contrato
// del servicio de registro y que respetan los límites por tipo (una genérica, hasta diez
// reutilizables con límite 1–10), sin datos personales reales.
import { strict as assert } from "node:assert";
import test from "node:test";

import { boda } from "./wedding.js";
import { invitaciones } from "./guest-cards.js";
import {
  INVITATION_TYPES,
  guestLimit,
  reservedSeats,
  resolveInvitation,
} from "../utils/invitation.js";

const normalize = (value) => String(value ?? "").trim().toLowerCase();
const byType = (type) => invitaciones.filter((card) => card.tipo === type);

// Campos del contrato del servicio de registro (Google Apps Script) presentes en la ficha.
const CONTRACT_KEYS = [
  "guestName",
  "partnerName",
  "adultsGuests",
  "childGuests",
  "emailGuests",
  "phoneGuests",
];

test("hay una sola invitación genérica y no más de diez reutilizables (RF-16)", () => {
  assert.equal(byType("generica").length, 1);
  assert.ok(byType("reutilizable").length > 0);
  assert.ok(byType("reutilizable").length <= 10);
});

test("cada reutilizable lleva un límite entero de 1 a 10 (RF-16, RF-17)", () => {
  for (const card of byType("reutilizable")) {
    assert.ok(
      Number.isInteger(card.limite) && card.limite >= 1 && card.limite <= 10,
      `límite inválido en ${card.codigo}: ${card.limite}`,
    );
  }
});

test("los códigos son únicos y no vacíos tras normalizar (RF-16)", () => {
  const codes = invitaciones.map((card) => normalize(card.codigo));
  for (const code of codes) assert.ok(code, "hay una ficha sin código");
  assert.equal(new Set(codes).size, codes.length, "hay códigos duplicados");
});

test("la personalizada tiene la forma del contrato (RF-19)", () => {
  const personalized = byType("personalizada");
  assert.equal(personalized.length, 1);

  const card = personalized[0];
  for (const key of CONTRACT_KEYS) {
    assert.ok(key in card, `la ficha personalizada no trae «${key}»`);
  }
  assert.ok(String(card.guestName ?? "").trim(), "la personalizada no trae nombre");
  assert.ok(Number.isInteger(card.adultsGuests) && card.adultsGuests >= 1);
});

test("la personalizada trae lugares reservados y la genérica no (RF-17)", () => {
  const personalized = byType("personalizada")[0];
  const reserved = reservedSeats(resolveInvitation(invitaciones, personalized.codigo));
  assert.ok(Number.isInteger(reserved) && reserved >= 1);

  const generic = byType("generica")[0];
  assert.equal(reservedSeats(resolveInvitation(invitaciones, generic.codigo)), null);
});

test("ni las reutilizables ni la genérica registran nombre (RF-16)", () => {
  const cards = [...byType("reutilizable"), ...byType("generica")];
  for (const card of cards) {
    assert.equal(card.guestName, undefined, `${card.codigo} no debería llevar nombre`);
  }
});

test("cada ficha resuelve por su código, con su tipo y su límite (RF-16)", () => {
  for (const card of invitaciones) {
    const direct = resolveInvitation(invitaciones, card.codigo);
    assert.equal(direct.type, card.tipo, `no resuelve ${card.codigo}`);

    const normalized = resolveInvitation(invitaciones, `  ${String(card.codigo).toUpperCase()}  `);
    assert.equal(normalized.type, card.tipo, `no normaliza ${card.codigo}`);

    if (card.tipo === "reutilizable") {
      assert.equal(direct.limit, card.limite, `no conserva el límite de ${card.codigo}`);
    }
  }
});

test("ningún límite supera el máximo de la boda (RF-17)", () => {
  for (const card of invitaciones) {
    const limit = guestLimit(resolveInvitation(invitaciones, card.codigo), boda);
    assert.ok(
      limit <= boda.confirmacion.maximoBoda,
      `${card.codigo} supera el máximo de la boda`,
    );
  }
});

test("un código desconocido no personaliza nada (RF-17)", () => {
  const invitation = resolveInvitation(invitaciones, "no-existe");
  assert.equal(invitation.type, INVITATION_TYPES.UNKNOWN);
  assert.equal(reservedSeats(invitation), null);
});
