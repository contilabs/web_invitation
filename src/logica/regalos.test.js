// Pruebas de `regalos.js` (RF-10)
import { strict as assert } from "node:assert";
import test from "node:test";
import { opcionesDeRegalo, datosCopiables, datoCopiable, TIPOS_REGALO } from "./regalos.js";

const REGALOS = {
  opciones: [
    { tipo: "tienda", etiqueta: "Liverpool", descripcion: "Mesa", url: "https://liverpool.com" },
    {
      tipo: "transferencia",
      etiqueta: "BBVA",
      url: null,
      datosCopiables: [
        { etiqueta: "Banco", valor: "BBVA" },
        { etiqueta: "Cuenta", valor: "0123", copiar: true },
      ],
    },
    { tipo: "efectivo", etiqueta: "Sobres", descripcion: "", url: null, datosCopiables: [] },
  ],
};

test("normaliza los tres tipos", () => {
  const [tienda, transfer, efectivo] = opcionesDeRegalo(REGALOS);
  assert.equal(tienda.tipo, TIPOS_REGALO.TIENDA);
  assert.equal(transfer.tipo, TIPOS_REGALO.TRANSFERENCIA);
  assert.equal(efectivo.tipo, TIPOS_REGALO.EFECTIVO);
});

test("la transferencia trae varios datos copiables", () => {
  const transfer = opcionesDeRegalo(REGALOS)[1];
  assert.equal(transfer.datosCopiables.length, 2);
  assert.equal(transfer.datosCopiables[1].valor, "0123");
});

test("el efectivo sin datos copiables devuelve array vacío", () => {
  const efectivo = opcionesDeRegalo(REGALOS)[2];
  assert.deepEqual(efectivo.datosCopiables, []);
});

test("distingue enlace ausente de enlace vacío", () => {
  assert.equal(datosCopiables({ datosCopiables: [{ etiqueta: "x", valor: "  " }] }).length, 0);
  assert.equal(opcionesDeRegalo({ opciones: [{ tipo: "tienda", etiqueta: "x", url: "" }] })[0].url, null);
});

test("sin opciones devuelve lista vacía", () => {
  assert.deepEqual(opcionesDeRegalo({}), []);
  assert.deepEqual(opcionesDeRegalo(null), []);
});

test("datoCopiable devuelve el dato marcado con `copiar`", () => {
  const transfer = opcionesDeRegalo(REGALOS)[1];
  assert.deepEqual(transfer.datoCopiable, { etiqueta: "Cuenta", valor: "0123" });
});

test("datoCopiable cae al único dato cuando no hay marca", () => {
  assert.deepEqual(datoCopiable({ datosCopiables: [{ etiqueta: "CLABE", valor: "999" }] }), {
    etiqueta: "CLABE",
    valor: "999",
  });
});

test("datoCopiable no adivina si hay varios datos sin marca", () => {
  const varios = {
    datosCopiables: [
      { etiqueta: "Banco", valor: "BBVA" },
      { etiqueta: "Cuenta", valor: "0123" },
    ],
  };
  assert.equal(datoCopiable(varios), null);
});

test("datoCopiable sin datos copiables devuelve null", () => {
  assert.equal(datoCopiable({ datosCopiables: [] }), null);
  assert.equal(datoCopiable(null), null);
  assert.equal(opcionesDeRegalo(REGALOS)[2].datoCopiable, null);
});
