# Doctor Marriage Bureau — Database Schema Mapping (MySQL 8.0 → PostgreSQL 16)

**Target Relational Store:** PostgreSQL 16 Alpine  
**Collation / Encoding:** `UTF8` / `en_US.UTF-8`  
**Identity Strategy:** 100% preservation of legacy MySQL Auto-Increment IDs (`BIGSERIAL PRIMARY KEY`)  
**Data Integrity Rule:** All timestamp zero-dates (`0000-00-00 00:00:00`) converted to `NULL`; Bcrypt strings (`$2y$`, `$2a$`) preserved verbatim.  

---

## 1. Relational Table Mapping Matrix

| # | MySQL 8.0 Table | PostgreSQL 16 Table | Primary Key | Key Field Mappings & Type Conversions | Foreign Keys & Cascade Policies | Target Indexes |
|---|---|---|---|---|---|---|
| 1 | `users` | `users` | `id BIGSERIAL` | `email VARCHAR(255) UNIQUE`, `password VARCHAR(255)`, `user_type VARCHAR(50)`, `email_verified_at TIMESTAMPTZ`, `status BOOLEAN DEFAULT true` | None (Root entity) | `idx_users_email`, `idx_users_phone`, `idx_users_status` |
| 2 | `members` | `members` | `id BIGSERIAL` | `user_id BIGINT UNIQUE`, `gender VARCHAR(20)`, `birthday DATE`, `is_approved BOOLEAN DEFAULT false`, `package_id BIGINT`, `remaining_interest INT` | `user_id -> users(id) ON DELETE CASCADE`, `package_id -> packages(id) ON DELETE SET NULL` | `idx_members_search (is_approved, gender, birthday)` |
| 3 | `physical_attributes` | `physical_attributes` | `id BIGSERIAL` | `user_id BIGINT UNIQUE`, `height NUMERIC(5,2)`, `weight INT`, `eye_color VARCHAR(50)`, `complexion VARCHAR(50)` | `user_id -> users(id) ON DELETE CASCADE` | `idx_physical_user_id` |
| 4 | `spiritual_backgrounds` | `spiritual_backgrounds` | `id BIGSERIAL` | `user_id BIGINT UNIQUE`, `religion_id BIGINT`, `sect_id BIGINT`, `caste_id BIGINT`, `sub_caste_id BIGINT`, `ethnicity VARCHAR(100)` | `user_id -> users(id) ON DELETE CASCADE`, `religion_id -> religions(id)`, `sect_id -> sects(id)` | `idx_spiritual_search (religion_id, sect_id, caste_id)` |
| 5 | `lifestyles` | `lifestyles` | `id BIGSERIAL` | `user_id BIGINT UNIQUE`, `diet VARCHAR(50)`, `drink VARCHAR(50)`, `smoke VARCHAR(50)`, `living_with_family BOOLEAN` | `user_id -> users(id) ON DELETE CASCADE` | `idx_lifestyles_user_id` |
| 6 | `astrologies` | `astrologies` | `id BIGSERIAL` | `user_id BIGINT UNIQUE`, `sun_sign VARCHAR(50)`, `moon_sign VARCHAR(50)`, `time_of_birth TIME`, `city_of_birth VARCHAR(100)` | `user_id -> users(id) ON DELETE CASCADE` | `idx_astrologies_user_id` |
| 7 | `attitudes` | `attitudes` | `id BIGSERIAL` | `user_id BIGINT UNIQUE`, `personal_values TEXT`, `interests JSONB`, `political_views VARCHAR(100)` | `user_id -> users(id) ON DELETE CASCADE` | `idx_attitudes_user_id` |
| 8 | `recidencies` | `recidencies` | `id BIGSERIAL` | `user_id BIGINT UNIQUE`, `birth_country_id BIGINT`, `residence_country_id BIGINT`, `citizenship_country_id BIGINT`, `grow_up_country_id BIGINT` | `user_id -> users(id) ON DELETE CASCADE` | `idx_recidencies_user_id` |
| 9 | `families` | `families` | `id BIGSERIAL` | `user_id BIGINT UNIQUE`, `father_name VARCHAR(150)`, `father_occupation VARCHAR(150)`, `mother_name VARCHAR(150)`, `brothers_count INT`, `sisters_count INT` | `user_id -> users(id) ON DELETE CASCADE` | `idx_families_user_id` |
| 10 | `partner_expectations` | `partner_expectations` | `id BIGSERIAL` | `user_id BIGINT UNIQUE`, `general_requirement TEXT`, `min_age INT`, `max_age INT`, `min_height NUMERIC(5,2)`, `max_height NUMERIC(5,2)`, `religion_id BIGINT`, `speciality_preferences JSONB` | `user_id -> users(id) ON DELETE CASCADE` | `idx_partner_expectations_user_id` |
| 11 | `partner_preference_priorities`| `partner_preference_priorities`| `id BIGSERIAL` | `user_id BIGINT UNIQUE`, `age_weight VARCHAR(30)`, `location_weight VARCHAR(30)`, `career_weight VARCHAR(30)`, `weights JSONB` | `user_id -> users(id) ON DELETE CASCADE` | `idx_partner_priorities_user_id` |
| 12 | `field_visibility_settings` | `field_visibility_settings` | `id BIGSERIAL` | `user_id BIGINT UNIQUE`, `profile_photo VARCHAR(30)`, `phone VARCHAR(30)`, `family_details VARCHAR(30)`, `is_anonymous BOOLEAN DEFAULT false` | `user_id -> users(id) ON DELETE CASCADE` | `idx_visibility_user_id` |
| 13 | `express_interests` | `express_interests` | `id BIGSERIAL` | `user_id BIGINT` (sender), `interesting_user_id BIGINT` (recipient), `status VARCHAR(30) DEFAULT 'pending'`, `created_at TIMESTAMPTZ` | `user_id -> users(id) ON DELETE CASCADE`, `interesting_user_id -> users(id) ON DELETE CASCADE` | `idx_interests_lookup (user_id, interesting_user_id, status)` |
| 14 | `shortlists` | `shortlists` | `id BIGSERIAL` | `user_id BIGINT`, `shortlisted_user_id BIGINT`, `created_at TIMESTAMPTZ` | `user_id -> users(id) ON DELETE CASCADE`, `shortlisted_user_id -> users(id) ON DELETE CASCADE` | `idx_shortlists_unique (user_id, shortlisted_user_id) UNIQUE` |
| 15 | `ignored_users` | `ignored_users` | `id BIGSERIAL` | `user_id BIGINT`, `ignored_user_id BIGINT`, `created_at TIMESTAMPTZ` | `user_id -> users(id) ON DELETE CASCADE`, `ignored_user_id -> users(id) ON DELETE CASCADE` | `idx_ignored_users_unique (user_id, ignored_user_id) UNIQUE` |
| 16 | `profile_viewers` | `profile_viewers` | `id BIGSERIAL` | `user_id BIGINT`, `viewed_by_user_id BIGINT`, `viewed_at TIMESTAMPTZ` | `user_id -> users(id) ON DELETE CASCADE`, `viewed_by_user_id -> users(id) ON DELETE CASCADE` | `idx_profile_viewers_timeline (user_id, viewed_at DESC)` |
| 17 | `chat_threads` | `chat_threads` | `id BIGSERIAL` | `user_one_id BIGINT`, `user_two_id BIGINT`, `last_message TEXT`, `last_message_at TIMESTAMPTZ` | `user_one_id -> users(id) ON DELETE CASCADE`, `user_two_id -> users(id) ON DELETE CASCADE` | `idx_chat_threads_pair (user_one_id, user_two_id) UNIQUE` |
| 18 | `chats` | `chats` | `id BIGSERIAL` | `thread_id BIGINT`, `sender_user_id BIGINT`, `receiver_user_id BIGINT`, `message TEXT`, `attachment_url TEXT`, `is_read BOOLEAN DEFAULT false`, `created_at TIMESTAMPTZ` | `thread_id -> chat_threads(id) ON DELETE CASCADE`, `sender_user_id -> users(id) ON DELETE CASCADE` | `idx_chats_thread (thread_id, created_at DESC)`, `idx_chats_unread (receiver_user_id, is_read)` |
| 19 | `member_progressions` | `member_progressions` | `id BIGSERIAL` | `user_id BIGINT`, `partner_id BIGINT`, `current_stage_id BIGINT`, `status VARCHAR(30)`, `started_at TIMESTAMPTZ` | `user_id -> users(id) ON DELETE CASCADE`, `partner_id -> users(id) ON DELETE CASCADE` | `idx_progressions_pair (user_id, partner_id)` |
| 20 | `progression_stages` | `progression_stages` | `id BIGSERIAL` | `name VARCHAR(100)`, `slug VARCHAR(100) UNIQUE`, `order_index INT`, `description TEXT` | None (Lookup seed) | `idx_progression_stages_order (order_index)` |
| 21 | `progression_checklist_items`| `progression_checklist_items`| `id BIGSERIAL` | `progression_id BIGINT`, `title VARCHAR(255)`, `is_completed BOOLEAN DEFAULT false`, `completed_at TIMESTAMPTZ` | `progression_id -> member_progressions(id) ON DELETE CASCADE` | `idx_progression_checklist (progression_id)` |
| 22 | `packages` | `packages` | `id BIGSERIAL` | `name VARCHAR(150)`, `price NUMERIC(12,2)`, `validity_days INT`, `proposal_limit INT`, `contact_view_limit INT`, `is_active BOOLEAN DEFAULT true` | None | `idx_packages_active (is_active)` |
| 23 | `package_payments` | `package_payments` | `id BIGSERIAL` | `user_id BIGINT`, `package_id BIGINT`, `amount NUMERIC(12,2)`, `payment_method VARCHAR(50)`, `payment_status VARCHAR(50)`, `transaction_id VARCHAR(150)`, `payment_proof TEXT` | `user_id -> users(id) ON DELETE CASCADE`, `package_id -> packages(id)` | `idx_payments_status (payment_status, created_at DESC)` |
| 24 | `coupons` | `coupons` | `id BIGSERIAL` | `code VARCHAR(50) UNIQUE`, `discount_percent NUMERIC(5,2)`, `max_uses INT`, `used_count INT DEFAULT 0`, `expires_at TIMESTAMPTZ` | None | `idx_coupons_code (code)` |
| 25 | `wallets` | `wallets` | `id BIGSERIAL` | `user_id BIGINT UNIQUE`, `balance NUMERIC(12,2) DEFAULT 0.00`, `updated_at TIMESTAMPTZ` | `user_id -> users(id) ON DELETE CASCADE` | `idx_wallets_user_id` |
| 26 | `transactions` | `transactions` | `id BIGSERIAL` | `wallet_id BIGINT`, `user_id BIGINT`, `type VARCHAR(30)`, `amount NUMERIC(12,2)`, `details TEXT`, `created_at TIMESTAMPTZ` | `wallet_id -> wallets(id) ON DELETE CASCADE` | `idx_transactions_user (user_id, created_at DESC)` |
| 27 | `user_two_factor_settings` | `user_two_factor_settings` | `id BIGSERIAL` | `user_id BIGINT UNIQUE`, `is_enabled BOOLEAN DEFAULT false`, `totp_secret TEXT`, `recovery_codes JSONB`, `confirmed_at TIMESTAMPTZ` | `user_id -> users(id) ON DELETE CASCADE` | `idx_2fa_user_id` |
| 28 | `step_up_auth_tokens` | `step_up_auth_tokens` | `id BIGSERIAL` | `user_id BIGINT`, `token_hash VARCHAR(255)`, `action_type VARCHAR(50)`, `expires_at TIMESTAMPTZ`, `used_at TIMESTAMPTZ` | `user_id -> users(id) ON DELETE CASCADE` | `idx_stepup_lookup (user_id, token_hash, expires_at)` |
| 29 | `trusted_contacts` | `trusted_contacts` | `id BIGSERIAL` | `user_id BIGINT`, `name VARCHAR(150)`, `phone VARCHAR(50)`, `email VARCHAR(255)`, `verification_token VARCHAR(100)`, `is_verified BOOLEAN DEFAULT false` | `user_id -> users(id) ON DELETE CASCADE` | `idx_trusted_contacts_user (user_id)` |
| 30 | `verification_codes` | `verification_codes` | `id BIGSERIAL` | `identifier VARCHAR(255)`, `code VARCHAR(20)`, `type VARCHAR(30)`, `expires_at TIMESTAMPTZ`, `is_used BOOLEAN DEFAULT false` | None | `idx_verification_lookup (identifier, code, type)` |
| 31 | `gallery_images` | `gallery_images` | `id BIGSERIAL` | `user_id BIGINT`, `image_url TEXT`, `blurred_url TEXT`, `is_primary BOOLEAN DEFAULT false`, `is_private BOOLEAN DEFAULT false` | `user_id -> users(id) ON DELETE CASCADE` | `idx_gallery_user (user_id, is_primary)` |
| 32 | `view_gallery_images` | `view_gallery_images` | `id BIGSERIAL` | `user_id BIGINT` (owner), `requested_by_user_id BIGINT`, `status VARCHAR(30) DEFAULT 'pending'` | `user_id -> users(id) ON DELETE CASCADE` | `idx_view_gallery_lookup (user_id, requested_by_user_id)` |
| 33 | `countries` | `countries` | `id BIGSERIAL` | `name VARCHAR(100)`, `code VARCHAR(10)`, `phone_code VARCHAR(20)` | None (Taxonomy) | `idx_countries_name` |
| 34 | `states` | `states` | `id BIGSERIAL` | `country_id BIGINT`, `name VARCHAR(100)` | `country_id -> countries(id) ON DELETE CASCADE` | `idx_states_country (country_id)` |
| 35 | `cities` | `cities` | `id BIGSERIAL` | `state_id BIGINT`, `country_id BIGINT`, `name VARCHAR(100)` | `state_id -> states(id) ON DELETE CASCADE` | `idx_cities_state_name (state_id, name)` |
| 36 | `religions` | `religions` | `id BIGSERIAL` | `name VARCHAR(100)` | None (Taxonomy) | `idx_religions_name` |
| 37 | `sects` | `sects` | `id BIGSERIAL` | `religion_id BIGINT`, `name VARCHAR(100)` | `religion_id -> religions(id) ON DELETE CASCADE` | `idx_sects_religion (religion_id)` |
| 38 | `castes` | `castes` | `id BIGSERIAL` | `religion_id BIGINT`, `name VARCHAR(100)` | `religion_id -> religions(id) ON DELETE CASCADE` | `idx_castes_religion (religion_id)` |
| 39 | `specialities` | `specialities` | `id BIGSERIAL` | `name VARCHAR(150) UNIQUE`, `category VARCHAR(100)` | None (Medical Taxonomy) | `idx_specialities_name` |
| 40 | `referral_codes` | `referral_codes` | `id BIGSERIAL` | `user_id BIGINT UNIQUE`, `code VARCHAR(50) UNIQUE`, `total_clicks INT DEFAULT 0`, `successful_referrals INT DEFAULT 0` | `user_id -> users(id) ON DELETE CASCADE` | `idx_referral_codes_code` |

