# Script maestro del proyecto Almacen Artesanias / Rebecca

## 0. Nota canonica para IA - actualizado 2026-05-13

Este es el **PROMPT MAESTRO canonico** del programa Rebecca. Si existen otros prompts generales en la raiz, en `cliente/` o en `documentos/`, deben tratarse como material historico o auxiliar. La fuente principal para una IA futura debe ser este archivo:

`documentos/SCRIPT_MAESTRO_PROYECTO_REBECCA.md`

Este documento unifica:

- Vision completa del producto Rebecca.
- Arquitectura frontend/backend/infraestructura.
- Datos de despliegue AWS EC2 y GitHub.
- Reglas de seguridad publica/privada.
- Convenciones visuales de la identidad Rebecca.
- Reglas de roles y permisos.
- Procedimientos de build, pruebas, smoke tests y despliegue controlado.
- Bugs historicos que no deben reintroducirse.
- Estado local verificado al 2026-05-13.
- Prompts historicos: `PROMPT-MAESTRO-AWS.md`, `cliente/PROMPT-CLAUDE-DESIGN.md`, `documentos/PROMPT_CLAUDE_CODE_REBECCA.md`.
- Documentos operativos: `README.md`, `RUN-LOCAL.md`, `DEPLOY-CLIENTE.md`, `AWS-DEPLOY-GUIDE.md`, `BUILD-BACKEND-2B.md`, `BUILD-BACKEND-2C.md`, `documentos/ENDPOINTS.md`, `documentos/requisitos.md`, `SECURITY-ROUTES.md`, `RELEASE-CHECKLIST.md`, `cliente/INTEGRACION-ANGULAR.md`, `Almacen Artesanias Design System/*`.

Postura obligatoria de cualquier IA que trabaje sobre este proyecto:

- Actuar como Ingeniero Senior Full Stack y DevOps.
- Leer el codigo y los documentos antes de cambiar comportamiento.
- No desplegar sin autorizacion explicita del dueno.
- No rotar secretos ni editar `.env` de produccion sin instruccion explicita.
- No exponer datos privados en endpoints publicos.
- No inventar estado de produccion: verificar o declarar que se esta infiriendo.
- Mantener cambios pequenos, reversibles y probados.
- Respetar Angular 21, Spring WebFlux, R2DBC, Docker Compose, nginx y la identidad visual Rebecca.
- Proteger siempre la frontera publica/privada del catalogo.

Estado importante al 2026-05-13:

- La app esta desplegada publicamente, pero los cambios locales recientes aun no deben asumirse desplegados.
- Se mejoro la separacion entre datos publicos y datos internos.
- Productos y artesanos publicos deben usar DTOs reducidos.
- Rutas administrativas de catalogo viven bajo `/api/products/admin/**` y `/api/artesanos/admin/**`.
- Las rutas privadas del gateway deben pasar por `JwtAuth`.
- Permisos denegados deben responder `401` o `403`, no listas vacias silenciosas.
- Hay pruebas nuevas de contrato de rutas, DTOs publicos y guardas por rol.
- Existe `SECURITY-ROUTES.md` como matriz de rutas publicas/privadas.
- Existe `RELEASE-CHECKLIST.md` como checklist antes de desplegar.
- No desplegar nada hasta organizar, probar y autorizar un release controlado.
- El flujo IA de producto personalizado ya no es solo conceptual: existe agente, solicitudes, revision de taller, detalle individual, conversion a producto, notificaciones internas y persistencia de boceto visual.
- El lenguaje visual Liquid Glass premium fue promovido a capa global transversal del frontend.
- Existe panel admin `/admin/system-health` para revisar servicios, version, healthchecks, OpenAI, Stripe y checklist interno de release antes de desplegar.

Verificacion local conocida al 2026-05-13:

```bash
mvn -q -pl catalog-service,inventory-service test
mvn -q -pl ai-service test
mvn -q test
cd frontend && npm test -- --watch=false
cd frontend && npm run build
docker compose config --quiet
```

Notas:

- Maven puede mostrar warnings de Mockito dynamic agent; no son bloqueo actual.
- npm puede advertir sobre `--watch`; no fue bloqueo actual.
- Estas verificaciones no equivalen a despliegue.

## 1. Identidad del proyecto

Almacen Artesanias es una aplicacion academica de gestion, venta y exhibicion de artesanias colombianas. La interfaz administrativa y comercial se conoce visualmente como Rebecca. El sistema combina una tienda publica para clientes con un backoffice por roles para administradores, artesanos y domiciliarios.

La vision principal es conectar a clientes con artesanos locales, permitir la administracion de catalogo e inventario, procesar pedidos y preparar una experiencia mas cercana a una tienda artesanal premium: fotografias territoriales, tarjetas con Liquid Glass / glassmorphism, narrativa ligera por scroll, carrito, checkout, seguimiento de pedidos, comunidad artesana y paneles internos funcionales.

Repositorio:

- GitHub: `Jsua3/project_artesanias`
- Rama principal: `master`
- Carpeta local actual: `D:\Sua_Files\IdeaProjects\almacen-arle`
- Carpeta esperada en servidor: `/home/ubuntu/project_artesanias`
- Ultimos commits desplegados documentados historicamente: `a978557` y luego `0916add`. Antes de desplegar o hacer rollback, verificar el commit real en EC2 con `git rev-parse --short HEAD`.
- URL publica recomendada: `http://56.126.102.113.nip.io`
- URL por IP directa: `http://56.126.102.113`
- Nota Google OAuth: el origen autorizado documentado es `http://56.126.102.113.nip.io`; entrar por IP directa puede romper el boton de Google.

Importante: este documento no contiene secretos reales. Los valores sensibles viven en `.env` del servidor o en variables de entorno, y no deben copiarse en chats, commits ni documentacion publica.

## 2. Arquitectura general

El sistema esta dividido en frontend Angular, gateway, microservicios Spring Boot, PostgreSQL y Kafka.

Flujo de peticion:

```text
Navegador
  -> http://56.126.102.113:80
  -> nginx dentro del contenedor frontend
     -> sirve Angular estatico para rutas web
     -> proxy /api/ hacia api-gateway:8080/api/
  -> api-gateway
     -> auth-service
     -> catalog-service
     -> inventory-service
     -> report-service
     -> ai-service
  -> PostgreSQL y Kafka segun el caso
```

Contenedores principales:

- `frontend`: nginx que sirve Angular precompilado.
- `api-gateway`: Spring Cloud Gateway, entrada unica para `/api/**`.
- `discovery-server`: Eureka, servicio de descubrimiento.
- `auth-service`: autenticacion, usuarios, roles, perfiles, aprobaciones y Google OAuth.
- `catalog-service`: categorias, productos, artesanos, comunidad y eventos.
- `inventory-service`: stock, entradas, salidas, clientes, ventas, pedidos, tracking y Stripe.
- `report-service`: reportes y alertas alimentadas por eventos.
- `ai-service`: agente OpenAI/fallback local para disenar piezas artesanales personalizadas, devolver parametros 3D, calcular precio variable y guardar solicitudes de producto personalizado.
- `postgres-db`: PostgreSQL con cinco bases de datos: `auth_db`, `catalog_db`, `inventory_db`, `report_db`, `ai_db`.
- `kafka-broker`: broker para eventos de inventario.

## 3. Tecnologias

Frontend:

- Angular 21.
- Standalone components.
- Signals de Angular.
- Angular Router.
- Angular Material.
- SCSS.
- Chart.js y ng2-charts.
- RxJS.
- TypeScript 5.9.
- Google Identity Services SDK (cargado dinamicamente en login).
- Build productivo con Angular CLI.

Backend:

- Java 21.
- Spring Boot 3.4.5.
- Spring WebFlux.
- Spring Cloud Gateway.
- Spring Cloud Netflix Eureka.
- Spring Security.
- JWT con JJWT.
- R2DBC PostgreSQL.
- Apache Kafka.
- Maven multi-modulo.

Datos e infraestructura:

- PostgreSQL 17 alpine.
- Apache Kafka 3.7.0.
- Docker y Docker Compose.
- nginx para frontend y reverse proxy.
- AWS EC2 Ubuntu 22.04.
- Instancia actual: `t3.small` con 2 GB RAM.
- Swap configurado: 4 GB.
- Region AWS: Sao Paulo, `sa-east-1`.

## 4. Infraestructura actual

Servidor:

- Proveedor: AWS.
- Servicio: EC2.
- Nombre conocido: `almacen-artesanias`.
- Instance ID documentado: `i-0d81d8a1ac3abee87`.
- Region / zona: Sao Paulo, `sa-east-1a`.
- VPC documentada: `vpc-03ea3d7e6ae58db59`.
- Subnet documentada: `subnet-099765d702df51e46`.
- IP privada documentada: `172.31.6.33`.
- IP elastica publica: `56.126.102.113`.
- Dominio nip.io: `56.126.102.113.nip.io`.
- Usuario SSH: `ubuntu`.
- Ruta del proyecto en servidor: `/home/ubuntu/project_artesanias`.
- Ruta corta equivalente: `~/project_artesanias`.
- Ruta local esperada de llave SSH: `~/Downloads/almacen-key.pem`.
- Orquestacion: `docker compose`.
- Tipo de instancia: este script historico indica `t3.small` con 2 GB RAM; un prompt AWS anterior indicaba `t3.micro`. Antes de una operacion de capacidad, verificar en consola AWS o con metadata de EC2. En cualquier caso, tratarla como instancia de memoria limitada.
- Comando SSH:

```bash
ssh -i ~/Downloads/almacen-key.pem ubuntu@56.126.102.113
```

Comando base al entrar:

```bash
cd /home/ubuntu/project_artesanias
git status
git rev-parse --short HEAD
```

Reglas de GitHub/despliegue:

- Owner/repo: `Jsua3/project_artesanias`.
- Rama principal historica: `master`.
- En servidor usar `git pull --ff-only origin master` para evitar merges accidentales.
- Hacer cambios localmente, probar, commitear y pushear antes de actualizar servidor.
- No desplegar cambios sueltos sin commit claro.
- No reescribir historial de produccion salvo emergencia documentada y autorizada.
- Si hay divergencia por historial reescrito y el dueno lo autoriza: respaldar `.env` antes de resetear.

Estado validado tras ultimo despliegue:

- `frontend`: arriba (bundle `main-MWJNWTOV.js`).
- `api-gateway`: healthy.
- `auth-service`: healthy.
- `catalog-service`: healthy.
- `inventory-service`: healthy.
- `report-service`: healthy.
- `discovery-server`: healthy.
- `postgres-db`: healthy.
- `kafka-broker`: healthy.

Pruebas de humo validadas:

- `http://56.126.102.113/` responde `200`.
- `/api/products` responde `200`.
- `/api/auth/config` responde `200` con `{"googleClientId":"762114194584-..."}`.
- `/api/auth/login` con credenciales falsas responde `401`, correcto.
- `/api/auth/google` sin credential responde `401`, correcto.

## 5. Restricciones de memoria y despliegue

La instancia actual es `t3.small`. Funciona, pero esta ajustada porque se ejecutan varios procesos Java, Kafka, Postgres y nginx en una sola maquina. Durante validacion se observo uso aproximado de:

- Memoria total Linux: ~1.9 GiB.
- Memoria usada: ~1.4 GiB.
- Disponible: ~80-284 MiB.
- Swap usado: ~1.3 GiB de 4 GiB.

Reglas importantes:

- No compilar Angular dentro del contenedor en EC2.
- El frontend debe compilarse localmente y subir `frontend/dist/frontend/browser/`.
- El frontend SIEMPRE necesita `docker compose build frontend` antes de `up --force-recreate`. No basta con force-recreate si la imagen no se reconstruyo.
- No levantar o reconstruir todos los servicios Java al mismo tiempo si no es necesario.
- Para frontend, usar despliegue aislado.
- Para backend, reconstruir servicios por etapas.
- No borrar ni sobrescribir `.env`.
- No exponer valores reales de `JWT_SECRET`, `INTERNAL_TOKEN`, `DB_PASSWORD`, `STRIPE_SECRET_KEY`, `GOOGLE_CLIENT_ID` (solo el Client ID es semi-publico, el Client Secret nunca).

## 6. Comandos clave de despliegue

Build frontend local:

```bash
cd frontend
npm install
node node_modules/@angular/cli/bin/ng.js build --configuration production
```

Build backend local:

```bash
mvn -pl api-gateway,auth-service,catalog-service,inventory-service,report-service -am -DskipTests compile
```

Actualizar solo frontend en servidor (IMPORTANTE: siempre build antes de recreate):

```bash
cd ~/project_artesanias
git pull --ff-only origin master
docker compose build frontend
docker compose up -d --no-deps --force-recreate frontend
curl -s http://localhost/ | grep -o 'main-[A-Z0-9]*.js'  # verificar bundle nuevo
```

Despliegue cuidadoso de backend:

```bash
cd ~/project_artesanias
git pull --ff-only origin master
docker compose build auth-service
docker compose up -d --no-deps auth-service
sleep 20
docker compose build inventory-service
docker compose up -d --no-deps inventory-service
sleep 20
docker compose build api-gateway
docker compose up -d --no-deps api-gateway
sleep 20
docker compose build ai-service
docker compose up -d --no-deps ai-service
sleep 20
docker compose ps
free -h
```

Arranque escalonado desde cero:

```bash
docker compose up -d postgres
sleep 30
docker compose up -d discovery-server
sleep 30
docker compose up -d api-gateway auth-service
sleep 30
docker compose up -d catalog-service inventory-service report-service ai-service
sleep 30
docker compose up -d frontend
```

Diagnostico:

