-- ============================================================================
-- 000004: Ensure standard admin accounts exist and password is set to 123123123
-- Bcrypt Hash for 123123123: $2b$10$/UvSOA7AwlOpz5HlSEoD5eFuGUkGdOFwAThFp2EMj1rzn6a/RUim6
-- Idempotent: safe to run repeatedly
-- ============================================================================

-- 1. Insert or update admin@admin.com with password 123123123
INSERT INTO users (
    first_name, last_name, name, email, phone, password, user_type, membership, 
    approved, blocked, deactivated, photo, photo_approved, email_verified_at, created_at, updated_at
) VALUES (
    'Admin', 'Administrator', 'Super Administrator', 'admin@admin.com', '03001234567',
    '$2b$10$/UvSOA7AwlOpz5HlSEoD5eFuGUkGdOFwAThFp2EMj1rzn6a/RUim6',
    'admin', 3, true, false, false, '', 1, NOW(), NOW(), NOW()
)
ON CONFLICT (email) DO UPDATE SET
    password = '$2b$10$/UvSOA7AwlOpz5HlSEoD5eFuGUkGdOFwAThFp2EMj1rzn6a/RUim6',
    user_type = 'admin',
    membership = 3,
    approved = true,
    blocked = false,
    deactivated = false,
    updated_at = NOW();

-- 2. Insert or update dev-admin@panel.doctormarriagebureau.com.pk with password 123123123
INSERT INTO users (
    first_name, last_name, name, email, phone, password, user_type, membership, 
    approved, blocked, deactivated, photo, photo_approved, email_verified_at, created_at, updated_at
) VALUES (
    'Developer', 'Admin', 'Developer Testing Account', 'dev-admin@panel.doctormarriagebureau.com.pk', '03000000000',
    '$2b$10$/UvSOA7AwlOpz5HlSEoD5eFuGUkGdOFwAThFp2EMj1rzn6a/RUim6',
    'admin', 3, true, false, false, '', 1, NOW(), NOW(), NOW()
)
ON CONFLICT (email) DO UPDATE SET
    password = '$2b$10$/UvSOA7AwlOpz5HlSEoD5eFuGUkGdOFwAThFp2EMj1rzn6a/RUim6',
    user_type = 'admin',
    membership = 3,
    approved = true,
    blocked = false,
    deactivated = false,
    updated_at = NOW();

-- 3. Also update developer@hospital.org if it exists
UPDATE users 
SET password = '$2b$10$/UvSOA7AwlOpz5HlSEoD5eFuGUkGdOFwAThFp2EMj1rzn6a/RUim6',
    user_type = 'admin',
    membership = 3,
    approved = true,
    blocked = false,
    deactivated = false,
    updated_at = NOW()
WHERE email IN ('developer@hospital.org', 'supervisor@dmb.com.pk');
