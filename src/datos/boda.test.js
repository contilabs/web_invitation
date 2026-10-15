// Prueba de no regresión del registro de ejemplo (T30, RF-1, RF-19, RF-22).
//
// Comprueba que `src/datos/boda.js` conserva los datos de la boda actual (nombres, fecha,
// ubicaciones, cuenta y enlaces) y que el registro es coherente con la validación pura.
// No importa `componentes/fotos.js`: usa `import.meta.glob`, que solo existe bajo Vite; la
// resolución de las claves se comprueba con `erroresDelRegistro` (RF-20).
import { strict as assert } from "node:assert";
import test from "node:test";

import { boda } from "./boda.js";
import { invitaciones } from "./invitaciones.js";
import {
  camposDeConfirmacion,
  confirmacionAbierta,
  fechaLimiteMs,
} from "../logica/confirmacion.js";
import {
  formatearFecha,
  formatearHora,
  instanteDelEvento,
  zonaHorariaDelEvento,
} from "../logica/evento.js";
import { nombresDeLaPareja } from "../logica/pareja.js";
import { datoCopiable } from "../logica/regalos.js";
import { permiteNinos } from "../logica/restricciones.js";
import { seccionesVisibles } from "../logica/secciones.js";
import { avisosDelRegistro, erroresDelRegistro } from "../logica/validacion.js";

// Instante con offset explícito: el formato esperado no depende de la zona de la máquina.
const INSTANTE_FECHA = new Date("2027-11-01T16:30:00-06:00").getTime();

test("el registro de ejemplo es coherente (RF-20)", () => {
  assert.deepEqual(erroresDelRegistro(boda, invitaciones), []);
  assert.deepEqual(avisosDelRegistro(boda), []);
});

test("la plantilla del registro es la clásica (RF-15)", () => {
  assert.equal(boda.plantilla, "clasica");
});

test("conserva los nombres de la pareja (RF-2, RF-22)", () => {
  assert.deepEqual(nombresDeLaPareja(boda.pareja), {
    primera: "Karina",
    segunda: "Gerardo",
    paraMostrar: "Karina y Gerardo",
  });
});

test("conserva la fecha, la hora y la zona del evento (RF-3, RF-22)", () => {
  assert.equal(boda.evento.fechaInicio, "2027-11-01T16:30:00");
  assert.equal(zonaHorariaDelEvento(boda.evento), "America/Mexico_City");
  assert.equal(boda.evento.lugar, "Guadalajara");
  assert.ok(
    Number.isFinite(instanteDelEvento(boda.evento)),
    "la fecha del registro no da un instante válido",
  );
  assert.equal(formatearFecha(INSTANTE_FECHA, "America/Mexico_City"), "01 de noviembre de 2027");
  assert.equal(formatearHora(INSTANTE_FECHA, "America/Mexico_City"), "16:30 h");
});