```bash
docker compose ps
free -h
docker stats
curl http://localhost/
curl http://localhost/api/products
curl http://localhost/api/auth/config
curl http://localhost:8080/actuator/health
docker compose logs --tail=120 api-gateway
docker compose logs --tail=120 auth-service
docker compose logs --tail=120 catalog-service
docker compose logs --tail=120 inventory-service
docker compose logs --tail=120 report-service
docker compose logs --tail=120 ai-service
```

## 7. Frontend: constitucion general

Ruta principal:

- `frontend/src/app`

Estructura por capas:

- `core/models`: interfaces y tipos de dominio.
- `core/services`: servicios HTTP y estado cliente.
- `core/guards`: proteccion de rutas por autenticacion y rol.
- `core/directives`: utilidades visuales como `LiquidPointerDirective`.
- `shared/layout`: layout del backoffice.
- `shared/components`: componentes reutilizables.
- `features`: modulos funcionales.

Features existentes:

- `auth`: login (con Google), registro, registro cliente, aprobaciones.
- `public`: landing, carrito, checkout, mis pedidos.
- `dashboard`: panel general por rol.
- `products`: administracion de productos/artesanias.
- `categories`: categorias.
- `artesanos`: administracion de artesanos.
- `clientes`: clientes internos.
- `ventas`: ventas y formulario de venta con glass cards.
- `pedidos`: listado de pedidos.
- `stock`: existencias.
- `inventory`: entradas y salidas.
- `entregas`: entregas.
- `domiciliario`: panel del domiciliario.
- `reports`: reportes.
- `comunidad`: feed artesano, eventos y moderacion.

Servicios frontend principales:

- `auth.service.ts`: login, registro, Google OAuth, sesion, perfil, roles, config publica.
- `cart.service.ts`: carrito local del cliente.
- `catalog.service.ts`: lectura de catalogo publico.
- `product.service.ts`: CRUD y estado activo/inactivo de productos.
- `category.service.ts`: categorias.
- `artesano.service.ts`: artesanos.
- `cliente.service.ts`: clientes.
- `cliente-venta.service.ts`: ventas del cliente y checkout Stripe.
- `venta.service.ts`: ventas, pedidos y seguimiento.
- `stock.service.ts`: stock, entradas y salidas.
- `report.service.ts`: reportes.
- `system-health.service.ts`: panel admin de salud del sistema y checklist interno de release.
- `comunidad.service.ts`: posts, likes, eventos y moderacion.
- `censorship.service.ts`: censura basica del frontend para publicaciones.

## 8. Rutas frontend

Rutas publicas:

- `/`: landing publica del cliente.
- `/carrito`: carrito.
- `/checkout`: checkout, requiere login.
- `/mis-pedidos`: pedidos del cliente, requiere login.
- `/mis-pedidos/:id`: detalle de pedido del cliente.

Autenticacion:

- `/login` (incluye boton de Google Sign-In)
- `/register`
- `/registro-cliente`

Backoffice con Shell:

- `/dashboard`
- `/products`
- `/categories`
- `/artesanos`
- `/clientes`
- `/ventas`
- `/pedidos`
- `/stock`
- `/inventory/entries`
- `/inventory/exits`
- `/entregas`
- `/reports`
- `/artesano/comunidad`
- `/artesano/eventos`
- `/domiciliario/panel`
- `/admin/artisan-requests`
- `/admin/aprobaciones`
- `/admin/moderacion`

Guardias:

- `authGuard`: exige sesion.
- `notClienteGuard`: impide que CLIENTE entre al backoffice.
- `adminGuard`: restringe a ADMIN.
- `roleGuard`: restringe por lista de roles.

Roles del sistema:

- `ADMIN`: acceso total.
- `ARTESANO`: rol canonico del artesano. OPERATOR y MAESTRO se normalizan a ARTESANO en toda la cadena.
- `DOMICILIARIO`: solo panel de entregas y pedidos.
- `CLIENTE`: solo tienda publica. Bloqueado del backoffice.

Normalizacion de roles (critico):

- El enum backend `UserRole` tiene: `ADMIN, OPERATOR, CLIENTE, MAESTRO, ARTESANO, DOMICILIARIO`.
- `normalizeRole` en backend convierte `OPERATOR` y `MAESTRO` → `ARTESANO`.
- El JWT siempre lleva el rol normalizado (`ARTESANO`), nunca `MAESTRO` ni `OPERATOR`.
- Frontend `normalizeRole` convierte `OPERATOR` y `MAESTRO` → `ARTESANO` como salvaguarda para datos antiguos en BD.
- Todos los checks de rol en inventory-service usan `"ARTESANO"`, no `"MAESTRO"`.

Redireccion post-login por rol:

- `ADMIN` → `/dashboard`
- `ARTESANO` → `/dashboard`
- `DOMICILIARIO` → `/domiciliario/panel` (directo, sin pasar por dashboard)
- `CLIENTE` → `/` (landing publica)

## 9. Experiencia cliente

El cliente o visitante entra por la landing publica. La experiencia actual incluye:

- Header tipo Liquid Glass.
- Carrusel territorial con fotos en `frontend/public/assets/territorio`.
- Se removio del carrusel publico `filandia1.jpg`; se usan `filandia3.jpg`, `filandia4.jpg`, `filandia5.jpeg`, `photo2jpg.jpg`, `salento1.jpg`, `salento2.jpg`.
- Scrollytelling ligero con narrativa: territorio, maestros, artesanias, oficio y compra.
- IntersectionObserver para revelar secciones al hacer scroll.
- Tarjetas de artesanias con glassmorphism premium.
- `LiquidPointerDirective` para brillo radial y tilt segun cursor en desktop.
- Reduccion de animaciones cuando aplica `prefers-reduced-motion` o dispositivos tactiles.
- Artesanos destacados usando campos reales del backend: `nombre`, `especialidad`, `ubicacion`, `imageUrl`.
- Productos reales desde backend y fallback mock si no hay datos.
- Botones para agregar al carrito sin login.
- Login obligatorio al confirmar checkout.
- Mis pedidos con estados y progreso.
- `/disena-tu-pieza`: agente de diseno 3D para CLIENTE/ADMIN. El cliente conversa, configura materiales, medidas, patron, acabado y complejidad. La app muestra preview parametrico, puede pedir boceto visual con OpenAI y permite crear una solicitud de producto personalizado.

### Agente de diseno 3D y productos personalizados

El agente vive en `ai-service` y entra por el gateway en `/api/ai/**`. No se llama OpenAI desde Angular. La API key debe estar solo en `.env`/variables del servidor como `OPENAI_API_KEY`; si esta vacia, el servicio usa fallback local para que la app siga funcionando.

Endpoints actuales:

- `POST /api/ai/design/message`: recibe mensaje del cliente y `currentSpec`; devuelve `DesignTurnResponse`.
- `POST /api/ai/design/preview`: genera prompt/imagen para boceto visual. Si OpenAI falla, conserva el preview 3D local.
- `POST /api/ai/design/confirm`: convierte la configuracion actual en solicitud privada de producto personalizado.
- `GET /api/ai/design/mine`: lista solicitudes del cliente autenticado.
- `GET /api/ai/design/review`: lista solicitudes para ADMIN/ARTESANO.
- `PATCH /api/ai/design/{id}/status`: permite a ADMIN/ARTESANO actualizar estado y notas de revision.

Mecanica de producto:

- El diseno NO entra automaticamente al catalogo publico.
- Al confirmar, se guarda en `ai_db.custom_design_requests` con estado `PENDING_QUOTE`.
- La solicitud contiene `spec_json`, `price_breakdown_json`, precio estimado, dias estimados y notas del cliente.
- El precio lo calcula el backend con `PricingService`; OpenAI puede sugerir, pero no decide el precio final.
- El desglose considera tipo de pieza, material principal, materiales secundarios, complejidad, tamano y acabado.
- El cliente consulta sus encargos en `/mis-disenos`.
- ADMIN/ARTESANO revisa encargos en `/disenos-personalizados`, deja respuesta del taller, cambia estado y, si el diseno queda aprobado, puede abrir el formulario real de producto ya prellenado desde la solicitud.
- La conversion definitiva a producto del catalogo sigue siendo una accion humana desde el flujo de catalogo; no se publica automaticamente.

La estetica Rebecca usa:

- Terracota.
- Crema.
- Sage.
- Mauve.
- Dorado suave.
- Tipografia Cormorant Garamond para titulos.
- Tipografia Outfit para texto.
- Glassmorphism / Liquid Glass en superficies premium.
- Formas suaves, bordes luminosos y profundidad visual.

## 9B. Identidad visual y direccion de marca consolidada

Esta seccion consolida el prompt historico de diseno para que una IA no tenga que buscarlo aparte.

### Empresa y propuesta

Nombre publico: Almacen Artesanias. Nombre visual/interfaz: Rebecca. Nombre interno del repo local: `almacen-arle`.

Rebecca no debe sentirse como un e-commerce generico. Debe sentirse como una tienda/museo vivo de oficios del Eje Cafetero, donde cada pieza tiene artesano, territorio, oficio y una razon de existir.

Mision narrativa:

- Dignificar el trabajo artesanal cafetero.
- Visibilizar quien hizo cada pieza.
- Conectar compradores con maestros locales.
- Preferir catalogo curado sobre catalogo infinito.
- Hablar de maestros, oficio, taller, territorio, vereda, pieza; no de proveedores frios.

Audiencia:

- Principal: colombianos urbanos de 28 a 55 anos, profesionales, ingresos medios-altos, interesados en piezas con historia.
- Secundaria: turistas que visitaron Quindio y quieren seguir comprando despues.
- Terciaria: interioristas, hoteles boutique y compradores que buscan piezas unicas.

Tono:

- Calido, reverente, sobrio.
- Espanol colombiano neutro con sabor regional ocasional.
- Sin paternalismo hacia artesanos.
- Sin emojis en UI institucional.
- Frases cortas, concretas y con textura.

### Territorio visual

Municipios pilar:

- Filandia: 1878, 1.923 msnm, mirador Colina Iluminada, cesteria en bejuco, cafe especial.
- Salento: 1842, 1.895 msnm, Valle del Cocora, guadua, alpargateria, cafe de finca.

Materiales y referencias:

- Bahareque cafetero.
- Guadua.
- Palma de cera.
- Niebla de montana.
- Cafe.
- Barro negro tipo La Chamba como inspiracion material.
- Cesteria de iraca.
- Madera humeda, humo de lena, amanecer en cafetales.

Evitar:

- Tech startup.
- Gradientes morados genericos.
- Airbnb/Etsy lookalike.
- Sombreros vueltiaos, playas, palmas tropicales o Macondo generico.
- Fotos stock anonimas sin territorio.

### Paleta exacta

| Rol | Nombre | Hex |
| --- | --- | --- |
| Primario tierra | Clay | `#A67C52` |
| Tierra profunda | Clay deep | `#704A2E` |
| Fondo crema | Cream | `#F5F0E8` |
| Fondo hueso | Bone | `#EDE4D3` |
| Vegetacion fresca | Sage | `#8A9A7B` |
| Vegetacion profunda | Moss | `#5A6B4A` |
| Texto y oscuros | Coffee | `#3E2723` |
| Acento filamento | Gold | `#C9A253` |
| Violeta cordillera | Mauve | `#A88696` |
| Naranja brasa | Ember | `#C86A3A` |

Reglas:

- Dominante: Cream/Bone.
- Texto principal: Coffee sobre Cream.
- Gold solo como acento: bordes finos, filamentos, iconos pequenos, subrayados.
- No usar Gold como bloque grande.
- No combinar Gold y Ember en bloques dominantes.

### Tipografia

- Display/titulos: Cormorant Garamond.
- Poster/numeros/slogans: Fraunces si esta disponible.
- UI/body: Outfit.
- Mono opcional para codigos/pedidos: JetBrains Mono.

Jerarquia historica de referencia:

- H1 hero: Fraunces 96-128px en desktop si aplica.
- H2 seccion: Cormorant Garamond 56px.
- H3 tarjeta: Fraunces 28px o equivalente visual.
- Body: Outfit 16-18px, line-height generoso.
- Labels: Outfit 12px, uppercase, tracking moderado.

### Glassmorphism / Liquid Glass

Estado canonico al 2026-05-13: Liquid Glass ya no es un adorno puntual. Es el lenguaje visual transversal de Rebecca, aplicado a cliente y backoffice con distinta intensidad. Debe sentirse premium, fluido y artesanal, como vidrio liquido sobre una base territorial, sin perder legibilidad ni velocidad operativa.

Uso correcto y obligatorio:

- Header publico.
- Hero/landing.
- Tarjetas de productos destacadas.
- Carrito, checkout, mis pedidos.
- Dialogos premium.
- Formulario de ventas donde ya exista el lenguaje.
- Disenador IA de piezas.
- Mis disenos y detalle de diseno.
- Revision admin/artesano de disenos personalizados.
- Shell, sidebar, dashboards, tarjetas, tablas, filtros, paneles, notificaciones y formularios del backoffice.

Uso por intensidad:

- Cliente: mas editorial, narrativo, atmosferico y animado.
- AI Studio / disenos personalizados: muy premium, con preview, paneles translucidos y microinteracciones claras.
- Backoffice: vidrio mas sobrio, alta lectura, densidad operativa, tablas legibles y animaciones suaves.
- Domiciliario: vidrio minimo, prioridad a rapidez, contraste y accion.

Formula visual de referencia:

```css
background: rgba(245, 240, 232, 0.55);
backdrop-filter: blur(18px) saturate(140%);
border: 1px solid rgba(201, 162, 83, 0.35);
box-shadow:
  inset 0 1px 0 rgba(255,255,255,.6),
  0 20px 40px -18px rgba(62,39,35,.35);
```

Implementacion vigente:

