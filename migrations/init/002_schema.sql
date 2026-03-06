-- 002: Core Schema

-- Auto-update trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

-- Tenants
CREATE TABLE tenants (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name       VARCHAR(255) NOT NULL,
    type       VARCHAR(50)  NOT NULL CHECK (type IN ('shipper','carrier','warehouse','government')),
    plan       VARCHAR(50)  DEFAULT 'standard',
    settings   JSONB        DEFAULT '{}',
    created_at TIMESTAMPTZ  DEFAULT NOW(),
    is_active  BOOLEAN      DEFAULT TRUE
);

-- Entities (trucks, drivers, warehouses, cargo)
CREATE TABLE entities (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id   UUID NOT NULL REFERENCES tenants(id),
    type        VARCHAR(50) NOT NULL CHECK (type IN ('truck','driver','warehouse','cargo','pallet','container')),
    external_id VARCHAR(255),
    epc         VARCHAR(255),
    metadata    JSONB NOT NULL DEFAULT '{}',
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_at  TIMESTAMPTZ DEFAULT NOW(),
    is_active   BOOLEAN DEFAULT TRUE
);
CREATE INDEX idx_entities_tenant_type ON entities(tenant_id, type);
CREATE INDEX idx_entities_metadata    ON entities USING GIN(metadata);
CREATE TRIGGER entities_updated_at BEFORE UPDATE ON entities
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Telemetry (TimescaleDB hypertable)
CREATE TABLE telemetry (
    time             TIMESTAMPTZ  NOT NULL,
    entity_id        UUID         NOT NULL REFERENCES entities(id),
    tenant_id        UUID         NOT NULL REFERENCES tenants(id),
    location         GEOGRAPHY(POINT, 4326),
    h3_index_7       CHAR(15),
    h3_index_8       CHAR(15),
    speed_kmh        FLOAT,
    heading_deg      FLOAT,
    current_load_kg  FLOAT,
    current_load_m3  FLOAT,
    driver_id        UUID,
    driver_status    VARCHAR(20),
    raw_payload      JSONB,
    PRIMARY KEY (entity_id, time)
);
SELECT create_hypertable('telemetry', 'time', chunk_time_interval => INTERVAL '1 week', if_not_exists => TRUE);
CREATE INDEX idx_telemetry_entity ON telemetry(entity_id, time DESC);
CREATE INDEX idx_telemetry_h3     ON telemetry(h3_index_7, time DESC);

