# Sistema de Inventario — Backend con Microservicios Reactivos

Este proyecto es un sistema de gestión de inventario basado en una arquitectura de microservicios utilizando Java 21, Spring Boot 3.4.5 y programación reactiva (Project Reactor).

## Stack Tecnológico

- **Java 21**
- **Spring Boot 3.4.5**
- **Spring Cloud 2024.0.1** (Eureka, Gateway)
- **Spring Data R2DBC** (PostgreSQL)
- **Spring Kafka** (Mensajería asíncrona)
- **JJWT** (Seguridad JWT)
- **Docker & Docker Compose**

## Arquitectura y Puertos

| Servicio | Puerto | Descripción |
| :--- | :--- | :--- |
| `discovery-server` | 8761 | Registro y descubrimiento de servicios (Eureka) |
| `api-gateway` | 8080 | Único punto de entrada. Gestión de seguridad JWT. |
| `auth-service` | 8081 | Gestión de usuarios, autenticación y tokens. |
| `catalog-service` | 8082 | Gestión de categorías y productos. |
| `inventory-service`| 8083 | Gestión de stock y movimientos (Entradas/Salidas). |
| `report-service` | 8084 | Consumo de eventos y generación de reportes. |
| `postgres-db` | 5432 | Base de datos relacional (múltiples DBs). |
| `kafka-broker` | 9092 | Broker de mensajería (KRaft mode). |

## Instrucciones de Ejecución

### Requisitos
- **Java 21**
- **Maven 3.9+** (Asegúrate de tenerlo instalado y en tu PATH)
- **Docker y Docker Compose**

