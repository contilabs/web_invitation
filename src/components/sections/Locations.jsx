// Ubicaciones (ceremonia y recepción) con su enlace de mapa (T15, RF-5, RF-6). Los datos y
// el título salen del registro; aquí viven los rótulos de los enlaces.
import { useTemplate } from "../../hooks/useTemplate.js";

function mapLink(location) {
  if (location?.mapaUrl) return location.mapaUrl;
  const query = [location?.lugar, location?.direccion].filter(Boolean).join(", ");
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

function LocationCard({ icon, location }) {
  return (
    <article className="ceremony-place">
      {icon && <img className="ceremony-image" src={icon} alt="" loading="lazy" decoding="async" />}
      <h3>{location?.nombre}</h3>
      {location?.lugar && <p className="ceremony-name">{location.lugar}</p>}
      <p className="place-detail">
        {location?.direccion}
        {location?.hora && <span className="chip">{location.hora}</span>}
      </p>
      <a
        className="button button-outline"
        href={mapLink(location)}
        target="_blank"
        rel="noopener noreferrer"
      >
          <svg className="location-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
            <path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z" />
            <circle cx="12" cy="10" r="2.5" />
          </svg>
        Ubicación
      </a>
    </article>
  );
}

export function Locations({ locations }) {
  const { icons } = useTemplate();
  const places = ["ceremonia", "recepcion"]
    .map((key) => ({ key, ...(locations?.[key] ?? {}) }))
    .filter((place) => place.nombre || place.lugar || place.direccion);

  return (
    <section className="locations reveal" id="lugares">
      <div className="wrap">
        {locations?.titulo && <h2>{locations.titulo}</h2>}

        <div className="grid-2">
          {places.map((place) => (
            <LocationCard key={place.key} icon={icons.locations[place.key]} location={place} />
          ))}
        </div>
      </div>
    </section>
  );
}
