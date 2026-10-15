# Constitución — Invitación digital (Karina & Gerardo)

1. **Stack**: React con build (Vite). No se añaden otras dependencias, frameworks ni librerías; el build genera el sitio estático que se publica.
2. **Spec = código**: `README.md` y `AGENTS.md` son la verdad. Toda la información de la boda vive en un **único registro de datos** (`src/datos/boda.js`), separado de las **fichas de invitación** (`src/datos/invitaciones.js`). Cambiar un dato se hace en ese registro (y se publica volviendo a construir el sitio); los componentes no tienen datos ni textos incrustados.
3. **Interfaz separada de lógica**: lógica pura en `src/logica/*.js`, datos en `src/datos/*.js`, presentación en `src/componentes/*.jsx`. Los colores siguen en variables CSS. Los textos de contenido salen del registro; los mensajes del sistema (errores, avisos o cierre del plazo) son copy de interfaz.
4. **Tests sin instalar nada**: ninguna herramienta (Jest, linters). Verificación manual en el navegador, anotada en la sección «Verificación».
5. **Datos del usuario a salvo**: el repositorio solo incluye **fichas de invitación de ejemplo** (sin datos personales reales). El contrato del servicio de registro es **solo una referencia** (no se conecta ningún servicio). Lo único persistido en el navegador es el tema (`localStorage["kg-tema"]`).
6. **Idioma**: el registro de la boda, el código, los identificadores y los textos visibles van en español. Como **excepción documentada**, la **ficha del invitado** conserva los identificadores del contrato del servicio de registro (inglés) para facilitar su mapeo futuro.
