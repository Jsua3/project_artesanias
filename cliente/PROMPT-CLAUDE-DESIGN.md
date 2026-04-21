# Prompt maestro para Claude Design — Almacén Artesanías

Copia todo lo que está debajo de la línea `─── COPIAR DESDE AQUÍ ───`
y pégalo en Claude Design. Está pensado para que genere una identidad
visual y mockups de la interfaz cliente de "Almacén Artesanías".

─── COPIAR DESDE AQUÍ ───

Actúa como director de arte senior especializado en branding artesanal
latinoamericano y en interfaces inmersivas (glassmorphism + 3D sutil).
Diseñarás la experiencia visual completa del cliente para "Almacén
Artesanías". Quiero piezas listas para presentar a stakeholders y, al
mismo tiempo, suficientemente concretas para que un equipo frontend
las pueda construir tal cual.

## 1. La empresa

**Nombre**: Almacén Artesanías (interno: "almacen-arle")
**Qué es**: Marketplace digital que conecta a artesanos colombianos del
Eje Cafetero con compradores locales e internacionales. No es un
e-commerce genérico: es un museo vivo donde cada pieza viene con el
nombre del artesano, el municipio de origen, la historia del oficio
y un trazo del paisaje que inspiró la pieza.

**Misión**: Dignificar el trabajo artesanal cafetero pagando precios
justos, documentando el saber ancestral y haciendo visible quién hizo
qué — el comprador sabe exactamente a qué familia apoya con su compra.

**Propuesta de valor diferencial**:
- Trazabilidad total: cada producto muestra artesano, municipio,
  materiales y historia.
- Cuando alguien compra, el artesano recibe una notificación con el
  nombre del comprador (evento real, no métrica agregada).
- Catálogo curado, no infinito. Prefiere 12 piezas excepcionales a
  12.000 mediocres.

**Audiencia**:
- Primaria: colombianos urbanos 28-55 años, profesionales con
  ingresos medios-altos, que valoran lo hecho a mano y quieren
  decorar su casa con piezas con historia.
- Secundaria: turistas internacionales que visitaron el Quindío y
  quieren seguir comprando después de volver a casa.
- Terciaria: diseñadores de interiores y hoteles boutique que
  buscan piezas únicas para proyectos.

**Tono de voz**: cálido, reverente pero no solemne. Nunca paternalista
con los artesanos. Habla de "maestros", "oficio", "taller", no de
"proveedores" ni "SKUs". Cero emojis. Frases cortas. El español es
colombiano neutro, con sabor regional ocasional ("guadua", "macana",
"molinillo").

## 2. Contexto geográfico (esto es clave para la estética)

Los dos municipios pilar son **Filandia** y **Salento**, ambos del
**departamento del Quindío**, en el corazón del Paisaje Cultural
Cafetero (Patrimonio Unesco). Lo que define visualmente esta región:

- **Bahareque cafetero**: arquitectura de guadua, barro y tapia
  pisada, con fachadas policromas (rojo, azul, amarillo, verde,
  turquesa, fucsia) sobre madera envejecida.
- **Palma de cera del Quindío** (árbol nacional): tronco blanco
  ceroso, altura vertiginosa, siempre envuelta en niebla.
- **Guadua angustifolia**: bambú nativo, grano verde-dorado con
  nudos marcados.
- **Neblina permanente** entre las montañas al amanecer — clave
  para el hero del sitio.
- **Cerámica La Chamba** (aunque sea de Tolima, inspira la línea de
  barro negro) y cestería de iraca.
- **Café**: granos verdes-rojos-bordó, tostado color caoba, vapor
  subiendo de las tazas.

No quiero clichés turísticos (sombreros vueltiaos, palmas de coco,
playas). Tampoco Macondo genérico. Quiero Filandia a las 6am:
madera húmeda, humo de leña, niebla entre los cafetales.

## 3. Dirección estética

**Concepto central**: "Ancestral cafetero fundido con glassmorphism
moderno y 3D inmersivo". Es decir, el material de base (barro,
guadua, lana cruda, palma) convive con paneles translúcidos de
vidrio esmerilado y momentos tridimensionales en los titulares.

**Palabras ancla**: Tierra. Neblina. Artesanía. Reverencia. Cafetal.
Filamento dorado. Madera húmeda. Vidrio esmerilado. Guadua. Silencio.

**NO**: Tech startup. Purple gradients. Gradientes genéricos sobre
blanco. Iconos lineales genéricos tipo Heroicons. Fotos stock de
manos anónimas. Fonts como Inter, Roboto, Poppins, Space Grotesk.

## 4. Paleta de color exacta

