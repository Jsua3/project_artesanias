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
    id              UUID PRIMARY KEY,
    nombre          VARCHAR(100) NOT NULL,
    telefono        VARCHAR(20),
    email           VARCHAR(100),
    direccion       VARCHAR(300),
    active          BOOLEAN NOT NULL DEFAULT TRUE,
    user_account_id UUID UNIQUE,
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ventas (
    id                 UUID PRIMARY KEY,
    cliente_id         UUID REFERENCES clientes(id),
    vendedor_id        UUID NOT NULL,
    total              DECIMAL(12,2) NOT NULL DEFAULT 0,
    estado             VARCHAR(20) NOT NULL DEFAULT 'COMPLETADA',
    stripe_session_id  VARCHAR(200),
    created_at         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_venta_estado CHECK (estado IN ('PENDIENTE', 'PAGADA', 'COMPLETADA', 'ANULADA'))
);

CREATE TABLE IF NOT EXISTS venta_detalle (
    id               UUID PRIMARY KEY,
    venta_id         UUID NOT NULL REFERENCES ventas(id) ON DELETE CASCADE,
    product_id       UUID NOT NULL,
    cantidad         INTEGER NOT NULL,
    precio_unitario  DECIMAL(10,2) NOT NULL,
    subtotal         DECIMAL(10,2) NOT NULL,
    -- Fase 2c: snapshot del artesano al momento de la compra. Nullable para
    -- productos sin artesano (puramente de stock) y para ventas viejas.
    artesano_id      UUID
);

-- Migraciones idempotentes para bases existentes (Fase 2a)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
         WHERE table_name = 'clientes' AND column_name = 'user_account_id'
    ) THEN
        ALTER TABLE clientes ADD COLUMN user_account_id UUID;
        -- UNIQUE por separado para no romper si ya existe
        BEGIN
            ALTER TABLE clientes ADD CONSTRAINT clientes_user_account_id_uq UNIQUE (user_account_id);
        EXCEPTION WHEN duplicate_object THEN
            NULL;
        END;
    END IF;

    -- Ampliar el CHECK de estado para aceptar PENDIENTE y PAGADA
    BEGIN
        ALTER TABLE ventas DROP CONSTRAINT IF EXISTS chk_venta_estado;
        ALTER TABLE ventas ADD CONSTRAINT chk_venta_estado
            CHECK (estado IN ('PENDIENTE', 'PAGADA', 'COMPLETADA', 'ANULADA'));
    EXCEPTION WHEN others THEN
        NULL;
    END;

    -- Fase 2b: columna para el Checkout Session ID de Stripe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
         WHERE table_name = 'ventas' AND column_name = 'stripe_session_id'
    ) THEN
        ALTER TABLE ventas ADD COLUMN stripe_session_id VARCHAR(200);
        CREATE INDEX IF NOT EXISTS ix_ventas_stripe_session_id
            ON ventas(stripe_session_id)
            WHERE stripe_session_id IS NOT NULL;
    END IF;

    -- Fase 2c: snapshot del artesano por linea (multi-maestro por venta).
    -- Nullable: productos sin artesano o ventas viejas quedan con NULL.
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
         WHERE table_name = 'venta_detalle' AND column_name = 'artesano_id'
    ) THEN
        ALTER TABLE venta_detalle ADD COLUMN artesano_id UUID;
        CREATE INDEX IF NOT EXISTS ix_venta_detalle_artesano_id
            ON venta_detalle(artesano_id)
            WHERE artesano_id IS NOT NULL;
    END IF;

    -- Fase 2c: vendedor_id ahora nullable para ventas de marketplace
    -- multi-maestro (si no querés atribuirle la venta a un "vendedor" especifico).
    -- En 2b/2a ya se guardaba el userAccountId del cliente ahi; esto no rompe
    -- nada, solo habilita que futuras ventas puedan dejarlo NULL.
    BEGIN
        ALTER TABLE ventas ALTER COLUMN vendedor_id DROP NOT NULL;
    EXCEPTION WHEN others THEN
        NULL;
    END;
END $$;
