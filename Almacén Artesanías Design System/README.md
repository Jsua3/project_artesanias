# Almacén Artesanías — Design System

**Marketplace de artesanías del Eje Cafetero colombiano.** Estética ancestral cafetera (barro, guadua, neblina) fusionada con glassmorphism moderno y momentos 3D inmersivos. Dos superficies: sitio cliente (marketplace) y panel de administración (gestión de talleres, inventario, ventas).

> Donde la tradición encuentra su camino hacia la sostenibilidad.

---

## Contexto del producto

**Almacén Artesanías** es un marketplace que conecta a los maestros artesanos del Quindío (Filandia, Salento, Armenia, Circasia, Pijao, Córdoba, Calarcá) con compradores urbanos, turistas que conocieron el Paisaje Cultural Cafetero, y diseñadores de interiores que buscan piezas con identidad.

El proyecto hermano **REBBECA** funciona como ecosistema de acompañamiento: diagnóstico empresarial, estructuración financiera y articulación comercial para que cada taller convierta su oficio en prosperidad sostenible.

### Dos superficies

1. **Sitio cliente** — Marketplace. Colecciones por oficio (barro, guadua, tejido, madera), perfiles de maestros, historias detrás de cada pieza, checkout.
2. **Panel de administración (Arle)** — Sistema de inventario para artesanos y administradores: dashboard, catálogo, categorías, artesanos, clientes, ventas, stock, entradas/salidas, reportes. Roles ADMIN / OPERATOR.

### Audiencia

- Colombianos urbanos 28–55 que valoran lo hecho a mano
- Turistas que conocieron el Quindío y quieren volver con una pieza
- Diseñadores de interiores buscando piezas con identidad territorial

### Referencias geográficas (mood)

Filandia, Salento, bahareque cafetero, palma de cera, guadua, neblina al amanecer, Valle del Cocora, cafetales en ladera.

---

## Fuentes consultadas

- **GitHub:** `Jsua3/project_artesanias@master`
  - `rebbeca/rebbeca-landing.html` — landing del ecosistema hermano. Visual DNA maestra (paleta, tipografía, formas orgánicas, ritmo de secciones).
  - `rebbeca/filandia.html`, `rebbeca/salento.html` — páginas de territorio.
  - `frontend/` — SPA en Angular 20 + Material 3 para el panel admin (shell, dashboard, productos, login, ventas, stock).
  - `frontend/src/styles.scss` — tokens globales, overrides de Material.
  - `frontend/src/app/shared/layout/shell/` — shell oscuro con sidenav (charcoal), marca SVG (vasija estilizada).
  - Backend Spring microservicios (auth, catalog, inventory, report). Relevante solo para modelos de dominio (Artesano, Product, Category, Stock, Venta, Cliente).
- **Briefing del usuario:** paleta ancestral ajustada, tipografías (Fraunces añadida para display), reglas de tono y estética (glassmorphism sutil, border-radius pequeño, sombras cálidas, asimetría, 3D hipnótico).

---

## Índice del sistema

| Archivo / carpeta | Propósito |
|---|---|
| `README.md` | Este documento — contexto, fundamentos de contenido y visuales, iconografía. |
| `SKILL.md` | Manifiesto Agent Skills (cross-compatible con Claude Code). |
| `colors_and_type.css` | Tokens CSS: variables de color, tipografía base + semántica, espaciado, sombras, radios, glass. |
| `fonts/` | Google Fonts usadas (referencia; cargadas vía `<link>`). |
| `assets/` | Logos, marcas SVG, texturas, imágenes de referencia. |
| `preview/` | Cards del Design System tab (swatches, specimens, tokens, componentes). |
| `ui_kits/cliente/` | UI kit del sitio cliente (marketplace). `index.html` + componentes JSX. Hero editorial + colección + maestros + territorio. |
| `ui_kits/admin/` | UI kit del panel Arle (inventario). `index.html` + componentes JSX. Dashboard, Artesanías, Artesanos, Ventas, Stock. |

---

## CONTENT FUNDAMENTALS

