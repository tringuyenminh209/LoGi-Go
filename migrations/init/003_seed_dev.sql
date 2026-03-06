-- 003: Development Seed Data

-- Tenant
INSERT INTO tenants (id, name, type, plan) VALUES
    ('11111111-0000-0000-0000-000000000001', 'テスト運送㈱', 'carrier', 'standard'),
    ('22222222-0000-0000-0000-000000000001', '田中商事㈱',   'shipper', 'standard');

-- Driver entity (田中太郎)
INSERT INTO entities (id, tenant_id, type, external_id, metadata) VALUES
    (
        'aaaaaaaa-0000-0000-0000-000000000001',
        '11111111-0000-0000-0000-000000000001',
        'driver',
        'driver-001',
        '{
            "name": "田中太郎",
            "email": "tanaka@logi-go.jp",
            "password_hash": "$2a$10$dummy_hash_for_dev",
            "truck_id": "bbbbbbbb-0000-0000-0000-000000000001",
            "rating": 4.8,
            "total_trips": 1247,
            "remaining_hours_this_month": 68.5,
            "fcm_token": "dev-fcm-token-tanaka",
            "certifications": ["大型", "冷蔵"],
            "language": "ja"
        }'::jsonb
    );

-- Truck entity
INSERT INTO entities (id, tenant_id, type, external_id, metadata) VALUES
    (
        'bbbbbbbb-0000-0000-0000-000000000001',
        '11111111-0000-0000-0000-000000000001',
        'truck',
        'truck-XY1234',
        '{
            "plate": "大阪11あ1234",
            "capacity_kg": 10000,
            "capacity_m3": 40,
            "current_load_kg": 3500,
            "current_load_m3": 12,
            "cargo_types": ["dry", "refrigerated"],
            "status": "available",
            "manufacturer": "HINO",
            "model": "レンジャー",
            "year": 2023
        }'::jsonb
    );

-- Pending shipments (for MatchScreen.tsx)
INSERT INTO shipments (id, tenant_id, shipper_id, origin_address, dest_address, cargo_type, cargo_desc, weight_kg, volume_m3, pickup_from, pickup_to, delivery_by, status, source_platform, reward_jpy, notes) VALUES
    (
        'cccccccc-0000-0000-0000-000000000001',
        '22222222-0000-0000-0000-000000000001',
        'aaaaaaaa-0000-0000-0000-000000000001',
        '大阪市中央区',
        '東京都港区',
        'dry',
        '精密機器',
        3500,
        12,
        NOW() + INTERVAL '2 hours',
        NOW() + INTERVAL '4 hours',
        NOW() + INTERVAL '1 day',
        'pending',
        'hacobell',
        85000,
        '精密機器のため振動注意。荷主立ち合い必要。'
    ),
    (
        'cccccccc-0000-0000-0000-000000000002',
        '22222222-0000-0000-0000-000000000001',
        'aaaaaaaa-0000-0000-0000-000000000001',
        '神戸市中央区',
        '名古屋市中区',
        'refrigerated',
        '生鮮食品',
        1200,
        8,
        NOW() + INTERVAL '1 hour',
        NOW() + INTERVAL '3 hours',
        NOW() + INTERVAL '18 hours',
        'pending',
        'fax_ocr',
        42000,
        '要冷蔵 5℃以下維持'
    );

-- Active delivery (for DeliveryScreen.tsx)
INSERT INTO shipments (id, tenant_id, shipper_id, origin_address, dest_address, cargo_type, cargo_desc, weight_kg, pickup_from, pickup_to, delivery_by, status, matched_truck_id, matched_at, source_platform, reward_jpy, est_co2_kg) VALUES
    (
        'dddddddd-0000-0000-0000-000000000001',
        '22222222-0000-0000-0000-000000000001',
        'aaaaaaaa-0000-0000-0000-000000000001',
        '大阪市中央区',
        '東京都港区',
        'dry',
        '精密機器',
        3500,
        NOW() - INTERVAL '2 hours',
        NOW() - INTERVAL '1 hour',
        NOW() + INTERVAL '22 hours',
        'in_transit',
        'bbbbbbbb-0000-0000-0000-000000000001',
        NOW() - INTERVAL '1.5 hours',
        'hacobell',
        85000,
        82.3
    );

-- Sample notifications
INSERT INTO notifications (driver_id, tenant_id, type, title, message, action, action_screen, action_data) VALUES
    (
        'aaaaaaaa-0000-0000-0000-000000000001',
        '11111111-0000-0000-0000-000000000001',
        'match',
        '新着マッチ提案',
        '大阪→東京 精密機器 85,000円 スコア92%',
        'マッチ詳細を確認',
        'match',
        '{"match_id": "cccccccc-0000-0000-0000-000000000001"}'::jsonb
    ),
    (
        'aaaaaaaa-0000-0000-0000-000000000001',
        '11111111-0000-0000-0000-000000000001',
        'carbon',
        'CO₂削減達成',
        '今月のCO₂削減量が280kgを達成しました！',
        'ダッシュボードを見る',
        'carbon',
        '{}'::jsonb
    );

-- Driver certifications
INSERT INTO driver_certifications (driver_id, name, status, expires) VALUES
    ('aaaaaaaa-0000-0000-0000-000000000001', '大型自動車免許',    'active',  '2028-03-15'),
    ('aaaaaaaa-0000-0000-0000-000000000001', '冷蔵・冷凍車資格',   'active',  '2026-12-31'),
    ('aaaaaaaa-0000-0000-0000-000000000001', 'フォークリフト免許',  'active',  '2027-06-30'),
    ('aaaaaaaa-0000-0000-0000-000000000001', '危険物取扱者乙4種',  'expired', '2024-01-15');

-- Carbon savings for dashboard
INSERT INTO carbon_savings (shipment_id, driver_id, tenant_id, baseline_kg_co2, actual_kg_co2, saved_kg_co2, credit_amount, credit_value_jpy, route_km, load_factor) VALUES
    ('dddddddd-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000001', 107.5, 82.3, 25.2, 0.0252, 75.6, 512, 0.89);
