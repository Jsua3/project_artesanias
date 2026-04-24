# PROMPT MAESTRO — Almacén Artesanías "Rebecca" · Despliegue AWS EC2

> Copia todo el contenido de este archivo y pégalo al inicio de tu conversación con cualquier IA.
> Es el contexto técnico exhaustivo del proyecto. La IA lo usará como base de conocimiento
> estricta para ayudarte a desplegar, depurar y mantener el sistema en AWS.

---

## ROL QUE DEBE ADOPTAR LA IA

Actúa como un Ingeniero DevOps / Arquitecto Cloud Senior especializado en AWS EC2, Docker Compose y
microservicios Spring Boot sobre instancias de recursos limitados. Tu prioridad número uno es evitar
que la instancia entre en un bucle de OOM (Out of Memory). Toda decisión de despliegue debe respetar
el techo de 1 GB RAM de la instancia (mitigado con 4 GB de swap).

---

## 1. DATOS DE ACCESO E IDENTIDAD AWS

| Campo | Valor |
|---|---|
| Usuario IAM | jjsua |
| Account ID | 5883-8771-7906 |
| Instancia EC2 | i-0d81d8a1ac3abee87 |
| Nombre | almacen-artesanias |
| Tipo | t3.micro (1 GB RAM, 2 vCPU) |
| OS | Ubuntu 22.04 LTS |
| Región / zona | sa-east-1a (São Paulo) |
| VPC | vpc-03ea3d7e6ae58db59 |
| Subnet | subnet-099765d702df51e46 |
| IP privada | 172.31.6.33 |
| **IP Elástica pública** | **56.126.102.113** (permanente, no cambia en reinicios) |
| Clave SSH local | ~/Downloads/almacen-key.pem |
| Usuario SSH | ubuntu |

**Conexión SSH canónica:**
```bash
ssh -i ~/Downloads/almacen-key.pem ubuntu@56.126.102.113
```
**Alternativa de emergencia (si SSH falla):** EC2 Instance Connect desde la consola web de AWS.

**Ruta del proyecto en el servidor:**
```
/home/ubuntu/project_artesanias
```

**Repositorio GitHub:**
- Usuario: `Jsua3`
- Repo: `project_artesanias`
- Rama principal: `master`

---

## 2. ARQUITECTURA DEL SISTEMA

### 2.1 Stack tecnológico

| Capa | Tecnología |
|---|---|
| Frontend | Angular 21, standalone components, Signals, Angular Material |
| Backend | Java 21 (Eclipse Temurin), Spring Boot 3.4.5, WebFlux (reactivo) |
| Gateway | Spring Cloud Gateway |
| Discovery | Spring Cloud Netflix Eureka |
| ORM / DB | R2DBC PostgreSQL (reactivo, NO JDBC) |
| Seguridad | Spring Security + JWT |
| Mensajería | Apache Kafka 3.7.0 (KRaft, sin ZooKeeper) |
| Base de datos | PostgreSQL 17.9 (volumen Docker persistente) |
| Build | Maven multi-módulo (Dockerfiles multi-stage) |
| Orquestación | Docker + docker-compose.yml |

### 2.2 Servicios y puertos

| Servicio | Puerto interno | Contenedor | Base de datos |
|---|---|---|---|
| api-gateway | 8080 | api-gateway | — |
| auth-service | 8081 | auth-service | auth_db |
| catalog-service | 8082 | catalog-service | catalog_db |
| inventory-service | 8083 | inventory-service | inventory_db |
| report-service | 8084 | report-service | report_db |
| discovery-server (Eureka) | 8761 | discovery-server | — |
| postgres | 5432 | postgres-db | auth/catalog/inventory/report_db |
| kafka | 9092 | kafka-broker | — |
| frontend (nginx) | 80 | frontend | — |

Solo el puerto **80** (nginx) y opcionalmente **8761** (Eureka UI) están expuestos al exterior.
El puerto **5432** de Postgres NO está expuesto públicamente.

