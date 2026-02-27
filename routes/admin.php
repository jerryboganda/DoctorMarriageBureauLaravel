<?php

use App\Http\Controllers\AdditionalAttributeController;
use App\Http\Controllers\AddonController;
use App\Http\Controllers\AizUploadController;
use App\Http\Controllers\AnnualSalaryRangeyController;
use App\Http\Controllers\BlogController;
use App\Http\Controllers\BlogCategoryController;
use App\Http\Controllers\CasteController;
use App\Http\Controllers\CityController;
use App\Http\Controllers\ContactUsController;
use App\Http\Controllers\CountryController;
use App\Http\Controllers\CurrencyController;
use App\Http\Controllers\EmailTemplateController;
use App\Http\Controllers\FamilyStatusController;
use App\Http\Controllers\FamilyValueController;
use App\Http\Controllers\HappyStoryController;
use App\Http\Controllers\HomeController;
use App\Http\Controllers\LanguageController;
use App\Http\Controllers\ManualPaymentMethodController;
use App\Http\Controllers\MaritalStatusController;
use App\Http\Controllers\MemberBulkAddController;
use App\Http\Controllers\MemberController;
use App\Http\Controllers\MemberLanguageController;
use App\Http\Controllers\NewsletterController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\OnBehalfController;
use App\Http\Controllers\PackageController;
use App\Http\Controllers\PackagePaymentController;
use App\Http\Controllers\PageController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\ReligionController;
use App\Http\Controllers\ReportedUserController;
use App\Http\Controllers\SectController;
use App\Http\Controllers\RoleController;
use App\Http\Controllers\SettingController;
use App\Http\Controllers\StaffController;
use App\Http\Controllers\StateController;
use App\Http\Controllers\SubCasteController;
use App\Http\Controllers\UpdateController;
use App\Http\Controllers\ProfileOptionValueController;
use App\Http\Controllers\JobTitleController;
use App\Http\Controllers\SpecialityController;
use App\Http\Controllers\ProfileCompletionReminderController;
use App\Http\Controllers\BulkNotificationController;
use App\Http\Controllers\WalletController;

/*
  |--------------------------------------------------------------------------
  | Admin Routes
  |--------------------------------------------------------------------------
  |
  | Here is where you can register admin routes for your application. These
  | routes are loaded by the RouteServiceProvider within a group which
  | contains the "web" middleware group. Now create something great!
  |
 */

Route::controller(UpdateController::class)->group(function () {
    Route::post('/update', 'step0')->name('update');
    Route::get('/update/step1', 'step1')->name('update.step1');
    Route::get('/update/step2', 'step2')->name('update.step2');
    Route::get('/update/step3', 'step3')->name('update.step3');
    Route::post('/purchase_code', 'purchase_code')->name('update.code');
});


Route::group(['prefix' => 'admin'], function () {
    Route::get('/', [HomeController::class,'admin_login'])->name('admin');
});

Route::get('/admin/login', [HomeController::class, 'admin_login'])->name('admin.login');

