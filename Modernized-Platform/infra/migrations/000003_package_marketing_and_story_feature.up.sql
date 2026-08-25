-- ============================================================================
-- 000003: Package marketing fields + happy_story feature flag
-- Idempotent: safe to run repeatedly (IF NOT EXISTS)
-- ============================================================================

ALTER TABLE happy_stories ADD COLUMN IF NOT EXISTS is_featured BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE packages ADD COLUMN IF NOT EXISTS badge_color VARCHAR(32);
ALTER TABLE packages ADD COLUMN IF NOT EXISTS tagline TEXT;
ALTER TABLE packages ADD COLUMN IF NOT EXISTS perks JSONB DEFAULT '[]'::jsonb;
ALTER TABLE packages ADD COLUMN IF NOT EXISTS is_featured BOOLEAN NOT NULL DEFAULT FALSE;
