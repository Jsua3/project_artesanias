# Admin UI kit — Panel Arle (inventario)

Recreación del panel Angular **Arle** (sistema de inventario) con los tokens ancestrales cafeteros de este design system.

## Fuente de verdad

- `github.com/Jsua3/project_artesanias@master → frontend/` (Angular 20 + Material 3)
- Shell, navegación, KPIs, tabla de stock, lista de ventas, grid de productos — tomados del código existente (archivos `.html` de cada feature).

## Pantallas incluidas

- **Dashboard** — KPIs (Artesanías, Categorías, Stock, Stock Bajo), gráfica "Top 10 por stock" reinterpretada como barras editoriales, feed de actividad reciente.
- **Artesanías (Productos)** — grid 3 columnas con búsqueda + filtros de categoría. Card con imagen, category badge glass, alerta de stock bajo, precio mono, hover con acciones.
- **Artesanos (Maestros)** — grid editorial 3 columnas. Avatar lateral, nombre, oficio en itálica, vereda + municipio + años, contador de piezas en Fraunces.
- **Ventas** — tabla con ticket mono, cliente en serif, total en mono destacado, status badges (COMPLETADA / PENDIENTE / ANULADA).
- **Stock** — tabla con estado "Disponible / Stock bajo / Sin stock". Filas de bajo stock con borde izquierdo ember sutil.

Placeholders claros para las pantallas no detalladas (Categorías, Clientes, Entradas, Salidas, Reportes) con mensaje que apunta a los patrones reutilizables.

## Componentes

- `Sidenav.jsx` — barra oscura (coffee) 260px con marca SVG vasija, nav-sections (Catálogo / Ventas / Inventario / Admin), user card con rol en eyebrow, botón logout.
- `Dashboard.jsx` — stat cards con icon-wrap tintado, barras horizontales animadas, feed con icons tintados por tipo (entrada = verde terra, salida = ember, venta = morado tierra).
- `Productos.jsx` — gallery-grid, search input, filter-pills tipo UPPERCASE.
- `Artesanos.jsx` — artesano-card con avatar lateral + gold rule vertical, contador en display.
- `Ventas.jsx` — data-table con columnas tabulares mono.
- `Stock.jsx` — data-table con categoría secundaria bajo nombre, fila `.low-stock-row`.
- `ProductForm.jsx` — modal glass sobre backdrop coffee con form-grid 2 cols, inputs sobre cream, footer con acciones.
- `data.jsx` — dataset sintético (piezas, maestros, clientes, ventas) usando los maestros y veredas reales del briefing.

## Iconografía

Material Icons Outlined (CDN Google Fonts), coherente con el panel Angular original. Mismo nombre y mismo peso visual que en el código.

## Reglas de diseño respetadas

- **Sidebar coffee** (no negro), marca dorada 1px, hover con gradiente dorado translúcido.
- **Cards de pieza 12px** de radio (no 24px).
- **Sombras con tinte coffee** (`rgba(58, 50, 40, ...)`).
- **Precios en JetBrains Mono**, tabular nums, color clay-deep.
- **Nombres de pieza en Cormorant** weight 500.
- **Números grandes (KPIs) en Fraunces** 600, opsz 144.
- **Eyebrows UPPERCASE** tracking 0.2em, color moss.
- **Status badges**: fondo tint + dot de color, no rellenos agresivos.
- **Glass sólo en** modal, category badge sobre imagen, toast.
- **Gold 1px** en filamento lateral de la card del maestro y en border del brand icon.

## Interacciones demo

- Click en cualquier pieza del grid o botón "Nueva artesanía" → abre **modal de formulario** glass.
- Cancelar / guardar → cierra y muestra toast ancestral.
- Filtros de categoría y búsqueda filtran en vivo.
- Navegación entre 5 pantallas principales + placeholders.
- Animaciones de entrada suaves (ease-enter 500ms), barras animan con stagger 60ms.

## No implementado

- Gráficas reales con Chart.js → sustituidas por visualización editorial de barras horizontales, más coherente con la estética del design system.
- Autenticación / guards → solo UI.
- Formularios de Cliente / Artesano / Categoría → reutilizan el patrón del `ProductForm`.
