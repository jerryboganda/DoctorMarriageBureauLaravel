-- ============================================================================
-- 000002: Schema compatibility additions + canonical reference data
-- Idempotent: safe to run repeatedly (IF NOT EXISTS / ON CONFLICT / NOT EXISTS)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- A. Schema compatibility additions
-- ----------------------------------------------------------------------------

ALTER TABLE express_interests ADD COLUMN IF NOT EXISTS message TEXT;
ALTER TABLE express_interests ADD COLUMN IF NOT EXISTS decline_reason TEXT;
ALTER TABLE express_interests ADD COLUMN IF NOT EXISTS chat_thread_id BIGINT REFERENCES chat_threads(id) ON DELETE SET NULL;

ALTER TABLE chats ADD COLUMN IF NOT EXISTS is_biodata_share BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE members ADD COLUMN IF NOT EXISTS travel_expires_at TIMESTAMPTZ;
ALTER TABLE members ADD COLUMN IF NOT EXISTS known_languages JSONB;

ALTER TABLE field_visibility_settings ADD COLUMN IF NOT EXISTS is_anonymous BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE families ADD COLUMN IF NOT EXISTS family_type VARCHAR(50);

ALTER TABLE spiritual_backgrounds ADD COLUMN IF NOT EXISTS gothra VARCHAR(100);

ALTER TABLE gallery_images ADD COLUMN IF NOT EXISTS blurred_url TEXT;

-- Deduplicate addresses then enforce upsert key used by profile service
DELETE FROM addresses a USING addresses b
WHERE a.id > b.id AND a.user_id = b.user_id AND a.type = b.type;
CREATE UNIQUE INDEX IF NOT EXISTS addresses_user_type_unique ON addresses (user_id, type);

-- ----------------------------------------------------------------------------
-- B. Religions (explicit IDs preserved from legacy seeder)
-- ----------------------------------------------------------------------------

INSERT INTO religions (id, name) VALUES
    (1, 'Hindu'), (2, 'Muslim'), (3, 'Christian'), (4, 'Sikh'), (5, 'Buddhist'),
    (6, 'Jain'), (7, 'Parsi'), (8, 'Jewish'), (9, 'Bahai'), (10, 'Other')
ON CONFLICT (id) DO NOTHING;
SELECT setval('religions_id_seq', GREATEST((SELECT MAX(id) FROM religions), 10));

-- Castes (legacy seeder: Hindu + Muslim lists)
INSERT INTO castes (religion_id, name)
SELECT v.religion_id, v.name FROM (VALUES
    (1, 'Brahmin'), (1, 'Kshatriya'), (1, 'Vaishya'), (1, 'Shudra'),
    (1, 'Rajput'), (1, 'Maratha'), (1, 'Reddy'),
    (2, 'Sunni'), (2, 'Shia'), (2, 'Arain'), (2, 'Rajput'), (2, 'Jat'),
    (2, 'Syed'), (2, 'Sheikh'), (2, 'Gujjar'), (2, 'Pathan'), (2, 'Memon'),
    (2, 'Qureshi'), (2, 'Ansari'), (2, 'Malik'), (2, 'Butt'), (2, 'Mughal'),
    (2, 'Joyia'), (2, 'Dogar'), (2, 'Khokhar'), (2, 'Janjua'), (2, 'Awan'),
    (2, 'Hashmi'), (2, 'Alvi'), (2, 'Abbasi'), (2, 'Other')
) AS v(religion_id, name)
WHERE NOT EXISTS (
    SELECT 1 FROM castes c WHERE c.religion_id = v.religion_id AND c.name = v.name
);

-- Sects for Islam
INSERT INTO sects (religion_id, name)
SELECT 2, v.name FROM (VALUES
    ('Sunni'), ('Shia'), ('Ahle Hadith'), ('Deobandi'), ('Barelvi'), ('Other')
) AS v(name)
WHERE NOT EXISTS (SELECT 1 FROM sects s WHERE s.religion_id = 2 AND s.name = v.name);

