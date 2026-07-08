export type MenuItem = {
    path: string;
    label: string;
    permission?: string;
};

export const menuItems: MenuItem[] = [
    { path: '/admin-panel/dashboard', label: 'Dashboard', permission: 'admin_dashboard' },
    { path: '/admin-panel/members', label: 'Members', permission: 'show_members' },
    {
        path: '/admin-panel/members/deleted',
        label: 'Deleted Members',
        permission: 'deleted_member_show',
    },
    {
        path: '/admin-panel/members/bulk-upload',
        label: 'Bulk Member Upload',
        permission: 'bulk_member_add',
    },
    {
        path: '/admin-panel/members/reported',
        label: 'Reported Members',
        permission: 'view_reported_profile',
    },
    {
        path: '/admin-panel/members/verification-requests',
        label: 'Verification Requests',
        permission: 'approve_member',
    },
    {
        path: '/admin-panel/members/unapproved-pictures',
        label: 'Unapproved Pictures',
        permission: 'show_unapproved_profile_picrures',
    },
    { path: '/admin-panel/religions', label: 'Religions', permission: 'show_religions' },
    { path: '/admin-panel/sects', label: 'Sects', permission: 'show_sects' },
    { path: '/admin-panel/castes', label: 'Castes', permission: 'show_castes' },
    { path: '/admin-panel/sub-castes', label: 'Sub-Castes', permission: 'show_sub_castes' },
    {
        path: '/admin-panel/member-languages',
        label: 'Member Languages',
        permission: 'show_member_languages',
    },
    { path: '/admin-panel/countries', label: 'Countries', permission: 'show_countries' },
    { path: '/admin-panel/states', label: 'States', permission: 'show_states' },
    { path: '/admin-panel/cities', label: 'Cities', permission: 'show_cities' },
    {
        path: '/admin-panel/family-status',
        label: 'Family Status',
        permission: 'show_family_status',
    },
    {
        path: '/admin-panel/family-values',
        label: 'Family Values',
        permission: 'show_family_values',
    },
    { path: '/admin-panel/on-behalf', label: 'On Behalf', permission: 'show_on_behalves' },
    {
        path: '/admin-panel/marital-statuses',
        label: 'Marital Statuses',
        permission: 'show_marital_status',
    },
    {
        path: '/admin-panel/annual-salaries',
        label: 'Annual Salaries',
        permission: 'show_annual_salary_ranges',
    },
    { path: '/admin-panel/job-titles', label: 'Job Titles', permission: 'show_job_titles' },
    { path: '/admin-panel/specialities', label: 'Specialities', permission: 'show_specialities' },
    {
        path: '/admin-panel/profile-option-values',
        label: 'Profile Option Values',
        permission: 'show_profile_option_values',
    },
    {
        path: '/admin-panel/additional-attributes',
        label: 'Additional Attributes',
        permission: 'show_additional_profile_attributes',
    },
    { path: '/admin-panel/packages', label: 'Packages', permission: 'show_packages' },
    {
        path: '/admin-panel/package-payments',
        label: 'Package Payments',
        permission: 'show_package_payments',
    },
    {
        path: '/admin-panel/wallet/transactions',
        label: 'Wallet Transactions',
        permission: 'wallet_transaction_history',
    },
    {
        path: '/admin-panel/wallet/manual-requests',
        label: 'Wallet Manual Requests',
        permission: 'offline_wallet_recharge_requests',
    },
    {
        path: '/admin-panel/happy-stories',
        label: 'Happy Stories',
        permission: 'show_happy_stories',
    },
    { path: '/admin-panel/blogs', label: 'Blogs', permission: 'show_blogs' },
    {
        path: '/admin-panel/blog-categories',
        label: 'Blog Categories',
        permission: 'show_blog_categories',
    },
    {
        path: '/admin-panel/bulk-notifications',
        label: 'Bulk Notifications',
        permission: 'newsletter',
    },
    {
        path: '/admin-panel/profile-reminders',
        label: 'Profile Reminders',
        permission: 'newsletter',
    },
    { path: '/admin-panel/contact-us', label: 'Contact Us', permission: 'show_contact_us_queries' },
    {
        path: '/admin-panel/referral/dashboard',
        label: 'Referral Dashboard',
        permission: 'view_referral_dashboard',
    },
    {
        path: '/admin-panel/referral/settings',
        label: 'Referral Settings',
        permission: 'manage_referral_settings',
    },
    {
        path: '/admin-panel/referral/rules',
        label: 'Referral Rules',
        permission: 'manage_referral_rules',
    },
    {
        path: '/admin-panel/referral/referrals',
        label: 'Referral Referrals',
        permission: 'view_referral_dashboard',
    },
    {
        path: '/admin-panel/referral/rewards',
        label: 'Referral Rewards',
        permission: 'view_referral_dashboard',
    },
    {
        path: '/admin-panel/referral/audit-logs',
        label: 'Referral Audit Logs',
        permission: 'view_referral_audit_logs',
    },
    {
        path: '/admin-panel/support/active',
        label: 'Support Active',
        permission: 'show_active_tickets',
    },
    { path: '/admin-panel/support/my', label: 'Support My Tickets', permission: 'show_my_tickets' },
    {
        path: '/admin-panel/support/solved',
        label: 'Support Solved',
        permission: 'show_solved_tickets',
    },
    {
        path: '/admin-panel/support/settings',
        label: 'Support Settings',
        permission: 'show_support_categories',
    },
    { path: '/admin-panel/manual-payment-methods', label: 'Manual Payment Methods' },
    {
        path: '/admin-panel/uploaded-files',
        label: 'Uploaded Files',
        permission: 'show_uploaded_files',
    },
    { path: '/admin-panel/website/header', label: 'Website Header', permission: 'header' },
    { path: '/admin-panel/website/footer', label: 'Website Footer', permission: 'footer' },
    {
        path: '/admin-panel/website/appearances',
        label: 'Website Appearances',
        permission: 'appearances',
    },
    { path: '/admin-panel/custom-pages', label: 'Custom Pages', permission: 'show_all_pages' },
    {
        path: '/admin-panel/settings/general',
        label: 'General Settings',
        permission: 'general_settings',
    },
    { path: '/admin-panel/settings/smtp', label: 'SMTP Settings', permission: 'smtp_settings' },
    {
        path: '/admin-panel/settings/payment-methods',
        label: 'Payment Methods',
        permission: 'payment_methods',
    },
    {
        path: '/admin-panel/settings/third-party',
        label: 'Third Party',
        permission: 'third_party_settings',
    },
    {
        path: '/admin-panel/settings/social-login',
        label: 'Social Login',
        permission: 'social_media_login_settings',
    },
    { path: '/admin-panel/settings/fcm', label: 'FCM', permission: 'firebase_push_notification' },
    {
        path: '/admin-panel/settings/verification-form',
        label: 'Verification Form',
        permission: 'manage_member_verification_form',
    },
    {
        path: '/admin-panel/settings/profile-sections',
        label: 'Profile Sections',
        permission: 'manage_profile_sections',
    },
    {
        path: '/admin-panel/settings/activation',
        label: 'Activation Settings',
        permission: 'general_settings',
    },
    { path: '/admin-panel/languages', label: 'Languages', permission: 'show_languages' },
    { path: '/admin-panel/currencies', label: 'Currencies', permission: 'show_currencies' },
    {
        path: '/admin-panel/email-templates',
        label: 'Email Templates',
        permission: 'email_templates',
    },
    { path: '/admin-panel/staffs', label: 'Staffs', permission: 'show_staffs' },
    { path: '/admin-panel/roles', label: 'Roles', permission: 'show_staff_roles' },
    { path: '/admin-panel/notifications', label: 'Notifications' },
    { path: '/admin-panel/addons', label: 'Addons', permission: 'addon_manager' },
];
