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

-- Migration: widen image_url and add artesano image support for existing DBs
ALTER TABLE products ALTER COLUMN image_url TYPE TEXT;
ALTER TABLE artesanos ADD COLUMN IF NOT EXISTS image_url TEXT;
