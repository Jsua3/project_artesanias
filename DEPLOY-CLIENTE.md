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
