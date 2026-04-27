# PROMPT MAESTRO PARA CLAUDE CODE — Proyecto Rebecca / Almacen Artesanias (Iteración v2)

## 0. Identidad y postura

Actúa como **Ingeniero Senior Full Stack** especializado en **Angular 21 (standalone components + signals + Angular Material + SCSS)** y **Spring Boot 3.4.5 / Java 21 / WebFlux / R2DBC PostgreSQL / Kafka**, con experiencia en **Docker Compose sobre AWS EC2 (sa-east-1, t3.small, IP 56.126.102.113)**.

Trabajas sobre el repositorio existente `Jsua3/project_artesanias`, rama `master`. **No reescribas la arquitectura.** Respeta toda la convención del proyecto Rebecca documentada en el script maestro (microservicios `api-gateway`, `auth-service`, `catalog-service`, `inventory-service`, `report-service`, `discovery-server`; PostgreSQL con `auth_db`, `catalog_db`, `inventory_db`, `report_db`; Kafka 3.7; nginx con proxy `/api`).

**Reglas innegociables que NO debes romper:**

- Login usuario/contraseña + Google OAuth (Google Identity Services).
- Roles canónicos: `ADMIN`, `ARTESANO`, `DOMICILIARIO`, `CLIENTE`. Normalización: `OPERATOR` y `MAESTRO` → `ARTESANO`. El JWT siempre lleva `ARTESANO`.
- Campos del modelo `Artesano`: `id`, `nombre`, `telefono`, `email`, `especialidad`, `ubicacion`, `imageUrl`, `active`, `userAccountId`, `createdAt`. **NO uses** `oficio`, `municipio`, `vereda`, `fotoUrl`, `bio`.
- `markAsPaid` muta la entidad existente (no crea nueva instancia).
- `AuthResponse` incluye `id` (UUID).
- `environment.prod.ts` usa `apiUrl: ''`.
- El frontend se compila localmente y se commitea `dist/frontend/browser/`.
- En EC2 nunca compiles Angular dentro de Docker.
- Frontend siempre requiere `docker compose build frontend` antes de `up --force-recreate`.
- No expongas secretos. No sobrescribas `.env`.
- Estética Rebecca: terracota/crema/sage/mauve/dorado, Cormorant Garamond + Outfit, Liquid Glass solo en cliente, backoffice sobrio.

**Antes de tocar código:** revisa rutas existentes, contratos actuales, y nunca cambies backend si la tarea es solo UI. Aplica migraciones SQL idempotentes (`CREATE TABLE IF NOT EXISTS`, `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`).

---

## 1. Objetivo de esta iteración

Aplicar **diez cambios funcionales** al proyecto, divididos en tres bloques:

**Bloque A — Peticiones del revisor (capturas adjuntas):**
1. Bloquear el panel del artesano hasta que complete su perfil.
2. Eliminar el flujo de "solicitud de aprobación" para artesanos y domiciliarios. Pueden entrar con usuario/contraseña, pero verán todo vacío hasta completar perfil.
3. Cada artesano queda asociado a sus propias artesanías y no puede modificar las ajenas.
4. En el listado de pedidos del artesano: mostrar **nombre del cliente** y un identificador legible del pedido, en lugar de UUIDs crudos.
5. Modal "Mi Perfil": ampliar la interfaz, forzar teléfono de exactamente 10 dígitos, todos los campos obligatorios, aviso rojo grande indicando que debe completarse para acceder a las funciones.
6. En el modal de perfil: agregar capacidad de editar/recortar/acomodar la foto.

