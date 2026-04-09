CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS artesanos (
    id UUID PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    telefono VARCHAR(20),
    email VARCHAR(100),
    especialidad VARCHAR(100),
    ubicacion VARCHAR(200),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    sku VARCHAR(100) UNIQUE NOT NULL,
    price DECIMAL(19, 2) NOT NULL,
    image_url VARCHAR(500),
    stock_minimo INTEGER NOT NULL DEFAULT 5,
    category_id UUID NOT NULL,
    artesano_id UUID,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_category FOREIGN KEY (category_id) REFERENCES categories(id),
    CONSTRAINT fk_artesano FOREIGN KEY (artesano_id) REFERENCES artesanos(id)
);

-- Default artesanía categories
INSERT INTO categories (id, name, description, active) VALUES
    ('a0000000-0000-0000-0000-000000000001', 'Cerámica', 'Piezas de barro y cerámica artesanal', true),
    ('a0000000-0000-0000-0000-000000000002', 'Textil', 'Tejidos, bordados y productos de tela', true),
    ('a0000000-0000-0000-0000-000000000003', 'Madera', 'Tallados, muebles y objetos de madera', true),
    ('a0000000-0000-0000-0000-000000000004', 'Joyería', 'Anillos, collares, pulseras y aretes artesanales', true),
    ('a0000000-0000-0000-0000-000000000005', 'Cuero', 'Productos de cuero trabajado a mano', true),
    ('a0000000-0000-0000-0000-000000000006', 'Vidrio', 'Piezas de vidrio soplado y decorativo', true),
    ('a0000000-0000-0000-0000-000000000007', 'Metal', 'Herrería artística y objetos de metal', true),
    ('a0000000-0000-0000-0000-000000000008', 'Pintura', 'Cuadros, murales y arte pintado a mano', true)
ON CONFLICT (id) DO NOTHING;
