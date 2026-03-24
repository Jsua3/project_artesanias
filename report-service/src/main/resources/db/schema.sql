CREATE TABLE IF NOT EXISTS movement_logs (
    id UUID PRIMARY KEY,
    product_id UUID NOT NULL,
    quantity INTEGER NOT NULL,
    type VARCHAR(10) NOT NULL,
    performed_by UUID NOT NULL,
    timestamp TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS stock_snapshots (
    product_id UUID PRIMARY KEY,
    current_quantity INTEGER NOT NULL DEFAULT 0,
    last_updated TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