**Bloque B — Peticiones nuevas del propietario (yo):**
7. **Checkout con datos de envío**: antes de pagar, el cliente debe ingresar dirección, nombre completo y teléfono (10 dígitos). Esos datos se persisten en la venta y se entregan al domiciliario asignado.
8. **Notificación de domiciliario aceptado**: cuando un domiciliario acepta una entrega, el cliente recibe una notificación visible en `/mis-pedidos/:id` con la foto de perfil del domiciliario, su nombre y el progreso del pedido en tiempo real (refresh por polling cada 15s).
9. **Pestaña "Base de Datos" en el dashboard del ADMIN**: una vista única con sub-pestañas para inspeccionar artesanos, artesanías, clientes, pedidos, ventas, eventos, posts de comunidad y usuarios. Solo lectura paginada, con búsqueda y filtros básicos.
10. **Ferias y Eventos en la landing pública**: una sección visible en `/` (landing) que muestre los eventos aprobados de la comunidad artesana.

---

## 2. Plan de ejecución por orden estricto

Ejecuta los puntos en este orden. Después de cada bloque grande, valida con `mvn -pl <servicios> -am -DskipTests compile` (backend) y `node node_modules/@angular/cli/bin/ng.js build --configuration production` (frontend).

### Paso 1 — Backend: eliminar flujo de aprobación para ARTESANO y DOMICILIARIO

**Archivos a tocar:**
- `auth-service/src/main/java/.../UserAccount.java` (o equivalente)
- `auth-service/src/main/java/.../AuthService.java`
- `auth-service/src/main/java/.../RegisterRequest.java`
- `auth-service/src/main/java/.../ApprovalController.java`
- `api-gateway/src/main/resources/application.yml` (rutas)

**Cambios:**

- En el registro (`POST /api/auth/register`): cuando el rol solicitado sea `ARTESANO` o `DOMICILIARIO`, **crear el usuario directamente con `active = true` y `approved = true`** (o el flag equivalente). Ya no se inserta en cola de solicitudes.
- Conserva los endpoints `/api/auth/approval-requests` y `/api/auth/artisan-requests` para retrocompatibilidad, pero retorna lista vacía si no hay registros pendientes (no rompas frontend admin existente).
- El JWT emitido al registrarse como artesano/domiciliario debe permitirle hacer login inmediato y entrar a su panel.
- Agrega columna `profile_complete BOOLEAN NOT NULL DEFAULT FALSE` a `user_accounts` si no existe (migración idempotente).

**Endpoint nuevo:**
```
GET /api/auth/me/profile-status
→ 200 { "profileComplete": false, "missingFields": ["phone", "locality", "avatarUrl", ...] }
```

Calcula `profileComplete` desde el backend: requiere `firstName`, `lastName`, `phone` (regex `^\d{10}$`), `locality`, `avatarUrl`, `craftType` (solo artesanos), `address`. Devuelve la lista de campos faltantes.

**Modifica** `PUT /api/auth/profile` para:
- Validar `phone` con `@Pattern(regexp = "^\\d{10}$")`.
- Recalcular `profile_complete` antes de persistir.
- Si todos los campos requeridos están completos, set `profile_complete = true`.

### Paso 2 — Backend: bloqueo de funcionalidades por perfil incompleto

**Archivo:** `inventory-service` y `catalog-service` — filtros existentes que reciben `X-User-Id` y `X-User-Role`.

**Comportamiento:**
- Cuando un usuario `ARTESANO` o `DOMICILIARIO` con `profile_complete = false` haga `POST`, `PUT`, `PATCH`, `DELETE` sobre cualquier recurso (productos, ventas, seguimiento), responder **`403 Forbidden`** con body `{"error": "PROFILE_INCOMPLETE", "message": "Completa tu perfil para acceder a esta función."}`.
- Las consultas `GET` siguen permitidas pero **deben retornar listas vacías** filtradas por `userAccountId` (el artesano sin perfil ve "0 publicadas, 0 ventas, 0 pedidos" en lugar de error).
- Implementa esto con un filtro WebFlux global o con un servicio `ProfileGuardService` que consulte `auth-service` vía cache (TTL 60s). Para minimizar acoplamiento, propaga `X-Profile-Complete` desde el `api-gateway` leyendo el JWT (agrega ese claim al JWT al emitirlo en login y al refresh).

**JWT claim nuevo:** `profileComplete: boolean`. Inclúyelo en `JwtService.generateToken(...)` del auth-service. Recálcalo en cada refresh.

