// Registro único de la boda (T4–T5, RF-1, RF-2, RF-3, RF-4–RF-15, RF-22).
//
// Toda la información de la boda vive aquí, separada de las fichas de invitación
// (src/data/guest-cards.js). Solo datos (sin React, sin DOM, sin lógica): también los
// textos de cada sección, que la interfaz no incrusta (RNF-1).

// Hora confirmada: una sola fuente para el inicio del evento, Ubicaciones e Itinerario.
const ceremonyTime = "16:00";
const ceremonyTimeLabel = `${ceremonyTime} hrs`;

export const wedding = {
  plantilla: "clasica",

  pareja: {
    nombre1: "Naomi Muñoz Macías",
    nombre2: "Andrés Calzada Asencio",
    // Usar coupleNames para componer el nombre para mostrar si no se define.
    nombreParaMostrar: "Naomi y Andrés",
  },

  evento: {
    titulo: "Boda de Naomi y Andrés",
    fechaInicio: `2027-03-13T${ceremonyTime}:00-06:00`,
    zonaHoraria: "America/Mexico_City",
    lugar: "San Juan de los Lagos, Jalisco, México",
    descripcion: "Ceremonia religiosa y recepción",
  },

  portada: {
    pareja: { nombre1: "Naomi", nombre2: "Andrés" },
    fecha: "13 de marzo de 2027",
    titulo: "Naomi & Andrés",
    subtitulo: "Qué alegría compartir con ustedes el día en que diremos sí",
    texto: "Tenemos el placer de invitarlos\na nuestra boda",
    imagenes: [
      { clave: "backgrond3", alt: "" },
      { clave: "foto20", alt: "Naomi y Andrés" },
    ],
  },

  cuentaRegresiva: {
    fechaInicio: "2027-03-13T00:00:00-06:00",
    zonaHoraria: "America/Mexico_City",
  },

  familia: {
    titulo: "Nuestros padres y padrinos",
    texto: "El amor que hoy celebramos también es fruto de quienes nos han acompañado, guiado y enseñado a amar.",
    grupos: [
      {
        titulo: "Nuestros Padres",
        categorias: [
          { titulo: "Padres de la novia", nombres: ["Blanca Delia Macías Rocha", "Raúl Muñoz Márquez"] },
          { titulo: "Padres del novio", nombres: ["Maria Elena Ascencio Villamil", "Ernesto Calzada Castillo"] },
        ],
      },
      {
        titulo: "Nuestros Padrinos",
        categorias: [
          { titulo: "Padrinos de Velación", nombres: ["Maria Elena Ascencio Villamil", "Ernesto Calzada Castillo"] },
          { titulo: "Padrinos de Anillos", nombres: ["Maria de Lourdes Gomez Rocha", "Mauricio Gomez Rocha"] },
        ],
      },
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
      "Ella había empezado a entrar en mí, a convertirse en mí, como un río que se mezcla demasiado con el mar y al fin se vuelve salado como el mar.",
    ],
    autor: "Mario Benedetti",
  },

  ubicaciones: {
    titulo: "Dónde será",
    ceremonia: {
      nombre: "Ceremonia religiosa",
      lugar: "La Santísima Trinidad",
      direccion: "Av. Lago Ginebra y Lago Tanna S/N (esquina con Lago Ontario), Col. Los Lagos, C.P. 47030, San Juan de los Lagos, Jal.",
      hora: ceremonyTimeLabel,
      mapaUrl: "https://www.google.com/maps/search/?api=1&query=21.2709868%2C-102.3163084",
    },
    recepcion: {
      nombre: "Recepción",
      lugar: "Monte Piedra",
      direccion: "Lázaro Cárdenas 425, C.P. 47095, San Juan de los Lagos, Jal.",
      hora: "19:30 hrs",
      mapaUrl: "https://www.google.com/maps/search/?api=1&query=Monte+Piedra+Eventos%2C+L%C3%A1zaro+C%C3%A1rdenas+425%2C+San+Juan+de+los+Lagos%2C+Jalisco",
    },
  },

  itinerario: {
    titulo: "Itinerario de la boda",
    // `icono` es una clave de presentación: la interfaz elige el archivo del build.
    momentos: [
      { hora: ceremonyTimeLabel, titulo: "Ceremonia religiosa", descripcion: "Inicio de la ceremonia", icono: "iglesia" },
      { hora: "19:30 hrs", titulo: "Recepción", descripcion: "Cena y celebración", icono: "mansion" },
      { hora: "19:30 h", titulo: "Cóctel", descripcion: "Copas y brindis", icono: "copas" },
      { hora: "", titulo: "Boda civil", descripcion: "", icono: "anillos" },
      { hora: "20:00 h", titulo: "Cena", descripcion: "Banquete", icono: "comida" },
    ],
  },

  soloAdultos: {
    saludo: "Con mucho cariño...",
    titulo: "NO NIÑOS",
    parrafos: [
      "Queremos que disfruten al máximo esta noche tan especial. Por ello, nuestra celebración será solo para adultos.",
      "¡Gracias por su cariño y comprensión!",
    ],
  },

  galeria: {
    titulo: "Nuestros momentos",
    destacadas: 19,
    // Fotografías existentes sin modificar; la copia de DSC00743 queda fuera.
    imagenes: [
      { clave: "DSC00459", alt: "Naomi y Andrés" },
      { clave: "DSC00519", alt: "Naomi y Andrés" },
      { clave: "DSC00628", alt: "Naomi y Andrés" },
      { clave: "DSC00712", alt: "Naomi y Andrés" },
      { clave: "DSC00743", alt: "Naomi y Andrés" },
      { clave: "DSC00801", alt: "Naomi y Andrés" },
      { clave: "DSC00929", alt: "Naomi y Andrés" },
      { clave: "DSC00981", alt: "Naomi y Andrés" },
      { clave: "DSC01002", alt: "Naomi y Andrés" },
      { clave: "DSC01036", alt: "Naomi y Andrés" },
      { clave: "DSC01073", alt: "Naomi y Andrés" },
      { clave: "DSC01108", alt: "Naomi y Andrés" },
      { clave: "DSC01297", alt: "Naomi y Andrés" },
      { clave: "DSC01304", alt: "Naomi y Andrés" },
      { clave: "DSC01377", alt: "Naomi y Andrés" },
      { clave: "DSC01448", alt: "Naomi y Andrés" },
      { clave: "DSC01565", alt: "Naomi y Andrés" },
      { clave: "DSC01625", alt: "Naomi y Andrés" },
      { clave: "DSC01701", alt: "Naomi y Andrés" },
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
      // Deshabilitada hasta recibir y verificar los datos bancarios de Naomi y Andrés.
      // Conservar esta opción y sus recursos para restaurarla solo después de la verificación.
      /* {
        tipo: "transferencia",
        etiqueta: "Transferencia bancaria (BBVA)",
        descripcion: "Datos para transferencia bancaria",
        url: null,
        datosCopiables: [
          { etiqueta: "Banco", valor: "BBVA" },
          { etiqueta: "Titular", valor: "Karina Lizeth Delgado Benítez" },
          { etiqueta: "Cuenta", valor: "012320015636927951", copiar: true },
        ],
      }, */
    ],
  },

  hoteles: {
    titulo: "Sugerencias de hospedaje",
    lista: [
      {
        nombre: "Hotel El Refugio",
        direccion: null,
        precio: null,
        mapaUrl: null,
        bookingUrl: "https://app.reservatio.com.mx/hotel-refugio/book?promocode=NAOMIYANDRES",
        notas: "Sugerencia: No reservar a través de plataformas (Booking, Expedia, etc.), usar link anterior o directamente con el hotel para obtener el descuento proporcionado.",
      },
    ],
  },

  restricciones: {
    titulo: "Para tomar en cuenta",
    codigoVestimenta: "Vestimenta Formal",
    permiteNinos: false,
    otrasIndicaciones: [
      "Mujer: Vestido largo.",
      "Agradecemos evitar colores blanco, beige, marfil, Champagne.",
      "Así mismo, el color verde olivo está reservado para las damas.",
      "Hombre: Traje.",
    ],
  },

  confirmacion: {
    titulo: "Confirmar asistencia",
    descripcion: "Cada uno de ustedes ha sido parte de nuestra historia. Nos hace mucha ilusión celebrar nuestra boda con ustedes. Ya queremos verlos, abrazarlos y brindar juntos por todo lo que viene.",
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
      citaVisible: false,
      historiaVisible: true,
      familiaVisible: true,
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
    nombre: "Naomi y Andrés",
    mensajeEnlace:
      "¡Hola! Somos {pareja} y queremos invitarte a nuestra boda. Tu invitación cuenta con {lugares}. Confirma tu asistencia aquí: {enlace}",
    dominio: null,
    // El destino de la confirmación ya no vive aquí: el envío va al servicio de registro
    // (RF-14). Solo queda el enlace de crédito.
    enlaces: {
      credito:
        "https://wa.me/524494144122?text=Hola%2C%20quiero%20informaci%C3%B3n%20sobre%20invitaci%C3%B3n%20digital",
    },
  },
};