| Rol                  | Nombre          | Hex       |
|----------------------|-----------------|-----------|
| Primario tierra      | Clay            | #A67C52   |
| Tierra profunda      | Clay deep       | #704A2E   |
| Fondo crema          | Cream           | #F5F0E8   |
| Fondo hueso          | Bone            | #EDE4D3   |
| Vegetación fresca    | Sage            | #8A9A7B   |
| Vegetación profunda  | Moss            | #5A6B4A   |
| Texto y oscuros      | Coffee          | #3E2723   |
| Acento filamento     | Gold            | #C9A253   |
| Violeta cordillera   | Mauve           | #A88696   |
| Naranja brasa        | Ember           | #C86A3A   |

Reglas:
- Dominante: Cream/Bone (65% de la superficie).
- Texto siempre Coffee sobre Cream (contraste 10.5:1, AAA).
- Gold es SOLO acento: filamentos, bordes de 1px, íconos pequeños,
  subrayados. Nunca bloques grandes dorados.
- Nunca combines Gold con Ember (riña cromática).

## 5. Tipografía

**Display (hero, titulares grandes)**: Cormorant Garamond — italic
en citas del artesano, regular en títulos. Tracking ligeramente
apretado (-0.02em).

**Poster (números, slogans, categorías)**: Fraunces — optical size
grande, weight 600-800, tracking negativo.

**Body (párrafos, UI)**: Outfit — weight 300 para texto largo, 500
para labels.

**Mono (precios, IDs, códigos)**: JetBrains Mono — opcional, solo
para tickets de compra y metadatos.

Jerarquía:
- H1 hero: Fraunces 96-128px, italic variable.
- H2 sección: Cormorant Garamond 56px.
- H3 tarjeta: Fraunces 28px weight 600.
- Body: Outfit 16-18px weight 300, line-height 1.7.
- Label: Outfit 12px weight 500, uppercase, letter-spacing 0.15em.

## 6. Sistema de composición

- **Grid base**: 12 columnas en desktop, 6 en tablet, 4 en móvil.
- **Espaciado generoso**: prefiero respiración a densidad. Padding
  mínimo de secciones: 120px vertical en desktop.
- **Asimetría**: nunca pongas título centrado + imagen centrada +
  texto centrado. Rompe la simetría: título a la izquierda, imagen
  desplazada 20% a la derecha bajando la línea, texto indentado.
- **Bordes**: casi todo tiene border 1px rgba(Gold 35%) y
  border-radius pequeño (4-8px). Nada de cards redonditas de 24px.
- **Sombras**: cálidas, nunca grises puras.
  `box-shadow: 0 20px 40px -18px rgba(62,39,35,.35)`.

## 7. Glassmorphism (la capa moderna)

Los paneles flotantes (modales, header fijo, tarjetas de producto
al hacer hover, CTAs) usan:

```css
background: rgba(245, 240, 232, 0.55);
backdrop-filter: blur(18px) saturate(140%);
border: 1px solid rgba(201, 162, 83, 0.35);
box-shadow:
  inset 0 1px 0 rgba(255,255,255,.6),
  0 20px 40px -18px rgba(62,39,35,.35);
```

El vidrio siempre tiene un "filamento" dorado superior de 1px que
simula un hilo tejido. No es decoración gratuita — es el puente
visual entre el barro y el vidrio.

## 8. Momentos 3D (inmersivos pero no invasivos)

En el hero principal quiero una escena Three.js con:
- 5 vasijas de barro (LatheGeometry) girando muy lento.
- 3 guaduas verticales (CylinderGeometry + textura grano).
- 2 palmas de cera estilizadas al fondo.
- Partículas doradas (~1.400) simulando polvillo al amanecer.
- Niebla volumétrica (~800 partículas) cerca del suelo.
- Luz hemisférica dorada + direccional suave.
- Fog del escenario en Cream para fundir con el fondo.

El 3D debe ser hipnótico, no vertiginoso. Nada de cámara libre ni
OrbitControls visibles. Solo parallax sutil con el mouse (máx 4
grados de rotación de cámara).

Respeta `prefers-reduced-motion`: si está activo, muestra un
gradiente estático con el mismo mood.

## 9. Pantallas / piezas a diseñar

Necesito mockups de:

1. **Hero / Landing** (desktop + mobile)
   - Titular: "Hecho a mano en el Quindío"
   - Subtítulo: "Piezas únicas de los maestros de Filandia y Salento.
     Cada compra llega directamente al taller."
   - CTA primario: "Recorrer el catálogo" (vidrio + filamento dorado).
   - CTA secundario: "Conocer los municipios" (link underline gold).
   - Escena 3D detrás (descrita arriba).

2. **Sección Municipios**
   - Dos tarjetas grandes: Filandia y Salento.
   - Cada una con: emblema SVG, altitud, año de fundación, landmark,
     paleta local de 3 colores, número de artesanos activos.
   - Link "Ver artesanos de [municipio]" en gold.

