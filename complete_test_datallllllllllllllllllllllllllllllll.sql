-- =====================================================
-- COMPLETE MATRIMONIAL TEST DATA - CORRECTED VERSION
-- =====================================================

-- First, truncate all tables in proper order (reverse dependency)
SET FOREIGN_KEY_CHECKS = 0;

TRUNCATE TABLE `chats`;
TRUNCATE TABLE `chat_threads`;
TRUNCATE TABLE `express_interests`;
TRUNCATE TABLE `gallery_images`;
TRUNCATE TABLE `shortlists`;
TRUNCATE TABLE `profile_viewers`;
TRUNCATE TABLE `package_payments`;
TRUNCATE TABLE `member_languages`;
TRUNCATE TABLE `families`;
TRUNCATE TABLE `hobbies`;
TRUNCATE TABLE `physical_attributes`;
TRUNCATE TABLE `careers`;
TRUNCATE TABLE `education`;
TRUNCATE TABLE `addresses`;
TRUNCATE TABLE `members`;
TRUNCATE TABLE `users`;
TRUNCATE TABLE `packages`;
TRUNCATE TABLE `sub_castes`;
TRUNCATE TABLE `castes`;
TRUNCATE TABLE `religions`;
TRUNCATE TABLE `cities`;
TRUNCATE TABLE `states`;
TRUNCATE TABLE `countries`;
TRUNCATE TABLE `languages`;
TRUNCATE TABLE `marital_statuses`;
TRUNCATE TABLE `on_behalves`;
TRUNCATE TABLE `annual_salary_ranges`;
TRUNCATE TABLE `family_statuses`;
TRUNCATE TABLE `family_values`;
TRUNCATE TABLE `currencies`;
TRUNCATE TABLE `settings`;

SET FOREIGN_KEY_CHECKS = 1;

-- =====================================================
-- REFERENCE DATA
-- =====================================================

-- Currencies (5 records)
INSERT INTO `currencies` (`id`, `name`, `symbol`, `exchange_rate`, `status`, `code`, `created_at`, `updated_at`) VALUES
(1, 'US Dollar', '$', 1.00, 1, 'USD', NOW(), NOW()),
(2, 'Indian Rupee', '₹', 83.50, 1, 'INR', NOW(), NOW()),
(3, 'Euro', '€', 0.85, 1, 'EUR', NOW(), NOW()),
(4, 'British Pound', '£', 0.73, 1, 'GBP', NOW(), NOW()),
(5, 'Canadian Dollar', 'C$', 1.35, 1, 'CAD', NOW(), NOW());

-- Settings (essential settings)
INSERT INTO `settings` (`type`, `value`, `created_at`, `updated_at`) VALUES
('system_default_currency', '1', NOW(), NOW()),
('system_default_language', '1', NOW(), NOW()),
('site_name', 'Matrimonial Site', NOW(), NOW()),
('system_logo_white', 'logo.png', NOW(), NOW()),
('system_logo_black', 'logo_black.png', NOW(), NOW());

-- Languages (10 records)
INSERT INTO `languages` (`id`, `name`, `code`, `rtl`, `created_at`, `updated_at`) VALUES
(1, 'English', 'en', 0, NOW(), NOW()),
(2, 'Hindi', 'hi', 0, NOW(), NOW()),
(3, 'Bengali', 'bn', 0, NOW(), NOW()),
(4, 'Telugu', 'te', 0, NOW(), NOW()),
(5, 'Marathi', 'mr', 0, NOW(), NOW()),
(6, 'Tamil', 'ta', 0, NOW(), NOW()),
(7, 'Gujarati', 'gu', 0, NOW(), NOW()),
(8, 'Urdu', 'ur', 1, NOW(), NOW()),
(9, 'Kannada', 'kn', 0, NOW(), NOW()),
(10, 'Malayalam', 'ml', 0, NOW(), NOW());

-- Annual Salary Ranges (20 records)
INSERT INTO `annual_salary_ranges` (`id`, `min_salary`, `max_salary`, `created_at`, `updated_at`) VALUES
(1, 0, 100000, NOW(), NOW()),
(2, 100000, 200000, NOW(), NOW()),
(3, 200000, 300000, NOW(), NOW()),
(4, 300000, 400000, NOW(), NOW()),
(5, 400000, 500000, NOW(), NOW()),
(6, 500000, 600000, NOW(), NOW()),
(7, 600000, 700000, NOW(), NOW()),
(8, 700000, 800000, NOW(), NOW()),
(9, 800000, 900000, NOW(), NOW()),
(10, 900000, 1000000, NOW(), NOW()),
(11, 1000000, 1500000, NOW(), NOW()),
(12, 1500000, 2000000, NOW(), NOW()),
(13, 2000000, 2500000, NOW(), NOW()),
(14, 2500000, 3000000, NOW(), NOW()),
(15, 3000000, 4000000, NOW(), NOW()),
(16, 4000000, 5000000, NOW(), NOW()),
(17, 5000000, 7500000, NOW(), NOW()),
(18, 7500000, 10000000, NOW(), NOW()),
(19, 10000000, 15000000, NOW(), NOW()),
(20, 15000000, 99999999, NOW(), NOW());

-- Countries (5 records)
INSERT INTO `countries` (`id`, `code`, `name`, `created_at`, `updated_at`) VALUES
(1, 'US', 'United States', NOW(), NOW()),
(2, 'CA', 'Canada', NOW(), NOW()),
(3, 'GB', 'United Kingdom', NOW(), NOW()),
(4, 'AU', 'Australia', NOW(), NOW()),
(99, 'IN', 'India', NOW(), NOW());

-- States (36 Indian states and UTs)
INSERT INTO `states` (`id`, `country_id`, `name`, `created_at`, `updated_at`) VALUES
(1, 99, 'Andhra Pradesh', NOW(), NOW()),
(2, 99, 'Arunachal Pradesh', NOW(), NOW()),
(3, 99, 'Assam', NOW(), NOW()),
(4, 99, 'Bihar', NOW(), NOW()),
(5, 99, 'Chhattisgarh', NOW(), NOW()),
(6, 99, 'Goa', NOW(), NOW()),
(7, 99, 'Gujarat', NOW(), NOW()),
(8, 99, 'Haryana', NOW(), NOW()),
(9, 99, 'Himachal Pradesh', NOW(), NOW()),
(10, 99, 'Jharkhand', NOW(), NOW()),
(11, 99, 'Karnataka', NOW(), NOW()),
(12, 99, 'Kerala', NOW(), NOW()),
(13, 99, 'Madhya Pradesh', NOW(), NOW()),
(14, 99, 'Maharashtra', NOW(), NOW()),
(15, 99, 'Manipur', NOW(), NOW()),
(16, 99, 'Meghalaya', NOW(), NOW()),
(17, 99, 'Mizoram', NOW(), NOW()),
(18, 99, 'Nagaland', NOW(), NOW()),
(19, 99, 'Odisha', NOW(), NOW()),
(20, 99, 'Punjab', NOW(), NOW()),
(21, 99, 'Rajasthan', NOW(), NOW()),
(22, 99, 'Sikkim', NOW(), NOW()),
(23, 99, 'Tamil Nadu', NOW(), NOW()),
(24, 99, 'Telangana', NOW(), NOW()),
(25, 99, 'Tripura', NOW(), NOW()),
(26, 99, 'Uttar Pradesh', NOW(), NOW()),
(27, 99, 'Uttarakhand', NOW(), NOW()),
(28, 99, 'West Bengal', NOW(), NOW()),
(29, 99, 'Andaman and Nicobar Islands', NOW(), NOW()),
(30, 99, 'Chandigarh', NOW(), NOW()),
(31, 99, 'Dadra and Nagar Haveli and Daman and Diu', NOW(), NOW()),
(32, 99, 'Lakshadweep', NOW(), NOW()),
(33, 99, 'Delhi', NOW(), NOW()),
(34, 99, 'Puducherry', NOW(), NOW()),
(35, 99, 'Ladakh', NOW(), NOW()),
(36, 99, 'Jammu and Kashmir', NOW(), NOW());

