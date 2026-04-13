#!/bin/bash
# =============================================================
# Script de deploy para Almacén Artesanías - EC2 (Ubuntu 22.04)
# Uso: chmod +x deploy.sh && ./deploy.sh
# =============================================================

set -e

echo "==========================================="
echo "  Almacén Artesanías - Setup EC2"
echo "==========================================="

# ---- 1. Instalar Docker si no está instalado ----
if ! command -v docker &> /dev/null; then
    echo ">> Instalando Docker..."
    sudo apt-get update
    sudo apt-get install -y ca-certificates curl gnupg
    sudo install -m 0755 -d /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    sudo chmod a+r /etc/apt/keyrings/docker.gpg
    echo \
      "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
      $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
      sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
    sudo apt-get update
    sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
    sudo usermod -aG docker $USER
    echo ">> Docker instalado. Si es tu primera vez, cierra sesión y vuelve a entrar para usar docker sin sudo."
fi

# ---- 2. Configurar swap (importante para t2.micro con 1GB RAM) ----
if [ ! -f /swapfile ]; then
    echo ">> Configurando 2GB de swap..."
    sudo fallocate -l 2G /swapfile
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile
    echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
    echo ">> Swap configurado."
fi

# ---- 3. Crear archivo .env si no existe ----
if [ ! -f .env ]; then
    echo ">> Creando archivo .env desde .env.example..."
    cp .env.example .env
    # Generar secretos aleatorios
    JWT_SECRET=$(openssl rand -base64 48 | tr -d '\n/+=' | head -c 64)
    INTERNAL_TOKEN=$(openssl rand -base64 32 | tr -d '\n/+=' | head -c 32)
    DB_PASSWORD=$(openssl rand -base64 16 | tr -d '\n/+=' | head -c 20)

    sed -i "s|cambiar-en-produccion|$DB_PASSWORD|g" .env
    sed -i "s|una-clave-secreta-de-al-menos-32-caracteres-aqui|$JWT_SECRET|g" .env
    sed -i "s|un-token-interno-seguro-aqui|$INTERNAL_TOKEN|g" .env
    echo ">> .env creado con secretos generados automáticamente."
    echo ">> IMPORTANTE: Guarda estos valores en un lugar seguro."
    cat .env
fi

# ---- 4. Dar permisos al init script de PostgreSQL ----
chmod +x docker/postgres/init-multiple-dbs.sh

# ---- 5. Build y deploy ----
echo ""
echo ">> Construyendo imágenes Docker (esto tardará varios minutos la primera vez)..."
echo ">> TIP: En t2.micro, el build puede tardar 15-25 minutos. Paciencia."
echo ""

# Build secuencial para ahorrar RAM en t2.micro
echo ">> [1/7] Construyendo discovery-server..."
docker compose build discovery-server

echo ">> [2/7] Construyendo api-gateway..."
docker compose build api-gateway

echo ">> [3/7] Construyendo auth-service..."
docker compose build auth-service

echo ">> [4/7] Construyendo catalog-service..."
docker compose build catalog-service

echo ">> [5/7] Construyendo inventory-service..."
docker compose build inventory-service

echo ">> [6/7] Construyendo report-service..."
docker compose build report-service

echo ">> [7/7] Construyendo frontend..."
docker compose build frontend

echo ""
echo ">> Iniciando servicios..."
docker compose up -d

echo ""
echo "==========================================="
echo "  ¡Deploy completado!"
echo "==========================================="
echo ""
echo "  Frontend:     http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4 2>/dev/null || echo 'TU-IP-PUBLICA'):80"
echo "  API Gateway:  http://localhost:8080"
echo "  Eureka:       http://localhost:8761"
echo ""
echo "  Ver logs:     docker compose logs -f"
echo "  Ver estado:   docker compose ps"
echo "  Detener:      docker compose down"
echo ""