3. **Grid de Catálogo (12 piezas)**
   - Filtros por categoría (cerámica, cestería, textil, madera,
     joyería, café especial).
   - Cada tarjeta: visual SVG procedural, nombre pieza, artesano,
     municipio (chip), precio, stock disponible.
   - Hover: la tarjeta se eleva 4px, borde dorado se enciende.

4. **Modal de producto**
   - Visual grande a la izquierda (60%).
   - A la derecha: título, artesano clickeable, historia (2-3 párrafos),
     materiales, paleta de la pieza (3 swatches), stock, precio, CTA
     "Comprar" (disabled si no hay sesión + tooltip invitando a loguear).
   - Badge "Pieza única" o "Edición limitada — 8 disponibles" en gold.

5. **Modal de artesano**
   - Retrato circular (placeholder con iniciales si no hay foto).
   - Nombre, municipio, oficio, años de experiencia.
   - Cita textual en Cormorant italic, comillas grandes doradas.
   - Lista de piezas del artesano disponibles.

6. **Modal de autenticación**
   - Dos tabs: Iniciar sesión / Crear cuenta.
   - Misma estética glassmorphism.
   - Copy: "Tu cuenta es la llave para apoyar directamente al
     artesano." (nunca "regístrate para comprar").

7. **Estado post-compra** (tarjeta de confirmación)
   - Mensaje: "Tu compra llegó al taller de [Nombre artesano] en
     [Municipio]. Recibirás noticias suyas pronto."
   - Ilustración sutil de un sobre de papel artesanal.

8. **Footer**
   - Tres columnas: Navegación / Municipios / Contacto.
   - Línea final: "Almacén Artesanías · Quindío, Colombia · Hecho
     con reverencia por los oficios del Eje Cafetero."

## 10. Contenido real (úsalo tal cual, no inventes nombres genéricos)

**Municipios**:
- Filandia — 1878 — 1.923 msnm — mirador "Colina Iluminada" — oficios
  fuertes: cestería en bejuco, café especial.
- Salento — 1842 — 1.895 msnm — Valle del Cocora — oficios fuertes:
  tallado en guadua, alpargatería, café de finca.

**Artesanos de ejemplo** (puedes usar estos nombres o similares):
- Aurora Henao — cestería — Filandia
- Jesús Buitrago — guadua — Salento
- Rosalba Cárdenas — cerámica — Filandia
- Hernán Mejía — café especial — Salento
- Marta Gálvez — telar de lana — Filandia
- Ignacio Duque — talla en madera — Salento

**Categorías de producto**: Cerámica · Cestería · Textil · Madera ·
Joyería · Café especial.

## 11. Accesibilidad y constraints técnicos

- WCAG 2.1 AA mínimo, AAA donde sea posible (el par Coffee/Cream ya
  lo cumple).
- Focus rings visibles: 2px gold con offset 3px.
- Hit targets mínimo 44x44px en móvil.
- Todo debe sobrevivir a `prefers-reduced-motion` y a `prefers-color
  -scheme: dark` (en dark mode invierte: fondo Coffee, texto Cream,
  acentos Gold/Ember).
- Layout responsive real en 375 / 768 / 1440.
- Bundle total meta: < 250 kB inicial (el sitio correrá tras un
  nginx en una EC2 t3.micro con poca RAM).

## 12. Entregables que quiero recibir

1. Moodboard en una sola pieza (1440x900): referencias de materia,
   color, tipografía, textura.
2. Los 8 mockups descritos arriba (desktop 1440 + móvil 375 para
   hero, catálogo y modal de producto; solo desktop para los demás).
3. Pieza de estilo tipográfico mostrando jerarquía completa.
4. Paleta de color con hex y ejemplos de uso correcto/incorrecto.
5. Especificación del hero 3D (storyboard de 4 frames + parámetros
   de luz y cámara).
6. Un banner de "Instagram story" 1080x1920 con el mismo mood,
   para campaña de lanzamiento.

## 13. Qué evaluaría como éxito

- Un diseñador ajeno puede mirar cualquier pantalla y saber que es
  Almacén Artesanías sin leer el logo.
- Un artesano de Filandia vería las tarjetas y sentiría que
  respetamos su oficio (no lo folclorizamos ni lo tecnificamos).
- Un comprador urbano sentiría que está en un museo, no en un
  marketplace.
- Nada del diseño se parece a Airbnb, Etsy ni a un "startup
  cafetera". Somos nosotros.

Empieza generando primero el moodboard y el hero desktop. Después
itera el resto. Si tienes que elegir entre "bonito" y "con carácter",
elige siempre carácter.

─── FIN DEL PROMPT ───
