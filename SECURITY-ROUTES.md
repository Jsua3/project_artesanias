# Matriz de rutas y datos publicos

Este documento define que puede responder sin sesion y que debe pasar por `JwtAuth`.

## Publico sin login

Estas rutas existen para la vitrina publica y no deben exponer datos internos.

| Ruta | Metodo | Datos permitidos |
| --- | --- | --- |
| `/api/auth/login` | POST | Tokens y perfil minimo del usuario autenticado |
| `/api/auth/register` | POST | Registro de usuario |
| `/api/auth/register-cliente` | POST | Registro de cliente |
| `/api/auth/refresh` | POST | Renovacion de token |
| `/api/auth/google` | POST | Login con Google |
| `/api/auth/config` | GET | Configuracion publica, como Google client ID |
| `/api/public/eventos` | GET | Eventos publicos aprobados |
| `/api/categories/**` | GET | Categorias visibles |
| `/api/products/**` | GET | Producto publico: `id`, `name`, `description`, `price`, `imageUrl`, `categoryId`, `categoryIds`, `artesanoId` |
| `/api/artesanos/**` | GET | Artesano publico: `id`, `nombre`, `especialidad`, `ubicacion`, `imageUrl` |
| `/api/ai/design/message` | POST | Genera ficha artesanal y parametros 3D sin guardar datos privados |
| `/api/ai/design/preview` | POST | Genera/describe boceto visual desde la ficha enviada |
| `/api/stripe/**` | POST | Webhook Stripe; la autenticidad depende de la firma del webhook |

## Privado con login

Estas rutas deben exigir JWT. Las rutas proxy usan el filtro `JwtAuth`; las rutas atendidas directamente por `api-gateway`, como `/api/admin/system-health`, validan el bearer token en su controller.

| Ruta | Motivo |
| --- | --- |
| `/api/auth/me/**` | Perfil de usuario autenticado |
| `/api/auth/users` | Usuarios del sistema |
| `/api/auth/profile` | Perfil editable |
| `/api/auth/artisan-requests/**` | Solicitudes de artesanos |
| `/api/auth/approval-requests/**` | Aprobaciones |
| `/api/admin/db/**` | Datos administrativos y busquedas internas |
| `/api/admin/system-health` | Salud del sistema, integraciones y checklist de release; solo ADMIN |
| `/api/products/admin/**` | Inventario/catalogo interno de productos |
| `/api/artesanos/admin/**` | Contacto y vinculacion interna de artesanos |
| `/api/comunidad/**` | Comunidad autenticada |
| `/api/stock/**` | Inventario |
| `/api/entries/**` | Entradas de inventario |
| `/api/exits/**` | Salidas de inventario |
| `/api/clientes/**` | Datos de clientes |
| `/api/ventas/**` | Ventas |
| `/api/cliente-ventas/**` | Pedidos del cliente autenticado |
| `/api/maestro-ventas/**` | Ventas del maestro autenticado |
| `/api/reports/**` | Reportes |
| `/api/ai/**` | Confirmacion de producto personalizado, solicitudes propias, notificaciones y revision de taller/admin; requiere usuario autenticado y rol permitido. Excepcion publica: `POST /api/ai/design/message` y `POST /api/ai/design/preview` |

## Campos que no deben salir en catalogo publico

Productos publicos no deben incluir `sku`, `stockMinimo`, `active`, `createdAt` ni `updatedAt`.

Artesanos publicos no deben incluir `telefono`, `email`, `userAccountId`, `active` ni `createdAt`.

Las pruebas `RouteSecurityContractTest` y `PublicCatalogResponseTest` cubren estas reglas para evitar regresiones.

## Productos personalizados por IA

Los modelos creados en `/disena-tu-pieza` no se publican automaticamente en el catalogo publico. Cuando el cliente confirma el diseno, `ai-service` crea una solicitud privada en `custom_design_requests` con estado `PENDING_QUOTE`, precio estimado y desglose. El taller/admin debe validar fabricacion, materiales y entrega antes de convertirlo en producto vendible o pedido definitivo.

Rutas funcionales del flujo:

- Cliente: `/disena-tu-pieza` crea la ficha y `/mis-disenos` lista sus solicitudes.
- Taller/admin: `/disenos-personalizados` revisa solicitudes, deja notas y actualiza estado.
- API publica de exploracion: `POST /api/ai/design/message`, `POST /api/ai/design/preview`.
- API privada: `POST /api/ai/design/confirm`, `GET /api/ai/design/mine`, `GET /api/ai/design/review`, `PATCH /api/ai/design/{id}/status`.