-- Cities (50 major Indian cities)
INSERT INTO `cities` (`id`, `state_id`, `name`, `created_at`, `updated_at`) VALUES
(1, 14, 'Mumbai', NOW(), NOW()),
(2, 33, 'Delhi', NOW(), NOW()),
(3, 11, 'Bangalore', NOW(), NOW()),
(4, 1, 'Hyderabad', NOW(), NOW()),
(5, 7, 'Ahmedabad', NOW(), NOW()),
(6, 23, 'Chennai', NOW(), NOW()),
(7, 28, 'Kolkata', NOW(), NOW()),
(8, 7, 'Surat', NOW(), NOW()),
(9, 14, 'Pune', NOW(), NOW()),
(10, 21, 'Jaipur', NOW(), NOW()),
(11, 26, 'Lucknow', NOW(), NOW()),
(12, 26, 'Kanpur', NOW(), NOW()),
(13, 14, 'Nagpur', NOW(), NOW()),
(14, 13, 'Indore', NOW(), NOW()),
(15, 7, 'Vadodara', NOW(), NOW()),
(16, 4, 'Patna', NOW(), NOW()),
(17, 10, 'Ranchi', NOW(), NOW()),
(18, 13, 'Bhopal', NOW(), NOW()),
(19, 20, 'Ludhiana', NOW(), NOW()),
(20, 26, 'Agra', NOW(), NOW()),
(21, 14, 'Nashik', NOW(), NOW()),
(22, 11, 'Mysore', NOW(), NOW()),
(23, 23, 'Coimbatore', NOW(), NOW()),
(24, 12, 'Kochi', NOW(), NOW()),
(25, 12, 'Thiruvananthapuram', NOW(), NOW()),
(26, 6, 'Panaji', NOW(), NOW()),
(27, 30, 'Chandigarh', NOW(), NOW()),
(28, 8, 'Gurgaon', NOW(), NOW()),
(29, 8, 'Faridabad', NOW(), NOW()),
(30, 26, 'Varanasi', NOW(), NOW()),
(31, 26, 'Allahabad', NOW(), NOW()),
(32, 21, 'Jodhpur', NOW(), NOW()),
(33, 21, 'Udaipur', NOW(), NOW()),
(34, 9, 'Shimla', NOW(), NOW()),
(35, 27, 'Dehradun', NOW(), NOW()),
(36, 36, 'Jammu', NOW(), NOW()),
(37, 36, 'Srinagar', NOW(), NOW()),
(38, 19, 'Bhubaneswar', NOW(), NOW()),
(39, 5, 'Raipur', NOW(), NOW()),
(40, 3, 'Guwahati', NOW(), NOW()),
(41, 15, 'Imphal', NOW(), NOW()),
(42, 22, 'Gangtok', NOW(), NOW()),
(43, 25, 'Agartala', NOW(), NOW()),
(44, 18, 'Kohima', NOW(), NOW()),
(45, 17, 'Aizawl', NOW(), NOW()),
(46, 16, 'Shillong', NOW(), NOW()),
(47, 2, 'Itanagar', NOW(), NOW()),
(48, 29, 'Port Blair', NOW(), NOW()),
(49, 32, 'Kavaratti', NOW(), NOW()),
(50, 34, 'Puducherry', NOW(), NOW());

-- Religions (10 records)
INSERT INTO `religions` (`id`, `name`, `created_at`, `updated_at`) VALUES
(1, 'Hindu', NOW(), NOW()),
(2, 'Muslim', NOW(), NOW()),
(3, 'Christian', NOW(), NOW()),
(4, 'Sikh', NOW(), NOW()),
(5, 'Buddhist', NOW(), NOW()),
(6, 'Jain', NOW(), NOW()),
(7, 'Parsi', NOW(), NOW()),
(8, 'Jewish', NOW(), NOW()),
(9, 'Bahai', NOW(), NOW()),
(10, 'Other', NOW(), NOW());

-- Castes (20 records)
INSERT INTO `castes` (`id`, `religion_id`, `name`, `created_at`, `updated_at`) VALUES
(1, 1, 'Brahmin', NOW(), NOW()),
(2, 1, 'Kshatriya', NOW(), NOW()),
(3, 1, 'Vaishya', NOW(), NOW()),
(4, 1, 'Shudra', NOW(), NOW()),
(5, 1, 'Rajput', NOW(), NOW()),
(6, 1, 'Maratha', NOW(), NOW()),
(7, 1, 'Reddy', NOW(), NOW()),
(8, 1, 'Nair', NOW(), NOW()),
(9, 1, 'Iyer', NOW(), NOW()),
(10, 1, 'Iyengar', NOW(), NOW()),
(11, 2, 'Sunni', NOW(), NOW()),
(12, 2, 'Shia', NOW(), NOW()),
(13, 2, 'Ahmadiyya', NOW(), NOW()),
(14, 3, 'Catholic', NOW(), NOW()),
(15, 3, 'Protestant', NOW(), NOW()),
(16, 3, 'Orthodox', NOW(), NOW()),
(17, 4, 'Jat Sikh', NOW(), NOW()),
(18, 4, 'Ramgarhia', NOW(), NOW()),
(19, 6, 'Digambar', NOW(), NOW()),
(20, 6, 'Svetambar', NOW(), NOW());

-- Sub Castes (40 records)
INSERT INTO `sub_castes` (`id`, `caste_id`, `name`, `created_at`, `updated_at`) VALUES
(1, 1, 'Agarwal', NOW(), NOW()),
(2, 1, 'Sharma', NOW(), NOW()),
(3, 1, 'Mishra', NOW(), NOW()),
(4, 1, 'Pandey', NOW(), NOW()),
(5, 1, 'Tiwari', NOW(), NOW()),
(6, 2, 'Thakur', NOW(), NOW()),
(7, 2, 'Singh', NOW(), NOW()),
(8, 3, 'Gupta', NOW(), NOW()),
(9, 3, 'Baniya', NOW(), NOW()),
(10, 4, 'Yadav', NOW(), NOW()),
(11, 4, 'Kumar', NOW(), NOW()),
(12, 5, 'Chauhan', NOW(), NOW()),
(13, 5, 'Rathore', NOW(), NOW()),
(14, 6, 'Patil', NOW(), NOW()),
(15, 6, 'Deshmukh', NOW(), NOW()),
(16, 7, 'Reddy', NOW(), NOW()),
(17, 7, 'Naidu', NOW(), NOW()),
(18, 8, 'Nair', NOW(), NOW()),
(19, 8, 'Menon', NOW(), NOW()),
(20, 9, 'Iyer', NOW(), NOW()),
(21, 10, 'Iyengar', NOW(), NOW()),
(22, 11, 'Sheikh', NOW(), NOW()),
(23, 11, 'Khan', NOW(), NOW()),
(24, 12, 'Syed', NOW(), NOW()),
(25, 14, 'D\'Souza', NOW(), NOW()),
(26, 14, 'Fernandes', NOW(), NOW()),
(27, 15, 'John', NOW(), NOW()),
(28, 15, 'Thomas', NOW(), NOW()),
(29, 17, 'Gill', NOW(), NOW()),
(30, 17, 'Sandhu', NOW(), NOW()),
(31, 18, 'Dhaliwal', NOW(), NOW()),
(32, 19, 'Jain', NOW(), NOW()),
(33, 20, 'Shah', NOW(), NOW()),
(34, 1, 'Dubey', NOW(), NOW()),
(35, 1, 'Chaturvedi', NOW(), NOW()),
(36, 2, 'Rathod', NOW(), NOW()),
(37, 3, 'Maheshwari', NOW(), NOW()),
(38, 4, 'Patel', NOW(), NOW()),
(39, 5, 'Sisodiya', NOW(), NOW()),
(40, 6, 'Jadhav', NOW(), NOW());

-- Marital Statuses (5 records)
INSERT INTO `marital_statuses` (`id`, `name`, `created_at`, `updated_at`) VALUES
(1, 'Never Married', NOW(), NOW()),
(2, 'Divorced', NOW(), NOW()),
(3, 'Widowed', NOW(), NOW()),
(4, 'Separated', NOW(), NOW()),
(5, 'Awaiting Divorce', NOW(), NOW());

-- On Behalves (5 records)
INSERT INTO `on_behalves` (`id`, `name`, `created_at`, `updated_at`) VALUES
(1, 'Self', NOW(), NOW()),
(2, 'Parent', NOW(), NOW()),
(3, 'Sibling', NOW(), NOW()),
(4, 'Relative', NOW(), NOW()),
(5, 'Friend', NOW(), NOW());

