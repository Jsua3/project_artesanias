#!/bin/sh
# ============================================================================
# Seeder one-shot — Almacén Artesanías
# ============================================================================
# Uso:
#   docker compose --profile seed up seeder
#
# Crea 3 usuarios via HTTP (para que el BCrypt lo haga auth-service), lee sus
# UUIDs de auth_db y luego inserta artesano + productos + stock + cliente via
# psql usando esos UUIDs. Idempotente: re-ejecutar no duplica filas.
# ============================================================================
set -e
set -u

: "${GATEWAY_URL:=http://api-gateway:8080}"
: "${PGHOST:=postgres}"
: "${PGUSER:=postgres}"
: "${PGPASSWORD:=postgres}"
export PGHOST PGUSER PGPASSWORD

log() { printf '[seed] %s\n' "$1"; }

# ----------------------------------------------------------------------------
# 1. Esperar al gateway (healthcheck de compose ya espera por los servicios,
#    pero agregamos un pequeño buffer por si las migraciones de Spring corren
#    tarde).
# ----------------------------------------------------------------------------
log "Esperando que el gateway responda..."
for i in $(seq 1 30); do
    if curl -fs "${GATEWAY_URL}/actuator/health" >/dev/null 2>&1; then
        log "Gateway listo."
        break
    fi
    sleep 2
done

# ----------------------------------------------------------------------------
# 2. Registrar usuarios (si no existen). El endpoint POST /api/auth/register
#    es público y acepta el campo "role" tal cual viene en el body.
# ----------------------------------------------------------------------------
register_user() {
    username="$1"
    password="$2"
    role="$3"
    display="$4"
    body=$(printf '{"username":"%s","password":"%s","role":"%s","displayName":"%s"}' \
           "$username" "$password" "$role" "$display")
    code=$(curl -s -o /tmp/reg.out -w '%{http_code}' \
           -X POST "${GATEWAY_URL}/api/auth/register" \
           -H 'Content-Type: application/json' \
           -d "$body" || echo "000")
    case "$code" in
        200|201)
            log "  $username ($role) registrado."
            ;;
        409|500|400)
            # Probable unique violation -> ya existe. No fallamos.
            log "  $username ($role) probablemente ya existe (HTTP $code)."
            ;;
        *)
            log "  WARN: $username devolvió HTTP $code. Seguimos."
            cat /tmp/reg.out || true
            ;;
    esac
}

log "Registrando usuarios..."
register_user "seed.admin"   "admin123"   "ADMIN"    "Admin Seed"
register_user "seed.cliente" "cliente123" "CLIENTE"  "Cliente Seed"
register_user "seed.maestro" "maestro123" "MAESTRO"  "Maestro Seed"

# ----------------------------------------------------------------------------
# 3. Leer UUIDs reales desde auth_db.
# ----------------------------------------------------------------------------
get_id() {
    psql -t -A -d auth_db -c "SELECT id FROM user_accounts WHERE username='$1' LIMIT 1;" \
        | tr -d '[:space:]'
}

ADMIN_ID=$(get_id seed.admin)
CLIENTE_ID=$(get_id seed.cliente)
MAESTRO_ID=$(get_id seed.maestro)

if [ -z "$ADMIN_ID" ] || [ -z "$CLIENTE_ID" ] || [ -z "$MAESTRO_ID" ]; then
    log "ERROR: no se pudieron leer los UUIDs desde auth_db."
    log "  ADMIN_ID='$ADMIN_ID'  CLIENTE_ID='$CLIENTE_ID'  MAESTRO_ID='$MAESTRO_ID'"
    exit 1
fi

log "UUIDs:"
log "  ADMIN_ID=$ADMIN_ID"
log "  CLIENTE_ID=$CLIENTE_ID"
log "  MAESTRO_ID=$MAESTRO_ID"

# ----------------------------------------------------------------------------
# 4. Poblar catalog_db (categoría, artesano, productos). El artesano queda
#    vinculado al user_account del maestro (link de Fase 2c).
# ----------------------------------------------------------------------------
log "Aplicando seed a catalog_db..."
psql -d catalog_db \
     -v ON_ERROR_STOP=1 \
     -v maestro_id="'$MAESTRO_ID'" \
     -f /catalog-seed.sql

# ----------------------------------------------------------------------------
# 5. Poblar inventory_db (cliente + stocks). El cliente queda vinculado al
#    user_account del cliente final, para que "Mis pedidos" funcione.
# ----------------------------------------------------------------------------
log "Aplicando seed a inventory_db..."
psql -d inventory_db \
     -v ON_ERROR_STOP=1 \
     -v cliente_id="'$CLIENTE_ID'" \
     -f /inventory-seed.sql

# ----------------------------------------------------------------------------
# 6. Resumen.
# ----------------------------------------------------------------------------
cat <<EOF

==================================================================
 Seed OK. Credenciales de prueba:

   admin    / admin123     (rol ADMIN)
   cliente  / cliente123   (rol CLIENTE)
   maestro  / maestro123   (rol MAESTRO, vinculado a 1 artesano)

 Frontend: http://localhost
 Gateway : http://localhost:8080
 Eureka  : http://localhost:8761

 Pasos siguientes:
   1. Entrá como cliente y comprá un producto en la tienda pública.
   2. (Opcional) Stripe CLI: stripe listen --forward-to \\
      http://localhost:8080/api/stripe/webhook
   3. Entrá como maestro y revisá /api/maestro-ventas/mias.
==================================================================
EOF
