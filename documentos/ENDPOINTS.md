# Resumen de Endpoints — Almacén Artesanías / Rebecca

Base URL producción: `http://56.126.102.113/api`  
Base URL local: `http://localhost:8080/api`

Autenticación: `Authorization: Bearer <token>` en todos los endpoints protegidos.  
El token se obtiene en `POST /api/auth/login` o `POST /api/auth/google`.

---

## auth-service — `/api/auth`

| Método | Ruta | Descripción | Auth | Roles |
|--------|------|-------------|------|-------|
| `GET`  | `/auth/config` | Retorna `{ googleClientId }` para el SDK de Google | No | — |
| `POST` | `/auth/register` | Registro de ARTESANO o DOMICILIARIO (queda PENDING) | No | — |
| `POST` | `/auth/register-cliente` | Registro de CLIENTE (aprobado automáticamente) | No | — |
| `POST` | `/auth/login` | Login con usuario y contraseña. Retorna JWT + refresh token | No | — |
| `POST` | `/auth/refresh` | Renueva el access token usando el refresh token | No | — |
| `POST` | `/auth/google` | Login / registro con Google ID token | No | — |
| `GET`  | `/auth/me` | Perfil del usuario autenticado | Sí | Todos |
| `GET`  | `/auth/me/profile-status` | Estado de completitud del perfil | Sí | Todos |
| `PUT`  | `/auth/profile` | Actualizar perfil (nombre, bio, avatar, teléfono, etc.) | Sí | Todos |
| `GET`  | `/auth/users` | Listar todos los usuarios | Sí | ADMIN |
| `GET`  | `/auth/approval-requests` | Listar solicitudes de aprobación pendientes | Sí | ADMIN |
| `PATCH`| `/auth/approval-requests/{userId}` | Aprobar o rechazar una solicitud | Sí | ADMIN |
| `GET`  | `/auth/artisan-requests` | Listar solicitudes de artesanos pendientes | Sí | ADMIN |
| `PATCH`| `/auth/artisan-requests/{userId}` | Aprobar o rechazar artesano | Sí | ADMIN |

---

## catalog-service — `/api/categories`, `/api/artesanos`, `/api/products`

### Categorías

| Método | Ruta | Descripción | Auth | Roles |
|--------|------|-------------|------|-------|
| `GET`    | `/categories` | Listar todas las categorías activas | No | — |
| `GET`    | `/categories/{id}` | Obtener categoría por ID | No | — |
| `POST`   | `/categories` | Crear categoría | Sí | ADMIN |
| `PUT`    | `/categories/{id}` | Editar categoría | Sí | ADMIN |
| `DELETE` | `/categories/{id}` | Eliminar categoría | Sí | ADMIN |

### Artesanos

| Método | Ruta | Descripción | Auth | Roles |
|--------|------|-------------|------|-------|
| `GET`    | `/artesanos` | Listar artesanos activos | No | — |
| `GET`    | `/artesanos/{id}` | Obtener artesano por ID | No | — |
| `POST`   | `/artesanos` | Crear artesano | Sí | ADMIN |
| `PUT`    | `/artesanos/{id}` | Editar artesano | Sí | ADMIN |
| `DELETE` | `/artesanos/{id}` | Eliminar artesano | Sí | ADMIN |
| `PUT`    | `/artesanos/{id}/user-link` | Vincular artesano con cuenta de usuario | Sí | ADMIN |

### Productos