### Pasos para ejecución local
1. **Verificar Maven**:
   Ejecuta `mvn -version` en tu terminal para confirmar que está instalado.
   Si no está instalado, descárgalo de [maven.apache.org](https://maven.apache.org/download.cgi).

2. **Compilar el proyecto**:
   Desde la raíz del proyecto (`almacen-arle/`), ejecuta:
   ```bash
   mvn clean package -DskipTests
   ```
3. **Levantar la infraestructura**:
   ```bash
   docker compose up --build
   ```

## Flujo de Seguridad

1. El cliente envía sus credenciales al `auth-service` a través del `api-gateway`.
2. El `auth-service` valida y genera un JWT.
3. Para peticiones protegidas, el cliente envía el JWT en el header `Authorization: Bearer <token>`.
4. El `api-gateway` valida el token:
   - Extrae los claims (`id`, `role`).
   - Inyecta headers: `X-User-Id`, `X-User-Role`.
   - Inyecta un token interno: `X-Internal-Token`.
5. Los microservicios internos validan la presencia del `X-Internal-Token` y usan los otros headers para control de acceso.

### Roles
- `ADMIN`: Acceso total (lectura/escritura) en todos los servicios, incluyendo reportes.
- `OPERATOR`: Lectura de catálogo, registro de movimientos de inventario. No puede editar catálogo ni ver reportes.

## Reglas de Negocio (Inventario)

- **Stock Inicial**: El stock se crea automáticamente en la primera entrada (0 por defecto).
- **Consistencia**: El stock nunca puede ser negativo.
- **Eventos**: Cada movimiento (entrada/salida) publica un evento en el tópico `inventory-events` de Kafka.
- **Reportes**: El `report-service` consume estos eventos para mantener una base de datos denormalizada de solo lectura optimizada para consultas de histórico y alertas.

## Principales Endpoints

### Auth
- `POST /api/auth/register`: Registro de usuario.
- `POST /api/auth/login`: Obtención de tokens.

### Catalog
- `GET /api/categories`: Listar categorías.
- `POST /api/categories`: Crear categoría (Solo ADMIN).
- `GET /api/products`: Listar productos.
- `POST /api/products`: Crear producto (Solo ADMIN).

### Inventory
- `GET /api/stock`: Ver stock actual.
- `POST /api/entries`: Registrar entrada de productos.
- `POST /api/exits`: Registrar salida de productos.

### Reports
- `GET /api/reports/summary`: Resumen de stock actual (Solo ADMIN).
- `GET /api/reports/history`: Historial de movimientos (Solo ADMIN).

## Ejemplo de Uso (cURL)

```bash
# Login
curl -X POST http://localhost:8080/api/auth/login \
-H "Content-Type: application/json" \
-d '{"username": "admin", "password": "password"}'

# Registrar Entrada
curl -X POST http://localhost:8080/api/entries \
-H "Authorization: Bearer <YOUR_TOKEN>" \
-H "Content-Type: application/json" \
-d '{"productId": "<UUID>", "quantity": 50, "notes": "Carga inicial"}'
```

---

## Despliegue en Azure

### Arquitectura Azure

```
Internet
   │
   ▼
api-gateway  (Container App — ingress externo)
   │
   ├── auth-service        (Container App — interno)
   ├── catalog-service     (Container App — interno)
   ├── inventory-service   (Container App — interno)
   ├── report-service      (Container App — interno)
   └── discovery-server    (Container App — interno)

Azure PostgreSQL Flexible Server  ← reemplaza postgres local
Azure Event Hubs (Kafka)          ← reemplaza kafka local, topic: inventory-events
Azure Container Registry (ACR)    ← almacena imágenes Docker
```

No se requieren cambios de código. Toda la configuración se pasa como variables de entorno usando la convención de Spring Boot (`SPRING_R2DBC_URL`, `SPRING_KAFKA_BOOTSTRAP_SERVERS`, etc.).

### Prerequisitos

- [Azure CLI](https://learn.microsoft.com/en-us/cli/azure/install-azure-cli) instalado
- Suscripción activa de Azure
- Java 21 + Maven

```powershell
az --version   # verificar CLI
az login       # iniciar sesión
```

---

### Paso 1 — Variables

```powershell
$RG       = "almacen-arle-rg"
$LOCATION = "eastus"
$ACR      = "almacenarleacr"     # solo minúsculas + números, globalmente único
$PG       = "almacen-arle-pg"    # globalmente único
$PG_PASS  = "P@ssw0rd2024!"      # cambiar por una contraseña segura
$EH_NS    = "almacen-arle-eh"    # globalmente único
$CA_ENV   = "almacen-arle-env"
```

---

### Paso 2 — Crear infraestructura

```powershell
# Resource Group
az group create --name $RG --location $LOCATION

# Container Registry
az acr create --name $ACR --resource-group $RG --sku Basic --admin-enabled true

# PostgreSQL Flexible Server
az postgres flexible-server create `
  --name $PG --resource-group $RG --location $LOCATION `
  --admin-user postgres --admin-password $PG_PASS `
  --sku-name Standard_B1ms --tier Burstable `
  --public-access All

# Crear las 4 bases de datos
az postgres flexible-server db create --server-name $PG --resource-group $RG --database-name auth_db
az postgres flexible-server db create --server-name $PG --resource-group $RG --database-name catalog_db
az postgres flexible-server db create --server-name $PG --resource-group $RG --database-name inventory_db
az postgres flexible-server db create --server-name $PG --resource-group $RG --database-name report_db

# Event Hubs con soporte Kafka
az eventhubs namespace create `
  --name $EH_NS --resource-group $RG --location $LOCATION `
  --sku Standard --enable-kafka true

# Event Hub (topic) = inventory-events
az eventhubs eventhub create `
  --name inventory-events --namespace-name $EH_NS `
  --resource-group $RG --partition-count 1

# Container Apps Environment
az containerapp env create `
  --name $CA_ENV --resource-group $RG --location $LOCATION
```

---

### Paso 3 — Compilar los JARs

```powershell
mvn clean package -DskipTests
```

---

### Paso 4 — Construir y subir imágenes a ACR

```powershell
az acr build --registry $ACR --image discovery-server:latest ./discovery-server
az acr build --registry $ACR --image api-gateway:latest       ./api-gateway
az acr build --registry $ACR --image auth-service:latest      ./auth-service
az acr build --registry $ACR --image catalog-service:latest   ./catalog-service
az acr build --registry $ACR --image inventory-service:latest ./inventory-service
az acr build --registry $ACR --image report-service:latest    ./report-service
```

---

### Paso 5 — Obtener credenciales

```powershell
$ACR_USER = az acr credential show --name $ACR --query username -o tsv
$ACR_PASS = az acr credential show --name $ACR --query "passwords[0].value" -o tsv

$PG_HOST  = "$PG.postgres.database.azure.com"

$EH_CONN  = az eventhubs namespace authorization-rule keys list `
  --resource-group $RG --namespace-name $EH_NS `
  --name RootManageSharedAccessKey --query primaryConnectionString -o tsv

$KAFKA_BOOTSTRAP = "$EH_NS.servicebus.windows.net:9093"
$KAFKA_JAAS = "org.apache.kafka.common.security.plain.PlainLoginModule required username=`"`$ConnectionString`" password=`"$EH_CONN`";"
```

---

### Paso 6 — Desplegar Container Apps

```powershell
# 1. discovery-server (primero — los demás dependen de él)
az containerapp create `
  --name discovery-server --resource-group $RG --environment $CA_ENV `
  --image "$ACR.azurecr.io/discovery-server:latest" `
  --registry-server "$ACR.azurecr.io" --registry-username $ACR_USER --registry-password $ACR_PASS `
  --target-port 8761 --ingress internal --min-replicas 1

# 2. auth-service
az containerapp create `
  --name auth-service --resource-group $RG --environment $CA_ENV `
  --image "$ACR.azurecr.io/auth-service:latest" `
  --registry-server "$ACR.azurecr.io" --registry-username $ACR_USER --registry-password $ACR_PASS `
  --target-port 8081 --ingress internal --min-replicas 1 `
  --env-vars `
    "SPRING_R2DBC_URL=r2dbc:postgresql://$PG_HOST:5432/auth_db?sslmode=require" `
    "SPRING_R2DBC_USERNAME=postgres" `
    "SPRING_R2DBC_PASSWORD=$PG_PASS" `
    "EUREKA_HOST=discovery-server"

# 3. catalog-service
az containerapp create `
  --name catalog-service --resource-group $RG --environment $CA_ENV `
  --image "$ACR.azurecr.io/catalog-service:latest" `
  --registry-server "$ACR.azurecr.io" --registry-username $ACR_USER --registry-password $ACR_PASS `
  --target-port 8082 --ingress internal --min-replicas 1 `
  --env-vars `
    "SPRING_R2DBC_URL=r2dbc:postgresql://$PG_HOST:5432/catalog_db?sslmode=require" `
    "SPRING_R2DBC_USERNAME=postgres" `
    "SPRING_R2DBC_PASSWORD=$PG_PASS" `
    "EUREKA_HOST=discovery-server"

# 4. inventory-service
az containerapp create `
  --name inventory-service --resource-group $RG --environment $CA_ENV `
  --image "$ACR.azurecr.io/inventory-service:latest" `
  --registry-server "$ACR.azurecr.io" --registry-username $ACR_USER --registry-password $ACR_PASS `
  --target-port 8083 --ingress internal --min-replicas 1 `
  --env-vars `
    "SPRING_R2DBC_URL=r2dbc:postgresql://$PG_HOST:5432/inventory_db?sslmode=require" `
    "SPRING_R2DBC_USERNAME=postgres" `
    "SPRING_R2DBC_PASSWORD=$PG_PASS" `
    "SPRING_KAFKA_BOOTSTRAP_SERVERS=$KAFKA_BOOTSTRAP" `
    "SPRING_KAFKA_PROPERTIES_SECURITY_PROTOCOL=SASL_SSL" `
    "SPRING_KAFKA_PROPERTIES_SASL_MECHANISM=PLAIN" `
    "SPRING_KAFKA_PROPERTIES_SASL_JAAS_CONFIG=$KAFKA_JAAS" `
    "EUREKA_HOST=discovery-server"

# 5. report-service
az containerapp create `
  --name report-service --resource-group $RG --environment $CA_ENV `
  --image "$ACR.azurecr.io/report-service:latest" `
  --registry-server "$ACR.azurecr.io" --registry-username $ACR_USER --registry-password $ACR_PASS `
  --target-port 8084 --ingress internal --min-replicas 1 `
  --env-vars `
    "SPRING_R2DBC_URL=r2dbc:postgresql://$PG_HOST:5432/report_db?sslmode=require" `
    "SPRING_R2DBC_USERNAME=postgres" `
    "SPRING_R2DBC_PASSWORD=$PG_PASS" `
    "SPRING_KAFKA_BOOTSTRAP_SERVERS=$KAFKA_BOOTSTRAP" `
    "SPRING_KAFKA_PROPERTIES_SECURITY_PROTOCOL=SASL_SSL" `
    "SPRING_KAFKA_PROPERTIES_SASL_MECHANISM=PLAIN" `
    "SPRING_KAFKA_PROPERTIES_SASL_JAAS_CONFIG=$KAFKA_JAAS" `
    "EUREKA_HOST=discovery-server"

# 6. api-gateway (EXTERNO — único con ingress público)
az containerapp create `
  --name api-gateway --resource-group $RG --environment $CA_ENV `
  --image "$ACR.azurecr.io/api-gateway:latest" `
  --registry-server "$ACR.azurecr.io" --registry-username $ACR_USER --registry-password $ACR_PASS `
  --target-port 8080 --ingress external --min-replicas 1 `
  --env-vars `
    "EUREKA_HOST=discovery-server" `
    "AUTH_SERVICE_HOST=auth-service" `
    "CATALOG_SERVICE_HOST=catalog-service" `
    "INVENTORY_SERVICE_HOST=inventory-service" `
    "REPORT_SERVICE_HOST=report-service"
```

---

### Paso 7 — Obtener URL pública

```powershell
az containerapp show `
  --name api-gateway --resource-group $RG `
  --query properties.configuration.ingress.fqdn -o tsv
```

La URL resultante es el endpoint público de toda la aplicación.

---

### Actualizar un servicio (re-deploy)

```powershell
# 1. Recompilar
mvn clean package -DskipTests

# 2. Subir nueva imagen (ejemplo: auth-service)
az acr build --registry $ACR --image auth-service:latest ./auth-service

# 3. Actualizar el Container App
az containerapp update --name auth-service --resource-group $RG `
  --image "$ACR.azurecr.io/auth-service:latest"
```

---

### Eliminar todos los recursos Azure

```powershell
az group delete --name $RG --yes
```

---

### Costo estimado Azure

| Recurso | SKU | Costo aprox/mes |
|---------|-----|-----------------|
| Azure Container Registry | Basic | ~$5 |
| PostgreSQL Flexible Server | Burstable B1ms | ~$13 |
| Event Hubs | Standard | ~$10 |
| Container Apps (6 servicios) | Consumption | ~$5-15 |
| **Total** | | **~$33-43 USD** |