- Capa global en `frontend/src/styles.scss` bajo el bloque `LIQUID GLASS PERMEATION LAYER`.
- Tokens: `--glass-refraction`, `--glass-highlight`, `--glass-inner-shadow`, `--rb-liquid-surface`, `--rb-liquid-border`, `--rb-liquid-shadow`.
- Animaciones: `rb-page-rise`, `rb-card-rise`, `rb-liquid-sheen`, `rb-shimmer`, `rb-glass-in`, `rb-pulse-oro`.
- Selectores globales cubren cards, filtros, KPIs, tablas Material, paginadores, menus, selects, pedidos, productos, perfiles, paneles, notificaciones y superficies de detalle.
- `frontend/src/app/shared/layout/shell.component.scss` adapta sidebar, topbar y toolbar mobile al vidrio oscuro premium.
- `ai-designer`, `my-designs`, `custom-design-review` y `custom-design-detail` tienen refuerzo local para que el flujo IA sea una experiencia premium completa.
- Siempre respetar `prefers-reduced-motion`; en mobile reducir blur, movimiento y sombras pesadas.

### Composicion

- Grid base: 12 columnas desktop, 6 tablet, 4 mobile.
- Secciones con respiracion generosa.
- Asimetria editorial en landing.
- Bordes de 4-8px en tarjetas premium.
- Evitar cards redondas de 24px salvo que el sistema ya lo exija.
- Sombras calidas, no grises frias.
- Hit target minimo en mobile: 44x44px.
- Respetar `prefers-reduced-motion`.

### Ideas de experiencia inmersiva

El prompt historico de diseno proponia un hero 3D con vasijas, guaduas, palma de cera, particulas doradas y niebla. No es obligatorio en la app actual, pero si se retoma:

- Usar Three.js.
- Movimiento lento e hipnotico.
- Parallax maximo sutil.
- Fallback estatico si `prefers-reduced-motion`.
- No meter camara libre ni controles visibles.
- Verificar rendimiento porque la infraestructura y el bundle deben seguir siendo livianos.

## 10. Carrito, checkout y pedidos

El carrito vive en frontend mediante `CartService`.

Flujo:

1. Cliente agrega productos desde landing.
2. Va a `/carrito`.
3. Pasa a `/checkout`.
4. Si no esta logueado, va a login o registro.
5. Se crea una venta en `inventory-service` via `/api/cliente-ventas`.
6. Se intenta crear sesion Stripe con `/api/cliente-ventas/{id}/checkout-session`.
7. Si Stripe esta configurado, redirige a Checkout.
8. Si Stripe no esta configurado, el sistema puede dejar la venta pendiente y llevar a detalle de pedido.
9. El cliente revisa `/mis-pedidos` y `/mis-pedidos/:id`.

Estados soportados en ventas:

- `PENDIENTE`
- `PAGADA`
- `COMPLETADA`
- `ANULADA`

Seguimiento visual:

- Pedido confirmado.
- En preparacion.
- Listo para recoger.
- En camino.
- Entregado.

Datos de seguimiento backend:

- `packed`
- `picked_up`
- `on_the_way`
- `delivered`
- timestamps por paso.
- usuario que actualiza.
- latitud y longitud opcionales.
- evidencia URL.
- notas de entrega.

Nota importante sobre `markAsPaid`: cuando Stripe confirma el pago via webhook, el backend muta la entidad Venta existente (`venta.setEstado("PAGADA")`) en lugar de crear una instancia nueva. Esto preserva todos los campos de delivery tracking.

## 11. Experiencia artesano

El rol ARTESANO tiene una interfaz mas sobria que la del cliente, con menos animacion y mas enfoque operativo.

Funcionalidades:

- Acceso a dashboard.
- Gestion de productos propios o catalogo permitido.
- Crear, editar y eliminar productos.
- Activar/desactivar publicacion con endpoint `PATCH /api/products/{id}/active`.
- Revisar pedidos relacionados mediante ventas de maestro.
- Ver stock y alertas de bajo stock.
- Entradas y salidas de inventario.
- Reportes.
- Comunidad artesana.
- Propuesta de eventos y ferias.
- Perfil con display name, avatar, nombres, telefono, bio, localidad, tipo de artesania y completitud.

Perfil artesano:

- `firstName`
- `lastName`
- `displayName`
- `avatarUrl`
- `phone`
- `bio`
- `locality`
- `craftType`
- `address`
- `profileCompletion`
- `profileComplete`

## 12. Experiencia domiciliario

El rol DOMICILIARIO tiene una interfaz rapida y funcional. Post-login va directo a `/domiciliario/panel`.

Funcionalidades actuales:

- Acceso al panel de entregas.
- Visualizacion de pedidos disponibles/asignados.
- Detalle de pedido.
- Checklist visual de proceso.
- Barra de progreso conectada a flags backend.
- Placeholder visual para mapa/ruta.
- Preparacion para direccion origen/destino.

Fases logisticas representadas:

- Confirmacion.
- Preparacion.
- Entrega al domiciliario.
- Transporte.
- Entrega final.

Limitacion actual:

- No hay API real de mapas integrada.
- No hay tracking en vivo obligatorio.
- La evidencia existe como campo, pero falta experiencia completa de subida/firma/foto validada.

## 13. Experiencia administrador

El ADMIN puede:

- Entrar al dashboard.
- Administrar productos.
- Administrar categorias.
- Administrar artesanos.
- Administrar clientes.
- Ver ventas.
- Ver pedidos.
- Gestionar stock.
- Ver reportes.
- Aprobar solicitudes de artesanos y domiciliarios.
- Moderar comunidad.
- Revisar eventos propuestos.

El registro publico no permite crear ADMIN directamente. El flujo seguro recomendado para crear ADMIN es:

1. Crear usuario normal con registro.
2. Escalar manualmente en base de datos:

```sql
UPDATE user_accounts SET role = 'ADMIN' WHERE username = 'nombre_usuario';
```

Las contrasenas siempre deben guardarse como BCrypt. Nunca insertar contrasenas planas.

## 14. Comunidad artesana

Modulo `comunidad`:

- Feed de publicaciones tipo red profesional.
- Compositor de publicaciones.
- Likes.
- Eliminacion/reportes.
- Moderacion por ADMIN.
- Eventos y ferias.
- Revision de eventos por ADMIN.
- Censura basica en frontend con `CensorshipService`.
- Censura/moderacion de texto en backend con servicio de moderacion.

Endpoints:

- `GET /api/comunidad/posts`
- `GET /api/comunidad/posts/moderacion`
- `POST /api/comunidad/posts`
- `POST /api/comunidad/posts/{id}/report`
- `POST /api/comunidad/posts/{id}/like`
- `PATCH /api/comunidad/posts/{id}/estado`
- `DELETE /api/comunidad/posts/{id}`
- `GET /api/comunidad/eventos`
- `GET /api/comunidad/eventos/mis`
- `GET /api/comunidad/eventos/pending`
- `POST /api/comunidad/eventos`
- `PATCH /api/comunidad/eventos/{id}/review`

Limitacion importante:

- No se debe afirmar que hay moderacion real de imagenes con IA. La UI puede prepararlo, pero actualmente la moderacion fuerte es de texto/estado, no analisis visual inteligente.

## 15. Backend: modulos y responsabilidades

### api-gateway

Responsabilidades:

- Entrada unica para `/api/**`.
- Ruteo hacia microservicios.
- CORS.
- JWT filter.
- Inserta headers internos.
- Expone `/actuator/health`.

Rutas publicas:

- `/api/auth/login`
- `/api/auth/register`
- `/api/auth/register-cliente`
- `/api/auth/refresh`
- `/api/auth/google` (Google OAuth)
- `/api/auth/config` (Client ID publico para frontend)
- GET de catalogo publico.
- Stripe webhook.

Rutas protegidas:

- Perfil y usuarios.
- Productos admin.
- Comunidad.
- Inventory.
- Reports.
- System health admin: `/api/admin/system-health`, atendido por `api-gateway`, exige JWT ADMIN y no expone secretos.

### auth-service

Responsabilidades:

- Registro (usuario/contrasena y Google OAuth).
- Login (usuario/contrasena y Google OAuth).
- Refresh token.
- Perfil.
- Roles.
- Aprobaciones de artesano/domiciliario.
- Hash BCrypt.
- JWT.
- Configuracion publica del sistema.

Endpoints:

- `POST /api/auth/register`
- `POST /api/auth/register-cliente`
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `POST /api/auth/google` — valida ID token de Google, crea/encuentra usuario CLIENTE, emite JWT
- `GET /api/auth/config` — retorna `{ googleClientId }` sin autenticacion
- `GET /api/auth/me`
- `PUT /api/auth/profile`
- `GET /api/auth/users`
- `GET /api/auth/approval-requests`
- `GET /api/auth/artisan-requests`
- `PATCH /api/auth/approval-requests/{userId}`
- `PATCH /api/auth/artisan-requests/{userId}`

Clases nuevas para Google OAuth:

- `GoogleAuthService`: valida ID token via `https://oauth2.googleapis.com/tokeninfo`, crea usuario si no existe.
- `GoogleTokenRequest`: DTO `{ credential }`.
- `GoogleUserInfo`: DTO del tokeninfo de Google `{ sub, email, name, picture, aud, emailVerified }`.
- `PublicConfigResponse`: DTO `{ googleClientId }`.
- `GoogleWebClientConfig`: bean WebClient apuntando a `https://oauth2.googleapis.com`.

Tablas:

- `user_accounts`
- `refresh_tokens`

Variable de entorno requerida para Google OAuth:

- `GOOGLE_CLIENT_ID`: ID de cliente OAuth de Google Cloud Console. Dejar vacio desactiva el boton (muestra "Google proximamente").

AuthResponse incluye:

- `accessToken`, `refreshToken`, `username`, `role`, `id` (UUID del usuario).

### catalog-service

Responsabilidades:

- Categorias.
- Artesanos.
- Productos.
- Vinculo artesano con usuario.
- Comunidad.
- Eventos.
- Filtro interno por `X-Internal-Token`.

Endpoints principales:

- `GET /api/categories`
- `POST /api/categories`
- `PUT /api/categories/{id}`
- `DELETE /api/categories/{id}`
- `GET /api/artesanos` - publico, responde DTO reducido sin telefono/email/userAccountId/active/createdAt
- `GET /api/artesanos/admin/all` - privado, ADMIN, responde datos completos para gestion
- `GET /api/artesanos/admin/{id}` - privado, ADMIN, responde datos completos
- `POST /api/artesanos`
- `PUT /api/artesanos/{id}`
- `DELETE /api/artesanos/{id}`
- `PUT /api/artesanos/{id}/user-link`
- `GET /internal/artesanos/by-user/{userAccountId}`
- `GET /api/products` - publico, responde DTO reducido sin sku/stockMinimo/active/createdAt/updatedAt
- `GET /api/products/{id}` - publico, responde DTO reducido
- `GET /api/products/category/{categoryId}` - publico, responde DTO reducido
- `GET /api/products/artesano/{artesanoId}` - publico, responde DTO reducido
- `GET /api/products/admin/all` - privado, ADMIN o ARTESANO; ADMIN ve todos, ARTESANO solo los suyos
- `GET /api/products/admin/artesano/{artesanoId}` - privado para gestion
- `POST /api/products`
- `PUT /api/products/{id}`
- `DELETE /api/products/{id}`
- `PATCH /api/products/{id}/active`

Campos del modelo Artesano (backend y frontend deben coincidir):

- `id`, `nombre`, `telefono`, `email`, `especialidad`, `ubicacion`, `imageUrl`, `active`, `userAccountId`, `createdAt`
- En el frontend (`catalog.model.ts`), los campos publicos son: `id`, `nombre`, `especialidad`, `ubicacion`, `imageUrl`.
- DTO publico de artesano: `PublicArtesanoResponse` solo puede exponer `id`, `nombre`, `especialidad`, `ubicacion`, `imageUrl`.
- DTO publico de producto: `PublicProductResponse` solo puede exponer `id`, `name`, `description`, `price`, `imageUrl`, `categoryId`, `categoryIds`, `artesanoId`.
- No reintroducir entidades completas ni `ProductResponse` completo en rutas publicas.
- NO usar `oficio`, `municipio`, `vereda`, `fotoUrl`, `anosExperiencia`, `bio` — esos campos no existen en el backend.

Tablas:

- `categories`
- `artesanos`
- `products`
- `community_posts`
- `community_post_likes`
- `community_events`

### inventory-service

Responsabilidades:

- Stock.
- Entradas y salidas.
- Clientes.
- Ventas.
- Pedidos del cliente.
- Pedidos del maestro (ARTESANO).
- Panel de entregas.
- Tracking.
- Stripe Checkout.
- Stripe webhook.
- Eventos Kafka hacia report-service.

Endpoints:

- `GET /api/stock`
- `GET /api/stock/{productId}`
- `POST /api/entries`
- `POST /api/exits`
- `GET /api/clientes`
- `GET /api/clientes/{id}`
- `POST /api/clientes`
- `PUT /api/clientes/{id}`
- `POST /api/cliente-ventas`
- `GET /api/cliente-ventas/mias`
- `GET /api/cliente-ventas/{id}`
- `POST /api/cliente-ventas/{id}/checkout-session`
- `GET /api/maestro-ventas/mias` (requiere rol ARTESANO o ADMIN)
- `GET /api/ventas`
- `GET /api/ventas/entregas`
- `GET /api/ventas/{id}`
- `GET /api/ventas/cliente/{clienteId}`
- `GET /api/ventas/admin/payment-status` (requiere ADMIN, estado de Stripe sin exponer llaves)
- `POST /api/ventas` (requiere ARTESANO o ADMIN)
- `PUT /api/ventas/{id}/anular`
- `PATCH /api/ventas/{id}/seguimiento`
- `POST /api/stripe/webhook`

Tablas:

- `stocks`
- `stock_entries`
- `stock_exits`
- `clientes`
- `ventas`
- `venta_detalle`

