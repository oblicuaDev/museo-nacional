# Recursos de imágenes (`assets/img/`)

Estructura actual de recursos descargados e integrados en `js/data/murales.js`:

```text
assets/img/
├── logo-claustro.svg
├── planos/
│   ├── piso-1.png
│   └── piso-2.png
└── ciudad-de-dios/
    ├── completo.jpg
    ├── 01-san-agustin.jpg
    ├── 02-texto-latin.jpg
    ├── 03-torre-medieval.jpg
    ├── 04-murallas.jpg
    ├── 05-angel-custodio.jpg
    ├── 06-arcangel-custodio.jpg
    ├── 07-puertas-paraiso.jpg
    ├── 08-monje-bienvenida.jpg
    └── 09-campos.jpg
```

Para incorporar los demás murales del Piso 1 y Piso 2 cuando lleguen sus fotografías, copia sus fragmentos en subcarpetas por mural y actualiza únicamente las propiedades `src` (y opcionalmente `detailSrc`) en `js/data/murales.js`. Mientras `src` sea `null`, `js/utils/mockGenerator.js` genera automáticamente placeholders SVG con líneas guía continuas.
