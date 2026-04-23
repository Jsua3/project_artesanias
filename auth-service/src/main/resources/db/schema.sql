CREATE TABLE IF NOT EXISTS user_accounts (
    id UUID PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,
    approval_status VARCHAR(30) NOT NULL DEFAULT 'APPROVED',
    courier_mode VARCHAR(30),
    courier_company VARCHAR(150),
    display_name VARCHAR(100),
    avatar_url TEXT,
    created_at TIMESTAMP NOT NULL,
    approved_at TIMESTAMP,
    approved_by UUID
);

CREATE TABLE IF NOT EXISTS refresh_tokens (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    token VARCHAR(255) NOT NULL,
    expiry_date TIMESTAMP NOT NULL,
    CONSTRAINT fk_user_id FOREIGN KEY (user_id) REFERENCES user_accounts(id)
);

-- Migration: add columns if they don't exist (safe for existing DBs)
ALTER TABLE user_accounts ADD COLUMN IF NOT EXISTS approval_status VARCHAR(30) NOT NULL DEFAULT 'APPROVED';
ALTER TABLE user_accounts ADD COLUMN IF NOT EXISTS courier_mode VARCHAR(30);
ALTER TABLE user_accounts ADD COLUMN IF NOT EXISTS courier_company VARCHAR(150);
ALTER TABLE user_accounts ADD COLUMN IF NOT EXISTS display_name VARCHAR(100);
ALTER TABLE user_accounts ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE user_accounts ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP;
ALTER TABLE user_accounts ADD COLUMN IF NOT EXISTS approved_by UUID;

UPDATE user_accounts
SET approval_status = 'APPROVED'
WHERE approval_status IS NULL;
