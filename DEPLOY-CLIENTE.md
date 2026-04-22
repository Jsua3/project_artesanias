# Despliegue — Fase 1: Tienda pública + rol CLIENTE

Esta fase agrega:

- Landing pública (`/`) renderizada con el diseño del kit `ui_kits/cliente` (encapsulado bajo la clase `.public-landing`, sin chocar con el tema Rebecca del backoffice).
- Rol **CLIENTE** en `auth-service` + endpoint público `/api/auth/register-cliente` (protegido contra Mass Assignment: nunca acepta el campo `role`).
- Login inteligente: si el rol es CLIENTE → redirige a `/`; si es ADMIN/OPERATOR → redirige a `/admin/dashboard`.
- Guard `notClienteGuard`: impide que un CLIENTE acceda al backoffice y lo regresa a la tienda.
- Página `/registro-cliente` que, tras registrar, hace auto-login y navega a `next` o `/`.

Quedan FUERA de esta fase (Fase 2): carrito / Stripe, wishlist, ratings y favoritos de artesanos.

---

## 1. Cambios por servicio

### 1.1 auth-service

Archivos tocados:

- `model/UserRole.java` → se añadió `CLIENTE` al enum.
- `dto/RegisterClienteRequest.java` → nuevo record (sólo `username`, `password`, `displayName`).
- `service/AuthService.java` → método `registerCliente()` que fuerza `UserRole.CLIENTE`.
- `controller/AuthController.java` → `POST /api/auth/register-cliente`.
- `config/WebSecurityConfig.java` → `/api/auth/register-cliente` en `permitAll`.

### 1.2 api-gateway

- `application.yml` → ruta `auth-service-public` incluye `/api/auth/register-cliente` (sin filtro `JwtAuth`).

### 1.3 frontend

- `features/public/public-landing/` → landing pública (port 1:1 del kit de diseño, `ViewEncapsulation.None` + wrapper `.public-landing`).
- `features/auth/register-cliente/` → formulario de registro + auto-login.
- `core/guards/not-cliente.guard.ts` → nuevo guard.
- `core/services/auth.service.ts` → `registerCliente()`, `isCliente()`.
- `core/models/auth.model.ts` → `RegisterClienteRequest`.
- `app.routes.ts` → `/` = PublicLanding, `/registro-cliente`, `/admin/*` protegido por `authGuard + notClienteGuard`.
- `shared/layout/shell/shell.component.html` → todos los `routerLink` del sidenav ahora apuntan a `/admin/*` y se añadió la sección “Sitio” con un link a `/`.
- `core/guards/admin.guard.ts` → redirige a `/admin/dashboard` en lugar del viejo `/dashboard`.

---

## 2. Migración de base de datos

**No se requiere cambio de esquema.** El campo `role` de `user_accounts` es `VARCHAR(50)` sin `CHECK` constraint, así que insertar filas con `role = 'CLIENTE'` funciona sin DDL.

Si deseas validar a nivel de DB (opcional), puedes añadir:

```sql
ALTER TABLE user_accounts
  ADD CONSTRAINT user_accounts_role_chk
  CHECK (role IN ('ADMIN', 'OPERATOR', 'CLIENTE'));
```

Nota: **no ejecutes** este `ALTER` si ya existen filas con roles distintos; primero revisa `SELECT DISTINCT role FROM user_accounts;`.

---

## 3. Despliegue en EC2 t3.micro (4 GB swap)

Respetando la restricción OOM: construir y reiniciar sólo los servicios modificados.

### 3.1 Pull del código

```bash
ssh ec2-user@56.126.102.113
cd /home/ec2-user/almacen-arle
git pull
```

### 3.2 Rebuild selectivo del backend (sólo lo que cambió)

```bash
# Construye sólo auth-service y api-gateway con Maven
./mvnw -pl auth-service,api-gateway -am clean package -DskipTests

# Rebuild imágenes Docker individualmente (no todo el stack)
docker compose build auth-service api-gateway

# Reinicio controlado: primero auth-service, luego api-gateway
docker compose up -d auth-service
docker compose logs -f auth-service   # Ctrl-C cuando veas "Started"
docker compose up -d api-gateway
docker compose logs -f api-gateway
```

### 3.3 Rebuild del frontend

El frontend se sirve como estáticos. Construye localmente (o en EC2 si hay espacio) y copia el `dist/` al servidor:

