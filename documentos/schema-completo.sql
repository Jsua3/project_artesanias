-- ============================================================
-- SCHEMA COMPLETO — Almacén Artesanías / Rebecca
-- Versión: v2 (iteración 2026-04-27)
-- Arquitectura: 4 bases de datos PostgreSQL independientes
--   auth_db      → auth-service      (puerto 8081)
--   catalog_db   → catalog-service   (puerto 8082)
--   inventory_db → inventory-service (puerto 8083)
--   report_db    → report-service    (puerto 8084)
--
-- Ejecución: cada microservicio carga su schema automáticamente
-- via ConnectionFactoryInitializer en arranque.
-- Este archivo consolida los 4 schemas para documentación y
-- restauración manual si fuera necesario.
-- ============================================================


-- ============================================================
-- BASE DE DATOS: auth_db
-- Servicio: auth-service (puerto 8081)
-- Descripción: usuarios, roles, sesiones y perfiles
-- ============================================================

\c auth_db

-- ========================
-- CUENTAS DE USUARIO
-- ========================
CREATE TABLE IF NOT EXISTS user_accounts (
    id              UUID PRIMARY KEY,
    username        VARCHAR(255)  UNIQUE NOT NULL,
    password_hash   VARCHAR(255)  NOT NULL,
    role            VARCHAR(50)   NOT NULL,
    -- Roles válidos: ADMIN, ARTESANO, DOMICILIARIO, CLIENTE
    -- OPERATOR y MAESTRO son alias históricos normalizados a ARTESANO

    approval_status VARCHAR(30)   NOT NULL DEFAULT 'APPROVED',
    -- Estados: APPROVED, PENDING, REJECTED
    -- ARTESANO y DOMICILIARIO inician en PENDING hasta aprobación admin

    -- Modo courier (solo DOMICILIARIO)
    courier_mode    VARCHAR(30),
    courier_company VARCHAR(150),

    -- Campos de perfil
    display_name    VARCHAR(100),
    avatar_url      TEXT,
    first_name      VARCHAR(100),
    last_name       VARCHAR(100),
    phone           VARCHAR(30),
    bio             TEXT,
    locality        VARCHAR(160),
    craft_type      VARCHAR(160),
    address         VARCHAR(300),
    profile_complete BOOLEAN NOT NULL DEFAULT FALSE,

    -- Auditoría
    created_at      TIMESTAMP NOT NULL,
    approved_at     TIMESTAMP,
    approved_by     UUID
);