test("conserva las ubicaciones con su enlace de mapa (RF-5, RF-22)", () => {
  const { ceremonia, recepcion } = boda.ubicaciones;
  assert.equal(ceremonia.nombre, "Ceremonia religiosa");
  assert.equal(ceremonia.lugar, "Parroquia Santa María de Guadalupe");
  assert.equal(ceremonia.hora, "16:30 h");
  assert.match(ceremonia.mapaUrl, /^https:\/\//);
  assert.equal(recepcion.nombre, "Recepción");
  assert.equal(recepcion.lugar, "Los Agaves Eventos");
  assert.match(recepcion.mapaUrl, /^https:\/\//);
});

test("conserva la mesa de regalos con su cuenta copiable (RF-10, RF-22)", () => {
  const transferencia = boda.regalos.opciones.find((opcion) => opcion.tipo === "transferencia");
  assert.ok(transferencia, "falta la opción de transferencia");

  const etiquetas = transferencia.datosCopiables.map((dato) => dato.etiqueta);
  assert.ok(etiquetas.some((etiqueta) => /Banco/i.test(etiqueta)));
  assert.ok(etiquetas.some((etiqueta) => /Titular/i.test(etiqueta)));
  assert.ok(etiquetas.some((etiqueta) => /Cuenta|CLABE/i.test(etiqueta)));

  const banco = transferencia.datosCopiables.find((dato) => /Banco/i.test(dato.etiqueta));
  assert.equal(banco.valor, "BBVA");
  for (const dato of transferencia.datosCopiables) {
    assert.ok(String(dato.valor ?? "").trim(), `dato copiable vacío: ${dato.etiqueta}`);
  }
});

test("la transferencia expone un único dato copiable: la cuenta (RF-10)", () => {
  const transferencia = boda.regalos.opciones.find((opcion) => opcion.tipo === "transferencia");
  const copiable = datoCopiable(transferencia);
  assert.ok(copiable, "la transferencia no expone ningún dato copiable");
  assert.equal(copiable.etiqueta, "Cuenta");
  assert.equal(copiable.valor, "012320015636927951");

  const marcados = transferencia.datosCopiables.filter((dato) => dato.copiar === true);
  assert.equal(marcados.length, 1, "debe haber exactamente un dato marcado como copiable");
});

test("conserva todos los enlaces de la boda en https (RF-5, RF-11, RF-14, RF-22)", () => {
  const enlaces = [];
  for (const ubicacion of Object.values(boda.ubicaciones)) {
    if (ubicacion?.mapaUrl) enlaces.push(["ubicaciones.mapaUrl", ubicacion.mapaUrl]);
  }
  for (const hotel of boda.hoteles.lista) {
    if (hotel.bookingUrl) enlaces.push(["hoteles.bookingUrl", hotel.bookingUrl]);
    if (hotel.mapaUrl) enlaces.push(["hoteles.mapaUrl", hotel.mapaUrl]);
  }
  for (const opcion of boda.regalos.opciones) {
    if (opcion.url) enlaces.push(["regalos.url", opcion.url]);
  }
  enlaces.push(["marca.enlaces.credito", boda.marca.enlaces.credito]);
  enlaces.push(["marca.enlaces.rsvp", boda.marca.enlaces.rsvp]);

  for (const [campo, url] of enlaces) {
    assert.match(String(url), /^https:\/\//, `${campo} no es https: ${url}`);
  }
  assert.match(boda.marca.enlaces.rsvp, /formsubmit\.co/);
});

test("el catálogo de secciones sale en orden y omite las vacías (RF-4)", () => {
  assert.deepEqual(
    seccionesVisibles(boda).map((seccion) => seccion.clave),
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
  assert.equal(boda.galeria.destacadas, 7);
  assert.equal(boda.galeria.imagenes.length, 13);
  for (const [i, imagen] of boda.galeria.imagenes.entries()) {
    assert.ok(String(imagen.clave ?? "").trim(), `la imagen ${i + 1} de la galería no tiene clave`);
    assert.ok(String(imagen.alt ?? "").trim(), `la imagen ${i + 1} de la galería no tiene alt`);
  }
  assert.equal(boda.portada.imagenes.length, 2);
  for (const imagen of boda.portada.imagenes) {
    assert.ok(String(imagen.clave ?? "").trim(), "la portada trae una imagen sin clave");
  }
});

test("conserva el plazo, los campos y el máximo de la confirmación (RF-18, RF-22)", () => {
  assert.equal(boda.confirmacion.maximoBoda, 100);
  assert.deepEqual(camposDeConfirmacion(boda.confirmacion), [
    "nombre",
    "asistentes",
    "alergias",
    "mensaje",
  ]);

  const limite = fechaLimiteMs(boda);
  assert.ok(Number.isFinite(limite), "la fecha límite del registro no es válida");
  assert.equal(confirmacionAbierta(boda, limite - 1_000), true, "debería estar abierta antes del plazo");
  assert.equal(confirmacionAbierta(boda, limite + 1_000), false, "debería estar cerrada tras el plazo");
});

test("los niños están permitidos cuando la boda no lo indica (RF-12)", () => {
  assert.equal(permiteNinos(boda), true);
});
