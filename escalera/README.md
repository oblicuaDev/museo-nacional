# Historias de la escalera — Prototipo funcional

Prototipo técnico en HTML + CSS + JavaScript puro (sin frameworks ni librerías)
de la experiencia de cámara web superpuesta a recreaciones históricas de la
escalera del Claustro San Agustín, siguiendo la estructura e interacciones de
la narrativa de referencia (Axure: `Page 1.html` + `menu.html`).

## Cómo ejecutarlo

Sitio 100% estático: abrir `index.html` en el navegador, o servir la carpeta
con un servidor estático (`npx http-server .`). `index.html` es la intro;
desde ahí "Comenzar a explorar" lleva a `experiencia.html`.

**Nota sobre la cámara:** `getUserMedia` (cámara real) requiere HTTPS o
`localhost`; al abrir el archivo directamente (`file://`) el navegador la
bloqueará y el prototipo caerá automáticamente a modo simulado, que es el
modo por defecto.

## Estructura

```
escalera/
├── index.html          Página de inicio (intro y explicación)
├── experiencia.html      Selector de historias + escenario con cámara
├── css/landing.css        Estilos de la página de inicio
├── css/styles.css          Estilos de la experiencia principal
├── js/data.js               Contenido: las 4 historias, textos, imágenes
├── js/app.js                 Lógica de interacción (sin dependencias externas)
├── assets/img/                Imágenes de referencia tomadas del prototipo Axure
└── assets/video/              Videos de prototipo (uno por historia) + póster
```

## Lógica implementada

- **Selector de historias**: grilla 2×2 sobre panel oscuro ("Seleccione la
  época que quiere conocer"), cada tarjeta con la imagen del documento de
  archivo asociado — igual al diseño ya validado con el cliente. Click en una
  tarjeta activa esa historia directamente; las flechas inferiores resaltan la
  tarjeta siguiente/anterior (navegación por teclado).
- **Una sola pantalla (ajuste 2026-11-25)**: la escena de la escalera queda
  siempre visible a la izquierda. Al elegir una época **no se abre otra
  pantalla**: el panel derecho pasa de la grilla al detalle de esa época
  (documento grande con flechas ← →, nombre, fuente y texto con scroll) y la
  escena detrás se funde al video de esa época. El botón ☰ (o Escape) vuelve a
  la grilla y la escena se funde de nuevo a la escalera base. Sobre la foto
  solo quedan los botones de filtro nocturno y 360°.
- **Sin cámara ni sonido (ajuste 2026-11-25)**: por indicación del cliente se
  retiraron los botones de cámara (real/simulada) y de sonido. La escena usa
  siempre la foto fija de la escalera como base.
- **Escena**: la columna de la escena incluye:
  - **Capas de video**: un `<video>` por historia (`assets/video/`), apilados.
    Los cuatro comparten encuadre fijo de la escalera y duración (10,1 s,
    1920×1080, 30 fps), así que al cambiar de historia la nueva capa arranca
    en el mismo instante que la anterior y se hace un fundido de 600 ms sin
    que la imagen salte. Se reproducen en bucle y silenciados.
    Archivos remuxeados con `+faststart` (sin recodificar) para que empiecen
    a reproducirse antes de terminar de descargarse.
  - **Filtro nocturno** (botón). El video de "El Fantasma" ya viene con
    gradación nocturna azulada, así que el filtro arranca apagado en todas las
    historias para no oscurecerlo dos veces.
  - **Panel con texto informativo** con scroll propio, citando el documento
    histórico real asociado a cada historia (cuando existe).
  - **Vista 360°** (solo en "La Penitenciaría"): overlay estático con la foto
    360 de referencia; es un marcador de posición, no un visor 360 real.
  - Navegación entre historias sin salir del escenario (anterior/siguiente) y
    botón para volver al selector.

## Pendiente para el diseño final

- Los **textos (introducción y relatos históricos) son lorem ipsum**, salvo
  las citas de los documentos de archivo (título y año), que sí son reales.
- Los **videos actuales son de prototipo**: escena completa sin canal alfa,
  y llevan una marca de agua de generación por IA en la esquina inferior
  derecha. Para superponerlos sobre la cámara real hacen falta versiones con
  transparencia (WebM VP9 con alfa / HEVC con alfa en Safari) o con fondo de
  croma; basta con cambiar `video` y `poster` en `js/data.js` y quitar la
  regla `.stage.is-camera-real .stage__layer.is-active` de `css/styles.css`.
- En todos los videos aparece la misma visitante (gorra blanca, jean); si es
  el hilo narrativo entre épocas, conviene reflejarlo en los textos.
- Las **capas del menú con halo** (`halo_1`–`halo_4`) y el **reproductor de
  audio de 2:30** de la referencia Axure siguen sin implementar.
- El **visor 360°** es un marcador estático; si se requiere un recorrido 360
  real habría que integrar una librería o visor dedicado.
- La referencia incluía además un submenú flotante de audio (reproducir/pausar
  narración) que no se implementó en esta primera entrega por no estar en el
  alcance funcional de la tarea de Jira (MN-3); puede añadirse después
  siguiendo el mismo patrón de botones de `stage-controls`.
- Las **posiciones y la alineación de la superposición sobre la cámara** son
  aproximadas; deben ajustarse visualmente una vez haya diseño definitivo.
