// Datos de contenido del prototipo "Historias de la escalera" del Claustro San
// Agustín. Estructura basada en la narrativa/wireframe de referencia (Axure)
// compartida por el cliente (Page 1.html + menu.html).
// Los textos descriptivos e históricos son provisionales (lorem ipsum) en
// espera de los contenidos curatoriales. Los videos (assets/video/) son los
// de prototipo entregados: escena completa, mismo encuadre y duración (10,1 s).

const LOREM =
  "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor " +
  "incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud " +
  "exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute " +
  "irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla " +
  "pariatur.";

const SCENARIOS = [
  {
    id: "monasterio",
    name: "El monasterio",
    period: "Época colonial",
    image: "assets/img/scenario-monasterio.jpg",
    video: "assets/video/monasterio.mp4",
    poster: "assets/video/monasterio-poster.jpg",
    thumb: "assets/img/doc-monasterio.jpg",
    description:
      "Recreación de los monjes agustinos descendiendo la escalera del claustro " +
      "durante la vida monástica de la edificación.",
    text: LOREM,
    document: {
      title: "Descripción de la Ciudad de Tunja",
      year: "1618",
    },
    nightFilterDefault: false,
  },
  {
    id: "hospital",
    name: "El hospital",
    period: "Finales del siglo XIX",
    image: "assets/img/scenario-hospital.jpg",
    video: "assets/video/hospital.mp4",
    poster: "assets/video/hospital-poster.jpg",
    thumb: "assets/img/doc-hospital.png",
    description:
      "Recreación del personal médico y de enfermería durante el período en que el " +
      "claustro funcionó como hospital.",
    text: LOREM,
    document: {
      title: "Lecciones Elementales de Higiene — Dr. Juan de Dios Tavera B.",
      year: "1880",
    },
    nightFilterDefault: false,
  },
  {
    id: "penitenciaria",
    name: "La penitenciaría",
    period: "Principios del siglo XX",
    image: "assets/img/scenario-penitenciaria.jpg",
    video: "assets/video/penitenciaria.mp4",
    poster: "assets/video/penitenciaria-poster.jpg",
    thumb: "assets/img/doc-penitenciaria.png",
    description:
      "Recreación de la formación de internos durante el período en que el edificio " +
      "funcionó como penitenciaría.",
    text: LOREM,
    document: {
      title: "Llamamiento a Licitación — Secretaría de Gobierno, Tunja",
      year: "1910",
    },
    has360: true,
    image360: "assets/img/vista-360.jpg",
    nightFilterDefault: false,
  },
  {
    id: "fantasma",
    name: "El fantasma de la escalera",
    period: "Leyenda oral",
    image: "assets/img/scenario-fantasma.jpg",
    video: "assets/video/fantasma.mp4",
    poster: "assets/video/fantasma-poster.jpg",
    thumb: "assets/img/doc-fantasma.png",
    description:
      "Relato legendario asociado a la escalera, presentado con ambiente nocturno.",
    text: LOREM,
    document: {
      title: "Diario Noticioso, Curioso, Erudito y Comercial",
      year: "1758",
    },
    // El video ya viene con gradación nocturna azulada; activar el filtro lo
    // oscurecería dos veces.
    nightFilterDefault: false,
  },
];
