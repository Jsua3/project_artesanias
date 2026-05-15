# Rebecca V1.1

## Objetivo

Rebecca V1.1 es la version enfocada en corregir de raiz los problemas de responsividad, navegacion, botones y movimiento visual premium de la app.

## Principios de la version

- Responsividad por contrato, no por parches aislados.
- Botones con alto estable, texto balanceado y sin solaparse con metricas o barras fijas.
- Header adaptativo: completo en desktop, compacto en tablet, minimo y funcional en movil.
- Hero dividido por zonas: contenido, acciones y metricas nunca compiten por el mismo espacio.
- Animaciones premium con movimiento sutil, spring easing, parallax controlado y respeto a `prefers-reduced-motion`.
- Pruebas visuales obligatorias en 360, 390, 430, 768, 1024, 1366 y 1440 px.

## Fases oficiales

1. Crear una capa responsive base: breakpoints 360/480/640/768/1024/1280, `--space-1` a `--space-8`, radios, sombras, blur, glass, alturas minimas de botones, `safe-area`, `100svh` y `100dvh`.
2. Normalizar botones: `rb-button`, `rb-button--primary`, `rb-button--ghost`, `rb-button--text`, `rb-icon-button` y `rb-action-row`.
3. Redisenar header y navegacion: desktop completo Liquid Glass, tablet compacto, movil minimo con bottom nav/menu y espacio reservado.
4. Rehacer hero con layout por zonas: header, contenido central, CTAs y metricas separadas.
5. Animaciones premium controladas: hero escalonado, parallax sutil, Liquid Glass por puntero, spring easing, tilt solo con hover, scroll reveal y `prefers-reduced-motion`.
6. Auditoria visual obligatoria: 360x780, 390x844, 430x932, 768x1024, 1024x768, 1366x768 y 1440x900.

## Estado por fase

- Fase 1: implementada en `frontend/src/styles.scss` con tokens oficiales y aliases V1.1.
- Fase 2: implementada con sistema `rb-*` y normalizacion global de Angular Material.
- Fase 3: implementada en landing, shell publico/privado y navegacion movil.
- Fase 4: implementada en landing con hero por zonas, CTAs separados y metricas sin solaparse.
- Fase 5: implementada con motion premium, Liquid Glass interactivo y respeto a `prefers-reduced-motion`.
- Fase 6: implementada con QA visual real en Chromium/Playwright y capturas por viewport.

## Alcance implementado

- Tokens globales V1.1 en `frontend/src/styles.scss`.
- Sistema base para botones, icon buttons, action rows y contenedores.
- Landing publica estabilizada para desktop/tablet/movil.
- Hero movil con metricas separadas de CTAs.
- Header publico con comportamiento mas robusto en pantallas pequenas.
- CTA del disenador 3D movido a una franja propia.
- Disenador 3D endurecido para pantallas moviles.

## Fase 2 implementada

- Capa global para botones Angular Material con altura estable, texto centrado, envoltura segura y estados hover/active premium.
- Icon buttons normalizados con tamano fijo para evitar saltos visuales en toolbar, paneles y dialogos.
- Acciones de formularios, dialogos y encabezados alineadas por contrato para mantener simetria.
- Dialogos Material con superficie Liquid Glass, radios consistentes y profundidad visual mas fina.
- Shell privado/backoffice refinado con toolbar movil flotante, sidenav redondeado en movil y navegacion de altura uniforme.
- Footer del sidenav ordenado en grid simetrico para tema/cerrar sesion.

## Fase 3 implementada

- Contrato global para pantallas densas: `page-container`, headers, filtros, tablas, cards, chips y filas de datos.
- Tablas con scroll horizontal controlado, radios Liquid Glass y min-width estable para evitar compresion rota.
- Filtros convertidos a grid responsivo para mantener simetria en desktop, tablet y movil.
- Dashboard refinado con metricas auto-fit, quick links simetricos y paneles de artesano/domiciliario mas resistentes.
- Usuarios reforzado con KPIs adaptativos, filtros estables y cards moviles sin desbordes de texto.
- Catalogo de artesanias ajustado con toolbar/filtros simetricos y cards mas robustas.
- Pedidos estabilizado con grillas adaptativas, estados balanceados y pasos sin solaparse.
- Revision y detalle de disenos 3D alineados con el mismo contrato responsive premium.

## Fase 3B implementada

- Pulido operacional para ventas, movimientos, stock y reportes con tablas mas legibles y cards moviles resistentes.
- Tabs de reportes normalizados con vidrio, scroll movil y etiquetas que no rompen el layout.
- Barras de progreso y checkboxes estabilizados para entregas y seguimiento.
- Panel de domiciliario refinado con layout adaptativo, detalle tactil y checklists que no se desbordan.
- Formularios de entrada/salida alineados a la misma anchura premium y comportamiento movil.
- Se mantiene pendiente la fase de optimizacion/performance al cerrar la implementacion visual.

## Fase 4 implementada