```bash
# En tu máquina
cd frontend
npm ci
npm run build -- --configuration production
# Copia el output
scp -r dist/* ec2-user@56.126.102.113:/home/ec2-user/almacen-arle/frontend/dist/
```

Si el `nginx` lo sirve desde un volumen Docker, basta con `docker compose restart nginx` (o el nombre del servicio estático).

### 3.4 Verificación rápida

```bash
# Health
curl -s http://56.126.102.113/api/auth/login -X OPTIONS -o /dev/null -w "%{http_code}\n"

# Registro de cliente (debe devolver 200/201 con UserProfile)
curl -s -X POST http://56.126.102.113/api/auth/register-cliente \
  -H "Content-Type: application/json" \
  -d '{"username":"sua_test","password":"secreto123","displayName":"Sua Test"}'

# Login del cliente recién creado
curl -s -X POST http://56.126.102.113/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"sua_test","password":"secreto123"}'
# La respuesta debe incluir "role":"CLIENTE"

# Mass Assignment defense: este request NO debe crear un ADMIN
curl -s -X POST http://56.126.102.113/api/auth/register-cliente \
  -H "Content-Type: application/json" \
  -d '{"username":"intento_admin","password":"x","displayName":"X","role":"ADMIN"}'
# Inspecciona DB: SELECT role FROM user_accounts WHERE username='intento_admin';
# Debe ser 'CLIENTE'.
```

---

## 4. Pruebas manuales end-to-end

1. Entra a `http://56.126.102.113/` sin login → deberías ver la landing pública.
2. Haz click en “Registrarse” → formulario `/registro-cliente`. Crea una cuenta.
3. Después del registro se hace auto-login y vuelves a `/`.
4. Abre el menú del header (chip con tu inicial) — NO debe haber link al panel admin.
5. Cierra sesión. Entra con un usuario ADMIN existente → debe llevarte a `/admin/dashboard`.
6. Estando logueado como CLIENTE, intenta navegar manualmente a `/admin/dashboard` → `notClienteGuard` te regresa a `/`.
7. Estando logueado como CLIENTE, recarga `/` → el header muestra el chip y “Salir”.

---

## 5. Roll-back rápido

Si algo falla en prod:

```bash
# Detén sólo los servicios modificados
docker compose stop auth-service api-gateway

# Checkout al commit anterior
git log --oneline -5
git checkout <sha-anterior>

# Rebuild + up
./mvnw -pl auth-service,api-gateway -am clean package -DskipTests
docker compose build auth-service api-gateway
docker compose up -d auth-service api-gateway
```

El esquema de DB no cambia en esta fase, así que no hay rollback de migración que ejecutar.

---

## 6. Notas sobre performance / memoria

- El bundle de la landing pública es una lazy-route (`loadComponent`), así que no aumenta el tamaño inicial de `main.js` del backoffice.
- Todos los tokens del kit de diseño (`--clay`, `--ink`, fuentes Fraunces/IBM Plex) están scoped bajo `.public-landing`, no contaminan el tema Material del backoffice.
- No se añadieron endpoints nuevos al catálogo (la landing usa mock data), así que no hay presión adicional sobre `catalog-service` ni R2DBC pool.
- En EC2 t3.micro: mantén el orden de arranque `postgres → kafka → discovery → auth → catalog → inventory → gateway` para evitar picos de RAM simultáneos.

---
---

# Fase 2a — Carrito + Checkout PENDIENTE

Esta sub-fase agrega el flujo de compra end-to-end **sin pago**:

- Catálogo publico real: la landing ahora consume `GET /api/products|categories|artesanos` sin JWT (solo `GET`; `POST/PUT/DELETE` siguen con JwtAuth).
- `CartService` en el frontend (signals + localStorage) y `CatalogService` con `shareReplay`.
- Página `/carrito` y `/checkout` con confirmación que crea una `Venta` con estado `PENDIENTE`.
- Página `/mis-pedidos` (lista) y `/mis-pedidos/:id` (detalle) para el CLIENTE.
- Nuevos estados de venta: `PENDIENTE`, `PAGADA` (para 2b), `COMPLETADA`, `ANULADA`.
- Campo `clientes.user_account_id` que liga el registro comercial con la cuenta de auth.

Queda FUERA de 2a y llega en 2b: Stripe Checkout hosted page + webhook que mueve a `PAGADA`.

---

## A. Cambios por servicio (2a)

### A.1 inventory-service

Archivos tocados:

