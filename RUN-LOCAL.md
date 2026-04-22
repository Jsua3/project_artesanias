# Correr Almacén Artesanías en local

Esta guía levanta **todo el sistema** (4 microservicios + gateway + discovery
+ Postgres + Kafka + frontend Angular) en tu computadora, sin desplegar nada
a la nube. Al final podés probar el flujo completo (login ADMIN/CLIENTE/MAESTRO,
catálogo público, checkout con Stripe en modo test, webhook, "mis pedidos",
"mis ventas" del maestro).

## 1. Requisitos

- **Docker Desktop** 24+ (incluye Docker Compose v2)
- **~4 GB RAM libre** (los 8 contenedores consumen ~1.5 GB corriendo)
- Puertos libres en tu máquina: `80`, `5432`, `8080`, `8081`, `8082`, `8083`,
  `8084`, `8761`, `9092`
- (Opcional) **Stripe CLI** para webhooks en test — https://stripe.com/docs/stripe-cli

No necesitás Java, Maven, Node ni Angular CLI instalados. Todo se compila
dentro de cada `Dockerfile`.

## 2. Primer arranque

```bash
# 1. Copiá el archivo de variables de entorno
cp .env.example .env

# 2. (Opcional pero recomendado) editá .env para poner tus claves de Stripe
#    en modo test. Sin ellas, el checkout devuelve 503 pero el resto anda.
#    Ver "Stripe en local" más abajo.

# 3. Levantá los 8 servicios principales
docker compose up -d --build

# 4. Esperá ~60–90s a que todo esté sano (lo podés seguir con)
docker compose ps
# hasta ver que auth-service, catalog-service, inventory-service, api-gateway
# aparecen como "healthy".

# 5. Seedeá datos de prueba (admin, cliente, maestro, 3 productos)
docker compose --profile seed up seeder
#   -> imprime "Seed OK" y termina. Es idempotente, re-correlo si hace falta.
```

URLs disponibles:

| Servicio     | URL                        | Notas                         |
| ------------ | -------------------------- | ----------------------------- |
| Frontend     | http://localhost           | Angular (tienda + admin)      |
| Gateway      | http://localhost:8080      | REST pública                  |
| Eureka       | http://localhost:8761      | Dashboard de discovery        |
| Postgres     | localhost:5432             | `postgres / postgres`         |
| auth-service | http://localhost:8080/api/auth/... | via gateway           |

## 3. Credenciales sembradas

El seeder crea 3 cuentas:

| Rol      | Usuario        | Contraseña    | Para qué sirve                               |
| -------- | -------------- | ------------- | -------------------------------------------- |
| ADMIN    | `seed.admin`   | `admin123`    | Crear productos, categorías, ventas manuales |
| CLIENTE  | `seed.cliente` | `cliente123`  | Comprar en la tienda pública, "Mis pedidos"  |
| MAESTRO  | `seed.maestro` | `maestro123`  | Ver ventas propias en `/api/maestro-ventas/mias` |

Además crea 1 artesano (*María Fernández*) linkeado al maestro, y 3 productos
suyos con stock (jarrón, cuenco, ruana).

## 4. Flujo de prueba end-to-end

1. **Abrí http://localhost** y entrá con `seed.cliente / cliente123`.
2. Andá a la tienda pública, agregá productos al carrito y hacé checkout.
3. Si configuraste Stripe (ver abajo) se abre Stripe Checkout; usá la
   tarjeta de prueba **4242 4242 4242 4242** (CVC/fecha cualquiera).
4. Tras el redirect volvés a `/mis-pedidos/:id?paid=1`, la venta pasa a
   `PAGADA` y el stock baja automáticamente (por el webhook).
5. Cerrá sesión, entrá como `seed.maestro / maestro123` y fijate que la
   venta aparece en su listado (filtrada por `artesano_id` de sus
   productos).

## 5. Stripe en local (opcional)

Sin Stripe el sistema funciona igual; solo el endpoint de checkout responde
503. Para probar pagos reales en modo test:

