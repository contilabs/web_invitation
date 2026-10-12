/* ============================================================
   Invitación de Karina & Gerardo
   ------------------------------------------------------------
   JavaScript sin dependencias (Bootstrap 5 solo aporta el
   carrusel de la galería). Cada bloque está numerado igual que
   las secciones de index.html.
   ============================================================ */

/* ============================================================
   0. Ajustes iniciales
   ============================================================ */

// Al recargar, empezamos siempre por la portada, no donde se quedó el scroll.
if ("scrollRestoration" in history) history.scrollRestoration = "manual";

// ¿El sistema pidió menos movimiento?
const sinMovimiento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Si se prefiere menos movimiento, el carrusel no debe avanzar solo.
// Esto corre antes de que Bootstrap lea el atributo (data-api), así que
// basta con quitarlo del HTML.
if (sinMovimiento) {
  document.getElementById("galeria")?.removeAttribute("data-bs-ride");
}

/* ============================================================
   1. Portada: bloquear el fondo mientras está abierta
   ------------------------------------------------------------
   `inert` quita del foco y de los lectores de pantalla todo lo
   que queda detrás de la portada. Como el único elemento
   enfocable dentro de la portada es INGRESAR, el foco no puede
   escaparse hacia la página.
   ============================================================ */
const contenido = document.querySelector(".contenido");
const panelFijo = document.querySelector(".fixed-panel");

function bloquearFondo(bloquear) {
  [contenido, panelFijo].forEach((el) => {
    if (!el) return;
    if (bloquear) el.setAttribute("inert", "");
    else el.removeAttribute("inert");
  });
}

bloquearFondo(true);
document.getElementById("btn-ingresar")?.focus();

function cerrarModalWelcome() {
  const portada = document.querySelector(".modal-bienvenida");
  if (portada) portada.style.display = "none";

  bloquearFondo(false);
  document.body.classList.add("portada-cerrada"); // inicia el fundido del hero
  window.scrollTo({ top: 0, behavior: "auto" });
}

/* ============================================================
   2. Música de fondo
   ------------------------------------------------------------
   El navegador bloquea el autoplay: la música solo puede
   empezar tras un gesto (INGRESAR o el botón de música).
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
  if (!musica) return Promise.resolve();
  return musica
    .play()
    .then(() => {
      btnMusica?.classList.remove("pausa");
      btnMusica?.setAttribute("aria-label", "Pausar la música");
      actualizarIconoMusica(true);
    })
    .catch((error) =>
      console.log("No se pudo reproducir la música automáticamente:", error)
    );
}

function pausarMusica() {
  if (!musica) return;
  musica.pause();
  btnMusica?.classList.add("pausa");
  btnMusica?.setAttribute("aria-label", "Reproducir la música");
  actualizarIconoMusica(false);
}

// Al pulsar INGRESAR se cierra la portada y suena la música
btnIngresar?.addEventListener("click", reproducirMusica);

// Botón flotante: reproduce o pausa
btnMusica?.addEventListener("click", () => {
  if (musica && musica.paused) reproducirMusica();
  else pausarMusica();
});

/* ============================================================
   3. Cuenta regresiva
   ------------------------------------------------------------
   ATENCIÓN: fechaBoda es la fecha del evento. Si cambia la
   fecha en el HTML (portada y sección de cuenta regresiva),
   cámbiala también aquí.

   Nota: "2027-11-01T16:30:00" sin zona horaria se interpreta
   como hora local del visitante; es lo que se quiere para una
   boda presencial en Guadalajara.
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

  // Si el evento ya pasó, un mensaje en lugar de cuentas en cero
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
   4. Encabezado: aparece al pasar la portada principal
   ------------------------------------------------------------
   Sin JavaScript el encabezado nunca se muestra, que es un
   estado correcto (nunca queda texto ilegible sobre el papel).
   ============================================================ */
const hero = document.getElementById("inicio");
const encabezado = document.getElementById("encabezado");

if (hero && encabezado) {
  new IntersectionObserver(
    ([entrada]) => encabezado.classList.toggle("inicio--fijo", !entrada.isIntersecting),
    { rootMargin: "0px 0px -70% 0px", threshold: 0 }
  ).observe(hero);
}

/* ============================================================
   5. Aparición al hacer scroll
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
   6. Lugar reservado por invitado (?invitados=N)
   ------------------------------------------------------------
   Ejemplo de enlace personalizado:
     index.html?invitados=3
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
   7. Datos bancarios (mesa de regalos)
   ------------------------------------------------------------
   ÚNICO lugar donde viven estos datos: se pintan en la tarjeta
   y se copian al portapapeles desde aquí.
   ============================================================ */
const DATOS_BANCARIOS = {
  banco: "BBVA",
  titular: "Karina Lizeth Delgado Benítez",
  cuenta: "012320015636927951",
};

document.querySelectorAll("[data-banco-titular]").forEach((el) => {
  el.textContent = DATOS_BANCARIOS.titular;
});
document.querySelectorAll("[data-banco-cuenta]").forEach((el) => {
  el.textContent = DATOS_BANCARIOS.cuenta;
});

function copiarAlPortapapeles(texto) {
  // navigator.clipboard no existe al abrir el archivo con file://
  if (navigator.clipboard && window.isSecureContext) {
    return navigator.clipboard.writeText(texto);
  }

  return new Promise((resolve, reject) => {
    const area = document.createElement("textarea");
    area.value = texto;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.top = "-100vh";
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(area);
    ok ? resolve() : reject(new Error("No se pudo copiar"));
  });
}

