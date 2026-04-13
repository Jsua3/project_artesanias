# Guía de Deploy en AWS EC2 — Almacén Artesanías

## Requisitos previos
- Cuenta de AWS (free tier funciona)
- El proyecto subido a GitHub

---

## Paso 1: Crear instancia EC2

1. Ir a **AWS Console** → **EC2** → **Launch Instance**
2. Configurar:
   - **Nombre:** `almacen-artesanias`
   - **AMI:** Ubuntu Server 22.04 LTS (Free tier eligible)
   - **Tipo:** `t2.micro` (1 vCPU, 1GB RAM — Free tier)
   - **Key pair:** Crear uno nuevo (descargar el archivo `.pem` y guardarlo seguro)
   - **Security Group:** Crear uno nuevo con estas reglas:

| Tipo | Puerto | Origen | Descripción |
|------|--------|--------|-------------|
| SSH | 22 | Tu IP | Acceso SSH |
| HTTP | 80 | 0.0.0.0/0 | Frontend web |
| Custom TCP | 8080 | 0.0.0.0/0 | API Gateway (opcional, para debug) |

3. En **Storage:** Cambiar a **20 GB** gp3 (free tier permite hasta 30GB)
4. Click **Launch Instance**

---

## Paso 2: Conectar por SSH

```bash
# Dar permisos al key pair
chmod 400 tu-key.pem

# Conectar
ssh -i tu-key.pem ubuntu@TU-IP-PUBLICA-EC2
```

> La IP pública aparece en la consola de EC2 al seleccionar tu instancia.

---

## Paso 3: Clonar y desplegar

```bash
# Clonar tu repositorio
git clone https://github.com/TU-USUARIO/almacen-arle.git
cd almacen-arle

# Ejecutar el script de deploy (instala Docker, configura swap, construye y levanta todo)
chmod +x deploy.sh
./deploy.sh
```

El script automáticamente:
- Instala Docker y Docker Compose
- Crea 2GB de swap (necesario para t2.micro con 1GB RAM)
- Genera secretos seguros aleatorios en `.env`
- Construye las 7 imágenes Docker secuencialmente (para no agotar la RAM)
- Levanta todos los servicios

> **Nota:** La primera vez tarda ~20-30 minutos porque Maven descarga todas las dependencias dentro de Docker. Las siguientes veces es mucho más rápido gracias al caché de Docker.

---

## Paso 4: Verificar

```bash
# Ver estado de los contenedores
docker compose ps

# Ver logs en tiempo real
docker compose logs -f

# Ver logs de un servicio específico
docker compose logs -f auth-service
```

Cuando todos los servicios estén "Up" y healthy, abre en tu navegador:

```
http://TU-IP-PUBLICA-EC2
```

---

## Comandos útiles

```bash
# Detener todo
docker compose down

# Reiniciar todo
docker compose restart

# Reconstruir un servicio específico después de cambios
docker compose build auth-service && docker compose up -d auth-service

# Reconstruir todo después de un git pull
git pull
docker compose build
docker compose up -d

# Ver uso de recursos
docker stats

# Limpiar imágenes viejas (liberar espacio)
docker system prune -f
```

---

## Actualizar después de cambios

```bash
cd almacen-arle
git pull origin main
docker compose build
docker compose up -d
```

---

## Troubleshooting

**Los servicios se reinician constantemente:**
- Revisa logs: `docker compose logs -f nombre-servicio`
- Probablemente falta memoria. Verifica swap: `free -h`

**No puedo acceder desde el navegador:**
- Verifica Security Group en AWS (puerto 80 abierto a 0.0.0.0/0)
- Verifica que el frontend está corriendo: `docker compose ps frontend`

**Error de conexión a base de datos:**
- Espera a que PostgreSQL esté healthy: `docker compose ps postgres`
- Revisa que se crearon las bases de datos: `docker compose exec postgres psql -U postgres -l`

**Build falla por falta de memoria:**
- Verifica swap: `free -h` (debe mostrar ~2GB de swap)
- Construye servicios uno por uno: `docker compose build discovery-server`
