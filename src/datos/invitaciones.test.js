// Forma del contrato y reglas de las fichas de ejemplo (T30, RF-16, RF-17, RF-19, RNF-7).
//
// El repositorio solo lleva fichas de ejemplo: comprueba que tienen la forma del contrato
// del servicio de registro y que respetan los límites por tipo (una genérica, hasta diez
// reutilizables con límite 1–10), sin datos personales reales.
import { strict as assert } from "node:assert";
import test from "node:test";

import { boda } from "./boda.js";
import { invitaciones } from "./invitaciones.js";
import {
  INVITATION_TYPES,
  guestLimit,
  reservedSeats,
  resolveInvitation,
} from "../utils/invitation.js";

const normalizar = (valor) => String(valor ?? "").trim().toLowerCase();
const porTipo = (tipo) => invitaciones.filter((ficha) => ficha.tipo === tipo);

// Campos del contrato del servicio de registro (Google Apps Script) presentes en la ficha.
const CLAVES_CONTRATO = [
  "guestName",
  "partnerName",
  "adultsGuests",
  "childGuests",
  "emailGuests",
  "phoneGuests",
];

test("hay una sola invitación genérica y no más de diez reutilizables (RF-16)", () => {
  assert.equal(porTipo("generica").length, 1);
  assert.ok(porTipo("reutilizable").length > 0);
  assert.ok(porTipo("reutilizable").length <= 10);
});

test("cada reutilizable lleva un límite entero de 1 a 10 (RF-16, RF-17)", () => {
  for (const ficha of porTipo("reutilizable")) {
    const limite = Number(ficha.limite);
    assert.ok(
      Number.isInteger(limite) && limite >= 1 && limite <= 10,
      `límite inválido en ${ficha.codigo}: ${ficha.limite}`,
    );
  }
});

test("los códigos son únicos y no vacíos tras normalizar (RF-16)", () => {
  const codigos = invitaciones.map((ficha) => String(ficha.codigo ?? "").trim().toLowerCase());
  for (const codigo of codigos) assert.ok(codigo, "hay una ficha sin código");
  assert.equal(new Set(codigos).size, codigos.length, "hay códigos duplicados");
});

test("la personalizada tiene la forma del contrato (RF-19)", () => {
  const personalizadas = porTipo("personalizada");
  assert.equal(personalizadas.length, 1);

  const ficha = personalizadas[0];
  for (const clave of CLAVES_CONTRATO) {
    assert.ok(clave in ficha, `la ficha personalizada no trae «${clave}»`);
  }
  assert.ok(String(ficha.guestName ?? "").trim(), "la personalizada no trae nombre");
  assert.ok(Number.isInteger(ficha.adultsGuests) && ficha.adultsGuests >= 1);
});

test("la personalizada trae lugares reservados y la genérica no (RF-17)", () => {
  const personalizada = porTipo("personalizada")[0];
  const reservados = reservedSeats(resolveInvitation(invitaciones, personalizada.codigo));
  assert.ok(Number.isInteger(reservados) && reservados >= 1);

  const generica = porTipo("generica")[0];
  assert.equal(reservedSeats(resolveInvitation(invitaciones, generica.codigo)), null);
});

test("ni las reutilizables ni la genérica registran nombre (RF-16)", () => {
  for (const ficha of [...porTipo("reutilizable"), ...porTipo("generica")]) {
    assert.equal(ficha.guestName, undefined, `${ficha.codigo} no debería llevar nombre`);
  }
});

test("cada ficha resuelve por su código, con su tipo y su límite (RF-16)", () => {
  for (const ficha of invitaciones) {
    const directa = resolveInvitation(invitaciones, ficha.codigo);
    assert.equal(directa.tipo, ficha.tipo, `no resuelve ${ficha.codigo}`);

    const normalizada = resolveInvitation(invitaciones, `  ${String(ficha.codigo).toUpperCase()}  `);
    assert.equal(normalizada.tipo, ficha.tipo, `no normaliza ${ficha.codigo}`);

    if (ficha.tipo === "reutilizable") {
      assert.equal(directa.limite, ficha.limite, `no conserva el límite de ${ficha.codigo}`);
    }
  }
});

test("ningún límite supera el máximo de la boda (RF-17)", () => {
  for (const ficha of invitaciones) {
    const limite = guestLimit(resolveInvitation(invitaciones, ficha.codigo), boda);
    assert.ok(
      limite <= boda.confirmacion.maximoBoda,
      `${ficha.codigo} supera el máximo de la boda`,
    );
  }
});

test("un código desconocido no personaliza nada (RF-17)", () => {
  const invitacion = resolveInvitation(invitaciones, "no-existe");
  assert.equal(invitacion.tipo, "desconocida");
  assert.equal(reservedSeats(invitacion), null);
});
