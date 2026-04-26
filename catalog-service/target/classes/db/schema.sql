CREATE TABLE IF NOT EXISTS categories (
    id          UUID PRIMARY KEY,
    name        VARCHAR(255) NOT NULL,
    description TEXT,
    active      BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS artesanos (
    id           UUID PRIMARY KEY,
    nombre       VARCHAR(100) NOT NULL,
    telefono     VARCHAR(20),
    email        VARCHAR(100),
    especialidad VARCHAR(100),
    ubicacion    VARCHAR(200),
    image_url    TEXT,
    active       BOOLEAN NOT NULL DEFAULT TRUE,
    user_account_id UUID,
    created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS products (
    id           UUID PRIMARY KEY,
    name         VARCHAR(255) NOT NULL,
    sku          VARCHAR(100),
    description  TEXT,
    price        DECIMAL(10,2) NOT NULL DEFAULT 0,
    image_url    TEXT,
    stock_minimo INTEGER NOT NULL DEFAULT 5,
    category_id  UUID REFERENCES categories(id),
    artesano_id  UUID REFERENCES artesanos(id),
    active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Migration: align older catalog_db schemas with the current models.
ALTER TABLE categories ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS active BOOLEAN NOT NULL DEFAULT TRUE;

ALTER TABLE products ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS stock_minimo INTEGER NOT NULL DEFAULT 5;
ALTER TABLE products ADD COLUMN IF NOT EXISTS artesano_id UUID REFERENCES artesanos(id);
ALTER TABLE products ADD COLUMN IF NOT EXISTS active BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE products ADD COLUMN IF NOT EXISTS created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE products ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE products ALTER COLUMN image_url TYPE TEXT;
ALTER TABLE products ALTER COLUMN sku DROP NOT NULL;
ALTER TABLE products ALTER COLUMN category_id DROP NOT NULL;

ALTER TABLE artesanos ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE artesanos ADD COLUMN IF NOT EXISTS active BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE artesanos ADD COLUMN IF NOT EXISTS created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE artesanos ADD COLUMN IF NOT EXISTS user_account_id UUID;

CREATE TABLE IF NOT EXISTS community_posts (
    id                UUID PRIMARY KEY,
    author_id         UUID NOT NULL,
    author_name       VARCHAR(120) NOT NULL,
    author_avatar_url TEXT,
    content           TEXT NOT NULL,
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

CREATE TABLE IF NOT EXISTS community_post_likes (
    id         UUID PRIMARY KEY,
    post_id    UUID NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
    user_id    UUID NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_community_post_likes_user UNIQUE (post_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_community_post_likes_user
    ON community_post_likes (user_id);

CREATE TABLE IF NOT EXISTS community_events (
    id                UUID PRIMARY KEY,
    artesano_id       UUID NOT NULL,
    artesano_nombre   VARCHAR(120),
    organizacion      VARCHAR(160) NOT NULL,
    nombre            VARCHAR(160) NOT NULL,
    localidad         VARCHAR(160) NOT NULL,
    direccion_exacta  VARCHAR(220),
    fecha_inicio      DATE NOT NULL,
    fecha_fin         DATE NOT NULL,
    hora              VARCHAR(20) NOT NULL,
    descripcion       TEXT,
    estado            VARCHAR(20) NOT NULL DEFAULT 'PENDIENTE'
        CHECK (estado IN ('PENDIENTE', 'APROBADO', 'RECHAZADO')),
    review_comment    TEXT,
    reviewed_by       UUID,
    reviewed_at       TIMESTAMP,
    created_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_community_events_estado_created
    ON community_events (estado, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_community_events_artesano_created
    ON community_events (artesano_id, created_at DESC);