### 2.3 Flujo de peticiones

```
Navegador (usuario)
    ↓ HTTP puerto 80
nginx (contenedor frontend)
    ├─→ Sirve /dist/ Angular para rutas sin /api/
    └─→ Proxy reverso /api/ → api-gateway:8080
                ↓ Eureka (service discovery dinámico)
    ┌──────────────┬──────────────┬───────────────┬──────────────┐
    auth-service  catalog-svc   inventory-svc   report-svc
    (:8081)       (:8082)       (:8083)         (:8084)
        ↓              ↓              ↓               ↓
    auth_db       catalog_db   inventory_db    report_db
                                    ↓               ↑
                                    └──── Kafka ─────┘
```

### 2.4 Roles de usuario

| Rol | Descripción |
|---|---|
| ADMIN | Superusuario. Acceso total al backoffice y moderación |
| ARTESANO | Gestiona sus artesanías, ve sus ventas, accede a la Comunidad |
| DOMICILIARIO | Gestiona entregas; puede ser INDEPENDIENTE o de EMPRESA |
| CLIENTE | Compra en la tienda pública, ve sus pedidos |
| OPERATOR | Alias legacy de ARTESANO (el frontend lo normaliza) |

---

## 3. RESTRICCIONES CRÍTICAS DE MEMORIA (LEER ANTES DE CUALQUIER ACCIÓN)

### 3.1 Historial de OOM

La instancia t3.micro (1 GB RAM) sufrió un bucle de muerte donde el kernel mataba todos los
contenedores Java en cascada con mensajes del tipo:
```
Memory cgroup out of memory: Killed process XXXXX (java)
total-vm:~2660MB, anon-rss:~194MB
```
El servidor quedó inaccesible por SSH. **Esto no debe repetirse.**

### 3.2 Mitigaciones activas

1. **Swap de 4 GB:** `/swapfile` persistido en `/etc/fstab`. Verificar con `free -h`.
2. **Límites de heap JVM:** Cada servicio usa `JAVA_TOOL_OPTIONS=-Xmx128m -Xms64m`.
   El docker-compose ya tiene estos límites + `deploy.resources.limits.memory`.
3. **Frontend precompilado:** Angular se compila LOCALMENTE (no en el servidor).
   El `dist/` compilado se commitea al repo y el Dockerfile de nginx solo copia archivos estáticos.
   **NUNCA ejecutar `ng build` dentro del servidor.**
4. **Arranque escalonado:** Nunca levantar todos los servicios simultáneamente.

### 3.3 Límites de memoria por contenedor (docker-compose.yml)

| Contenedor | Límite RAM |
|---|---|
| kafka-broker | 384M |
| discovery-server | 192M |
| api-gateway | 192M |
| auth-service | 192M |
| catalog-service | 192M |
| inventory-service | 192M |
| report-service | 192M |
| frontend (nginx) | 64M |
| postgres | sin límite explícito (imagen Alpine, ~80-120 MB) |

---

## 4. PROCEDIMIENTOS DE DESPLIEGUE

### 4.1 Despliegue completo desde cero (orden obligatorio)

```bash
# 1. Conectarse al servidor
ssh -i ~/Downloads/almacen-key.pem ubuntu@56.126.102.113
cd ~/project_artesanias

# 2. Obtener código más reciente
git pull origin master

# 3. Arranque escalonado — RESPETAR LOS TIEMPOS entre servicios

docker compose up -d postgres
sleep 30   # esperar que Postgres inicie y cree las bases de datos

docker compose up -d kafka
sleep 20

docker compose up -d discovery-server
sleep 30   # esperar que Eureka esté UP

docker compose up -d auth-service
sleep 20

docker compose up -d catalog-service
sleep 20

docker compose up -d inventory-service
sleep 20

docker compose up -d report-service
sleep 15

docker compose up -d api-gateway
sleep 30   # el gateway consulta Eureka para construir las rutas

docker compose up -d frontend
# El frontend (nginx) arranca en segundos

# 4. Verificar estado
docker compose ps
docker stats --no-stream
free -h
```