- `db/schema.sql`
  - Añade `user_account_id UUID UNIQUE` a `clientes` (idempotente, bloque `DO $$`).
  - Expande `chk_venta_estado` para aceptar `PENDIENTE`, `PAGADA`, `COMPLETADA`, `ANULADA`.
- `model/Cliente.java` → nuevo campo `userAccountId` + constructor de 7 args. El de 6 args queda como delegate (pasa `null`) para no romper llamadas antiguas.
- `repository/ClienteRepository.java` → `findByUserAccountId(UUID)`.
- `service/ClienteService.java` → `updateCliente` ahora preserva `existing.userAccountId()` (antes lo hubiera puesto a NULL con el constructor viejo).
- `dto/ClienteVentaRequest.java` → nuevo record `{ items, displayName? }` (nunca lleva precios ni clienteId).
- `service/VentaService.java` → 4 métodos nuevos:
  - `createClienteVenta(userId, req)`: busca/crea el Cliente ligado al userId, trae precio real del catálogo vía `WebClient`, valida qty>0, price>0, items no vacíos, y persiste la Venta en `PENDIENTE`.
  - `resolveClienteForUser(userId, displayName)`: get-or-create del Cliente por `user_account_id`.
  - `getVentasByUserAccountId(userId)` y `isVentaOwnedBy(ventaId, userId)`.
- `controller/ClienteVentaController.java` → nuevo: `POST /api/cliente-ventas` (role=CLIENTE), `GET /mias`, `GET /{id}` (ownership).

Precio **nunca** se toma del cliente: el backend lo resuelve desde `catalog-service` por `productId`. Si el catálogo no tiene el producto o su precio es 0 ⇒ `IllegalStateException` → 409 CONFLICT.

### A.2 api-gateway

- `application.yml` → la ruta de catálogo se separa en dos:
  - `catalog-service-public` con `Method=GET` (sin JwtAuth).
  - `catalog-service-private` con todos los métodos (JwtAuth).
- Se añade `/api/cliente-ventas, /api/cliente-ventas/**` al route de inventory-service.

El orden de declaración importa: la ruta GET pública debe ir **antes** de la privada, Spring Cloud Gateway matchea por orden.

### A.3 frontend (Angular 21)

Nuevo:

- `core/models/catalog.model.ts` (Product, Category, Artesano, Stock).
- `core/models/venta.model.ts` → añade `VentaEstado`, `ClienteVentaRequest`.
- `core/services/catalog.service.ts` con `shareReplay({ bufferSize: 1, refCount: false })`.
- `core/services/cart.service.ts` — signal-based, persistido en `localStorage` bajo key `cart_v1`.
- `core/services/cliente-venta.service.ts` — POST/GET contra `/api/cliente-ventas`.
- `features/public/cart-page/` — `/carrito`.
- `features/public/checkout/` — `/checkout`. Si no hay sesión CLIENTE, ofrece crear cuenta antes de confirmar. Si la hay, hace `POST /api/cliente-ventas` y redirige a `/mis-pedidos/:id`.
- `features/public/mis-pedidos/` — lista + detalle.

Editado:

- `features/public/public-landing/public-landing.component.ts` → `loadCatalog()` con `forkJoin + catchError`: si API responde vacío o falla, **conserva los mocks** (UX de Fase 1 intacta en dev local). Mocks se prefijan con `mock-` y se bloquean en `onAddToCart`.
- `app.routes.ts` → rutas `/carrito`, `/checkout`, `/mis-pedidos`, `/mis-pedidos/:id` (las dos últimas con `authGuard`).

---

## B. Migración SQL manual

En producción (Postgres de inventory) ejecutar **una vez**, tras desplegar 2a:

```sql
-- 1. user_account_id en clientes (idempotente)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clientes' AND column_name = 'user_account_id'
  ) THEN
    ALTER TABLE clientes ADD COLUMN user_account_id UUID;
    CREATE UNIQUE INDEX ux_clientes_user_account_id
      ON clientes(user_account_id) WHERE user_account_id IS NOT NULL;
  END IF;
END
$$;

-- 2. Ampliar chk_venta_estado
ALTER TABLE ventas DROP CONSTRAINT IF EXISTS chk_venta_estado;
ALTER TABLE ventas ADD CONSTRAINT chk_venta_estado
  CHECK (estado IN ('PENDIENTE', 'PAGADA', 'COMPLETADA', 'ANULADA'));
```

Si `schema.sql` se ejecuta al arrancar (`schema-init.mode=always`), el bloque ya lo gestiona solo.

---

## C. Smoke tests (2a)

