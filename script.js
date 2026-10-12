/* ============================================================
   Modal de bienvenida
   ============================================================ */
window.addEventListener("load", () => {
  const modal = document.querySelector(".modal-bienvenida");
  if (modal) modal.style.display = "flex";
  // Asegurar que la página comience desde arriba
  window.scrollTo({ top: 0, behavior: "auto" });
});

function cerrarModalWelcome() {
  const modal = document.querySelector(".modal-bienvenida");
  if (modal) modal.style.display = "none";
}

/* ============================================================
   Música de fondo
   ------------------------------------------------------------
   El navegador bloquea el autoplay: la música solo puede
   iniciarse tras un gesto del usuario (botón INGRESAR o
   botón de música).
   ============================================================ */
const musica = document.getElementById("musica");
const btnIngresar = document.getElementById("btn-ingresar");
const btnMusica = document.querySelector(".btn-musica");
const iconoMusica = btnMusica ? btnMusica.querySelector("div") : null;

function actualizarIconoMusica(sonando) {
  if (!iconoMusica) return;
  iconoMusica.classList.toggle("icono-silencio", !sonando);
  iconoMusica.classList.toggle("icono-sonando", sonando);
}

function reproducirMusica() {
  return musica
    .play()
    .then(() => {
      btnMusica?.classList.remove("pausa");
      actualizarIconoMusica(true);
    })
    .catch((error) =>
      console.log("No se pudo reproducir la música automáticamente:", error)
    );
}

function pausarMusica() {
  musica.pause();
  btnMusica?.classList.add("pausa");
  actualizarIconoMusica(false);
}

// Al pulsar INGRESAR se cierra el modal y suena la música
btnIngresar?.addEventListener("click", reproducirMusica);

// Botón flotante: reproduce o pausa
btnMusica?.addEventListener("click", () => {
  if (musica.paused) {
    reproducirMusica();
  } else {
    pausarMusica();
  }
});

/* ============================================================
   Cuenta regresiva
   ------------------------------------------------------------
   ATENCIÓN: fechaBoda es la fecha del evento. Si cambia la
   fecha en el HTML (modal/sección cuentra regresiva), cámbiala
   también aquí.
   ============================================================ */
const fechaBoda = new Date("2027-11-01T16:30:00").getTime();
const cuenta = document.getElementById("cuenta-regresiva");

function pad(n) {
  return String(n).padStart(2, "0");
}

let intervalo = null;

function actualizarCuenta() {
  if (!cuenta) return;

  const diferencia = fechaBoda - Date.now();

  // Si el evento ya pasó, mostramos un mensaje en lugar de cuentas en cero
  if (diferencia <= 0) {
    cuenta.innerHTML =
      '<p class="msg-post">¡Gracias por celebrar con nosotros!</p>';
    if (intervalo) clearInterval(intervalo);
    return;
  }

  const d = Math.floor(diferencia / (1000 * 60 * 60 * 24));
  const h = Math.floor((diferencia % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const m = Math.floor((diferencia % (1000 * 60 * 60)) / (1000 * 60));
  const s = Math.floor((diferencia % (1000 * 60)) / 1000);

  cuenta.innerHTML = `
    <div class="caja">
      <span class="caja-num">${d}</span>
      <span class="caja-label">Días</span>
    </div>
    <div class="caja">
      <span class="caja-num">${pad(h)}</span>
      <span class="caja-label">Horas</span>
    </div>
    <div class="caja">
      <span class="caja-num">${pad(m)}</span>
      <span class="caja-label">Min</span>
    </div>
    <div class="caja">
      <span class="caja-num">${pad(s)}</span>
      <span class="caja-label">Seg</span>
    </div>`;
}

intervalo = setInterval(actualizarCuenta, 1000);
actualizarCuenta();

/* ============================================================
   Animaciones de aparición al hacer scroll
   ============================================================ */
document.addEventListener("DOMContentLoaded", () => {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1 }
  );

  document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));
});

/* ============================================================
   Lugar reservado por invitado (?invitados=N)
   ------------------------------------------------------------
   Ejemplo de enlace personalizado:
     invitacion.html?invitados=3
   ============================================================ */
document.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(window.location.search);
  const invitados = parseInt(params.get("invitados"), 10);

  const numeroElemento = document.getElementById("numero");
  if (numeroElemento) {
    if (Number.isInteger(invitados) && invitados > 0) {
      numeroElemento.textContent =
        invitados === 1 ? "1 lugar" : `${invitados} lugares`;
    } else {
      numeroElemento.textContent = "un lugar";
    }
  }
});

/* ============================================================
   Copiar datos bancarios (mesa de regalos BBVA)
   ============================================================ */
function copyInfo() {
  const cuentaBancaria = "012320015636927951";
  navigator.clipboard
    .writeText(cuentaBancaria)
    .then(() =>
      mostrarNotificacion(
        `Cuenta copiada al portapapeles:\nBBVA | Karina Lizeth Delgado Benítez — ${cuentaBancaria}`
      )
    )
    .catch((err) => console.error("Error al copiar al portapapeles: ", err));
}

function mostrarNotificacion(mensaje) {
  const notif = document.getElementById("notificacion");
  if (!notif) return;

  notif.textContent = mensaje;
  notif.style.display = "block";
  notif.style.opacity = "1";

  // Ocultar después de unos segundos
  setTimeout(() => {
    notif.style.opacity = "0";
    setTimeout(() => {
      notif.style.display = "none";
    }, 300);
  }, 5000);
}