---

## 2. PostgreSQL DDL Standards & Type Translation Rules

1. **Auto-Increment Primary Keys:**
   ```sql
   -- MySQL: id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY
   -- PostgreSQL:
   id BIGSERIAL PRIMARY KEY
   ```
2. **Boolean Flags:**
   ```sql
   -- MySQL: is_approved TINYINT(1) DEFAULT 0
   -- PostgreSQL:
   is_approved BOOLEAN NOT NULL DEFAULT FALSE
   ```
3. **Timestamps with Time Zone:**
   ```sql
   -- MySQL: created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP
   -- PostgreSQL:
   created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
   ```
4. **JSON Document Columns:**
   ```sql
   -- MySQL: preferences LONGTEXT / JSON
   -- PostgreSQL:
   preferences JSONB NOT NULL DEFAULT '{}'::jsonb
   ```
5. **Money / Financial Ledgers:**
   ```sql
   -- MySQL: price DECIMAL(10,2)
   -- PostgreSQL:
   price NUMERIC(12,2) NOT NULL DEFAULT 0.00
   ```

---

## 3. Data Integrity & Migration Checksum Rules

During ETL migration (`scripts/migration/migrate_mysql_to_postgres.py`):
- All 40+ tables are migrated with sequence sync: `SELECT setval(pg_get_serial_sequence('table_name', 'id'), COALESCE(max(id), 1)) FROM table_name;`.
- Row count parity must be exactly 100% across all migrated tables.
- Verification script `verify_data_integrity.py` calculates SHA-256 row hashes across key columns (`users.email`, `members.birthday`, `chats.message`, `package_payments.transaction_id`) to assert zero bitrot.
