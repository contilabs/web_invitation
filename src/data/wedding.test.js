// Prueba de no regresión del registro de ejemplo (T30, RF-1, RF-19, RF-22).
//
// Comprueba que `src/data/wedding.js` conserva los datos de la boda actual (nombres, fecha,
// ubicaciones, cuenta y enlaces) y que el registro es coherente con la validación pura.
// No importa `services/photos.js`: usa `import.meta.glob`, que solo existe bajo Vite; la
// resolución de las claves se comprueba con `registryErrors` (RF-20).
import { strict as assert } from "node:assert";
import test from "node:test";

import { wedding } from "./wedding.js";
import { guestCards } from "./guest-cards.js";
import {
  confirmationFields,
  isConfirmationOpen,
  deadlineMs,
} from "../utils/confirmation.js";
import {
  formatDate,
  formatTime,
  eventInstant,
  eventTimeZone,
} from "../utils/event.js";
import { coupleNames } from "../utils/couple.js";
import { copyableField } from "../utils/gifts.js";
import { allowsChildren } from "../utils/restrictions.js";
import { visibleSections } from "../utils/sections.js";
import { registryWarnings, registryErrors } from "../utils/validation.js";

// Instante con offset explícito: el formato esperado no depende de la zona de la máquina.
const EVENT_INSTANT = new Date("2027-11-01T16:30:00-06:00").getTime();

test("el registro de ejemplo es coherente (RF-20)", () => {
  assert.deepEqual(registryErrors(wedding, guestCards), []);
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
  assert.equal(ceremonia.lugar, "Parroquia Santa María de Guadalupe");
  assert.equal(ceremonia.hora, "16:30 h");
  assert.match(ceremonia.mapaUrl, /^https:\/\//);
  assert.equal(recepcion.nombre, "Recepción");
  assert.equal(recepcion.lugar, "Los Agaves Eventos");
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

test("conserva todos los enlaces de la boda en https (RF-5, RF-11, RF-14, RF-22)", () => {
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
  links.push(["marca.enlaces.rsvp", wedding.marca.enlaces.rsvp]);

  for (const [field, url] of links) {
    assert.match(String(url), /^https:\/\//, `${field} no es https: ${url}`);
  }
  assert.match(wedding.marca.enlaces.rsvp, /formsubmit\.co/);
});

test("el catálogo de secciones sale en orden y omite las vacías (RF-4)", () => {
  assert.deepEqual(
    visibleSections(wedding).map((section) => section.key),
    [
      "portada",
      "pareja",
      "cita",
      "historia",
      "ubicaciones",
      "itinerario",
      "regalos",
      "hoteles",
      "confirmacion",
      "galeria",
    ],
  );
});

test("conserva la galería y la portada del registro (RF-9, RF-22)", () => {
  assert.equal(wedding.galeria.destacadas, 7);
  assert.equal(wedding.galeria.imagenes.length, 13);
  for (const [i, image] of wedding.galeria.imagenes.entries()) {
    assert.ok(String(image.clave ?? "").trim(), `la imagen ${i + 1} de la galería no tiene clave`);
    assert.ok(String(image.alt ?? "").trim(), `la imagen ${i + 1} de la galería no tiene alt`);
  }
  assert.equal(wedding.portada.imagenes.length, 2);
  for (const image of wedding.portada.imagenes) {
    assert.ok(String(image.clave ?? "").trim(), "la portada trae una imagen sin clave");
  }
});

test("conserva el plazo, los campos y el máximo de la confirmación (RF-18, RF-22)", () => {
  assert.equal(wedding.confirmacion.maximoBoda, 100);
  assert.deepEqual(confirmationFields(wedding.confirmacion), [
    "nombre",
    "asistentes",
    "alergias",
    "mensaje",
  ]);

  const limit = deadlineMs(wedding);
  assert.ok(Number.isFinite(limit), "la fecha límite del registro no es válida");
  assert.equal(isConfirmationOpen(wedding, limit - 1_000), true, "debería estar abierta antes del plazo");
  assert.equal(isConfirmationOpen(wedding, limit + 1_000), false, "debería estar cerrada tras el plazo");
});

test("los niños están permitidos cuando la boda no lo indica (RF-12)", () => {
  assert.equal(allowsChildren(wedding), true);
});