- Capa global de motion premium para entradas de paginas, paneles, cards, dialogos, menus y selects.
- Estados `hover`, `active` y `focus-visible` unificados para botones, icon buttons, tabs, listas y campos.
- Foco visual accesible con anillo Liquid Glass en modo claro y oscuro.
- Estados de carga refinados con halo animado y spinners integrados al lenguaje visual.
- Barras de progreso con brillo sutil y movimiento controlado.
- Directiva `appLiquidPointer` extendida para responder tambien a foco por teclado.
- Todo el motion respeta `prefers-reduced-motion` para evitar exceso de movimiento.

## Fase 6 implementada

- Capturas generadas con Chromium/Playwright para el landing en:
  360x780, 390x844, 430x932, 768x1024, 1024x768, 1366x768 y 1440x900.
- Capturas generadas para el disenador 3D en:
  360x780, 390x844, 768x1024 y 1366x768.
- Artefactos de QA guardados en `qa-screenshots/phase6-playwright/`.
- Hallazgo corregido: el hero tenia un primer frame demasiado transparente/borroso durante captura; ahora el texto es legible desde el frame inicial.
- Hallazgo corregido: en 360 px se reforzo el header minimo, el ancho del hero, los CTAs y el bottom nav para eliminar cortes laterales.
- Hallazgo corregido: en tablet compacta se restauro la navegacion de header cuando hay ancho suficiente, evitando que desaparezca antes de tiempo.
- Resultado visual: landing y disenador 3D sin solapes visibles en la matriz auditada.

## V1.1.1 - Cierre visual de interfaz principal

- Header publico normalizado con altura real uniforme, baseline centrado, padding simetrico y enlaces `Colecciones`, `Maestros`, `Territorio` y `Oficio` alineados en desktop/tablet.
- Hero reorganizado por zonas reales: contenido central, CTAs y rail de metricas separados para impedir cruces entre `Pasa al taller`, copy y metricas.
- Panel privado visible para admin/artesano/domiciliario refinado con tarjetas Liquid Glass, entrada escalonada, hover con elevacion sutil, flecha animada, foco accesible y brillo por puntero.
- Fondo global de landing y apartados principales enriquecido con textura sobria CSS: ruido fino, vetas calidas/desaturadas y profundidad visual para mejorar el efecto Liquid Glass sin competir con el contenido.
- Nuevo apartado publico `Artesania 3D` en la landing: presenta la capacidad de disenar piezas con IA, preview visual y CTA directo a `/disena-tu-pieza`.
- Acceso a la creacion 3D habilitado para usuarios comunes/visitantes desde la experiencia publica, no solo desde roles internos.
- Auditoria visual guardada en `qa-screenshots/v111-polish/` para 360x780, 390x844, 430x932, 768x1024, 1024x768, 1366x768 y 1440x900.

## V1.1.2 - Optimizacion y cierre tecnico

- Carga de fuentes reducida en landing: se conservaron solo pesos necesarios de `Fraunces` y `Cormorant Garamond`; `JetBrains Mono` fue reemplazada por fallbacks locales (`SF Mono`, `Cascadia Code`, `Consolas`, `Menlo`) para evitar requests y bytes innecesarios.
- `Chart.js/ng2-charts` fue retirado del provider raiz en `frontend/src/app/app.config.ts`; si reportes o dashboards vuelven a requerir graficas, deben registrar charts dentro de su ruta lazy, no en el arranque global.
- CSS muerto de `custom-design-cta` retirado del landing tras reemplazarlo por la seccion publica `Artesania 3D`.
- Build productivo verificado con `npm run build` sin warnings de bundle ni Google Fonts.
- Bundle inicial productivo queda en `802.14 kB` raw y `191.60 kB` transfer estimado, por debajo del presupuesto de `1 MB`.
- Chunk lazy del landing bajo a `126.37 kB` raw tras la limpieza de CSS, manteniendo la estetica premium.
- Capturas post-limpieza guardadas en `qa-screenshots/v112-optimization/`:
  `landing-390x844-post-cleanup.png` y `landing-1366x768-post-cleanup.png`.

## Nota pendiente para prompt canon

Cuando se actualice `documentos/SCRIPT_MAESTRO_PROYECTO_REBECCA.md`, incorporar esta sintesis:

- Rebecca V1.1 estabiliza de raiz la responsividad del frontend con tokens globales, sistema de botones `rb-*`, header adaptativo, bottom nav con espacio reservado, hero por zonas y motion premium controlado.
- Rebecca V1.1.1 cierra la interfaz principal: header simetrico, CTAs separados de metricas, panel privado animado, fondo texturizado Liquid Glass y nuevo apartado publico `Artesania 3D`.
- Rebecca V1.1.2 cierra optimizacion inicial: build productivo sin warnings, bundle inicial `802.14 kB`, fuentes reducidas, `Chart.js` fuera del arranque global y CSS muerto eliminado.
- La creacion de artesanias 3D esta disponible desde `/disena-tu-pieza` para usuarios comunes/visitantes y tambien queda enlazada desde landing y panel interno.

## Pendiente recomendado

- Mantener la regla de que librerias pesadas de visualizacion se registran solo en rutas lazy que las usan.
- Antes de release: repetir `npm run build` y capturas clave si se toca landing, shell, botones globales o disenador 3D.
- Antes de release: repetir capturas con datos reales/autenticados en panel admin, artesano y domiciliario.
