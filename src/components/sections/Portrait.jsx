// Retrato de la pareja (T15, RF-2). Es decorativo (`aria-hidden`) y su foto es una de las
// claves estructurales de la plantilla.
import { useTemplate } from "../../hooks/useTemplate.js";
import { photoFor } from "../../services/photos.js";

export function Portrait() {
  const { structuralPhotos, photoSizes } = useTemplate();

  return (
    <section className="Nombres reveal" aria-hidden="true">
      <img
        {...photoFor(structuralPhotos.portrait, "", photoSizes.fullWidth)}
        loading="lazy"
        decoding="async"
      />
    </section>
  );
}
