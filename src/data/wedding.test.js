// Prueba de no regresión del registro de ejemplo (T30, RF-1, RF-19, RF-22).
//
// Comprueba que `src/data/wedding.js` conserva los datos de la boda actual (nombres, fecha,
// ubicaciones, cuenta y enlaces) y que el registro es coherente con la validación pura.
// En la spec 004 el invitado lo resuelve el servicio, así que `registryErrors` valida **solo
// el registro** (sin fichas; DT-8, D22) y el plazo y el destino del envío dejan de vivir aquí
// (RF-11, RF-14). No importa `services/photos.js`: usa `import.meta.glob`, que solo existe
// bajo Vite; la resolución de las claves se comprueba con `registryErrors` (RF-20).
import { strict as assert } from "node:assert";
import test from "node:test";
import { readdirSync } from "node:fs";

import { wedding } from "./wedding.js";
import { confirmationFields } from "../utils/confirmation.js";
import {
  formatDate,
  formatTime,
  eventInstant,
  eventTimeZone,
} from "../utils/event.js";
import { coupleNames } from "../utils/couple.js";
import { copyableField } from "../utils/gifts.js";
import { allowsChildren } from "../utils/restrictions.js";
import { remainingParts } from "../utils/countdown.js";
import { visibleSections } from "../utils/sections.js";
import { registryWarnings, registryErrors } from "../utils/validation.js";

// Instante con offset explícito: el formato esperado no depende de la zona de la máquina.
const EVENT_INSTANT = new Date("2027-11-01T16:30:00-06:00").getTime();

test("el registro de ejemplo es coherente (RF-20)", () => {
  assert.deepEqual(registryErrors(wedding), []);
  assert.deepEqual(registryWarnings(wedding), []);
});

test("la plantilla del registro es la clásica (RF-15)", () => {
  assert.equal(wedding.plantilla, "clasica");
});

test("conserva los nombres de la pareja (RF-2, RF-22)", () => {
  assert.deepEqual(coupleNames(wedding.pareja), {
    first: "Karina",
    second: "Gerardo",
    display: "Karina y Gerardo",
  });
});

test("conserva la fecha, la hora y la zona del evento (RF-3, RF-22)", () => {
  assert.equal(wedding.evento.fechaInicio, "2027-11-01T16:30:00");
  assert.equal(eventTimeZone(wedding.evento), "America/Mexico_City");
  assert.equal(wedding.evento.lugar, "Guadalajara");
  assert.ok(
    Number.isFinite(eventInstant(wedding.evento)),
    "la fecha del registro no da un instante válido",
  );
  assert.equal(formatDate(EVENT_INSTANT, "America/Mexico_City"), "01 de noviembre de 2027");
  assert.equal(formatTime(EVENT_INSTANT, "America/Mexico_City"), "16:30 h");
});