### report-service

Responsabilidades:

- Consumir eventos Kafka.
- Guardar logs de movimiento.
- Crear snapshots de stock.
- Entregar reportes y alertas.

Endpoints:

- `GET /api/reports/summary`
- `GET /api/reports/history`
- `GET /api/reports/alerts`

Tablas:

- `movement_logs`
- `stock_snapshots`

## 16. Bases de datos

PostgreSQL contiene una base por microservicio:

- `auth_db`
- `catalog_db`
- `inventory_db`
- `report_db`

El script `docker/postgres/init-multiple-dbs.sh` crea varias bases al iniciar el contenedor por primera vez.

Credenciales:

- Usuario interno por defecto: `postgres`.
- Password real debe venir de `.env`.
- El puerto 5432 esta publicado en compose, pero en produccion se debe restringir por firewall/security group cuando sea posible.

## 17. Seguridad

Mecanismos actuales:

- JWT para rutas protegidas.
- `JwtAuthGatewayFilterFactory` en gateway: valida token, inyecta `X-User-Id` y `X-User-Role`.
- Headers `X-User-Id`, `X-User-Role` hacia servicios.
- Header interno `X-Internal-Token` para servicios internos (catalog, inventory).
- BCrypt para passwords.
- Google OAuth: ID token validado contra `https://oauth2.googleapis.com/tokeninfo`. Se verifica `aud == GOOGLE_CLIENT_ID` y `email_verified == true`.
- Aprobacion administrativa para ARTESANO y DOMICILIARIO.
- `CLIENTE` no entra al backoffice.
- `ADMIN` no se crea por registro publico.
- `/actuator/health` abierto solo para healthcheck.
- Usuarios Google OAuth creados siempre como CLIENTE con contrasena BCrypt aleatoria inutilizable.
- El catalogo publico esta separado de endpoints administrativos: productos/artesanos publicos usan DTOs reducidos.
- El gateway debe proteger `/api/products/admin/**`, `/api/artesanos/admin/**`, `/api/admin/db/**`, inventario, ventas, reportes, comunidad y perfil.
- Los errores de permisos deben ser explicitos (`401` sin identidad, `403` sin rol suficiente); no devolver listas vacias para ocultar fallos de autorizacion.

Rutas publicas permitidas sin JWT:

- `POST /api/auth/login`
- `POST /api/auth/register`
- `POST /api/auth/register-cliente`
- `POST /api/auth/refresh`
- `POST /api/auth/google`
- `GET /api/auth/config`
- `GET /api/categories/**`
- `GET /api/products/**` solo DTO publico
- `GET /api/artesanos/**` solo DTO publico
- `GET /api/public/eventos`
- `POST /api/stripe/**` segun firma/configuracion Stripe

Rutas privadas que siempre deben pasar por `JwtAuth`:

- `/api/auth/me/**`
- `/api/auth/users`
- `/api/auth/profile`
- `/api/auth/artisan-requests/**`
- `/api/auth/approval-requests/**`
- `/api/admin/db/**`
- `/api/products/admin/**`
- `/api/artesanos/admin/**`
- `/api/comunidad/**`
- `/api/stock/**`
- `/api/entries/**`
- `/api/exits/**`
- `/api/clientes/**`
- `/api/ventas/**`
- `/api/cliente-ventas/**`
- `/api/maestro-ventas/**`
- `/api/reports/**`

Campos prohibidos en catalogo publico:

- Productos publicos: no exponer `sku`, `stockMinimo`, `active`, `createdAt`, `updatedAt`.
- Artesanos publicos: no exponer `telefono`, `email`, `userAccountId`, `active`, `createdAt`.
- Las pruebas `RouteSecurityContractTest`, `PublicCatalogResponseTest`, `ArtesanoControllerRoleGuardTest` y `RoleGuardControllerTest` existen para evitar regresiones.

Puntos a reforzar:

- No publicar PostgreSQL al mundo.
- Usar HTTPS con dominio (Google OAuth en produccion requiere HTTPS para publicar la app).
- Rotar secretos si el dueno lo autoriza. Decision actual del dueno: no rotar por ahora para no arriesgar funcionalidad; documentar cualquier hallazgo sin ejecutar cambios destructivos.
- Usar AWS Secrets Manager o SSM Parameter Store.
- Configurar CORS para dominio real.
- Limitar login con rate limiting.
- Agregar validacion fuerte de payloads y tamanos.

## 18. Google OAuth — configuracion y flujo

### Flujo tecnico

```text
1. Frontend carga /api/auth/config → obtiene googleClientId
2. Si no vacio, carga script GSI: https://accounts.google.com/gsi/client
3. google.accounts.id.initialize({ client_id, callback })
4. google.accounts.id.renderButton(container, opciones)
5. Usuario hace clic → Google muestra selector de cuenta
6. Google retorna { credential: "ID_TOKEN" }
7. Frontend POST /api/auth/google { credential }
8. Backend llama https://oauth2.googleapis.com/tokeninfo?id_token=TOKEN
9. Valida aud == GOOGLE_CLIENT_ID y email_verified == true
10. Busca usuario por email (como username) en auth_db
11. Si no existe, crea CLIENTE con email como username
12. Emite JWT y AuthResponse → frontend lo almacena igual que login normal
```

### Configuracion en Google Cloud Console

- Proyecto: `rebbeca`
- Tipo de cliente: Web application
- Nombre del cliente OAuth: `Rebbeca user`
- Client ID configurado en servidor: `762114194584-kiukhkmjlot2qum4o9brsqirv8lfkl58.apps.googleusercontent.com`
- Origen autorizado de JavaScript: `http://56.126.102.113.nip.io`
- Estado: Prueba (Testing). Solo usuarios agregados como "usuarios de prueba" pueden autenticarse.
- Para publicar: requiere HTTPS con dominio real.

### Restriccion de origen

Google valida que la pagina que llama al SDK coincida con el origen autorizado. Por eso:

- Acceder por `http://56.126.102.113.nip.io/login` → boton de Google funciona.
- Acceder por `http://56.126.102.113/login` → boton no funciona (origen no autorizado).

### Variable de entorno

```bash
# En .env del servidor
GOOGLE_CLIENT_ID=762114194584-kiukhkmjlot2qum4o9brsqirv8lfkl58.apps.googleusercontent.com
```

Para activar/desactivar Google OAuth sin rebuild de codigo: solo editar `.env` y reiniciar auth-service.

### Para agregar usuarios de prueba

Google Cloud Console → Google Auth Platform → Publico → Usuarios de prueba → Agregar usuarios.

## 19. Assets e imagenes

Assets Angular:

- `frontend/public/assets`
- Logos: `logo.svg`, `logo-mark.svg`, `logo-artesanias.svg`.
- Hero: imagenes de Filandia, paisaje, iglesia, mirador.
- Placeholders: maestro, tejido, vasija.
- Patrones: guadua, noise, ornament.
- Territorio:
  - `territorio/filandia/filandia3.jpg`
  - `territorio/filandia/filandia4.jpg`
  - `territorio/filandia/filandia5.jpeg`
  - `territorio/filandia/photo2jpg.jpg`
  - `territorio/salento/salento1.jpg`
  - `territorio/salento/salento2.jpg`

Carpeta raiz `imagenes`:

- Contiene originales o apoyo visual.
- Incluye `filandia1.jpg`, pero esa imagen no esta actualmente en el carrusel publico copiado a `frontend/public/assets/territorio`.
- Para que una imagen sea servida por Angular en produccion debe estar dentro de `frontend/public`.

## 20. Liquid Glass / Glassmorphism

La app implementa Liquid Glass como lenguaje visual transversal. Al 2026-05-13 ya no debe limitarse a landing o cliente: permea toda la aplicacion con diferentes niveles de intensidad.

Superficies cubiertas:

- Landing publica.
- Header cliente.
- Tarjetas de artesanias.
- Tarjetas de maestros.
- Carrito.
- Checkout.
- Mis pedidos.
- Formulario de ventas.
- Dialogos de venta.
- Comunidad en algunos cards.
- Disenador IA de piezas personalizadas.
- Mis disenos y detalle individual.
- Revision de disenos personalizados en backoffice.
- Dashboard, shell, sidebar, tablas, filtros, KPIs, pedidos, productos, perfiles, formularios, notificaciones y paneles internos.

Implementacion:

- Utilidades globales en `frontend/src/styles.scss`.
- Bloque global `LIQUID GLASS PERMEATION LAYER`.
- Clases `.liquid-glass` y `.liquid-tilt`.
- Directiva `appLiquidPointer`.
- CSS variables `--mx`, `--my`, `--rx`, `--ry`.
- Tokens `--glass-refraction`, `--glass-highlight`, `--glass-inner-shadow`, `--rb-liquid-surface`, `--rb-liquid-border`, `--rb-liquid-shadow`.
- Animaciones globales `rb-page-rise`, `rb-card-rise`, `rb-liquid-sheen`, `rb-shimmer`, `rb-glass-in`, `rb-pulse-oro`.
- Reduccion por `prefers-reduced-motion`.
- Desktop con cursor reactivo.
- Mobile con animacion reducida.

Regla visual:

- Cliente: expresivo, premium y narrativo.
- Artesano: premium operativo, claro y con movimiento moderado.
- Domiciliario: rapido, legible y con animacion minima.
- Admin: enfocado en lectura y control, pero sin volver a superficies planas genericas.
- Las animaciones premium son parte del lenguaje: usar microinteracciones, shimmer sutil, elevacion fluida y entrada escalonada. Nunca sacrificar contraste, lectura o rendimiento.

## 21. Stripe

Stripe esta preparado en backend y frontend.