-- ----------------------------------------------------------------------------
-- C. Simple taxonomies
-- ----------------------------------------------------------------------------

INSERT INTO marital_statuses (name)
SELECT v.name FROM (VALUES ('Single'), ('Divorced'), ('Widowed'), ('Awaiting Divorce'), ('Annulled')) AS v(name)
WHERE NOT EXISTS (SELECT 1 FROM marital_statuses m WHERE m.name = v.name);

INSERT INTO family_values (name)
SELECT v.name FROM (VALUES ('Traditional'), ('Moderate'), ('Liberal'), ('Spiritual'), ('Religious'), ('Optional')) AS v(name)
WHERE NOT EXISTS (SELECT 1 FROM family_values f WHERE f.name = v.name);

INSERT INTO member_languages (name)
SELECT v.name FROM (VALUES
    ('Urdu'), ('English'), ('Punjabi'), ('Sindhi'), ('Pashto'),
    ('Balochi'), ('Seraiki'), ('Hindko'), ('Brahui'), ('Other')
) AS v(name)
WHERE NOT EXISTS (SELECT 1 FROM member_languages ml WHERE ml.name = v.name);

INSERT INTO on_behalfs (name)
SELECT v.name FROM (VALUES ('Self'), ('Parent'), ('Sibling'), ('Relative'), ('Friend'), ('Guardian')) AS v(name)
WHERE NOT EXISTS (SELECT 1 FROM on_behalfs o WHERE o.name = v.name);

INSERT INTO annual_salary_ranges (min_salary, max_salary)
SELECT v.min_salary, v.max_salary FROM (VALUES
    (0, 1000000), (1000000, 3000000), (3000000, 5000000), (5000000, 8000000),
    (8000000, 12000000), (12000000, 20000000), (20000000, 50000000)
) AS v(min_salary, max_salary)
WHERE NOT EXISTS (
    SELECT 1 FROM annual_salary_ranges r
    WHERE r.min_salary = v.min_salary AND r.max_salary = v.max_salary
);

INSERT INTO specialities (name, category)
SELECT v.name, v.category FROM (VALUES
    ('Cardiology', 'Medicine'), ('Dermatology', 'Medicine'), ('Endocrinology', 'Medicine'),
    ('Gastroenterology', 'Medicine'), ('General Medicine', 'Medicine'), ('Hematology', 'Medicine'),
    ('Infectious Diseases', 'Medicine'), ('Nephrology', 'Medicine'), ('Neurology', 'Medicine'),
    ('Oncology', 'Medicine'), ('Pulmonology', 'Medicine'), ('Rheumatology', 'Medicine'),
    ('General Surgery', 'Surgery'), ('Cardiothoracic Surgery', 'Surgery'), ('Neurosurgery', 'Surgery'),
    ('Orthopedic Surgery', 'Surgery'), ('Plastic Surgery', 'Surgery'), ('Urology', 'Surgery'),
    ('Vascular Surgery', 'Surgery'), ('ENT (Otolaryngology)', 'Surgery'), ('Ophthalmology', 'Surgery'),
    ('Gynecology & Obstetrics', 'Specialty'), ('Pediatrics', 'Specialty'), ('Psychiatry', 'Specialty'),
    ('Radiology', 'Specialty'), ('Anesthesiology', 'Specialty'), ('Pathology', 'Specialty'),
    ('Family Medicine', 'Specialty'), ('Emergency Medicine', 'Specialty'), ('Community Medicine', 'Specialty'),
    ('Dentistry (BDS)', 'Dental'), ('Orthodontics', 'Dental'), ('Oral & Maxillofacial Surgery', 'Dental'),
    ('Pharmacy (Pharm-D)', 'Allied'), ('Physiotherapy (DPT)', 'Allied'), ('Nursing', 'Allied'),
    ('MBBS (House Officer)', 'General'), ('Medical Student', 'General'), ('Other', 'General')
) AS v(name, category)
WHERE NOT EXISTS (SELECT 1 FROM specialities s WHERE s.name = v.name);