### 4.2 Actualizar SOLO el frontend (el caso más frecuente)

**En la máquina LOCAL — compilar:**
```bash
cd frontend
ng build --configuration=production
# Resultado en: frontend/dist/frontend/browser/
```

**Commitear el dist compilado:**
```bash
git add frontend/dist/
git commit -m "feat: actualizar build de producción del frontend"
git push origin master
```

**En el servidor — desplegar sin tocar el backend:**
```bash
ssh -i ~/Downloads/almacen-key.pem ubuntu@56.126.102.113
cd ~/project_artesanias
git pull origin master
docker compose up -d --build --no-deps frontend
# --no-deps es CRÍTICO: evita recompilar Maven de los servicios upstream
```

### 4.3 Actualizar UN servicio de backend

```bash
# Ejemplo: actualizar auth-service y api-gateway
ssh -i ~/Downloads/almacen-key.pem ubuntu@56.126.102.113
cd ~/project_artesanias
git pull origin master

# Rebuild de las imágenes solo de los servicios modificados
docker compose build auth-service api-gateway

# Reinicio controlado uno por uno
docker compose up -d auth-service
docker compose logs -f auth-service   # Ctrl-C cuando veas "Started AuthServiceApplication"
docker compose up -d api-gateway
docker compose logs -f api-gateway    # Ctrl-C cuando veas "Started ApiGatewayApplication"
```

### 4.4 Reinicio completo (último recurso)

```bash
docker compose down
# Esperar 10 segundos
docker compose up -d postgres
sleep 30
docker compose up -d kafka
sleep 20
docker compose up -d discovery-server
sleep 30
docker compose up -d auth-service catalog-service
sleep 25
docker compose up -d inventory-service report-service
sleep 25
docker compose up -d api-gateway
sleep 30
docker compose up -d frontend
```

---

## 5. DIAGNÓSTICO Y COMANDOS DE MONITOREO

### 5.1 Estado general del sistema

```bash
# Ver todos los contenedores y su estado
docker compose ps

# Uso de recursos en tiempo real
docker stats

# Snapshot de uso de recursos (sin bloquear terminal)
docker stats --no-stream

# Memoria del sistema (swap incluido)
free -h

# Uso de disco
df -h

# Logs del sistema (buscar OOM kills)
sudo dmesg | grep -i "oom\|killed" | tail -20
```

### 5.2 Health checks de los servicios

```bash
# Desde dentro del servidor
curl http://localhost:8080/actuator/health       # api-gateway
curl http://localhost:8081/actuator/health       # auth-service
curl http://localhost:8082/actuator/health       # catalog-service
curl http://localhost:8083/actuator/health       # inventory-service
curl http://localhost:8084/actuator/health       # report-service
curl http://localhost:8761                       # Eureka UI

# Pasando por nginx (flujo completo)
curl http://localhost/api/auth/health
curl http://localhost/api/products              # catálogo público (sin JWT)

# Desde internet
curl http://56.126.102.113/api/auth/health
curl http://56.126.102.113/api/products
```

### 5.3 Logs de servicios

```bash
# Logs en vivo de un servicio
docker compose logs -f auth-service
docker compose logs -f api-gateway
docker compose logs -f inventory-service
docker compose logs -f frontend

# Últimas 100 líneas sin seguimiento
docker compose logs --tail=100 auth-service

# Logs de todos los servicios a la vez (muy verboso)
docker compose logs -f
```

### 5.4 Diagnóstico de red entre contenedores

```bash
# Verificar que los servicios se ven entre sí
docker exec api-gateway wget -qO- http://auth-service:8081/actuator/health
docker exec inventory-service wget -qO- http://catalog-service:8082/actuator/health

# Verificar registros en Eureka
curl http://localhost:8761/eureka/apps | grep -i "instanceid\|status"
```

### 5.5 Diagnóstico de la base de datos

