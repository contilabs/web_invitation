// Panel de lectura de la respuesta (T7, RF-10). Muestra datos en solo lectura,
// sin controles de formulario. Los textos de interfaz van en español.
function SummaryRow({ label, value }) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  return (
    <div className="summary-row">
      <span className="summary-label">{label}</span>
      <span className="summary-value">{value}</span>
    </div>
  );
}

export function ResponseSummary({
  name,
  attendees,
  adultsAttendees,
  childAttendees,
  message,
  restrictions,
  datetime,
  phone,
  extraRows = [],
}) {
  const hasAttendees = attendees !== null && attendees !== undefined;
  const hasAdults = adultsAttendees !== null && adultsAttendees !== undefined;
  const hasChildren = childAttendees !== null && childAttendees !== undefined;

  return (
    <div className="response-summary" role="region" aria-label="Resumen de la respuesta">
      <div className="summary-list">
        <SummaryRow label="Nombre" value={name} />
        {hasAttendees ? <SummaryRow label="Asistentes" value={attendees} /> : null}
        {hasAdults ? <SummaryRow label="Adultos" value={adultsAttendees} /> : null}
        {hasChildren ? <SummaryRow label="Niños" value={childAttendees} /> : null}
        {extraRows.map((row, index) =>
          row && row.label && (row.value !== null && row.value !== undefined && row.value !== "") ? (
            <SummaryRow key={row.id ?? index} label={row.label} value={row.value} />
          ) : null,
        )}
        <SummaryRow label="Mensaje" value={message} />
        <SummaryRow label="Restricciones" value={restrictions} />
        <SummaryRow label="Fecha" value={datetime} />
        <SummaryRow label="Teléfono" value={phone} />
      </div>
    </div>
  );
}