INSERT INTO job_titles (name)
SELECT v.name FROM (VALUES
    ('House Officer'), ('Medical Officer'), ('Postgraduate Resident'), ('Registrar'),
    ('Senior Registrar'), ('Consultant'), ('Assistant Professor'), ('Associate Professor'),
    ('Professor'), ('General Practitioner'), ('Surgeon'), ('Dentist'), ('Pharmacist'),
    ('Physiotherapist'), ('Fellow'), ('Demonstrator'), ('Other')
) AS v(name)
WHERE NOT EXISTS (SELECT 1 FROM job_titles j WHERE j.name = v.name);

-- ----------------------------------------------------------------------------
-- D. Profile option values (unique on group+value)
-- ----------------------------------------------------------------------------

INSERT INTO profile_option_values ("group", value, label, sort_order, is_active)
VALUES
    ('gender', 'Male', 'Male', 0, true),
    ('gender', 'Female', 'Female', 1, true),
    ('marriage_timeline', 'immediate', 'Immediately (0-6 months)', 0, true),
    ('marriage_timeline', '6_months', 'Soon (6-12 months)', 1, true),
    ('marriage_timeline', '1_year', 'Within 1 year', 2, true),
    ('marriage_timeline', '2_years', 'Within 2 years', 3, true),
    ('marriage_timeline', 'casual', 'Looking casually', 4, true),
    ('marriage_timeline', 'optional', 'Optional', 5, true),
    ('relocation_willingness', 'international', 'Willing to relocate internationally', 0, true),
    ('relocation_willingness', 'within_country', 'Willing to relocate within country', 1, true),
    ('relocation_willingness', 'within_state', 'Willing to relocate within state', 2, true),
    ('relocation_willingness', 'not_willing', 'Not willing to relocate', 3, true),
    ('relocation_willingness', 'optional', 'Optional', 4, true),
    ('seriousness_level', 'marriage', 'Marriage', 0, true),
    ('seriousness_level', 'exploring', 'Exploring', 1, true),
    ('seriousness_level', 'casual', 'Casual', 2, true),
    ('seriousness_level', 'optional', 'Optional', 3, true),
    ('diet', 'Halal (Strict)', 'Halal (Strict)', 0, true),
    ('diet', 'Halal (Standard)', 'Halal (Standard)', 1, true),
    ('diet', 'Vegetarian', 'Vegetarian', 2, true),
    ('diet', 'Vegan', 'Vegan', 3, true),
    ('diet', 'No Preference', 'No Preference', 4, true),
    ('drink', 'Never', 'Never', 0, true),
    ('drink', 'Occasionally', 'Occasionally', 1, true),
    ('drink', 'Regularly', 'Regularly', 2, true),
    ('smoke', 'Never', 'Never', 0, true),
    ('smoke', 'Occasionally', 'Occasionally', 1, true),
    ('smoke', 'Regularly', 'Regularly', 2, true),
    ('property', 'Own Home', 'Own Home', 0, true),
    ('property', 'Rented', 'Rented', 1, true),
    ('living_with', 'With Parents', 'With Parents', 0, true),
    ('living_with', 'Alone', 'Alone', 1, true),
    ('living_with', 'With Roommates', 'With Roommates', 2, true),
    ('sleep_schedule', 'early_bird', 'Early Bird', 0, true),
    ('sleep_schedule', 'night_owl', 'Night Owl', 1, true),
    ('sleep_schedule', 'flexible', 'Flexible', 2, true),
    ('work_location_type', 'on_site', 'On-site', 0, true),
    ('work_location_type', 'remote', 'Remote', 1, true),
    ('work_location_type', 'hybrid', 'Hybrid', 2, true),
    ('family_type', 'nuclear', 'Nuclear Family', 0, true),
    ('family_type', 'joint', 'Joint Family', 1, true),
    ('family_type', 'extended', 'Extended Family', 2, true),
    ('immigration_status', 'citizen', 'Citizen', 0, true),
    ('immigration_status', 'dual_national', 'Dual National', 1, true),
    ('immigration_status', 'work_visa', 'Work Visa', 2, true),
    ('immigration_status', 'student_visa', 'Student Visa', 3, true),
    ('immigration_status', 'permanent_resident', 'Permanent Resident', 4, true),
    ('personal_values', 'Moderately Religious', 'Moderately Religious', 0, true),
    ('personal_values', 'Very Religious', 'Very Religious', 1, true),
    ('personal_values', 'Spiritual', 'Spiritual', 2, true),
    ('personal_values', 'Not Religious', 'Not Religious', 3, true),
    ('personal_values', 'Optional', 'Optional', 4, true),
    ('community_values', 'Traditional', 'Traditional', 0, true),
    ('community_values', 'Modern', 'Modern', 1, true),
    ('community_values', 'Islamic', 'Islamic', 2, true),
    ('community_values', 'Social', 'Social', 3, true),
    ('community_values', 'Optional', 'Optional', 4, true)
