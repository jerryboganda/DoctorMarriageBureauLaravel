<?php

use Illuminate\Support\Facades\Route;

Route::group(['prefix' => 'admin', 'namespace' => 'Api\Admin'], function () {
    Route::post('/login', 'AuthController@login');

    Route::group(['middleware' => ['auth:sanctum', 'api_admin']], function () {
        Route::post('/logout', 'AuthController@logout');
        Route::get('/me', 'AuthController@me');
        Route::post('/profile', 'AuthController@updateProfile');

        Route::get('/dashboard/stats', 'DashboardController@stats');
        Route::get('/dashboard/earnings-chart', 'DashboardController@earningsChart');
        Route::get('/dashboard/happy-stories-chart', 'DashboardController@happyStoriesChart');
        Route::get('/dashboard/happy-stories', 'DashboardController@happyStories');

        Route::get('/members/deleted', 'MemberController@deleted');
        Route::get('/members/reported', 'MemberController@reported');
        Route::get('/members/verification-requests', 'MemberController@verificationRequests');
        Route::get('/members/unapproved-pictures', 'MemberController@unapprovedPictures');
        Route::get('/members/filter/{status}', 'MemberController@filterByStatus');
        Route::apiResource('members', 'MemberController');
        Route::post('/members/{id}/block', 'MemberController@block');
        Route::post('/members/{id}/toggle-activation', 'MemberController@toggleActivation');
        Route::post('/members/{id}/set-password', 'MemberController@setPassword');
        Route::post('/members/{id}/login-as', 'MemberController@loginAs');
        Route::post('/members/bulk-upload', 'MemberController@bulkUpload');
        Route::delete('/members/reported/{id}', 'MemberController@deleteReported');
        Route::post('/members/{id}/restore', 'MemberController@restore');
        Route::delete('/members/{id}/permanent', 'MemberController@permanentDelete');
        Route::post('/members/{id}/approve-verification', 'MemberController@approveVerification');
        Route::post('/members/{id}/reject-verification', 'MemberController@rejectVerification');
        Route::post('/members/{id}/approve-picture', 'MemberController@approvePicture');
        Route::post('/members/{id}/update-package', 'MemberController@updatePackage');
        Route::post('/members/{id}/update-wallet', 'MemberController@updateWallet');
        Route::post('/members/{id}/send-notification', 'MemberController@sendNotification');

        Route::apiResource('religions', 'ReligionController');
        Route::post('/religions/bulk-delete', 'ReligionController@bulkDelete');
        Route::apiResource('sects', 'SectController');
        Route::post('/sects/bulk-delete', 'SectController@bulkDelete');
        Route::apiResource('castes', 'CasteController');
        Route::post('/castes/bulk-delete', 'CasteController@bulkDelete');
        Route::apiResource('sub-castes', 'SubCasteController');
        Route::post('/sub-castes/bulk-delete', 'SubCasteController@bulkDelete');
        Route::apiResource('member-languages', 'MemberLanguageController');
        Route::apiResource('countries', 'CountryController');
        Route::post('/countries/{id}/toggle-status', 'CountryController@toggleStatus');
        Route::apiResource('states', 'StateController');
        Route::apiResource('cities', 'CityController');
        Route::apiResource('family-status', 'FamilyStatusController');
        Route::apiResource('family-values', 'FamilyValueController');
        Route::apiResource('on-behalf', 'OnBehalfController');
        Route::apiResource('marital-statuses', 'MaritalStatusController');
        Route::apiResource('annual-salaries', 'AnnualSalaryController');
        Route::apiResource('job-titles', 'JobTitleController');
        Route::post('/job-titles/bulk-delete', 'JobTitleController@bulkDelete');
        Route::apiResource('specialities', 'SpecialityController');
        Route::post('/specialities/bulk-delete', 'SpecialityController@bulkDelete');
        Route::apiResource('profile-option-values', 'ProfileOptionValueController');
        Route::post('/profile-option-values/bulk-delete', 'ProfileOptionValueController@bulkDelete');
        Route::post('/profile-option-values/{id}/toggle-active', 'ProfileOptionValueController@toggleActive');
        Route::apiResource('additional-attributes', 'AdditionalAttributeController');

        Route::apiResource('packages', 'PackageController');
        Route::post('/packages/{id}/toggle-status', 'PackageController@toggleStatus');

        Route::apiResource('package-payments', 'PackagePaymentController')->only(['index', 'show']);
        Route::post('/package-payments/{id}/accept-manual', 'PackagePaymentController@acceptManual');
        Route::get('/package-payments/{id}/invoice', 'PackagePaymentController@invoice');

        Route::get('/wallet/transactions', 'WalletController@transactions');
        Route::get('/wallet/manual-requests', 'WalletController@manualRequests');
        Route::get('/wallet/payment/{id}', 'WalletController@paymentDetail');
        Route::post('/wallet/manual-accept/{id}', 'WalletController@acceptManual');

        Route::apiResource('happy-stories', 'HappyStoryController');
        Route::post('/happy-stories/{id}/toggle-approval', 'HappyStoryController@toggleApproval');

        Route::apiResource('blogs', 'BlogController');
        Route::post('/blogs/{id}/toggle-status', 'BlogController@toggleStatus');
        Route::apiResource('blog-categories', 'BlogCategoryController');

        Route::get('/bulk-notifications', 'BulkNotificationController@index');
        Route::post('/bulk-notifications/send', 'BulkNotificationController@send');
        Route::post('/bulk-notifications/preview-count', 'BulkNotificationController@previewCount');
        Route::get('/bulk-notifications/states', 'BulkNotificationController@getStates');
        Route::get('/bulk-notifications/cities', 'BulkNotificationController@getCities');
        Route::get('/profile-reminders', 'ProfileReminderController@index');
        Route::post('/profile-reminders/update', 'ProfileReminderController@update');
        Route::post('/profile-reminders/send-now', 'ProfileReminderController@sendNow');
        Route::post('/profile-reminders/clear-logs', 'ProfileReminderController@clearLogs');

        Route::apiResource('contact-us', 'ContactUsController')->only(['index', 'show', 'destroy']);

        Route::prefix('referral')->group(function () {
            Route::get('/dashboard', 'ReferralController@dashboard');
            Route::get('/settings', 'ReferralController@settings');
            Route::post('/settings', 'ReferralController@updateSettings');
            Route::get('/rules', 'ReferralController@rules');
            Route::post('/rules', 'ReferralController@storeRule');
            Route::get('/rules/{id}', 'ReferralController@showRule');
            Route::put('/rules/{id}', 'ReferralController@updateRule');
            Route::delete('/rules/{id}', 'ReferralController@destroyRule');
            Route::get('/referrals', 'ReferralController@referrals');
            Route::post('/referrals/{id}/invalidate', 'ReferralController@invalidateReferral');
            Route::get('/rewards', 'ReferralController@rewards');
            Route::post('/rewards/{id}/reverse', 'ReferralController@reverseReward');
            Route::get('/audit-logs', 'ReferralController@auditLogs');
            Route::post('/backfill-codes', 'ReferralController@backfillCodes');
        });

        Route::get('/support-tickets/active', 'SupportTicketController@active');
        Route::get('/support-tickets/my', 'SupportTicketController@myTickets');
        Route::get('/support-tickets/solved', 'SupportTicketController@solved');
        Route::post('/support-tickets/{id}/reply', 'SupportTicketController@reply');
        Route::get('/support-settings', 'SupportTicketController@settings');
        Route::post('/support-settings', 'SupportTicketController@updateSettings');

        Route::apiResource('manual-payment-methods', 'ManualPaymentMethodController');

        Route::get('/otp/templates', 'OtpController@templates');
        Route::post('/otp/templates', 'OtpController@storeTemplate');
        Route::get('/otp/templates/{id}', 'OtpController@showTemplate');
        Route::put('/otp/templates/{id}', 'OtpController@updateTemplate');
        Route::delete('/otp/templates/{id}', 'OtpController@destroyTemplate');
        Route::get('/otp/credentials', 'OtpController@credentials');
        Route::post('/otp/credentials', 'OtpController@updateCredentials');
        Route::post('/otp/send-sms', 'OtpController@sendSms');

        Route::get('/uploaded-files', 'UploadedFileController@index');
        Route::post('/uploaded-files', 'UploadedFileController@store');
        Route::get('/uploaded-files/{id}/info', 'UploadedFileController@info');
        Route::delete('/uploaded-files/{id}', 'UploadedFileController@destroy');
        Route::post('/uploaded-files/bulk-delete', 'UploadedFileController@bulkDelete');

        Route::get('/website/header', 'WebsiteController@headerSettings');
        Route::post('/website/header', 'WebsiteController@updateHeader');
        Route::get('/website/footer', 'WebsiteController@footerSettings');
        Route::post('/website/footer', 'WebsiteController@updateFooter');
        Route::get('/website/appearances', 'WebsiteController@appearances');
        Route::post('/website/appearances', 'WebsiteController@updateAppearances');
        Route::apiResource('custom-pages', 'CustomPageController');

        Route::get('/settings/general', 'SettingsController@general');
        Route::post('/settings/general', 'SettingsController@updateGeneral');
        Route::get('/settings/smtp', 'SettingsController@smtp');
        Route::post('/settings/smtp', 'SettingsController@updateSmtp');
        Route::post('/settings/smtp/test', 'SettingsController@testSmtp');
        Route::get('/settings/payment-methods', 'SettingsController@paymentMethods');
        Route::post('/settings/payment-methods', 'SettingsController@updatePaymentMethods');
        Route::get('/settings/third-party', 'SettingsController@thirdParty');
        Route::post('/settings/third-party', 'SettingsController@updateThirdParty');
        Route::get('/settings/social-login', 'SettingsController@socialLogin');
        Route::post('/settings/social-login', 'SettingsController@updateSocialLogin');
        Route::get('/settings/fcm', 'SettingsController@fcm');
        Route::post('/settings/fcm', 'SettingsController@updateFcm');
        Route::get('/settings/verification-form', 'SettingsController@verificationForm');
        Route::post('/settings/verification-form', 'SettingsController@updateVerificationForm');
        Route::get('/settings/profile-sections', 'SettingsController@profileSections');
        Route::post('/settings/profile-sections', 'SettingsController@updateProfileSections');
        Route::post('/settings/env-update', 'SettingsController@envUpdate');
        Route::post('/settings/activation', 'SettingsController@updateActivation');

        Route::apiResource('languages', 'LanguageController');
        Route::post('/languages/{id}/toggle-rtl', 'LanguageController@toggleRtl');
        Route::get('/languages/{id}/translations', 'LanguageController@getTranslations');
        Route::post('/languages/{id}/translations', 'LanguageController@updateTranslations');

        Route::apiResource('currencies', 'CurrencyController');
        Route::post('/currencies/{id}/toggle-status', 'CurrencyController@toggleStatus');

        Route::get('/email-templates', 'EmailTemplateController@index');
        Route::get('/email-templates/{id}', 'EmailTemplateController@show');
        Route::post('/email-templates', 'EmailTemplateController@update');
        Route::put('/email-templates/{id}', 'EmailTemplateController@updateById');

        Route::apiResource('staffs', 'StaffController');
        Route::apiResource('roles', 'RoleController');
        Route::post('/roles/{id}/permissions', 'RoleController@updatePermissions');

        Route::get('/notifications', 'NotificationController@index');

        Route::get('/addons', 'AddonController@index');
        Route::post('/addons', 'AddonController@store');
        Route::post('/addons/{id}/toggle', 'AddonController@toggle');

        Route::post('/cache/clear', 'SystemController@clearCache');
    });
});
