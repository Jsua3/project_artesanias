-- ============================================================================
-- Seed catalog_db
-- ============================================================================
-- Insertado desde seed.sh con :maestro_id como la UUID del user_account del
-- maestro. Todas las inserciones son idempotentes via ON CONFLICT.
-- ============================================================================

-- 1. Categoría de ejemplo
INSERT INTO categories (id, name, description, active) VALUES
    ('11111111-1111-1111-1111-111111111111', 'Cerámica', 'Piezas de cerámica artesanal', TRUE),
    ('11111111-1111-1111-1111-111111111112', 'Textiles', 'Tejidos y bordados a mano',  TRUE)
ON CONFLICT (id) DO NOTHING;

-- 2. Artesano de ejemplo, linkeado al user_account del maestro.
--    Si el artesano ya existe, actualizamos el user_account_id para
--    mantener el link.
INSERT INTO artesanos (id, nombre, telefono, email, especialidad, ubicacion,
                        image_url, active, user_account_id)
VALUES (
    '22222222-2222-2222-2222-222222222222',
    'María Fernández',
    '+57 300 0000000',
    'maria@example.com',
    'Cerámica tradicional',
    'Ráquira, Boyacá',
    NULL,
    TRUE,
    :maestro_id::uuid
)
ON CONFLICT (id) DO UPDATE
    SET user_account_id = EXCLUDED.user_account_id;

-- 3. Productos del artesano (3 items con precios en COP)
INSERT INTO products (id, name, sku, description, price, image_url, stock_minimo,
                      category_id, artesano_id, active)
VALUES
    ('33333333-3333-3333-3333-333333333331',
     'Jarrón de barro chulo',
     'CER-001',
     'Jarrón decorativo hecho a mano en barro cocido.',
     85000, NULL, 5,
     '11111111-1111-1111-1111-111111111111',
     '22222222-2222-2222-2222-222222222222',
     TRUE),

    ('33333333-3333-3333-3333-333333333332',
     'Cuenco rústico pequeño',
     'CER-002',
     'Cuenco de cerámica esmaltada para servir.',
     45000, NULL, 5,
     '11111111-1111-1111-1111-111111111111',
     '22222222-2222-2222-2222-222222222222',
     TRUE),

    ('33333333-3333-3333-3333-333333333333',
     'Ruana tejida en lana',
     'TEX-001',
     'Ruana 100% lana virgen, tejida en telar de guanga.',
     180000, NULL, 2,
     '11111111-1111-1111-1111-111111111112',
     '22222222-2222-2222-2222-222222222222',
     TRUE)
ON CONFLICT (id) DO NOTHING;