ON CONFLICT ("group", value) DO NOTHING;

-- ----------------------------------------------------------------------------
-- E. Progression stages (slug unique)
-- ----------------------------------------------------------------------------

INSERT INTO progression_stages (name, "order", progress_percent, slug, description) VALUES
    ('First Meetings', 1, 20, 'first-meetings', 'Initial introductions and first conversations between both members.'),
    ('Getting to Know', 2, 40, 'getting-to-know', 'Deeper conversations to understand values, goals and compatibility.'),
    ('Families Met', 3, 60, 'families-met', 'Both families have been introduced and are involved in the process.'),
    ('Exclusive Courtship', 4, 80, 'exclusive-courtship', 'Both members are exclusively pursuing this match.'),
    ('Engaged', 5, 100, 'engaged', 'The couple is officially engaged. Congratulations!')
ON CONFLICT (slug) DO NOTHING;

-- ----------------------------------------------------------------------------
-- F. Communities (slug unique)
-- ----------------------------------------------------------------------------

INSERT INTO communities (created_by, name, slug, type, description, is_private, is_active) VALUES
    (NULL, 'Doctors of Lahore', 'doctors-of-lahore', 'region', 'A community for doctors based in Lahore to connect and network.', false, true),
    (NULL, 'AKU Alumni Network', 'aku-alumni-network', 'alumni', 'Exclusive network for Aga Khan University alumni.', true, true),
    (NULL, 'Arain Doctors Family', 'arain-doctors-family', 'culture', 'Cultural community for Arain doctors and their families.', true, true),
    (NULL, 'Cardiology Society Pakistan', 'cardiology-society-pakistan', 'specialty', 'Professional community for cardiologists across Pakistan.', false, true)
ON CONFLICT (slug) DO NOTHING;

-- ----------------------------------------------------------------------------
-- G. Packages (site pricing: 3-month PKR 5,000 / 6-month PKR 8,000 — canonical 2 packages)
-- ----------------------------------------------------------------------------

-- Ensure canonical 2 paid packages exist with correct pricing
INSERT INTO packages (name, price, validity, express_interest, contact, photo_gallery,
                      profile_image_view, gallery_image_view, profile_viewers_view,
                      auto_profile_match, active, status)
SELECT v.* FROM (VALUES
    ('Essential Membership', 5000.00, 90, 30, 15, 10, 200, 100, 25, true, true, true),
    ('Extended Membership', 8000.00, 180, 100, 50, 25, 1000, 500, 100, true, true, true)
) AS v(name, price, validity, express_interest, contact, photo_gallery,
       profile_image_view, gallery_image_view, profile_viewers_view,
       auto_profile_match, active, status)
WHERE NOT EXISTS (SELECT 1 FROM packages p WHERE p.name = v.name);

