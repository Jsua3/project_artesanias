# Requisitos Funcionales — Almacén Artesanías / Rebecca

## Roles del sistema

| Rol | Descripción |
|-----|-------------|
| `ADMIN` | Acceso total. Administra usuarios, catálogo, inventario, ventas, comunidad y reportes. |
| `ARTESANO` | Gestiona sus productos, stock, ventas propias, comunidad y eventos. |
| `DOMICILIARIO` | Acepta y ejecuta entregas. Ve pedidos asignados y registra progreso. |
| `CLIENTE` | Compra en la tienda pública. Ve su carrito, pedidos y perfil. |

---

## Tabla de Requisitos Funcionales

| ID | Nombre | Descripción | Prioridad | Reglas de Negocio | Criterios de Aceptación | Usuario |
|----|--------|-------------|-----------|-------------------|-------------------------|---------|
| RF-01 | Registro de artesano / domiciliario | Cualquier persona puede registrarse como ARTESANO o DOMICILIARIO mediante usuario y contraseña. La cuenta queda en estado `PENDING` hasta ser aprobada por un ADMIN. | Alta | El sistema no permite que el registro público cree cuentas ADMIN. La contraseña se almacena como BCrypt. Los roles OPERATOR y MAESTRO se normalizan a ARTESANO. | El usuario recibe confirmación del registro. No puede iniciar sesión hasta ser aprobado. El JWT emitido tras aprobación contiene rol `ARTESANO` o `DOMICILIARIO`. | ARTESANO, DOMICILIARIO |
| RF-02 | Registro de cliente | Los clientes se registran con usuario y contraseña mediante el endpoint `/api/auth/register-cliente`. La cuenta se aprueba automáticamente con rol `CLIENTE`. | Alta | El username debe ser único. Si ya existe retorna HTTP 409. La contraseña se almacena como BCrypt. | El cliente puede iniciar sesión inmediatamente tras registrarse. Es redirigido a la landing pública `/`. | CLIENTE |
| RF-03 | Login con usuario y contraseña | El sistema autentica al usuario con username + password y emite un JWT de acceso y un refresh token. | Alta | Las credenciales inválidas retornan HTTP 401. El JWT contiene `sub` (userId), `role` y `exp`. El token de acceso expira en 1 hora. El refresh token permite renovar sin reautenticación. | Login exitoso retorna `accessToken`, `refreshToken`, `username`, `role`, `id`. El frontend redirige al área correcta según rol. | ADMIN, ARTESANO, DOMICILIARIO, CLIENTE |
| RF-04 | Login con Google OAuth | Los usuarios pueden autenticarse con su cuenta de Google. El sistema valida el ID token de Google y crea una cuenta CLIENTE automáticamente si no existe. | Alta | Se valida `aud == GOOGLE_CLIENT_ID` y `email_verified == true` contra `https://oauth2.googleapis.com/tokeninfo`. Los usuarios Google se crean siempre con rol CLIENTE y contraseña BCrypt aleatoria inutilizable. El botón solo aparece cuando `GOOGLE_CLIENT_ID` está configurado en el servidor. | El cliente ve el botón de Google en el login. Al autenticarse con Google recibe el mismo JWT que el login normal. | CLIENTE |
| RF-05 | Gestión de perfil | Los usuarios autenticados pueden consultar y actualizar su perfil: nombre, apellido, display name, avatar, teléfono, bio, localidad, tipo de artesanía y dirección. | Media | El perfil calcula un porcentaje de completitud (`profile_completion`). Cuando todos los campos clave están llenos, `profile_complete` se marca `true`. | El usuario puede ver y editar su perfil desde el backoffice. El porcentaje de completitud se actualiza en tiempo real. | ADMIN, ARTESANO, DOMICILIARIO, CLIENTE |
| RF-06 | Aprobación de artesanos y domiciliarios | El ADMIN revisa las solicitudes de registro pendientes y las aprueba o rechaza individualmente. | Alta | Solo el ADMIN puede aprobar o rechazar. Al aprobar se registra `approved_at` y `approved_by`. Los artesanos aprobados quedan vinculados a un registro en `catalog_db.artesanos`. | El ADMIN ve la lista de solicitudes pendientes. Puede aprobar o rechazar con un clic. El usuario aprobado puede iniciar sesión inmediatamente. | ADMIN |
| RF-07 | Gestión de usuarios (ADMIN) | El ADMIN puede listar todos los usuarios del sistema, ver sus roles y estados de aprobación. | Media | Solo accesible con rol ADMIN. | El ADMIN ve la tabla completa de usuarios con rol, estado y fecha de creación. | ADMIN |
| RF-08 | Gestión de categorías | El ADMIN puede crear, editar, eliminar y listar categorías de productos. Las categorías se pueden activar o desactivar. | Alta | El nombre de la categoría debe ser único. No se puede eliminar una categoría que tenga productos asociados. | El ADMIN gestiona categorías desde el backoffice. Los cambios se reflejan inmediatamente en el catálogo público. | ADMIN |
| RF-09 | Gestión de artesanos | El ADMIN puede crear, editar, eliminar y listar artesanos. Puede vincular un artesano de catálogo con una cuenta de usuario existente. | Alta | El campo `user_account_id` vincula el artesano del catálogo con la cuenta de auth. Un artesano puede existir en el catálogo sin cuenta de usuario. | El ADMIN ve la tabla de artesanos. Puede editar nombre, especialidad, ubicación, imagen y teléfono. Puede vincular con una cuenta. | ADMIN |
| RF-10 | Gestión de productos | El ADMIN y el ARTESANO pueden crear, editar, eliminar y activar/desactivar productos del catálogo. | Alta | El precio debe ser mayor o igual a cero. Un producto puede no tener categoría ni artesano. El campo `active` controla la visibilidad pública. Solo ADMIN ve productos inactivos. | Se pueden crear productos con nombre, descripción, precio, imagen, SKU, categoría y artesano. El toggle de activo/inactivo funciona desde la lista. | ADMIN, ARTESANO |
| RF-11 | Catálogo público | Cualquier visitante puede ver los productos activos, artesanos y categorías sin autenticación. | Alta | Solo se muestran productos con `active = true`. Los artesanos mostrados exponen solo: `id`, `nombre`, `especialidad`, `ubicacion`, `imageUrl`. | La landing carga productos reales desde el backend. Los artesanos destacados muestran sus campos correctos. Si no hay datos retorna un fallback visual. | CLIENTE (anónimo) |
| RF-12 | Control de stock | El sistema mantiene el stock actual de cada producto. El stock nunca puede ser negativo. | Alta | El stock se inicializa en 0 al primer movimiento. Una salida que supera el stock disponible es rechazada. Cada movimiento actualiza la tabla `stocks` de forma atómica. | Al consultar `/api/stock` se obtiene el stock actual por producto. El sistema rechaza salidas que dejarían stock negativo. | ADMIN, ARTESANO |
| RF-13 | Entrada de inventario | El ADMIN y el ARTESANO registran ingresos de productos al inventario con cantidad y notas. | Alta | La cantidad debe ser mayor que cero. Cada entrada publica un evento en Kafka (`inventory-events`). El `performed_by` registra el UUID del usuario que realizó el movimiento. | Al crear una entrada el stock del producto se incrementa. El reporte de historial refleja el movimiento. | ADMIN, ARTESANO |
| RF-14 | Salida de inventario | El ADMIN y el ARTESANO registran egresos de productos del inventario con cantidad y notas. | Alta | La cantidad debe ser mayor que cero y no puede superar el stock actual. Cada salida publica un evento en Kafka. | Al crear una salida el stock disminuye. Si no hay stock suficiente el sistema retorna error. | ADMIN, ARTESANO |
| RF-15 | Alertas de stock mínimo | El sistema detecta productos cuyo stock está por debajo del `stock_minimo` definido en el catálogo y genera alertas. | Media | La alerta se genera cuando `stocks.quantity < products.stock_minimo`. Las alertas se consultan desde el report-service. | El ADMIN ve la lista de productos con stock bajo en el panel de reportes. | ADMIN, ARTESANO |
| RF-16 | Carrito de compras | El cliente puede agregar, quitar y modificar cantidades de productos en su carrito antes de confirmar la compra. El carrito persiste localmente en el navegador. | Alta | El carrito vive en el frontend (localStorage). No requiere autenticación para agregar productos. La autenticación se exige al confirmar el checkout. | El cliente puede agregar productos desde la landing. El carrito muestra cantidad, subtotal y total. Los productos se pueden eliminar individualmente. | CLIENTE |
| RF-17 | Checkout y pago con Stripe | El cliente confirma su pedido, ingresa datos de envío y es redirigido a Stripe Checkout para pagar. | Alta | Requiere autenticación. Si `STRIPE_SECRET_KEY` no está configurado, el endpoint retorna 503. El webhook de Stripe (`/api/stripe/webhook`) confirma el pago y cambia el estado de la venta a `PAGADA`. `markAsPaid` muta la entidad existente, no crea una nueva, preservando todos los campos de delivery. | El cliente llena datos de envío (nombre, teléfono, dirección, ciudad). Se crea una venta en estado `PENDIENTE`. Si Stripe está activo se redirige al checkout de Stripe. | CLIENTE |
| RF-18 | Mis pedidos | El cliente autenticado puede ver el historial de sus pedidos con estado y detalle de cada uno. | Alta | Solo el propio cliente puede ver sus pedidos. El seguimiento muestra: confirmado, en preparación, listo para recoger, en camino, entregado. | El cliente ve lista de pedidos con estado. Al entrar al detalle ve los productos, total y progreso de entrega. | CLIENTE |
| RF-19 | Gestión de ventas | El ADMIN y el ARTESANO pueden ver, crear y gestionar ventas internas (ventas directas sin carrito de cliente). | Alta | Solo ADMIN o ARTESANO pueden crear ventas directas. Una venta requiere al menos un producto con cantidad y precio. El total se calcula automáticamente. | La lista de ventas muestra estado, cliente, total y fecha. Se puede crear una venta seleccionando productos, cliente y cantidades. | ADMIN, ARTESANO |
| RF-20 | Anulación de ventas | El ADMIN puede anular una venta existente. La anulación restaura el stock de los productos vendidos. | Alta | Una venta `ANULADA` no puede anularse de nuevo. Al anular se crea un movimiento de tipo `ANULACION` en el historial. | Al anular la venta su estado cambia a `ANULADA`. El stock de cada producto del detalle se incrementa. | ADMIN |
| RF-21 | Panel del domiciliario | El DOMICILIARIO tiene un panel dedicado que muestra los pedidos disponibles y los asignados a él. Post-login es redirigido directamente a `/domiciliario/panel`. | Alta | Solo usuarios con rol `DOMICILIARIO` acceden al panel. La redirección post-login es directa sin pasar por el dashboard general. | El domiciliario ve la lista de pedidos. Puede ver el detalle de cada uno con checklist de fases. | DOMICILIARIO |
| RF-22 | Seguimiento de entrega | El DOMICILIARIO actualiza el progreso de cada entrega marcando las fases: packed, picked_up, on_the_way, delivered. Puede agregar coordenadas GPS, notas y evidencia URL. | Alta | Cada fase registra su timestamp al marcarse. Una fase no puede revertirse. El `delivery_updated_by` registra el UUID del domiciliario. La evidencia es una URL de imagen o documento. | El domiciliario marca cada fase desde su panel. El cliente ve el progreso actualizado en `/mis-pedidos/:id`. | DOMICILIARIO |
| RF-23 | Aceptar pedido como domiciliario | El domiciliario acepta un pedido disponible, quedando asignado como responsable de la entrega. | Alta | Un pedido solo puede ser aceptado por un domiciliario a la vez. Al aceptar se registra `courier_accepted_at` y `courier_user_id`. | El domiciliario ve el botón de aceptar en pedidos disponibles. Después de aceptar el pedido aparece en su lista personal. | DOMICILIARIO |
| RF-24 | Datos de envío del cliente | Al confirmar el checkout el cliente ingresa nombre del destinatario, teléfono, dirección, ciudad y notas de envío. | Alta | Los campos `shipping_recipient_name`, `shipping_phone`, `shipping_address` y `shipping_city` son obligatorios para procesar el envío. | El formulario de checkout incluye la sección de datos de envío. Los datos quedan guardados en la venta y visibles para el domiciliario. | CLIENTE |
| RF-25 | Feed de publicaciones de comunidad | Los artesanos pueden publicar contenido en el feed de la comunidad: texto e imagen. Otros artesanos pueden dar like. | Media | Solo ARTESANO y ADMIN pueden publicar. Cualquier usuario autenticado puede dar like. Un usuario solo puede dar like una vez por publicación. El contenido pasa por filtro de censura básica en frontend. | El artesano ve el feed con publicaciones en orden cronológico. Puede crear una publicación nueva. El contador de likes se actualiza al dar like. | ARTESANO, ADMIN |
| RF-26 | Reporte y moderación de publicaciones | Los usuarios pueden reportar publicaciones inapropiadas. El ADMIN puede cambiar el estado de una publicación a ELIMINADO o ACTIVO. | Media | Los estados válidos son: `ACTIVO`, `REPORTADO`, `ELIMINADO`. El moderador ve las publicaciones reportadas en una vista separada. | El botón de reportar está disponible en cada publicación. El ADMIN ve el panel de moderación con publicaciones reportadas. | ADMIN, ARTESANO |
| RF-27 | Propuesta y aprobación de eventos | El ARTESANO puede proponer ferias o eventos. El ADMIN los revisa y aprueba o rechaza con comentario. La lista pública muestra solo los aprobados. | Media | Los estados válidos son: `PENDIENTE`, `APROBADO`, `RECHAZADO`. Al revisar se registra `reviewed_by` y `reviewed_at`. Solo ARTESANO y ADMIN pueden proponer eventos. | El artesano ve el formulario de creación de evento. El ADMIN ve la lista de pendientes. Los eventos aprobados aparecen en la landing pública. | ARTESANO, ADMIN |
| RF-28 | Reportes de inventario | El ADMIN puede consultar: resumen de stock actual, historial de movimientos y alertas de bajo stock. | Alta | Solo ADMIN accede a los reportes. El report-service consume eventos Kafka de inventory-service para mantener los datos actualizados. | El panel de reportes muestra resumen, historial y alertas. Los datos reflejan los últimos movimientos registrados. | ADMIN |
| RF-29 | Gestión de clientes internos | El ADMIN puede crear, editar y listar clientes del sistema (personas sin cuenta de usuario) para asociarlos a ventas directas. | Media | El cliente interno puede existir sin cuenta de usuario. El campo `user_account_id` vincula opcionalmente al cliente con una cuenta. | El ADMIN ve la tabla de clientes internos. Puede crear un cliente con nombre, teléfono, email y dirección. | ADMIN |
| RF-30 | Activar / Desactivar producto | El ADMIN y el ARTESANO pueden activar o desactivar un producto del catálogo sin eliminarlo. Un producto inactivo no es visible en la tienda pública. | Alta | `PATCH /api/products/{id}/active` alterna el estado. Solo usuarios con rol ADMIN o ARTESANO pueden ejecutarlo. | El producto desactivado desaparece de la landing. El producto reactivado vuelve a ser visible. La lista de admin muestra todos los productos con su estado. | ADMIN, ARTESANO |

