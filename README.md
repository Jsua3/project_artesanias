# Almacén Artesanías — Rebecca

Sistema de gestión, venta y exhibición de artesanías colombianas. Combina una tienda pública para clientes con un backoffice por roles para administradores, artesanos y domiciliarios.

**URL pública:** `http://56.126.102.113`

---

## Stack tecnológico

| Capa | Tecnologías |
|------|-------------|
| Frontend | Angular 21 · Angular Material · SCSS · ng2-charts · Google Identity Services |
| Backend | Java 21 · Spring Boot 3.4.5 · Spring WebFlux · Spring Cloud Gateway · Eureka |
| Datos | PostgreSQL 17 · Spring Data R2DBC · Apache Kafka 3.7 |
| Seguridad | JWT (JJWT) · BCrypt · Google OAuth 2.0 |
| Infraestructura | Docker Compose · nginx · AWS EC2 Ubuntu 22.04 (sa-east-1) |

---

## Arquitectura y puertos

```
Navegador
  └─→ nginx :80  (sirve Angular + proxea /api/)
        └─→ api-gateway :8080
              ├─→ auth-service      :8081  (auth_db)
              ├─→ catalog-service   :8082  (catalog_db)
              ├─→ inventory-service :8083  (inventory_db)
              └─→ report-service    :8084  (report_db)

discovery-server :8761  (Eureka — registro interno)
postgres-db      :5432  (4 bases: auth_db, catalog_db, inventory_db, report_db)
kafka-broker     :9092  (eventos de inventario → report-service)
```

| Contenedor | Puerto | Descripción |
|-----------|--------|-------------|
| `frontend` | 80 | nginx sirve Angular compilado + proxy `/api/` |
| `api-gateway` | 8080 | Entrada única. Valida JWT, inyecta headers internos |
| `auth-service` | 8081 | Usuarios, roles, sesiones, Google OAuth |
| `catalog-service` | 8082 | Categorías, artesanos, productos, comunidad, eventos |
| `inventory-service` | 8083 | Stock, ventas, pedidos, tracking, Stripe |
| `report-service` | 8084 | Reportes y alertas (consume eventos Kafka) |
| `discovery-server` | 8761 | Eureka — descubrimiento de servicios |
| `postgres-db` | 5432 | PostgreSQL con 4 bases de datos |
| `kafka-broker` | 9092 | Broker en modo KRaft |

---

## Roles del sistema

| Rol | Descripción |
|-----|-------------|
| `ADMIN` | Acceso total al sistema |
| `ARTESANO` | Gestiona sus productos, ventas, stock y comunidad |
| `DOMICILIARIO` | Panel de entregas y tracking |
| `CLIENTE` | Tienda pública, carrito y mis pedidos |

> OPERATOR y MAESTRO son alias históricos normalizados a `ARTESANO` en toda la cadena (JWT siempre lleva `ARTESANO`).

---

## Ejecución local

### Requisitos

- Java 21
- Maven 3.9+
- Docker y Docker Compose

### Pasos

```bash
# 1. Compilar los JARs (sin ejecutar tests)
mvn -pl api-gateway,auth-service,catalog-service,inventory-service,report-service \
    -am -DskipTests package

# 2. Compilar el frontend
cd frontend
node node_modules/@angular/cli/bin/ng.js build --configuration production
cd ..

# 3. Levantar toda la infraestructura
docker compose up --build
```

> El arranque escalonado es necesario en máquinas con poca RAM: primero `postgres`, luego `discovery-server`, luego los servicios Java, por último `frontend`.

---

## Flujo de seguridad

1. El cliente envía credenciales a `POST /api/auth/login`.
2. El `auth-service` valida y emite un JWT firmado con `JWT_SECRET`.
3. Las peticiones protegidas incluyen `Authorization: Bearer <token>`.
4. El `api-gateway` valida el token y, si es válido:
   - Extrae `userId` y `role` del JWT.
   - Inyecta `X-User-Id`, `X-User-Role` y `X-Internal-Token` hacia los microservicios.
5. Los microservicios internos verifican `X-Internal-Token` y usan los headers de usuario para control de acceso.

### Google OAuth

1. Frontend obtiene `googleClientId` de `GET /api/auth/config`.
2. Carga el SDK de Google y renderiza el botón.
3. El usuario se autentica con su cuenta de Google.
4. Frontend envía el ID token a `POST /api/auth/google`.
5. Backend valida contra `https://oauth2.googleapis.com/tokeninfo` (verifica `aud` y `email_verified`).
6. Crea o encuentra el usuario como `CLIENTE` y emite JWT normal.

> El botón de Google solo aparece cuando `GOOGLE_CLIENT_ID` está configurado en el servidor.

---

## Reglas de negocio — inventario

- El stock nunca puede ser negativo (validado en capa de servicio).
- Cada entrada o salida publica un evento en Kafka (`inventory-events`).
- El `report-service` consume los eventos y mantiene `movement_logs` y `stock_snapshots`.
- Al anular una venta se restaura el stock de todos los productos del detalle.
- `markAsPaid` muta la entidad `Venta` existente (no crea una nueva), preservando todos los campos de delivery tracking.

---

## Principales endpoints

Documentación completa en [`documentos/ENDPOINTS.md`](documentos/ENDPOINTS.md).

### Autenticación