| Método | Ruta | Descripción | Auth | Roles |
|--------|------|-------------|------|-------|
| `GET`    | `/products` | Listar productos activos (público) | No | — |
| `GET`    | `/products/admin/all` | Listar todos los productos incl. inactivos | Sí | ADMIN, ARTESANO |
| `GET`    | `/products/{id}` | Obtener producto por ID | No | — |
| `GET`    | `/products/category/{categoryId}` | Productos por categoría | No | — |
| `GET`    | `/products/artesano/{artesanoId}` | Productos activos de un artesano | No | — |
| `GET`    | `/products/admin/artesano/{artesanoId}` | Todos los productos de un artesano | Sí | ADMIN, ARTESANO |
| `POST`   | `/products` | Crear producto | Sí | ADMIN, ARTESANO |
| `PUT`    | `/products/{id}` | Editar producto | Sí | ADMIN, ARTESANO |
| `DELETE` | `/products/{id}` | Eliminar producto | Sí | ADMIN |
| `PATCH`  | `/products/{id}/active` | Activar / desactivar producto | Sí | ADMIN, ARTESANO |

---

## catalog-service — `/api/comunidad`, `/api/public`

### Comunidad

| Método | Ruta | Descripción | Auth | Roles |
|--------|------|-------------|------|-------|
| `GET`    | `/comunidad/posts` | Listar publicaciones activas del feed | Sí | Todos |
| `GET`    | `/comunidad/posts/moderacion` | Listar publicaciones reportadas | Sí | ADMIN |
| `POST`   | `/comunidad/posts` | Crear publicación | Sí | ARTESANO, ADMIN |
| `POST`   | `/comunidad/posts/{id}/report` | Reportar publicación | Sí | Todos |
| `POST`   | `/comunidad/posts/{id}/like` | Dar / quitar like | Sí | Todos |
| `PATCH`  | `/comunidad/posts/{id}/estado` | Cambiar estado (ACTIVO / ELIMINADO) | Sí | ADMIN |
| `DELETE` | `/comunidad/posts/{id}` | Eliminar publicación | Sí | ADMIN, autor |
| `GET`    | `/comunidad/eventos` | Listar eventos aprobados | Sí | Todos |
| `GET`    | `/comunidad/eventos/mis` | Eventos propuestos por el artesano actual | Sí | ARTESANO |
| `GET`    | `/comunidad/eventos/pending` | Eventos pendientes de revisión | Sí | ADMIN |
| `POST`   | `/comunidad/eventos` | Proponer evento o feria | Sí | ARTESANO |
| `PATCH`  | `/comunidad/eventos/{id}/review` | Aprobar o rechazar evento | Sí | ADMIN |

### Públicos (sin auth)

| Método | Ruta | Descripción | Auth | Roles |
|--------|------|-------------|------|-------|
| `GET`  | `/public/eventos` | Listar eventos aprobados (landing pública) | No | — |

---

## inventory-service — `/api/stock`, `/api/entries`, `/api/exits`

### Stock

| Método | Ruta | Descripción | Auth | Roles |
|--------|------|-------------|------|-------|
| `GET` | `/stock` | Ver stock actual de todos los productos | Sí | ADMIN, ARTESANO |
| `GET` | `/stock/{productId}` | Ver stock de un producto específico | Sí | ADMIN, ARTESANO |

### Entradas y Salidas

| Método | Ruta | Descripción | Auth | Roles |
|--------|------|-------------|------|-------|
| `POST` | `/entries` | Registrar entrada de inventario | Sí | ADMIN, ARTESANO |
| `POST` | `/exits` | Registrar salida de inventario | Sí | ADMIN, ARTESANO |

---

## inventory-service — `/api/clientes`, `/api/ventas`

### Clientes internos

| Método | Ruta | Descripción | Auth | Roles |
|--------|------|-------------|------|-------|
| `GET`  | `/clientes` | Listar clientes internos | Sí | ADMIN |
| `GET`  | `/clientes/{id}` | Obtener cliente por ID | Sí | ADMIN |
| `POST` | `/clientes` | Crear cliente interno | Sí | ADMIN |
| `PUT`  | `/clientes/{id}` | Editar cliente interno | Sí | ADMIN |

### Ventas (backoffice)

