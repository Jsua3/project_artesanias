---
name: almacen-artesanias-design
description: Use this skill to generate well-branded interfaces and assets for Almacén Artesanías (marketplace de artesanías del Eje Cafetero colombiano), either for production or throwaway prototypes, mocks, slides and landings. Contains la paleta ancestral cafetera, tipografías Fraunces / Cormorant / Outfit / JetBrains Mono, reglas de glassmorphism sutil, iconografía y UI kits para el sitio cliente y el panel admin Arle.
user-invocable: true
---

Read the `README.md` file within this skill, and explore the other available files.

Core invariants to respect:

- **Dos superficies**: `ui_kits/cliente/` (marketplace editorial) y `ui_kits/admin/` (panel Arle de inventario). No mezclar tono: cliente habla a compradores, admin habla a operadores del taller.
- **Paleta ancestral cafetera** en `colors_and_type.css`. Greige dominante, verde terra en vegetación, morado tierra como acento secundario. **Dorado solo en filamentos 1px**, nunca en bloques.
- **Tipografía**: Fraunces (display / números grandes), Cormorant Garamond (títulos, citas en itálica), Outfit 300/500 (body), JetBrains Mono (precios, SKUs). **Nunca** Inter, Roboto, Poppins, Space Grotesk.
- **Radio 4–12px** en la mayoría, 16–24px solo en modales / hero cards. Nunca "rounded-3xl everywhere".
- **Sombras cálidas con tinte coffee**, nunca grises puros.
- **Glassmorphism** solo en modales, header fijo, CTAs flotantes, tooltips — nunca decorativo sobre fondo liso.
- **Iconografía**: Material Symbols Outlined en admin (fallback: `ui_kits/admin/Icon.jsx`), Lucide en cliente. **Sin emojis**.
- **Vocabulario**: maestros, oficio, taller, pieza, vereda. **Nunca** proveedores, SKUs (en copy de marca), vendedores.
- **Tono**: cálido, reverente sin ser solemne. Español colombiano neutro. Tuteo ("te presentamos"). Frases cortas. Cero emojis.

If creating visual artifacts (slides, mocks, throwaway prototypes, landings, decks):
- Importa `colors_and_type.css` en el `<head>` para heredar tokens.
- Copia assets necesarios de `assets/` al output (logos SVG, texturas, fotos de referencia).
- Reusa componentes JSX de `ui_kits/cliente/` o `ui_kits/admin/` como punto de partida — no los reinventes.
- Respeta ritmo vertical 120px entre secciones grandes.
- Aplica `prefers-reduced-motion` en cualquier animación ambiental.

If working on production code (Angular 20 admin, o Next/Astro para cliente):
- Lee `README.md` sección **Uso con el panel admin existente** para ver qué ajustes mínimos alinean el Angular actual con este canon.
- Los tokens de `colors_and_type.css` se pueden portar directamente a `styles.scss` de Angular.

If the user invokes this skill without any other guidance, ask them what they want to build or design (¿landing? ¿slide de inversionistas? ¿nueva pantalla del admin? ¿ficha de pieza editorial?), haz 2–3 preguntas de contexto (¿audiencia? ¿tono más editorial o más operativo? ¿formato final?), y actúa como diseñador experto que entrega HTML artifacts o código de producción según la necesidad.
