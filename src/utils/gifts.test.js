// Pruebas de `regalos.js` (RF-10)
import { strict as assert } from "node:assert";
import test from "node:test";
import { giftOptions, copyableFields, copyableField, GIFT_TYPES } from "./gifts.js";

const GIFTS = {
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
  const [store, transfer, cash] = giftOptions(GIFTS);
  assert.equal(store.type, GIFT_TYPES.STORE);
  assert.equal(transfer.type, GIFT_TYPES.TRANSFER);
  assert.equal(cash.type, GIFT_TYPES.CASH);
});

test("la transferencia trae varios datos copiables", () => {
  const transfer = giftOptions(GIFTS)[1];
  assert.equal(transfer.copyableFields.length, 2);
  assert.equal(transfer.copyableFields[1].value, "0123");
});

test("el efectivo sin datos copiables devuelve array vacío", () => {
  const cashOption = giftOptions(GIFTS)[2];
  assert.deepEqual(cashOption.copyableFields, []);
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
  const transfer = giftOptions(GIFTS)[1];
  assert.deepEqual(transfer.copyableField, { label: "Cuenta", value: "0123" });
});

test("copyableField cae al único dato cuando no hay marca", () => {
  assert.deepEqual(copyableField({ datosCopiables: [{ etiqueta: "CLABE", valor: "999" }] }), {
    label: "CLABE",
    value: "999",
  });
});

test("copyableField no adivina si hay varios datos sin marca", () => {
  const several = {
    datosCopiables: [
      { etiqueta: "Banco", valor: "BBVA" },
      { etiqueta: "Cuenta", valor: "0123" },
    ],
  };
  assert.equal(copyableField(several), null);
});

test("copyableField sin datos copiables devuelve null", () => {
  assert.equal(copyableField({ datosCopiables: [] }), null);
  assert.equal(copyableField(null), null);
  assert.equal(giftOptions(GIFTS)[2].copyableField, null);
});