**1. GET publico de catálogo (sin JWT) — debe funcionar:**

```bash
curl -s http://56.126.102.113/api/products | jq '.[0:2]'
curl -s http://56.126.102.113/api/categories | jq length
```

**2. POST a catálogo sin JWT — debe dar 401:**

```bash
curl -i -X POST http://56.126.102.113/api/products -H 'Content-Type: application/json' -d '{}'
# → 401 Unauthorized
```

**3. Flujo completo CLIENTE:**

```bash
# Registro
curl -s -X POST http://56.126.102.113/api/auth/register-cliente \
  -H 'Content-Type: application/json' \
  -d '{"username":"pepa","password":"pepa12345","displayName":"Pepa"}'

# Login
TOKEN=$(curl -s -X POST http://56.126.102.113/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"username":"pepa","password":"pepa12345"}' | jq -r .accessToken)

# Obtener un productId real
PID=$(curl -s http://56.126.102.113/api/products | jq -r '.[0].id')

# Crear venta PENDIENTE
curl -i -X POST http://56.126.102.113/api/cliente-ventas \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d "{\"items\":[{\"productId\":\"$PID\",\"cantidad\":1}]}"
# → 201 Created, estado=PENDIENTE

# Historial
curl -s http://56.126.102.113/api/cliente-ventas/mias \
  -H "Authorization: Bearer $TOKEN" | jq
```

**4. Intento de alterar precio desde el cliente — debe ignorarse:**

El request no lleva precio (no hay campo para ello en `ClienteVentaRequest`). Aunque un atacante mandara `price`, el backend lo ignoraría: `VentaService.createClienteVenta` lee desde `catalogWebClient.get(products/{id})` y usa SIEMPRE ese valor.

**5. Intento de ver una venta de otro cliente — debe dar 403:**

```bash
# TOKEN es de pepa, VID es una venta de juan
curl -i http://56.126.102.113/api/cliente-ventas/$VID \
  -H "Authorization: Bearer $TOKEN"
# → 403 Forbidden
```

---

## D. Rollback (2a)

Si algo explota:

```bash
# Frontend: rebuild + redeploy de la versión anterior
# Backend: revert de inventory-service + api-gateway al commit de Fase 1
git revert <sha-2a>
./mvnw -pl inventory-service,api-gateway -am clean package -DskipTests
docker compose build inventory-service api-gateway
docker compose up -d inventory-service api-gateway
```

Rollback de DB (solo si hace falta — borra datos de pedidos PENDIENTE/PAGADA):

```sql
-- Revertir el check (deja solo los estados legacy)
ALTER TABLE ventas DROP CONSTRAINT IF EXISTS chk_venta_estado;
ALTER TABLE ventas ADD CONSTRAINT chk_venta_estado
  CHECK (estado IN ('COMPLETADA', 'ANULADA'));

-- Quitar la columna (irreversible si ya hay clientes self-service ligados)
ALTER TABLE clientes DROP COLUMN IF EXISTS user_account_id;
```

---

## E. Notas de diseño (2a)

- El `vendedorId` de una venta-marketplace es el mismo `userAccountId` del CLIENTE. Mantiene el FK NOT NULL vivo hasta que en 2b/2c introduzcamos un concepto de "vendedor/maestro asignado".
- Estado PENDIENTE **no** descuenta stock. El descuento se hará al pasar a PAGADA (en 2b, vía Stripe webhook + ExitService). Esto evita reservas fantasma si el pago nunca llega.
- `Cliente.user_account_id` es nullable a propósito: los clientes B2B históricos (creados desde el backoffice) no tienen cuenta de auth. Los self-service sí.
- El carrito vive 100% en el cliente (`localStorage`). El backend no lo conoce hasta el checkout. Esto simplifica el backend y permite que el carrito sobreviva a un login.

---

# Fase 2b — Pago con Stripe Checkout

Completa el flujo CLIENTE: el carrito crea una venta PENDIENTE, el usuario
paga en la página hosted de Stripe, y cuando Stripe nos dispara el webhook
`checkout.session.completed` la venta pasa a **PAGADA** y se descuenta stock
automáticamente vía `ExitService` (mismo camino que una venta admin).

## A. Qué cambió

### Backend (inventory-service)

- Nueva dependencia `stripe-java:29.0.0` en `inventory-service/pom.xml`.
- `config/StripeProperties.java` — prefix `stripe.*`, carga `secretKey`,
  `webhookSecret`, `successUrl`, `cancelUrl`, `currency`. Marca `cop/jpy/krw/clp`
  como *zero-decimal*.