### Paso 3 — Backend: artesanías propias del artesano

**Archivo:** `catalog-service` — `ProductController.java`, `ProductService.java`.

- Cuando un usuario `ARTESANO` cree un producto (`POST /api/products`), forzar `artesanoId = artesanoIdLinkedToCurrentUser`. No aceptar el `artesanoId` del body (sí lo respeta solo si el rol es `ADMIN`).
- En `PUT /api/products/{id}`, `DELETE /api/products/{id}`, `PATCH /api/products/{id}/active`: si el rol es `ARTESANO`, validar que `product.artesanoId == linkedArtesanoId`. Si no coincide, retornar `403`.
- En `GET /api/products/admin/all`: si el rol es `ARTESANO`, filtrar y devolver solo los productos del artesano vinculado al `userAccountId` actual.
- Ya existe `GET /internal/artesanos/by-user/{userAccountId}` — reutilízalo desde `catalog-service` internamente para resolver `linkedArtesanoId`.

### Paso 4 — Backend: datos de envío en checkout y notificación de domiciliario

**Migración SQL en `inventory_db`:**
```sql
ALTER TABLE ventas ADD COLUMN IF NOT EXISTS shipping_recipient_name VARCHAR(150);
ALTER TABLE ventas ADD COLUMN IF NOT EXISTS shipping_phone VARCHAR(10);
ALTER TABLE ventas ADD COLUMN IF NOT EXISTS shipping_address TEXT;
ALTER TABLE ventas ADD COLUMN IF NOT EXISTS shipping_city VARCHAR(100);
ALTER TABLE ventas ADD COLUMN IF NOT EXISTS shipping_notes TEXT;
ALTER TABLE ventas ADD COLUMN IF NOT EXISTS courier_user_id UUID;
ALTER TABLE ventas ADD COLUMN IF NOT EXISTS courier_accepted_at TIMESTAMP;
```

**DTO `CrearVentaClienteRequest`** (ya existe — agrega campos):
- `recipientName: String` — obligatorio, 3-150 chars.
- `recipientPhone: String` — obligatorio, regex `^\d{10}$`.
- `address: String` — obligatorio, 5-500 chars.
- `city: String` — obligatorio.
- `notes: String?` — opcional.

Validar con `@NotBlank` y `@Pattern`. Si faltan o son inválidos, retornar `400` con body `{"errors": [{"field": "...", "message": "..."}]}`.

**Endpoint nuevo:**
```
PATCH /api/ventas/{id}/aceptar-domicilio
Auth: DOMICILIARIO
Body: {} (el ID del domiciliario sale del JWT)
Efecto: setea courier_user_id y courier_accepted_at, dispara evento Kafka 'courier.accepted'.
```

En la respuesta de `GET /api/cliente-ventas/{id}` (que ya existe), incluir un objeto `courier` resuelto vía `auth-service` (endpoint interno nuevo `GET /internal/users/{id}/public-card` → `{ id, displayName, avatarUrl, phone }`):

```json
{
  "id": "...",
  "estado": "PAGADA",
  "tracking": { "packed": true, "pickedUp": false, ... },
  "shipping": { "recipientName": "...", "phone": "...", "address": "...", "city": "..." },
  "courier": { "id": "...", "displayName": "Juan Pérez", "avatarUrl": "https://...", "phone": "3001234567" } | null
}
```

### Paso 5 — Backend: endpoint admin de "Base de Datos"

Crea controladores administrativos solo-lectura, protegidos con rol `ADMIN`:

```
GET /api/admin/db/artesanos?page=0&size=20&search=...      → catalog-service
GET /api/admin/db/products?page=0&size=20&artesanoId=...   → catalog-service
GET /api/admin/db/posts?page=0&size=20&estado=...          → catalog-service
GET /api/admin/db/eventos?page=0&size=20&estado=...        → catalog-service
GET /api/admin/db/users?page=0&size=20&role=...&search=... → auth-service
GET /api/admin/db/clientes?page=0&size=20&search=...       → inventory-service
GET /api/admin/db/ventas?page=0&size=20&estado=...         → inventory-service
GET /api/admin/db/pedidos?page=0&size=20                   → inventory-service (alias de ventas con filtro estado != COMPLETADA)
```