Variables esperadas:

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_SUCCESS_URL`
- `STRIPE_CANCEL_URL`
- `STRIPE_CURRENCY`

Comportamiento:

- Si `STRIPE_SECRET_KEY` esta vacio, el endpoint de checkout puede devolver `503`.
- `GET /api/ventas/admin/payment-status` indica si Stripe y webhook estan configurados, sin exponer llaves.
- Webhook publico: `/api/stripe/webhook`.
- La autenticidad del webhook depende de firma HMAC de Stripe.

Pendiente:

- Confirmar llaves reales en `.env`.
- Configurar webhook en panel de Stripe.
- Probar pago real o modo test extremo a extremo.
- Definir factura administrativa completa.

## 22. Kafka y reportes

Kafka se usa para comunicar eventos de inventario hacia reportes.

Flujo:

- `inventory-service` produce eventos de movimientos.
- `report-service` consume `inventory-events`.
- `report-service` guarda logs y snapshots.
- El frontend consulta reportes por `/api/reports/**`.

Beneficio:

- El inventario no depende sincronicamente de reportes.
- Permite historico y alertas.

## 23. Build y validacion

Comando requerido para frontend:

```bash
npm test -- --watch=false
npm run build
```

Comando requerido para backend:

```bash
mvn -q test
```

Comando para validar Compose:

```bash
docker compose config --quiet
```

Verificacion conocida al 2026-05-13:

- `mvn -q -pl catalog-service,inventory-service test` paso.
- `mvn -q -pl ai-service test` paso.
- `mvn -q test` paso.
- `npm test -- --watch=false` paso.
- `npm run build` paso.
- `docker compose config --quiet` paso.

Warnings conocidos al 2026-05-13:

- Maven puede mostrar warnings de Mockito dynamic agent.
- npm puede advertir sobre `--watch`.
- Los warnings previos de Sass `lighten/darken` y Angular `NG8011` fueron corregidos en los cambios locales recientes.

## 24. Correcciones de logica aplicadas (sesion 2026-04-26)

Esta seccion documenta bugs criticos corregidos para no reintroducirlos.

### UserRole ARTESANO en el enum del backend

ARTESANO fue agregado al enum `UserRole` del auth-service. Antes solo existia MAESTRO como alias del artesano, lo que causaba que registrarse como ARTESANO desde el frontend creara silenciosamente una cuenta CLIENTE.

- `UserRole` contiene: `ADMIN, OPERATOR, CLIENTE, MAESTRO, ARTESANO, DOMICILIARIO`.
- `normalizeRole` mapea `OPERATOR` y `MAESTRO` → `ARTESANO` (alias historicos).
- El JWT siempre contiene `ARTESANO`, nunca `MAESTRO`.
- Todos los checks de rol en inventory-service usan `"ARTESANO"`.

### Campos de Artesano en catalog.model.ts

El modelo publico `Artesano` en `catalog.model.ts` usaba campos incorrectos (`oficio`, `municipio`, `fotoUrl`) que no existen en el backend. Corregido a `especialidad`, `ubicacion`, `imageUrl`.

### registerCliente usa el endpoint correcto

`auth.service.ts` `registerCliente()` ahora llama `/api/auth/register-cliente` directamente en lugar de hacer un doble cast hacia `/api/auth/register`.

### AuthResponse incluye id del usuario

El backend retorna el UUID del usuario en el login response. Antes el id quedaba vacio (`''`) hasta que `loadProfile()` terminaba, causando que el panel del domiciliario mostrara lista de entregas vacia momentaneamente.

### markAsPaid preserva estado de entrega

`VentaService.markAsPaid` ahora muta la entidad cargada (`venta.setEstado("PAGADA")`) en lugar de crear una nueva instancia Venta que reseteaba todos los campos de delivery tracking.

### Error duplicado de usuario retorna 409

`registerCliente` ahora lanza `"El usuario ya existe"` (mensaje que el handler convierte a 409) en lugar de `"El nombre de usuario ya esta registrado"` (que retornaba 500).

## 24B. Correcciones y hardening aplicados (sesion 2026-05-12)

Esta seccion documenta cambios recientes para que una IA futura no los revierta por accidente.

### Landing publica

- Se corrigieron textos y acentos visibles en la landing.
- Se ajusto el `aria-label` del carrusel/indicadores.
- La landing ya no filtra productos por `active` en el frontend, porque el backend publico controla que sale.

### Tests base

- `auth-service/src/test/java/com/inventory/auth/controller/AuthControllerTest.java` ahora mockea `GoogleAuthService` y define secretos de prueba.
- `frontend/src/app/app.spec.ts` valida `router-outlet`.

### Configuracion sensible

- `api-gateway`, `auth-service`, `catalog-service`, `inventory-service` y `report-service` usan variables de entorno para `JWT_SECRET`, `INTERNAL_TOKEN` y credenciales de DB.
- `docker-compose.yml` exige `DB_PASSWORD`, `JWT_SECRET` e `INTERNAL_TOKEN`.
- `.env.example`, `README.md` y `RUN-LOCAL.md` explican que `.env` real no debe versionarse.
- Decision actual del dueno: no rotar secretos por ahora para no arriesgar funcionalidad; no cambiar `.env` de produccion sin autorizacion.

### Frontera publica/privada del catalogo

- `PublicArtesanoResponse` evita exponer `telefono`, `email`, `userAccountId`, `active`, `createdAt`.
- `PublicProductResponse` evita exponer `sku`, `stockMinimo`, `active`, `createdAt`, `updatedAt`.
- `ProductController` y `ArtesanoController` devuelven DTOs publicos en rutas publicas.
- Endpoints admin agregados/protegidos:
  - `/api/products/admin/**`
  - `/api/artesanos/admin/**`
- `ProductService` frontend recarga `loadForManagement()` despues de create/update/delete para mantener vista interna consistente.
- `ArtesanoService` frontend usa `/api/artesanos/admin` para datos completos administrativos.
- Dashboard y formularios internos cargan productos de gestion, no catalogo publico.
- El formulario/listado de producto solo muestra "Artesano creador" a `ADMIN`; `ARTESANO` no envia `artesanoId`.

### Pruebas nuevas

- `api-gateway/src/test/java/com/inventory/gateway/RouteSecurityContractTest.java`
- `catalog-service/src/test/java/com/inventory/catalog/dto/PublicCatalogResponseTest.java`
- `catalog-service/src/test/java/com/inventory/catalog/controller/ArtesanoControllerRoleGuardTest.java`
- `inventory-service/src/test/java/com/inventory/inventory/controller/RoleGuardControllerTest.java`

Estas pruebas cubren que rutas privadas tengan `JwtAuth`, que los DTOs publicos no filtren campos internos y que roles no autorizados reciban `401/403`.

### Permisos explicitos

- Se reemplazaron usos de `Flux.empty()` que ocultaban fallos de permisos.
- Casos sin identidad responden `401`.
- Roles insuficientes responden `403`.
- No volver a usar listas vacias como sustituto de autorizacion.

### Limpieza frontend/build

- Se corrigio el contenido proyectado del boton en `post-form`.
- Se eliminaron warnings Sass por `lighten/darken` usando `sass:color`.
- Se corrigio optional chaining innecesario en landing.
- `target/` y artefactos generados no deben versionarse; `.gitignore` cubre `**/target/`.

## 25. Que ya cumple el programa

Actualmente el sistema cumple con:

- Landing publica premium con separadores liquid glass entre secciones.
- Carrusel territorial (Filandia, Salento).
- Artesanos reales desde backend con campos correctos.
- Tarjetas de maestros rediseñadas: avatar circular, fondo difuminado, expansión premium en hover.
- Panel artesano en landing: acceso rapido a dashboard/artesanias/movimientos para ARTESANO y ADMIN.
- Glassmorphism / Liquid Glass en cliente, ventas, IA, disenos personalizados y backoffice.
- Cursor-reactive cards en desktop, reduccion de animaciones en mobile.
- Carrito con fondo de imagen sutil.
- Checkout con Stripe (URLs actualizadas a 56.126.102.113.nip.io).
- Checkbox "Guardar datos de envio para futuras compras" en checkout.
- Mis pedidos con fondo cafe.
- Login y Register con responsive movil mejorado (100dvh, breakpoints 640/480/360px).
- Register rediseñado: "UNETE AL TALLER" con role cards visuales (iconos), mismo estilo que registro-cliente.
- Login con usuario/contrasena y con Google (Google Identity Services, modo testing).
- Roles CLIENTE, ARTESANO, DOMICILIARIO, ADMIN correctamente normalizados.
- Redireccion post-login por rol (DOMICILIARIO va directo a su panel).
- Aprobacion de artesanos/domiciliarios.
- Perfil ampliado.
- Catalogo, productos, categorias y artesanos.
- Productos con multiples categorias: junction table `product_categories`, selector multiple en el formulario.
- Stock, entradas y salidas (formularios usan loadForManagement para ver todos los productos del artesano).
- Ventas.
- Pedidos.
- Seguimiento de entrega.
- Panel domiciliario con checklist de fases.
- Comunidad artesana.
- Eventos.
- Moderacion de comunidad.
- Reportes.
- Movimientos: nueva seccion `/movimientos` para ADMIN (todas las ventas) y ARTESANO (solo las suyas), con filtros de fecha/estado, KPIs y exportacion a Excel (CSV).
- Backoffice con fondos de imagen sutiles (pseudo-elemento ::after, opacity 0.06-0.07) y capa Liquid Glass global para shell, tablas, filtros, cards, paneles y formularios.
- Animaciones de botones premium con spring easing (cubic-bezier 0.34, 1.56, 0.64, 1) y shimmer sweep.
- Despliegue Docker en AWS EC2 (sa-east-1, t3.small).
- .env fuera del tracking de git, historial limpio (git filter-repo).
- Documentacion completa en `documentos/`: requisitos.md, schema-completo.sql, ENDPOINTS.md.
- `AuthResponse` con ID de usuario para disponibilidad inmediata post-login.

## 26. Caracteristicas faltantes o pendientes

Pendientes funcionales:

- Publicar Google OAuth en produccion (requiere HTTPS + dominio).
- Webhook de Stripe: actualizar URL en dashboard de Stripe a `http://56.126.102.113/api/stripe/webhook` (evento `checkout.session.completed`) para que el stock descuente al pagar.
- Bloqueo funcional completo si perfil no esta completo.
- Mapa real con rutas para domiciliario.
- Geolocalizacion en vivo.
- Evidencia final robusta con foto/firma.
- Notificaciones al cliente/artesano/domiciliario.
- Comentarios reales en comunidad.
- Moderacion real de imagenes con IA.
- Filtros avanzados y busqueda global.
- Dominio propio y HTTPS.
- Observabilidad: logs centralizados, metricas y alertas.
- Backups automaticos de PostgreSQL.
- CI/CD automatizado.

Pendientes tecnicos:

- Secretos de produccion: hubo exposicion historica corta segun documentacion previa. La decision actual del dueno es no rotar por ahora para no poner en riesgo funcionalidad. Cualquier IA debe reportar riesgos, pero no tocar `.env`, no rotar secretos y no cambiar configuracion productiva sin autorizacion explicita.
- Migrar secretos a gestor seguro (AWS Secrets Manager o SSM).
- Revisar publicacion del puerto 5432.
- Revisar CORS para dominio productivo.
- Ajustar instancia a `t3.medium` si se quiere margen de RAM.
- Mantener build libre de warnings nuevos. Los warnings Sass `lighten/darken` y Angular NG8011 documentados previamente ya fueron corregidos localmente al 2026-05-12.
- Considerar Flyway/Liquibase para migraciones mas robustas.

## 27. Recomendaciones de evolucion

Prioridad alta:

- HTTPS y dominio (desbloquea Google OAuth en produccion y mejora seguridad general).
- Backups de base de datos.
- Cerrar PostgreSQL al publico si no es necesario.
- Completar Stripe test end-to-end.
- Terminar bloqueo por perfil incompleto.
- Mejorar facturacion y comprobantes.

Prioridad media:

- Mapa real para domiciliario.
- Evidencia de entrega.
- Notificaciones al cliente/artesano/domiciliario.
- Comentarios en comunidad.
- Moderacion de imagenes.

Prioridad baja o futura:

- GraalVM Native Images.
- CI/CD completo.
- Escalado a arquitectura mas robusta.

## 28. Prompt reutilizable para continuar el proyecto

Usa este prompt cuando otra IA o desarrollador vaya a trabajar el proyecto:

Nota: este bloque reutilizable debe leerse junto con todo este archivo. No reemplaza las secciones anteriores; las resume para arrancar rapido una conversacion nueva.

```text
Actua como Ingeniero Senior Full Stack, Frontend Angular 21, Backend Spring Boot WebFlux y DevOps AWS. Trabaja sobre el proyecto existente Almacen Artesanias / Rebecca.

Respeta la arquitectura actual:
- Angular 21 standalone + signals + Angular Material + SCSS.
- Spring Boot 3.4.5 Java 21 WebFlux.
- Microservicios: api-gateway, auth-service, catalog-service, inventory-service, report-service, discovery-server.
- PostgreSQL 17 con `auth_db`, `catalog_db`, `inventory_db`, `report_db` y `ai_db`.
- Kafka 3.7 para eventos de inventario.
- Docker Compose en EC2 Ubuntu (AWS, sa-east-1, IP elastica 56.126.102.113, dominio 56.126.102.113.nip.io).
- Instance ID documentado: i-0d81d8a1ac3abee87. Ruta servidor: /home/ubuntu/project_artesanias. SSH habitual: ssh -i ~/Downloads/almacen-key.pem ubuntu@56.126.102.113.
- GitHub: Jsua3/project_artesanias, rama master. Carpeta local actual: D:\Sua_Files\IdeaProjects\almacen-arle.
- Frontend servido por nginx y proxy /api hacia api-gateway.
- environment.prod.ts usa apiUrl: ''.
- El frontend se compila localmente y se commitea dist/frontend/browser.
- En EC2 no compilar Angular dentro de Docker.
- El frontend SIEMPRE necesita docker compose build frontend antes de force-recreate.
- No desplegar sin autorizacion explicita. Revisar RELEASE-CHECKLIST.md antes.

No rompas:
- Login con usuario/contrasena y con Google OAuth.
- Roles ADMIN, CLIENTE, ARTESANO, DOMICILIARIO.
- Normalizacion: OPERATOR y MAESTRO se convierten a ARTESANO. El JWT siempre lleva ARTESANO.
- Carrito, checkout, mis-pedidos.
- Productos, categorias, artesanos, stock, ventas, pedidos.
- Comunidad, eventos y moderacion.
- Healthchecks de Docker.
- Ruteo nginx /api.
- AuthResponse incluye id del usuario (UUID).
- Catalogo publico con DTO reducido: productos publicos no exponen sku/stockMinimo/active/createdAt/updatedAt; artesanos publicos no exponen telefono/email/userAccountId/active/createdAt.
- Rutas admin protegidas: /api/products/admin/**, /api/artesanos/admin/**, /api/admin/db/**.
- Permisos denegados deben ser 401/403, no listas vacias silenciosas.

Antes de cambiar codigo:
- Revisa rutas existentes.
- Revisa contratos actuales. Los campos de Artesano son: nombre, especialidad, ubicacion, imageUrl (NO oficio, municipio, fotoUrl).
- No cambies backend si la tarea es solo UI.
- No expongas secretos.
- No sobrescribas .env.
- No rotes secretos sin autorizacion explicita del dueno.
- Si tocas gateway o catalogo publico, actualiza SECURITY-ROUTES.md y pruebas.
- No uses MAESTRO como rol en checks de inventory-service. Usa ARTESANO.

Para frontend:
- Mantener identidad Rebecca: terracota, crema, sage, mauve, dorado, Cormorant Garamond + Outfit.
- Liquid Glass expresivo en cliente, IA y flujos premium. Backoffice tambien usa Liquid Glass, pero sobrio, denso y legible.
- Mobile con animaciones reducidas. Login/register usan 100dvh, breakpoints 640/480/360px.
- Usar assets en frontend/public/assets y frontend/public/assets/imagenes.
- No reintroducir filandia1.jpg en el carrusel.
- Google OAuth: boton aparece cuando GOOGLE_CLIENT_ID esta configurado en el servidor.
- Botones de la landing usan spring easing: cubic-bezier(0.34, 1.56, 0.64, 1).
- Separadores entre secciones: rb-sep con backdrop-filter blur, NO svg wave.
- Formulario de producto usa mat-select multiple para categoryIds (no categoryId unico).
- entry-form, exit-form, stock y reports usan productService.loadForManagement() (no loadAll).
- Fondos decorativos en backoffice via ::after con opacity 0.06-0.07 y mask-image radial-gradient.

Para backend:
- Mantener R2DBC, WebFlux y JWT.
- Agregar migraciones idempotentes con IF NOT EXISTS y ON CONFLICT DO NOTHING.
- Mantener /actuator/health accesible para healthchecks.
- No insertar passwords planas.
- markAsPaid muta la entidad existente, no crea instancia nueva.
- catalog-service: ProductService usa ProductCategoryRepository para multiples categorias.
- ProductResponse incluye categoryIds List<UUID> ademas del legacy categoryId.
- getProductsByCategory busca en junction table product_categories (no solo en category_id de products).

Para despliegue:
- Usar git pull --ff-only.
- Si hay divergencia por reescritura de historial: cp .env /tmp/.env.bak && git fetch && git reset --hard origin/master && cp /tmp/.env.bak .env.
- Construir servicios por separado.
- Frontend: git pull + build + docker compose build frontend + force-recreate.
- catalog-service o backend: docker compose build <servicio> + docker compose up -d --no-deps <servicio> + sleep 20.
- Para `ai-service`, verificar antes `OPENAI_API_KEY` en `.env` si se desea modo OpenAI real; si no existe, queda fallback local.
- Si el volumen de Postgres ya existia antes de `ai_db`, crear `ai_db` manualmente antes de levantar `ai-service`.
- Arrancar escalonado: postgres → discovery-server → api-gateway + auth → catalog + inventory + report + ai-service → frontend.
- Verificar: docker compose ps, free -h, frontend 200, /api/products 200, /api/auth/config 200, login invalido 401.

Antes de recomendar deploy, ejecutar localmente:
- mvn -q test
- cd frontend && npm test -- --watch=false
- cd frontend && npm run build
- docker compose config --quiet
```