- `config/StripeConfig.java` — `@PostConstruct` que setea `Stripe.apiKey` una
  sola vez al arrancar (si hay key configurada; si no, degradamos a 503).
- `service/StripeService.java`:
  - `createCheckoutSession(venta)` — Checkout Session mode=`PAYMENT`, line items
    construidos server-side desde `VentaDetalle` (nunca desde el cliente),
    guarda `session.id` en `ventas.stripe_session_id` y devuelve `(sessionId, url)`.
  - `parseAndVerifyWebhook(payload, signature)` — valida la firma HMAC usando
    `STRIPE_WEBHOOK_SECRET`.
  - `toStripeAmount(...)` — para COP usa la cantidad entera, no multiplica por 100.
- `service/VentaService.markAsPaid(ventaId)` — idempotente: si la venta ya está
  `PAGADA`/`COMPLETADA` no hace nada; si está `PENDIENTE` la mueve a `PAGADA`
  y llama a `exitService.createExit(...)` por cada detalle (descuenta stock y
  publica el evento Kafka existente).
- `service/VentaService.findByStripeSessionId(...)` — fallback para el webhook.
- `controller/ClienteVentaController.POST /{id}/checkout-session` — protegido
  con ownership; devuelve `{sessionId, url}` (503 si Stripe no configurado,
  409 si la venta ya no es PENDIENTE, 502 si Stripe rechaza).
- `controller/StripeWebhookController.POST /api/stripe/webhook` — **público**
  (no lleva JwtAuth). Verifica firma, procesa solo `checkout.session.completed`
  con `payment_status=paid`, extrae `ventaId` de `metadata` → `clientReferenceId`
  → fallback `findByStripeSessionId`, y llama a `markAsPaid`.
- `model/Venta.java` — nuevo campo `@Column("stripe_session_id")`.
- `repository/VentaRepository.findByStripeSessionId(String)`.

### Backend (api-gateway)

- Nueva ruta pública `inventory-service-stripe-webhook` para `POST /api/stripe/**`:
  no lleva `JwtAuth`, pero sí inyecta `X-Internal-Token` con
  `AddRequestHeader=X-Internal-Token, ${security.jwt.internal-token}` para que
  pase el `InternalGatewayFilter` de inventory-service. La autenticidad del
  request la da la firma HMAC del body, no el JWT.

### Frontend

- `core/services/cliente-venta.service.ts`:
  - Nueva interfaz `CheckoutSessionResponse { sessionId, url }`.
  - Nuevo método `createCheckoutSession(ventaId)`.
- `features/public/checkout/checkout.component.ts`:
  - Después de crear la venta PENDIENTE llama `createCheckoutSession` y hace
    `window.location.href = url` (redirect a Stripe hosted).
  - Lee `?canceled=1` al volver del cancel URL y muestra banner "cancelaste el pago".
  - Manejo de 503/502/409 con mensaje específico.
- `features/public/mis-pedidos/mis-pedido-detail.component.ts`:
  - Lee `?paid=1` al volver del success URL y muestra banner "¡Pago recibido!".
  - Si la venta todavía está PENDIENTE (webhook en vuelo) repollea cada
    1.5–6 s hasta 5 veces mostrando "Confirmando tu pago…".
  - Si una venta propia está PENDIENTE sin venir de `?paid=1` ofrece botón
    **Pagar ahora** (reabre una Checkout Session con la misma venta).

### DB

- Migración idempotente en `inventory-service/src/main/resources/db/schema.sql`:

  ```sql
  IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
       WHERE table_name = 'ventas' AND column_name = 'stripe_session_id'
  ) THEN
      ALTER TABLE ventas ADD COLUMN stripe_session_id VARCHAR(200);
      CREATE INDEX IF NOT EXISTS ix_ventas_stripe_session_id
          ON ventas(stripe_session_id) WHERE stripe_session_id IS NOT NULL;
  END IF;
  ```

## B. Variables de entorno (.env / docker-compose)

```env
# Stripe (inventory-service)
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxxxxx
STRIPE_SUCCESS_URL=https://56.126.102.113/mis-pedidos/{ventaId}?paid=1
STRIPE_CANCEL_URL=https://56.126.102.113/checkout?canceled=1
STRIPE_CURRENCY=cop
```

El bloque `stripe:` en `inventory-service/src/main/resources/application.yml`
ya lee estas variables y tiene defaults razonables para localhost.