Respuesta estándar paginada:
```json
{
  "content": [...],
  "page": 0,
  "size": 20,
  "totalElements": 142,
  "totalPages": 8
}
```

Registra estas rutas en `api-gateway/src/main/resources/application.yml` con filtro JWT y check de rol `ADMIN`.

### Paso 6 — Backend: ferias y eventos públicos

**Endpoint nuevo en `catalog-service`:**
```
GET /api/public/eventos
→ 200 [{ id, titulo, descripcion, fecha, ubicacion, imagenUrl, artesanoNombre, ... }]
```

Filtrar `community_events` por `estado = 'APROBADO'` y `fecha >= NOW() - INTERVAL '1 day'`. Ordenar por `fecha ASC`. Esta ruta debe ser **pública** (sin JWT) — agrégala a la lista de rutas públicas del `api-gateway`.

### Paso 7 — Frontend: servicios y modelos nuevos

**Modelos (`core/models/`):**

`profile-status.model.ts`:
```typescript
export interface ProfileStatus {
  profileComplete: boolean;
  missingFields: string[];
}
```

`shipping.model.ts`:
```typescript
export interface ShippingInfo {
  recipientName: string;
  recipientPhone: string;
  address: string;
  city: string;
  notes?: string;
}
```

`courier-card.model.ts`:
```typescript
export interface CourierCard {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  phone: string;
}
```

Extiende `Venta` o el modelo `Pedido` existente con `shipping?: ShippingInfo`, `courier?: CourierCard`.

**Servicios:**

- `profile.service.ts` (nuevo o ampliar `auth.service.ts`): `getProfileStatus(): Observable<ProfileStatus>`, `updateProfile(payload)`.
- `cliente-venta.service.ts`: agregar `crearVenta(payload)` con `shipping`. Agregar `getById(id)` que ahora incluye `courier`.
- `admin-db.service.ts` (nuevo): un método por entidad con paginación y filtros.
- `eventos-publicos.service.ts` (nuevo): `listAprobados(): Observable<EventoPublico[]>`.

### Paso 8 — Frontend: guard y bloqueo por perfil incompleto

Crea `profileCompleteGuard` en `core/guards/`. Aplícalo en las rutas de escritura del backoffice artesano y domiciliario. Si el perfil no está completo:
- Permite navegar al `/dashboard` y a `/perfil`.
- Bloquea `POST/PUT/DELETE` interceptando con un `HttpInterceptor` que detecte `403` con `error.code === "PROFILE_INCOMPLETE"` y muestre un `MatDialog` o `MatSnackBar` rojo: **"Completa tu perfil para acceder a esta función"**, con botón "Completar ahora" que abra el modal de perfil.

En el dashboard del artesano, muestra un **banner rojo grande, sticky en la parte superior** cuando `profileComplete === false`:

```html
<div class="profile-incomplete-banner" *ngIf="!profileStatus().profileComplete">
  <mat-icon>warning</mat-icon>
  <div>
    <h3>Tu perfil está incompleto</h3>
    <p>Debes completar todos los campos para acceder a las funciones del panel.</p>
  </div>
  <button mat-flat-button color="warn" (click)="openProfileModal()">Completar perfil</button>
</div>
```

CSS: fondo `#d32f2f`, texto blanco, `padding: 16px 24px`, `position: sticky; top: 0; z-index: 100;`, animación de pulso suave en el icono.

### Paso 9 — Frontend: modal "Mi Perfil" mejorado

**Archivo:** componente del modal de perfil del artesano (probablemente `features/dashboard/profile-dialog.component.ts` o similar).

**Cambios:**

