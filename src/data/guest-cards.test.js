// Forma de las fichas de ejemplo (spec 004, T8; RF-1, RF-2, RF-11, RF-13, RF-14; D22).
//
// La app **no** usa `guest-cards.js` en ejecución: la invitación la resuelve el servicio de
// registro. Estas fichas son **fixtures** de esta prueba y deben conservar la **forma nueva**
// del contrato: los tres tipos, el teléfono (ficticio, 10 dígitos), los límites (incluido
// `"n"` del código reservado `PUBLIC`) y los cuatro estados reversibles. Los literales del
// modelo salen del módulo del contrato (fuente única; RF-17).
import { strict as assert } from "node:assert";
import test from "node:test";

import { guestCards } from "./guest-cards.js";
import {
  GUEST_TYPES,
  NO_LIMIT,
  PHONE_DIGITS,
  RESPONSE_STATES,
} from "../constants/contract.js";

const byType = (type) => guestCards.filter((card) => card.guest_type === type);

test("las fichas cubren los tres tipos de invitación (RF-5, D22)", () => {
  const types = [...new Set(guestCards.map((card) => card.guest_type))].sort();
  assert.deepEqual(types, Object.values(GUEST_TYPES).slice().sort());
});

test("cada ficha trae un teléfono ficticio de 10 dígitos y distinto (RF-8, D23)", () => {
  const phones = guestCards.map((card) => String(card.phone ?? ""));
  const tenDigits = new RegExp(`^\\d{${PHONE_DIGITS}}$`);
  for (const phone of phones) {
    assert.match(phone, tenDigits, `teléfono inválido en una ficha: «${phone}»`);
  }
  assert.equal(new Set(phones).size, phones.length, "hay teléfonos repetidos en las fichas");
});

test("la genérica lleva un límite entero y la pública, el valor sin tope (RF-9)", () => {
  const generic = byType(GUEST_TYPES.GENERIC);
  assert.ok(generic.length > 0, "no hay ninguna ficha genérica");
  for (const card of generic) {
    assert.ok(
      Number.isInteger(card.limit) && card.limit > 0,
      `límite inválido en una ficha genérica: ${card.limit}`,
    );
  }

  const publicCard = byType(GUEST_TYPES.PUBLIC);
  assert.ok(publicCard.length > 0, "no hay ninguna ficha pública");
  for (const card of publicCard) {
    assert.equal(card.limit, NO_LIMIT, `la pública debería ser «${NO_LIMIT}»`);
  }
});

test("entre todas las fichas aparecen los cuatro estados (RF-10)", () => {
  const states = [...new Set(guestCards.map((card) => card.status))].sort();
  assert.deepEqual(states, Object.values(RESPONSE_STATES).slice().sort());
});

test("la personalizada trae su titular y su cupo; la genérica y la pública, su id entero", () => {
  for (const card of byType(GUEST_TYPES.PERSONAL)) {
    assert.ok(String(card.guest_name ?? "").trim(), "la personalizada no trae titular");
    assert.ok(
      Number.isInteger(card.adults_guests) && card.adults_guests >= 0,
      `cupo inválido en una personalizada: ${card.adults_guests}`,
    );
  }
  for (const card of [...byType(GUEST_TYPES.GENERIC), ...byType(GUEST_TYPES.PUBLIC)]) {
    assert.ok(
      Number.isInteger(card.guest_id),
      `«${card.phone}» debería traer un guest_id entero (lo asigna el servicio)`,
    );
  }
});
