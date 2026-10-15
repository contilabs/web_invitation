// Ubicaciones (ceremonia y recepción) con su enlace de mapa (T15, RF-5, RF-6). Los datos y
// el título salen del registro; aquí solo vive el rótulo «Cómo llegar».
import { useTemplate } from "../../hooks/useTemplate.js";

function mapLink(location) {
  if (location?.mapaUrl) return location.mapaUrl;
  const query = [location?.lugar, location?.direccion].filter(Boolean).join(", ");
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

function LocationCard({ icon, location }) {
  const details = [location?.lugar, location?.direccion].filter(Boolean).join(" · ");

  return (
    <article className="place-card">
      {icon && <img className="icon" src={icon} alt="" loading="lazy" decoding="async" />}
      <h3>{location?.nombre}</h3>
      <p className="place-detail">
        {details}
        {location?.hora && <span className="chip">{location.hora}</span>}
      </p>
      <a
        className="button button-outline"
        href={mapLink(location)}
        target="_blank"
        rel="noopener noreferrer"
      >
        Cómo llegar
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