-- Correct pricing if already existed with wrong values
UPDATE packages SET price = 5000.00, validity = 90 WHERE name = 'Essential Membership' AND (price <> 5000.00 OR validity <> 90);
UPDATE packages SET price = 8000.00, validity = 180 WHERE name = 'Extended Membership' AND (price <> 8000.00 OR validity <> 180);
-- Deactivate legacy Free Starter if present (keep row for FK safety, but hide from storefront)
UPDATE packages SET active = false, status = false WHERE name = 'Free Starter';

-- ----------------------------------------------------------------------------
-- H. Coupons (code unique)
-- ----------------------------------------------------------------------------

INSERT INTO coupons (code, name, description, discount_type, discount_value, min_amount,
                     max_redemptions, per_user_limit, applicable_to, is_active) VALUES
    ('WELCOME10', 'Welcome 10% Off', '10% off on any package purchase.', 'percent', 10, NULL, 500, 1, 'package', true),
    ('MATCH50', 'Flat 50 Off', 'Save 50 on any purchase above 500.', 'amount', 50, 500, 100, 1, 'any', true)
ON CONFLICT (code) DO NOTHING;

-- ----------------------------------------------------------------------------
-- I. Referral program defaults
-- ----------------------------------------------------------------------------

INSERT INTO referral_rules (name, is_active, trigger_threshold, qualification_mode, reward_type, reward_params, per_user_limit)
SELECT 'Refer 3 Doctors - Free Month', true, 3, 'registration_only', 'package_upgrade', '{"bonus_days": 30}'::jsonb, 'once'
WHERE NOT EXISTS (SELECT 1 FROM referral_rules);

INSERT INTO referral_settings (referral_enabled, code_format, default_rule_id, popup_enabled,
                               popup_headline, popup_body, popup_cta_text, popup_bonus_days)
SELECT true, 'alphanumeric_8', (SELECT id FROM referral_rules ORDER BY id LIMIT 1), false,
       'Invite fellow doctors', 'Refer 3 doctor friends and earn a free month of membership.', 'Invite Now', 30
WHERE NOT EXISTS (SELECT 1 FROM referral_settings);

-- ----------------------------------------------------------------------------
-- J. Geography: Pakistan (full) + major countries
-- ----------------------------------------------------------------------------

INSERT INTO countries (code, name, status, phone_code)
SELECT v.code, v.name, true, v.phone_code FROM (VALUES
    ('PK', 'Pakistan', '+92'),
    ('US', 'United States', '+1'),
    ('GB', 'United Kingdom', '+44'),
    ('CA', 'Canada', '+1'),
    ('AU', 'Australia', '+61'),
    ('AE', 'United Arab Emirates', '+971'),
    ('SA', 'Saudi Arabia', '+966'),
    ('QA', 'Qatar', '+974'),
    ('KW', 'Kuwait', '+965'),
    ('BH', 'Bahrain', '+973'),
    ('OM', 'Oman', '+968'),
    ('DE', 'Germany', '+49'),
    ('FR', 'France', '+33'),
    ('IE', 'Ireland', '+353'),
    ('NL', 'Netherlands', '+31'),
    ('SE', 'Sweden', '+46'),
    ('NO', 'Norway', '+47'),
    ('DK', 'Denmark', '+45'),
    ('CH', 'Switzerland', '+41'),
    ('IT', 'Italy', '+39'),
    ('ES', 'Spain', '+34'),
    ('TR', 'Turkiye', '+90'),
    ('MY', 'Malaysia', '+60'),
    ('SG', 'Singapore', '+65'),
    ('CN', 'China', '+86'),
    ('JP', 'Japan', '+81'),
    ('KR', 'South Korea', '+82'),
    ('IN', 'India', '+91'),
    ('BD', 'Bangladesh', '+880'),
    ('AF', 'Afghanistan', '+93'),
    ('IR', 'Iran', '+98'),
    ('EG', 'Egypt', '+20'),
    ('ZA', 'South Africa', '+27'),
    ('NG', 'Nigeria', '+234'),
    ('KE', 'Kenya', '+254'),
    ('BR', 'Brazil', '+55'),
    ('MX', 'Mexico', '+52'),
    ('RU', 'Russia', '+7'),
    ('NZ', 'New Zealand', '+64'),
    ('TH', 'Thailand', '+66'),
    ('ID', 'Indonesia', '+62'),
    ('PH', 'Philippines', '+63'),
    ('LK', 'Sri Lanka', '+94'),
    ('NP', 'Nepal', '+977'),
    ('JO', 'Jordan', '+962'),
    ('LB', 'Lebanon', '+961'),
    ('IQ', 'Iraq', '+964'),
    ('AZ', 'Azerbaijan', '+994'),
    ('KZ', 'Kazakhstan', '+7'),
    ('UZ', 'Uzbekistan', '+998'),
    ('BN', 'Brunei', '+673'),
    ('MV', 'Maldives', '+960')
) AS v(code, name, phone_code)
WHERE NOT EXISTS (SELECT 1 FROM countries c WHERE c.code = v.code);