function copyInfo() {
  const { banco, titular, cuenta } = DATOS_BANCARIOS;
  copiarAlPortapapeles(cuenta)
    .then(() =>
      mostrarNotificacion(`Cuenta copiada: ${cuenta} (${banco}, ${titular})`)
    )
    .catch((err) => {
      console.error("Error al copiar al portapapeles: ", err);
      mostrarNotificacion(`No se pudo copiar. La cuenta es: ${cuenta}`);
    });
}

function mostrarNotificacion(mensaje) {
  const notif = document.getElementById("notificacion");
  if (!notif) return;

  notif.textContent = mensaje;
  notif.style.display = "block";
  notif.style.opacity = "1";

  clearTimeout(notif.dataset.temporizador);
  notif.dataset.temporizador = setTimeout(() => {
    notif.style.opacity = "0";
    setTimeout(() => {
      notif.style.display = "none";
    }, 300);
  }, 5000);
}

/* ============================================================
   8. Galería: contador del carrusel y visor a pantalla completa
   ============================================================ */
const galeriaEl = document.getElementById("galeria");
const fotos = Array.from(document.querySelectorAll(".js-foto"));
const lightbox = document.getElementById("lightbox");
const lightboxImg = document.getElementById("lightbox-img");
const lightboxContador = document.querySelector(".lightbox-contador");
let indiceFoto = 0;

// 8.a Contador «3 / 7» sobre las fotos destacadas
if (galeriaEl) {
  const total = galeriaEl.querySelectorAll(".carousel-item").length;
  const totalEl = document.getElementById("galeria-total");
  const actualEl = document.getElementById("galeria-actual");
  if (totalEl) totalEl.textContent = total;

  galeriaEl.addEventListener("slide.bs.carousel", (evento) => {
    if (actualEl) actualEl.textContent = evento.to + 1;
  });
}

// 8.b Precarga de las fotos destacadas
// Las imágenes dentro de una diapositiva oculta (display:none) nunca se
// cargan con loading="lazy": al avanzar el carrusel aparecerían en blanco
// un instante. Cuando la galería se acerca a la pantalla se piden todas.
const imagenesAnticipadas = [];

if (galeriaEl && "IntersectionObserver" in window) {
  const anticipar = new IntersectionObserver(
    ([entrada], observador) => {
      if (!entrada.isIntersecting) return;
      observador.disconnect();

      galeriaEl.querySelectorAll(".carousel-item img").forEach((img) => {
        // Las diapositivas ocultas no cargan con loading="lazy": se piden
        // aquí, antes de que hagan falta.
        img.loading = "eager";
        const copia = new Image();
        copia.decoding = "async";
        if (img.getAttribute("srcset")) copia.srcset = img.getAttribute("srcset");
        if (img.getAttribute("sizes")) copia.sizes = img.getAttribute("sizes");
        copia.src = img.getAttribute("src") || img.src;
        imagenesAnticipadas.push(copia); // mantiene viva la petición
      });
    },
    { rootMargin: "1500px 0px" }
  );
  anticipar.observe(galeriaEl);
}

// 8.c Pausar el carrusel mientras se mira una foto de cerca
function carruselActivo(activo) {
  if (!galeriaEl || typeof bootstrap === "undefined") return;
  const carrusel = bootstrap.Carousel.getOrCreateInstance(galeriaEl);
  if (activo && !sinMovimiento) carrusel.cycle();
  else carrusel.pause();
}

// El srcset termina en el archivo más grande: ese es el que queremos al ampliar.
function fuenteGrande(img) {
  const srcset = img.getAttribute("srcset");
  if (!srcset) return img.currentSrc || img.src;
  const candidatos = srcset
    .split(",")
    .map((c) => c.trim().split(/\s+/)[0])
    .filter(Boolean);
  return candidatos[candidatos.length - 1];
}

function abrirFoto(indice) {
  if (!lightbox || !lightboxImg || !fotos.length) return;

  indiceFoto = (indice + fotos.length) % fotos.length;
  const img = fotos[indiceFoto];

  lightboxImg.src = fuenteGrande(img);
  lightboxImg.alt = img.alt || "";
  if (lightboxContador) {
    lightboxContador.textContent = `Foto ${indiceFoto + 1} de ${fotos.length}`;
  }

  if (!lightbox.open) lightbox.showModal();
  carruselActivo(false);
}

// Un solo listener delegado: cubre el clic sobre la imagen, sobre el relleno
// de la miniatura y la activación por teclado del botón (Enter o Espacio).
document.addEventListener("click", (evento) => {
  const destino = evento.target.closest(".js-foto, .foto-mini");
  if (!destino) return;

  const img = destino.classList.contains("js-foto")
    ? destino
    : destino.querySelector(".js-foto");
  if (!img) return;

  abrirFoto(fotos.indexOf(img));
});

if (lightbox) {
  // Clic en el fondo oscuro (fuera de la foto) para cerrar
  lightbox.addEventListener("click", (evento) => {
    if (evento.target === lightbox) lightbox.close();
  });

  lightbox.addEventListener("keydown", (evento) => {
    if (evento.key === "ArrowRight") abrirFoto(indiceFoto + 1);
    else if (evento.key === "ArrowLeft") abrirFoto(indiceFoto - 1);
  });

  lightbox.addEventListener("close", () => carruselActivo(true));

  document
    .querySelector(".lightbox-cerrar")
    ?.addEventListener("click", () => lightbox.close());
  document
    .querySelector(".lightbox-prev")
    ?.addEventListener("click", () => abrirFoto(indiceFoto - 1));
  document
    .querySelector(".lightbox-next")
    ?.addEventListener("click", () => abrirFoto(indiceFoto + 1));
}