---

## Historias de Usuario

### HU-01 — Registro como artesano
**Como** artesano colombiano,  
**quiero** registrarme en la plataforma con mi usuario y contraseña,  
**para** poder gestionar mis productos y vender mis artesanías una vez sea aprobado.

**Criterios de aceptación:**
- Puedo completar el formulario con username, contraseña y rol ARTESANO.
- Recibo confirmación de que mi solicitud está en revisión.
- No puedo iniciar sesión hasta ser aprobado por el administrador.
- Tras la aprobación inicio sesión y mi JWT contiene rol `ARTESANO`.

---

### HU-02 — Login con Google como cliente
**Como** cliente visitante,  
**quiero** iniciar sesión con mi cuenta de Google,  
**para** no tener que recordar otra contraseña y poder comprar de forma rápida.

**Criterios de aceptación:**
- Veo el botón de Google en la pantalla de login cuando el sistema lo tiene configurado.
- Al autenticarme con Google se crea mi cuenta automáticamente si no existe.
- Soy redirigido a la landing pública `/` tras el login.
- No tengo acceso al backoffice.

---

### HU-03 — Comprar una artesanía
**Como** cliente,  
**quiero** agregar artesanías al carrito y pagarlas en línea,  
**para** recibirlas en mi domicilio.

**Criterios de aceptación:**
- Puedo agregar productos al carrito sin estar logueado.
- Al ir al checkout el sistema me pide que inicie sesión si no lo he hecho.
- Lleno mis datos de envío (nombre, teléfono, dirección, ciudad).
- Soy redirigido a Stripe para pagar de forma segura.
- Tras el pago veo mi pedido en `/mis-pedidos` con estado `PAGADA`.