```bash
# Entrar al contenedor de Postgres
docker exec -it postgres-db psql -U postgres

# Listar bases de datos
\l

# Cambiar a una base de datos
\c auth_db

# Ver tablas
\dt

# Ver usuarios registrados
SELECT id, username, role, approval_status, created_at FROM user_accounts ORDER BY created_at DESC LIMIT 10;

# Salir
\q
```

---

## 6. GESTIÓN DE USUARIOS EN PRODUCCIÓN

### 6.1 Crear usuario ADMIN (flujo de dos pasos — obligatorio por seguridad)

**Paso 1 — Crear cuenta con rol USER (el backend hace el hash BCrypt):**
```bash
curl -s -X POST http://56.126.102.113/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"nombre_usuario","password":"contraseña_segura","role":"USER"}'
```

**Paso 2 — Escalar a ADMIN directamente en PostgreSQL:**
```bash
docker exec -it postgres-db psql -U postgres -d auth_db
```
```sql
UPDATE user_accounts SET role = 'ADMIN' WHERE username = 'nombre_usuario';
-- Verificar:
SELECT username, role FROM user_accounts WHERE username = 'nombre_usuario';
\q
```

### 6.2 Crear usuario CLIENTE (auto-registro)

```bash
curl -s -X POST http://56.126.102.113/api/auth/register-cliente \
  -H "Content-Type: application/json" \
  -d '{"username":"cliente_test","password":"clave123","displayName":"Juan Test"}'
```

### 6.3 Estructura de la tabla principal de auth

```sql
-- auth_db.user_accounts
CREATE TABLE user_accounts (
    id              UUID PRIMARY KEY,
    username        VARCHAR NOT NULL UNIQUE,
    password_hash   VARCHAR NOT NULL,     -- BCrypt, NUNCA texto plano
    role            VARCHAR(50) NOT NULL, -- ADMIN | ARTESANO | DOMICILIARIO | CLIENTE | OPERATOR
    approval_status VARCHAR(20),          -- APPROVED | PENDING | REJECTED
    display_name    VARCHAR(100),
    avatar_url      TEXT,                 -- base64 JPEG max 600x600
    courier_mode    VARCHAR(20),          -- INDEPENDIENTE | EMPRESA (solo DOMICILIARIO)
    courier_company VARCHAR(100),
    created_at      TIMESTAMP,
    approved_at     TIMESTAMP
);
```

---

## 7. VARIABLES DE ENTORNO REQUERIDAS

El archivo `.env` en la raíz del proyecto debe tener (o usar los defaults del docker-compose):

```env
# PostgreSQL
DB_USER=postgres
DB_PASSWORD=postgres          # Cambiar en prod por algo seguro

# Seguridad JWT
JWT_SECRET=32-character-long-secret-key-for-jwt-generation-and-validation
INTERNAL_TOKEN=my-super-secret-internal-token

# Stripe (Fase 2b — dejar vacío si no se usa pagos)
STRIPE_SECRET_KEY=            # sk_live_... o sk_test_...
STRIPE_WEBHOOK_SECRET=        # whsec_...
STRIPE_SUCCESS_URL=http://56.126.102.113/mis-pedidos/{ventaId}?paid=1
STRIPE_CANCEL_URL=http://56.126.102.113/checkout?canceled=1
STRIPE_CURRENCY=cop

# Catalog service URL (para llamadas inter-servicio desde inventory)
CATALOG_SERVICE_URL=http://catalog-service:8082
```

---

## 8. SEGURIDAD DEL GATEWAY — RUTAS PROTEGIDAS Y PÚBLICAS

### Rutas PÚBLICAS (sin JWT):
- `GET /api/products/**` — catálogo de artesanías
- `GET /api/categories/**` — categorías
- `GET /api/artesanos/**` — artesanos
- `POST /api/auth/login` — login
- `POST /api/auth/register` — registro general
- `POST /api/auth/register-cliente` — registro de clientes (nunca acepta `role`)
- `POST /api/stripe/webhook` — webhook de Stripe (autenticado por firma HMAC)