- Aumentar el ancho del diálogo: `width: '720px'`, `maxWidth: '92vw'`. Usa un layout de dos columnas en desktop (≥720px) y una columna en mobile.
- Todos los campos `required`. Mostrar asterisco rojo en el label.
- Campo `phone`: `<input matInput type="tel" maxlength="10" pattern="\d{10}">`. Mostrar contador `{{phone.value.length}}/10` y mensaje de error rojo bajo el campo si no son exactamente 10 dígitos numéricos.
- Banner rojo arriba del modal (no del dashboard, sino dentro del modal mismo) cuando hay campos faltantes:

```html
<div class="modal-warning-banner">
  <mat-icon>error</mat-icon>
  Debes llenar todos los campos para acceder a las funcionalidades del sistema.
</div>
```

- Usa `ngx-image-cropper` (instalar: `npm i ngx-image-cropper`) para la edición de avatar:
  - Click en el área "Tu foto" → abre input file (acepta `image/*`).
  - Tras seleccionar imagen, abre un sub-modal con `<image-cropper>`:
    - `[aspectRatio]="1"`
    - `[maintainAspectRatio]="true"`
    - `[roundCropper]="true"`
    - Botones: "Cancelar", "Recortar y guardar".
  - Al confirmar, convierte el blob a base64 o súbelo a un endpoint nuevo `POST /api/auth/profile/avatar` (multipart) que retorne la URL pública. Si subir avatar es scope-creep, persiste como `data:image/png;base64,...` en `avatarUrl` (consistente con cómo se persiste actualmente en el proyecto).

- Al guardar (`Guardar`): valida client-side todos los campos. Si falla cualquier validación, muestra los errores en línea y no cierra el modal. Si pasa, llama `PUT /api/auth/profile` y al recibir éxito, refetch `getProfileStatus()` y cierra el modal.

### Paso 10 — Frontend: listado de pedidos del artesano con nombres legibles

**Archivo:** `features/pedidos/pedidos.component.ts` y su template.

- En `GET /api/maestro-ventas/mias`, asegúrate de que la respuesta incluya `clienteName` (o `clienteUsername`) y un campo derivado `numeroPedido` (los primeros 8 chars del UUID en mayúsculas, ya se usa en captura: `PEDIDO D63C0CB0`). Si el backend no lo expone, calcúlalo en el frontend con `id.substring(0, 8).toUpperCase()`.
- Ajusta el backend `inventory-service` para que `GET /api/maestro-ventas/mias` haga un join con `clientes` y devuelva `clienteName` (nombre real del cliente), no solo el UUID. Si los datos de envío están presentes, prefiere `shipping_recipient_name`. Fallback: `cliente.nombre` o `cliente.username`.
- En la card del pedido, muestra:
  - Header: `PEDIDO {{numeroPedido}}` (ej. `PEDIDO D63C0CB0`).
  - Cliente: `{{clienteName}}` (ej. "María Gómez"), no UUID.
  - Referencia del producto: nombre real del producto, no su UUID.
  - El UUID completo se mantiene en un `<small>` con opacidad reducida o en un tooltip al hacer hover sobre `PEDIDO {{numeroPedido}}`.

### Paso 11 — Frontend: checkout con datos de envío

**Archivo:** `features/public/checkout/checkout.component.ts` y template.

- Antes del paso de pago, agrega un **paso 1 (Datos de envío)** con un formulario reactivo:

```typescript
shippingForm = this.fb.group({
  recipientName: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(150)]],
  recipientPhone: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
  address: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(500)]],
  city: ['', [Validators.required, Validators.minLength(2)]],
  notes: ['']
});
```

- Usa un `mat-stepper` lineal con dos pasos: "Datos de envío" y "Pago". El botón "Continuar al pago" se habilita solo cuando `shippingForm.valid`.
- Pre-llena el formulario con los datos del usuario logueado si existen (`firstName + lastName`, `phone`, `address` del perfil del cliente).
- Al continuar, envía el `shipping` dentro del payload de `POST /api/cliente-ventas`.
- Estilo consistente con la landing: liquid glass en las tarjetas del stepper, paleta Rebecca.