-- Shipments
CREATE TABLE shipments (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL REFERENCES tenants(id),
    shipper_id      UUID NOT NULL REFERENCES entities(id),
    epcis_event_id  VARCHAR(255) UNIQUE,
    origin          GEOGRAPHY(POINT, 4326),
    origin_address  VARCHAR(500),
    origin_h3_7     CHAR(15),
    destination     GEOGRAPHY(POINT, 4326),
    dest_address    VARCHAR(500),
    cargo_type      VARCHAR(100),
    cargo_desc      VARCHAR(500),
    weight_kg       FLOAT NOT NULL,
    volume_m3       FLOAT,
    value_jpy       BIGINT,
    pickup_from     TIMESTAMPTZ NOT NULL,
    pickup_to       TIMESTAMPTZ NOT NULL,
    delivery_by     TIMESTAMPTZ NOT NULL,
    status          VARCHAR(30) NOT NULL DEFAULT 'pending',
    matched_truck_id UUID REFERENCES entities(id),
    matched_at      TIMESTAMPTZ,
    source_platform VARCHAR(50) DEFAULT 'api_direct',
    source_ref_id   VARCHAR(255),
    ocr_job_id      UUID,
    est_co2_kg      FLOAT,
    actual_co2_kg   FLOAT,
    reward_jpy      BIGINT,
    notes           TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_shipments_status  ON shipments(status, tenant_id);
CREATE INDEX idx_shipments_pickup  ON shipments(pickup_from) WHERE status = 'pending';
CREATE INDEX idx_shipments_shipper ON shipments(shipper_id);
CREATE TRIGGER shipments_updated_at BEFORE UPDATE ON shipments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Match history
CREATE TABLE match_history (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shipment_id         UUID NOT NULL REFERENCES shipments(id),
    truck_id            UUID NOT NULL REFERENCES entities(id),
    driver_id           UUID REFERENCES entities(id),
    total_score         FLOAT NOT NULL,
    distance_score      FLOAT,
    load_factor_score   FLOAT,
    co2_score           FLOAT,
    driver_util_score   FLOAT,
    load_factor_before  FLOAT,
    load_factor_after   FLOAT,
    detour_km           FLOAT,
    est_co2_saved_kg    FLOAT,
    actual_co2_saved_kg FLOAT,
    algorithm_version   VARCHAR(20) DEFAULT 'h3-bitwise-v1',
    candidates_evaluated INTEGER,
    offer_sent_at       TIMESTAMPTZ DEFAULT NOW(),
    accepted_at         TIMESTAMPTZ,
    declined_at         TIMESTAMPTZ,
    timeout_at          TIMESTAMPTZ,
    outcome             VARCHAR(20),
    cascade_position    INTEGER DEFAULT 1,
    created_at          TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_match_history_shipment ON match_history(shipment_id);
CREATE INDEX idx_match_history_truck    ON match_history(truck_id);

-- OCR Jobs
CREATE TABLE ocr_jobs (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id        UUID NOT NULL REFERENCES tenants(id),
    sender_fax       VARCHAR(20),
    image_gcs_url    VARCHAR(500),
    content_type     VARCHAR(50),
    page_count       INTEGER DEFAULT 1,
    status           VARCHAR(30) DEFAULT 'queued',
    ocr_confidence   FLOAT,
    llm_confidence   FLOAT,
    final_confidence FLOAT,
    needs_review     BOOLEAN DEFAULT FALSE,
    extracted_fields JSONB,
    shipment_id      UUID REFERENCES shipments(id),
    queued_at        TIMESTAMPTZ DEFAULT NOW(),
    started_at       TIMESTAMPTZ,
    completed_at     TIMESTAMPTZ,
    review_deadline  TIMESTAMPTZ,
    reviewed_by      VARCHAR(100),
    reviewed_at      TIMESTAMPTZ,
    error_message    TEXT
);
CREATE INDEX idx_ocr_jobs_status ON ocr_jobs(status, tenant_id);
CREATE INDEX idx_ocr_jobs_review ON ocr_jobs(review_deadline) WHERE needs_review = TRUE;

-- Notifications
CREATE TABLE notifications (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    driver_id    UUID NOT NULL REFERENCES entities(id),
    tenant_id    UUID NOT NULL REFERENCES tenants(id),
    type         VARCHAR(30) NOT NULL,
    title        VARCHAR(255) NOT NULL,
    message      TEXT NOT NULL,
    read         BOOLEAN DEFAULT FALSE,
    action       VARCHAR(100),
    action_screen VARCHAR(50),
    action_data  JSONB DEFAULT '{}',
    created_at   TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_notifications_driver ON notifications(driver_id, read, created_at DESC);

-- Delivery photos
CREATE TABLE delivery_photos (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shipment_id UUID NOT NULL REFERENCES shipments(id),
    driver_id   UUID REFERENCES entities(id),
    url         VARCHAR(500) NOT NULL,
    type        VARCHAR(20) NOT NULL CHECK (type IN ('pickup','delivery','damage')),
    location    GEOGRAPHY(POINT, 4326),
    taken_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Carbon savings
CREATE TABLE carbon_savings (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shipment_id      UUID NOT NULL REFERENCES shipments(id) UNIQUE,
    driver_id        UUID REFERENCES entities(id),
    tenant_id        UUID NOT NULL REFERENCES tenants(id),
    baseline_kg_co2  FLOAT NOT NULL,
    actual_kg_co2    FLOAT NOT NULL,
    saved_kg_co2     FLOAT NOT NULL,
    credit_amount    FLOAT,
    credit_value_jpy FLOAT,
    route_km         FLOAT,
    load_factor      FLOAT,
    calculated_at    TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_carbon_driver ON carbon_savings(driver_id, calculated_at DESC);
CREATE INDEX idx_carbon_tenant ON carbon_savings(tenant_id, calculated_at DESC);

-- Driver certifications
CREATE TABLE driver_certifications (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    driver_id    UUID NOT NULL REFERENCES entities(id),
    name         VARCHAR(255) NOT NULL,
    status       VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active','expired','none')),
    expires      DATE,
    issued_at    DATE,
    document_url VARCHAR(500),
    created_at   TIMESTAMPTZ DEFAULT NOW(),
    updated_at   TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_certs_driver ON driver_certifications(driver_id);
CREATE TRIGGER certs_updated_at BEFORE UPDATE ON driver_certifications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
