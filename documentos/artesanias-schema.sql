-- ============================================================
-- SCHEMA: Sistema de Inventario de Artesanías
-- Base de datos: vetdb (PostgreSQL 15)
-- ============================================================
-- Este archivo se ejecuta automáticamente al iniciar la app
-- gracias al ConnectionFactoryInitializer en MainR2dbcConfig.
-- ============================================================

-- ========================
-- CATEGORÍAS
-- ========================
CREATE TABLE IF NOT EXISTS categorias (
    id          BIGSERIAL PRIMARY KEY,
    nombre      VARCHAR(100) NOT NULL UNIQUE,
    descripcion TEXT,
    activo      BOOLEAN NOT NULL DEFAULT TRUE
);

-- ========================
-- ARTESANOS (proveedores)
-- ========================
CREATE TABLE IF NOT EXISTS artesanos (
    id           BIGSERIAL PRIMARY KEY,
    nombre       VARCHAR(100) NOT NULL,
    telefono     VARCHAR(20),
    email        VARCHAR(100),
    especialidad VARCHAR(100),
    ubicacion    VARCHAR(200),
    activo       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at   TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ========================
-- ARTESANÍAS (productos)
-- ========================
CREATE TABLE IF NOT EXISTS artesanias (
    id            BIGSERIAL PRIMARY KEY,
    nombre        VARCHAR(150) NOT NULL,
    descripcion   TEXT,
    precio        DECIMAL(10,2) NOT NULL CHECK (precio >= 0),
    stock         INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
    stock_minimo  INTEGER NOT NULL DEFAULT 5,
    imagen_url    VARCHAR(500),
    categoria_id  BIGINT REFERENCES categorias(id),
    artesano_id   BIGINT REFERENCES artesanos(id),
    activo        BOOLEAN NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_artesanias_categoria ON artesanias(categoria_id);
CREATE INDEX IF NOT EXISTS idx_artesanias_artesano ON artesanias(artesano_id);
CREATE INDEX IF NOT EXISTS idx_artesanias_activo ON artesanias(activo);

-- ========================
-- CLIENTES
-- ========================
CREATE TABLE IF NOT EXISTS clientes (
    id         BIGSERIAL PRIMARY KEY,
    nombre     VARCHAR(100) NOT NULL,
    telefono   VARCHAR(20),
    email      VARCHAR(100),
    direccion  VARCHAR(300),
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ========================
-- VENTAS
-- ========================
CREATE TABLE IF NOT EXISTS ventas (
    id         BIGSERIAL PRIMARY KEY,
    cliente_id BIGINT REFERENCES clientes(id),
    usuario_id BIGINT NOT NULL,  -- FK lógica a authdb.usuarios
    total      DECIMAL(12,2) NOT NULL DEFAULT 0 CHECK (total >= 0),
    estado     VARCHAR(20) NOT NULL DEFAULT 'COMPLETADA',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_venta_estado CHECK (estado IN ('COMPLETADA', 'ANULADA'))
);

CREATE INDEX IF NOT EXISTS idx_ventas_cliente ON ventas(cliente_id);
CREATE INDEX IF NOT EXISTS idx_ventas_estado ON ventas(estado);
CREATE INDEX IF NOT EXISTS idx_ventas_fecha ON ventas(created_at);

-- ========================
-- DETALLE DE VENTA
-- ========================
CREATE TABLE IF NOT EXISTS venta_detalle (
    id              BIGSERIAL PRIMARY KEY,
    venta_id        BIGINT NOT NULL REFERENCES ventas(id) ON DELETE CASCADE,
    artesania_id    BIGINT NOT NULL REFERENCES artesanias(id),
    cantidad        INTEGER NOT NULL CHECK (cantidad > 0),
    precio_unitario DECIMAL(10,2) NOT NULL CHECK (precio_unitario >= 0),
    subtotal        DECIMAL(10,2) NOT NULL CHECK (subtotal >= 0)
);

CREATE INDEX IF NOT EXISTS idx_venta_detalle_venta ON venta_detalle(venta_id);
CREATE INDEX IF NOT EXISTS idx_venta_detalle_artesania ON venta_detalle(artesania_id);

-- ========================
-- MOVIMIENTOS DE INVENTARIO (auditoría)
-- ========================
CREATE TABLE IF NOT EXISTS movimientos_inventario (
    id             BIGSERIAL PRIMARY KEY,
    artesania_id   BIGINT NOT NULL REFERENCES artesanias(id),
    tipo           VARCHAR(20) NOT NULL,
    cantidad       INTEGER NOT NULL,
    stock_anterior INTEGER NOT NULL,
    stock_nuevo    INTEGER NOT NULL,
    motivo         VARCHAR(300),
    usuario_id     BIGINT NOT NULL,  -- FK lógica a authdb.usuarios
    venta_id       BIGINT REFERENCES ventas(id),
    created_at     TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_movimiento_tipo CHECK (tipo IN ('ENTRADA', 'SALIDA', 'VENTA', 'ANULACION'))
);

CREATE INDEX IF NOT EXISTS idx_movimientos_artesania ON movimientos_inventario(artesania_id);
CREATE INDEX IF NOT EXISTS idx_movimientos_tipo ON movimientos_inventario(tipo);
CREATE INDEX IF NOT EXISTS idx_movimientos_fecha ON movimientos_inventario(created_at);
CREATE INDEX IF NOT EXISTS idx_movimientos_usuario ON movimientos_inventario(usuario_id);

-- ============================================================
-- DATOS DE EJEMPLO (categorías iniciales)
-- ============================================================
INSERT INTO categorias (nombre, descripcion) VALUES
    ('Cerámica', 'Piezas de barro y cerámica artesanal'),
    ('Textil', 'Tejidos, bordados y productos de tela'),
    ('Madera', 'Tallados, muebles y objetos de madera'),
    ('Joyería', 'Anillos, collares, pulseras y aretes artesanales'),
    ('Cuero', 'Productos de cuero trabajado a mano'),
    ('Vidrio', 'Piezas de vidrio soplado y decorativo'),
    ('Metal', 'Herrería artística y objetos de metal'),
    ('Pintura', 'Cuadros, murales y arte pintado a mano')
ON CONFLICT (nombre) DO NOTHING;