test("conserva las ubicaciones con su enlace de mapa (RF-5, RF-22)", () => {
  const { ceremonia, recepcion } = wedding.ubicaciones;
  assert.equal(ceremonia.nombre, "Ceremonia religiosa");
  assert.equal(ceremonia.lugar, "La Santísima Trinidad");
  assert.equal(ceremonia.hora, "16:30 h");
  assert.match(ceremonia.mapaUrl, /^https:\/\//);
  assert.equal(recepcion.nombre, "Recepción");
  assert.equal(recepcion.lugar, "Monte Piedra");
  assert.equal(recepcion.hora, "19:30 hrs");
  assert.match(recepcion.mapaUrl, /^https:\/\//);
});

test("conserva la mesa de regalos con su cuenta copiable (RF-10, RF-22)", () => {
  const transfer = wedding.regalos.opciones.find((option) => option.tipo === "transferencia");
  assert.ok(transfer, "falta la opción de transferencia");

  const labels = transfer.datosCopiables.map((item) => item.etiqueta);
  assert.ok(labels.some((label) => /Banco/i.test(label)));
  assert.ok(labels.some((label) => /Titular/i.test(label)));
  assert.ok(labels.some((label) => /Cuenta|CLABE/i.test(label)));

  const bank = transfer.datosCopiables.find((item) => /Banco/i.test(item.etiqueta));
  assert.equal(bank.valor, "BBVA");
  for (const item of transfer.datosCopiables) {
    assert.ok(String(item.valor ?? "").trim(), `dato copiable vacío: ${item.etiqueta}`);
  }
});

test("la transferencia expone un único dato copiable: la cuenta (RF-10)", () => {
  const transfer = wedding.regalos.opciones.find((option) => option.tipo === "transferencia");
  const copyable = copyableField(transfer);
  assert.ok(copyable, "la transferencia no expone ningún dato copiable");
  assert.equal(copyable.label, "Cuenta");
  assert.equal(copyable.value, "012320015636927951");

  const marked = transfer.datosCopiables.filter((item) => item.copiar === true);
  assert.equal(marked.length, 1, "debe haber exactamente un dato marcado como copiable");
});

test("conserva todos los enlaces de la boda en https (RF-5, RF-16)", () => {
  const links = [];
  for (const location of Object.values(wedding.ubicaciones)) {
    if (location?.mapaUrl) links.push(["ubicaciones.mapaUrl", location.mapaUrl]);
  }
  for (const hotel of wedding.hoteles.lista) {
    if (hotel.bookingUrl) links.push(["hoteles.bookingUrl", hotel.bookingUrl]);
    if (hotel.mapaUrl) links.push(["hoteles.mapaUrl", hotel.mapaUrl]);
  }
  for (const option of wedding.regalos.opciones) {
    if (option.url) links.push(["regalos.url", option.url]);
  }
  links.push(["marca.enlaces.credito", wedding.marca.enlaces.credito]);

  for (const [field, url] of links) {
    assert.match(String(url), /^https:\/\//, `${field} no es https: ${url}`);
  }
});

test("el catálogo de secciones sale en orden y omite las vacías (RF-4)", () => {
  assert.deepEqual(
    visibleSections(wedding).map((section) => section.key),
    [
      "portada",
      "pareja",
      "familia",
      "cuentaRegresiva",
      "ubicaciones",
      "historia",
      "itinerario",
      "soloAdultos",
      "regalos",
      "hoteles",
      "confirmacion",
      "restricciones",
      "galeria",
    ],
  );
});

test("conserva la galería y la portada del registro (RF-9, RF-22)", () => {
  const dscKeys = readdirSync(new URL("../../assets/photos/opt/", import.meta.url), { recursive: true })
    .map((path) => path.split(/[\\/]/).pop())
    .filter((name) => /^DSC.*\.(jpg|jpeg|png)$/i.test(name) && !/copy/i.test(name))
    .map((name) => name.replace(/\.[^.]+$/, ""))
    .sort();
  assert.equal(wedding.galeria.destacadas, dscKeys.length);
  assert.deepEqual(wedding.galeria.imagenes.map(({ clave }) => clave).sort(), dscKeys);
  assert.equal(new Set(wedding.galeria.imagenes.map(({ clave }) => clave)).size, dscKeys.length);
  for (const [i, image] of wedding.galeria.imagenes.entries()) {
    assert.ok(String(image.clave ?? "").trim(), `la imagen ${i + 1} de la galería no tiene clave`);
    assert.ok(String(image.alt ?? "").trim(), `la imagen ${i + 1} de la galería no tiene alt`);
  }
  assert.equal(wedding.portada.imagenes.length, 2);
  for (const image of wedding.portada.imagenes) {
    assert.ok(String(image.clave ?? "").trim(), "la portada trae una imagen sin clave");
  }
});

test("la confirmación conserva título, descripción y campos, sin plazo ni envío (RF-11, RF-14, RF-18)", () => {
  assert.equal(wedding.confirmacion.titulo, "Confirmar asistencia");
  assert.ok(String(wedding.confirmacion.descripcion ?? "").trim());
  assert.deepEqual(confirmationFields(wedding.confirmacion), [
    "nombre",
    "asistentes",
    "alergias",
    "mensaje",
  ]);
  // El plazo lo da el servicio (RF-11) y el envío va al servicio (RF-14): el registro ya no
  // declara ninguno de los dos.
  assert.equal(wedding.confirmacion.fechaLimite, undefined);
  assert.equal(wedding.marca.enlaces.rsvp, undefined);
});

test("los niños están permitidos cuando la boda no lo indica (RF-12)", () => {
  assert.equal(allowsChildren(wedding), true);
});

test("conserva todos los nombres de padres y padrinos, en el orden proporcionado", () => {
  assert.deepEqual(wedding.familia.grupos.map((group) => group.categorias.map((category) => category.nombres)), [
    [
      ["Blanca Delia Macías Rocha", "Raúl Muñoz Márquez"],
      ["Maria Elena Ascencio Villamil", "Ernesto Calzada Castillo"],
    ],
    [
      ["Maria Elena Ascencio Villamil", "Ernesto Calzada Castillo"],
      ["Maria de Lourdes Gomez Rocha", "Mauricio Gomez Rocha"],
    ],
  ]);
});

test("el título que React toma del registro es Naomi y Andrés", () => {
  assert.equal(wedding.marca.nombre, "Naomi & Andrés");
});

test("el contador apunta a medianoche del 13 de marzo de 2027 en México, independiente del dispositivo", () => {
  const target = eventInstant(wedding.cuentaRegresiva);
  assert.equal(eventTimeZone(wedding.cuentaRegresiva), "America/Mexico_City");
  assert.equal(target, Date.parse("2027-03-13T06:00:00Z"));
  assert.equal(formatDate(target, "America/Mexico_City"), "13 de marzo de 2027");
  for (const now of ["2027-03-12T23:59:59-06:00", "2027-03-13T14:59:59+09:00", "2027-03-13T05:59:59Z"]) {
    assert.deepEqual(remainingParts(target, Date.parse(now)), {
      days: 0, hours: 0, minutes: 0, seconds: 1, done: false,
    });
  }
  for (const now of [target, target + 1000, target + 86400000]) {
    assert.deepEqual(remainingParts(target, now), {
      days: 0, hours: 0, minutes: 0, seconds: 0, done: true,
    });
  }
});