-- Pakistani provinces / territories
INSERT INTO states (country_id, name)
SELECT (SELECT id FROM countries WHERE code = 'PK'), v.name FROM (VALUES
    ('Punjab'), ('Sindh'), ('Khyber Pakhtunkhwa'), ('Balochistan'),
    ('Islamabad Capital Territory'), ('Gilgit-Baltistan'), ('Azad Jammu & Kashmir')
) AS v(name)
WHERE NOT EXISTS (
    SELECT 1 FROM states s
    WHERE s.country_id = (SELECT id FROM countries WHERE code = 'PK') AND s.name = v.name
);

-- Major Pakistani cities
INSERT INTO cities (state_id, country_id, name)
SELECT s.id, s.country_id, v.city
FROM (VALUES
    ('Punjab', 'Lahore'), ('Punjab', 'Faisalabad'), ('Punjab', 'Rawalpindi'),
    ('Punjab', 'Multan'), ('Punjab', 'Gujranwala'), ('Punjab', 'Sialkot'),
    ('Punjab', 'Bahawalpur'), ('Punjab', 'Sargodha'), ('Punjab', 'Gujrat'),
    ('Punjab', 'Sheikhupura'), ('Punjab', 'Jhelum'), ('Punjab', 'Sahiwal'),
    ('Punjab', 'Rahim Yar Khan'), ('Punjab', 'Kasur'), ('Punjab', 'Okara'),
    ('Punjab', 'Dera Ghazi Khan'),
    ('Sindh', 'Karachi'), ('Sindh', 'Hyderabad'), ('Sindh', 'Sukkur'),
    ('Sindh', 'Larkana'), ('Sindh', 'Nawabshah'), ('Sindh', 'Mirpur Khas'),
    ('Khyber Pakhtunkhwa', 'Peshawar'), ('Khyber Pakhtunkhwa', 'Mardan'),
    ('Khyber Pakhtunkhwa', 'Abbottabad'), ('Khyber Pakhtunkhwa', 'Swat'),
    ('Khyber Pakhtunkhwa', 'Kohat'), ('Khyber Pakhtunkhwa', 'Dera Ismail Khan'),
    ('Balochistan', 'Quetta'), ('Balochistan', 'Gwadar'), ('Balochistan', 'Turbat'),
    ('Islamabad Capital Territory', 'Islamabad'),
    ('Gilgit-Baltistan', 'Gilgit'), ('Gilgit-Baltistan', 'Skardu'),
    ('Azad Jammu & Kashmir', 'Muzaffarabad'), ('Azad Jammu & Kashmir', 'Mirpur')
) AS v(state, city)
JOIN states s ON s.name = v.state
    AND s.country_id = (SELECT id FROM countries WHERE code = 'PK')
WHERE NOT EXISTS (
    SELECT 1 FROM cities c WHERE c.state_id = s.id AND c.name = v.city
);