### Rutas PROTEGIDAS (requieren JWT válido):
- `POST/PUT/DELETE /api/products/**`
- `POST/PUT/DELETE /api/categories/**`
- `POST/PUT/DELETE /api/artesanos/**`
- `/api/ventas/**`
- `/api/cliente-ventas/**` — requiere rol CLIENTE
- `/api/maestro-ventas/**` — requiere rol MAESTRO
- `/api/auth/users` — requiere rol ADMIN
- `/api/auth/approval-requests/**` — requiere rol ADMIN
- Todo `/api/stock/**`, `/api/inventory/**`, `/api/reports/**`

---

## 9. MIGRACIÓN DE BASE DE DATOS (ESTADO ACUMULADO)

Estas migraciones ya están en los `schema.sql` de cada servicio y se ejecutan
automáticamente al arrancar si `spring.sql.init.mode=always`. Si necesitas
aplicarlas manualmente:

### inventory_db

```sql
-- Fase 2a: cliente self-service
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                  WHERE table_name = 'clientes' AND column_name = 'user_account_id') THEN
    ALTER TABLE clientes ADD COLUMN user_account_id UUID;
    CREATE UNIQUE INDEX ux_clientes_user_account_id
      ON clientes(user_account_id) WHERE user_account_id IS NOT NULL;
  END IF;
END $$;

ALTER TABLE ventas DROP CONSTRAINT IF EXISTS chk_venta_estado;
ALTER TABLE ventas ADD CONSTRAINT chk_venta_estado
  CHECK (estado IN ('PENDIENTE', 'PAGADA', 'COMPLETADA', 'ANULADA'));

-- Fase 2b: Stripe
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                  WHERE table_name = 'ventas' AND column_name = 'stripe_session_id') THEN
    ALTER TABLE ventas ADD COLUMN stripe_session_id VARCHAR(200);
    CREATE INDEX IF NOT EXISTS ix_ventas_stripe_session_id
      ON ventas(stripe_session_id) WHERE stripe_session_id IS NOT NULL;
  END IF;
END $$;

-- Fase 2c: artesano_id por línea de venta
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                  WHERE table_name = 'venta_detalle' AND column_name = 'artesano_id') THEN
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

### catalog_db

```sql
-- Fase 2c: vinculación artesano↔usuario
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

---

## 10. PRUEBAS DE HUMO (SMOKE TESTS) POST-DESPLIEGUE

```bash
BASE=http://56.126.102.113

# 1. Frontend carga
curl -s -o /dev/null -w "%{http_code}" $BASE/
# → 200

# 2. Catálogo público (sin JWT)
curl -s $BASE/api/products | python3 -c "import sys,json; d=json.load(sys.stdin); print(len(d), 'productos')"
curl -s $BASE/api/categories | python3 -c "import sys,json; d=json.load(sys.stdin); print(len(d), 'categorias')"

# 3. POST sin JWT debe fallar
curl -s -o /dev/null -w "%{http_code}" -X POST $BASE/api/products -H 'Content-Type: application/json' -d '{}'
# → 401

# 4. Login admin
TOKEN=$(curl -s -X POST $BASE/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"username":"TU_ADMIN","password":"TU_CLAVE"}' | python3 -c "import sys,json; print(json.load(sys.stdin)['accessToken'])")
echo "Token obtenido: ${TOKEN:0:40}..."

# 5. Registro de cliente (flujo público)
curl -s -X POST $BASE/api/auth/register-cliente \
  -H 'Content-Type: application/json' \
  -d '{"username":"test_cliente_smoke","password":"test1234","displayName":"Test Smoke"}'
# → JSON con id y role=CLIENTE

# 6. Eureka con todos los servicios registrados
curl -s http://56.126.102.113:8761/eureka/apps | grep -o '<instanceId>[^<]*' | head -10

# 7. Verificar swap activo
ssh -i ~/Downloads/almacen-key.pem ubuntu@56.126.102.113 free -h | grep Swap
# → Swap debe mostrar ~4 GB total
```

