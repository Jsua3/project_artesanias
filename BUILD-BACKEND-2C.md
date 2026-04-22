# Build del backend — Fase 2c (Multi-maestro por línea)

Checklist para compilar y arrancar `catalog-service`, `inventory-service`,
`auth-service` y `api-gateway` después de los cambios de Fase 2c.

## 1. Pre-requisitos

Igual que Fase 2b: Java 21, Maven wrapper, Postgres en `localhost:5432`
con las DBs `catalog_db`, `inventory_db`, `auth_db`.

## 2. Build (sin tests)

```bash
./mvnw -pl catalog-service,inventory-service,auth-service,api-gateway -am clean package -DskipTests
```

Lo esperable:

- Compila los 4 módulos sin warnings nuevos.
- Ningún DTO nuevo requiere deps externas (Jackson ya está en spring-boot-starter-webflux).

## 3. Env vars relevantes

```bash
export DB_HOST=localhost
export DB_USER=postgres
export DB_PASSWORD=postgres

# inventory-service -> catalog-service (fase 2c usa este cliente directo)
export CATALOG_SERVICE_URL=http://localhost:8082

# Stripe (de 2b)
export STRIPE_SECRET_KEY=sk_test_xxx
export STRIPE_WEBHOOK_SECRET=whsec_xxx

# Gateway
export INVENTORY_SERVICE_URL=http://localhost:8083
export CATALOG_SERVICE_URL=http://localhost:8082
export AUTH_SERVICE_URL=http://localhost:8081
export INTERNAL_TOKEN=my-super-secret-internal-token
export JWT_SECRET=32-character-long-secret-key-for-jwt-generation-and-validation
```

## 4. Migración SQL (auto en dev, manual en prod)

Ver sección B de `DEPLOY-CLIENTE.md`. En dev con `spring.sql.init.mode=always`
corre al arrancar.

## 5. Arranque

```bash
# Terminal 1 — auth
java -jar auth-service/target/auth-service-*.jar

# Terminal 2 — catalog
java -jar catalog-service/target/catalog-service-*.jar

# Terminal 3 — inventory
java -jar inventory-service/target/inventory-service-*.jar

# Terminal 4 — gateway
java -jar api-gateway/target/api-gateway-*.jar
```

## 6. Smoke tests post-arranque

```bash
# El rol MAESTRO es aceptado por auth-service
curl -s -X POST http://localhost:8080/api/auth/register \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"username":"test.maestro","password":"123456","role":"MAESTRO"}' | jq .
# → {"id":"...", ...}

# Linkear artesano existente -> user_account
curl -s -X PUT "http://localhost:8080/api/artesanos/$ART_ID/user-link" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"userAccountId":"<UA_ID>"}' | jq .
# → { ..., "userAccountId":"...", ... }

# Maestro consulta sus ventas (vacio al principio)
MAESTRO_TOKEN=$(curl -s -X POST http://localhost:8080/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"username":"test.maestro","password":"123456"}' | jq -r .accessToken)

curl -s http://localhost:8080/api/maestro-ventas/mias \
  -H "Authorization: Bearer $MAESTRO_TOKEN" | jq .
# → []

# Sin rol MAESTRO/ADMIN -> 403
curl -i http://localhost:8080/api/maestro-ventas/mias \
  -H "Authorization: Bearer $CLIENTE_TOKEN"
# → HTTP/1.1 403 Forbidden
```

## 7. Flujo E2E (happy path)

1. ADMIN crea un producto con `artesanoId = X`.
2. CLIENTE compra ese producto → venta en estado PENDIENTE.
3. Backend snapshotea `venta_detalle.artesano_id = X` automáticamente
   (resuelto server-side contra catalog).
4. Si el artesano X tiene `user_account_id = M`, el usuario M
   (role=MAESTRO) ve esa venta en `/api/maestro-ventas/mias`.
5. Stripe webhook llega → venta pasa a PAGADA → stock baja → M sigue
   viendo la venta, ahora con `estado="PAGADA"`.

Verificación SQL post-compra:

```bash
psql -h localhost -U postgres -d inventory_db -c \
  "SELECT venta_id, product_id, artesano_id FROM venta_detalle ORDER BY id DESC LIMIT 3;"
```

## 8. Errores probables

| Síntoma                                          | Causa                                             | Fix                                                              |
|--------------------------------------------------|---------------------------------------------------|------------------------------------------------------------------|
| `403 Forbidden` en GET `/api/products` público   | Gateway no inyecta `X-Internal-Token` en GETs     | Verificar que `catalog-service-public` tenga `AddRequestHeader`  |
| Venta creada con `artesano_id = NULL`            | Producto sin artesano en catalog, o fetch falló   | Esperado para productos de stock puro. Si no, ver logs WebClient |
| `/api/maestro-ventas/mias` devuelve `[]` siempre | Artesano no tiene `user_account_id` asignado      | `PUT /api/artesanos/{id}/user-link` con el `UA_ID` correcto      |
| `403` en `/user-link`                            | JWT no es ADMIN                                   | Loguearse con usuario ADMIN                                      |
| Arranque auth: `UNKNOWN_ROLE: MAESTRO`           | auth-service viejo sin MAESTRO en `UserRole`      | Rebuild/redeploy auth-service                                    |
| `/internal/artesanos/by-user/...` vía gateway    | El gateway NO rutea `/internal/**` por diseño     | Llamar catalog directo desde inventory (ya lo hace WebClient)    |

## 9. Lo que NO se probó en sandbox

- Compilación completa con Maven (sandbox sin `mvn`).
- Integración real con Postgres + Kafka + catalog-service.
- Llamada WebClient `/internal/artesanos/by-user/{id}` end-to-end.

Lo verificado estáticamente:

- Firmas de constructor (VentaDetalle 7-arg, ProductInfoDto 4-arg,
  ArtesanoResponse 10-arg).
- Imports y callsites coherentes con los DTOs extendidos.
- Rutas en `api-gateway/.../application.yml` incluyen `/api/maestro-ventas/**`.
- Migraciones SQL idempotentes (doble `IF NOT EXISTS`).