Si `STRIPE_SECRET_KEY` está vacía el servicio arranca igual pero los endpoints
de checkout responden **503 Service Unavailable** — el frontend ya lo maneja.

## C. Webhook: registrar en Stripe

1. Stripe Dashboard → Developers → Webhooks → *Add endpoint*.
2. URL: `https://56.126.102.113/api/stripe/webhook` (el gateway la enruta
   al inventory-service).
3. Eventos: **solo** `checkout.session.completed`.
4. Copia el `Signing secret` (empieza por `whsec_...`) y pégalo como
   `STRIPE_WEBHOOK_SECRET`.

### Localhost (Stripe CLI)

```bash
stripe listen --forward-to http://localhost:8080/api/stripe/webhook
# imprime un whsec_... que usas como STRIPE_WEBHOOK_SECRET en dev

# En otra terminal, dispara el evento:
stripe trigger checkout.session.completed
```

## D. Smoke tests (prod)

### 1. Checkout feliz

```bash
TOKEN=$(curl -s -X POST http://56.126.102.113/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"cliente@ejemplo.com","password":"secret1234"}' \
  | jq -r .token)

# Crear venta PENDIENTE
VID=$(curl -s -X POST http://56.126.102.113/api/cliente-ventas \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"items":[{"productId":"<uuid>","cantidad":1}]}' \
  | jq -r .id)
echo "Venta: $VID"

# Crear Checkout Session
curl -s -X POST http://56.126.102.113/api/cliente-ventas/$VID/checkout-session \
  -H "Authorization: Bearer $TOKEN" | jq .
# → { "sessionId": "cs_test_...", "url": "https://checkout.stripe.com/..." }
```

Abre la `url` en un navegador y paga con la tarjeta de prueba `4242 4242 4242 4242`.
Stripe te manda a `STRIPE_SUCCESS_URL` → `/mis-pedidos/{ventaId}?paid=1`.

### 2. Verificar que la venta quedó PAGADA y bajó stock

```bash
curl -s http://56.126.102.113/api/cliente-ventas/$VID \
  -H "Authorization: Bearer $TOKEN" | jq '.estado'
# → "PAGADA"

# El exit-event ya pasó por Kafka → consultar stock del producto
curl -s http://56.126.102.113/api/stock/<productId> \
  -H "Authorization: Bearer $TOKEN" | jq '.cantidad'
# → debe estar 1 menos que antes
```

### 3. Webhook idempotente

Si Stripe reintenta el mismo `checkout.session.completed`, la segunda llamada
entra a `markAsPaid`, ve que la venta ya está PAGADA, y devuelve 200 sin
volver a crear un `Exit` (no se dobla la bajada de stock).

### 4. Cancelación

En la hosted page pulsa "Cancelar" → Stripe te devuelve a
`STRIPE_CANCEL_URL` → `/checkout?canceled=1`. La venta queda PENDIENTE y
el cliente puede reintentar desde `/mis-pedidos/:id` con el botón *Pagar ahora*.

### 5. Firma inválida

```bash
curl -i -X POST http://56.126.102.113/api/stripe/webhook \
  -H 'Stripe-Signature: t=123,v1=deadbeef' \
  -H 'Content-Type: application/json' \
  -d '{"type":"checkout.session.completed","data":{"object":{}}}'
# → 400 Bad Request, "Invalid signature"
```

## E. Rollback (2b)

```bash
git revert <sha-2b>
./mvnw -pl inventory-service,api-gateway -am clean package -DskipTests
docker compose build inventory-service api-gateway
docker compose up -d inventory-service api-gateway
```

La columna `stripe_session_id` se puede dejar (no molesta a ningún código
legacy). Si se quiere borrar:

```sql
DROP INDEX IF EXISTS ix_ventas_stripe_session_id;
ALTER TABLE ventas DROP COLUMN IF EXISTS stripe_session_id;
```

En Stripe: desactivar el webhook en Dashboard → Developers → Webhooks → …

## F. Notas de diseño (2b)

- **Precio server-side siempre**. La Checkout Session se construye desde los
  `VentaDetalle` persistidos, nunca desde parámetros del cliente. Esto blinda
  contra precios manipulados desde el frontend.
- **`markAsPaid` es idempotente** por diseño: comprueba el estado antes de
  transicionar y antes de disparar el descuento de stock. Stripe reintenta
  webhooks; no queremos bajar stock dos veces.
