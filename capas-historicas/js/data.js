// Datos de contenido del prototipo "Capas históricas del Claustro San Agustín".
// Estructura basada en la narrativa/wireframe de referencia (Axure) compartida por el cliente.
// Los textos descriptivos son provisionales (lorem ipsum) en espera de los contenidos
// definitivos que entregará el equipo de curaduría/diseño.

const LOREM =
  "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor " +
  "incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud " +
  "exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.";

const LAYERS = [
  {
    id: 1,
    name: "Capa 1",
    period: "Período prehispánico",
    years: "Antes del siglo XVI",
    status: "ready",
    bg: "assets/img/capa1-bg.png",
    intro:
      "Antes de la llegada de los españoles, la región estuvo habitada por comunidades " +
      "indígenas que dejaron huellas de su vida cotidiana, sus ritos y sus asentamientos.",
    hotspots: [
      {
        id: "rito",
        label: "Ritos",
        color: "red",
        x: 22,
        y: 32,
        images: [{ src: "assets/img/capa1-rito.png", caption: "Ritual sobre roca con pictografías." }],
        text: LOREM,
      },
      {
        id: "sitios",
        label: "Sitios arqueológicos",
        color: "aqua",
        x: 68,
        y: 62,
        images: [
          { src: "assets/img/capa1-sitio-1.jpg", caption: "Sitio arqueológico 1" },
          { src: "assets/img/capa1-sitio-2.jpg", caption: "Sitio arqueológico 2" },
          { src: "assets/img/capa1-sitio-3.jpg", caption: "Sitio arqueológico 3" },
        ],
        text: LOREM,
      },
      {
        id: "vestimenta",
        label: "Vestimenta",
        color: "orange",
        x: 78,
        y: 28,
        images: [{ src: "assets/img/capa1-vestimenta.png", caption: "Vestimenta tradicional." }],
        text: LOREM,
      },
      {
        id: "adornos",
        label: "Adornos y jerarquía",
        color: "yellow",
        x: 42,
        y: 78,
        images: [{ src: "assets/img/capa1-adornos.png", caption: "Adornos asociados a la jerarquía social." }],
        text: LOREM,
      },
      {
        id: "comida",
        label: "Comida",
        color: "magenta",
        x: 14,
        y: 68,
        images: [{ src: "assets/img/capa1-generico.png", caption: "Hallazgo arqueológico (referencia genérica)." }],
        text: LOREM,
      },
      {
        id: "musica",
        label: "Música",
        color: "violet",
        x: 86,
        y: 52,
        images: [{ src: "assets/img/capa1-generico.png", caption: "Hallazgo arqueológico (referencia genérica)." }],
        text: LOREM,
      },
      {
        id: "ofrendas",
        label: "Ofrendas",
        color: "green",
        x: 58,
        y: 18,
        images: [{ src: "assets/img/capa1-generico.png", caption: "Hallazgo arqueológico (referencia genérica)." }],
        text: LOREM,
      },
      {
        id: "decoracion",
        label: "Decoración",
        color: "teal",
        x: 32,
        y: 48,
        images: [{ src: "assets/img/capa1-generico.png", caption: "Hallazgo arqueológico (referencia genérica)." }],
        text: LOREM,
      },
    ],
  },
  {
    id: 2,
    name: "Capa 2",
    period: "Período colonial / religioso",
    years: "Siglos XVI – XVIII",
    status: "ready",
    bg: "assets/img/capa2-bg.jpg",
    intro:
      "Con la fundación del Claustro, la vida religiosa agustina marcó el lugar: imágenes, " +
      "devociones y advocaciones que aún hoy forman parte de su memoria.",
    hotspots: [
      {
        id: "san-agustin",
        label: "San Agustín",
        color: "red",
        x: 50,
        y: 35,
        images: [{ src: "assets/img/capa2-san-agustin.jpg", caption: "Imagen de San Agustín." }],
        text: LOREM,
      },
      {
        id: "nta-sra-topo",
        label: "Nuestra Señora del Topo",
        color: "yellow",
        x: 25,
        y: 60,
        images: [{ src: "assets/img/capa2-nta-sra-topo.jpeg", caption: "Nuestra Señora del Topo." }],
        text: LOREM,
      },
      {
        id: "sagrado-corazon",
        label: "Sagrado Corazón",
        color: "aqua",
        x: 75,
        y: 60,
        images: [{ src: "assets/img/capa2-sagrado-corazon.jpg", caption: "Sagrado Corazón." }],
        text: LOREM,
      },
    ],
  },
  {
    id: 3,
    name: "Capa 3",
    period: "Monasterio y hospital",
    years: "Siglos XIX – XX",
    status: "ready",
    bg: "assets/img/capa3-bg.png",
    intro:
      "Con el paso del tiempo, el Claustro cambió de uso: de monasterio a hospital, " +
      "reflejando las transformaciones sociales e institucionales de la ciudad.",
    hotspots: [
      {
        id: "monasterio",
        label: "El Monasterio",
        color: "orange",
        x: 30,
        y: 40,
        images: [
          { src: "assets/img/capa3-monasterio-1.png", caption: "El Monasterio 1" },
          { src: "assets/img/capa3-monasterio-2.png", caption: "El Monasterio 2" },
          { src: "assets/img/capa3-monasterio-3.png", caption: "El Monasterio 3" },
          { src: "assets/img/capa3-monasterio-4.jpg", caption: "El Monasterio 4" },
        ],
        text: LOREM,
      },
      {
        id: "hospital",
        label: "El Hospital",
        color: "green",
        x: 68,
        y: 55,
        images: [{ src: "assets/img/capa3-hospital.png", caption: "Plano histórico de la ciudad y el antiguo hospital." }],
        text: LOREM,
      },
    ],
  },
  {
    id: 4,
    name: "Capa 4",
    period: "Contenido en desarrollo",
    years: "",
    status: "placeholder",
    hotspots: [],
  },
  {
    id: 5,
    name: "Capa 5",
    period: "Contenido en desarrollo",
    years: "",
    status: "placeholder",
    hotspots: [],
  },
];
