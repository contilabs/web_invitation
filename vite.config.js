import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// `base` relativo (T3, RNF-6): aún no hay una URL de publicación confirmada, así que el
// build genera rutas relativas a cada archivo. Así la invitación —y los enlaces ya
// repartidos del tipo `…/index.html?invitados=3`— funcionan en cualquier subruta o
// dominio, sin tener que rehacer el build. En dev no cambia nada: sigue sirviendo en `/`.
export default defineConfig({
  base: "./",
  plugins: [react()],
});