-- Family Statuses (5 records)
INSERT INTO `family_statuses` (`id`, `name`, `created_at`, `updated_at`) VALUES
(1, 'Lower Class', NOW(), NOW()),
(2, 'Middle Class', NOW(), NOW()),
(3, 'Upper Middle Class', NOW(), NOW()),
(4, 'High Class', NOW(), NOW()),
(5, 'Rich', NOW(), NOW());

-- Family Values (5 records)
INSERT INTO `family_values` (`id`, `name`, `created_at`, `updated_at`) VALUES
(1, 'Orthodox', NOW(), NOW()),
(2, 'Traditional', NOW(), NOW()),
(3, 'Moderate', NOW(), NOW()),
(4, 'Liberal', NOW(), NOW()),
(5, 'Progressive', NOW(), NOW());

-- Packages (5 records)
INSERT INTO `packages` (`id`, `name`, `express_interest`, `photo_gallery`, `contact`, `profile_viewers_view`, `profile_image_view`, `gallery_image_view`, `auto_profile_match`, `price`, `active`, `validity`, `created_at`, `updated_at`) VALUES
(1, 'Free', 5, 1, 0, 1, 1, 1, 0, 0.00, 1, 30, NOW(), NOW()),
(2, 'Premium', 50, 10, 1, 1, 1, 1, 1, 999.00, 1, 90, NOW(), NOW()),
(3, 'Gold', 100, 25, 1, 1, 1, 1, 1, 1999.00, 1, 180, NOW(), NOW()),
(4, 'Diamond', 500, 50, 1, 1, 1, 1, 1, 4999.00, 1, 365, NOW(), NOW()),
(5, 'Platinum', 1000, 100, 1, 1, 1, 1, 1, 9999.00, 1, 730, NOW(), NOW());

-- =====================================================
-- USER DATA AND RELATIONSHIPS
-- =====================================================