```bash
# 1. Instalá Stripe CLI (Windows: winget install stripe.stripe-cli)
stripe login

# 2. Poné tu test secret key en .env
#    STRIPE_SECRET_KEY=sk_test_xxxxx

# 3. En UNA terminal aparte, hacé forward del webhook al gateway.
#    El CLI imprime un whsec_... al arrancar; copialo a .env como
#    STRIPE_WEBHOOK_SECRET.
stripe listen --forward-to http://localhost:8080/api/stripe/webhook

# 4. Re-arrancá inventory-service para que lea el nuevo .env:
docker compose up -d --force-recreate inventory-service
```

Tarjetas de prueba: https://stripe.com/docs/testing#cards

## 6. Comandos útiles

```bash
# Ver logs en vivo (todos o uno)
docker compose logs -f
docker compose logs -f inventory-service

# Reiniciar solo un servicio tras cambiar su código
docker compose up -d --build catalog-service

# Entrar a la DB
docker compose exec postgres psql -U postgres -d inventory_db
docker compose exec postgres psql -U postgres -d catalog_db
docker compose exec postgres psql -U postgres -d auth_db

# Bajar todo (conserva datos en el volumen postgres-data)
docker compose down

# Bajar TODO y borrar datos (incluye usuarios y productos seedeados)
docker compose down -v

# Re-seedear (tras down -v)
docker compose up -d --build
docker compose --profile seed up seeder
```

## 7. Qué cambiar / qué NO cambiar

### ❗ Cambiar OBLIGATORIAMENTE antes de producción

| Variable                | Por qué                                                            |
| ----------------------- | ------------------------------------------------------------------ |
| `DB_PASSWORD`           | Default `postgres` es público, cualquiera con puerto 5432 entra.   |
| `JWT_SECRET`            | Si no lo cambiás, cualquiera firma JWTs válidos en tu backend.     |
| `INTERNAL_TOKEN`        | Header que autentica llamadas gateway→servicio; si se filtra, todo tu `/internal/**` queda abierto. |
| `STRIPE_SECRET_KEY`     | En prod usar `sk_live_...`, nunca la `sk_test_...`.                |
| `STRIPE_WEBHOOK_SECRET` | El del endpoint de prod del dashboard de Stripe, no el del CLI.    |
| `STRIPE_SUCCESS_URL` / `STRIPE_CANCEL_URL` | Apuntar al dominio real (`https://tu-tienda.com`). |

### ✅ Cambiar si querés personalizar

| Variable            | Notas                                                      |
| ------------------- | ---------------------------------------------------------- |
| `STRIPE_CURRENCY`   | Default `cop`. Si vendés en USD → `usd`. Stripe sólo acepta minúsculas. |
| Puertos del host    | En `docker-compose.yml`, lado izquierdo del `"80:80"`. El 80 podés cambiarlo a 3000 si ya usás el 80. |
| Credenciales del seeder | Editá `docker/seed/seed.sh`. No lo corras en prod.     |

### 🚫 NO cambiar (o rompés la red interna)

| Cosa                                  | Por qué                                                     |
| ------------------------------------- | ----------------------------------------------------------- |
| Hostnames como `postgres`, `kafka`, `discovery-server`, `auth-service`, etc. | Son los nombres DNS que Docker Compose arma internamente; los servicios se hablan por esos nombres. |
| Puertos INTERNOS (`8081`, `8082`…)    | Están cableados en `application.yml` de cada servicio. Sólo cambiá el lado izquierdo del mapping `host:contenedor`. |
| `CATALOG_SERVICE_URL=http://catalog-service:8082` | Si lo cambiás a `localhost`, inventory no puede resolver al catálogo (cada contenedor tiene su propio `localhost`). |
| Las migraciones SQL de `schema.sql`   | Están en cada servicio y se aplican al arrancar. Si tenés que agregar columnas, hacelo como `DO $$ ... IF NOT EXISTS` (ver ejemplos en el repo). |
| El volumen `postgres-data`            | Borrarlo = perder todo. Hacelo sólo si querés resetear.     |

