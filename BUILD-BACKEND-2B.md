# Build del backend — Fase 2b (Stripe Checkout)

Checklist para compilar y arrancar localmente el `inventory-service` y el
`api-gateway` después de los cambios de Fase 2b. Está pensado para correrlo
en tu máquina (el sandbox no tiene Maven).

## 1. Pre-requisitos

- Java 21 (ya exige el `pom.xml`).
- Maven wrapper presente: `./mvnw --version` desde la raíz del repo.
- Postgres corriendo en `localhost:5432` con la DB `inventory_db`.
- Kafka corriendo (opcional si hasta ahora funcionaba todo sin él).

```bash
./mvnw --version
# Java 21.x.x · Maven 3.9.x
```

## 2. Build (sin tests)

Desde la raíz `almacen-arle/`:

```bash
./mvnw -pl inventory-service,api-gateway -am clean package -DskipTests
```

Lo esperable:

- Baja `stripe-java:29.0.0` desde Maven Central (~5 MB la primera vez).
- Compila `inventory-service` y `api-gateway` sin warnings nuevos.
- Genera los jars en `inventory-service/target/` y `api-gateway/target/`.

## 3. Env vars (dev local)

Crea `.env` en la raíz (o exporta a mano antes de arrancar). Sin las
variables de Stripe el servicio arranca igual pero los endpoints responden
503 (útil para desarrollar el resto del flujo).

```bash
export DB_HOST=localhost
export DB_USER=postgres
export DB_PASSWORD=postgres
export KAFKA_HOST=localhost

# Stripe — usa CLAVES DE TEST (empiezan con sk_test_ / whsec_)
export STRIPE_SECRET_KEY=
export STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxxxxx
export STRIPE_CURRENCY=cop
export STRIPE_SUCCESS_URL='http://localhost:4200/mis-pedidos/{ventaId}?paid=1'
export STRIPE_CANCEL_URL='http://localhost:4200/checkout?canceled=1'

# Gateway
export INVENTORY_SERVICE_URL=http://localhost:8083
export INTERNAL_TOKEN=my-super-secret-internal-token
export JWT_SECRET=32-character-long-secret-key-for-jwt-generation-and-validation
```

## 4. Migración SQL (automática en dev)

`spring.sql.init.mode=always` hace que el bloque idempotente de
`inventory-service/src/main/resources/db/schema.sql` corra al arrancar.
La primera vez verás en logs:

```
Hibernate: -- (no aplica, R2DBC) --
Executing SQL script from class path resource [db/schema.sql]
```

Si Postgres ya tiene la columna `stripe_session_id`, el bloque
`IF NOT EXISTS` no hace nada y el arranque sigue sin errores.

Para verificar manualmente:

```bash
psql -h localhost -U postgres -d inventory_db \
  -c "\\d ventas" | grep stripe_session_id
# → stripe_session_id | character varying(200) |
```

## 5. Arranque (orden sugerido)

```bash
# Terminal 1 — inventory-service
java -jar inventory-service/target/inventory-service-*.jar

# Terminal 2 — api-gateway
java -jar api-gateway/target/api-gateway-*.jar
```

Logs que deberías ver al arrancar `inventory-service`:

```
Stripe SDK inicializado (moneda=cop, success_url=...)
Started InventoryServiceApplication in X.XXX seconds
```

Si `STRIPE_SECRET_KEY` está vacía verás en su lugar:

```
STRIPE_SECRET_KEY sin configurar: los endpoints de pago responderan 503
```

## 6. Smoke tests post-arranque

```bash
# Health
curl -s http://localhost:8083/actuator/health | jq .
# → {"status":"UP"}

# El webhook público responde 400 sin firma — prueba de que llega
curl -i -X POST http://localhost:8080/api/stripe/webhook \
  -H 'Content-Type: application/json' -d '{}'
# → HTTP/1.1 400 Bad Request
#   Missing Stripe-Signature
```

Si ves `403 Forbidden` en lugar de `400`, la ruta pública del gateway no
está agregando el `X-Internal-Token`. Revisa la sección
`inventory-service-stripe-webhook` en `api-gateway/.../application.yml`.

Si ves `503`, `STRIPE_SECRET_KEY` está vacía — es esperable si no
configuraste Stripe; define la env var y re-arranca.

## 7. Test E2E con Stripe CLI (dev local)

```bash
stripe login   # una sola vez
stripe listen --forward-to http://localhost:8080/api/stripe/webhook
# imprime: > Ready! Your webhook signing secret is whsec_xxx...

# En otra terminal:
export STRIPE_WEBHOOK_SECRET=whsec_xxx...   # el que acaba de imprimir
# → re-arranca inventory-service con ese webhook secret

# Dispara un evento de prueba:
stripe trigger checkout.session.completed
```

En los logs del `inventory-service` deberías ver:

```
Stripe webhook recibido: checkout.session.completed (id=evt_...)
Session ... completada pero payment_status=... , ignorando
```

(Va a ignorar el evento porque el test trigger de Stripe no tiene una
`ventaId` real; es normal. Lo importante es que la firma validó.)

Para probar el happy path de verdad, crea una venta PENDIENTE desde el
frontend (`/checkout`) → Stripe te devuelve a `?paid=1` → el CLI forwardeará
el webhook al backend → la venta debe pasar a `PAGADA` y bajar stock.

## 8. Errores probables y cómo salir

| Síntoma                                               | Causa                                          | Fix                                                       |
|-------------------------------------------------------|------------------------------------------------|-----------------------------------------------------------|
| `NoClassDefFoundError: com/stripe/Stripe`             | No bajó `stripe-java:29.0.0`                   | `./mvnw -pl inventory-service -am dependency:resolve`     |
| `403 Forbidden` en `/api/stripe/webhook`              | Ruta gateway no tiene `AddRequestHeader`       | Revisa `api-gateway/.../application.yml` ruta stripe      |
| `400 Invalid signature` con CLI                       | `STRIPE_WEBHOOK_SECRET` no coincide            | Copia el `whsec_...` del `stripe listen`                  |
| Venta no cambia a `PAGADA`                            | `payment_status` no es `paid`                  | Pagar con tarjeta test `4242 4242 4242 4242` (no fallida) |
| Stock no baja tras pago                               | Kafka caído o `ExitService` error              | Ver logs de `markAsPaid`; la excepción del Exit se loguea |
| Arranque: `Cannot load JDBC driver`                   | `spring-sql-init` intenta JDBC, pero es R2DBC  | Ya está configurado; si sale, revisa que el usuario DB exista |
| `IllegalStateException: Stripe no esta configurado`   | Sin `STRIPE_SECRET_KEY`                        | Export de env var o acepta el 503                         |
| `IllegalStateException: Solo se puede pagar una venta en estado PENDIENTE` | La venta ya está PAGADA o ANULADA | 409 esperado — no es un bug                              |

## 9. Lo que todavía NO se probó en el sandbox

- Compilación completa con Maven (sandbox solo tiene Java 11, sin `mvn`).
- Arranque real con Stripe SDK cargado.
- Integración real con Postgres + Kafka.

Estos son los puntos que la verificación de esta pasada no puede cubrir —
todo lo demás (tipos TS, templates Angular, firmas Java de los archivos
cambiados, coherencia con ExitService/VentaDetalle, migración SQL) sí se
verificó estáticamente.