### Paso 12 — Frontend: notificación de domiciliario aceptado

**Archivo:** `features/public/mis-pedidos/detalle-pedido.component.ts`.

- Cuando se carga el detalle de un pedido con `courier !== null`, muestra una **tarjeta destacada de "Tu domiciliario"** arriba de la línea de progreso:

```html
<section class="courier-card liquid-glass" *ngIf="pedido().courier as courier">
  <img [src]="courier.avatarUrl || 'assets/placeholders/maestro.jpg'" alt="Domiciliario" class="courier-avatar">
  <div class="courier-info">
    <span class="courier-label">Tu pedido va en camino con</span>
    <h3 class="courier-name">{{ courier.displayName }}</h3>
    <p class="courier-status">{{ getEstadoActual(pedido()) }}</p>
  </div>
  <div class="courier-progress">
    <mat-progress-bar mode="determinate" [value]="getProgressPercent(pedido())"></mat-progress-bar>
    <span>{{ getProgressPercent(pedido()) }}% completado</span>
  </div>
</section>
```

- Implementa un polling del detalle del pedido cada 15 segundos mientras la pestaña esté visible (`document.visibilityState === 'visible'`) usando `interval(15000).pipe(switchMap(...))`. Detente cuando `estado === 'COMPLETADA'` o `tracking.delivered === true`.
- La primera vez que `courier` aparece (transición `null → courier`), muestra una notificación toast/snackbar: **"¡{{courier.displayName}} aceptó tu pedido!"** con la foto.
- Si el navegador soporta `Notification` API y el usuario otorgó permiso, dispara también una notificación nativa.

### Paso 13 — Frontend: pestaña "Base de Datos" en dashboard ADMIN

**Nueva ruta:** `/admin/database` con `roleGuard` para `ADMIN`.

**Componente:** `features/admin/database/database.component.ts` con `mat-tab-group` y una pestaña por entidad: **Usuarios, Artesanos, Artesanías, Clientes, Pedidos, Ventas, Eventos, Posts**.

Cada pestaña carga un componente hijo genérico `<app-db-table [endpoint]="..." [columns]="..." [filters]="..."></app-db-table>` que:
- Usa `MatTable` con `MatPaginator` y `MatSort`.
- Tiene un `MatFormField` con `<input matInput placeholder="Buscar...">` con debounce 300ms.
- Llama `admin-db.service.ts` con paginación.
- Muestra columnas relevantes (id corto, campos clave, fecha de creación).
- Acción "Ver detalle" abre un `MatDialog` con el JSON crudo formateado en `<pre>` (para inspección rápida — esto es admin, no público).
- Estilo backoffice sobrio, sin glassmorphism.

Agrega la entrada en el sidebar del admin: `mat-icon: storage`, label "Base de Datos".

### Paso 14 — Frontend: sección de Ferias y Eventos en landing pública

**Archivo:** `features/public/landing/landing.component.ts` y template.

Inserta una nueva sección entre la sección de "maestros" y "compra" (o donde fluya mejor narrativamente). Estructura:

```html
<section id="ferias" class="ferias-section reveal-on-scroll">
  <div class="section-header">
    <span class="kicker">comunidad viva</span>
    <h2>Ferias y eventos artesanos</h2>
    <p class="subtitle">Encuentros donde el oficio toma forma de fiesta.</p>
  </div>
  <div class="eventos-grid" *ngIf="eventos().length; else sinEventos">
    <article class="evento-card liquid-glass liquid-tilt" *ngFor="let e of eventos()">
      <img [src]="e.imagenUrl || 'assets/placeholders/feria.jpg'" [alt]="e.titulo">
      <div class="evento-body">
        <span class="evento-fecha">{{ e.fecha | date:'EEE d MMM' }}</span>
        <h3>{{ e.titulo }}</h3>
        <p class="evento-ubicacion"><mat-icon>place</mat-icon> {{ e.ubicacion }}</p>
        <p class="evento-desc">{{ e.descripcion | slice:0:140 }}...</p>
        <span class="evento-artesano">por {{ e.artesanoNombre }}</span>
      </div>
    </article>
  </div>
  <ng-template #sinEventos>
    <p class="empty-eventos">Pronto anunciaremos nuevas ferias.</p>
  </ng-template>
</section>
```