### Tono

**Cálido, reverente sin ser solemne.** Español colombiano neutro. Como un anfitrión que te invita a pasar al taller: sin prisa, con cuidado, con respeto por el oficio.

### Vocabulario

- **Siempre:** *maestro, maestra, oficio, taller, pieza, trazo, urdido, quemado, torneado, vereda, cafetero, neblina, guadua.*
- **Nunca:** *proveedor, SKU, producto (a secas, dentro del marketing), vendedor, usuario, cliente objetivo.* En el panel admin sí: *producto, stock, SKU* (vocabulario interno, no de cara al comprador).
- "Artesanía" y "pieza" se alternan; evitar repetir "producto" en copy de marca.

### Persona gramatical

- **Marca a lector:** usa *"te"* (informal colombiano neutro). *"Te presentamos a doña María"*, no *"le presentamos a doña María"*.
- **Primera persona plural:** *"Acompañamos"*, *"Caminamos contigo"*. Evita *"yo"* de marca.
- **Para el maestro:** siempre por nombre + vereda. *"Don Hernán, maestro guaduero de la vereda La Cristalina, Filandia."*

### Casing

- **Display / héroes:** `UPPERCASE` con tracking amplio (6–8px) para nombres de marca, y Title Case con itálica para taglines.
- **Body:** Sentence case, siempre. Nunca Title Case en párrafos.
- **Labels / eyebrows:** `UPPERCASE` con tracking 3–5px, tamaños 10–12px.
- **Botones:** `UPPERCASE` con tracking 2–3px, en Outfit 500.

### Cero emojis

No usamos emojis en copy de cara al comprador. (El repo antiguo los tenía en secciones "feature" — los reemplazamos con iconografía lineal o viñetas ◆.)

### Frases cortas. Párrafos cortos.

Máximo 3 oraciones por párrafo. Ritmo de respiración, no de informe. Permítete el silencio (una línea, un divisor, una cita en itálica).

### Ejemplos reales

**Hero — sitio cliente:**
> *Piezas con nombre, con vereda, con neblina.*
> Compra directo del taller. Cada maestra, cada maestro, cuenta su historia.

**Ficha de pieza:**
> **Vasija de barro quemado** — 32 cm × 24 cm
> *Doña Rosa Elvira · Taller La Tulia · Pijao*
> Torneada a mano con arcilla de la vereda El Crucero. Quemada a leña dos noches.

**Microcopy / estados vacíos (admin):**
> Aún no hay ventas registradas. Cuando registres la primera, aparecerá aquí.

**CTA:**
> Pasa al taller    ·    Conoce al maestro    ·    Llevar a casa

**Evita:**
> ❌ "¡Los mejores productos artesanales!"
> ❌ "Proveedores certificados"
> ❌ "Stock limitado — ¡compra ya!"

---

## VISUAL FOUNDATIONS

### Paleta

Paleta **ancestral cafetera — greige, verde terra, morado tierra**. Greige domina; verde terra es la vegetación; morado tierra es el acento secundario principal. Dorado aparece solo como filamento. Morado tierra y ember nunca juntos.

| Token | Hex | Uso |
|---|---|---|
| `--greige` | `#A69683` | **Greige medio**. Tierra dominante. CTAs. (alias `--clay`) |
| `--greige-deep` | `#6E6152` | Greige profundo. Hover de CTAs, texto sobre cream. (alias `--clay-deep`) |
| `--greige-light` | `#C4B7A5` | Greige claro. Decoración, hover de cards. |
| `--cream` | `#EFEAE1` | Greige muy claro. Fondo principal (65% superficie). |
| `--bone` | `#E4DDD1` | Greige claro. Fondo secundario, cards neutras. |
| `--warm-white` | `#F8F5EE` | Surface luminoso para cards sobre cream. |
| `--coffee` | `#3A3228` | Greige casi negro. Texto AAA, sidenav oscuro. |
| `--terra-green` | `#7A8968` | **Verde terra**. Vegetación. Categoría "tejido vegetal". (alias `--sage`) |
| `--terra-green-deep` | `#4E5A42` | Verde terra profundo. Estado "OK", texto sobre verde. (alias `--moss`) |
| `--terra-purple` | `#8E7482` | **Morado tierra**. Acento secundario principal. Categorías "textil", "tinte". (alias `--mauve`) |
| `--terra-purple-deep` | `#6E586A` | Morado tierra profundo. Hover, texto sobre morado. |
| `--gold` | `#B89A5E` | Dorado apagado — **solo filamentos 1px, bordes, subrayados** — **nunca bloques ni áreas rellenas**. |
| `--ember` | `#B07050` | Terracota apagada. Alertas no-críticas. **Nunca junto al morado tierra.** |