Route::group(['prefix' => 'admin', 'middleware' => ['auth', 'admin']], function () {
    Route::get('/dashboard', [HomeController::class, 'admin_dashboard'])->name('admin.dashboard');

    Route::resource('profile', ProfileController::class)->names([
        'edit' => 'profile.resource.edit',
    ]);

    // Contact Us page
    Route::resource('/contact-us', ContactUsController::class)->names([
        'store' => 'contact-us.resource.store',
    ]);
    Route::get('/contact-us/destroy/{id}', [ContactUsController::class, 'destroy'])->name('contact-us.delete');

    // Member Manage
    Route::resource('members', MemberController::class)->names([
        'index' => 'members.resource.index',
        'destroy' => 'members.resource.destroy',
    ]);
    Route::controller(MemberController::class)->group(function () {
        Route::get('/members/member_list/{id}', 'index')->name('members.index');
        Route::post('/members/block', 'block')->name('members.block');
        Route::post('/members/blocking_reason', 'blocking_reason')->name('members.blocking_reason');
        Route::post('/members/toggle-activation', 'toggleActivation')->name('members.toggle_activation');
        Route::post('/members/{id}/set-password', 'setMemberPassword')->middleware('throttle:10,1')->name('members.set_password');
        Route::get('/members/login/{id}', 'login')->name('members.login');

        Route::get('/deleted_members', 'deleted_members')->name('deleted_members');
        Route::get('/members/destroy/{id}', 'destroy')->name('members.destroy');
        Route::get('/restore_deleted_member/{id}', 'restore_deleted_member')->name('restore_deleted_member');
        Route::get('/members/permanently_delete/{id}', 'member_permanemtly_delete')->name('members.permanently_delete');

        Route::get('/member/verification-requests', 'verification_requests')->name('verification_requests');
        Route::get('/member/unapproved-profile-pictures', 'unapproved_profile_pictures')->name('unapproved_profile_pictures');
        Route::post('/member/approve_profile_image', 'approve_profile_image')->name('approve_profile_image');

        Route::get('/member/show-verification-info/{id}', 'show_verification_info')->name('member.show_verification_info');
        Route::get('/member/approve-verification/{id}', 'approve_verification')->name('member.approve_verification');
        Route::get('/member/reject-verification/{id}', 'reject_verification')->name('member.reject_verification');


        // member's package manage
        Route::post('/members/package_info', 'package_info')->name('members.package_info');
        Route::post('/members/get_package', 'get_package')->name('members.get_package');
        Route::post('/members/package_do_update/{id}', 'package_do_update')->name('members.package_do_update');
        Route::post('/members/wallet-balance-update', 'member_wallet_balance_update')->name('member.wallet_balance_update');
        Route::post('/members/send-notification', 'sendNotification')->name('members.send_notification');

        Route::get('/member-list/{status}', 'filterbyStatus')->name('filterbyStatus');
    });

    Route::controller(ReportedUserController::class)->group(function () {
        Route::get('/reported-members/{id}', 'reported_members')->name('reported_members');
        Route::get('/reported/destroy/{id}', 'destroy')->name('report_destrot.destroy');
    });

    // Bulk member
    Route::controller(MemberBulkAddController::class)->group(function () {
        Route::get('/member-bulk-add/index', 'index')->name('member_bulk_add.index');
        Route::get('/download/on-behalf', 'pdf_download_on_behalf')->name('pdf.on_behalf');
        Route::get('/download/package', 'pdf_download_package')->name('pdf.package');
        Route::post('/bulk-member-upload', 'bulk_upload')->name('bulk_member_upload');
    });

    // Premium Packages
    Route::resource('/packages', PackageController::class)->names([
        'destroy' => 'packages.resource.destroy',
    ]);
    Route::controller(PackageController::class)->group(function () {
        Route::post('/packages/update_status', 'update_status')->name('packages.update_status');
        Route::get('/packages/destroy/{id}', 'destroy')->name('packages.destroy');
    });

    // package Payments
    Route::resource('package-payments', PackagePaymentController::class);
    Route::controller(PackagePaymentController::class)->group(function () {
        Route::get('/manual-payment-accept/{id}', 'manual_payment_accept')->name('manual_payment_accept');
        Route::get('/package-payment-invoice/{id}', 'package_payment_invoice_admin')->name('package_payment.invoice_admin');
    });

    // Wallet
    Route::controller(WalletController::class)->group(function () {
        Route::get('/wallet-transaction-history', 'wallet_transaction_history_admin')->name('wallet_transaction_history_admin');
        Route::get('/manual-wallet-recharge-requests', 'manual_wallet_recharge_requests')->name('manual_wallet_recharge_requests');
        Route::get('/wallet-payment-details/{id}', 'show')->name('wallet_payment_details');
        Route::get('/wallet-manual-payment-accept/{id}', 'wallet_manual_payment_accept')->name('wallet_manual_payment_accept');
    });

    Route::resource('/happy-story', HappyStoryController::class);
    Route::post('/happy-story/update-story-status',[HappyStoryController::class, 'approval_status'])->name('happy_story_approval.status');

    //Blog Section
    Route::resource('blog-category', BlogCategoryController::class)->names([
        'destroy' => 'blog-category.resource.destroy',
    ]);
    Route::get('/blog-category/destroy/{id}', [BlogCategoryController::class, 'destroy'])->name('blog-category.destroy');

    Route::resource('blog', BlogController::class)->names([
        'destroy' => 'blog.resource.destroy',
    ]);
    Route::controller(BlogController::class)->group(function () {
        Route::get('/blog/destroy/{id}', 'destroy')->name('blog.destroy');
        Route::post('/blog/change-status', 'change_status')->name('blog.change-status');
    });

    // Member profile attributes
    // religions
    Route::resource('/religions', ReligionController::class)->names([
        'destroy' => 'religions.resource.destroy',
    ]);
    Route::controller(ReligionController::class)->group(function () {
        Route::get('/religions/destroy/{id}', 'destroy')->name('religions.destroy');
        Route::post('/religion/bulk_destroy', 'religion_bulk_delete')->name('religion.bulk_delete');
    });

    // Sect
    Route::resource('/sects', SectController::class)->names([
        'destroy' => 'sects.resource.destroy',
    ]);
    Route::controller(SectController::class)->group(function () {
        Route::get('/sects/destroy/{id}', 'destroy')->name('sects.destroy');
        Route::post('/sect/bulk_destroy', 'bulk_destroy')->name('sect.bulk_delete');
    });

    // Caste
    Route::resource('/castes', CasteController::class)->names([
        'destroy' => 'castes.resource.destroy',
    ]);
    Route::controller(CasteController::class)->group(function () {
        Route::get('/castes/destroy/{id}', 'destroy')->name('castes.destroy');
        Route::post('/caste/bulk_destroy', 'caste_bulk_delete')->name('caste.bulk_delete');
    });

    // SubCaste
    Route::resource('/sub-castes', SubCasteController::class)->names([
        'destroy' => 'sub-castes.resource.destroy',
    ]);
    Route::controller(SubCasteController::class)->group(function () {
        Route::get('/sub-castes/destroy/{id}', 'destroy')->name('sub-castes.destroy');
        Route::post('/sub-caste/bulk_destroy', 'sub_caste_bulk_delete')->name('sub-castes.bulk_delete');
    });

    // Member Language
    Route::resource('member-languages', MemberLanguageController::class)->names([
        'destroy' => 'member-languages.resource.destroy',
    ]);
    Route::get('/member-language/destroy/{id}', [MemberLanguageController::class, 'destroy'])->name('member-languages.destroy');

    // Country
    Route::resource('/countries', CountryController::class)->names([
        'destroy' => 'countries.resource.destroy',
    ]);
    Route::controller(CountryController::class)->group(function () {
        Route::post('/countries/status', 'updateStatus')->name('countries.status');
        Route::get('/countries/destroy/{id}', 'destroy')->name('countries.destroy');
    });


    // State
    Route::resource('/states', StateController::class)->names([
        'destroy' => 'states.resource.destroy',
    ]);
    Route::get('/states/destroy/{id}', [StateController::class,'destroy'])->name('states.destroy');

    // City
    Route::resource('/cities', CityController::class)->names([
        'destroy' => 'cities.resource.destroy',
    ]);
    Route::get('/cities/destroy/{id}', [CityController::class, 'destroy'])->name('cities.destroy');

    // Family Status
    Route::resource('/family-status', FamilyStatusController::class)->names([
        'destroy' => 'family-status.resource.destroy',
    ]);
    Route::get('/family-status/destroy/{id}', [FamilyStatusController::class, 'destroy'])->name('family-status.destroy');

    // Family Value
    Route::resource('/family-values', FamilyValueController::class)->names([
        'destroy' => 'family-values.resource.destroy',
    ]);
    Route::get('/family-values/destroy/{id}', [FamilyValueController::class, 'destroy'])->name('family-values.destroy');

    // On Behalf
    Route::resource('/on-behalf', OnBehalfController::class)->names([
        'destroy' => 'on-behalf.resource.destroy',
    ]);
    Route::get('/on-behalf/destroy/{id}', [OnBehalfController::class, 'destroy'])->name('on-behalf.destroy');

    Route::resource('marital-statuses', MaritalStatusController::class)->names([
        'destroy' => 'marital-statuses.resource.destroy',
    ]);
    Route::get('/marital-statuses/destroy/{id}', [MaritalStatusController::class, 'destroy'])->name('marital-statuses.destroy');

    // Annual Slary Range
    Route::resource('/annual-salaries', AnnualSalaryRangeyController::class)->names([
        'destroy' => 'annual-salaries.resource.destroy',
    ]);
    Route::get('/annual-salaries/destroy/{id}', [AnnualSalaryRangeyController::class, 'destroy'])->name('annual-salaries.destroy');

    // Profile Option Values (Lifestyle & Profile Options)
    Route::resource('profile-option-values', ProfileOptionValueController::class)->names([
        'destroy' => 'profile-option-values.resource.destroy',
    ]);
    Route::get('/profile-option-values/destroy/{id}', [ProfileOptionValueController::class, 'destroy'])->name('profile-option-values.destroy');
    Route::post('/profile-option-values/bulk-delete', [ProfileOptionValueController::class, 'bulk_delete'])->name('profile_option_values.bulk_delete');
    Route::post('/profile-option-values/toggle-active/{id}', [ProfileOptionValueController::class, 'toggle_active'])->name('profile-option-values.toggle_active');

    // Job Titles
    Route::resource('/job-titles', JobTitleController::class)->names([
        'destroy' => 'job-titles.resource.destroy',
    ]);
    Route::controller(JobTitleController::class)->group(function () {
        Route::get('/job-titles/destroy/{id}', 'destroy')->name('job-titles.destroy');
        Route::post('/job-title/bulk_destroy', 'bulk_delete')->name('job-titles.bulk_delete');
    });

    // Specialities
    Route::resource('/specialities', SpecialityController::class)->names([
        'destroy' => 'specialities.resource.destroy',
    ]);
    Route::controller(SpecialityController::class)->group(function () {
        Route::get('/specialities/destroy/{id}', 'destroy')->name('specialities.destroy');
        Route::post('/speciality/bulk_destroy', 'bulk_delete')->name('specialities.bulk_delete');
    });

    // Email Templates
    Route::resource('/email-templates', EmailTemplateController::class)->names([
        'update' => 'email-templates.resource.update',
    ]);
    Route::post('/email-templates/update', [EmailTemplateController::class, 'update'])->name('email-templates.update');

    // Marketing — Bulk Notifications (replaces old newsletter)
    Route::controller(NewsletterController::class)->group(function () {
        Route::get('/newsletter', 'index')->name('newsletters.index');
        Route::post('/newsletter/send', 'send')->name('newsletters.send');
        Route::post('/newsletter/test/smtp', 'testEmail')->name('test.smtp');
    });

    Route::controller(BulkNotificationController::class)->prefix('bulk-notifications')->group(function () {
        Route::get('/', 'index')->name('admin.bulk_notifications.index');
        Route::post('/send', 'send')->name('admin.bulk_notifications.send');
        Route::post('/preview-count', 'previewCount')->name('admin.bulk_notifications.preview_count');
        Route::get('/get-states', 'getStates')->name('admin.bulk_notifications.get_states');
        Route::get('/get-cities', 'getCities')->name('admin.bulk_notifications.get_cities');
    });

    // Profile Completion Reminders
    Route::controller(ProfileCompletionReminderController::class)->prefix('profile-completion-reminders')->group(function () {
        Route::get('/', 'index')->name('admin.profile_completion_reminders.index');
        Route::post('/update', 'update')->name('admin.profile_completion_reminders.update');
        Route::post('/send-now', 'sendNow')->name('admin.profile_completion_reminders.send_now');
        Route::post('/clear-logs', 'clearLogs')->name('admin.profile_completion_reminders.clear_logs');
    });

    // Language
    Route::resource('/languages', LanguageController::class)->names([
        'destroy' => 'languages.resource.destroy',
    ]);
    Route::controller(LanguageController::class)->group(function () {
        Route::post('/languages/update_rtl_status', 'update_rtl_status')->name('languages.update_rtl_status');
        Route::post('/languages/key_value_store', 'key_value_store')->name('languages.key_value_store');
        Route::get('/languages/destroy/{id}', 'destroy')->name('languages.destroy');
    });

    // Setting
    Route::resource('/settings', SettingController::class)->names([
        'update' => 'settings.resource.update',
    ]);
    Route::controller(SettingController::class)->group(function () {
        Route::post('/settings/update', 'update')->name('settings.update');
        Route::post('/settings/activation/update', 'updateActivationSettings')->name('settings.activation.update');

        // Firebase Push Notification Setting
        Route::get('/settings/firebase/fcm', 'fcm_settings')->name('settings.fcm');
        Route::post('/settings/firebase/fcm', 'fcm_settings_update')->name('settings.fcm.update');

        Route::get('/general-settings', 'general_settings')->name('general_settings');
        Route::get('/smtp-settings', 'smtp_settings')->name('smtp_settings');

        Route::get('/payment-methods-settings', 'payment_method_settings')->name('payment_method_settings');
        Route::post('/payment_method_update', 'payment_method_update')->name('payment_method.update');

        Route::get('/third-party-settings', 'third_party_settings')->name('third_party_settings');
        Route::post('/third-party-settings/update', 'third_party_settings_update')->name('third_party_settings.update');

        Route::get('/social-media-login-settings', 'social_media_login_settings')->name('social_media_login');

        Route::get('/member-profile-sections', 'member_profile_sections_configuration')->name('member_profile_sections_configuration');

        // env Update
        Route::post('/env_key_update', 'env_key_update')->name('env_key_update.update');

        Route::get('/verification/form', 'member_verification_form')->name('member_verification_form.index');
        Route::post('/verification/form/update', 'member_verification_form_update')->name('member_verification_form.update');

        Route::get('/system/update', 'system_update')->name('system_update');
        Route::get('/system/server-status', 'system_server')->name('system_server');
    });

    Route::resource('/additional-attributes', AdditionalAttributeController::class)->names([
        'update' => 'additional-attributes.resource.update',
    ]);
    Route::post('/additional-attributes/update', [AdditionalAttributeController::class, 'update'])->name('additional-attributes.update');

    // Currency settings
    Route::resource('currencies', CurrencyController::class);
    Route::controller(CurrencyController::class)->group(function () {
        Route::post('/currency/update_currency_activation_status', 'update_currency_activation_status')->name('currency.update_currency_activation_status');
        Route::get('/currency/destroy/{id}', 'destroy')->name('currency.destroy');
    });

    // website setting
    Route::group(['prefix' => 'website'], function () {
        Route::controller(SettingController::class)->group(function () {
            Route::get('/header_settings', 'website_header_settings')->name('website.header_settings');
            Route::get('/footer_settings', 'website_footer_settings')->name('website.footer_settings');
            Route::get('/appearances', 'website_appearances')->name('website.appearances');
        });

        Route::resource('custom-pages', PageController::class)->names([
            'edit' => 'custom-pages.resource.edit',
            'destroy' => 'custom-pages.resource.destroy',
        ]);
        Route::controller(PageController::class)->group(function () {
            Route::get('/custom-pages/edit/{id}', 'edit')->name('custom-pages.edit');
            Route::get('/custom-pages/destroy/{id}', 'destroy')->name('custom-pages.destroy');
        });
    });

    Route::resource('staffs', StaffController::class)->names([
        'destroy' => 'staffs.resource.destroy',
    ]);
    Route::get('/staffs/destroy/{id}', [StaffController::class, 'destroy'])->name('staffs.destroy');

    Route::resource('roles', RoleController::class)->names([
        'destroy' => 'roles.resource.destroy',
    ]);
    Route::get('/roles/destroy/{id}', [RoleController::class, 'destroy'])->name('roles.destroy');

    // permission add
    Route::post('/roles/add_permission', [RoleController::class, 'add_permission'])->name('roles.permission');

    Route::get('/notifications', [NotificationController::class, 'index'])->name('admin.notifications');

    Route::resource('addons', AddonController::class);
    Route::post('/addons/activation', [AddonController::class, 'activation'])->name('addons.activation');

    // uploaded files
    Route::resource('/uploaded-files', AizUploadController::class)->names([
        'destroy' => 'uploaded-files.resource.destroy',
    ]);
    Route::controller(AizUploadController::class)->group(function() {
        Route::any('/uploaded-files/file-info', 'file_info')->name('uploaded-files.info');
        Route::get('/uploaded-files/destroy/{id}', 'destroy')->name('uploaded-files.destroy');
        Route::post('/bulk-uploaded-files-delete', 'bulk_uploaded_files_delete')->name('bulk-uploaded-files-delete');
    });

    Route::get('/cache-cache', [HomeController::class, 'clearCache'])->name('cache.clear');

    // Manual Payment
    Route::resource('manual_payment_methods', ManualPaymentMethodController::class)->names([
        'destroy' => 'manual_payment_methods.resource.destroy',
    ]);
    Route::get('/manual_payment_methods/destroy/{id}', [ManualPaymentMethodController::class, 'destroy'])->name('manual_payment_methods.destroy');
});