- **Redundancia en la resolución del `ventaId`** dentro del webhook: se prueba
  `metadata.ventaId` → `client_reference_id` → `ventas.stripe_session_id`.
  Con solo uno de los tres bastaría, pero en producción hay bugs raros
  (metadata truncada, clientReferenceId filtrado por algún reverse proxy, etc)
  y este orden cubre todos los escenarios.
- **Zero-decimal COP**. Stripe espera `unit_amount` en la unidad más pequeña.
  Para EUR/USD son centavos; para COP son pesos enteros. El helper
  `toStripeAmount` mira `StripeProperties.isZeroDecimalCurrency()`.
- **El body del webhook no se toca** en el gateway (`AddRequestHeader` no
  toca el body). Romper un solo byte invalida la firma y Stripe reintenta.
- **503 en vez de 500** cuando Stripe no está configurado. Esto permite
  levantar entornos de dev/QA sin tener que exponer `sk_test_...` a la
  build. El frontend muestra "El pago no está disponible en este momento".

---

# Fase 2c — Multi-maestro por línea

Cambio de modelo: una venta puede contener productos de varios artesanos.
Agregamos un **snapshot de `artesano_id` por línea** (`venta_detalle.artesano_id`),
vinculamos cada artesano opcionalmente con un user_account del sistema
(rol `MAESTRO`), y exponemos un endpoint `/api/maestro-ventas/mias` para que
un maestro autenticado liste las ventas donde tenga al menos una línea.

No hay UI nueva en esta pasada — el flujo se valida con cURL.

## A. Resumen de cambios

- **auth-service**: nuevo rol `MAESTRO` en `UserRole`.
- **catalog-service**:
  - `artesanos.user_account_id UUID UNIQUE` (nullable).
  - `PUT /api/artesanos/{id}/user-link` (ADMIN) para vincular artesano↔usuario.
  - `GET /internal/artesanos/by-user/{userAccountId}` (solo llamadas internas).
- **inventory-service**:
  - `venta_detalle.artesano_id UUID` (nullable) — snapshot al crear venta.
  - `ventas.vendedor_id` ahora nullable (preparando marketplace puro).
  - Al crear cualquier venta (admin o cliente), se resuelve `product.artesanoId`
    contra catalog-service y se guarda en cada línea.
  - `GET /api/maestro-ventas/mias` — ventas donde el MAESTRO tiene líneas.
- **api-gateway**:
  - Ruta `inventory-service` extendida con `/api/maestro-ventas/**` (JwtAuth).
  - Ruta `catalog-service-public` inyecta `X-Internal-Token` por
    `AddRequestHeader` (corrige bug preexistente donde catalog bloqueaba GETs
    públicos del catálogo por falta del header).

## B. Migración SQL (idempotente)

Corre automáticamente al arrancar si `spring.sql.init.mode=always`. Si no,
aplícala manualmente:

### catalog_db

```sql
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                    WHERE table_name='artesanos' AND column_name='user_account_id') THEN
        ALTER TABLE artesanos ADD COLUMN user_account_id UUID;
        BEGIN
            ALTER TABLE artesanos ADD CONSTRAINT artesanos_user_account_id_uq UNIQUE (user_account_id);
        EXCEPTION WHEN duplicate_object THEN NULL;
        END;
    END IF;
END $$;
```

### inventory_db

```sql
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                    WHERE table_name='venta_detalle' AND column_name='artesano_id') THEN
        ALTER TABLE venta_detalle ADD COLUMN artesano_id UUID;
        CREATE INDEX IF NOT EXISTS ix_venta_detalle_artesano_id
            ON venta_detalle(artesano_id) WHERE artesano_id IS NOT NULL;
    END IF;
    BEGIN
        ALTER TABLE ventas ALTER COLUMN vendedor_id DROP NOT NULL;
    EXCEPTION WHEN others THEN NULL;
    END;
END $$;
```

Verificación rápida:

```bash
psql -h localhost -U postgres -d inventory_db -c "\d venta_detalle" | grep artesano_id
psql -h localhost -U postgres -d catalog_db   -c "\d artesanos"     | grep user_account_id
```

## C. Setup de un maestro (happy path cURL)

