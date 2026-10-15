// Pruebas de `invitacion.js` (RF-16, RF-17)
import { strict as assert } from "node:assert";
import test from "node:test";
import {
  leerCodigoDeInvitacion,
  resolverInvitacion,
  lugaresReservados,
  limiteDeAsistentes,
  asistentesDentroDelLimite,
  formatearLugares,
  TIPOS,
} from "./invitacion.js";

const FICHAS = [
  { codigo: "karina-gerardo-inv-001", tipo: "personalizada", lugaresReservados: 2, adultsGuests: 2 },
  { codigo: "rec-001", tipo: "reutilizable", limite: 2 },
  { codigo: "rec-bad", tipo: "reutilizable", limite: 0 },
  { codigo: "gen-001", tipo: "generica" },
];

const BODA = { confirmacion: { maximoBoda: 100 } };

test("leerCodigoDeInvitacion lee, recorta y normaliza", () => {
  assert.equal(leerCodigoDeInvitacion(new URLSearchParams("codigo=REC-001")), "rec-001");
  assert.equal(leerCodigoDeInvitacion(new URLSearchParams("code=abc")), "abc");
  assert.equal(leerCodigoDeInvitacion(new URLSearchParams("")), null);
  assert.equal(leerCodigoDeInvitacion(null), null);
});

test("resolverInvitacion resuelve los tres tipos", () => {
  assert.equal(resolverInvitacion(FICHAS, "karina-gerardo-inv-001").tipo, TIPOS.PERSONALIZADA);
  assert.equal(resolverInvitacion(FICHAS, "rec-001").tipo, TIPOS.REUTILIZABLE);
  assert.equal(resolverInvitacion(FICHAS, "gen-001").tipo, TIPOS.GENERICA);
});

test("resolverInvitacion: código ausente o desconocido → desconocida", () => {
  assert.equal(resolverInvitacion(FICHAS, null).tipo, TIPOS.DESCONOCIDA);
  assert.equal(resolverInvitacion(FICHAS, "no-existe").tipo, TIPOS.DESCONOCIDA);
});

test("resolverInvitacion: límite fuera de 1–10 es inválido", () => {
  assert.equal(resolverInvitacion(FICHAS, "rec-bad").tipo, TIPOS.DESCONOCIDA);
});

test("lugaresReservados solo en personalizada", () => {
  assert.equal(lugaresReservados(resolverInvitacion(FICHAS, "karina-gerardo-inv-001")), 2);
  assert.equal(lugaresReservados(resolverInvitacion(FICHAS, "rec-001")), null);
  assert.equal(lugaresReservados(resolverInvitacion(FICHAS, "gen-001")), null);
});

test("limiteDeAsistentes por tipo", () => {
  assert.equal(limiteDeAsistentes(resolverInvitacion(FICHAS, "rec-001"), BODA), 2);
  assert.equal(limiteDeAsistentes(resolverInvitacion(FICHAS, "karina-gerardo-inv-001"), BODA), 2);
  assert.equal(limiteDeAsistentes(resolverInvitacion(FICHAS, "gen-001"), BODA), 100);
});

test("asistentesDentroDelLimite incluye el borde", () => {
  assert.equal(asistentesDentroDelLimite(2, 2), true);
  assert.equal(asistentesDentroDelLimite(3, 2), false);
});

test("formatearLugares en español", () => {
  assert.equal(formatearLugares(1), "1 lugar");
  assert.equal(formatearLugares(4), "4 lugares");
  assert.equal(formatearLugares(0), "un lugar");
});