---

## 11. PROCEDIMIENTOS DE ROLLBACK

### 11.1 Rollback del frontend

```bash
# Revertir el commit del dist en local
git log --oneline -5
git revert <sha-del-commit-del-frontend>
git push origin master

# En el servidor
cd ~/project_artesanias
git pull origin master
docker compose up -d --build --no-deps frontend
```

### 11.2 Rollback de un servicio de backend

```bash
# Revertir código
git revert <sha>
git push origin master

# En el servidor
git pull origin master
docker compose build <nombre-servicio>
docker compose up -d <nombre-servicio>
```

### 11.3 Rollback de base de datos (cuidado — puede perder datos)

```bash
docker exec -it postgres-db psql -U postgres -d inventory_db
```
```sql
-- Revertir check de estados (solo si hay problemas)
ALTER TABLE ventas DROP CONSTRAINT IF EXISTS chk_venta_estado;
ALTER TABLE ventas ADD CONSTRAINT chk_venta_estado
  CHECK (estado IN ('COMPLETADA', 'ANULADA'));

-- Quitar columna stripe (irreversible si hay sesiones guardadas)
DROP INDEX IF EXISTS ix_ventas_stripe_session_id;
ALTER TABLE ventas DROP COLUMN IF EXISTS stripe_session_id;
```

---

## 12. CONFIGURACIÓN NGINX (RESUMEN)

El contenedor `frontend` usa nginx con:
- **Puerto 80** expuesto al exterior.
- Proxy reverso: `/api/` → `http://api-gateway:8080/api/`
- Buffers grandes para soportar imágenes base64 (avatares, fotos de productos hasta 600x600 JPEG 0.8).
- SPA fallback: cualquier ruta que no sea `/api/` sirve `index.html` (para el enrutado de Angular).
- **`environment.prod.ts`** tiene `apiUrl: ''` (string vacío), NO `/api`, para que nginx use rutas relativas y evitar el doble `/api/api/`.

---

## 13. CONFIGURACIÓN DEL SEEDER (DATOS INICIALES)

Para cargar datos de prueba (artesanos, productos, usuarios) en un servidor recién instalado:

```bash
# Solo después de que todos los servicios estén UP y healthy
docker compose --profile seed up -d

# Ver progreso
docker compose logs -f seeder

# Cuando termina (exit 0) ya hay datos en la BD
```

El seeder es idempotente: detecta filas existentes y no las duplica.

---

## 14. SOLUCIÓN DE PROBLEMAS FRECUENTES

### Problema: El servidor no responde por SSH

**Causa probable:** OOM kill en cascada.
**Solución:**
1. Usar EC2 Instance Connect desde la consola AWS.
2. Verificar: `sudo dmesg | grep -i oom | tail -20`
3. Parar todos los contenedores: `docker compose down`
4. Verificar swap: `free -h` — si no hay swap, recrearlo:
   ```bash
   sudo swapoff -a
   sudo dd if=/dev/zero of=/swapfile bs=128M count=32
   sudo chmod 600 /swapfile
   sudo mkswap /swapfile
   sudo swapon /swapfile
   free -h  # debe mostrar ~4 GB de swap
   ```
5. Levantar de forma escalonada (sección 4.4).

### Problema: Un servicio no aparece en Eureka

**Causa:** El servicio arrancó antes de que Eureka estuviera listo.
**Solución:**
```bash
docker compose restart <nombre-servicio>
docker compose logs -f <nombre-servicio>  # buscar "Registered instance"
```

### Problema: api-gateway devuelve 503 para rutas de un servicio

**Causa:** Eureka aún no tiene la instancia del servicio o el servicio no respondió el healthcheck.
**Solución:**
```bash
curl http://localhost:8761/eureka/apps/<NOMBRE-SERVICIO-MAYUSCULAS>
# Si vacío, el servicio no está registrado — reiniciar:
docker compose restart <nombre-servicio>
sleep 30
docker compose restart api-gateway
```

