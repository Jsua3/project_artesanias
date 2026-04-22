-- ============================================================================
-- Seed inventory_db
-- ============================================================================
-- Insertado desde seed.sh con :cliente_id como UUID del user_account del
-- cliente final. Inserciones idempotentes.
-- ============================================================================

-- 1. Fila de cliente linkeada al user_account del cliente. Sin este registro,
--    la primera compra crearía uno automáticamente, pero mantener la fila
--    fija simplifica el smoke test.
INSERT INTO clientes (id, nombre, telefono, email, direccion, active,
                      user_account_id)
VALUES (
    '44444444-4444-4444-4444-444444444444',
    'Cliente Seed',
    '+57 300 9999999',
    'cliente.seed@example.com',
    'Cra 7 # 100-00, Bogotá',
    TRUE,
    :cliente_id::uuid
)
ON CONFLICT (id) DO UPDATE
    SET user_account_id = EXCLUDED.user_account_id;

-- 2. Stock inicial de los 3 productos seedados en catalog_db.
--    Si ya hay stock (p.ej. por compras previas), no lo tocamos.
INSERT INTO stocks (product_id, quantity) VALUES
    ('33333333-3333-3333-3333-333333333331', 20),
    ('33333333-3333-3333-3333-333333333332', 50),
    ('33333333-3333-3333-3333-333333333333',  8)
ON CONFLICT (product_id) DO NOTHING;

-- 3. (Opcional) Registrar entradas iniciales para mantener historial visible
--    en /api/entries. No afectan el stock actual; es solo traza.
INSERT INTO stock_entries (id, product_id, quantity, notes, performed_by, created_at)
VALUES
    ('55555555-5555-5555-5555-555555555551',
     '33333333-3333-3333-3333-333333333331', 20, 'Seed inicial', :cliente_id::uuid, CURRENT_TIMESTAMP),
    ('55555555-5555-5555-5555-555555555552',
     '33333333-3333-3333-3333-333333333332', 50, 'Seed inicial', :cliente_id::uuid, CURRENT_TIMESTAMP),
    ('55555555-5555-5555-5555-555555555553',
     '33333333-3333-3333-3333-333333333333',  8, 'Seed inicial', :cliente_id::uuid, CURRENT_TIMESTAMP)
ON CONFLICT (id) DO NOTHING;
