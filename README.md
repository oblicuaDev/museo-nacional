# Claustro de San Agustín — Prototipos funcionales

Punto de acceso único (`index.html`) a los prototipos desarrollados para las
experiencias multimedia del Claustro San Agustín (Banco de la República),
correspondientes a las tareas del proyecto **MN** en Jira.

## Cómo ejecutarlo

Sitio 100% estático: abrir `index.html` en el navegador, o servir la carpeta con
cualquier servidor estático (`npx http-server .`).

## Estructura

```
Museo Nacional/
├── index.html              Hub: listado de los 3 prototipos
├── css/hub.css               Estilos del hub
├── assets/img/                Imágenes compartidas del hub (foto, logo)
├── murales/                   MN-2 · Navegación interactiva de murales (Listo)
├── capas-historicas/           MN-1 · Capas históricas (Listo)
└── escalera/                    MN-3 · Historias de la escalera (Listo)
```

## Prototipos (tareas Jira — proyecto MN)

| Tarea | Prototipo | Estado | Carpeta |
|---|---|---|---|
| [MN-2](https://oblicua.atlassian.net/browse/MN-2) | Murales | Listo | `murales/` |
| [MN-1](https://oblicua.atlassian.net/browse/MN-1) | Capas históricas | Listo | `capas-historicas/` |
| [MN-3](https://oblicua.atlassian.net/browse/MN-3) | Historias de la escalera | Listo | `escalera/` |

Cada prototipo es independiente (su propio HTML/CSS/JS, sin dependencias
cruzadas); el hub solo los enlaza para facilitar la presentación conjunta al
cliente.

Cada subcarpeta tiene su propio `README.md` (cuando aplica) con el detalle de
lo implementado y lo pendiente para el diseño final.
