// Confirmación de asistencia (T27, RF-17, RF-18). El formulario se envía de forma nativa al
// canal del registro (`marca.enlaces.rsvp`, FormSubmit): sin `fetch`, se conservan el destino
// y la validación del navegador. Los campos y los textos salen del registro; el límite de
// asistentes sale del tipo de invitación y, en la personalizada, el nombre (y el acompañante)
// vienen de la ficha y no se editan.
import { useState } from "react";

import { invitaciones as invitacionesPorDefecto } from "../data/guest-cards.js";
import { useConfirmacion } from "../hooks/useConfirmacion.js";
import { useInvitacion } from "../hooks/useInvitacion.js";
import { useTemplate } from "../hooks/useTemplate.js";
import { photoFor } from "../services/photos.js";
import { confirmationFields, deadlineMs } from "../utils/confirmation.js";
import { formatDate, eventTimeZone } from "../utils/event.js";
import { INVITATION_TYPES } from "../utils/invitation.js";

export function Confirmacion({ boda }) {
  const { abierta } = useConfirmacion(boda);
  const invitacion = useInvitacion(invitacionesPorDefecto, boda);
  const { structuralPhotos, photoSizes } = useTemplate();

  const confirmacion = boda?.confirmacion ?? {};
  const enlaceRsvp = boda?.marca?.enlaces?.rsvp ?? "";
  const campos = confirmationFields(confirmacion);
  const tieneCampo = (campo) => campos.includes(campo);

  const esPersonalizada = invitacion.tipo === INVITATION_TYPES.PERSONALIZED;
  const ficha = invitacion.ficha ?? null;
  const nombreFicha = esPersonalizada ? String(ficha?.guestName ?? "").trim() : "";
  const acompanante = esPersonalizada ? String(ficha?.partnerName ?? "").trim() : "";
  const reservados = invitacion.reservedSeats;
  const limite = Number.isFinite(invitacion.limiteAsistentes)
    ? invitacion.limiteAsistentes
    : null;

  const [asistentes, setAsistentes] = useState(() =>
    reservados !== null ? String(reservados) : "1",
  );

  const excedido = limite !== null && Number(asistentes) > limite;
  const fechaLimite = formatDate(deadlineMs(boda), eventTimeZone(boda?.evento));

  const asunto = boda?.marca?.nombre
    ? `Confirmación de asistencia — ${boda.marca.nombre}`
    : "Confirmación de asistencia";

  return (
    <section className="Confirmacion reveal" id="confirmar">
      <div className="wrap">
        {confirmacion.titulo && <h2>{confirmacion.titulo}</h2>}

        {!abierta ? (
          <div className="confirmacion-cerrada" role="status">
            <p className="mesa-nota">El plazo para confirmar tu asistencia ya terminó.</p>
            {fechaLimite && (
              <p className="ayuda">La confirmación cerró el {fechaLimite}.</p>
            )}
          </div>
        ) : (
          <div className="confirmar-rejilla">
            <figure className="confirmar-foto">
              <img
                {...photoFor(structuralPhotos.confirmation, "", photoSizes.confirmation)}
                loading="lazy"
                decoding="async"
              />
            </figure>

            <div className="confirmar-panel">
              <p className="reserva">
                Hemos reservado <span id="numero">{invitacion.lugaresTexto}</span> en tu honor
              </p>

              <form
                action={enlaceRsvp}
                method="POST"
                acceptCharset="UTF-8"
                onSubmit={(evento) => {
                  if (excedido) evento.preventDefault();
                }}
              >
                <input type="hidden" name="_subject" value={asunto} />

                <div
                  className="campo asistencia"
                  role="radiogroup"
                  aria-labelledby="asistencia-titulo"
                >
                  <p className="asistencia-titulo" id="asistencia-titulo">
                    ¿Nos acompañarás?
                  </p>
                  <div className="asistencia-opciones">
                    <label className="asistencia-opcion">
                      <input type="radio" name="asistencia" value="Sí, asistiré" required />
                      <span>Sí, asistiré</span>
                    </label>
                    <label className="asistencia-opcion">
                      <input type="radio" name="asistencia" value="No podré asistir" required />
                      <span>No podré asistir</span>
                    </label>
                  </div>
                </div>

                {tieneCampo("nombre") && (
                  <div className="campo">
                    <label htmlFor="nombre">Tu nombre</label>
                    <input
                      type="text"
                      id="nombre"
                      name="nombre"
                      placeholder="Escribe tu nombre"
                      autoComplete="name"
                      defaultValue={nombreFicha}
                      readOnly={esPersonalizada && nombreFicha !== ""}
                      required
                    />
                  </div>
                )}

                {acompanante && (
                  <>
                    <p className="ayuda">
                      Te acompañará <strong>{acompanante}</strong>.
                    </p>
                    <input type="hidden" name="acompanante" value={acompanante} />
                  </>
                )}

                {tieneCampo("asistentes") && (
                  <div className="campo">
                    <label htmlFor="asistentes">Número de asistentes</label>
                    <input
                      type="number"
                      id="asistentes"
                      name="asistentes"
                      min={1}
                      max={limite ?? undefined}
                      step={1}
                      inputMode="numeric"
                      value={asistentes}
                      onChange={(evento) => setAsistentes(evento.target.value)}
                      required
                    />
                    {limite !== null && (
                      <p className="ayuda">
                        {excedido
                          ? `El máximo reservado son ${limite === 1 ? "1 lugar" : `${limite} lugares`}.`
                          : `Tienes ${limite === 1 ? "1 lugar" : `${limite} lugares`} disponibles.`}
                      </p>
                    )}
                  </div>
                )}

                {tieneCampo("alergias") && (
                  <div className="campo">
                    <label htmlFor="alergias">Alergias o restricciones alimentarias</label>
                    <input
                      type="text"
                      id="alergias"
                      name="alergias"
                      placeholder="Opcional"
                      autoComplete="off"
                    />
                  </div>
                )}

                {tieneCampo("mensaje") && (
                  <div className="campo">
                    <label htmlFor="mensaje">Mensaje para los novios</label>
                    <textarea
                      id="mensaje"
                      name="mensaje"
                      placeholder="Déjanos unas palabras"
                      rows={3}
                    ></textarea>
                  </div>
                )}

                <button type="submit" className="boton boton-solido" disabled={excedido}>
                  Enviar confirmación
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