### Tipografía

Cuatro familias, papeles estrictos. **Nunca** Inter, Roboto, Poppins, Space Grotesk.

- **Display — Fraunces** (600–800): héroes, números grandes de estadística, "80.000", "Armenia · 2026". Character: alto contraste, ligaduras orgánicas.
- **Serif editorial — Cormorant Garamond** (400–600, también itálica): títulos de sección, subtítulos de pieza, citas. Carga la voz reverente.
- **Body — Outfit** (300 / 500): UI, párrafos, labels, nav, inputs. Neutro y respirado.
- **Mono — JetBrains Mono** (400, 500): precios en COP, tickets de venta, códigos SKU, tabular nums.

Escala (ver `colors_and_type.css`): h1 64/1.05, h2 48/1.1, h3 32/1.2, h4 24/1.3, body 16/1.65, small 13/1.5.

### Espaciado

- Base: `4px`. Escala 4 / 8 / 12 / 16 / 24 / 32 / 48 / 64 / 96 / **120** / 160.
- **120px vertical entre secciones grandes** (generoso, respirado). Nunca menos de 80px entre hero y siguiente sección.
- Dentro de componentes: 16/24/32. Gutters de grid: 24 mobile, 32 desktop.

### Fondos

- **Superficie 65% `--cream`.** Nunca blanco puro.
- **Textura de ruido SVG** overlay, opacity 0.025–0.035, fixed, pointer-events none. Da calidez de papel.
- **Formas orgánicas blur** en héroes: radios asimétricos `60% 40% 50% 50%`, `border-radius` que se anima lento (12–18s). Opacity 0.12–0.22.
- **Full-bleed imagery** en cards de pieza y territorio. Imágenes con grano cálido, nunca frías.
- **No gradientes morados.** No gradientes que griten. Únicos gradientes aceptables: cream→bone (sutil) y clay-deep→clay→mauve-deep (en CTA sections grandes, raro).

### Animación

- **Easing:** `cubic-bezier(0.25, 0.46, 0.45, 0.94)` como default (ease-out suave). Para entradas escalonadas `cubic-bezier(0.22, 1, 0.36, 1)`.
- **Duraciones:** UI 250–400ms, entradas de sección 600–800ms, loops ambientales 12–18s.
- **Reveal on scroll:** opacity 0→1 + translateY(40px→0) al entrar viewport. Stagger de 100–150ms entre hijos.
- **3D (Three.js) en hero:** vasijas girando lento, partículas doradas, niebla. **Hipnótico, no vertiginoso.** Respeta `prefers-reduced-motion`.
- **Counters:** ease-out-cubic, duración 2s, desde 0.
- **Sin bounces agresivos.** Sin spring físico dramático. El movimiento imita niebla, no pelotas.

### Estados hover

- **Botón primario (clay):** background → `--clay-deep`, `translateY(-2px)`, sombra cálida crece.
- **Botón secundario (ghost):** fill con clay, texto a cream.
- **Card:** `translateY(-5px a -8px)`, sombra `0 20px 40px -18px rgba(62,39,35,.35)` crece, rotación sutil −0.5° opcional en service cards.
- **Nav link:** color → clay, underline gold 1.5px cubre de 0→100% (easing elástico suave).
- **Tag (municipio, categoría):** fill clay, texto cream.
- Ripple sutil blanco 25% en CTAs (círculo expandiendo desde el punto del click).

