import { useState } from "react";
import storyPainting480 from "../../../assets/photos/opt/story-painting-480.webp";
import storyPainting768 from "../../../assets/photos/opt/story-painting-768.webp";
import storyPainting1113 from "../../../assets/photos/opt/story-painting-1113.webp";

// Sección «historia»: solo la pintura de la plantilla, sin texto superpuesto.
export function Story() {
  const [paintingReady, setPaintingReady] = useState(false);
  const sectionClass = typeof IntersectionObserver === "undefined" ? "story" : "story reveal";

  return (
    <section className={sectionClass} id="historia" data-painting-ready={paintingReady}>
      <img
        className="story-painting soft-mask-reveal"
        src={storyPainting1113}
        srcSet={`${storyPainting480} 480w, ${storyPainting768} 768w, ${storyPainting1113} 1113w`}
        sizes="100vw"
        alt="Pintura de la pareja con una cita de Mario Benedetti"
        width={1113}
        height={960}
        loading="lazy"
        decoding="async"
        onLoad={() => setPaintingReady(true)}
      />
    </section>
  );
}