---

### HU-04 — Seguimiento de mi pedido
**Como** cliente,  
**quiero** ver el estado de mi pedido en tiempo real,  
**para** saber cuándo va a llegar mi artesanía.

**Criterios de aceptación:**
- En `/mis-pedidos/:id` veo una barra de progreso con las fases: Confirmado, En preparación, Listo para recoger, En camino, Entregado.
- Las fases se actualizan cuando el domiciliario registra avance.
- Veo las notas de entrega si el domiciliario las agrega.

---

### HU-05 — Gestionar mis productos como artesano
**Como** artesano aprobado,  
**quiero** crear y administrar mis productos en el catálogo,  
**para** que los clientes puedan verlos y comprarlos.

**Criterios de aceptación:**
- Puedo crear un producto con nombre, descripción, precio, imagen y categoría.
- Puedo activar o desactivar un producto sin eliminarlo.
- Mis productos activos aparecen en la landing pública.
- Puedo ver el stock actual de cada uno de mis productos.

---

### HU-06 — Registrar entrada de inventario
**Como** artesano o administrador,  
**quiero** registrar cuando llegan nuevas unidades de un producto,  
**para** que el stock se actualice correctamente.

**Criterios de aceptación:**
- Selecciono el producto y la cantidad a ingresar.
- El stock del producto aumenta inmediatamente.
- El movimiento aparece en el historial de reportes.
- No puedo registrar una entrada con cantidad 0 o negativa.

