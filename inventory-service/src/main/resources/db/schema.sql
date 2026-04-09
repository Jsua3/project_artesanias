CREATE TABLE IF NOT EXISTS stocks (
    product_id UUID PRIMARY KEY,
    quantity INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS stock_entries (
    id UUID PRIMARY KEY,
    product_id UUID NOT NULL,
    quantity INTEGER NOT NULL,
    notes TEXT,
    performed_by UUID NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS stock_exits (
    id UUID PRIMARY KEY,
    product_id UUID NOT NULL,
    quantity INTEGER NOT NULL,
    notes TEXT,
    performed_by UUID NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS clientes (
    id UUID PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    telefono VARCHAR(20),
    email VARCHAR(100),
    direccion VARCHAR(300),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ventas (
    id UUID PRIMARY KEY,
    cliente_id UUID REFERENCES clientes(id),
    vendedor_id UUID NOT NULL,
    total DECIMAL(12,2) NOT NULL DEFAULT 0,
    estado VARCHAR(20) NOT NULL DEFAULT 'COMPLETADA',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS venta_detalle (
    id UUID PRIMARY KEY,
    venta_id UUID NOT NULL REFERENCES ventas(id) ON DELETE CASCADE,
    product_id UUID NOT NULL,
    cantidad INTEGER NOT NULL,
    precio_unitario DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL
);
