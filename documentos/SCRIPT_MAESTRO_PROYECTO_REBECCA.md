# Script maestro del proyecto Almacen Artesanias / Rebecca

## 1. Identidad del proyecto

Almacen Artesanias es una aplicacion academica de gestion, venta y exhibicion de artesanias colombianas. La interfaz administrativa y comercial se conoce visualmente como Rebecca. El sistema combina una tienda publica para clientes con un backoffice por roles para administradores, artesanos y domiciliarios.

La vision principal es conectar a clientes con artesanos locales, permitir la administracion de catalogo e inventario, procesar pedidos y preparar una experiencia mas cercana a una tienda artesanal premium: fotografias territoriales, tarjetas con Liquid Glass / glassmorphism, narrativa ligera por scroll, carrito, checkout, seguimiento de pedidos, comunidad artesana y paneles internos funcionales.

Repositorio:

- GitHub: `Jsua3/project_artesanias`
- Rama principal: `master`
- Commit desplegado validado: `ae6c4f3`
- URL publica actual: `http://56.126.102.113`

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
  -> PostgreSQL y Kafka segun el caso
```

Contenedores principales:

- `frontend`: nginx que sirve Angular precompilado.
- `api-gateway`: Spring Cloud Gateway, entrada unica para `/api/**`.
- `discovery-server`: Eureka, servicio de descubrimiento.
- `auth-service`: autenticacion, usuarios, roles, perfiles y aprobaciones.
- `catalog-service`: categorias, productos, artesanos, comunidad y eventos.
- `inventory-service`: stock, entradas, salidas, clientes, ventas, pedidos, tracking y Stripe.
- `report-service`: reportes y alertas alimentadas por eventos.
- `postgres-db`: PostgreSQL con cuatro bases de datos.
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

- IP elastica publica: `56.126.102.113`.
- Usuario SSH: `ubuntu`.
- Ruta del proyecto en servidor: `~/project_artesanias`.
- Ruta local esperada de llave SSH: `~/Downloads/almacen-key.pem`.
- Comando SSH:

```bash
ssh -i ~/Downloads/almacen-key.pem ubuntu@56.126.102.113
```

Estado validado tras despliegue:

- `frontend`: arriba.
- `api-gateway`: healthy.
- `auth-service`: healthy.
- `catalog-service`: healthy.
- `inventory-service`: healthy.
- `report-service`: healthy.
- `discovery-server`: healthy.
- `postgres-db`: healthy.
- `kafka-broker`: healthy.

Pruebas realizadas:

- `http://56.126.102.113/` responde `200`.
- `/api/products` responde `200`.
- `/api/comunidad/posts` sin token responde `401`, correcto porque es ruta protegida.
- `/api/auth/login` con credenciales falsas responde `401`, correcto.
- Bundle frontend desplegado: `main-E6WTEPJQ.js`.

## 5. Restricciones de memoria y despliegue

La instancia actual es `t3.small`. Funciona, pero esta ajustada porque se ejecutan varios procesos Java, Kafka, Postgres y nginx en una sola maquina. Durante validacion se observo uso aproximado de:

- Memoria total Linux: ~1.9 GiB.
- Memoria usada: ~1.4 GiB.
- Disponible: ~284 MiB.
- Swap usado: ~1.3 GiB de 4 GiB.

Reglas importantes:

- No compilar Angular dentro del contenedor en EC2.
- El frontend debe compilarse localmente y subir `frontend/dist/frontend/browser/`.
- No levantar o reconstruir todos los servicios Java al mismo tiempo si no es necesario.
- Para frontend, usar despliegue aislado.
- Para backend, reconstruir servicios por etapas.
- No borrar ni sobrescribir `.env`.
- No exponer valores reales de `JWT_SECRET`, `INTERNAL_TOKEN`, `DB_PASSWORD`, `STRIPE_SECRET_KEY` ni webhooks.

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

Actualizar solo frontend en servidor:

```bash
cd ~/project_artesanias
git pull origin master
docker compose up -d --build --no-deps frontend
```

Despliegue cuidadoso de backend:

```bash
cd ~/project_artesanias
docker compose stop api-gateway auth-service catalog-service inventory-service report-service
git pull --ff-only origin master
docker compose build auth-service
docker compose build catalog-service
docker compose build inventory-service
docker compose build report-service
docker compose up -d --no-deps auth-service catalog-service inventory-service report-service
sleep 60
docker compose up -d --no-deps api-gateway
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
docker compose up -d catalog-service inventory-service report-service
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
curl http://localhost:8080/actuator/health
docker compose logs --tail=120 api-gateway
docker compose logs --tail=120 auth-service
docker compose logs --tail=120 catalog-service
docker compose logs --tail=120 inventory-service
docker compose logs --tail=120 report-service
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

- `auth`: login, registro, registro cliente, aprobaciones.
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

- `auth.service.ts`: login, registro, sesion, perfil, roles.
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

- `/login`
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

Roles frontend:

- `ADMIN`
- `ARTESANO`
- `DOMICILIARIO`
- `CLIENTE`
- `OPERATOR` se normaliza como `ARTESANO`.

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
- Artesanos destacados con informacion expandible.
- Productos reales desde backend y fallback mock si no hay datos.
- Botones para agregar al carrito sin login.
- Login obligatorio al confirmar checkout.
- Mis pedidos con estados y progreso.

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

El rol DOMICILIARIO tiene una interfaz rapida y funcional.

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
- GET de catalogo publico.
- Stripe webhook.

Rutas protegidas:

- Perfil y usuarios.
- Productos admin.
- Comunidad.
- Inventory.
- Reports.

### auth-service

Responsabilidades:

- Registro.
- Login.
- Refresh token.
- Perfil.
- Roles.
- Aprobaciones de artesano/domiciliario.
- Hash BCrypt.
- JWT.

Endpoints:

- `POST /api/auth/register`
- `POST /api/auth/register-cliente`
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `GET /api/auth/me`
- `PUT /api/auth/profile`
- `GET /api/auth/users`
- `GET /api/auth/approval-requests`
- `GET /api/auth/artisan-requests`
- `PATCH /api/auth/approval-requests/{userId}`
- `PATCH /api/auth/artisan-requests/{userId}`

Tablas:

- `user_accounts`
- `refresh_tokens`

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
- `GET /api/artesanos`
- `POST /api/artesanos`
- `PUT /api/artesanos/{id}`
- `DELETE /api/artesanos/{id}`
- `PUT /api/artesanos/{id}/user-link`
- `GET /internal/artesanos/by-user/{userAccountId}`
- `GET /api/products`
- `GET /api/products/admin/all`
- `GET /api/products/{id}`
- `GET /api/products/category/{categoryId}`
- `GET /api/products/artesano/{artesanoId}`
- `GET /api/products/admin/artesano/{artesanoId}`
- `POST /api/products`
- `PUT /api/products/{id}`
- `DELETE /api/products/{id}`
- `PATCH /api/products/{id}/active`

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
- Pedidos del maestro.
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
- `GET /api/maestro-ventas/mias`
- `GET /api/ventas`
- `GET /api/ventas/entregas`
- `GET /api/ventas/{id}`
- `GET /api/ventas/cliente/{clienteId}`
- `POST /api/ventas`
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
- `JwtAuthGatewayFilterFactory` en gateway.
- Headers `X-User-Id`, `X-User-Role` hacia servicios.
- Header interno `X-Internal-Token` para servicios internos.
- BCrypt para passwords.
- Aprobacion administrativa para ARTESANO y DOMICILIARIO.
- `CLIENTE` no entra al backoffice.
- `ADMIN` no se crea por registro publico.
- `/actuator/health` abierto solo para healthcheck.

Puntos a reforzar:

- No publicar PostgreSQL al mundo.
- Usar HTTPS con dominio.
- Rotar secretos si fueron compartidos.
- Usar AWS Secrets Manager o SSM Parameter Store.
- Configurar CORS para dominio real.
- Limitar login con rate limiting.
- Agregar validacion fuerte de payloads y tamanos.

## 18. Assets e imagenes

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

## 19. Liquid Glass / Glassmorphism

La app implementa Liquid Glass principalmente en:

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

Implementacion:

- Utilidades globales en `frontend/src/styles.scss`.
- Clases `.liquid-glass` y `.liquid-tilt`.
- Directiva `appLiquidPointer`.
- CSS variables `--mx`, `--my`, `--rx`, `--ry`.
- Reduccion por `prefers-reduced-motion`.
- Desktop con cursor reactivo.
- Mobile con animacion reducida.

Regla visual:

- Cliente: expresivo, premium y narrativo.
- Artesano: sobrio, claro y con menos movimiento.
- Domiciliario: rapido, legible y casi sin animacion.
- Admin: enfocado en lectura y control.

## 20. Stripe

Stripe esta preparado en backend y frontend.

Variables esperadas:

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_SUCCESS_URL`
- `STRIPE_CANCEL_URL`
- `STRIPE_CURRENCY`

Comportamiento:

- Si `STRIPE_SECRET_KEY` esta vacio, el endpoint de checkout puede devolver `503`.
- Webhook publico: `/api/stripe/webhook`.
- La autenticidad del webhook depende de firma HMAC de Stripe.

Pendiente:

- Confirmar llaves reales en `.env`.
- Configurar webhook en panel de Stripe.
- Probar pago real o modo test extremo a extremo.
- Definir factura administrativa completa.

## 21. Kafka y reportes

Kafka se usa para comunicar eventos de inventario hacia reportes.

Flujo:

- `inventory-service` produce eventos de movimientos.
- `report-service` consume `inventory-events`.
- `report-service` guarda logs y snapshots.
- El frontend consulta reportes por `/api/reports/**`.

Beneficio:

- El inventario no depende sincronicamente de reportes.
- Permite historico y alertas.

## 22. Build y validacion

Comando requerido para frontend:

```bash
node node_modules/@angular/cli/bin/ng.js build --configuration production
```

Comando requerido para backend:

```bash
mvn -pl api-gateway,auth-service,catalog-service,inventory-service,report-service -am -DskipTests compile
```

Warnings conocidos:

- Warnings Sass por funciones `lighten/darken` deprecadas.
- Warning Angular `NG8011` en `post-form.component.html`.
- Estos warnings no bloquean build actualmente.

## 23. Que ya cumple el programa

Actualmente el sistema cumple con:

- Landing publica premium.
- Carrusel territorial.
- Uso de imagenes de `frontend/public/assets/territorio`.
- Remocion efectiva de `filandia1.jpg` del carrusel publico.
- Glassmorphism / Liquid Glass en cliente y ventas.
- Cursor-reactive cards en desktop.
- Reduccion de animaciones en mobile/reduced motion.
- Carrito.
- Checkout preparado con Stripe.
- Mis pedidos.
- Login y registro.
- Roles CLIENTE, ARTESANO, DOMICILIARIO, ADMIN.
- Aprobacion de artesanos/domiciliarios.
- Perfil ampliado.
- Catalogo, productos, categorias y artesanos.
- Stock, entradas y salidas.
- Ventas.
- Pedidos.
- Seguimiento de entrega.
- Panel domiciliario.
- Comunidad artesana.
- Eventos.
- Moderacion de comunidad.
- Reportes.
- Despliegue Docker en AWS.

## 24. Caracteristicas faltantes o pendientes

Pendientes funcionales:

- Google OAuth para login/registro.
- GraalVM Native Images / Spring Native.
- Encuestas posteriores al registro.
- Bloqueo funcional completo si perfil no esta completo.
- Mapa real con rutas para domiciliario.
- Geolocalizacion en vivo.
- Evidencia final robusta con foto/firma.
- Factura formal al ADMIN cuando domiciliario acepta pedido.
- Sistema completo de notificaciones.
- Comentarios reales en comunidad, no solo contador visual si no esta conectado.
- Moderacion real de imagenes con IA.
- Filtros avanzados y busqueda global.
- Dominio propio y HTTPS.
- Observabilidad: logs centralizados, metricas y alertas.
- Backups automaticos de PostgreSQL.
- CI/CD automatizado.
- Tests unitarios/integracion/e2e mas completos.

Pendientes tecnicos:

- Revisar publicacion del puerto 5432.
- Migrar secretos a gestor seguro.
- Revisar CORS para dominio productivo.
- Ajustar instancia a `t3.medium` si se quiere margen de RAM.
- Corregir warnings Sass y Angular.
- Considerar Flyway/Liquibase para migraciones mas robustas.

## 25. Recomendaciones de evolucion

Prioridad alta:

- HTTPS y dominio.
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
- Google OAuth.
- CI/CD completo.
- Escalado a arquitectura mas robusta.

## 26. Prompt reutilizable para continuar el proyecto

Usa este prompt cuando otra IA o desarrollador vaya a trabajar el proyecto:

```text
Actua como Ingeniero Senior Full Stack, Frontend Angular 21, Backend Spring Boot WebFlux y DevOps AWS. Trabaja sobre el proyecto existente Almacen Artesanias / Rebecca.

Respeta la arquitectura actual:
- Angular 21 standalone + signals + Angular Material + SCSS.
- Spring Boot 3.4.5 Java 21 WebFlux.
- Microservicios: api-gateway, auth-service, catalog-service, inventory-service, report-service, discovery-server.
- PostgreSQL 17 con auth_db, catalog_db, inventory_db y report_db.
- Kafka 3.7 para eventos de inventario.
- Docker Compose en EC2 Ubuntu.
- Frontend servido por nginx y proxy /api hacia api-gateway.
- environment.prod.ts usa apiUrl: ''.
- El frontend se compila localmente y se commitea dist/frontend/browser.
- En EC2 no compilar Angular dentro de Docker.

No rompas:
- Login, registro, refresh token, JWT.
- Roles ADMIN, CLIENTE, ARTESANO, DOMICILIARIO.
- Carrito, checkout, mis-pedidos.
- Productos, categorias, artesanos, stock, ventas, pedidos.
- Comunidad, eventos y moderacion.
- Healthchecks de Docker.
- Ruteo nginx /api.

Antes de cambiar codigo:
- Revisa rutas existentes.
- Revisa contratos actuales.
- No cambies backend si la tarea es solo UI.
- No expongas secretos.
- No sobrescribas .env.

Para frontend:
- Mantener identidad Rebecca.
- Liquid Glass expresivo solo en cliente.
- Backoffice sobrio y eficiente.
- Mobile con animaciones reducidas.
- Usar assets en frontend/public/assets.
- No reintroducir filandia1.jpg en el carrusel.

Para backend:
- Mantener R2DBC, WebFlux y JWT.
- Agregar migraciones idempotentes.
- Mantener /actuator/health accesible para healthchecks.
- No insertar passwords planas.

Para despliegue:
- Usar git pull --ff-only.
- Construir servicios por separado.
- Arrancar escalonado.
- Verificar docker compose ps, free -h, frontend 200, /api/products 200, comunidad sin token 401, login invalido 401.
```

## 27. Resumen ejecutivo

Rebecca es una plataforma de comercio y gestion artesanal con tienda publica premium y backoffice por roles. El cliente ve una experiencia visual narrativa con productos, maestros, carrito y pedidos. El artesano administra catalogo, ventas, stock, comunidad y eventos. El domiciliario gestiona entregas y progreso. El administrador controla catalogo, usuarios, solicitudes, moderacion y reportes.

La app ya esta desplegada y funcional en AWS EC2 con Docker Compose. Su mayor riesgo operativo actual es la memoria limitada de la instancia `t3.small`, por lo que los despliegues deben hacerse por etapas o considerar subir a `t3.medium` si se busca mas tranquilidad.