---

### HU-07 — Entregar un pedido como domiciliario
**Como** domiciliario,  
**quiero** ver los pedidos disponibles, aceptar uno y registrar el progreso de la entrega,  
**para** completar mi trabajo de forma organizada.

**Criterios de aceptación:**
- Al iniciar sesión soy llevado directamente a mi panel sin pasar por el dashboard general.
- Veo los pedidos disponibles para aceptar.
- Al aceptar un pedido queda asignado a mí.
- Puedo marcar cada fase: packed, picked_up, on_the_way, delivered.
- Puedo agregar notas de entrega y coordenadas GPS.

---

### HU-08 — Aprobar artesanos como administrador
**Como** administrador,  
**quiero** revisar y aprobar las solicitudes de registro de artesanos,  
**para** controlar quién puede vender en la plataforma.

**Criterios de aceptación:**
- Veo la lista de solicitudes pendientes en `/admin/artisan-requests`.
- Puedo aprobar o rechazar cada solicitud individualmente.
- Al aprobar, el artesano queda habilitado para iniciar sesión.
- El sistema vincula automáticamente la cuenta aprobada con su registro en el catálogo.

---

### HU-09 — Publicar en la comunidad artesana
**Como** artesano,  
**quiero** publicar contenido en el feed de la comunidad,  
**para** compartir mi trabajo y conectar con otros artesanos.

