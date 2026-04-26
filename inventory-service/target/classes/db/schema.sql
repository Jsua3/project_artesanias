CREATE TABLE IF NOT EXISTS stocks (
    product_id UUID PRIMARY KEY,
    quantity   INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS stock_entries (
    id           UUID PRIMARY KEY,
    product_id   UUID NOT NULL,
    quantity     INTEGER NOT NULL,
    notes        TEXT,
    performed_by UUID NOT NULL,
    created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS stock_exits (
    id           UUID PRIMARY KEY,
    product_id   UUID NOT NULL,
    quantity     INTEGER NOT NULL,
    notes        TEXT,
    performed_by UUID NOT NULL,
    created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS clientes (
    id         UUID PRIMARY KEY,
    nombre     VARCHAR(100) NOT NULL,
    telefono   VARCHAR(20),
    email      VARCHAR(100),
    direccion  VARCHAR(300),
    active     BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ventas (
    id          UUID PRIMARY KEY,
    cliente_id  UUID REFERENCES clientes(id),
    vendedor_id UUID NOT NULL,
    total       DECIMAL(12,2) NOT NULL DEFAULT 0,
    estado      VARCHAR(20) NOT NULL DEFAULT 'COMPLETADA',
    assigned_courier_id UUID,
    packed      BOOLEAN NOT NULL DEFAULT FALSE,
    picked_up   BOOLEAN NOT NULL DEFAULT FALSE,
    on_the_way  BOOLEAN NOT NULL DEFAULT FALSE,
    delivered   BOOLEAN NOT NULL DEFAULT FALSE,
    delivery_updated_at TIMESTAMP,
    delivery_updated_by UUID,
    packed_at TIMESTAMP,
    picked_up_at TIMESTAMP,
    on_the_way_at TIMESTAMP,
    delivered_at TIMESTAMP,
    tracking_latitude DOUBLE PRECISION,
    tracking_longitude DOUBLE PRECISION,
    delivery_evidence_url TEXT,
    delivery_notes TEXT,
    created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    stripe_session_id VARCHAR(255),
    CONSTRAINT chk_venta_estado CHECK (estado IN ('PENDIENTE', 'PAGADA', 'COMPLETADA', 'ANULADA'))
);

CREATE TABLE IF NOT EXISTS venta_detalle (
    id               UUID PRIMARY KEY,
    venta_id         UUID NOT NULL REFERENCES ventas(id) ON DELETE CASCADE,
    product_id       UUID NOT NULL,
    cantidad         INTEGER NOT NULL,
    precio_unitario  DECIMAL(10,2) NOT NULL,
    subtotal         DECIMAL(10,2) NOT NULL,
    artesano_id      UUID
);

ALTER TABLE clientes ADD COLUMN IF NOT EXISTS user_account_id UUID;

ALTER TABLE ventas ADD COLUMN IF NOT EXISTS assigned_courier_id UUID;
ALTER TABLE ventas ADD COLUMN IF NOT EXISTS packed BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE ventas ADD COLUMN IF NOT EXISTS picked_up BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE ventas ADD COLUMN IF NOT EXISTS on_the_way BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE ventas ADD COLUMN IF NOT EXISTS delivered BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE ventas ADD COLUMN IF NOT EXISTS delivery_updated_at TIMESTAMP;
ALTER TABLE ventas ADD COLUMN IF NOT EXISTS delivery_updated_by UUID;
ALTER TABLE ventas ADD COLUMN IF NOT EXISTS packed_at TIMESTAMP;
ALTER TABLE ventas ADD COLUMN IF NOT EXISTS picked_up_at TIMESTAMP;
ALTER TABLE ventas ADD COLUMN IF NOT EXISTS on_the_way_at TIMESTAMP;
ALTER TABLE ventas ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMP;
ALTER TABLE ventas ADD COLUMN IF NOT EXISTS tracking_latitude DOUBLE PRECISION;
ALTER TABLE ventas ADD COLUMN IF NOT EXISTS tracking_longitude DOUBLE PRECISION;
ALTER TABLE ventas ADD COLUMN IF NOT EXISTS delivery_evidence_url TEXT;
ALTER TABLE ventas ADD COLUMN IF NOT EXISTS delivery_notes TEXT;
ALTER TABLE ventas ADD COLUMN IF NOT EXISTS stripe_session_id VARCHAR(255);

ALTER TABLE venta_detalle ADD COLUMN IF NOT EXISTS artesano_id UUID;

ALTER TABLE ventas DROP CONSTRAINT IF EXISTS chk_venta_estado;
ALTER TABLE ventas ADD CONSTRAINT chk_venta_estado
    CHECK (estado IN ('PENDIENTE', 'PAGADA', 'COMPLETADA', 'ANULADA'));
