import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { App } from "./App.jsx";

// Al recargar, la invitación empieza por la portada, no donde se quedó el scroll.
if ("scrollRestoration" in history) history.scrollRestoration = "manual";

// Punto de entrada de la app. El tema inicial ya lo fijó el script de `index.html`
// antes de pintar (RF-4); aquí solo montamos React.
createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
