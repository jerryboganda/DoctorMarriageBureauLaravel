-- ============================================================================
-- 000004: Ensure standard admin accounts exist and password is set to 123123123
-- Bcrypt Hash for 123123123: $2b$10$/UvSOA7AwlOpz5HlSEoD5eFuGUkGdOFwAThFp2EMj1rzn6a/RUim6
-- Idempotent: safe to run repeatedly without ON CONFLICT
-- ============================================================================

-- 1. Update any existing users with email admin@admin.com
UPDATE users 
SET password = '$2b$10$/UvSOA7AwlOpz5HlSEoD5eFuGUkGdOFwAThFp2EMj1rzn6a/RUim6',
    user_type = 'admin',
    membership = 3,
    approved = true,
    blocked = false,
    deactivated = false,
    updated_at = NOW()
WHERE LOWER(email) = 'admin@admin.com';

-- 2. Insert admin@admin.com if not exists
INSERT INTO users (
    first_name, last_name, name, email, phone, password, user_type, membership, 
    approved, blocked, deactivated, photo, photo_approved, email_verified_at, created_at, updated_at
)
SELECT 'Admin', 'Administrator', 'Super Administrator', 'admin@admin.com', '03001234567',
       '$2b$10$/UvSOA7AwlOpz5HlSEoD5eFuGUkGdOFwAThFp2EMj1rzn6a/RUim6',
       'admin', 3, true, false, false, '', 1, NOW(), NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE LOWER(email) = 'admin@admin.com');

-- 3. Update or insert dev-admin@panel.doctormarriagebureau.com.pk
UPDATE users 
SET password = '$2b$10$/UvSOA7AwlOpz5HlSEoD5eFuGUkGdOFwAThFp2EMj1rzn6a/RUim6',
    user_type = 'admin',
    membership = 3,
    approved = true,
    blocked = false,
    deactivated = false,
    updated_at = NOW()
WHERE LOWER(email) = 'dev-admin@panel.doctormarriagebureau.com.pk';

INSERT INTO users (
    first_name, last_name, name, email, phone, password, user_type, membership, 
    approved, blocked, deactivated, photo, photo_approved, email_verified_at, created_at, updated_at
)
SELECT 'Developer', 'Admin', 'Developer Testing Account', 'dev-admin@panel.doctormarriagebureau.com.pk', '03000000000',
       '$2b$10$/UvSOA7AwlOpz5HlSEoD5eFuGUkGdOFwAThFp2EMj1rzn6a/RUim6',
       'admin', 3, true, false, false, '', 1, NOW(), NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE LOWER(email) = 'dev-admin@panel.doctormarriagebureau.com.pk');

-- 4. Update developer@hospital.org and known test accounts to also have password 123123123
UPDATE users 
SET password = '$2b$10$/UvSOA7AwlOpz5HlSEoD5eFuGUkGdOFwAThFp2EMj1rzn6a/RUim6',
    user_type = 'admin',
    membership = 3,
    approved = true,
    blocked = false,
    deactivated = false,
    updated_at = NOW()
WHERE LOWER(email) IN ('developer@hospital.org', 'supervisor@dmb.com.pk');
