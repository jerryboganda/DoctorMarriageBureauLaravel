-- ============================================================================
-- Doctor Marriage Bureau (DMB) — Modernized Platform Relational Schema
-- Target: PostgreSQL 16 (Alpine)
-- Charset: UTF8 | Collation: en_US.UTF-8 / default
-- ============================================================================

-- 0. EXTENSIONS & PREREQUISITES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ============================================================================
-- 1. TAXONOMY & MASTER LOOKUP TABLES
-- ============================================================================

CREATE TABLE IF NOT EXISTS countries (
    id BIGSERIAL PRIMARY KEY,
    code VARCHAR(10),
    name VARCHAR(100) NOT NULL,
    status BOOLEAN NOT NULL DEFAULT TRUE,
    phone_code VARCHAR(20),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_countries_name ON countries (name);
CREATE INDEX IF NOT EXISTS idx_countries_code ON countries (code);

CREATE TABLE IF NOT EXISTS states (
    id BIGSERIAL PRIMARY KEY,
    country_id BIGINT NOT NULL REFERENCES countries(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_states_country_id ON states (country_id);
CREATE INDEX IF NOT EXISTS idx_states_name ON states (name);

CREATE TABLE IF NOT EXISTS cities (
    id BIGSERIAL PRIMARY KEY,
    state_id BIGINT NOT NULL REFERENCES states(id) ON DELETE CASCADE,
    country_id BIGINT REFERENCES countries(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_cities_state_id ON cities (state_id);
CREATE INDEX IF NOT EXISTS idx_cities_country_id ON cities (country_id);
CREATE INDEX IF NOT EXISTS idx_cities_name ON cities (name);

CREATE TABLE IF NOT EXISTS religions (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_religions_name ON religions (name);

CREATE TABLE IF NOT EXISTS sects (
    id BIGSERIAL PRIMARY KEY,
    religion_id BIGINT REFERENCES religions(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_sects_religion_id ON sects (religion_id);
CREATE INDEX IF NOT EXISTS idx_sects_name ON sects (name);

CREATE TABLE IF NOT EXISTS castes (
    id BIGSERIAL PRIMARY KEY,
    religion_id BIGINT NOT NULL REFERENCES religions(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_castes_religion_id ON castes (religion_id);
CREATE INDEX IF NOT EXISTS idx_castes_name ON castes (name);

CREATE TABLE IF NOT EXISTS sub_castes (
    id BIGSERIAL PRIMARY KEY,
    caste_id BIGINT NOT NULL REFERENCES castes(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_sub_castes_caste_id ON sub_castes (caste_id);

CREATE TABLE IF NOT EXISTS specialities (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    category VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_specialities_name ON specialities (name);

CREATE TABLE IF NOT EXISTS job_titles (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_job_titles_name ON job_titles (name);

CREATE TABLE IF NOT EXISTS marital_statuses (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS languages (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20) NOT NULL,
    app_lang_code VARCHAR(20),
    rtl BOOLEAN NOT NULL DEFAULT FALSE,
    status BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS member_languages (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS family_values (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS family_statuses (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS on_behalfs (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS annual_salary_ranges (
    id BIGSERIAL PRIMARY KEY,
    min_salary NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    max_salary NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS currencies (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    symbol VARCHAR(20) NOT NULL,
    code VARCHAR(10) NOT NULL,
    exchange_rate NUMERIC(12,5) DEFAULT 1.00000,
    status BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS roles (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    guard_name VARCHAR(50) NOT NULL DEFAULT 'web',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS permissions (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    parent VARCHAR(100),
    guard_name VARCHAR(50) NOT NULL DEFAULT 'web',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS profile_option_values (
    id BIGSERIAL PRIMARY KEY,
    "group" VARCHAR(64) NOT NULL,
    value VARCHAR(128) NOT NULL,
    label VARCHAR(191) NOT NULL,
    sort_order INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT profile_option_group_value_unique UNIQUE ("group", value)
);
CREATE INDEX IF NOT EXISTS idx_profile_option_group ON profile_option_values ("group", is_active);

-- ============================================================================
-- 2. USERS, AUTH & SECURITY SUBSYSTEM
-- ============================================================================

CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    user_type VARCHAR(50) NOT NULL DEFAULT 'member',
    code VARCHAR(50) UNIQUE,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    name VARCHAR(200),
    email VARCHAR(255),
    email_verified_at TIMESTAMPTZ,
    password VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    membership INT NOT NULL DEFAULT 1,
    approved BOOLEAN NOT NULL DEFAULT TRUE,
    blocked BOOLEAN NOT NULL DEFAULT FALSE,
    deactivated BOOLEAN NOT NULL DEFAULT FALSE,
    permanently_delete BOOLEAN NOT NULL DEFAULT FALSE,
    balance NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    photo TEXT,
    photo_approved INT NOT NULL DEFAULT 1,
    verification_code VARCHAR(100),
    verification_info TEXT,
    two_factor_pending BOOLEAN NOT NULL DEFAULT FALSE,
    two_factor_token VARCHAR(255),
    two_factor_token_expires_at TIMESTAMPTZ,
    must_change_password BOOLEAN NOT NULL DEFAULT FALSE,
    referred_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
    referral_code VARCHAR(50),
    fcm_token TEXT,
    remember_token VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_users_dashboard_listing ON users (user_type, approved, blocked, deactivated);
CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users (phone);
CREATE INDEX IF NOT EXISTS idx_users_referred_by ON users (referred_by);
CREATE INDEX IF NOT EXISTS idx_users_status ON users (approved, blocked, deactivated);

CREATE TABLE IF NOT EXISTS staff (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id BIGINT REFERENCES roles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_staff_user_id ON staff (user_id);

CREATE TABLE IF NOT EXISTS user_two_factor_settings (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    is_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    method VARCHAR(30) NOT NULL DEFAULT 'app',
    secret TEXT,
    recovery_codes JSONB,
    confirmed_at TIMESTAMPTZ,
    last_used_at TIMESTAMPTZ,
    backup_phone VARCHAR(50),
    backup_email VARCHAR(255),
    failed_attempts INT NOT NULL DEFAULT 0,
    locked_until TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_2fa_user_enabled ON user_two_factor_settings (user_id, is_enabled);

CREATE TABLE IF NOT EXISTS trusted_contacts (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    relationship VARCHAR(50) NOT NULL DEFAULT 'other',
    phone VARCHAR(50),
    email VARCHAR(255),
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    verification_token VARCHAR(100),
    verification_sent_at TIMESTAMPTZ,
    verified_at TIMESTAMPTZ,
    can_recover_account BOOLEAN NOT NULL DEFAULT TRUE,
    notify_on_login BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_trusted_contacts_user ON trusted_contacts (user_id, is_verified);
CREATE INDEX IF NOT EXISTS idx_trusted_contacts_token ON trusted_contacts (verification_token);

CREATE TABLE IF NOT EXISTS account_recovery_requests (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    trusted_contact_id BIGINT NOT NULL REFERENCES trusted_contacts(id) ON DELETE CASCADE,
    recovery_token VARCHAR(100) NOT NULL UNIQUE,
    status VARCHAR(30) NOT NULL DEFAULT 'pending',
    ip_address VARCHAR(45),
    user_agent TEXT,
    expires_at TIMESTAMPTZ NOT NULL,
    approved_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_recovery_requests_lookup ON account_recovery_requests (user_id, status);

CREATE TABLE IF NOT EXISTS step_up_auth_tokens (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(100) NOT NULL UNIQUE,
    purpose VARCHAR(50) NOT NULL DEFAULT 'ownership_transfer',
    password_verified BOOLEAN NOT NULL DEFAULT FALSE,
    otp_verified BOOLEAN NOT NULL DEFAULT FALSE,
    otp_code VARCHAR(255),
    otp_sent_at TIMESTAMPTZ,
    otp_expires_at TIMESTAMPTZ,
    otp_attempts INT NOT NULL DEFAULT 0,
    is_valid BOOLEAN NOT NULL DEFAULT TRUE,
    expires_at TIMESTAMPTZ NOT NULL,
    completed_at TIMESTAMPTZ,
    ip_address VARCHAR(45),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_stepup_user_purpose ON step_up_auth_tokens (user_id, purpose, is_valid);

CREATE TABLE IF NOT EXISTS field_visibility_settings (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    field_name VARCHAR(100) NOT NULL,
    is_visible BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT field_visibility_user_field_unique UNIQUE (user_id, field_name)
);
CREATE INDEX IF NOT EXISTS idx_visibility_user_id ON field_visibility_settings (user_id);

CREATE TABLE IF NOT EXISTS profile_audit_logs (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    section VARCHAR(50) NOT NULL,
    field_name VARCHAR(100) NOT NULL,
    old_value TEXT,
    new_value TEXT,
    ip_address VARCHAR(45),
    user_agent VARCHAR(255),
    changed_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_profile_audit_user_section ON profile_audit_logs (user_id, section);
CREATE INDEX IF NOT EXISTS idx_profile_audit_user_changed ON profile_audit_logs (user_id, changed_at);

CREATE TABLE IF NOT EXISTS user_notification_preferences (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    email_digest BOOLEAN NOT NULL DEFAULT TRUE,
    whatsapp BOOLEAN NOT NULL DEFAULT TRUE,
    push_notifications BOOLEAN NOT NULL DEFAULT TRUE,
    sms BOOLEAN NOT NULL DEFAULT FALSE,
    weekly_digest BOOLEAN NOT NULL DEFAULT TRUE,
    profile_snoozed BOOLEAN NOT NULL DEFAULT FALSE,
    snooze_until TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS verification_codes (
    id BIGSERIAL PRIMARY KEY,
    identifier VARCHAR(255) NOT NULL,
    code VARCHAR(20) NOT NULL,
    type VARCHAR(30) NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    verified BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_verification_identifier_type ON verification_codes (identifier, type);
CREATE INDEX IF NOT EXISTS idx_verification_expires_at ON verification_codes (expires_at);

CREATE TABLE IF NOT EXISTS password_resets (
    email VARCHAR(255) NOT NULL,
    token VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_password_resets_email ON password_resets (email);

CREATE TABLE IF NOT EXISTS personal_access_tokens (
    id BIGSERIAL PRIMARY KEY,
    tokenable_type VARCHAR(191) NOT NULL,
    tokenable_id BIGINT NOT NULL,
    name VARCHAR(191) NOT NULL,
    token VARCHAR(64) NOT NULL UNIQUE,
    abilities TEXT,
    last_used_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    device_name VARCHAR(100),
    device_type VARCHAR(50),
    browser VARCHAR(100),
    browser_version VARCHAR(50),
    os VARCHAR(100),
    os_version VARCHAR(50),
    ip_address VARCHAR(45),
    location_city VARCHAR(100),
    location_region VARCHAR(100),
    location_country VARCHAR(100),
    location_country_code VARCHAR(10),
    latitude NUMERIC(10,7),
    longitude NUMERIC(10,7),
    user_agent TEXT,
    is_current BOOLEAN NOT NULL DEFAULT FALSE,
    logged_in_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_pat_tokenable ON personal_access_tokens (tokenable_type, tokenable_id);

CREATE TABLE IF NOT EXISTS failed_jobs (
    id BIGSERIAL PRIMARY KEY,
    connection TEXT NOT NULL,
    queue TEXT NOT NULL,
    payload TEXT NOT NULL,
    exception TEXT NOT NULL,
    failed_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 3. PACKAGES, BILLING, COUPONS & WALLETS
-- ============================================================================

CREATE TABLE IF NOT EXISTS packages (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    price NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    validity INT NOT NULL DEFAULT 30,
    express_interest INT NOT NULL DEFAULT 0,
    contact INT NOT NULL DEFAULT 0,
    photo_gallery INT NOT NULL DEFAULT 0,
    profile_image_view INT NOT NULL DEFAULT 0,
    gallery_image_view INT NOT NULL DEFAULT 0,
    profile_viewers_view INT NOT NULL DEFAULT 0,
    auto_profile_match BOOLEAN NOT NULL DEFAULT FALSE,
    image TEXT,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    status BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_packages_active ON packages (active, status);

CREATE TABLE IF NOT EXISTS coupons (
    id BIGSERIAL PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(150),
    description TEXT,
    discount_type VARCHAR(20) NOT NULL DEFAULT 'amount',
    discount_value NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    min_amount NUMERIC(12,2),
    max_redemptions INT,
    used_count INT NOT NULL DEFAULT 0,
    per_user_limit INT,
    applicable_to VARCHAR(30) NOT NULL DEFAULT 'any',
    starts_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons (code);

CREATE TABLE IF NOT EXISTS manual_payment_methods (
    id BIGSERIAL PRIMARY KEY,
    type VARCHAR(100),
    heading VARCHAR(255),
    description TEXT,
    bank_info TEXT,
    photo TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS package_payments (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    package_id BIGINT NOT NULL REFERENCES packages(id) ON DELETE RESTRICT,
    amount NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    original_amount NUMERIC(12,2),
    discount_amount NUMERIC(12,2),
    coupon_id BIGINT REFERENCES coupons(id) ON DELETE SET NULL,
    coupon_code VARCHAR(100),
    payment_method VARCHAR(50) NOT NULL,
    payment_status VARCHAR(50) NOT NULL DEFAULT 'pending',
    payment_code VARCHAR(100),
    offline_payment INT NOT NULL DEFAULT 0,
    custom_payment_name VARCHAR(150),
    custom_payment_transaction_id VARCHAR(150),
    custom_payment_details TEXT,
    custom_payment_proof TEXT,
    payment_details TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_package_payments_user ON package_payments (user_id);
CREATE INDEX IF NOT EXISTS idx_package_payments_status ON package_payments (payment_status, created_at DESC);

CREATE TABLE IF NOT EXISTS addon_products (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    price NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    badge VARCHAR(50),
    metadata JSONB DEFAULT '{}'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS addon_purchases (
    id BIGSERIAL PRIMARY KEY,
    addon_product_id BIGINT NOT NULL REFERENCES addon_products(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    payment_method VARCHAR(50) NOT NULL,
    payment_status VARCHAR(50) NOT NULL,
    payment_details TEXT,
    amount NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    original_amount NUMERIC(12,2),
    discount_amount NUMERIC(12,2),
    coupon_id BIGINT REFERENCES coupons(id) ON DELETE SET NULL,
    coupon_code VARCHAR(100),
    payment_code VARCHAR(100),
    offline_payment INT NOT NULL DEFAULT 2,
    custom_payment_name VARCHAR(150),
    custom_payment_transaction_id VARCHAR(150),
    custom_payment_details TEXT,
    custom_payment_proof TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_addon_purchases_user ON addon_purchases (user_id, addon_product_id);

CREATE TABLE IF NOT EXISTS coupon_redemptions (
    id BIGSERIAL PRIMARY KEY,
    coupon_id BIGINT NOT NULL REFERENCES coupons(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    package_payment_id BIGINT REFERENCES package_payments(id) ON DELETE SET NULL,
    addon_purchase_id BIGINT REFERENCES addon_purchases(id) ON DELETE SET NULL,
    code VARCHAR(100) NOT NULL,
    purchase_type VARCHAR(50),
    original_amount NUMERIC(12,2) NOT NULL,
    discount_amount NUMERIC(12,2) NOT NULL,
    final_amount NUMERIC(12,2) NOT NULL,
    redeemed_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_coupon_redemptions_user ON coupon_redemptions (coupon_id, user_id);

CREATE TABLE IF NOT EXISTS wallets (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    payment_method VARCHAR(100),
    payment_details TEXT,
    transaction_id VARCHAR(255),
    approval INT NOT NULL DEFAULT 0,
    offline_payment INT NOT NULL DEFAULT 0,
    reciept VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_wallets_user_id ON wallets (user_id);

CREATE TABLE IF NOT EXISTS wallet_withdraw_requests (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    payment_method VARCHAR(100),
    payment_details TEXT,
    status INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_wallet_withdraw_user ON wallet_withdraw_requests (user_id);

CREATE TABLE IF NOT EXISTS transactions (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    gateway VARCHAR(100),
    payment_type VARCHAR(100),
    additional_content TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions (user_id, created_at DESC);

-- ============================================================================
-- 4. MEMBER PROFILES & DEMOGRAPHICS (NORMALIZED 1-TO-1 SCHEMA)
-- ============================================================================

CREATE TABLE IF NOT EXISTS members (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    gender VARCHAR(20),
    birthday DATE,
    on_behalves_id BIGINT REFERENCES on_behalfs(id) ON DELETE SET NULL,
    current_package_id BIGINT REFERENCES packages(id) ON DELETE SET NULL,
    package_validity DATE,
    remaining_interest INT NOT NULL DEFAULT 0,
    remaining_contact_view INT NOT NULL DEFAULT 0,
    remaining_photo_gallery INT NOT NULL DEFAULT 0,
    remaining_profile_image_view INT NOT NULL DEFAULT 0,
    remaining_gallery_image_view INT NOT NULL DEFAULT 0,
    remaining_profile_viewer_view INT NOT NULL DEFAULT 0,
    unverified_messages_used INT NOT NULL DEFAULT 0,
    unverified_proposals_used INT NOT NULL DEFAULT 0,
    unverified_fresh_messages_remaining INT NOT NULL DEFAULT 5,
    unverified_fresh_proposals_remaining INT NOT NULL DEFAULT 5,
    auto_profile_match BOOLEAN NOT NULL DEFAULT TRUE,
    is_approved BOOLEAN NOT NULL DEFAULT FALSE,
    is_closed BOOLEAN NOT NULL DEFAULT FALSE,
    onboarding_completed BOOLEAN NOT NULL DEFAULT FALSE,
    medical_license_number VARCHAR(100),
    specialization VARCHAR(255),
    verification_document TEXT,
    is_agent_pick BOOLEAN NOT NULL DEFAULT FALSE,
    is_high_intent BOOLEAN NOT NULL DEFAULT FALSE,
    travel_mode BOOLEAN NOT NULL DEFAULT FALSE,
    is_visible BOOLEAN NOT NULL DEFAULT TRUE,
    marriage_timeline VARCHAR(50),
    relocation_willingness VARCHAR(50),
    seriousness_level VARCHAR(50),
    voice_intro_path TEXT,
    intro_video_path TEXT,
    nationality VARCHAR(100),
    management_mode VARCHAR(50) NOT NULL DEFAULT 'self',
    primary_manager_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    travel_city VARCHAR(100),
    travel_country VARCHAR(100),
    annual_salary_range_id BIGINT REFERENCES annual_salary_ranges(id) ON DELETE SET NULL,
    mothere_tongue BIGINT REFERENCES member_languages(id) ON DELETE SET NULL,
    marital_status_id BIGINT REFERENCES marital_statuses(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_members_filters ON members (is_approved, gender, birthday, is_visible, onboarding_completed);
CREATE INDEX IF NOT EXISTS idx_members_search ON members (gender, birthday, is_approved, is_agent_pick, is_high_intent);
CREATE INDEX IF NOT EXISTS idx_members_user_id ON members (user_id);
CREATE INDEX IF NOT EXISTS idx_members_package_id ON members (current_package_id);

CREATE TABLE IF NOT EXISTS profile_managers (
    id BIGSERIAL PRIMARY KEY,
    member_id BIGINT NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    manager_user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    manager_email VARCHAR(255),
    manager_phone VARCHAR(50),
    manager_name VARCHAR(255),
    manager_type VARCHAR(50) NOT NULL DEFAULT 'family',
    permissions JSONB DEFAULT '[]'::jsonb,
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    invitation_token VARCHAR(100),
    invited_at TIMESTAMPTZ,
    accepted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_profile_managers_member ON profile_managers (member_id, is_active);
CREATE INDEX IF NOT EXISTS idx_profile_managers_user ON profile_managers (manager_user_id);

CREATE TABLE IF NOT EXISTS ownership_transfers (
    id BIGSERIAL PRIMARY KEY,
    member_id BIGINT NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    from_user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    to_user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    to_email VARCHAR(255),
    to_phone VARCHAR(50),
    to_name VARCHAR(255),
    status VARCHAR(30) NOT NULL DEFAULT 'pending',
    transfer_token VARCHAR(100) NOT NULL UNIQUE,
    step_up_token VARCHAR(100),
    step_up_verified BOOLEAN NOT NULL DEFAULT FALSE,
    step_up_verified_at TIMESTAMPTZ,
    transfer_reason TEXT,
    expires_at TIMESTAMPTZ NOT NULL,
    accepted_at TIMESTAMPTZ,
    rejected_at TIMESTAMPTZ,
    rejection_reason VARCHAR(500),
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_ownership_transfers_member ON ownership_transfers (member_id, status);
CREATE INDEX IF NOT EXISTS idx_ownership_transfers_from ON ownership_transfers (from_user_id, status);

CREATE TABLE IF NOT EXISTS physical_attributes (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    height NUMERIC(5,2),
    weight NUMERIC(5,2),
    eye_color VARCHAR(50),
    hair_color VARCHAR(50),
    complexion VARCHAR(50),
    blood_group VARCHAR(20),
    body_type VARCHAR(50),
    body_art VARCHAR(50),
    disability VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_physical_user_id ON physical_attributes (user_id);

CREATE TABLE IF NOT EXISTS spiritual_backgrounds (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    religion_id BIGINT REFERENCES religions(id) ON DELETE SET NULL,
    sect_id BIGINT REFERENCES sects(id) ON DELETE SET NULL,
    caste_id BIGINT REFERENCES castes(id) ON DELETE SET NULL,
    sub_caste_id BIGINT REFERENCES sub_castes(id) ON DELETE SET NULL,
    ethnicity VARCHAR(100),
    personal_value VARCHAR(100),
    family_value_id BIGINT REFERENCES family_values(id) ON DELETE SET NULL,
    community_value VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_spiritual_search ON spiritual_backgrounds (religion_id, sect_id, caste_id);
CREATE INDEX IF NOT EXISTS idx_spiritual_user_id ON spiritual_backgrounds (user_id);

CREATE TABLE IF NOT EXISTS lifestyles (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    diet VARCHAR(50),
    drink VARCHAR(50),
    smoke VARCHAR(50),
    property VARCHAR(100),
    property_details VARCHAR(255),
    living_with VARCHAR(100),
    sleep_schedule VARCHAR(50),
    personality_tags JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_lifestyles_user_id ON lifestyles (user_id);

CREATE TABLE IF NOT EXISTS careers (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    designation VARCHAR(150),
    company VARCHAR(150),
    start VARCHAR(50),
    "end" VARCHAR(50),
    present BOOLEAN NOT NULL DEFAULT FALSE,
    work_location_type VARCHAR(50),
    job_title_id BIGINT REFERENCES job_titles(id) ON DELETE SET NULL,
    speciality_id BIGINT REFERENCES specialities(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_careers_user_id ON careers (user_id);
CREATE INDEX IF NOT EXISTS idx_careers_speciality ON careers (speciality_id);

CREATE TABLE IF NOT EXISTS education (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    degree VARCHAR(150),
    institution VARCHAR(255),
    start VARCHAR(50),
    "end" VARCHAR(50),
    present BOOLEAN NOT NULL DEFAULT FALSE,
    is_highest_degree BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_education_user_id ON education (user_id);

CREATE TABLE IF NOT EXISTS addresses (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL DEFAULT 'present',
    country_id BIGINT REFERENCES countries(id) ON DELETE SET NULL,
    state_id BIGINT REFERENCES states(id) ON DELETE SET NULL,
    city_id BIGINT REFERENCES cities(id) ON DELETE SET NULL,
    postal_code VARCHAR(50),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_addresses_geo ON addresses (user_id, country_id, state_id, city_id);

CREATE TABLE IF NOT EXISTS recidencies (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    immigration_status VARCHAR(100),
    birth_country_id BIGINT REFERENCES countries(id) ON DELETE SET NULL,
    recidency_country_id BIGINT REFERENCES countries(id) ON DELETE SET NULL,
    growup_country_id BIGINT REFERENCES countries(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_recidencies_user_id ON recidencies (user_id);

CREATE TABLE IF NOT EXISTS astrologies (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    sun_sign VARCHAR(50),
    moon_sign VARCHAR(50),
    time_of_birth VARCHAR(50),
    city_of_birth VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_astrologies_user_id ON astrologies (user_id);

CREATE TABLE IF NOT EXISTS attitudes (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    affection VARCHAR(100),
    humor VARCHAR(100),
    political_views VARCHAR(100),
    religious_service VARCHAR(100),
    personal_value TEXT,
    interests JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_attitudes_user_id ON attitudes (user_id);

CREATE TABLE IF NOT EXISTS hobbies (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    hobbies TEXT,
    interests TEXT,
    music TEXT,
    books TEXT,
    movies TEXT,
    tv_shows TEXT,
    sports TEXT,
    fitness_activities TEXT,
    cuisines TEXT,
    dress_styles TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_hobbies_user_id ON hobbies (user_id);

CREATE TABLE IF NOT EXISTS additional_attributes (
    id BIGSERIAL PRIMARY KEY,
    type VARCHAR(20) NOT NULL DEFAULT 'text',
    title VARCHAR(255) NOT NULL,
    status BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS additional_member_infos (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    additional_attribute_id BIGINT NOT NULL REFERENCES additional_attributes(id) ON DELETE CASCADE,
    value TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_additional_member_info ON additional_member_infos (user_id, additional_attribute_id);

CREATE TABLE IF NOT EXISTS profile_completion_reminder_settings (
    id BIGSERIAL PRIMARY KEY,
    is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    threshold_percent INT NOT NULL DEFAULT 80,
    interval_days INT NOT NULL DEFAULT 5,
    max_reminders INT NOT NULL DEFAULT 10,
    email_subject VARCHAR(255) NOT NULL DEFAULT 'Complete Your Profile - Doctor Marriage Bureau',
    email_body TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS profile_completion_reminder_logs (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    profile_percentage INT NOT NULL,
    sent_at TIMESTAMPTZ NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'sent',
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_profile_reminder_logs ON profile_completion_reminder_logs (user_id, sent_at);

-- ============================================================================
-- 5. FAMILY PORTAL DOMAIN
-- ============================================================================

CREATE TABLE IF NOT EXISTS families (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    father VARCHAR(150),
    mother VARCHAR(150),
    sibling TEXT,
    father_occupation VARCHAR(150),
    mother_occupation VARCHAR(150),
    no_of_sisters INT DEFAULT 0,
    no_of_brothers INT DEFAULT 0,
    about_parents TEXT,
    about_siblings TEXT,
    about_relatives TEXT,
    about_description TEXT,
    location_city VARCHAR(100),
    location_country VARCHAR(100),
    tradition_level VARCHAR(50),
    affluence_level VARCHAR(50),
    interests JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_families_user_id ON families (user_id);

CREATE TABLE IF NOT EXISTS family_guardians (
    id BIGSERIAL PRIMARY KEY,
    family_id BIGINT NOT NULL REFERENCES families(id) ON DELETE CASCADE,
    user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    name VARCHAR(150) NOT NULL,
    relationship VARCHAR(100) NOT NULL,
    phone VARCHAR(50),
    email VARCHAR(255),
    is_primary_contact BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_family_guardians_family ON family_guardians (family_id);

CREATE TABLE IF NOT EXISTS family_photos (
    id BIGSERIAL PRIMARY KEY,
    family_id BIGINT NOT NULL REFERENCES families(id) ON DELETE CASCADE,
    photo_path TEXT NOT NULL,
    caption VARCHAR(255),
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_family_photos_family ON family_photos (family_id, sort_order);

CREATE TABLE IF NOT EXISTS family_approvals (
    id BIGSERIAL PRIMARY KEY,
    family_id BIGINT NOT NULL REFERENCES families(id) ON DELETE CASCADE,
    guardian_id BIGINT NOT NULL REFERENCES family_guardians(id) ON DELETE CASCADE,
    target_user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    notes TEXT,
    responded_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_family_approvals_target ON family_approvals (family_id, target_user_id, status);

-- ============================================================================
-- 6. DISCOVERY, INTERACTIONS, PHOTOS & MATCHES
-- ============================================================================

CREATE TABLE IF NOT EXISTS partner_expectations (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    general TEXT,
    min_age INT,
    max_age INT,
    height NUMERIC(5,2),
    weight NUMERIC(5,2),
    marital_status_id BIGINT REFERENCES marital_statuses(id) ON DELETE SET NULL,
    children_acceptable VARCHAR(50),
    residence_country_id BIGINT REFERENCES countries(id) ON DELETE SET NULL,
    religion_id BIGINT REFERENCES religions(id) ON DELETE SET NULL,
    caste_id BIGINT REFERENCES castes(id) ON DELETE SET NULL,
    sub_caste_id BIGINT REFERENCES sub_castes(id) ON DELETE SET NULL,
    education VARCHAR(255),
    profession VARCHAR(255),
    smoking_acceptable VARCHAR(50),
    drinking_acceptable VARCHAR(50),
    diet VARCHAR(50),
    body_type VARCHAR(50),
    personal_value VARCHAR(100),
    manglik VARCHAR(50),
    language_id BIGINT REFERENCES member_languages(id) ON DELETE SET NULL,
    family_value_id BIGINT REFERENCES family_values(id) ON DELETE SET NULL,
    preferred_country_id BIGINT REFERENCES countries(id) ON DELETE SET NULL,
    preferred_state_id BIGINT REFERENCES states(id) ON DELETE SET NULL,
    complexion VARCHAR(50),
    age_importance VARCHAR(50),
    height_importance VARCHAR(50),
    marital_status_importance VARCHAR(50),
    religion_importance VARCHAR(50),
    language_importance VARCHAR(50),
    residence_importance VARCHAR(50),
    speciality_preferences JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_partner_expectations_user ON partner_expectations (user_id);

CREATE TABLE IF NOT EXISTS partner_preference_priorities (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    field_name VARCHAR(50) NOT NULL,
    priority_type VARCHAR(50) NOT NULL DEFAULT 'flexible',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT partner_preference_priorities_user_field_unique UNIQUE (user_id, field_name)
);
CREATE INDEX IF NOT EXISTS idx_partner_priorities_user ON partner_preference_priorities (user_id);

CREATE TABLE IF NOT EXISTS express_interests (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    interested_by BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_express_interests_user_by_status ON express_interests (user_id, interested_by, status);

CREATE TABLE IF NOT EXISTS shortlists (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    user_id_target BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT shortlists_user_target_unique UNIQUE (user_id, user_id_target)
);
CREATE INDEX IF NOT EXISTS idx_shortlists_user ON shortlists (user_id);

CREATE TABLE IF NOT EXISTS ignored_users (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    ignored_user BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT ignored_users_unique UNIQUE (user_id, ignored_user)
);
CREATE INDEX IF NOT EXISTS idx_ignored_users_user ON ignored_users (user_id);

CREATE TABLE IF NOT EXISTS reported_users (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reported_by BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reason TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_reported_users_lookup ON reported_users (user_id, reported_by);

CREATE TABLE IF NOT EXISTS profile_viewers (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    viewed_by BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_profile_viewers_timeline ON profile_viewers (user_id, viewed_by, created_at DESC);

CREATE TABLE IF NOT EXISTS profile_matches (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    match_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    match_percentage INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_profile_matches_user ON profile_matches (user_id, match_percentage DESC);

CREATE TABLE IF NOT EXISTS view_profile_pictures (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    requested_by BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_view_profile_pics ON view_profile_pictures (user_id, requested_by);

CREATE TABLE IF NOT EXISTS view_gallery_images (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    requested_by BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_view_gallery_imgs ON view_gallery_images (user_id, requested_by);

CREATE TABLE IF NOT EXISTS view_contacts (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    viewed_by BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_view_contacts_lookup ON view_contacts (user_id, viewed_by);

CREATE TABLE IF NOT EXISTS gallery_images (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    image TEXT NOT NULL,
    privacy_level VARCHAR(50) NOT NULL DEFAULT 'public',
    is_main_photo BOOLEAN NOT NULL DEFAULT FALSE,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_gallery_images_user ON gallery_images (user_id, is_main_photo, sort_order);

-- ============================================================================
-- 7. COURTSHIP PROGRESSION PIPELINE
-- ============================================================================

CREATE TABLE IF NOT EXISTS progression_stages (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    "order" INT NOT NULL DEFAULT 0,
    progress_percent INT NOT NULL DEFAULT 0,
    slug VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_progression_stages_order ON progression_stages ("order");

CREATE TABLE IF NOT EXISTS member_progressions (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    partner_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    current_stage_id BIGINT REFERENCES progression_stages(id) ON DELETE SET NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'active',
    next_steps TEXT,
    total_progress_percent INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT member_progressions_pair_unique UNIQUE (user_id, partner_id)
);
CREATE INDEX IF NOT EXISTS idx_member_progressions_status ON member_progressions (user_id, status);

CREATE TABLE IF NOT EXISTS progression_events (
    id BIGSERIAL PRIMARY KEY,
    member_progression_id BIGINT NOT NULL REFERENCES member_progressions(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    event_at TIMESTAMPTZ NOT NULL,
    location VARCHAR(255),
    status VARCHAR(50) NOT NULL DEFAULT 'scheduled',
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_progression_events_prog ON progression_events (member_progression_id, event_at);

CREATE TABLE IF NOT EXISTS progression_checklist_items (
    id BIGSERIAL PRIMARY KEY,
    member_progression_id BIGINT NOT NULL REFERENCES member_progressions(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    is_completed BOOLEAN NOT NULL DEFAULT FALSE,
    completed_at TIMESTAMPTZ,
    sort_order INT NOT NULL DEFAULT 0,
    created_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
    updated_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_prog_checklist_items ON progression_checklist_items (member_progression_id, sort_order);

CREATE TABLE IF NOT EXISTS progression_notes (
    id BIGSERIAL PRIMARY KEY,
    member_progression_id BIGINT NOT NULL REFERENCES member_progressions(id) ON DELETE CASCADE,
    author_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    note_type VARCHAR(100) NOT NULL DEFAULT 'family_feedback',
    note TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_prog_notes ON progression_notes (member_progression_id, note_type);

CREATE TABLE IF NOT EXISTS progression_venues (
    id BIGSERIAL PRIMARY KEY,
    member_progression_id BIGINT NOT NULL REFERENCES member_progressions(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    venue_type VARCHAR(100),
    estimated_cost NUMERIC(12,2),
    rating NUMERIC(3,1),
    status VARCHAR(50) NOT NULL DEFAULT 'shortlisted',
    visited_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_prog_venues ON progression_venues (member_progression_id, status);

CREATE TABLE IF NOT EXISTS progression_budget_items (
    id BIGSERIAL PRIMARY KEY,
    member_progression_id BIGINT NOT NULL REFERENCES member_progressions(id) ON DELETE CASCADE,
    label VARCHAR(255) NOT NULL,
    amount NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    category VARCHAR(100),
    status VARCHAR(50) NOT NULL DEFAULT 'planned',
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_prog_budget_items ON progression_budget_items (member_progression_id, status);

CREATE TABLE IF NOT EXISTS progression_settings (
    id BIGSERIAL PRIMARY KEY,
    member_progression_id BIGINT NOT NULL UNIQUE REFERENCES member_progressions(id) ON DELETE CASCADE,
    share_calendar_busy BOOLEAN NOT NULL DEFAULT TRUE,
    auto_detect_timezone BOOLEAN NOT NULL DEFAULT TRUE,
    timezone VARCHAR(100),
    budget_target NUMERIC(12,2),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 8. REALTIME MESSAGING, NOTIFICATIONS & COMMUNITY
-- ============================================================================

CREATE TABLE IF NOT EXISTS chat_threads (
    id BIGSERIAL PRIMARY KEY,
    sender_user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    receiver_user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    thread_code VARCHAR(100) NOT NULL UNIQUE,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    blocked_by_user BIGINT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_chat_threads_user_pair_updated ON chat_threads (sender_user_id, receiver_user_id, updated_at DESC);

CREATE TABLE IF NOT EXISTS chats (
    id BIGSERIAL PRIMARY KEY,
    chat_thread_id BIGINT NOT NULL REFERENCES chat_threads(id) ON DELETE CASCADE,
    sender_user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    attachment TEXT,
    seen BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_chats_thread_created_at ON chats (chat_thread_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chats_unread ON chats (chat_thread_id, seen);

CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type VARCHAR(255) NOT NULL,
    notifiable_type VARCHAR(255) NOT NULL,
    notifiable_id BIGINT NOT NULL,
    data JSONB NOT NULL,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_notifications_notifiable ON notifications (notifiable_type, notifiable_id, read_at);

CREATE TABLE IF NOT EXISTS bulk_notification_logs (
    id BIGSERIAL PRIMARY KEY,
    admin_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    channels VARCHAR(255) NOT NULL,
    filters_summary TEXT NOT NULL,
    total_targeted INT NOT NULL DEFAULT 0,
    email_sent INT NOT NULL DEFAULT 0,
    email_failed INT NOT NULL DEFAULT 0,
    sms_sent INT NOT NULL DEFAULT 0,
    sms_failed INT NOT NULL DEFAULT 0,
    push_sent INT NOT NULL DEFAULT 0,
    push_failed INT NOT NULL DEFAULT 0,
    status VARCHAR(50) NOT NULL DEFAULT 'completed',
    payload JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_bulk_notifications_admin ON bulk_notification_logs (admin_id, created_at DESC);

CREATE TABLE IF NOT EXISTS communities (
    id BIGSERIAL PRIMARY KEY,
    created_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    type VARCHAR(50) NOT NULL DEFAULT 'other',
    description TEXT,
    is_private BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_communities_type ON communities (type, is_active);

CREATE TABLE IF NOT EXISTS community_memberships (
    id BIGSERIAL PRIMARY KEY,
    community_id BIGINT NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(30) NOT NULL DEFAULT 'pending',
    role VARCHAR(30) NOT NULL DEFAULT 'member',
    requested_at TIMESTAMPTZ,
    approved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT community_memberships_unique UNIQUE (community_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_community_memberships_user ON community_memberships (user_id, status);

CREATE TABLE IF NOT EXISTS happy_stories (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    partner_name VARCHAR(150),
    title VARCHAR(255) NOT NULL,
    details TEXT NOT NULL,
    photos JSONB DEFAULT '[]'::jsonb,
    video_provider VARCHAR(50),
    video_link TEXT,
    approval_status BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_happy_stories_user ON happy_stories (user_id, approval_status);

-- ============================================================================
-- 9. REFERRAL & AFFILIATE ENGINE
-- ============================================================================

CREATE TABLE IF NOT EXISTS referral_rules (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    trigger_threshold INT NOT NULL DEFAULT 3,
    qualification_mode VARCHAR(50) NOT NULL DEFAULT 'registration_only',
    qualification_params JSONB DEFAULT '{}'::jsonb,
    reward_type VARCHAR(50) NOT NULL DEFAULT 'package_upgrade',
    reward_params JSONB DEFAULT '{}'::jsonb,
    per_user_limit VARCHAR(30) NOT NULL DEFAULT 'once',
    starts_at TIMESTAMPTZ,
    ends_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS referral_settings (
    id BIGSERIAL PRIMARY KEY,
    referral_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    code_format VARCHAR(50) NOT NULL DEFAULT 'alphanumeric_8',
    allow_code_regeneration BOOLEAN NOT NULL DEFAULT FALSE,
    allow_post_signup_apply BOOLEAN NOT NULL DEFAULT FALSE,
    default_rule_id BIGINT REFERENCES referral_rules(id) ON DELETE SET NULL,
    anti_fraud_settings JSONB DEFAULT '{}'::jsonb,
    popup_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    popup_headline VARCHAR(255),
    popup_body TEXT,
    popup_cta_text VARCHAR(100),
    popup_bonus_days INT DEFAULT 0,
    popup_show_frequency VARCHAR(50) DEFAULT 'once_per_session',
    popup_delay_seconds INT DEFAULT 10,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS referral_codes (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    code VARCHAR(50) NOT NULL UNIQUE,
    status VARCHAR(30) NOT NULL DEFAULT 'active',
    total_clicks INT NOT NULL DEFAULT 0,
    successful_referrals INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_referral_codes_code ON referral_codes (code);

CREATE TABLE IF NOT EXISTS referrals (
    id BIGSERIAL PRIMARY KEY,
    referrer_user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    referred_user_id BIGINT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    referral_code_id BIGINT NOT NULL REFERENCES referral_codes(id) ON DELETE CASCADE,
    source VARCHAR(30) NOT NULL DEFAULT 'link',
    status VARCHAR(30) NOT NULL DEFAULT 'pending',
    qualified_at TIMESTAMPTZ,
    invalidated_at TIMESTAMPTZ,
    reversed_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_referrals_lookup ON referrals (referrer_user_id, status);

CREATE TABLE IF NOT EXISTS referral_rewards (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rule_id BIGINT NOT NULL REFERENCES referral_rules(id) ON DELETE CASCADE,
    reward_type VARCHAR(50) NOT NULL DEFAULT 'package_upgrade',
    reward_payload JSONB DEFAULT '{}'::jsonb,
    status VARCHAR(30) NOT NULL DEFAULT 'pending',
    applied_at TIMESTAMPTZ,
    reversed_at TIMESTAMPTZ,
    idempotency_key VARCHAR(255) NOT NULL UNIQUE,
    admin_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_referral_rewards_user ON referral_rewards (user_id, status);

CREATE TABLE IF NOT EXISTS referral_audit_logs (
    id BIGSERIAL PRIMARY KEY,
    actor_type VARCHAR(50) NOT NULL,
    actor_id BIGINT,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id BIGINT,
    before_data JSONB,
    after_data JSONB,
    ip_address VARCHAR(45),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_referral_audit_logs ON referral_audit_logs (entity_type, entity_id);

-- ============================================================================
-- 10. CMS, SUPPORT & SYSTEM SETTINGS
-- ============================================================================

CREATE TABLE IF NOT EXISTS blog_categories (
    id BIGSERIAL PRIMARY KEY,
    category_name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    wp_term_id BIGINT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS blogs (
    id BIGSERIAL PRIMARY KEY,
    category_id BIGINT NOT NULL REFERENCES blog_categories(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    short_description TEXT,
    description TEXT,
    banner INT,
    meta_title VARCHAR(255),
    meta_img INT,
    meta_description TEXT,
    meta_keywords TEXT,
    status BOOLEAN NOT NULL DEFAULT TRUE,
    wp_post_id BIGINT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_blogs_category ON blogs (category_id, status);

CREATE TABLE IF NOT EXISTS support_categories (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS support_tickets (
    id BIGSERIAL PRIMARY KEY,
    ticket_id VARCHAR(100) NOT NULL UNIQUE,
    sender_user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    assigned_user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    support_category_id BIGINT REFERENCES support_categories(id) ON DELETE SET NULL,
    subject VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    attachments JSONB DEFAULT '[]'::jsonb,
    status VARCHAR(50) NOT NULL DEFAULT 'open',
    seen BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_support_tickets_sender ON support_tickets (sender_user_id, status);

CREATE TABLE IF NOT EXISTS support_ticket_replies (
    id BIGSERIAL PRIMARY KEY,
    support_ticket_id BIGINT NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
    replied_user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reply TEXT NOT NULL,
    attachments JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_support_replies_ticket ON support_ticket_replies (support_ticket_id);

CREATE TABLE IF NOT EXISTS pages (
    id BIGSERIAL PRIMARY KEY,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    content TEXT,
    meta_title VARCHAR(255),
    meta_description TEXT,
    keywords TEXT,
    meta_image TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_pages_slug ON pages (slug);

CREATE TABLE IF NOT EXISTS settings (
    id BIGSERIAL PRIMARY KEY,
    type VARCHAR(150) NOT NULL UNIQUE,
    value TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_settings_type ON settings (type);

CREATE TABLE IF NOT EXISTS email_templates (
    id BIGSERIAL PRIMARY KEY,
    identifier VARCHAR(150) NOT NULL UNIQUE,
    subject VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    status BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_email_templates_identifier ON email_templates (identifier);

CREATE TABLE IF NOT EXISTS contact_us (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(191) NOT NULL,
    email VARCHAR(191) NOT NULL,
    subject VARCHAR(191) NOT NULL,
    description TEXT NOT NULL,
    reply TEXT,
    status BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS uploads (
    id BIGSERIAL PRIMARY KEY,
    file_original_name VARCHAR(255),
    file_name VARCHAR(255) NOT NULL,
    user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    extension VARCHAR(20),
    type VARCHAR(50),
    file_size BIGINT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_uploads_user_id ON uploads (user_id);
