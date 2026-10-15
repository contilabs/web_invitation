// Pruebas de `regalos.js` (RF-10)
import { strict as assert } from "node:assert";
import test from "node:test";
import { giftOptions, copyableFields, copyableField, GIFT_TYPES } from "./gifts.js";

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
  const [tienda, transfer, efectivo] = giftOptions(REGALOS);
  assert.equal(tienda.tipo, GIFT_TYPES.STORE);
  assert.equal(transfer.tipo, GIFT_TYPES.TRANSFER);
  assert.equal(efectivo.tipo, GIFT_TYPES.CASH);
});

test("la transferencia trae varios datos copiables", () => {
  const transfer = giftOptions(REGALOS)[1];
  assert.equal(transfer.copyableFields.length, 2);
  assert.equal(transfer.copyableFields[1].valor, "0123");
});

test("el efectivo sin datos copiables devuelve array vacío", () => {
  const efectivo = giftOptions(REGALOS)[2];
  assert.deepEqual(efectivo.copyableFields, []);
});

test("distingue enlace ausente de enlace vacío", () => {
  assert.equal(copyableFields({ datosCopiables: [{ etiqueta: "x", valor: "  " }] }).length, 0);
  assert.equal(giftOptions({ opciones: [{ tipo: "tienda", etiqueta: "x", url: "" }] })[0].url, null);
});

test("sin opciones devuelve lista vacía", () => {
  assert.deepEqual(giftOptions({}), []);
  assert.deepEqual(giftOptions(null), []);
});

test("copyableField devuelve el dato marcado con `copiar`", () => {
  const transfer = giftOptions(REGALOS)[1];
  assert.deepEqual(transfer.copyableField, { etiqueta: "Cuenta", valor: "0123" });
});

test("copyableField cae al único dato cuando no hay marca", () => {
  assert.deepEqual(copyableField({ datosCopiables: [{ etiqueta: "CLABE", valor: "999" }] }), {
    etiqueta: "CLABE",
    valor: "999",
  });
});

test("copyableField no adivina si hay varios datos sin marca", () => {
  const varios = {
    datosCopiables: [
      { etiqueta: "Banco", valor: "BBVA" },
      { etiqueta: "Cuenta", valor: "0123" },
    ],
  };
  assert.equal(copyableField(varios), null);
});

test("copyableField sin datos copiables devuelve null", () => {
  assert.equal(copyableField({ datosCopiables: [] }), null);
  assert.equal(copyableField(null), null);
  assert.equal(giftOptions(REGALOS)[2].copyableField, null);
});
