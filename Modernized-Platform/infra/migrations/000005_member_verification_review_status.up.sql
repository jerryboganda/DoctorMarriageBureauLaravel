-- Migration 000005: Member verification review status tracking
ALTER TABLE members ADD COLUMN IF NOT EXISTS verification_status VARCHAR(32) NOT NULL DEFAULT 'pending';
ALTER TABLE members ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
ALTER TABLE members ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;

-- Backfill verification_status for existing approved members
UPDATE members SET verification_status = 'approved' WHERE is_approved = true;