Cargar con `eventosPublicosService.listAprobados()` en `ngOnInit`. Aplicar `IntersectionObserver` para revelar al hacer scroll, consistente con las otras secciones. Aplicar `appLiquidPointer` solo en desktop. Locale ES para el pipe `date` (ya configurado en el proyecto Rebecca; si no, registra `LOCALE_ID: 'es-CO'` en el bootstrap).

---

## 3. Migraciones SQL consolidadas

Ejecuta como Flyway o como `init.sql` complementario. Todas idempotentes:

```sql
-- auth_db
ALTER TABLE user_accounts ADD COLUMN IF NOT EXISTS profile_complete BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE user_accounts ADD COLUMN IF NOT EXISTS first_name VARCHAR(100);
ALTER TABLE user_accounts ADD COLUMN IF NOT EXISTS last_name VARCHAR(100);
ALTER TABLE user_accounts ADD COLUMN IF NOT EXISTS display_name VARCHAR(150);
ALTER TABLE user_accounts ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE user_accounts ADD COLUMN IF NOT EXISTS phone VARCHAR(10);
ALTER TABLE user_accounts ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE user_accounts ADD COLUMN IF NOT EXISTS locality VARCHAR(150);
ALTER TABLE user_accounts ADD COLUMN IF NOT EXISTS craft_type VARCHAR(150);
ALTER TABLE user_accounts ADD COLUMN IF NOT EXISTS address TEXT;

-- inventory_db
ALTER TABLE ventas ADD COLUMN IF NOT EXISTS shipping_recipient_name VARCHAR(150);
ALTER TABLE ventas ADD COLUMN IF NOT EXISTS shipping_phone VARCHAR(10);
ALTER TABLE ventas ADD COLUMN IF NOT EXISTS shipping_address TEXT;
ALTER TABLE ventas ADD COLUMN IF NOT EXISTS shipping_city VARCHAR(100);
ALTER TABLE ventas ADD COLUMN IF NOT EXISTS shipping_notes TEXT;
ALTER TABLE ventas ADD COLUMN IF NOT EXISTS courier_user_id UUID;
ALTER TABLE ventas ADD COLUMN IF NOT EXISTS courier_accepted_at TIMESTAMP;
CREATE INDEX IF NOT EXISTS idx_ventas_courier ON ventas(courier_user_id);
```

No toques `catalog_db` salvo si `community_events` no tiene columna `estado` con valores `PENDIENTE/APROBADO/RECHAZADO`. Si falta: `ALTER TABLE community_events ADD COLUMN IF NOT EXISTS estado VARCHAR(20) NOT NULL DEFAULT 'PENDIENTE';`.

---

## 4. Validación obligatoria antes de commit

```bash
# 1. Compila backend
mvn -pl api-gateway,auth-service,catalog-service,inventory-service,report-service -am -DskipTests compile

# 2. Compila frontend (local, NUNCA en EC2)
cd frontend
npm install
node node_modules/@angular/cli/bin/ng.js build --configuration production

# 3. Verifica que dist/frontend/browser/ tenga el bundle nuevo (main-XXXXX.js distinto al anterior)
ls -la frontend/dist/frontend/browser/

# 4. Tests funcionales mínimos a ejecutar manualmente tras desplegar:
#    - Registrarse como ARTESANO → entra directo al panel sin aprobación.
#    - Sin completar perfil: ve dashboard vacío + banner rojo, no puede crear producto.
#    - Completa perfil con teléfono inválido → bloqueo, mensaje rojo.
#    - Completa perfil con foto → ve cropper, recorta, guarda, banner desaparece.
#    - Cliente: agregar al carrito → checkout → paso 1 datos envío → paso 2 pago.
#    - Domiciliario: aceptar pedido → cliente ve la card con foto y nombre.
#    - Admin: /admin/database carga las 8 pestañas con datos paginados.
#    - Landing: sección "Ferias y eventos" muestra eventos aprobados.
```