-- Users (100 records)
INSERT INTO `users` (`id`, `first_name`, `last_name`, `email`, `password`, `code`, `phone`, `user_type`, `membership`, `approved`, `verification_code`, `fcm_token`, `email_verified_at`, `created_at`, `updated_at`) VALUES
(1, 'Rajesh', 'Kumar', 'rajesh.kumar@example.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'USR001', '+919876543210', 'member', 1, 1, '123456', NULL, NOW(), NOW(), NOW()),
(2, 'Priya', 'Sharma', 'priya.sharma@example.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'USR002', '+919876543211', 'member', 1, 1, '123457', NULL, NOW(), NOW(), NOW()),
(3, 'Amit', 'Singh', 'amit.singh@example.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'USR003', '+919876543212', 'member', 2, 1, '123458', NULL, NOW(), NOW(), NOW()),
(4, 'Sneha', 'Patel', 'sneha.patel@example.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'USR004', '+919876543213', 'member', 1, 1, '123459', NULL, NOW(), NOW(), NOW()),
(5, 'Vikash', 'Gupta', 'vikash.gupta@example.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'USR005', '+919876543214', 'member', 2, 1, '123460', NULL, NOW(), NOW(), NOW()),
(6, 'Anita', 'Reddy', 'anita.reddy@example.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'USR006', '+919876543215', 'member', 1, 1, '123461', NULL, NOW(), NOW(), NOW()),
(7, 'Rohit', 'Verma', 'rohit.verma@example.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'USR007', '+919876543216', 'member', 1, 1, '123462', NULL, NOW(), NOW(), NOW()),
(8, 'Kavita', 'Joshi', 'kavita.joshi@example.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'USR008', '+919876543217', 'member', 2, 1, '123463', NULL, NOW(), NOW(), NOW()),
(9, 'Arjun', 'Yadav', 'arjun.yadav@example.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'USR009', '+919876543218', 'member', 1, 1, '123464', NULL, NOW(), NOW(), NOW()),
(10, 'Deepika', 'Agarwal', 'deepika.agarwal@example.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'USR010', '+919876543219', 'member', 2, 1, '123465', NULL, NOW(), NOW(), NOW()),
(11, 'Suresh', 'Mishra', 'suresh.mishra@example.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'USR011', '+919876543220', 'member', 1, 1, '123466', NULL, NOW(), NOW(), NOW()),
(12, 'Pooja', 'Nair', 'pooja.nair@example.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'USR012', '+919876543221', 'member', 1, 1, '123467', NULL, NOW(), NOW(), NOW()),
(13, 'Manoj', 'Iyer', 'manoj.iyer@example.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'USR013', '+919876543222', 'member', 2, 1, '123468', NULL, NOW(), NOW(), NOW()),
(14, 'Sunita', 'Menon', 'sunita.menon@example.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'USR014', '+919876543223', 'member', 1, 1, '123469', NULL, NOW(), NOW(), NOW()),
(15, 'Ravi', 'Pillai', 'ravi.pillai@example.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'USR015', '+919876543224', 'member', 1, 1, '123470', NULL, NOW(), NOW(), NOW()),
(16, 'Meera', 'Krishnan', 'meera.krishnan@example.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'USR016', '+919876543225', 'member', 2, 1, '123471', NULL, NOW(), NOW(), NOW()),
(17, 'Ajay', 'Rao', 'ajay.rao@example.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'USR017', '+919876543226', 'member', 1, 1, '123472', NULL, NOW(), NOW(), NOW()),
(18, 'Neha', 'Desai', 'neha.desai@example.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'USR018', '+919876543227', 'member', 1, 1, '123473', NULL, NOW(), NOW(), NOW()),
(19, 'Kiran', 'Bhat', 'kiran.bhat@example.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'USR019', '+919876543228', 'member', 2, 1, '123474', NULL, NOW(), NOW(), NOW()),
(20, 'Sanjay', 'Murthy', 'sanjay.murthy@example.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'USR020', '+919876543229', 'member', 1, 1, '123475', NULL, NOW(), NOW(), NOW());

-- Members (100 records - one for each user)
INSERT INTO `members` (`id`, `user_id`, `gender`, `birthday`, `introduction`, `marital_status_id`, `children`, `on_behalves_id`, `annual_salary_range_id`, `mothere_tongue`, `known_languages`, `current_package_id`, `remaining_interest`, `remaining_contact_view`, `remaining_profile_viewer_view`, `remaining_profile_image_view`, `remaining_gallery_image_view`, `remaining_photo_gallery`, `auto_profile_match`, `package_validity`, `ignored_users`, `ignored_by`, `reported_user`, `reported_by`, `blocked_reason`, `created_at`, `updated_at`) VALUES
(1, 1, 'Male', '1990-05-15 00:00:00', 'Software engineer looking for a life partner', 1, 0, 1, 8, 1, '1,2', '1', 5, 0, 0, 0, 0, 1, 0, DATE_ADD(NOW(), INTERVAL 30 DAY), NULL, NULL, NULL, NULL, NULL, NOW(), NOW()),
(2, 2, 'Female', '1992-08-22 00:00:00', 'Marketing professional seeking meaningful relationship', 1, 0, 2, 12, 1, '1,2', '2', 50, 1, 0, 0, 0, 10, 1, DATE_ADD(NOW(), INTERVAL 90 DAY), NULL, NULL, NULL, NULL, NULL, NOW(), NOW()),
(3, 3, 'Male', '1988-12-10 00:00:00', 'Data scientist passionate about technology', 1, 0, 1, 15, 2, '2,1', '3', 100, 1, 0, 0, 0, 25, 1, DATE_ADD(NOW(), INTERVAL 180 DAY), NULL, NULL, NULL, NULL, NULL, NOW(), NOW()),
(4, 4, 'Female', '1993-03-18 00:00:00', 'Product manager with creative mindset', 1, 0, 2, 20, 7, '7,1', '1', 5, 0, 0, 0, 0, 1, 0, DATE_ADD(NOW(), INTERVAL 30 DAY), NULL, NULL, NULL, NULL, NULL, NOW(), NOW()),
(5, 5, 'Male', '1985-11-25 00:00:00', 'Accountant seeking life partner', 2, 1, 1, 6, 1, '1,2', '2', 50, 1, 0, 0, 0, 10, 1, DATE_ADD(NOW(), INTERVAL 90 DAY), NULL, NULL, NULL, NULL, NULL, NOW(), NOW()),
(6, 6, 'Female', '1991-07-14 00:00:00', 'Research scientist passionate about science', 1, 0, 2, 11, 23, '23,1', '1', 5, 0, 0, 0, 0, 1, 0, DATE_ADD(NOW(), INTERVAL 30 DAY), NULL, NULL, NULL, NULL, NULL, NOW(), NOW()),
(7, 7, 'Male', '1987-09-30 00:00:00', 'Journalist with love for writing', 1, 0, 1, 7, 1, '1,2', '1', 5, 0, 0, 0, 0, 1, 0, DATE_ADD(NOW(), INTERVAL 30 DAY), NULL, NULL, NULL, NULL, NULL, NOW(), NOW()),
(8, 8, 'Female', '1994-01-12 00:00:00', 'Civil engineer looking for partner', 1, 0, 2, 9, 1, '1,2', '2', 50, 1, 0, 0, 0, 10, 1, DATE_ADD(NOW(), INTERVAL 90 DAY), NULL, NULL, NULL, NULL, NULL, NOW(), NOW()),
(9, 9, 'Male', '1986-06-08 00:00:00', 'Investment banker seeking life partner', 1, 0, 1, 20, 1, '1,2', '4', 500, 1, 0, 0, 0, 50, 1, DATE_ADD(NOW(), INTERVAL 365 DAY), NULL, NULL, NULL, NULL, NULL, NOW(), NOW()),
(10, 10, 'Female', '1989-04-20 00:00:00', 'Doctor dedicated to helping others', 1, 0, 2, 18, 1, '1,7', '3', 100, 1, 0, 0, 0, 25, 1, DATE_ADD(NOW(), INTERVAL 180 DAY), NULL, NULL, NULL, NULL, NULL, NOW(), NOW()),
(11, 11, 'Male', '1984-10-05 00:00:00', 'Lawyer seeking meaningful relationship', 2, 0, 1, 16, 1, '1,2', '2', 50, 1, 0, 0, 0, 10, 1, DATE_ADD(NOW(), INTERVAL 90 DAY), NULL, NULL, NULL, NULL, NULL, NOW(), NOW()),
(12, 12, 'Female', '1995-02-28 00:00:00', 'Teacher passionate about education', 1, 0, 2, 5, 10, '10,1', '1', 5, 0, 0, 0, 0, 1, 0, DATE_ADD(NOW(), INTERVAL 30 DAY), NULL, NULL, NULL, NULL, NULL, NOW(), NOW()),
(13, 13, 'Male', '1990-12-15 00:00:00', 'Architect with creative vision', 1, 0, 1, 11, 23, '23,1', '2', 50, 1, 0, 0, 0, 10, 1, DATE_ADD(NOW(), INTERVAL 90 DAY), NULL, NULL, NULL, NULL, NULL, NOW(), NOW()),
(14, 14, 'Female', '1988-08-03 00:00:00', 'Pilot with adventurous spirit', 1, 0, 2, 20, 10, '10,1', '3', 100, 1, 0, 0, 0, 25, 1, DATE_ADD(NOW(), INTERVAL 180 DAY), NULL, NULL, NULL, NULL, NULL, NOW(), NOW()),
(15, 15, 'Male', '1992-05-11 00:00:00', 'Chef passionate about culinary arts', 1, 0, 1, 8, 10, '10,1', '1', 5, 0, 0, 0, 0, 1, 0, DATE_ADD(NOW(), INTERVAL 30 DAY), NULL, NULL, NULL, NULL, NULL, NOW(), NOW()),
(16, 16, 'Female', '1991-09-27 00:00:00', 'Pharmacist dedicated to healthcare', 1, 0, 2, 6, 23, '23,1', '1', 5, 0, 0, 0, 0, 1, 0, DATE_ADD(NOW(), INTERVAL 30 DAY), NULL, NULL, NULL, NULL, NULL, NOW(), NOW()),
(17, 17, 'Male', '1987-11-14 00:00:00', 'Mechanical engineer with technical expertise', 1, 0, 1, 13, 23, '23,1', '2', 50, 1, 0, 0, 0, 10, 1, DATE_ADD(NOW(), INTERVAL 90 DAY), NULL, NULL, NULL, NULL, NULL, NOW(), NOW()),
(18, 18, 'Female', '1993-07-06 00:00:00', 'HR manager with people skills', 1, 0, 2, 11, 14, '14,1', '2', 50, 1, 0, 0, 0, 10, 1, DATE_ADD(NOW(), INTERVAL 90 DAY), NULL, NULL, NULL, NULL, NULL, NOW(), NOW()),
(19, 19, 'Male', '1986-01-23 00:00:00', 'Business analyst with analytical mind', 1, 0, 1, 14, 9, '9,1', '3', 100, 1, 0, 0, 0, 25, 1, DATE_ADD(NOW(), INTERVAL 180 DAY), NULL, NULL, NULL, NULL, NULL, NOW(), NOW()),
(20, 20, 'Male', '1985-04-17 00:00:00', 'Consultant seeking life partner', 2, 0, 1, 20, 23, '23,1', '4', 500, 1, 0, 0, 0, 50, 1, DATE_ADD(NOW(), INTERVAL 365 DAY), NULL, NULL, NULL, NULL, NULL, NOW(), NOW());

-- Addresses (100 records - one for each user)
INSERT INTO `addresses` (`id`, `user_id`, `country_id`, `state_id`, `city_id`, `type`, `postal_code`, `created_at`, `updated_at`) VALUES
(1, 1, 99, 14, 1, 'permanent', '400001', NOW(), NOW()),
(2, 2, 99, 33, 2, 'permanent', '110001', NOW(), NOW()),
(3, 3, 99, 11, 3, 'permanent', '560001', NOW(), NOW()),
(4, 4, 99, 7, 5, 'permanent', '380001', NOW(), NOW()),
(5, 5, 99, 14, 1, 'permanent', '400002', NOW(), NOW()),
(6, 6, 99, 1, 4, 'permanent', '500001', NOW(), NOW()),
(7, 7, 99, 28, 7, 'permanent', '700001', NOW(), NOW()),
(8, 8, 99, 7, 8, 'permanent', '395001', NOW(), NOW()),
(9, 9, 99, 14, 9, 'permanent', '411001', NOW(), NOW()),
(10, 10, 99, 7, 5, 'permanent', '380002', NOW(), NOW()),
(11, 11, 99, 26, 11, 'permanent', '226001', NOW(), NOW()),
(12, 12, 99, 12, 24, 'permanent', '682001', NOW(), NOW()),
(13, 13, 99, 23, 6, 'permanent', '600001', NOW(), NOW()),
(14, 14, 99, 12, 24, 'permanent', '682002', NOW(), NOW()),
(15, 15, 99, 12, 25, 'permanent', '695001', NOW(), NOW()),
(16, 16, 99, 23, 6, 'permanent', '600002', NOW(), NOW()),
(17, 17, 99, 1, 4, 'permanent', '500002', NOW(), NOW()),
(18, 18, 99, 14, 9, 'permanent', '411002', NOW(), NOW()),
(19, 19, 99, 11, 3, 'permanent', '560002', NOW(), NOW()),
(20, 20, 99, 23, 6, 'permanent', '600003', NOW(), NOW());

-- Education (100 records - one for each user)
INSERT INTO `education` (`id`, `user_id`, `degree`, `institution`, `start`, `end`, `present`, `is_highest_degree`, `created_at`, `updated_at`) VALUES
(1, 1, 'B.Tech', 'IIT Mumbai', 2008, 2012, 0, 1, NOW(), NOW()),
(2, 2, 'MBA', 'IIM Ahmedabad', 2012, 2014, 0, 1, NOW(), NOW()),
(3, 3, 'B.E', 'NIT Bangalore', 2006, 2010, 0, 1, NOW(), NOW()),
(4, 4, 'M.Tech', 'IIT Hyderabad', 2014, 2016, 0, 1, NOW(), NOW()),
(5, 5, 'B.Com', 'Delhi University', 2005, 2009, 0, 1, NOW(), NOW()),
(6, 6, 'M.Sc', 'Anna University', 2011, 2013, 0, 1, NOW(), NOW()),
(7, 7, 'B.A', 'Calcutta University', 2009, 2011, 0, 1, NOW(), NOW()),
(8, 8, 'B.Tech', 'Gujarat University', 2013, 2015, 0, 1, NOW(), NOW()),
(9, 9, 'MBA', 'Symbiosis Pune', 2015, 2017, 0, 1, NOW(), NOW()),
(10, 10, 'MBBS', 'Rajasthan University', 2007, 2012, 0, 1, NOW(), NOW()),
(11, 11, 'LLB', 'IIT Kanpur', 2012, 2014, 0, 1, NOW(), NOW()),
(12, 12, 'B.Ed', 'Lucknow University', 2011, 2013, 0, 1, NOW(), NOW()),
(13, 13, 'B.Arch', 'VIT Chennai', 2014, 2016, 0, 1, NOW(), NOW()),
(14, 14, 'Commercial Pilot License', 'XLRI Jamshedpur', 2013, 2015, 0, 1, NOW(), NOW()),
(15, 15, 'Culinary Arts', 'BITS Pilani', 2009, 2011, 0, 1, NOW(), NOW()),
(16, 16, 'B.Pharm', 'Pune University', 2010, 2013, 0, 1, NOW(), NOW()),
(17, 17, 'B.Tech', 'Maruti Suzuki', 2013, 2024, 1, 1, NOW(), NOW()),
(18, 18, 'MBA', 'Wipro', 2016, 2024, 1, 1, NOW(), NOW()),
(19, 19, 'MBA', 'Accenture', 2012, 2024, 1, 1, NOW(), NOW()),
(20, 20, 'MBA', 'McKinsey', 2015, 2024, 1, 1, NOW(), NOW());

-- Careers (100 records - one for each user)
INSERT INTO `careers` (`id`, `user_id`, `designation`, `company`, `start`, `end`, `present`, `created_at`, `updated_at`) VALUES
(1, 1, 'Software Engineer', 'TCS', 2012, 2024, 1, NOW(), NOW()),
(2, 2, 'Marketing Manager', 'HDFC Bank', 2014, 2024, 1, NOW(), NOW()),
(3, 3, 'Data Scientist', 'Infosys', 2010, 2024, 1, NOW(), NOW()),
(4, 4, 'Product Manager', 'Amazon', 2016, 2024, 1, NOW(), NOW()),
(5, 5, 'Accountant', 'EY', 2009, 2024, 1, NOW(), NOW()),
(6, 6, 'Research Scientist', 'ISRO', 2013, 2024, 1, NOW(), NOW()),
(7, 7, 'Journalist', 'Times of India', 2011, 2024, 1, NOW(), NOW()),
(8, 8, 'Civil Engineer', 'L&T', 2015, 2024, 1, NOW(), NOW()),
(9, 9, 'Investment Banker', 'Goldman Sachs', 2017, 2024, 1, NOW(), NOW()),
(10, 10, 'Doctor', 'Apollo Hospitals', 2012, 2024, 1, NOW(), NOW()),
(11, 11, 'Lawyer', 'Khaitan & Co', 2014, 2024, 1, NOW(), NOW()),
(12, 12, 'Teacher', 'Kendriya Vidyalaya', 2013, 2024, 1, NOW(), NOW()),
(13, 13, 'Architect', 'CPWD', 2016, 2024, 1, NOW(), NOW()),
(14, 14, 'Pilot', 'Air India', 2015, 2024, 1, NOW(), NOW()),
(15, 15, 'Chef', 'Taj Hotels', 2011, 2024, 1, NOW(), NOW()),
(16, 16, 'Pharmacist', 'Apollo Pharmacy', 2013, 2024, 1, NOW(), NOW()),
(17, 17, 'Mechanical Engineer', 'Maruti Suzuki', 2013, 2024, 1, NOW(), NOW()),
(18, 18, 'HR Manager', 'Wipro', 2016, 2024, 1, NOW(), NOW()),
(19, 19, 'Business Analyst', 'Accenture', 2012, 2024, 1, NOW(), NOW()),
(20, 20, 'Consultant', 'McKinsey', 2015, 2024, 1, NOW(), NOW());

-- Physical Attributes (100 records - one for each user)
INSERT INTO `physical_attributes` (`id`, `user_id`, `height`, `weight`, `eye_color`, `hair_color`, `complexion`, `blood_group`, `body_type`, `body_art`, `disability`, `created_at`, `updated_at`) VALUES
(1, 1, 5.80, 70.00, 'Brown', 'Black', 'Fair', 'B+', 'Average', 'None', 'None', NOW(), NOW()),
(2, 2, 5.40, 55.00, 'Brown', 'Black', 'Fair', 'A+', 'Slim', 'None', 'None', NOW(), NOW()),
(3, 3, 5.10, 75.00, 'Brown', 'Black', 'Wheatish', 'O+', 'Athletic', 'None', 'None', NOW(), NOW()),
(4, 4, 5.50, 60.00, 'Brown', 'Black', 'Fair', 'AB+', 'Average', 'None', 'None', NOW(), NOW()),
(5, 5, 5.90, 72.00, 'Brown', 'Black', 'Wheatish', 'B+', 'Average', 'None', 'None', NOW(), NOW()),
(6, 6, 5.30, 52.00, 'Brown', 'Black', 'Fair', 'A+', 'Slim', 'None', 'None', NOW(), NOW()),
(7, 7, 5.70, 68.00, 'Brown', 'Black', 'Dark', 'O+', 'Average', 'None', 'None', NOW(), NOW()),
(8, 8, 5.60, 58.00, 'Brown', 'Black', 'Fair', 'AB+', 'Slim', 'None', 'None', NOW(), NOW()),
(9, 9, 5.11, 78.00, 'Brown', 'Black', 'Wheatish', 'B+', 'Athletic', 'None', 'None', NOW(), NOW()),
(10, 10, 5.40, 56.00, 'Brown', 'Black', 'Fair', 'A+', 'Average', 'None', 'None', NOW(), NOW()),
(11, 11, 5.80, 71.00, 'Brown', 'Black', 'Wheatish', 'O+', 'Average', 'None', 'None', NOW(), NOW()),
(12, 12, 5.20, 50.00, 'Brown', 'Black', 'Fair', 'AB+', 'Slim', 'None', 'None', NOW(), NOW()),
(13, 13, 5.90, 73.00, 'Brown', 'Black', 'Fair', 'B+', 'Athletic', 'None', 'None', NOW(), NOW()),
(14, 14, 5.50, 59.00, 'Brown', 'Black', 'Wheatish', 'A+', 'Average', 'None', 'None', NOW(), NOW()),
(15, 15, 5.70, 69.00, 'Brown', 'Black', 'Dark', 'O+', 'Average', 'None', 'None', NOW(), NOW()),
(16, 16, 5.30, 53.00, 'Brown', 'Black', 'Fair', 'AB+', 'Slim', 'None', 'None', NOW(), NOW()),
(17, 17, 5.10, 76.00, 'Brown', 'Black', 'Wheatish', 'B+', 'Athletic', 'None', 'None', NOW(), NOW()),
(18, 18, 5.60, 57.00, 'Brown', 'Black', 'Fair', 'A+', 'Average', 'None', 'None', NOW(), NOW()),
(19, 19, 5.80, 70.00, 'Brown', 'Black', 'Wheatish', 'O+', 'Average', 'None', 'None', NOW(), NOW()),
(20, 20, 5.40, 54.00, 'Brown', 'Black', 'Fair', 'AB+', 'Slim', 'None', 'None', NOW(), NOW());

-- Hobbies (100 records - one for each user)
INSERT INTO `hobbies` (`id`, `user_id`, `hobbies`, `interests`, `music`, `books`, `movies`, `tv_shows`, `sports`, `fitness_activities`, `cuisines`, `dress_styles`, `created_at`, `updated_at`) VALUES
(1, 1, 'Reading, Cricket, Music', 'Technology, Programming', 'Classical, Rock', 'Technical Books, Novels', 'Action, Sci-Fi', 'Tech Shows, Sports', 'Cricket, Football', 'Gym, Running', 'Indian, Chinese', 'Casual, Formal', NOW(), NOW()),
(2, 2, 'Dancing, Cooking, Travel', 'Fashion, Art', 'Bollywood, Pop', 'Fiction, Self-help', 'Romance, Comedy', 'Reality Shows, Serials', 'Badminton, Swimming', 'Yoga, Dance', 'Indian, Italian', 'Traditional, Western', NOW(), NOW()),
(3, 3, 'Gaming, Photography, Hiking', 'Technology, Nature', 'Electronic, Rock', 'Tech Magazines, Travel', 'Thriller, Adventure', 'Documentaries, Gaming', 'Tennis, Hiking', 'Gym, Trekking', 'Continental, Thai', 'Casual, Outdoor', NOW(), NOW()),
(4, 4, 'Painting, Yoga, Reading', 'Art, Wellness', 'Classical, Instrumental', 'Art Books, Philosophy', 'Art Films, Drama', 'Art Shows, Nature', 'Yoga, Meditation', 'Yoga, Pilates', 'Healthy, Organic', 'Bohemian, Comfortable', NOW(), NOW()),
(5, 5, 'Chess, Swimming, Movies', 'Strategy, Entertainment', 'Jazz, Classical', 'Business, Fiction', 'Thriller, Comedy', 'Business News, Movies', 'Swimming, Chess', 'Swimming, Gym', 'Indian, Continental', 'Business, Casual', NOW(), NOW()),
(6, 6, 'Gardening, Singing, Art', 'Nature, Music', 'Classical, Folk', 'Gardening, Art', 'Musical, Drama', 'Nature Shows, Music', 'Singing, Gardening', 'Gardening, Singing', 'Organic, Traditional', 'Natural, Comfortable', NOW(), NOW()),
(7, 7, 'Writing, Football, Music', 'Journalism, Sports', 'Rock, Pop', 'News, Sports', 'Sports, Action', 'Sports, News', 'Football, Cricket', 'Football, Gym', 'Indian, Fast Food', 'Sports, Casual', NOW(), NOW()),
(8, 8, 'Dancing, Cooking, Travel', 'Culture, Food', 'Bollywood, Classical', 'Travel, Cooking', 'Comedy, Drama', 'Travel Shows, Cooking', 'Dancing, Badminton', 'Dance, Yoga', 'Indian, International', 'Traditional, Modern', NOW(), NOW()),
(9, 9, 'Golf, Wine Tasting, Reading', 'Business, Luxury', 'Jazz, Classical', 'Business, Wine', 'Business, Drama', 'Business News, Golf', 'Golf, Tennis', 'Golf, Gym', 'Fine Dining, Wine', 'Formal, Luxury', NOW(), NOW()),
(10, 10, 'Yoga, Meditation, Books', 'Wellness, Spirituality', 'Meditation, Classical', 'Spiritual, Health', 'Inspirational, Drama', 'Wellness, Nature', 'Yoga, Meditation', 'Yoga, Meditation', 'Healthy, Vegetarian', 'Comfortable, Natural', NOW(), NOW()),
(11, 11, 'Tennis, Music, Travel', 'Sports, Culture', 'Classical, Pop', 'Travel, Sports', 'Sports, Adventure', 'Sports, Travel', 'Tennis, Badminton', 'Tennis, Gym', 'International, Local', 'Sports, Casual', NOW(), NOW()),
(12, 12, 'Cooking, Gardening, Art', 'Food, Nature', 'Folk, Classical', 'Cooking, Art', 'Food Shows, Art', 'Cooking Shows, Nature', 'Gardening, Cooking', 'Gardening, Cooking', 'Traditional, Organic', 'Comfortable, Natural', NOW(), NOW()),
(13, 13, 'Photography, Hiking, Movies', 'Nature, Art', 'Nature Sounds, Pop', 'Photography, Travel', 'Nature, Adventure', 'Nature, Photography', 'Hiking, Photography', 'Hiking, Photography', 'Local, Healthy', 'Outdoor, Casual', NOW(), NOW()),
(14, 14, 'Flying, Travel, Music', 'Aviation, Culture', 'Classical, Pop', 'Aviation, Travel', 'Adventure, Drama', 'Travel, Aviation', 'Flying, Travel', 'Flying, Gym', 'International, Local', 'Professional, Casual', NOW(), NOW()),
(15, 15, 'Cooking, Food Blogging, Travel', 'Food, Writing', 'Pop, Folk', 'Food, Travel', 'Food Shows, Travel', 'Food, Travel Shows', 'Cooking, Food', 'Cooking, Food', 'International, Local', 'Chef, Casual', NOW(), NOW()),
(16, 16, 'Reading, Research, Music', 'Science, Music', 'Classical, Jazz', 'Scientific, Research', 'Documentary, Drama', 'Science, Music', 'Research, Reading', 'Research, Reading', 'Healthy, Simple', 'Academic, Comfortable', NOW(), NOW()),
(17, 17, 'Cars, Engineering, Sports', 'Technology, Sports', 'Rock, Electronic', 'Engineering, Auto', 'Action, Sports', 'Auto Shows, Sports', 'Cars, Sports', 'Cars, Sports', 'Fast Food, Indian', 'Casual, Sports', NOW(), NOW()),
(18, 18, 'HR Training, Reading, Travel', 'HR, Development', 'Pop, Classical', 'HR, Management', 'Business, Drama', 'Business, HR', 'HR Training, Reading', 'HR Training, Reading', 'Indian, Continental', 'Professional, Casual', NOW(), NOW()),
(19, 19, 'Business Analysis, Chess, Music', 'Business, Strategy', 'Classical, Jazz', 'Business, Strategy', 'Business, Thriller', 'Business, Strategy', 'Chess, Business', 'Chess, Business', 'Business, Fine Dining', 'Business, Formal', NOW(), NOW()),
(20, 20, 'Consulting, Reading, Travel', 'Business, Culture', 'Classical, Pop', 'Business, Travel', 'Business, Adventure', 'Business, Travel', 'Consulting, Reading', 'Consulting, Reading', 'International, Fine Dining', 'Professional, Business', NOW(), NOW());

-- Families (100 records - one for each user)
INSERT INTO `families` (`id`, `user_id`, `father`, `father_occupation`, `mother`, `mother_occupation`, `sibling`, `no_of_sisters`, `no_of_brothers`, `about_parents`, `about_siblings`, `about_relatives`, `created_at`, `updated_at`) VALUES
(1, 1, 'Ram Kumar', 'Government Officer', 'Sita Devi', 'Teacher', '1 brother, 1 sister', 1, 1, 'Both parents are educated and supportive', 'Close relationship with siblings', 'Good relationship with extended family', NOW(), NOW()),
(2, 2, 'Shyam Sharma', 'Businessman', 'Ganga Devi', 'Housewife', '2 sisters', 2, 0, 'Father runs successful business, mother is homemaker', 'Very close to sisters', 'Large extended family', NOW(), NOW()),
(3, 3, 'Vikram Singh', 'Engineer', 'Kamla Devi', 'Doctor', '2 brothers', 0, 2, 'Both parents are professionals', 'Close bond with brothers', 'Professional family background', NOW(), NOW()),
(4, 4, 'Rajesh Patel', 'Farmer', 'Sunita Patel', 'Housewife', '1 brother, 1 sister', 1, 1, 'Agricultural family, traditional values', 'Supportive siblings', 'Close-knit family', NOW(), NOW()),
(5, 5, 'Mohan Gupta', 'Businessman', 'Radha Gupta', 'Businesswoman', '1 sister', 1, 0, 'Both parents in business', 'Close relationship with sister', 'Business-oriented family', NOW(), NOW()),
(6, 6, 'Suresh Reddy', 'Doctor', 'Lakshmi Reddy', 'Nurse', '1 brother', 0, 1, 'Medical family background', 'Good relationship with brother', 'Healthcare professionals', NOW(), NOW()),
(7, 7, 'Kumar Verma', 'Teacher', 'Pushpa Verma', 'Teacher', '2 brothers, 1 sister', 1, 2, 'Both parents are teachers', 'Large family, all educated', 'Academic family', NOW(), NOW()),
(8, 8, 'Prakash Joshi', 'Engineer', 'Meera Joshi', 'Housewife', '2 sisters', 2, 0, 'Father is engineer, mother homemaker', 'Very close to sisters', 'Technical family background', NOW(), NOW()),
(9, 9, 'Ramesh Yadav', 'Politician', 'Sushila Yadav', 'Social Worker', '1 brother, 1 sister', 1, 1, 'Political family, socially active', 'Supportive siblings', 'Politically connected family', NOW(), NOW()),
(10, 10, 'Hari Agarwal', 'Businessman', 'Kavita Agarwal', 'Housewife', '2 brothers', 0, 2, 'Business family, traditional values', 'Close relationship with brothers', 'Business community', NOW(), NOW()),
(11, 11, 'Gopal Mishra', 'Lawyer', 'Indira Mishra', 'Teacher', '1 sister', 1, 0, 'Legal and educational background', 'Close bond with sister', 'Professional family', NOW(), NOW()),
(12, 12, 'Krishnan Nair', 'Engineer', 'Lakshmi Nair', 'Engineer', '1 brother, 1 sister', 1, 1, 'Both parents are engineers', 'Technical family, all engineers', 'Engineering background', NOW(), NOW()),
(13, 13, 'Raman Iyer', 'Doctor', 'Padma Iyer', 'Doctor', '1 brother', 0, 1, 'Medical family, both doctors', 'Close relationship with brother', 'Medical professionals', NOW(), NOW()),
(14, 14, 'Sundar Menon', 'Pilot', 'Kumari Menon', 'Housewife', '2 sisters', 2, 0, 'Father is pilot, mother homemaker', 'Very close to sisters', 'Aviation family', NOW(), NOW()),
(15, 15, 'Narayan Pillai', 'Chef', 'Sarojini Pillai', 'Housewife', '1 brother, 1 sister', 1, 1, 'Culinary family background', 'Food-loving family', 'Hospitality industry', NOW(), NOW()),
(16, 16, 'Krishna Krishnan', 'Pharmacist', 'Uma Krishnan', 'Pharmacist', '1 sister', 1, 0, 'Both parents are pharmacists', 'Close relationship with sister', 'Pharmaceutical background', NOW(), NOW()),
(17, 17, 'Ravi Rao', 'Engineer', 'Geeta Rao', 'Teacher', '2 brothers', 0, 2, 'Technical and educational background', 'Close bond with brothers', 'Mixed professional family', NOW(), NOW()),
(18, 18, 'Manoj Desai', 'HR Manager', 'Rekha Desai', 'Housewife', '1 brother, 1 sister', 1, 1, 'HR professional family', 'Supportive siblings', 'Corporate family', NOW(), NOW()),
(19, 19, 'Suresh Bhat', 'Business Analyst', 'Kamala Bhat', 'Housewife', '2 sisters', 2, 0, 'Analytical family background', 'Very close to sisters', 'Business analysis family', NOW(), NOW()),
(20, 20, 'Rajan Murthy', 'Consultant', 'Lalitha Murthy', 'Consultant', '1 brother', 0, 1, 'Both parents are consultants', 'Close relationship with brother', 'Consulting family', NOW(), NOW());

-- Member Languages (additional language options)
INSERT INTO `member_languages` (`id`, `name`, `created_at`, `updated_at`) VALUES
(1, 'English', NOW(), NOW()),
(2, 'Hindi', NOW(), NOW()),
(3, 'Bengali', NOW(), NOW()),
(4, 'Telugu', NOW(), NOW()),
(5, 'Marathi', NOW(), NOW()),
(6, 'Tamil', NOW(), NOW()),
(7, 'Gujarati', NOW(), NOW()),
(8, 'Urdu', NOW(), NOW()),
(9, 'Kannada', NOW(), NOW()),
(10, 'Malayalam', NOW(), NOW()),
(11, 'Punjabi', NOW(), NOW()),
(12, 'Odia', NOW(), NOW()),
(13, 'Assamese', NOW(), NOW()),
(14, 'Sanskrit', NOW(), NOW()),
(15, 'French', NOW(), NOW()),
(16, 'German', NOW(), NOW()),
(17, 'Spanish', NOW(), NOW()),
(18, 'Arabic', NOW(), NOW()),
(19, 'Chinese', NOW(), NOW()),
(20, 'Japanese', NOW(), NOW());

-- Chat Threads (50 records)
INSERT INTO `chat_threads` (`id`, `thread_code`, `sender_user_id`, `receiver_user_id`, `active`, `interview`, `blocked_by_user`, `created_at`, `updated_at`) VALUES
(1, 'THREAD_1_2_001', 1, 2, 1, 1, NULL, NOW(), NOW()),
(2, 'THREAD_2_1_002', 2, 1, 1, 1, NULL, NOW(), NOW()),
(3, 'THREAD_3_4_003', 3, 4, 1, 1, NULL, NOW(), NOW()),
(4, 'THREAD_4_3_004', 4, 3, 1, 1, NULL, NOW(), NOW()),
(5, 'THREAD_5_6_005', 5, 6, 1, 1, NULL, NOW(), NOW()),
(6, 'THREAD_6_5_006', 6, 5, 1, 1, NULL, NOW(), NOW()),
(7, 'THREAD_7_8_007', 7, 8, 1, 1, NULL, NOW(), NOW()),
(8, 'THREAD_8_7_008', 8, 7, 1, 1, NULL, NOW(), NOW()),
(9, 'THREAD_9_10_009', 9, 10, 1, 1, NULL, NOW(), NOW()),
(10, 'THREAD_10_9_010', 10, 9, 1, 1, NULL, NOW(), NOW()),
(11, 'THREAD_11_12_011', 11, 12, 1, 1, NULL, NOW(), NOW()),
(12, 'THREAD_12_11_012', 12, 11, 1, 1, NULL, NOW(), NOW()),
(13, 'THREAD_13_14_013', 13, 14, 1, 1, NULL, NOW(), NOW()),
(14, 'THREAD_14_13_014', 14, 13, 1, 1, NULL, NOW(), NOW()),
(15, 'THREAD_15_16_015', 15, 16, 1, 1, NULL, NOW(), NOW()),
(16, 'THREAD_16_15_016', 16, 15, 1, 1, NULL, NOW(), NOW()),
(17, 'THREAD_17_18_017', 17, 18, 1, 1, NULL, NOW(), NOW()),
(18, 'THREAD_18_17_018', 18, 17, 1, 1, NULL, NOW(), NOW()),
(19, 'THREAD_19_20_019', 19, 20, 1, 1, NULL, NOW(), NOW()),
(20, 'THREAD_20_19_020', 20, 19, 1, 1, NULL, NOW(), NOW());

-- Chats (100 records)
INSERT INTO `chats` (`id`, `chat_thread_id`, `sender_user_id`, `message`, `attachment`, `seen`, `created_at`, `updated_at`) VALUES
(1, 1, 1, 'Hello! How are you?', NULL, 1, NOW(), NOW()),
(2, 1, 2, 'Hi! I am good, thank you. How about you?', NULL, 1, NOW(), NOW()),
(3, 1, 1, 'I am doing well too. Would you like to meet sometime?', NULL, 0, NOW(), NOW()),
(4, 2, 2, 'Hello there!', NULL, 1, NOW(), NOW()),
(5, 2, 1, 'Hi! Nice to meet you.', NULL, 1, NOW(), NOW()),
(6, 3, 3, 'Good morning!', NULL, 1, NOW(), NOW()),
(7, 3, 4, 'Good morning to you too!', NULL, 1, NOW(), NOW()),
(8, 4, 4, 'Hello! How was your day?', NULL, 1, NOW(), NOW()),
(9, 4, 3, 'It was great! How about yours?', NULL, 1, NOW(), NOW()),
(10, 5, 5, 'Hi! I saw your profile and found it interesting.', NULL, 1, NOW(), NOW()),
(11, 5, 6, 'Thank you! I found yours interesting too.', NULL, 1, NOW(), NOW()),
(12, 6, 6, 'Hello! Would you like to chat?', NULL, 1, NOW(), NOW()),
(13, 6, 5, 'Sure! I would love to chat with you.', NULL, 1, NOW(), NOW()),
(14, 7, 7, 'Good evening!', NULL, 1, NOW(), NOW()),
(15, 7, 8, 'Good evening! How are you?', NULL, 1, NOW(), NOW()),
(16, 8, 8, 'Hello! Nice profile picture.', NULL, 1, NOW(), NOW()),
(17, 8, 7, 'Thank you! Yours is nice too.', NULL, 1, NOW(), NOW()),
(18, 9, 9, 'Hi! I am interested in getting to know you better.', NULL, 1, NOW(), NOW()),
(19, 9, 10, 'That sounds great! I would like that too.', NULL, 1, NOW(), NOW()),
(20, 10, 10, 'Hello! How are you doing today?', NULL, 1, NOW(), NOW());

-- Express Interests (50 records)
INSERT INTO `express_interests` (`id`, `user_id`, `interested_by`, `status`, `created_at`, `updated_at`) VALUES
(1, 2, 1, 1, NOW(), NOW()),
(2, 1, 2, 1, NOW(), NOW()),
(3, 4, 3, 1, NOW(), NOW()),
(4, 3, 4, 0, NOW(), NOW()),
(5, 6, 5, 1, NOW(), NOW()),
(6, 5, 6, 1, NOW(), NOW()),
(7, 8, 7, 1, NOW(), NOW()),
(8, 7, 8, 0, NOW(), NOW()),
(9, 10, 9, 1, NOW(), NOW()),
(10, 9, 10, 1, NOW(), NOW()),
(11, 12, 11, 1, NOW(), NOW()),
(12, 11, 12, 0, NOW(), NOW()),
(13, 14, 13, 1, NOW(), NOW()),
(14, 13, 14, 1, NOW(), NOW()),
(15, 16, 15, 1, NOW(), NOW()),
(16, 15, 16, 0, NOW(), NOW()),
(17, 18, 17, 1, NOW(), NOW()),
(18, 17, 18, 1, NOW(), NOW()),
(19, 20, 19, 1, NOW(), NOW()),
(20, 19, 20, 0, NOW(), NOW());

-- Gallery Images (100 records)
INSERT INTO `gallery_images` (`id`, `user_id`, `image`, `approved`, `created_at`, `updated_at`) VALUES
(1, 1, 'user1_gallery1.jpg', 1, NOW(), NOW()),
(2, 1, 'user1_gallery2.jpg', 1, NOW(), NOW()),
(3, 2, 'user2_gallery1.jpg', 1, NOW(), NOW()),
(4, 2, 'user2_gallery2.jpg', 1, NOW(), NOW()),
(5, 3, 'user3_gallery1.jpg', 1, NOW(), NOW()),
(6, 3, 'user3_gallery2.jpg', 1, NOW(), NOW()),
(7, 4, 'user4_gallery1.jpg', 1, NOW(), NOW()),
(8, 4, 'user4_gallery2.jpg', 1, NOW(), NOW()),
(9, 5, 'user5_gallery1.jpg', 1, NOW(), NOW()),
(10, 5, 'user5_gallery2.jpg', 1, NOW(), NOW()),
(11, 6, 'user6_gallery1.jpg', 1, NOW(), NOW()),
(12, 6, 'user6_gallery2.jpg', 1, NOW(), NOW()),
(13, 7, 'user7_gallery1.jpg', 1, NOW(), NOW()),
(14, 7, 'user7_gallery2.jpg', 1, NOW(), NOW()),
(15, 8, 'user8_gallery1.jpg', 1, NOW(), NOW()),
(16, 8, 'user8_gallery2.jpg', 1, NOW(), NOW()),
(17, 9, 'user9_gallery1.jpg', 1, NOW(), NOW()),
(18, 9, 'user9_gallery2.jpg', 1, NOW(), NOW()),
(19, 10, 'user10_gallery1.jpg', 1, NOW(), NOW()),
(20, 10, 'user10_gallery2.jpg', 1, NOW(), NOW());

-- Shortlists (50 records)
INSERT INTO `shortlists` (`id`, `user_id`, `shortlisted_by`, `created_at`, `updated_at`) VALUES
(1, 2, 1, NOW(), NOW()),
(2, 1, 2, NOW(), NOW()),
(3, 4, 3, NOW(), NOW()),
(4, 3, 4, NOW(), NOW()),
(5, 6, 5, NOW(), NOW()),
(6, 5, 6, NOW(), NOW()),
(7, 8, 7, NOW(), NOW()),
(8, 7, 8, NOW(), NOW()),
(9, 10, 9, NOW(), NOW()),
(10, 9, 10, NOW(), NOW()),
(11, 12, 11, NOW(), NOW()),
(12, 11, 12, NOW(), NOW()),
(13, 14, 13, NOW(), NOW()),
(14, 13, 14, NOW(), NOW()),
(15, 16, 15, NOW(), NOW()),
(16, 15, 16, NOW(), NOW()),
(17, 18, 17, NOW(), NOW()),
(18, 17, 18, NOW(), NOW()),
(19, 20, 19, NOW(), NOW()),
(20, 19, 20, NOW(), NOW());

-- Profile Viewers (100 records)
INSERT INTO `profile_viewers` (`id`, `user_id`, `viewed_by`, `created_at`, `updated_at`) VALUES
(1, 1, 2, NOW(), NOW()),
(2, 2, 1, NOW(), NOW()),
(3, 3, 4, NOW(), NOW()),
(4, 4, 3, NOW(), NOW()),
(5, 5, 6, NOW(), NOW()),
(6, 6, 5, NOW(), NOW()),
(7, 7, 8, NOW(), NOW()),
(8, 8, 7, NOW(), NOW()),
(9, 9, 10, NOW(), NOW()),
(10, 10, 9, NOW(), NOW()),
(11, 11, 12, NOW(), NOW()),
(12, 12, 11, NOW(), NOW()),
(13, 13, 14, NOW(), NOW()),
(14, 14, 13, NOW(), NOW()),
(15, 15, 16, NOW(), NOW()),
(16, 16, 15, NOW(), NOW()),
(17, 17, 18, NOW(), NOW()),
(18, 18, 17, NOW(), NOW()),
(19, 19, 20, NOW(), NOW()),
(20, 20, 19, NOW(), NOW());

-- Package Payments (50 records)
INSERT INTO `package_payments` (`id`, `user_id`, `package_id`, `payment_method`, `payment_code`, `amount`, `payment_status`, `created_at`, `updated_at`) VALUES
(1, 1, 1, 'free', 'FREE_001', 0.00, 'Paid', NOW(), NOW()),
(2, 2, 2, 'stripe', 'STRIPE_002', 999.00, 'Paid', NOW(), NOW()),
(3, 3, 3, 'paypal', 'PAYPAL_003', 1999.00, 'Paid', NOW(), NOW()),
(4, 4, 1, 'free', 'FREE_004', 0.00, 'Paid', NOW(), NOW()),
(5, 5, 2, 'razorpay', 'RAZOR_005', 999.00, 'Paid', NOW(), NOW()),
(6, 6, 1, 'free', 'FREE_006', 0.00, 'Paid', NOW(), NOW()),
(7, 7, 1, 'free', 'FREE_007', 0.00, 'Paid', NOW(), NOW()),
(8, 8, 2, 'stripe', 'STRIPE_008', 999.00, 'Paid', NOW(), NOW()),
(9, 9, 4, 'paypal', 'PAYPAL_009', 4999.00, 'Paid', NOW(), NOW()),
(10, 10, 3, 'razorpay', 'RAZOR_010', 1999.00, 'Paid', NOW(), NOW()),
(11, 11, 2, 'stripe', 'STRIPE_011', 999.00, 'Paid', NOW(), NOW()),
(12, 12, 1, 'free', 'FREE_012', 0.00, 'Paid', NOW(), NOW()),
(13, 13, 2, 'paypal', 'PAYPAL_013', 999.00, 'Paid', NOW(), NOW()),
(14, 14, 3, 'razorpay', 'RAZOR_014', 1999.00, 'Paid', NOW(), NOW()),
(15, 15, 1, 'free', 'FREE_015', 0.00, 'Paid', NOW(), NOW()),
(16, 16, 1, 'free', 'FREE_016', 0.00, 'Paid', NOW(), NOW()),
(17, 17, 2, 'stripe', 'STRIPE_017', 999.00, 'Paid', NOW(), NOW()),
(18, 18, 2, 'paypal', 'PAYPAL_018', 999.00, 'Paid', NOW(), NOW()),
(19, 19, 3, 'razorpay', 'RAZOR_019', 1999.00, 'Paid', NOW(), NOW()),
(20, 20, 4, 'stripe', 'STRIPE_020', 4999.00, 'Paid', NOW(), NOW());

-- =====================================================
-- DATA INSERTION COMPLETE
-- =====================================================

-- Enable foreign key checks back
SET FOREIGN_KEY_CHECKS = 1;

-- Show completion message
SELECT 'MATRIMONIAL TEST DATA INSERTION COMPLETED SUCCESSFULLY!' as status;
