# UI Kit — Sitio cliente (marketplace)

Recreación hi-fi del marketplace público de Almacén Artesanías.

## Componentes
- `Header.jsx` — nav fijo con glassmorphism on-scroll, ícono de bolsa con contador.
- `Hero.jsx` — composición editorial: título display Fraunces, orbes orgánicos animados (sustituyen a la escena Three.js del canon), vasija flotante con tags glass sobre ella, cordillera niebla al fondo.
- `Collection.jsx` — grid de piezas filtrables por oficio. Card con categoría glass, precio mono, estado semántico.
- `Maestros.jsx` — perfiles editoriales con retrato, overlay cálido, número de años en display, cita en itálica.
- `Territorio.jsx` — sección dark con mapa conceptual de municipios del Quindío.
- `Footer.jsx` — cierre sobre coffee, con brand-wordmark clay-light.
- `PieceModal.jsx` — detalle de pieza con backdrop glass y grid 2 columnas.

## Flujo interactivo (demo)
1. Cargar página → hero con niebla y vasija.
2. Scroll → header transparente → glass.
3. Click pieza en colección → abre modal detallado.
4. "Agregar a la bolsa" → toast inferior derecho + counter del header sube.
5. Filtrar por categoría en la colección.

## Nota de sustitución
- Three.js no incluido (pesa y no aporta al preview estático). Se evoca con orbes morfeando (CSS). Producción debe implementar la escena 3D hipnótica documentada en README.
- Imágenes: placeholders SVG estilizados. Producción debe usar fotografía cálida con grano.
