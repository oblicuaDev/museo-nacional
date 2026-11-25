# Capas históricas del Claustro San Agustín — Prototipo funcional

Prototipo técnico en HTML + CSS + JavaScript puro (sin frameworks ni librerías) que
permite navegar y explorar las capas históricas del Claustro San Agustín, siguiendo
la estructura e interacciones de la narrativa de referencia (Axure) entregada por el
equipo de diseño.

## Cómo ejecutarlo

Es un sitio 100% estático: basta con abrir `index.html` en un navegador, o servirlo
con cualquier servidor estático (por ejemplo `npx http-server .`). `index.html` es la
página de inicio (intro/explicación); desde ahí el botón "Comenzar a explorar" lleva
a `capas.html`, la experiencia de capas históricas propiamente dicha.

## Estructura

```
capas-historicas/
├── index.html          Página de inicio (intro y explicación para el usuario)
├── capas.html           Experiencia principal de capas históricas
├── css/styles.css       Estilos compartidos (wireframe, sin diseño visual definitivo)
├── css/landing.css       Estilos propios de la página de inicio
├── js/data.js            Contenido: capas, hotspots, imágenes y textos
├── js/app.js             Lógica de interacción de capas.html (sin dependencias externas)
└── assets/img/           Imágenes de referencia tomadas del prototipo Axure
    └── landing/           Imágenes propias de la página de inicio (foto, logo, íconos)
```

## Lógica implementada

- **Página de inicio** (`index.html`) con foto real del Claustro, texto introductorio
  (provisional), tres instrucciones de uso con íconos tomados de la referencia, y un
  botón para pasar a la experiencia de capas.
- **Navegación entre capas**: flechas (header y sobre el visor), indicadores
  ("pips") en el pie para saltar directamente a una capa, teclado (← →).
- **5 capas** siguiendo la referencia: 3 con contenido ("Período prehispánico",
  "Período colonial/religioso", "Monasterio y hospital") y 2 marcadas como
  "contenido en desarrollo" (tal como estaban en blanco en la narrativa original).
- **Hotspots interactivos** sobre la imagen de cada capa, con color e id tomados
  de los nombres reales usados en el prototipo de referencia (ritos, sitios
  arqueológicos, vestimenta, adornos, San Agustín, Sagrado Corazón, el
  Monasterio, el Hospital, etc.).
- **Panel de detalle** por hotspot, con galería de imágenes (flechas + puntos de
  paginación) cuando el tema tiene más de una imagen asociada.

## Pendiente para el diseño final

- El **texto introductorio de la página de inicio es provisional** — en la
  narrativa de referencia ese bloque tampoco tenía texto definitivo (cajas
  "greek" vacías), así que debe redactarse junto con el equipo de curaduría.
- Los **textos descriptivos de cada hotspot son lorem ipsum** — deben
  reemplazarse por los contenidos curatoriales definitivos.
- Las **imágenes** son las disponibles en la referencia Axure compartida; se
  deben sustituir por los recursos finales en alta resolución cuando se
  entreguen (basta con cambiar las rutas en `js/data.js`).
- Las **posiciones (x/y) de los hotspots** se ubicaron de forma aproximada sobre
  cada imagen; deben ajustarse visualmente una vez haya diseño definitivo.
- El **estilo visual** (`css/styles.css`) es deliberadamente simple (wireframe)
  y está aislado del contenido y de la lógica, para facilitar su reemplazo sin
  tocar `js/app.js` ni `js/data.js`.
- Las **capas 4 y 5** quedan como marcador de posición hasta que se defina su
  contenido.