| Método | Ruta | Descripción | Auth | Roles |
|--------|------|-------------|------|-------|
| `GET`    | `/ventas` | Listar todas las ventas | Sí | ADMIN |
| `GET`    | `/ventas/entregas` | Listar ventas con datos de entrega | Sí | ADMIN, DOMICILIARIO |
| `GET`    | `/ventas/{id}` | Obtener venta por ID | Sí | ADMIN, ARTESANO |
| `GET`    | `/ventas/cliente/{clienteId}` | Ventas de un cliente | Sí | ADMIN |
| `POST`   | `/ventas` | Crear venta directa | Sí | ADMIN, ARTESANO |
| `PUT`    | `/ventas/{id}/anular` | Anular una venta | Sí | ADMIN |
| `PATCH`  | `/ventas/{id}/aceptar-domicilio` | Domiciliario acepta el pedido | Sí | DOMICILIARIO |
| `PATCH`  | `/ventas/{id}/seguimiento` | Actualizar fase de entrega | Sí | DOMICILIARIO |

---

## inventory-service — `/api/cliente-ventas`, `/api/maestro-ventas`, `/api/stripe`

### Ventas del cliente (tienda pública)

| Método | Ruta | Descripción | Auth | Roles |
|--------|------|-------------|------|-------|
| `POST` | `/cliente-ventas` | Crear pedido desde el carrito | Sí | CLIENTE |
| `GET`  | `/cliente-ventas/mias` | Mis pedidos (cliente autenticado) | Sí | CLIENTE |
| `GET`  | `/cliente-ventas/{id}` | Detalle de un pedido propio | Sí | CLIENTE |
| `POST` | `/cliente-ventas/{id}/checkout-session` | Crear sesión de pago en Stripe | Sí | CLIENTE |

### Ventas del artesano

| Método | Ruta | Descripción | Auth | Roles |
|--------|------|-------------|------|-------|
| `GET` | `/maestro-ventas/mias` | Ventas asociadas al artesano autenticado | Sí | ARTESANO, ADMIN |

### Stripe

| Método | Ruta | Descripción | Auth | Roles |
|--------|------|-------------|------|-------|
| `POST` | `/stripe/webhook` | Webhook de Stripe para confirmar pagos | No (firma HMAC) | — |

---

## report-service — `/api/reports`

| Método | Ruta | Descripción | Auth | Roles |
|--------|------|-------------|------|-------|
| `GET` | `/reports/summary` | Resumen del stock actual por producto | Sí | ADMIN |
| `GET` | `/reports/history` | Historial de movimientos (entradas y salidas) | Sí | ADMIN |
| `GET` | `/reports/alerts` | Productos con stock por debajo del mínimo | Sí | ADMIN |

---

## Salud de servicios

| Ruta | Servicio | Descripción |
|------|----------|-------------|
| `GET http://localhost:8080/actuator/health` | api-gateway | Estado del gateway |
| `GET http://localhost:8081/actuator/health` | auth-service | Estado del auth |
| `GET http://localhost:8082/actuator/health` | catalog-service | Estado del catálogo |
| `GET http://localhost:8083/actuator/health` | inventory-service | Estado del inventario |
| `GET http://localhost:8084/actuator/health` | report-service | Estado de reportes |
| `GET http://localhost:8761` | discovery-server | Panel Eureka |

---

## Conteo de endpoints

| Servicio | Cantidad |
|----------|----------|
| auth-service | 14 |
| catalog-service (categorías) | 5 |
| catalog-service (artesanos) | 6 |
| catalog-service (productos) | 11 |
| catalog-service (comunidad) | 13 |
| inventory-service (stock) | 2 |
| inventory-service (entries/exits) | 2 |
| inventory-service (clientes) | 4 |
| inventory-service (ventas backoffice) | 8 |
| inventory-service (cliente-ventas) | 4 |
| inventory-service (maestro-ventas) | 1 |
| inventory-service (stripe) | 1 |
| report-service | 3 |
| **Total** | **74** |
