CREATE TABLE IF NOT EXISTS custom_design_requests (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    title VARCHAR(180) NOT NULL,
    product_type VARCHAR(60) NOT NULL,
    status VARCHAR(40) NOT NULL DEFAULT 'PENDING_QUOTE',
    spec_json TEXT NOT NULL,
    price_breakdown_json TEXT NOT NULL,
    estimated_price NUMERIC(12, 2) NOT NULL,
    estimated_days INTEGER NOT NULL,
    customer_notes TEXT,
    review_notes TEXT,
    preview_prompt TEXT,
    preview_image_base64 TEXT,
    preview_mime_type VARCHAR(80),
    preview_source VARCHAR(40),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE custom_design_requests
    ADD COLUMN IF NOT EXISTS review_notes TEXT;

ALTER TABLE custom_design_requests
    ADD COLUMN IF NOT EXISTS preview_prompt TEXT;

ALTER TABLE custom_design_requests
    ADD COLUMN IF NOT EXISTS preview_image_base64 TEXT;

ALTER TABLE custom_design_requests
    ADD COLUMN IF NOT EXISTS preview_mime_type VARCHAR(80);

ALTER TABLE custom_design_requests
    ADD COLUMN IF NOT EXISTS preview_source VARCHAR(40);

CREATE INDEX IF NOT EXISTS idx_custom_design_requests_user_id
    ON custom_design_requests(user_id);

CREATE INDEX IF NOT EXISTS idx_custom_design_requests_status
    ON custom_design_requests(status);

CREATE TABLE IF NOT EXISTS custom_design_notifications (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    design_id UUID NOT NULL,
    title VARCHAR(180) NOT NULL,
    message TEXT NOT NULL,
    status VARCHAR(40) NOT NULL,
    read_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_custom_design_notifications_user_id
    ON custom_design_notifications(user_id);

CREATE INDEX IF NOT EXISTS idx_custom_design_notifications_unread
    ON custom_design_notifications(user_id, read_at);