-- ========================
-- REFRESH TOKENS
-- ========================
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id          UUID PRIMARY KEY,
    user_id     UUID NOT NULL,
    token       VARCHAR(255) NOT NULL,
    expiry_date TIMESTAMP    NOT NULL,
    CONSTRAINT fk_refresh_user FOREIGN KEY (user_id) REFERENCES user_accounts(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user ON refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token ON refresh_tokens(token);


-- ============================================================
-- BASE DE DATOS: catalog_db
-- Servicio: catalog-service (puerto 8082)
-- Descripción: categorías, artesanos, productos y comunidad
-- ============================================================

\c catalog_db

-- ========================
-- CATEGORÍAS
-- ========================
CREATE TABLE IF NOT EXISTS categories (
    id          UUID PRIMARY KEY,
    name        VARCHAR(255) NOT NULL,
    description TEXT,
    active      BOOLEAN NOT NULL DEFAULT TRUE
);

-- ========================
-- ARTESANOS
-- ========================
CREATE TABLE IF NOT EXISTS artesanos (
    id              UUID PRIMARY KEY,
    nombre          VARCHAR(100) NOT NULL,
    telefono        VARCHAR(20),
    email           VARCHAR(100),
    especialidad    VARCHAR(100),
    ubicacion       VARCHAR(200),
    image_url       TEXT,
    active          BOOLEAN NOT NULL DEFAULT TRUE,
    user_account_id UUID,
    -- FK lógica a auth_db.user_accounts.id (cross-DB, no FK declarada)
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_artesanos_user_account ON artesanos(user_account_id);
CREATE INDEX IF NOT EXISTS idx_artesanos_active ON artesanos(active);

-- ========================
-- PRODUCTOS
-- ========================
CREATE TABLE IF NOT EXISTS products (
    id           UUID PRIMARY KEY,
    name         VARCHAR(255)   NOT NULL,
    sku          VARCHAR(100),
    description  TEXT,
    price        DECIMAL(10,2)  NOT NULL DEFAULT 0,
    image_url    TEXT,
    stock_minimo INTEGER        NOT NULL DEFAULT 5,
    category_id  UUID           REFERENCES categories(id),
    artesano_id  UUID           REFERENCES artesanos(id),
    active       BOOLEAN        NOT NULL DEFAULT TRUE,
    created_at   TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at   TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_artesano ON products(artesano_id);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(active);

-- ========================
-- PUBLICACIONES DE COMUNIDAD
-- ========================
CREATE TABLE IF NOT EXISTS community_posts (
    id                UUID    PRIMARY KEY,
    author_id         UUID    NOT NULL,
    -- FK lógica a auth_db.user_accounts.id
    author_name       VARCHAR(120) NOT NULL,
    author_avatar_url TEXT,
    content           TEXT    NOT NULL,
    image_url         TEXT,
    likes_count       INTEGER NOT NULL DEFAULT 0,
    comments_count    INTEGER NOT NULL DEFAULT 0,
    estado            VARCHAR(20) NOT NULL DEFAULT 'ACTIVO'
        CHECK (estado IN ('ACTIVO', 'REPORTADO', 'ELIMINADO')),
    created_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_community_posts_estado_created
    ON community_posts (estado, created_at DESC);

-- ========================
-- LIKES DE PUBLICACIONES
-- ========================
CREATE TABLE IF NOT EXISTS community_post_likes (
    id         UUID PRIMARY KEY,
    post_id    UUID NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
    user_id    UUID NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_post_likes_user UNIQUE (post_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_community_post_likes_user
    ON community_post_likes (user_id);

-- ========================
-- EVENTOS Y FERIAS
-- ========================
CREATE TABLE IF NOT EXISTS community_events (
    id               UUID PRIMARY KEY,
    artesano_id      UUID NOT NULL,
    -- FK lógica a artesanos.id
    artesano_nombre  VARCHAR(120),
    organizacion     VARCHAR(160) NOT NULL,
    nombre           VARCHAR(160) NOT NULL,
    localidad        VARCHAR(160) NOT NULL,
    direccion_exacta VARCHAR(220),
    fecha_inicio     DATE         NOT NULL,
    fecha_fin        DATE         NOT NULL,
    hora             VARCHAR(20)  NOT NULL,
    descripcion      TEXT,
    estado           VARCHAR(20) NOT NULL DEFAULT 'PENDIENTE'
        CHECK (estado IN ('PENDIENTE', 'APROBADO', 'RECHAZADO')),
    review_comment   TEXT,
    reviewed_by      UUID,
    -- FK lógica a auth_db.user_accounts.id (ADMIN que revisó)
    reviewed_at      TIMESTAMP,
    created_at       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_community_events_estado_created
    ON community_events (estado, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_community_events_artesano_created
    ON community_events (artesano_id, created_at DESC);


-- ============================================================
-- BASE DE DATOS: inventory_db
-- Servicio: inventory-service (puerto 8083)
-- Descripción: stock, movimientos, clientes, ventas, pedidos,
--              tracking de entrega y pagos Stripe
-- ============================================================

\c inventory_db

-- ========================
-- STOCK ACTUAL
-- ========================
CREATE TABLE IF NOT EXISTS stocks (
    product_id UUID    PRIMARY KEY,
    -- FK lógica a catalog_db.products.id
    quantity   INTEGER NOT NULL DEFAULT 0
    -- Invariante: quantity >= 0 (validado en capa de servicio)
);

-- ========================
-- ENTRADAS DE INVENTARIO
-- ========================
CREATE TABLE IF NOT EXISTS stock_entries (
    id           UUID      PRIMARY KEY,
    product_id   UUID      NOT NULL,
    quantity     INTEGER   NOT NULL CHECK (quantity > 0),
    notes        TEXT,
    performed_by UUID      NOT NULL,
    -- FK lógica a auth_db.user_accounts.id
    created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_stock_entries_product ON stock_entries(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_entries_date    ON stock_entries(created_at);

-- ========================
-- SALIDAS DE INVENTARIO
-- ========================
CREATE TABLE IF NOT EXISTS stock_exits (
    id           UUID      PRIMARY KEY,
    product_id   UUID      NOT NULL,
    quantity     INTEGER   NOT NULL CHECK (quantity > 0),
    notes        TEXT,
    performed_by UUID      NOT NULL,
    created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_stock_exits_product ON stock_exits(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_exits_date    ON stock_exits(created_at);

-- ========================
-- CLIENTES INTERNOS
-- ========================
CREATE TABLE IF NOT EXISTS clientes (
    id              UUID         PRIMARY KEY,
    nombre          VARCHAR(100) NOT NULL,
    telefono        VARCHAR(20),
    email           VARCHAR(100),
    direccion       VARCHAR(300),
    active          BOOLEAN      NOT NULL DEFAULT TRUE,
    user_account_id UUID,
    -- FK lógica a auth_db.user_accounts.id (opcional)
    created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_clientes_user_account ON clientes(user_account_id);

-- ========================
-- VENTAS / PEDIDOS
-- ========================
CREATE TABLE IF NOT EXISTS ventas (
    id          UUID          PRIMARY KEY,
    cliente_id  UUID          REFERENCES clientes(id),
    vendedor_id UUID          NOT NULL,
    -- FK lógica a auth_db.user_accounts.id

    total       DECIMAL(12,2) NOT NULL DEFAULT 0,
    estado      VARCHAR(20)   NOT NULL DEFAULT 'COMPLETADA',
    CONSTRAINT chk_venta_estado
        CHECK (estado IN ('PENDIENTE', 'PAGADA', 'COMPLETADA', 'ANULADA')),

    -- Stripe
    stripe_session_id    VARCHAR(255),

    -- Datos de envío (llenados por el cliente en checkout)
    shipping_recipient_name VARCHAR(150),
    shipping_phone       VARCHAR(10),
    shipping_address     TEXT,
    shipping_city        VARCHAR(100),
    shipping_notes       TEXT,

    -- Courier asignado
    assigned_courier_id  UUID,
    -- FK lógica a auth_db.user_accounts.id (DOMICILIARIO)
    courier_user_id      UUID,
    courier_accepted_at  TIMESTAMP,

    -- Fases de tracking de entrega
    packed               BOOLEAN   NOT NULL DEFAULT FALSE,
    picked_up            BOOLEAN   NOT NULL DEFAULT FALSE,
    on_the_way           BOOLEAN   NOT NULL DEFAULT FALSE,
    delivered            BOOLEAN   NOT NULL DEFAULT FALSE,

    -- Timestamps de cada fase
    packed_at            TIMESTAMP,
    picked_up_at         TIMESTAMP,
    on_the_way_at        TIMESTAMP,
    delivered_at         TIMESTAMP,

    -- Metadatos de la última actualización de entrega
    delivery_updated_at  TIMESTAMP,
    delivery_updated_by  UUID,
    -- FK lógica a auth_db.user_accounts.id

    -- Datos adicionales de entrega
    tracking_latitude    DOUBLE PRECISION,
    tracking_longitude   DOUBLE PRECISION,
    delivery_evidence_url TEXT,
    delivery_notes       TEXT,

    created_at           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ventas_cliente   ON ventas(cliente_id);
CREATE INDEX IF NOT EXISTS idx_ventas_estado    ON ventas(estado);
CREATE INDEX IF NOT EXISTS idx_ventas_fecha     ON ventas(created_at);
CREATE INDEX IF NOT EXISTS idx_ventas_courier   ON ventas(courier_user_id);
CREATE INDEX IF NOT EXISTS idx_ventas_stripe    ON ventas(stripe_session_id);

-- ========================
-- DETALLE DE VENTA
-- ========================
CREATE TABLE IF NOT EXISTS venta_detalle (
    id              UUID          PRIMARY KEY,
    venta_id        UUID          NOT NULL REFERENCES ventas(id) ON DELETE CASCADE,
    product_id      UUID          NOT NULL,
    -- FK lógica a catalog_db.products.id
    artesano_id     UUID,
    -- FK lógica a catalog_db.artesanos.id (opcional, para vistas por maestro)
    cantidad        INTEGER       NOT NULL CHECK (cantidad > 0),
    precio_unitario DECIMAL(10,2) NOT NULL CHECK (precio_unitario >= 0),
    subtotal        DECIMAL(10,2) NOT NULL CHECK (subtotal >= 0)
);

CREATE INDEX IF NOT EXISTS idx_venta_detalle_venta   ON venta_detalle(venta_id);
CREATE INDEX IF NOT EXISTS idx_venta_detalle_product ON venta_detalle(product_id);


-- ============================================================
-- BASE DE DATOS: report_db
-- Servicio: report-service (puerto 8084)
-- Descripción: base desnormalizada de solo lectura, alimentada
--              por eventos Kafka desde inventory-service
-- ============================================================

\c report_db

-- ========================
-- LOG DE MOVIMIENTOS
-- ========================
CREATE TABLE IF NOT EXISTS movement_logs (
    id           UUID      PRIMARY KEY,
    product_id   UUID      NOT NULL,
    quantity     INTEGER   NOT NULL,
    type         VARCHAR(10) NOT NULL,
    -- Valores: ENTRY, EXIT
    performed_by UUID      NOT NULL,
    timestamp    TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_movement_logs_product   ON movement_logs(product_id);
CREATE INDEX IF NOT EXISTS idx_movement_logs_type      ON movement_logs(type);
CREATE INDEX IF NOT EXISTS idx_movement_logs_timestamp ON movement_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_movement_logs_user      ON movement_logs(performed_by);

-- ========================
-- SNAPSHOTS DE STOCK
-- ========================
CREATE TABLE IF NOT EXISTS stock_snapshots (
    product_id       UUID      PRIMARY KEY,
    current_quantity INTEGER   NOT NULL DEFAULT 0,
    last_updated     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
