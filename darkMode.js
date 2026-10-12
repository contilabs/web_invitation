/* ============================================================
   Interruptor de tema (día / noche)
   ------------------------------------------------------------
   La clase vive en <html>, no en <body>, porque así el script
   del <head> puede aplicarla antes de pintar y no hay parpadeo.
   La elección se recuerda en localStorage ("kg-tema"); si el
   visitante nunca eligió, se respeta el tema del sistema.
   ============================================================ */
const toggleBtn = document.getElementById("darkModeToggle");
const raiz = document.documentElement;
const CLAVE_TEMA = "kg-tema";

function temaGuardado() {
  try {
    return localStorage.getItem(CLAVE_TEMA);
  } catch (e) {
    return null;
  }
}

function sincronizarBoton() {
  if (!toggleBtn) return;
  const oscuro = raiz.classList.contains("dark-mode");
  toggleBtn.setAttribute("aria-pressed", String(oscuro));
  toggleBtn.title = oscuro ? "Cambiar a tema claro" : "Cambiar a tema oscuro";
}

function aplicarTema(tema, persistir = true) {
  raiz.classList.toggle("dark-mode", tema === "noche");
  raiz.dataset.tema = tema;

  if (persistir) {
    try {
      localStorage.setItem(CLAVE_TEMA, tema);
    } catch (e) {}
  }

  sincronizarBoton();
}

sincronizarBoton();

toggleBtn?.addEventListener("click", () => {
  aplicarTema(raiz.classList.contains("dark-mode") ? "dia" : "noche");
});

// Solo seguimos al sistema mientras el visitante no haya elegido.
window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", (evento) => {
  const guardado = temaGuardado();
  if (guardado !== "dia" && guardado !== "noche") {
    aplicarTema(evento.matches ? "noche" : "dia", false);
  }
});