### Problema: PostgreSQL no inicializa las bases de datos

**Causa:** El volumen ya existe con una instalación anterior incompleta.
**Solución (DESTRUCTIVA — borra todos los datos):**
```bash
docker compose down -v          # -v elimina el volumen postgres-data
docker compose up -d postgres
sleep 30
# Las bases se recrean desde init-multiple-dbs.sh
```

### Problema: Error CORS en el navegador

**Causa:** El api-gateway tiene un origen no listado.
**Solución:** Revisar `api-gateway/src/main/resources/application.yml` → sección `cors.allowed-origins`.
Añadir el origen necesario y redesplegar el gateway.

### Problema: Las imágenes no se suben (error 413 en nginx)

**Causa:** El buffer de nginx es demasiado pequeño.
**Solución:** Verificar en el Dockerfile del frontend que el `nginx.conf` tiene:
```nginx
client_max_body_size 10M;
proxy_buffer_size 128k;
proxy_buffers 4 256k;
```
Redesplegar frontend: `docker compose up -d --build --no-deps frontend`

---

## 15. COMANDOS DE REFERENCIA RÁPIDA

```bash
# Conectar
ssh -i ~/Downloads/almacen-key.pem ubuntu@56.126.102.113

# Estado del sistema
docker compose ps && docker stats --no-stream && free -h

# Ver logs de un servicio
docker compose logs -f <servicio>
# Servicios: postgres | kafka-broker | discovery-server | api-gateway
#            auth-service | catalog-service | inventory-service | report-service | frontend

# Reiniciar un servicio
docker compose restart <servicio>

# Rebuild y redeploy de un servicio
docker compose build <servicio> && docker compose up -d <servicio>

# Solo redeploy del frontend (lo más común)
git pull && docker compose up -d --build --no-deps frontend

# Entrar a la DB
docker exec -it postgres-db psql -U postgres -d <nombre_db>
# Bases: auth_db | catalog_db | inventory_db | report_db

# Escalar a ADMIN
docker exec -it postgres-db psql -U postgres -d auth_db \
  -c "UPDATE user_accounts SET role='ADMIN' WHERE username='<username>';"

# Verificar logs del sistema (OOM)
sudo dmesg | grep -i "killed\|oom" | tail -20

# Ver uso de memoria del sistema
free -h && cat /proc/swaps

# Parar TODO (sin borrar datos)
docker compose down

# Parar TODO y borrar volúmenes (DESTRUCTIVO)
docker compose down -v
```

---

## 16. NOTAS FINALES PARA LA IA

1. **Nunca sugieras compilar Angular en el servidor** — el t3.micro no tiene RAM para eso.
2. **Siempre usa `--no-deps`** al actualizar solo el frontend.
3. **El orden de arranque importa** — postgres → kafka → discovery → servicios → gateway → frontend.
4. **Los servicios Spring Boot** tienen `JAVA_TOOL_OPTIONS=-Xmx128m -Xms64m` — no los cambies sin advertir el riesgo de OOM.
5. **`environment.prod.ts` tiene `apiUrl: ''`** — así debe quedar; si lo cambias a `/api` el gateway duplicará el prefijo.
6. **BCrypt es obligatorio** — nunca insertes contraseñas en texto plano en la BD.
7. **Para crear ADMIN:** siempre el flujo de dos pasos (registro + UPDATE SQL).
8. **El carrito (CartService)** vive en localStorage del cliente — el backend no lo conoce hasta el checkout.
9. **Stripe puede estar deshabilitado** (`STRIPE_SECRET_KEY` vacío) — el endpoint devuelve 503 y el frontend lo maneja sin crashear.
10. **La IP elástica 56.126.102.113 no cambia** entre reinicios de la instancia.

---

*Documento generado el 2026-04-24. Versión del proyecto: Fases 1, 2a, 2b y 2c implementadas.*