## 29. Cambios criticos sesion 2026-04-27/28

Esta seccion documenta los cambios mas importantes para no reintroducir bugs ni deshacer trabajo.

### Seguridad: .env fuera del historial de git

El archivo `.env` fue removido del tracking (`git rm --cached`) y el historial reescrito con `git filter-repo --path .env --invert-paths --force`. El repositorio publico ya no contiene ninguna version del .env. El .gitignore ahora cubre *.pem, *.key, secrets/, imagenes/, logs/ y variantes de .env.

Importante: los secretos que estaban en commit `1acbed8` (DB_PASSWORD, JWT_SECRET, INTERNAL_TOKEN) pueden haberse indexado durante el tiempo que el repo fue publico. Recomendacion tecnica general: rotarlos. Decision actual del dueno al 2026-05-12: no rotar por ahora para no arriesgar funcionalidad. Una IA futura debe reportar el riesgo, pero no ejecutar rotacion ni editar `.env` sin autorizacion explicita.

### Multiples categorias por producto (catalog_db)

Se agrego la tabla `product_categories (id UUID, product_id UUID, category_id UUID, UNIQUE(product_id, category_id))`. La migracion en schema.sql copia automaticamente el `category_id` existente de cada producto a la nueva tabla al arrancar. El campo legacy `category_id` en `products` se mantiene como columna de compatibilidad (apunta a la primera categoria).

- `ProductRequest` ahora acepta `categoryIds: List<UUID>` ademas del legacy `categoryId`.
- `ProductResponse` incluye `categoryIds: List<UUID>`.
- `getProductsByCategory` busca en `product_categories` (captura productos con multiples categorias).
- Frontend: `mat-select multiple` sobre `categoryIds`. Al editar, precarga las categorias existentes.

No reintroducir un selector simple de categoria unica — el formulario debe ser siempre multi-select.

### Stripe: URLs deben apuntar al servidor real

`STRIPE_SUCCESS_URL` y `STRIPE_CANCEL_URL` en `.env` del servidor apuntan a `http://56.126.102.113.nip.io`. El stock descuenta en `markAsPaid()` que es llamado por el webhook. Para que el webhook funcione, la URL en el dashboard de Stripe debe ser `http://56.126.102.113/api/stripe/webhook` con evento `checkout.session.completed`.

### Inventario: loadForManagement en formularios

`entry-form`, `exit-form`, `stock.component` y `reports.component` usan `productService.loadForManagement()` → `GET /api/products/admin/all`. Este endpoint ya filtra por artesano en el backend (ARTESANO solo ve los suyos, ADMIN ve todos). No usar `loadAll()` para estos componentes porque solo devuelve productos activos y no filtra por artesano.

### Separadores de secciones en landing

Los separadores entre secciones usan `backdrop-filter: blur(28px)` con `position` fija y solape de ±44px. No tienen altura propia. No usar SVG wave con relleno solido — eso crea bordes duros. El badge central (emblema Rebecca) es liquid glass con border dorado.

### Fondos decorativos en backoffice

Dashboard, movimientos y stock usan `::after` pseudo-elemento con `position: fixed`, `opacity: 0.06`, `mask-image: radial-gradient` para el efecto de imagen en esquina. NO usar `background: transparent 0%` con imagen porque la imagen se ve cruda sin overlay en la zona inicial del degradado.

## 30. Resumen ejecutivo

Rebecca es una plataforma de comercio y gestion artesanal con tienda publica premium, backoffice por roles y flujo IA para diseno de piezas personalizadas. El cliente ve una experiencia visual narrativa con productos, maestros, carrito, pedidos, mis disenos y un asistente para crear artesanias personalizadas. El artesano/admin revisa solicitudes IA, consulta detalle completo, cambia estados, deja notas, convierte disenos aprobados en productos reales prellenados, administra catalogo, ventas, stock, comunidad, eventos y movimientos. El domiciliario gestiona entregas y progreso. El administrador controla catalogo, usuarios, solicitudes, moderacion, reportes y todos los movimientos del sistema.

La app esta desplegada y funcional en AWS EC2 (Sao Paulo, instancia de memoria limitada documentada como t3.small en este script) con Docker Compose. Incluye login con Google Identity Services (modo testing). La documentacion completa (requisitos, schema SQL, endpoints, matriz de seguridad y checklist de release) esta en la carpeta `documentos/` y en la raiz del proyecto.

Ultimo despliegue historico documentado: commit `0916add`, bundle `main-YWHGDPUF.js`, 2026-04-28. Antes de cualquier despliegue nuevo, verificar el commit real en EC2 con `git rev-parse --short HEAD`.

Estado documental actualizado al 2026-05-13: este archivo es el prompt maestro canonico. Los cambios locales recientes de seguridad, DTOs publicos, IA, disenos personalizados, notificaciones, conversion a producto, reglas de precio configurables y Liquid Glass global no deben asumirse desplegados hasta ejecutar un release controlado y autorizado.

## 31. Canon consolidado absoluto de documentos y prompts

Esta seccion existe para que una IA futura no dependa de buscar contexto en prompts dispersos. Los archivos historicos pueden permanecer como referencia, pero la fuente de verdad es este documento. Si un dato aqui contradice un prompt viejo, manda este archivo. Si un dato aqui contradice el codigo actual, revisar el codigo y actualizar este archivo antes de actuar.

### 31.1 Mapa de documentos fuente absorbidos

- `PROMPT-MAESTRO-AWS.md`: ya no contiene instrucciones propias; solo apunta a este archivo.
- `documentos/PROMPT_CLAUDE_CODE_REBECCA.md`: prompt historico de iteracion v2. Sus reglas vigentes quedan integradas aqui: postura senior, no reescribir arquitectura, no romper login, roles canonicos, `markAsPaid`, `AuthResponse.id`, `environment.prod.ts`, despliegue escalonado, seguridad de `.env`, estetica Rebecca y validaciones.
- `cliente/PROMPT-CLAUDE-DESIGN.md`: prompt historico de direccion de arte. Sus detalles visuales quedan integrados aqui: Eje Cafetero, Filandia, Salento, bahareque, guadua, palma de cera, neblina, barro, paleta, tipografias, tono, composicion y mockups esperados.
- `README.md`: resumen de stack, arquitectura, roles, endpoints principales, variables, deploy AWS y reglas de negocio.
- `RUN-LOCAL.md`: guia de ejecucion local con Docker Compose, seeder, Stripe local, troubleshooting y credenciales de prueba.
- `DEPLOY-CLIENTE.md`: fases historicas de cliente, carrito, checkout, Stripe, ventas del artesano y migraciones.
- `BUILD-BACKEND-2B.md` y `BUILD-BACKEND-2C.md`: checklists de build de Stripe y multi-artesano por linea.
- `AWS-DEPLOY-GUIDE.md`: guia inicial AWS; contiene datos historicos de t2.micro y `deploy.sh`. Mantener como referencia antigua, pero el estado actual documentado de produccion usa EC2 Ubuntu en Sao Paulo, Docker Compose y memoria limitada documentada como `t3.small` en este maestro.
- `documentos/ENDPOINTS.md`: mapa de endpoints historico; debe actualizarse si se agregan rutas nuevas. Actualmente el sistema tambien incluye `ai-service` y rutas `/api/ai/**`.
- `documentos/requisitos.md`: requisitos funcionales y criterios de aceptacion. Algunas reglas historicas de aprobacion fueron modificadas en iteraciones posteriores; este maestro documenta la decision vigente cuando exista conflicto.
- `SECURITY-ROUTES.md`: matriz viva de rutas publicas y privadas. Debe mantenerse sincronizada con el gateway.
- `RELEASE-CHECKLIST.md`: checklist de release controlado; obligatorio antes de desplegar.
- `cliente/INTEGRACION-ANGULAR.md`: guia historica para migrar prototipo cliente a Angular 21, tokens SCSS, Three.js y rendimiento.
- `Almacen Artesanias Design System/`: design system externo con tokens, UI kits cliente/admin y reglas de marca. Se considera material absorbido por las secciones visuales de este maestro.

### 31.2 Identidad, tematica y tono de producto

Rebecca / Almacen Artesanias es una plataforma de comercio y gestion artesanal colombiana, centrada en oficios del Eje Cafetero. No debe sentirse como marketplace generico ni como SaaS frio. Debe funcionar como tienda/museo vivo: cada pieza tiene maestra o maestro, territorio, material, tecnica, historia y ruta de taller.

La marca habla con calidez, respeto y precision. El tono es colombiano neutro, reverente sin solemnidad, sin paternalismo. Vocabulario preferido: `maestro`, `maestra`, `oficio`, `taller`, `pieza`, `vereda`, `territorio`, `guadua`, `barro`, `fique`, `iraca`, `tejido`, `quemado`, `torneado`, `cafetal`, `neblina`. En copy publico evitar `proveedor`, `SKU`, `vendedor`, `stock` como palabra dominante o lenguaje de urgencia agresiva. En backoffice si se permite lenguaje operativo: producto, SKU, stock, venta, reporte.

Audiencia:

- Compradores urbanos colombianos de 28 a 55 anos que valoran piezas con historia.
- Turistas nacionales e internacionales que conocieron el Quindio y quieren seguir comprando.
- Hoteles boutique, interioristas y compradores institucionales que buscan piezas con identidad.
- Artesanos y administradores que necesitan un sistema operativo sobrio para catalogo, inventario, ventas, eventos, comunidad y entregas.

Territorios y referencias visuales obligatorias:

- Filandia, Quindio: fundacion 1878, 1.923 msnm, mirador Colina Iluminada, cesteria en bejuco, cafe especial.
- Salento, Quindio: fundacion 1842, 1.895 msnm, Valle del Cocora, guadua, alpargateria, cafe de finca.
- Tambien se aceptan referencias a Armenia, Circasia, Pijao, Cordoba y Calarca cuando el contenido lo pida.
- Evitar cliches de costa, playa, sombrero vueltiao, palmas de coco o Macondo generico. La estetica correcta es montana cafetera: madera humeda, bahareque, guadua, niebla, cafetales, barro, fibra vegetal.

Maestros de ejemplo historicos para mocks o seeds visuales:

- Aurora Henao, cesteria, Filandia.
- Jesus Buitrago, guadua, Salento.
- Rosalba Cardenas, ceramica, Filandia.
- Hernan Mejia, cafe especial, Salento.
- Marta Galvez, telar de lana, Filandia.
- Ignacio Duque, talla en madera, Salento.
- Maria Fernandez aparece en seeds locales como artesana vinculada a `seed.maestro`.

### 31.3 Tecnologia canonica

Frontend:

- Angular 21.2.x.
- Standalone components.
- Signals para estado local.
- Angular Router.
- Angular Material.
- SCSS.
- RxJS.
- TypeScript 5.9.
- Chart.js y ng2-charts.
- Google Identity Services SDK cargado dinamicamente en login.
- Vitest para `ng test`.
- Build productivo con Angular CLI.
- `environment.prod.ts` usa `apiUrl: ''` para que nginx proxyee `/api`.

Backend:

- Java 21.
- Maven multi-modulo.
- Spring Boot 3.4.5.
- Spring WebFlux.
- Spring Cloud Gateway.
- Spring Cloud Netflix Eureka.
- Spring Security.
- JWT con JJWT.
- BCrypt para passwords.
- R2DBC PostgreSQL.
- Apache Kafka.
- Stripe Java SDK en inventory-service para Checkout/Webhook.
- OpenAI API en `ai-service`, nunca llamada directo desde Angular.

Datos e infraestructura:

- PostgreSQL 17 alpine.
- Bases: `auth_db`, `catalog_db`, `inventory_db`, `report_db`, `ai_db`.
- Kafka 3.7.0 en modo KRaft.
- Docker Compose.
- nginx en `frontend` sirve Angular compilado y proxyea `/api`.
- AWS EC2 Ubuntu 22.04 en `sa-east-1`, IP elastica `56.126.102.113`, dominio `56.126.102.113.nip.io`.
- Instancia documentada actualmente como `t3.small` de 2 GB RAM con swap de 4 GB. Existen documentos historicos que mencionan `t2.micro`/`t3.micro`; antes de decisiones de capacidad verificar en AWS o metadata.

Microservicios:

- `frontend`: nginx, puerto publico 80.
- `api-gateway`: puerto 8080, valida JWT e inyecta headers internos.
- `auth-service`: puerto 8081, `auth_db`, usuarios, roles, login, refresh, Google OAuth, perfil, aprobaciones.
- `catalog-service`: puerto 8082, `catalog_db`, categorias, artesanos, productos, comunidad, eventos, catalogo publico.
- `inventory-service`: puerto 8083, `inventory_db`, clientes, ventas, pedidos, stock, entradas, salidas, Stripe, entregas.
- `report-service`: puerto 8084, `report_db`, reportes y alertas alimentadas por Kafka.
- `ai-service`: puerto 8085, `ai_db`, agente de diseno 3D, precios variables, solicitudes personalizadas.
- `discovery-server`: puerto 8761, Eureka.
- `postgres`: puerto 5432.
- `kafka`: puerto 9092.

### 31.4 Repositorio, rutas y despliegue

Repositorio GitHub canonico:

- `Jsua3/project_artesanias`
- Rama principal: `master`
- Carpeta local actual: `D:\Sua_Files\IdeaProjects\almacen-arle`
- Ruta servidor esperada: `/home/ubuntu/project_artesanias`
- Ruta corta historica: `~/project_artesanias`
- SSH habitual documentado: `ssh -i ~/Downloads/almacen-key.pem ubuntu@56.126.102.113`
- Instance ID documentado: `i-0d81d8a1ac3abee87`
- URL publica recomendada: `http://56.126.102.113.nip.io`
- IP directa: `http://56.126.102.113`
- Google OAuth debe usarse desde `http://56.126.102.113.nip.io`; por IP directa puede fallar por origen no autorizado.

Despliegue:

- No desplegar sin autorizacion explicita del dueno.
- No sobrescribir `.env`.
- No copiar secretos a chats, commits ni documentacion.
- Usar `git pull --ff-only`.
- En EC2 no compilar Angular con `ng build` dentro del contenedor por memoria. El frontend debe compilarse localmente y subirse/commitearse segun el flujo actual.
- El frontend siempre requiere `docker compose build frontend` antes de `docker compose up -d --no-deps --force-recreate frontend`.
- Backend se reconstruye por servicios, no todo junto si se puede evitar.
- Arranque recomendado: `postgres` -> `discovery-server` -> `api-gateway + auth-service` -> `catalog-service + inventory-service + report-service + ai-service` -> `frontend`.
- Si el volumen de Postgres ya existia antes de `ai_db`, crear `ai_db` manualmente antes de levantar `ai-service`.

Comandos de verificacion local antes de sugerir release:

```bash
mvn -q test
cd frontend && npm test -- --watch=false
cd frontend && npm run build
docker compose config --quiet
```

Comandos de diagnostico en servidor:

```bash
docker compose ps
free -h
docker stats
curl http://localhost/
curl http://localhost/api/products
curl http://localhost/api/auth/config
curl http://localhost:8080/actuator/health
docker compose logs --tail=120 api-gateway
docker compose logs --tail=120 auth-service
docker compose logs --tail=120 catalog-service
docker compose logs --tail=120 inventory-service
docker compose logs --tail=120 report-service
docker compose logs --tail=120 ai-service
```

Si hay divergencia por reescritura de historial:

```bash
cp .env /tmp/.env.bak
git fetch
git reset --hard origin/master
cp /tmp/.env.bak .env
```

### 31.5 Variables de entorno

`.env` no se versiona. `.env.example` es plantilla.

Variables obligatorias o importantes:

- `DB_USER`, normalmente `postgres`.
- `DB_PASSWORD`, obligatorio; no usar valores de ejemplo en produccion.
- `JWT_SECRET`, obligatorio; si es conocido, cualquiera puede firmar JWTs.
- `INTERNAL_TOKEN`, obligatorio; autentica gateway hacia microservicios.
- `GOOGLE_CLIENT_ID`, opcional; si esta vacio no aparece el boton de Google.
- `STRIPE_SECRET_KEY`, opcional; si esta vacio el checkout online responde 503.
- `STRIPE_WEBHOOK_SECRET`, requerido para webhook real de Stripe.
- `STRIPE_SUCCESS_URL`, debe apuntar al dominio real y conservar `{ventaId}` cuando aplique.
- `STRIPE_CANCEL_URL`, debe apuntar al dominio real.
- `STRIPE_CURRENCY`, por defecto `cop`, siempre minusculas.
- `OPENAI_API_KEY`, opcional; si esta vacio `ai-service` usa fallback local.
- `OPENAI_DESIGN_MODEL`, actual por defecto `gpt-5-mini`.
- `OPENAI_IMAGE_MODEL`, actual por defecto `gpt-image-1`.
- `OPENAI_BASE_URL`, por defecto `https://api.openai.com/v1`.
- `AI_PRICING_SECONDARY_FACTOR`, por defecto `0.35`.
- `AI_PRICING_SIZE_MULTIPLIER`, por defecto `900`.
- `AI_PRICING_MAX_SIZE_COST`, por defecto `95000`.
- `AI_PRICE_BASE_LAMP`, `AI_PRICE_BASE_BASKET`, `AI_PRICE_BASE_PLANTER`, `AI_PRICE_BASE_JEWELRY`, `AI_PRICE_BASE_TRAY`, `AI_PRICE_BASE_MURAL`.
- `AI_PRICE_MATERIAL_GUADUA`, `AI_PRICE_MATERIAL_BARRO`, `AI_PRICE_MATERIAL_CERAMICA`, `AI_PRICE_MATERIAL_FIQUE`, `AI_PRICE_MATERIAL_IRACA`, `AI_PRICE_MATERIAL_MADERA`, `AI_PRICE_MATERIAL_LANA`, `AI_PRICE_MATERIAL_FILAMENTO`.
- `AI_PRICE_COMPLEXITY_BAJA`, `AI_PRICE_COMPLEXITY_MEDIA`, `AI_PRICE_COMPLEXITY_ALTA`.
- `AI_PRICE_FINISH_DORADO`, `AI_PRICE_FINISH_TALLADO`, `AI_PRICE_FINISH_BRILLANTE`, `AI_PRICE_FINISH_MATE`.
- `CATALOG_SERVICE_URL`, `INVENTORY_SERVICE_URL`, `REPORT_SERVICE_URL`, `AI_SERVICE_URL`, usados por gateway o llamadas internas.
- `EUREKA_HOST`, `KAFKA_HOST`, `DB_HOST`.

Nunca cambiar hostnames internos Docker como `postgres`, `kafka`, `discovery-server`, `auth-service`, `catalog-service`, `inventory-service`, `report-service`, `ai-service`, `api-gateway` por `localhost` dentro de contenedores.

### 31.6 Seguridad y roles

Roles canonicos:

- `ADMIN`: acceso total.
- `ARTESANO`: gestiona sus piezas, ventas, stock, comunidad, eventos y solicitudes IA.
- `DOMICILIARIO`: panel de entregas y tracking.
- `CLIENTE`: tienda publica, carrito, checkout, mis pedidos, disenos personalizados.

Alias historicos:

- `OPERATOR` y `MAESTRO` se normalizan a `ARTESANO`.
- No usar `MAESTRO` en checks nuevos. El JWT debe llevar `ARTESANO`.

Reglas de seguridad:

- Todo trafico externo entra por `frontend/nginx` o `api-gateway`.
- El gateway valida JWT en rutas privadas e inyecta `X-User-Id`, `X-User-Role`, `X-Profile-Complete` y `X-Internal-Token`.
- Microservicios internos verifican `X-Internal-Token`.
- `/internal/**` no debe exponerse via gateway.
- Permisos denegados deben devolver `401` o `403`; no devolver listas vacias silenciosas salvo casos de perfil incompleto documentados o filtros de propiedad.
- Endpoints publicos de catalogo solo exponen DTOs reducidos.

Catalogo publico:

- Productos publicos no deben exponer `sku`, `stockMinimo`, `active`, `createdAt`, `updatedAt`.
- Artesanos publicos no deben exponer `telefono`, `email`, `userAccountId`, `active`, `createdAt`.
- Rutas admin de catalogo viven bajo `/api/products/admin/**` y `/api/artesanos/admin/**`.
- `SECURITY-ROUTES.md` y pruebas de gateway deben actualizarse con toda ruta nueva.

Secretos:

- `.env` fue removido del historial y se reescribio el repo con `git filter-repo`.
- Secretos antiguos pudieron quedar indexados cuando el repo fue publico. Recomendacion tecnica: rotar. Decision del dueno al 2026-05-12: no rotar por ahora para no arriesgar funcionalidad. No rotar ni editar `.env` sin instruccion explicita.

### 31.7 Base de datos canonica

`auth_db`:

- `user_accounts`, `refresh_tokens`.
- Campos de perfil incluyen username, password hash, role, approval status, display name, avatar, nombres, telefono, bio, localidad, oficio/craftType, direccion, completitud.
- Passwords siempre BCrypt.
- `AuthResponse` incluye `id` UUID.

`catalog_db`:

- `categories`.
- `artesanos` con campos canonicos: `id`, `nombre`, `telefono`, `email`, `especialidad`, `ubicacion`, `imageUrl`, `active`, `userAccountId`, `createdAt`.
- No usar campos inventados como `oficio`, `municipio`, `vereda`, `fotoUrl`, `bio` si no existen en el modelo actual.
- `products` con category legacy y multi-categoria.
- `product_categories`: `id`, `product_id`, `category_id`, unique `product_id/category_id`.
- `community_posts`, `community_post_likes`, `community_events`.

`inventory_db`:

- `stocks`, `stock_entries`, `stock_exits`.
- `clientes` con `user_account_id` opcional para clientes self-service.
- `ventas`, `venta_detalle`.
- `ventas` soporta estados `PENDIENTE`, `PAGADA`, `COMPLETADA`, `ANULADA`.
- Stripe: `stripe_session_id`.
- Shipping: recipient name, phone, address, city, notes.
- Courier: `courier_user_id`, `courier_accepted_at`, tracking fields.
- `venta_detalle.artesano_id` es snapshot sin FK a catalog, para ventas por artesano.

`report_db`:

- `movement_logs`, `stock_snapshots`.
- Consume Kafka `inventory-events`.

`ai_db`:

- `custom_design_requests`: solicitud de producto personalizado IA.
- Campos: `id`, `user_id`, `title`, `product_type`, `status`, `spec_json`, `price_breakdown_json`, `estimated_price`, `estimated_days`, `customer_notes`, `review_notes`, `preview_prompt`, `preview_image_base64`, `preview_mime_type`, `preview_source`, `created_at`, `updated_at`.
- Estados actuales: `PENDING_QUOTE`, `IN_REVIEW`, `QUOTE_SENT`, `CUSTOMER_ACCEPTED`, `IN_PRODUCTION`, `READY`, `NEEDS_CHANGES`, `APPROVED_FOR_PRODUCT`, `REJECTED`, `CANCELLED`, `ARCHIVED`.
- `custom_design_notifications`: notificaciones persistentes para cliente cuando el taller cambia estado o deja/actualiza nota.
- Campos notificaciones: `id`, `user_id`, `design_id`, `title`, `message`, `status`, `read_at`, `created_at`.

Migraciones:

- Siempre idempotentes: `CREATE TABLE IF NOT EXISTS`, `CREATE INDEX IF NOT EXISTS`, `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`, bloques `DO $$` cuando PostgreSQL lo requiera.
- No usar migraciones destructivas sin backup y autorizacion.

### 31.8 Endpoints y superficies funcionales

Base URL produccion historica: `http://56.126.102.113/api`.

Auth publico:

- `GET /api/auth/config`
- `POST /api/auth/register`
- `POST /api/auth/register-cliente`
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `POST /api/auth/google`

Auth privado:

- `GET /api/auth/me`
- `GET /api/auth/me/profile-status`
- `PUT /api/auth/profile`
- `GET /api/auth/users` ADMIN
- `GET/PATCH /api/auth/approval-requests/**` ADMIN
- `GET/PATCH /api/auth/artisan-requests/**` ADMIN

Catalogo publico:

- `GET /api/categories`
- `GET /api/categories/{id}`
- `GET /api/products`
- `GET /api/products/{id}`
- `GET /api/products/category/{categoryId}`
- `GET /api/products/artesano/{artesanoId}`
- `GET /api/artesanos`
- `GET /api/artesanos/{id}`
- `GET /api/public/eventos`

Catalogo privado:

- Categorias `POST/PUT/DELETE /api/categories/**` ADMIN.
- Artesanos admin `POST/PUT/DELETE /api/artesanos/**`, `PUT /api/artesanos/{id}/user-link`, rutas admin bajo `/api/artesanos/admin/**`.
- Productos admin `GET /api/products/admin/all`, `GET /api/products/admin/artesano/{artesanoId}`, `POST/PUT/DELETE/PATCH /api/products/**`.
- Comunidad: `/api/comunidad/posts/**`, `/api/comunidad/eventos/**`, moderacion y reportes.

Inventario:

- `GET /api/stock`, `GET /api/stock/{productId}`.
- `POST /api/entries`, `POST /api/exits`.
- Clientes internos `/api/clientes/**`.
- Ventas backoffice `/api/ventas/**`.
- `GET /api/ventas/entregas`, `PATCH /api/ventas/{id}/aceptar-domicilio`, `PATCH /api/ventas/{id}/seguimiento`.

Cliente:

- `POST /api/cliente-ventas`.
- `GET /api/cliente-ventas/mias`.
- `GET /api/cliente-ventas/{id}`.
- `POST /api/cliente-ventas/{id}/checkout-session`.
- Webhook Stripe publico: `POST /api/stripe/webhook`, protegido por firma HMAC, no JWT.

Artesano:

- `GET /api/maestro-ventas/mias` historico, accesible para `ARTESANO` y `ADMIN`.

Reportes:

- `GET /api/reports/summary`
- `GET /api/reports/history`
- `GET /api/reports/alerts`

AI:

- `POST /api/ai/design/message` CLIENTE/ADMIN.
- `POST /api/ai/design/preview` CLIENTE/ADMIN.
- `POST /api/ai/design/confirm` CLIENTE/ADMIN.
- `GET /api/ai/design/mine` CLIENTE/ADMIN.
- `GET /api/ai/design/{id}` CLIENTE propietario, ADMIN o ARTESANO.
- `GET /api/ai/design/notifications` CLIENTE/ADMIN.
- `GET /api/ai/design/notifications/unread-count` CLIENTE/ADMIN.
- `PATCH /api/ai/design/notifications/{id}/read` CLIENTE/ADMIN propietario.
- `PATCH /api/ai/design/notifications/read-all` CLIENTE/ADMIN.
- `GET /api/ai/admin/config-status` ADMIN, indica si OpenAI esta configurado sin exponer la API key.
- `GET /api/ai/design/review` ADMIN/ARTESANO.
- `PATCH /api/ai/design/{id}/status` ADMIN/ARTESANO.

