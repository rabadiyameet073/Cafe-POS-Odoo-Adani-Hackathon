INSERT INTO floors (
    id,
    name,
    description,
    display_order,
    is_active,
    created_by,
    created_at,
    updated_at
) VALUES
(
    gen_random_uuid(),
    'Ground Floor',
    'Main dining area with maximum seating and cashier counter',
    1,
    true,
    NULL,
    NOW(),
    NOW()
),
(
    gen_random_uuid(),
    'First Floor',
    'Quiet seating area suitable for families and groups',
    2,
    true,
    NULL,
    NOW(),
    NOW()
),
(
    gen_random_uuid(),
    'Terrace',
    'Open-air rooftop seating with city view',
    3,
    true,
    NULL,
    NOW(),
    NOW()
);

INSERT INTO tables (floor_id, table_number, seats, status, is_active, qr_code_token)
SELECT id, 'G-1', 4, 'available', true, 'GF-T1' FROM floors WHERE name = 'Ground Floor';
INSERT INTO tables (floor_id, table_number, seats, status, is_active, qr_code_token)
SELECT id, 'G-2', 4, 'available', true, 'GF-T2' FROM floors WHERE name = 'Ground Floor';
INSERT INTO tables (floor_id, table_number, seats, status, is_active, qr_code_token)
SELECT id, 'G-3', 2, 'available', true, 'GF-T3' FROM floors WHERE name = 'Ground Floor';
INSERT INTO tables (floor_id, table_number, seats, status, is_active, qr_code_token)
SELECT id, 'G-4', 6, 'available', true, 'GF-T4' FROM floors WHERE name = 'Ground Floor';
INSERT INTO tables (floor_id, table_number, seats, status, is_active, qr_code_token)
SELECT id, 'G-5', 4, 'available', true, 'GF-T5' FROM floors WHERE name = 'Ground Floor';
INSERT INTO tables (floor_id, table_number, seats, status, is_active, qr_code_token)
SELECT id, 'G-6', 2, 'available', true, 'GF-T6' FROM floors WHERE name = 'Ground Floor';
INSERT INTO tables (floor_id, table_number, seats, status, is_active, qr_code_token)
SELECT id, 'G-7', 8, 'available', true, 'GF-T7' FROM floors WHERE name = 'Ground Floor';
INSERT INTO tables (floor_id, table_number, seats, status, is_active, qr_code_token)
SELECT id, 'G-8', 4, 'available', true, 'GF-T8' FROM floors WHERE name = 'Ground Floor';
INSERT INTO tables (floor_id, table_number, seats, status, is_active, qr_code_token)
SELECT id, 'G-9', 2, 'available', true, 'GF-T9' FROM floors WHERE name = 'Ground Floor';

INSERT INTO tables (floor_id, table_number, seats, status, is_active, qr_code_token)
SELECT id, 'F-1', 4, 'available', true, 'FF-T1' FROM floors WHERE name = 'First Floor';
INSERT INTO tables (floor_id, table_number, seats, status, is_active, qr_code_token)
SELECT id, 'F-2', 4, 'available', true, 'FF-T2' FROM floors WHERE name = 'First Floor';
INSERT INTO tables (floor_id, table_number, seats, status, is_active, qr_code_token)
SELECT id, 'F-3', 6, 'available', true, 'FF-T3' FROM floors WHERE name = 'First Floor';
INSERT INTO tables (floor_id, table_number, seats, status, is_active, qr_code_token)
SELECT id, 'F-4', 2, 'available', true, 'FF-T4' FROM floors WHERE name = 'First Floor';
INSERT INTO tables (floor_id, table_number, seats, status, is_active, qr_code_token)
SELECT id, 'F-5', 8, 'available', true, 'FF-T5' FROM floors WHERE name = 'First Floor';
INSERT INTO tables (floor_id, table_number, seats, status, is_active, qr_code_token)
SELECT id, 'F-6', 4, 'available', true, 'FF-T6' FROM floors WHERE name = 'First Floor';
INSERT INTO tables (floor_id, table_number, seats, status, is_active, qr_code_token)
SELECT id, 'F-7', 2, 'available', true, 'FF-T7' FROM floors WHERE name = 'First Floor';
INSERT INTO tables (floor_id, table_number, seats, status, is_active, qr_code_token)
SELECT id, 'F-8', 6, 'available', true, 'FF-T8' FROM floors WHERE name = 'First Floor';
INSERT INTO tables (floor_id, table_number, seats, status, is_active, qr_code_token)
SELECT id, 'F-9', 4, 'available', true, 'FF-T9' FROM floors WHERE name = 'First Floor';
INSERT INTO tables (floor_id, table_number, seats, status, is_active, qr_code_token)
SELECT id, 'F-10', 2, 'available', true, 'FF-T10' FROM floors WHERE name = 'First Floor';
INSERT INTO tables (floor_id, table_number, seats, status, is_active, qr_code_token)
SELECT id, 'F-11', 4, 'available', true, 'FF-T11' FROM floors WHERE name = 'First Floor';

INSERT INTO tables (floor_id, table_number, seats, status, is_active, qr_code_token)
SELECT id, 'T-1', 4, 'available', true, 'TR-T1' FROM floors WHERE name = 'Terrace';
INSERT INTO tables (floor_id, table_number, seats, status, is_active, qr_code_token)
SELECT id, 'T-2', 2, 'available', true, 'TR-T2' FROM floors WHERE name = 'Terrace';
INSERT INTO tables (floor_id, table_number, seats, status, is_active, qr_code_token)
SELECT id, 'T-3', 6, 'available', true, 'TR-T3' FROM floors WHERE name = 'Terrace';
INSERT INTO tables (floor_id, table_number, seats, status, is_active, qr_code_token)
SELECT id, 'T-4', 4, 'available', true, 'TR-T4' FROM floors WHERE name = 'Terrace';
INSERT INTO tables (floor_id, table_number, seats, status, is_active, qr_code_token)
SELECT id, 'T-5', 8, 'available', true, 'TR-T5' FROM floors WHERE name = 'Terrace';
INSERT INTO tables (floor_id, table_number, seats, status, is_active, qr_code_token)
SELECT id, 'T-6', 2, 'available', true, 'TR-T6' FROM floors WHERE name = 'Terrace';
INSERT INTO tables (floor_id, table_number, seats, status, is_active, qr_code_token)
SELECT id, 'T-7', 4, 'available', true, 'TR-T7' FROM floors WHERE name = 'Terrace';

INSERT INTO payment_methods (id, name, display_name, is_enabled, upi_id, config, created_at, updated_at)
VALUES
    (gen_random_uuid(), 'cash', 'Cash', true, NULL, NULL, NOW(), NOW()),
    (gen_random_uuid(), 'upi_qr', 'UPI / QR Code', true, 'odoocafe@upi', '{"merchant_name": "odoocafe"}', NOW(), NOW()),
    (gen_random_uuid(), 'card', 'Card', true, NULL, NULL, NOW(), NOW());

INSERT INTO payment_methods (id, name, display_name, is_enabled, upi_id, config, created_at, updated_at)
VALUES
    (gen_random_uuid(), 'cash', 'Cash', true, NULL, NULL, NOW(), NOW()),
    (gen_random_uuid(), 'upi_qr', 'UPI / QR Code', true, 'odoocafe@upi', '{"merchant_name": "odoocafe"}', NOW(), NOW()),
    (gen_random_uuid(), 'card', 'Card', true, NULL, NULL, NOW(), NOW());