```bash
# 0. Variables
export GW=http://localhost:8080
export ADMIN_TOKEN=eyJhbGciOi...   # JWT con role=ADMIN

# 1. Crear el usuario MAESTRO en auth-service
curl -s -X POST "$GW/api/auth/register" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"username":"maestro.pedro","password":"XXXXXX","role":"MAESTRO"}'
# → {"id":"<UA_ID>",...}

# 2. Linkear artesano (asumiendo que ya existe) con ese user_account
export UA_ID=<pegar_id_del_paso_1>
export ART_ID=<id_del_artesano>
curl -s -X PUT "$GW/api/artesanos/$ART_ID/user-link" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H 'Content-Type: application/json' \
  -d "{\"userAccountId\":\"$UA_ID\"}"
# → 200 { ..., "userAccountId":"<UA_ID>", ... }

# 3. Login como maestro
MAESTRO_TOKEN=$(curl -s -X POST "$GW/api/auth/login" \
  -H 'Content-Type: application/json' \
  -d '{"username":"maestro.pedro","password":"XXXXXX"}' | jq -r .accessToken)

# 4. Consultar sus ventas
curl -s "$GW/api/maestro-ventas/mias" \
  -H "Authorization: Bearer $MAESTRO_TOKEN" | jq .
# → [] si todavía no hay ventas con productos de ese artesano
```

## D. Verificación end-to-end

1. Cliente C autenticado compra un producto P cuyo `artesanoId = ART_ID`.
2. Antes del pago, `venta_detalle.artesano_id = ART_ID` (chequear con `psql`
   o `GET /api/cliente-ventas/{id}` — la respuesta trae `detalles[].artesanoId`).
3. Maestro M (con `artesanos.user_account_id = M`) hace login y llama a
   `GET /api/maestro-ventas/mias`. La venta aparece **incluso en estado
   `PENDIENTE`**. Esto es intencional — el maestro puede ver pedidos en
   trámite, no solo los pagados.
4. Stripe confirma pago (Fase 2b): la venta pasa a `PAGADA`, y sigue
   apareciendo en el listado del maestro.

```sql
-- Smoke post-venta en inventory_db:
SELECT vd.venta_id, vd.product_id, vd.artesano_id, v.estado
  FROM venta_detalle vd JOIN ventas v ON v.id = vd.venta_id
 ORDER BY v.created_at DESC LIMIT 5;
```

## E. Rollback

### catalog_db

```sql
ALTER TABLE artesanos DROP CONSTRAINT IF EXISTS artesanos_user_account_id_uq;
ALTER TABLE artesanos DROP COLUMN IF EXISTS user_account_id;
```

### inventory_db

```sql
DROP INDEX IF EXISTS ix_venta_detalle_artesano_id;
ALTER TABLE venta_detalle DROP COLUMN IF EXISTS artesano_id;
-- Revertir vendedor_id a NOT NULL solo si no hay ventas con NULL:
-- ALTER TABLE ventas ALTER COLUMN vendedor_id SET NOT NULL;
```

### auth-service

- Volver `UserRole` al set anterior y redeployar. Usuarios con rol `MAESTRO`
  quedan inutilizables hasta reasignarles otro rol.

### api-gateway

- Remover `/api/maestro-ventas/**` del predicate de `inventory-service`.
- Opcionalmente revertir el `AddRequestHeader` de `catalog-service-public`
  (no recomendado: es la corrección de un bug previo).

## F. Notas de diseño (2c)

- **Snapshot, no FK**: `venta_detalle.artesano_id` es UUID sin FK a
  `artesanos`. El artesano vive en otro DB (catalog-service). El snapshot
  garantiza que el listado del maestro siga funcionando aunque el artesano
  haya sido soft-deleteado o renombrado después.
- **Productos sin artesano quedan con `artesano_id = NULL`**, y esas líneas
  no aparecen en ningún listado de maestro. No rompe nada.
- **La tabla no tiene constraint NOT NULL** para mantener compatibilidad
  con ventas viejas creadas antes de 2c.
- **El maestro ve la venta completa**, no solo sus líneas. La razón es que
  conocer qué productos acompañaron a los suyos es útil (ticket promedio,
  cross-sell) y no expone datos sensibles — el cliente_id y el total ya
  están disponibles para él.
- **`/internal/artesanos/by-user/{id}` NO está en el gateway** — solo es
  alcanzable por llamadas directas service-to-service (inventory-service →
  catalog-service). El `InternalGatewayFilter` de catalog sigue exigiendo
  `X-Internal-Token`, así que una llamada directa desde fuera del VPC/
  docker network también falla.
- **`vendedor_id` nullable**: preparamos el terreno para ventas 100%
  marketplace (donde no hay un "vendedor" humano asociado a la venta).
  Hoy día se sigue guardando el `user_account_id` del cliente ahí, como
  antes, para no romper filtros admin existentes.