### Estados press

- **Scale a 0.97–0.98**, `translateY(-1px)`, sombra se colapsa. Transición 100ms (inmediata para feedback).
- Color inalterado. Nunca oscurecer el botón al press.

### Bordes

- **Tarjetas neutras:** `1px solid rgba(166, 124, 82, 0.08)` (clay a 8%).
- **Glass (modales, header fijo, CTAs glass):** `1px solid rgba(201, 162, 83, 0.35)` (gold 35%).
- **Divisores:** `1px solid rgba(166, 124, 82, 0.1)` o `rgba(245, 240, 230, 0.08)` en fondos oscuros.
- **Filamentos dorados:** `1px solid var(--gold)` en underlines editoriales, accent rules. **Jamás 2px+.**

### Sombras (cálidas, nunca grises)

Sistema de sombras teñido con `coffee`:

- `--shadow-sm`: `0 2px 8px -2px rgba(62, 39, 35, 0.12)`
- `--shadow-md`: `0 8px 20px -10px rgba(62, 39, 35, 0.25)`
- `--shadow-lg`: `0 20px 40px -18px rgba(62, 39, 35, 0.35)` — **la firma**
- `--shadow-xl`: `0 30px 60px -20px rgba(62, 39, 35, 0.4)`
- `--shadow-glass`: `0 8px 32px 0 rgba(112, 74, 46, 0.18)` con backdrop-blur.

**Nunca** `rgba(0,0,0,...)` para sombras. Siempre con tinte coffee/clay.

### Glassmorphism (sutil, selectivo)

Aplicado solo en: modales, header fijo cuando scrollea, CTAs flotantes, tooltips prominentes.

```css
backdrop-filter: blur(18px) saturate(140%);
background: rgba(245, 240, 232, 0.72);
border: 1px solid rgba(201, 162, 83, 0.35);
box-shadow: var(--shadow-glass);
```

Sobre fondos oscuros: `rgba(62, 39, 35, 0.55)` + blur(18px).

### Radios

- **Pequeños (el default):** 4, 6, 8px para botones rect, inputs, chips cuadrados, bordes de ficha.
- **Medianos:** 12, 16px para cards de pieza, data cards.
- **Grande:** 20, 24px — solo modales y hero cards.
- **Pill (50px):** botones CTA, tags de municipio, chips.
- **Jamás** la trampa de "rounded-3xl everywhere" (24px en todo). Cards de pieza: 12px.

### Cards

| Tipo | Fondo | Borde | Sombra | Radio |
|---|---|---|---|---|
| **Pieza (marketplace)** | `--cream` o `--warm-white` | `1px rgba(166,124,82,.08)` | `--shadow-md` hover `--shadow-lg` | 12px |
| **Service card (landing)** | `--cream` | none | 0 hover `--shadow-lg` | 16px |
| **Plan card** | `--warm-white` | `1.5px rgba(166,124,82,.12)`, featured `1.5px --clay` | hover `--shadow-lg` | 20px |
| **Glass (modal / header)** | `rgba(245,240,232,.72)` + blur(18px) | `1px gold 35%` | `--shadow-glass` | 16px |
| **Data card (admin mobile)** | `--warm-white` | `1px rgba(166,124,82,.1)` | `--shadow-sm` | 12px |
| **Dashboard stat card** | `--warm-white` | `1px rgba(166,124,82,.08)` | `--shadow-sm` | 16px |

### Layout

- **Asimetría intencional.** El hero centra brand pero descentra formas orgánicas. About: grid 1fr/1fr pero el card visual flota 20px más abajo que el texto.
- **Max-widths:** contenido editorial 720px, grid de piezas 1280px, hero full-bleed.
- **Fixed:** nav (transparent → glass al scroll a 50px). Sidebar admin fija 260px.
- **Gutters:** 32px desktop, 16–24px mobile.

### Transparencia y blur