System health:

- `GET /api/admin/system-health` ADMIN, atendido directamente por `api-gateway`, agrega healthchecks de frontend/gateway/microservicios, estado OpenAI, estado Stripe y checklist de release.

Admin DB:

- Rutas bajo `/api/admin/db/**` son privadas y solo ADMIN. Deben mantenerse en gateway con `JwtAuth`.

### 31.9 Reglas de negocio que no deben romperse

- Stock nunca puede quedar negativo.
- Entradas y salidas publican eventos Kafka.
- Report-service mantiene logs y snapshots desde Kafka.
- Venta anulada restaura stock.
- `markAsPaid` muta la entidad `Venta` existente; no crear una venta nueva porque se perderian tracking, shipping, courier y metadata.
- Precio de checkout se resuelve en backend desde catalogo; nunca se confia en precio enviado por cliente.
- Estado `PENDIENTE` no descuenta stock; descuento ocurre al pasar a `PAGADA`.
- Stripe Checkout usa line items server-side desde `VentaDetalle`.
- Webhook Stripe verifica `STRIPE_WEBHOOK_SECRET`.
- COP se trata como moneda zero-decimal.
- Cliente solo ve sus ventas.
- Artesano solo ve/gestiona sus propios productos y ventas asociadas a sus lineas.
- `venta_detalle.artesano_id` es snapshot historico, no FK.
- Productos sin artesano pueden existir; no aparecen en ventas de artesano.
- Multi-categoria por producto es canon; no volver a selector de categoria unica.
- Registro de cliente fuerza rol `CLIENTE`; nunca aceptar `role` en `/register-cliente`.
- Google OAuth crea CLIENTE con password aleatoria inutilizable.
- Boton Google aparece solo si `GOOGLE_CLIENT_ID` existe.
- Domiciliario post-login va directo a `/domiciliario/panel`.

### 31.10 AI, diseno 3D y producto personalizado

`ai-service` es un microservicio separado y privado tras gateway. Angular no llama OpenAI directamente.

Mecanica:

- Cliente entra a `/disena-tu-pieza`.
- Conversa con agente.
- El agente devuelve `DesignSpec`: tipo, titulo, historia, territorio, materiales, paleta, dimensiones, patron, acabado, complejidad, precio estimado, desglose, dias, pasos de fabricacion y parametros 3D.
- Si `OPENAI_API_KEY` falta o OpenAI falla, fallback local crea una propuesta util.
- Preview 3D local funciona sin OpenAI.
- Boceto visual con OpenAI es opcional.
- Al confirmar, se guarda solicitud privada en `ai_db.custom_design_requests` con `PENDING_QUOTE`.
- Si el cliente genero boceto visual, la confirmacion puede persistir `preview_prompt`, `preview_image_base64`, `preview_mime_type` y `preview_source`, para que taller y cliente vean el mismo boceto asociado al encargo.
- Cliente ve sus encargos en `/mis-disenos` y puede abrir ficha completa en `/mis-disenos/:id`.
- ADMIN/ARTESANO revisa en `/disenos-personalizados`, cambia estado, deja respuesta del taller y puede abrir ficha completa en `/disenos-personalizados/:id`.
- La solicitud no se publica automaticamente en catalogo.
- Si la solicitud esta `APPROVED_FOR_PRODUCT`, el taller puede usar el boton `Crear producto` para abrir el formulario real de producto prellenado con nombre, descripcion tecnica, precio estimado, stock minimo y origen `Diseno IA #...`. El formulario exige categoria antes de guardar.
- Al crear producto desde diseno, se guarda una nota de taller indicando que el producto fue creado desde el diseno IA.
- Cuando el taller cambia estado o notas, `ai-service` crea una notificacion persistente para el cliente.
- El cliente ve novedades en `/mis-disenos`, puede marcar todas como leidas y al abrir el detalle se marca como leida la notificacion asociada.

Precio:

- OpenAI puede sugerir, pero precio final lo calcula backend con `PricingService`.
- El desglose considera tipo de pieza, material principal, materiales secundarios, complejidad, tamano y acabado.
- Las reglas de precio ya fueron extraidas a configuracion bajo `pricing.design.*` en `ai-service`. Pueden ajustarse por variables de entorno sin cambiar codigo ni redeploy de logica. A futuro se puede mover a tabla/admin UI.

### 31.11 Frontend canonico

Rutas publicas:

- `/`: landing publica.
- `/carrito`.
- `/checkout`.
- `/disena-tu-pieza`.
- `/mis-disenos`.
- `/mis-disenos/:id`.
- `/mis-pedidos`.
- `/mis-pedidos/:id`.
- `/login`.
- `/register`.
- `/registro-cliente`.

Rutas de shell/backoffice:

- `/dashboard`.
- `/products`.
- `/categories`.
- `/artesanos`.
- `/disenos-personalizados`.
- `/disenos-personalizados/:id`.
- `/clientes`.
- `/ventas`.
- `/pedidos`.
- `/stock`.
- `/inventory/entries`.
- `/inventory/exits`.
- `/entregas`.
- `/movimientos`.
- `/reports`.
- `/artesano/comunidad`.
- `/artesano/eventos`.
- `/domiciliario/panel`.
- `/admin/usuarios`.
- `/admin/artisan-requests`.
- `/admin/aprobaciones`.
- `/admin/moderacion`.
- `/admin/system-health`.
- `/admin/database`.

Patrones:

- Usar standalone components.
- Usar signals para estado local.
- Usar Angular Material para controles.
- Usar `MatSnackBar` para errores operativos.
- Interceptor agrega JWT.
- Guards: `authGuard`, `adminGuard`, `notClienteGuard`, `roleGuard`.
- CLIENTE no entra al backoffice.
- Liquid Glass premium permea cliente y backoffice; en cliente puede ser mas expresivo, en backoffice debe mantener densidad operativa. No volver a superficies planas genericas; usar vidrio, blur, bordes internos, sombras calidas y animaciones suaves sin sacrificar legibilidad.
- Mantener lazy routes para no inflar bundle inicial.
- `CartService` usa localStorage.
- Catalogo publico tiene fallback visual si backend devuelve vacio/falla.
- Mocks de productos publicos deben tener prefijo `mock-` y no agregarse al carrito real.

### 31.12 Design system canonico

Paletas historicas compatibles:

- Paleta principal actual Rebecca: terracota, crema, sage, mauve, dorado, coffee.
- Tokens de prompt historico: Clay `#A67C52`, Clay deep `#704A2E`, Cream `#F5F0E8`, Bone `#EDE4D3`, Sage `#8A9A7B`, Moss `#5A6B4A`, Coffee `#3E2723`, Gold `#C9A253`, Mauve `#A88696`, Ember `#C86A3A`.
- Tokens design-system alternos: Greige `#A69683`, Greige deep `#6E6152`, Greige light `#C4B7A5`, Cream `#EFEAE1`, Bone `#E4DDD1`, Warm white `#F8F5EE`, Coffee `#3A3228`, Terra green `#7A8968`, Terra green deep `#4E5A42`, Terra purple `#8E7482`, Gold `#B89A5E`, Ember `#B07050`.
- En codigo actual preferir no hacer paletas monohue; usar crema como base y acentos contenidos.
- Gold/dorado es filamento, borde, subrayado o icono pequeno. Nunca bloque grande.
- No combinar Gold y Ember como dominantes.
- Evitar gradientes morados genericos.

Tipografias:

- Cormorant Garamond: titulos editoriales, hero, citas.
- Fraunces: numeros grandes, slogans, poster, estadisticas si esta disponible.
- Outfit: UI/body.
- JetBrains Mono: precios, codigos, IDs y tickets.
- No introducir Inter, Roboto, Poppins o Space Grotesk como identidad principal.

Composicion:

- Cliente: editorial, respirado, secciones grandes, narrativa, territorio, imagenes reales o generadas, glassmorphism.
- Admin: denso pero claro, operativo, vidrio sobrio, tarjetas y tablas legibles.
- Grid base historico: 12 columnas desktop, 6 tablet, 4 mobile.
- Ritmo vertical ideal: 80-120px entre secciones grandes.
- Bordes: 4-12px normales, 16-24px solo modales/hero cards.
- Sombras calidas con tinte coffee, no grises puras.
- Focus ring visible: 2px gold con offset 3px.
- Hit targets mobile minimo 44px.
- Respetar `prefers-reduced-motion`.
- No usar emojis en copy publico.

Iconografia:

- Material Icons / Material Symbols en admin.
- Lucide o iconografia lineal equivalente en cliente si se introduce.
- Iconos custom aceptables para guadua, vasija, telar, grano de cafe, torno, palma.

Hero/landing:

- La captura inicial actual usa hero fotografico territorial con header Liquid Glass, marca Rebeca, navegacion Colecciones/Maestros/Territorio/Oficio, CTA y contadores.
- El prompt historico pedia Three.js con vasijas LatheGeometry, guaduas, palmas de cera, particulas doradas y niebla. No es obligatorio si la implementacion actual usa foto/preview, pero si se retoma debe ser sutil, no invasivo, sin OrbitControls visibles, con reduced motion.
- Hero no debe ser landing generica SaaS.

### 31.13 Datos locales, seeds y pruebas manuales

`RUN-LOCAL.md` documenta:

- Docker Desktop 24+.
- Al menos 4 GB RAM libre para local completo.
- Puertos: `80`, `5432`, `8080`, `8081`, `8082`, `8083`, `8084`, `8085`, `8761`, `9092`.
- Primer arranque: copiar `.env.example` a `.env`, editar secretos, `docker compose up -d --build`, esperar healthchecks, correr seeder con profile seed.

Credenciales sembradas historicas:

- ADMIN: `seed.admin` / `admin123`.
- CLIENTE: `seed.cliente` / `cliente123`.
- MAESTRO/ARTESANO: `seed.maestro` / `maestro123`.
- Seed crea artesano Maria Fernandez y productos como jarron, cuenco, ruana.

Stripe local:

- Instalar Stripe CLI.
- `stripe login`.
- `stripe listen --forward-to http://localhost:8080/api/stripe/webhook`.
- Copiar `whsec_...` a `.env` como `STRIPE_WEBHOOK_SECRET`.
- Tarjeta de prueba: `4242 4242 4242 4242`.

Troubleshooting:

- Servicio unhealthy: revisar logs y orden de arranque, restart selectivo.
- Checkout 503: `STRIPE_SECRET_KEY` vacio.
- Webhook no llega: Stripe CLI o dashboard mal configurado.
- `/api/products` publico 403: revisar ruta gateway e inyeccion `X-Internal-Token`.
- Maestro/artesano ve ventas vacias: revisar `artesanos.user_account_id`.
- Docker build falla por memoria: construir servicios uno por uno y revisar swap.

### 31.14 Requisitos funcionales absorbidos

Los requisitos funcionales vigentes cubren:

- Registro y login por roles.
- Login con Google.
- Perfil y completitud.
- Gestion de usuarios ADMIN.
- Categorias, artesanos, productos.
- Catalogo publico.
- Stock, entradas, salidas, alertas.
- Carrito y checkout.
- Stripe.
- Mis pedidos.
- Ventas directas.
- Anulacion de ventas.
- Domiciliario, aceptar pedido y tracking.
- Shipping del cliente.
- Comunidad, likes, reportes, moderacion.
- Eventos y ferias aprobadas.
- Reportes de inventario.
- Clientes internos.
- Activar/desactivar producto.
- Diseno 3D personalizado con IA, solicitud privada, revision de taller y precio variable.

Cuando un requisito historico diga que ARTESANO/DOMICILIARIO queda `PENDING` hasta aprobacion, verificar el codigo actual y la decision vigente. En este proyecto hubo iteraciones que cambiaron el flujo de aprobacion/perfil; no asumir sin revisar `auth-service`.

### 31.15 Estado de recomendaciones al 2026-05-13

Completado localmente y documentado en este canon:

1. Prompts generales unificados en `SCRIPT_MAESTRO_PROYECTO_REBECCA.md`.
2. Solicitud IA aprobada convertible en producto real con formulario prellenado.
3. Detalle individual de diseno personalizado para cliente y backoffice.
4. Preview visual persistido en la solicitud mediante prompt/base64/mime/source.
5. Estados ampliados del encargo personalizado: `PENDING_QUOTE`, `IN_REVIEW`, `QUOTE_SENT`, `CUSTOMER_ACCEPTED`, `IN_PRODUCTION`, `READY`, `NEEDS_CHANGES`, `APPROVED_FOR_PRODUCT`, `REJECTED`, `CANCELLED`, `ARCHIVED`.
6. Notificaciones internas al cliente cuando taller/admin cambia estado o deja nota.
7. Reglas de precio extraidas a configuracion `pricing.design.*` en `ai-service`, ajustables por variables de entorno.
8. Lenguaje visual Liquid Glass premium aplicado globalmente a cliente, IA y backoffice.

Backlog recomendado despues de este punto:

1. QA visual con screenshots reales en desktop/mobile de landing, catalogo, carrito, checkout, mis pedidos, disenos IA, detalle, revision admin, dashboard, productos, ventas, pedidos, stock y entregas.
2. Pruebas E2E del flujo IA completo: crear diseno, preview, confirmar, cambiar estado, notificar, abrir detalle y convertir a producto.
3. Email o push opcional tomando `custom_design_notifications` como fuente de verdad.
4. UI admin para editar reglas de precio sin tocar `.env`; hoy existen variables de entorno, pero no pantalla administrativa.
5. Migraciones robustas con Flyway/Liquibase para cambios futuros de schema.
6. Release controlado y autorizado: no desplegar hasta revisar build, pruebas, `.env`, backup y checklist.

Regla de ejecucion: avanzar en estos puntos sin desplegar hasta que el dueno autorice release.