```bash
# Registro de artesano
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"artesano1","password":"pass123","role":"ARTESANO"}'

# Login
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"password"}'
# Respuesta: { accessToken, refreshToken, username, role, id }

# Client ID de Google (para el botón del frontend)
curl http://localhost:8080/api/auth/config
```

### Catálogo (público)

```bash
curl http://localhost:8080/api/products
curl http://localhost:8080/api/categories
curl http://localhost:8080/api/artesanos
curl http://localhost:8080/api/public/eventos
```

### Inventario

```bash
# Ver stock (requiere JWT)
curl http://localhost:8080/api/stock \
  -H "Authorization: Bearer <TOKEN>"

# Registrar entrada
curl -X POST http://localhost:8080/api/entries \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"productId":"<UUID>","quantity":50,"notes":"Carga inicial"}'

# Registrar salida
curl -X POST http://localhost:8080/api/exits \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"productId":"<UUID>","quantity":5,"notes":"Venta directa"}'
```

### Ventas del cliente

```bash
# Crear pedido desde carrito
curl -X POST http://localhost:8080/api/cliente-ventas \
  -H "Authorization: Bearer <CLIENTE_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "items": [{"productId":"<UUID>","cantidad":2,"precioUnitario":45000}],
    "shippingRecipientName":"Juan Pérez",
    "shippingPhone":"3001234567",
    "shippingAddress":"Cra 10 # 5-20",
    "shippingCity":"Armenia"
  }'

# Mis pedidos
curl http://localhost:8080/api/cliente-ventas/mias \
  -H "Authorization: Bearer <CLIENTE_TOKEN>"
```

### Reportes

```bash
curl http://localhost:8080/api/reports/summary \
  -H "Authorization: Bearer <ADMIN_TOKEN>"

curl http://localhost:8080/api/reports/history \
  -H "Authorization: Bearer <ADMIN_TOKEN>"

curl http://localhost:8080/api/reports/alerts \
  -H "Authorization: Bearer <ADMIN_TOKEN>"
```

---

## Variables de entorno requeridas

El archivo `.env` en la raíz del proyecto (no se versiona) debe contener:

```bash
# Base de datos
DB_PASSWORD=<contraseña_postgres>

# JWT
JWT_SECRET=<clave_secreta_base64>

# Token interno entre microservicios
INTERNAL_TOKEN=<token_interno>

# Google OAuth (dejar vacío para deshabilitar el botón)
GOOGLE_CLIENT_ID=<client_id>.apps.googleusercontent.com

# Stripe (dejar vacío para modo sin pago online)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_SUCCESS_URL=http://56.126.102.113/mis-pedidos
STRIPE_CANCEL_URL=http://56.126.102.113/carrito
STRIPE_CURRENCY=cop
```

---

## Despliegue en AWS EC2

### Actualizar solo el frontend

```bash
ssh -i ~/Downloads/almacen-key.pem ubuntu@56.126.102.113

cd ~/project_artesanias
git pull --ff-only origin master
docker compose build frontend
docker compose up -d --no-deps --force-recreate frontend

# Verificar bundle nuevo
curl -s http://localhost/ | grep -o 'main-[A-Z0-9]*.js'
```

### Actualizar un servicio backend

```bash
cd ~/project_artesanias
git pull --ff-only origin master
docker compose build auth-service
docker compose up -d --no-deps auth-service
sleep 20
docker compose ps
free -h
```

### Arranque escalonado desde cero

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

### Diagnóstico

```bash
docker compose ps
free -h
curl http://localhost/                   # 200
curl http://localhost/api/products       # 200
curl http://localhost/api/auth/config    # 200 con googleClientId
curl http://localhost:8080/actuator/health
docker compose logs --tail=100 auth-service
docker compose logs --tail=100 inventory-service
```

---

## Base de datos

Schema completo en [`documentos/schema-completo.sql`](documentos/schema-completo.sql).

| Base | Tablas principales |
|------|--------------------|
| `auth_db` | `user_accounts`, `refresh_tokens` |
| `catalog_db` | `categories`, `artesanos`, `products`, `community_posts`, `community_post_likes`, `community_events` |
| `inventory_db` | `stocks`, `stock_entries`, `stock_exits`, `clientes`, `ventas`, `venta_detalle` |
| `report_db` | `movement_logs`, `stock_snapshots` |

### Crear un ADMIN manualmente

```sql
-- Conectar a auth_db
UPDATE user_accounts
SET role = 'ADMIN', approval_status = 'APPROVED'
WHERE username = 'nombre_usuario';
```

> Nunca insertar contraseñas en texto plano. Siempre BCrypt.

---

## Documentación adicional

| Archivo | Descripción |
|---------|-------------|
| [`documentos/ENDPOINTS.md`](documentos/ENDPOINTS.md) | Tabla completa de los 74 endpoints |
| [`documentos/requisitos.md`](documentos/requisitos.md) | Requisitos funcionales, reglas de negocio e historias de usuario |
| [`documentos/schema-completo.sql`](documentos/schema-completo.sql) | Schema SQL de las 4 bases de datos |
| [`postman/almacen-arle.postman_collection.json`](postman/almacen-arle.postman_collection.json) | Colección Postman completa |
| [`postman/inventory-local.postman_environment.json`](postman/inventory-local.postman_environment.json) | Environment Postman (local) |
| [`documentos/SCRIPT_MAESTRO_PROYECTO_REBECCA.md`](documentos/SCRIPT_MAESTRO_PROYECTO_REBECCA.md) | Documento maestro del proyecto |