## 8. Troubleshooting

| Síntoma                                                     | Causa probable                                           | Fix                                              |
| ----------------------------------------------------------- | -------------------------------------------------------- | ------------------------------------------------ |
| `docker compose up` queda colgado en "Building …"           | Red lenta bajando dependencias Maven/npm                 | Esperá. El primer build tarda 5–10 min.          |
| Un servicio queda `unhealthy`                               | Arrancó antes que Postgres                               | `docker compose restart <servicio>` y mirá logs. |
| Seeder falla con `could not connect to server`              | Postgres todavía no está en `healthy`                    | `docker compose ps` → esperar y re-correr.       |
| Registro de usuario devuelve 500                            | `user_accounts` vacío la primera vez pero duplicado después | Re-correr el seeder es idempotente; ignorar.  |
| Checkout devuelve 503                                        | `STRIPE_SECRET_KEY` vacío                                | Poner la clave test en `.env` + restart inventory. |
| Webhook no llega y la venta queda `PENDIENTE`               | Stripe CLI no está corriendo                             | `stripe listen --forward-to http://localhost:8080/api/stripe/webhook` |
| `403 Forbidden` en `/api/products` pública                  | El gateway no inyecta `X-Internal-Token` en GETs         | Verificar la route `catalog-service-public` en `api-gateway/.../application.yml`. |
| `MaestroVentaService` devuelve `[]`                         | El artesano no tiene `user_account_id` seteado           | Re-correr seeder, o `PUT /api/artesanos/{id}/user-link`. |

## 9. Arquitectura (resumen de contenedores)

```
 ┌────────────┐      ┌────────────┐
 │  frontend  │ 80→  │ api-gateway│ 8080→ (clientes externos)
 │  (nginx)   │      └─────┬──────┘
 └────────────┘            │
                ┌──────────┼──────────────┬───────────────┐
                ▼          ▼              ▼               ▼
        ┌──────────┐  ┌──────────┐  ┌──────────────┐  ┌───────────┐
        │   auth   │  │ catalog  │  │  inventory   │  │  report   │
        │  :8081   │  │  :8082   │  │    :8083     │  │   :8084   │
        └────┬─────┘  └────┬─────┘  └──────┬───────┘  └─────┬─────┘
             │             │               │                │
             ▼             ▼               ▼                ▼
        ┌───────────────────────────────────────────────────────┐
        │        Postgres :5432  (auth_db, catalog_db,         │
        │                        inventory_db, report_db)       │
        └───────────────────────────────────────────────────────┘
                                       ▲
                                       │
                                  ┌────┴────┐
                                  │  Kafka  │  (stock events)
                                  │  :9092  │
                                  └─────────┘
```

Comunicaciones clave:
- Todo tráfico externo entra por `api-gateway:8080`.
- `inventory-service` llama directo a `catalog-service` (WebClient) para
  resolver `productId → artesanoId` al crear ventas (Fase 2c), usando el
  header `X-Internal-Token`. El gateway NO rutea `/internal/**`.
- `inventory-service` publica eventos de stock a Kafka; `report-service`
  los consume.
- `discovery-server` (Eureka) corre pero los servicios la tienen deshabilitada
  en el gateway (`register-with-eureka: false`) — queda para observabilidad.

## 10. Siguientes pasos para desarrollar

- Cambiar código de un servicio → `docker compose up -d --build <servicio>`.
- Cambiar el frontend → lo mismo con `frontend`; o correrlo fuera con
  `ng serve` apuntando `API_BASE_URL=http://localhost:8080`.
- Ver el detalle de cada fase ya terminada en:
  - `DEPLOY-CLIENTE.md` (Fase 2a/2b/2c — migraciones + notas)
  - `BUILD-BACKEND-2C.md` (build Maven del backend sin tests)

Si algo del compose no arranca y los troubleshooting no ayudan, pega la
salida de `docker compose logs --tail=50 <servicio>` en el issue.
