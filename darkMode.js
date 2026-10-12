// Alterna el modo oscuro al hacer clic en el botón
const toggleBtn = document.getElementById("darkModeToggle");

toggleBtn?.addEventListener("click", () => {
  document.body.classList.toggle("dark-mode");
  toggleBtn.classList.toggle("dark");
});