- Blur solo cuando hay algo significativo detrás (scroll header, modales sobre contenido, cards sobre 3D hero).
- Nunca blur decorativo sobre fondo liso — eso se lee cheap.
- `backdrop-filter: blur(12–18px) saturate(140%)`.

### Iconografía

Ver sección **ICONOGRAPHY** más abajo.

### Imágenes

- **Cálidas, grano suave.** Luz dorada de amanecer o luz difusa de taller.
- Predomina cream/clay/sage/coffee en la paleta fotográfica.
- **Evitar:** fotos stock de "manos anónimas" trabajando barro. Siempre con nombre del maestro y vereda.
- **Evitar:** sombreros vueltiaos, palmas de coco, estética costeña. Somos montaña cafetera.
- Formato preferido: retrato del maestro + detalle de pieza. Lo inmersivo del territorio.

### Protección de legibilidad sobre imágenes

Overlay gradient `linear-gradient(to top, rgba(62,39,35,.6) 0%, transparent 60%)` en la mitad inferior, siempre que haya texto sobre foto.

### Ritmo vertical / respiración

Secciones grandes: 120px arriba y abajo. Dentro de una sección: 24–48px entre bloques. El "aire" es parte del diseño — resistir la tentación de llenar.

---

## ICONOGRAPHY

### Enfoque

- **Material Symbols (outlined)** ya se usa extensivamente en el panel admin (nav: `dashboard`, `palette`, `category`, `point_of_sale`, `warehouse`, `add_circle_outline`, `assessment`, etc). Se mantiene este sistema en admin por coherencia con el código existente.
- **Lucide** para el sitio cliente (marketplace) — stroke 1.5, lineal, coherente con la estética editorial. Mismo peso visual que Material outlined.
- **Nunca** Heroicons genéricos (demasiado Dribbble/SaaS).
- **Nunca** iconos rellenos en áreas grandes — solo outlined / stroke.

### CDN

```html
<!-- Material Symbols (admin) -->
<link href="https://fonts.googleapis.com/icon?family=Material+Icons+Outlined" rel="stylesheet">

<!-- Lucide (cliente) -->
<script src="https://unpkg.com/lucide@latest/dist/umd/lucide.min.js"></script>
```

### Logos / marca SVG

La marca "Artesanías" en el código usa un SVG custom: círculo con gota/hoja interior y núcleo central. Interpretable como **vasija vista de perfil / semilla germinando / gota de neblina**. Se conserva en `assets/logo-artesanias.svg`.

### Iconografía custom

Cuando Lucide no cubre un concepto cafetero (guadua, vasija de barro, telar, torno, grano de café tostado), se dibujará un set custom en el futuro. Por ahora, fallback al icono Lucide más cercano (`mountain`, `leaf`, `coffee`) y se **flaggea** en copy (ej: etiqueta de categoría con texto).

### Unicode / viñetas

- **Divisor editorial:** `◆` (rombo) como bullet en plan features — ya establecido en landing.
- **Filamento:** `·` (middle dot) para separar meta (maestro · vereda · municipio).
- **Em dash:** `—` para citas, pausas editoriales. Nunca `--`.
- **Sin emojis** en copy de marca. (Los emojis 🌿 🎨 📈 🤝 presentes en el landing actual deben reemplazarse por iconos Lucide en el rediseño — ver sección problem en README del UI kit cliente.)

### Favicon

Versión monoblanco del SVG de la vasija sobre `--clay`, 32×32 y 16×16.

---

## Uso con el panel admin existente

El Angular actual está **90% alineado** con este sistema. Ajustes mínimos necesarios para pasar a canon:
- Cargar Fraunces (display, estadísticas grandes del dashboard).
- Cambiar cards de 16–20px radius → 12px (más editorial).
- Sombras con tinte coffee (ya lo hace parcialmente con `rgba(58, 53, 48, ...)` — actualizar a `rgba(62, 39, 35, ...)`).
- Reemplazar los emojis del landing Rebbeca por iconos Lucide.

---

## Créditos

Diseño y oficio: maestros artesanos del Quindío.
Sistema: Almacén Artesanías. Armenia, Colombia · 2026.
