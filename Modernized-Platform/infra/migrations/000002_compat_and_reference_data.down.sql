-- Rollback for 000002 (drops compat columns; seeded reference data left in place)

DROP INDEX IF EXISTS addresses_user_type_unique;

ALTER TABLE gallery_images DROP COLUMN IF EXISTS blurred_url;
ALTER TABLE spiritual_backgrounds DROP COLUMN IF EXISTS gothra;
ALTER TABLE families DROP COLUMN IF EXISTS family_type;
ALTER TABLE field_visibility_settings DROP COLUMN IF EXISTS is_anonymous;
ALTER TABLE members DROP COLUMN IF EXISTS known_languages;
ALTER TABLE members DROP COLUMN IF EXISTS travel_expires_at;
ALTER TABLE chats DROP COLUMN IF EXISTS is_biodata_share;
ALTER TABLE express_interests DROP COLUMN IF EXISTS chat_thread_id;
ALTER TABLE express_interests DROP COLUMN IF EXISTS decline_reason;
ALTER TABLE express_interests DROP COLUMN IF EXISTS message;
