// Registro único de la boda (T4–T5, RF-1, RF-2, RF-3, RF-4–RF-15, RF-22).
//
// Toda la información de la boda vive aquí, separada de las fichas de invitación
// (src/data/guest-cards.js). Solo datos (sin React, sin DOM, sin lógica): también los
// textos de cada sección, que la interfaz no incrusta (RNF-1).

export const wedding = {
  plantilla: "clasica",

  pareja: {
    nombre1: "Karina",
    nombre2: "Gerardo",
    // Usar coupleNames para componer el nombre para mostrar si no se define.
    nombreParaMostrar: null,
  },

  evento: {
    titulo: "Boda de Karina y Gerardo",
    fechaInicio: "2027-11-01T16:30:00",
    zonaHoraria: "America/Mexico_City",
    lugar: "Guadalajara",
    descripcion: "Ceremonia religiosa y recepción",
  },

  portada: {
    titulo: "Karina & Gerardo",
    subtitulo: "Nos casamos",
    texto: "Tenemos el placer de invitarlos\na nuestra boda",
    imagenes: [
      { clave: "backgrond3", alt: "" },
      { clave: "foto20", alt: "Karina y Gerardo" },
    ],
  },

  cita: {
    texto:
      "Hoy por fin uniremos nuestras vidas en matrimonio, sellamos nuestras promesas con el elemento que distingue nuestro amor, el fuego, ese que ha mantenido viva la intensidad y la luz que nos dirige al futuro compartido en el que queremos vivir. Por eso nos encantaría que nos acompañaran en este día tan especial.",
    autor: null,
  },

  historia: {
    titulo: "Nuestra historia",
    parrafos: [
      "Nos conocimos una tarde cualquiera y, sin darnos cuenta, empezamos a escribir una historia que hoy celebramos juntos.",
      "Después de tantos momentos compartidos, decidimos dar el paso más importante: caminar juntos el resto de la vida.",
    ],
  },

  ubicaciones: {
    titulo: "Dónde será",
    ceremonia: {
      nombre: "Ceremonia religiosa",
      lugar: "Parroquia Santa María de Guadalupe",
      direccion: "Guadalajara, Jalisco",
      hora: "16:30 h",
      mapaUrl: "https://maps.app.goo.gl/yaqaGNKWtBXKPh6aA",
    },
    recepcion: {
      nombre: "Recepción",
      lugar: "Los Agaves Eventos",
      direccion: "Guadalajara, Jalisco",
      hora: "19:00 h",
      mapaUrl: "https://maps.app.goo.gl/ugybqq1hNqykeFQJ8",
    },
  },

  itinerario: {
    titulo: "Itinerario de la boda",
    // `icono` es una clave de presentación: la interfaz elige el archivo del build.
    momentos: [
      { hora: "16:30 h", titulo: "Ceremonia", descripcion: "Inicio de la ceremonia", icono: "iglesia" },
      { hora: "19:00 h", titulo: "Recepción", descripcion: "Cena y celebración", icono: "mansion" },
      { hora: "19:30 h", titulo: "Cóctel", descripcion: "Copas y brindis", icono: "copas" },
      { hora: "20:00 h", titulo: "Cena", descripcion: "Banquete", icono: "comida" },
      { hora: "21:30 h", titulo: "Baile", descripcion: "Pista de baile abierta", icono: "disco" },
    ],
  },

  galeria: {
    titulo: "Nuestros momentos",
    // Cuántas imágenes van al carrusel; el resto forma la rejilla (T26).
    destacadas: 7,
    // Cada imagen guarda una clave (base de assets/photos/opt/) y su texto alternativo.
    // `services/photos.js` resuelve la clave a { src, srcSet, sizes } (T16).
    imagenes: [
      { clave: "foto2", alt: "Karina y Gerardo, foto 2" },
      { clave: "foto4", alt: "Karina y Gerardo, foto 4" },
      { clave: "foto6", alt: "Karina y Gerardo, foto 6" },
      { clave: "foto10", alt: "Karina y Gerardo, foto 10" },
      { clave: "foto13", alt: "Karina y Gerardo, foto 13" },
      { clave: "foto16", alt: "Karina y Gerardo, foto 16" },
      { clave: "foto19", alt: "Karina y Gerardo, foto 19" },
      { clave: "foto3", alt: "Karina y Gerardo, foto 3" },
      { clave: "foto5", alt: "Karina y Gerardo, foto 5" },
      { clave: "foto8", alt: "Karina y Gerardo, foto 8" },
      { clave: "foto11", alt: "Karina y Gerardo, foto 11" },
      { clave: "foto12", alt: "Karina y Gerardo, foto 12" },
      { clave: "foto14", alt: "Karina y Gerardo, foto 14" },
    ],
  },

  regalos: {
    titulo: "Mesa de regalos",
    mensaje: "Tu presencia es nuestro mayor regalo. Si deseas apoyarnos, aquí tienes algunas opciones:",
    opciones: [
      {
        tipo: "tienda",
        etiqueta: "Liverpool",
        descripcion: "Mesa de regalos en Liverpool",
        url: "https://mesaderegalos.liverpool.com.mx/milistaderegalos/51688096",
      },
      {
        tipo: "transferencia",
        etiqueta: "Transferencia bancaria (BBVA)",
        descripcion: "Datos para transferencia bancaria",
        url: null,
        datosCopiables: [
          { etiqueta: "Banco", valor: "BBVA" },
          { etiqueta: "Titular", valor: "Karina Lizeth Delgado Benítez" },
          { etiqueta: "Cuenta", valor: "012320015636927951", copiar: true },
        ],
      },
      {
        tipo: "efectivo",
        etiqueta: "Efectivo",
        descripcion: "Lluvia de sobres en la recepción",
        url: null,
        datosCopiables: [],
      },
    ],
  },

  hoteles: {
    titulo: "Sugerencias de hospedaje",
    lista: [
      {
        nombre: "Hotel Encore",
        direccion: "Guadalajara, Jalisco",
        precio: null,
        mapaUrl: null,
        bookingUrl: "https://encoreguadalajara.com/",
        notas: null,
      },
      {
        nombre: "Micro Hotel",
        direccion: "Guadalajara, Jalisco",
        precio: null,
        mapaUrl: null,
        bookingUrl: "https://microtelgdlsur.com/",
        notas: null,
      },
      {
        nombre: "City Express",
        direccion: "Guadalajara, Jalisco",
        precio: null,
        mapaUrl: null,
        bookingUrl:
          "https://www.marriott.com/es/hotels/gdljp-city-express-junior-guadalajara-periferico-sur/overview/",
        notas: null,
      },
    ],
  },

  restricciones: {
    titulo: "Para tomar en cuenta",
    codigoVestimenta: null,
    // El permiso de niños no se indica: por defecto son permitidos (RF-12).
    otrasIndicaciones: null,
  },

  confirmacion: {
    titulo: "Confirmar asistencia",
    descripcion: "Confirma cuántas personas asistirán a nuestra boda",
    fechaLimite: "2027-10-25T23:59:59-06:00",
    maximoBoda: 100,
    camposHabilitados: ["nombre", "asistentes", "alergias", "mensaje"],
  },

  ajustes: {
    musica: {
      habilitada: true,
      fuente: null,
    },
    navegacion: {
      encabezadoVisible: true,
      panelFlotanteVisible: true,
      pieVisible: true,
    },
    secciones: {
      portadaVisible: true,
      parejaVisible: true,
      citaVisible: true,
      historiaVisible: true,
      ubicacionesVisible: true,
      itinerarioVisible: true,
      galeriaVisible: true,
      regalosVisible: true,
      hotelesVisible: true,
      restriccionesVisible: true,
      confirmacionVisible: true,
    },
  },

  marca: {
    nombre: "Karina & Gerardo",
    dominio: null,
    enlaces: {
      credito:
        "https://wa.me/524494144122?text=Hola%2C%20quiero%20informaci%C3%B3n%20sobre%20invitaci%C3%B3n%20digital",
      rsvp: "https://formsubmit.co/karina.ldb18@gmail.com",
    },
  },
};
