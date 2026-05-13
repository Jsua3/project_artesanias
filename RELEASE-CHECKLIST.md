# Checklist de release controlado

Este checklist aplica cuando se decida desplegar los cambios actuales. No incluye rotacion de secretos; solo verifica que la app arranque y que la frontera publica/privada siga correcta.

## Antes del deploy

- Confirmar que el branch local contiene solo cambios esperados.
- Confirmar que `frontend/dist/` y `*/target/` no se suben como artefactos generados.
- Ejecutar:

```bash
mvn -q test
cd frontend && npm test -- --watch=false
cd frontend && npm run build
docker compose config --quiet
```

- Revisar que `docker compose config --quiet` no pida variables faltantes.
- Revisar [SECURITY-ROUTES.md](SECURITY-ROUTES.md) si se cambio alguna ruta del gateway.
- Si el servidor ya tiene volumen de Postgres creado, crear manualmente la base `ai_db` antes de levantar `ai-service`:

```bash
docker exec postgres-db psql -U postgres -c "CREATE DATABASE ai_db;"
```

Si responde que ya existe, continuar; en volumenes nuevos se crea por `POSTGRES_MULTIPLE_DATABASES`.

## Deploy sugerido

- Hacer backup o snapshot del servidor antes de reemplazar servicios.
- Actualizar codigo en servidor.
- Construir solo servicios tocados cuando sea posible:

```bash
./mvnw -pl api-gateway,catalog-service,inventory-service,ai-service -am clean package -DskipTests
docker compose build api-gateway catalog-service inventory-service ai-service
docker compose up -d api-gateway catalog-service inventory-service ai-service
```

- Construir frontend y reiniciar el servicio estatico/nginx segun corresponda.

## Smoke tests sin login

Estas rutas deben funcionar sin token:

```bash
curl -i http://56.126.102.113.nip.io/api/categories
curl -i http://56.126.102.113.nip.io/api/products
curl -i http://56.126.102.113.nip.io/api/artesanos
curl -i http://56.126.102.113.nip.io/api/public/eventos
```

Verificar que `/api/artesanos` no incluya `telefono`, `email`, `userAccountId`, `active` ni `createdAt`.

Verificar que `/api/products` no incluya `sku`, `stockMinimo`, `active`, `createdAt` ni `updatedAt`.

## Smoke tests sin login que deben fallar

Estas rutas deben responder `401` sin token:

```bash
curl -i http://56.126.102.113.nip.io/api/auth/users
curl -i http://56.126.102.113.nip.io/api/admin/db/users
curl -i http://56.126.102.113.nip.io/api/stock
curl -i http://56.126.102.113.nip.io/api/ventas
curl -i http://56.126.102.113.nip.io/api/reports/summary
curl -i http://56.126.102.113.nip.io/api/artesanos/admin/all
curl -i http://56.126.102.113.nip.io/api/ai/design/message
curl -i http://56.126.102.113.nip.io/api/ai/design/mine
curl -i http://56.126.102.113.nip.io/api/ai/design/review
```

## Smoke tests con roles

- `CLIENTE`
  - Puede entrar a tienda.
  - Puede crear pedido propio.
  - Puede ver `/mis-pedidos`.
  - Puede abrir `/disena-tu-pieza`, usar el agente de diseno, ver precio variable y crear una solicitud de producto personalizado.
  - Puede abrir `/mis-disenos` y ver solo sus solicitudes personalizadas.
  - No puede entrar a inventario, ventas globales, reportes ni admin DB.

- `ARTESANO`
  - Puede gestionar sus productos.
  - No ve selector de "Artesano creador" en formulario de producto.
  - Puede revisar `/disenos-personalizados` y actualizar estado/notas de solicitudes IA.
  - No puede entrar a admin DB de artesanos/clientes/usuarios.

- `ADMIN`
  - Puede ver admin DB.
  - Puede ver `/admin/system-health` y revisar servicios, OpenAI, Stripe y checklist de release.
  - Puede crear/editar artesanos.
  - Puede asignar "Artesano creador" en productos.
  - Puede ver reportes.
  - Puede usar el agente de diseno para pruebas y validar solicitudes personalizadas.
  - Puede revisar `/disenos-personalizados`, copiar ficha de producto y marcar solicitudes como aprobadas/no viables/ajustes.

- `DOMICILIARIO`
  - Puede ver panel de entregas.
  - No puede crear productos, ver reportes ni admin DB.

## Despues del deploy

- Revisar logs de `api-gateway`, `catalog-service`, `inventory-service`, `auth-service` y `frontend/nginx`.
- Entrar como ADMIN a `/admin/system-health` y confirmar que no hay estado `BLOCKED` antes de publicar.
- Hacer una compra de prueba si Stripe esta configurado.
- Verificar que el landing carga imagenes, productos, maestros y eventos.
- Verificar que el login redirige correctamente segun rol.
- Verificar con un usuario CLIENTE que `/disena-tu-pieza` permite confirmar un diseno y que la respuesta queda con estado `PENDING_QUOTE`.
- Verificar que el mismo usuario ve esa solicitud en `/mis-disenos`.
- Verificar con ADMIN/ARTESANO que `/disenos-personalizados` permite cambiar estado y guardar una respuesta del taller.