**Criterios de aceptación:**
- Puedo escribir texto y adjuntar una imagen a mi publicación.
- Mi publicación aparece en el feed de todos los artesanos.
- Otros artesanos pueden darle like a mi publicación.
- Si alguien reporta mi publicación, el administrador la revisará.

---

### HU-10 — Proponer una feria como artesano
**Como** artesano,  
**quiero** proponer una feria o evento,  
**para** que sea publicado en la landing y más clientes conozcan mi trabajo.

**Criterios de aceptación:**
- Lleno el formulario con nombre del evento, organización, localidad, fechas y descripción.
- Mi propuesta queda en estado `PENDIENTE` hasta que el administrador la revise.
- Si es aprobada, aparece en la sección de eventos de la landing pública.
- Recibo retroalimentación si es rechazada.

---

### HU-11 — Ver reportes de inventario como administrador
**Como** administrador,  
**quiero** consultar el estado del inventario y los movimientos recientes,  
**para** tomar decisiones de reabastecimiento a tiempo.

**Criterios de aceptación:**
- Puedo ver el stock actual de todos los productos en una sola vista.
- Puedo ver el historial completo de entradas y salidas.
- Veo alertas de los productos cuyo stock está por debajo del mínimo.
- Los datos están actualizados con los últimos movimientos registrados.

---

### HU-12 — Moderar contenido de la comunidad
**Como** administrador,  
**quiero** revisar y gestionar las publicaciones reportadas,  
**para** mantener un ambiente profesional en la comunidad artesana.

**Criterios de aceptación:**
- Veo en `/admin/moderacion` solo las publicaciones con estado `REPORTADO`.
- Puedo cambiar el estado a `ELIMINADO` o restaurarlo a `ACTIVO`.
- Las publicaciones eliminadas no aparecen en el feed público.
