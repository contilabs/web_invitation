// Selector nativo de asistentes (T7, RF-4). Muestra un rango 0..cupo con la opción 0
// y enlaza el texto de ayuda con aria-describedby.
export function AttendeeSelect({
  id,
  label = "Asistentes",
  value,
  options = [],
  onChange,
  helpText,
}) {
  const describedBy = helpText ? `${id}-help` : undefined;

  return (
    <div className="form-group">
      {label ? (
        <label htmlFor={id} className="form-label">
          {label}
        </label>
      ) : null}
      <select
        id={id}
        className="form-control"
        value={value}
        onChange={(event) => {
          if (onChange) {
            onChange(event.target.value);
          }
        }}
        aria-describedby={describedBy}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {helpText ? (
        <small id={describedBy} className="form-help">
          {helpText}
        </small>
      ) : null}
    </div>
  );
}