---

## 5. Despliegue (orden estricto)

```bash
# Local
git add -A
git commit -m "feat: iteration v2 - profile gating, shipping data, courier notification, admin db, public events"
git push origin master

# EC2
ssh -i ~/Downloads/almacen-key.pem ubuntu@56.126.102.113

cd ~/project_artesanias
git pull --ff-only origin master

# Backend por etapas (auth y catalog primero porque tocan migraciones)
docker compose build auth-service
docker compose up -d --no-deps auth-service
sleep 25

docker compose build catalog-service
docker compose up -d --no-deps catalog-service
sleep 25

docker compose build inventory-service
docker compose up -d --no-deps inventory-service
sleep 25

docker compose build api-gateway
docker compose up -d --no-deps api-gateway
sleep 20

# Frontend (siempre build antes de force-recreate)
docker compose build frontend
docker compose up -d --no-deps --force-recreate frontend

# Validación
docker compose ps
free -h
curl -s http://localhost/ | grep -o 'main-[A-Z0-9]*.js'
curl -s http://localhost/api/products | head -c 200
curl -s http://localhost/api/auth/config
curl -s http://localhost/api/public/eventos | head -c 200
```

---

## 6. Convenciones de código innegociables

- **Mensajes de commit** en inglés, formato Conventional Commits (`feat:`, `fix:`, `refactor:`, `chore:`).
- **Comentarios y nombres de variables** en inglés, salvo strings de UI que están en español.
- **Validaciones backend** con `@Valid` y mensajes claros en español para el usuario final.
- **Logs** con SLF4J, nivel `info` para flujos esperados, `warn` para validaciones rechazadas, `error` solo para fallos reales.
- **Manejo de errores frontend**: siempre vía `HttpInterceptor` global, no try/catch ad-hoc en cada componente.
- **Signals** para estado local del componente; `BehaviorSubject` solo cuando ya existía antes.

---

## 7. Lo que NO debes hacer

- No crear un nuevo microservicio. Todo cabe en los existentes.
- No introducir Tailwind, Bootstrap ni otra librería UI. Usa Angular Material y SCSS.
- No agregar dependencias backend más allá de lo estrictamente necesario (`ngx-image-cropper` en frontend está bien).
- No cambiar la firma de endpoints públicos existentes (`/api/products`, `/api/cliente-ventas/mias`, etc.). Solo extiende sus respuestas con campos nuevos opcionales.
- No reintroducir `filandia1.jpg` en el carrusel.
- No exponer secretos en commits.
- No usar `MAESTRO` como rol en checks. Solo `ARTESANO`.
- No insertar passwords planas. Siempre BCrypt.
- No saltarte la validación de teléfono de 10 dígitos. Es obligatoria en perfil y en checkout.
- No olvides que `markAsPaid` muta la entidad existente.

---

## 8. Resultado esperado

Al terminar esta iteración, el sistema debe permitir:

- Que un artesano se registre, entre directamente, vea un panel bloqueado con banner rojo, complete su perfil con foto recortada y teléfono validado, y entonces pueda gestionar solo sus propias artesanías.
- Que un cliente compre con datos de envío obligatorios y reciba una notificación visible cuando un domiciliario acepte su pedido, con foto, nombre y progreso.
- Que el admin tenga una vista única de "Base de Datos" con sub-pestañas paginadas para cada entidad.
- Que la landing pública muestre las ferias y eventos aprobados de la comunidad.
- Que todos los pedidos del artesano muestren nombres legibles del cliente y un identificador corto del pedido, no UUIDs crudos.

Cuando termines, devuelve un **resumen estructurado** con: archivos creados, archivos modificados, migraciones SQL aplicadas, endpoints nuevos, y los comandos exactos de despliegue listos para copiar/pegar.
