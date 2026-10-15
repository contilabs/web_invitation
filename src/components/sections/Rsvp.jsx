// Confirmación de asistencia (T27, RF-17, RF-18). El formulario se envía de forma nativa al
// canal del registro (`marca.enlaces.rsvp`, FormSubmit): sin `fetch`, se conservan el destino
// y la validación del navegador. Los campos y los textos salen del registro; el límite de
// asistentes sale del tipo de invitación y, en la personalizada, el nombre (y el acompañante)
// vienen de la ficha y no se editan.
import { useState } from "react";

import { invitaciones as defaultGuestCards } from "../../data/guest-cards.js";
import { useConfirmation } from "../../hooks/useConfirmation.js";
import { useInvitation } from "../../hooks/useInvitation.js";
import { useTemplate } from "../../hooks/useTemplate.js";
import { photoFor } from "../../services/photos.js";
import { confirmationFields, deadlineMs } from "../../utils/confirmation.js";
import { formatDate, eventTimeZone } from "../../utils/event.js";
import { INVITATION_TYPES } from "../../utils/invitation.js";

export function Rsvp({ wedding }) {
  const { open } = useConfirmation(wedding);
  const invitation = useInvitation(defaultGuestCards, wedding);
  const { structuralPhotos, photoSizes } = useTemplate();

  const confirmation = wedding?.confirmacion ?? {};
  const rsvpEndpoint = wedding?.marca?.enlaces?.rsvp ?? "";
  const fields = confirmationFields(confirmation);
  const hasField = (field) => fields.includes(field);

  const isPersonalized = invitation.type === INVITATION_TYPES.PERSONALIZED;
  const card = invitation.card ?? null;
  const cardName = isPersonalized ? String(card?.guestName ?? "").trim() : "";
  const partner = isPersonalized ? String(card?.partnerName ?? "").trim() : "";
  const reservedSeats = invitation.reservedSeats;
  const attendeeLimit = Number.isFinite(invitation.guestLimit) ? invitation.guestLimit : null;

  const [attendees, setAttendees] = useState(() =>
    reservedSeats !== null ? String(reservedSeats) : "1",
  );

  const exceeded = attendeeLimit !== null && Number(attendees) > attendeeLimit;
  const deadlineText = formatDate(deadlineMs(wedding), eventTimeZone(wedding?.evento));

  const subject = wedding?.marca?.nombre
    ? `Confirmación de asistencia — ${wedding.marca.nombre}`
    : "Confirmación de asistencia";

  return (
    <section className="rsvp reveal" id="confirmar">
      <div className="wrap">
        {confirmation.titulo && <h2>{confirmation.titulo}</h2>}

        {!open ? (
          <div className="rsvp-closed" role="status">
            <p className="section-note">El plazo para confirmar tu asistencia ya terminó.</p>
            {deadlineText && (
              <p className="help-text">La confirmación cerró el {deadlineText}.</p>
            )}
          </div>
        ) : (
          <div className="rsvp-grid">
            <figure className="rsvp-photo">
              <img
                {...photoFor(structuralPhotos.confirmation, "", photoSizes.confirmation)}
                loading="lazy"
                decoding="async"
              />
            </figure>

            <div className="rsvp-panel">
              <p className="rsvp-lead">
                Hemos reservado <span id="numero">{invitation.seatsText}</span> en tu honor
              </p>

              <form
                action={rsvpEndpoint}
                method="POST"
                acceptCharset="UTF-8"
                onSubmit={(event) => {
                  if (exceeded) event.preventDefault();
                }}
              >
                <input type="hidden" name="_subject" value={subject} />

                <div
                  className="field attendance"
                  role="radiogroup"
                  aria-labelledby="asistencia-titulo"
                >
                  <p className="attendance-title" id="asistencia-titulo">
                    ¿Nos acompañarás?
                  </p>
                  <div className="attendance-options">
                    <label className="attendance-option">
                      <input type="radio" name="asistencia" value="Sí, asistiré" required />
                      <span>Sí, asistiré</span>
                    </label>
                    <label className="attendance-option">
                      <input type="radio" name="asistencia" value="No podré asistir" required />
                      <span>No podré asistir</span>
                    </label>
                  </div>
                </div>

                {hasField("nombre") && (
                  <div className="field">
                    <label htmlFor="nombre">Tu nombre</label>
                    <input
                      type="text"
                      id="nombre"
                      name="nombre"
                      placeholder="Escribe tu nombre"
                      autoComplete="name"
                      defaultValue={cardName}
                      readOnly={isPersonalized && cardName !== ""}
                      required
                    />
                  </div>
                )}

                {partner && (
                  <>
                    <p className="help-text">
                      Te acompañará <strong>{partner}</strong>.
                    </p>
                    <input type="hidden" name="acompanante" value={partner} />
                  </>
                )}

                {hasField("asistentes") && (
                  <div className="field">
                    <label htmlFor="asistentes">Número de asistentes</label>
                    <input
                      type="number"
                      id="asistentes"
                      name="asistentes"
                      min={1}
                      max={attendeeLimit ?? undefined}
                      step={1}
                      inputMode="numeric"
                      value={attendees}
                      onChange={(event) => setAttendees(event.target.value)}
                      required
                    />
                    {attendeeLimit !== null && (
                      <p className="help-text">
                        {exceeded
                          ? `El máximo reservado son ${attendeeLimit === 1 ? "1 lugar" : `${attendeeLimit} lugares`}.`
                          : `Tienes ${attendeeLimit === 1 ? "1 lugar" : `${attendeeLimit} lugares`} disponibles.`}
                      </p>
                    )}
                  </div>
                )}

                {hasField("alergias") && (
                  <div className="field">
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

                {hasField("mensaje") && (
                  <div className="field">
                    <label htmlFor="mensaje">Mensaje para los novios</label>
                    <textarea
                      id="mensaje"
                      name="mensaje"
                      placeholder="Déjanos unas palabras"
                      rows={3}
                    ></textarea>
                  </div>
                )}

                <button type="submit" className="button button-solid" disabled={exceeded}>
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
