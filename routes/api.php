<?php

use App\Http\Controllers\Api\AdditionalAttributeController;
use App\Http\Controllers\Api\Payment\InstamojoController;
use App\Http\Controllers\Api\Payment\PhonepeController;
use App\Http\Controllers\Api\Payment\RazorpayController;
use App\Http\Controllers\Api\ProfileViewerController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| is assigned the "api" middleware group. Enjoy building your API!
|
*/

// Route::middleware('auth:api')->get('/user', function (Request $request) {
//     return $request->user();
// });

Route::group(['namespace' => 'Api', 'middleware' => ['app_language']], function () {
    // Authentication
    Route::post('/signup', 'AuthController@signup');
    Route::post('/signin', 'AuthController@signin');

    Route::post('/forgot/password', 'AuthController@forgotPassword');
    Route::post('/verify/password/reset', 'AuthController@verifyPasswordResetCode');
    Route::post('/verify/code', 'AuthController@verifyCode')->middleware("auth:sanctum");
    Route::get('/resend-verify/code', 'AuthController@resendVerifyCode')->middleware("auth:sanctum");
    Route::post('/reset/password', 'AuthController@resetPassword');
    Route::post('/password/reset/complete', 'AuthController@resetPassword');

    // 2FA Challenge (during login, before auth)
    Route::post('/auth/2fa/challenge', 'AccountSecurityController@challenge2FA');

    // Ownership Transfer (public routes for recipient)
    Route::get('/ownership/transfer/{token}', 'ProfileOwnershipController@getTransferByToken');
    Route::post('/ownership/transfer/accept', 'ProfileOwnershipController@acceptTransfer')->middleware('auth:sanctum');
    Route::post('/ownership/transfer/reject', 'ProfileOwnershipController@rejectTransfer');

    // Trusted Contact Verification (public)
    Route::get('/trusted-contact/verify/{token}', function ($token) {
        $contact = \App\Models\TrustedContact::verifyWithToken($token);
        if ($contact) {
            return response()->json(['success' => true, 'message' => 'Contact verified successfully.']);
        }
        return response()->json(['success' => false, 'message' => 'Invalid or expired token.'], 400);
    });

    // Registration Verification Routes
    Route::post('/send-email-verification', 'AuthController@sendEmailVerification');
    Route::post('/send-phone-verification', 'AuthController@sendPhoneVerification');
    Route::post('/verify-email-code', 'AuthController@verifyEmailCode');
    Route::post('/verify-phone-code', 'AuthController@verifyPhoneCode');
    Route::post('social-login', 'AuthController@socialLogin');
    Route::get('user-by-token', 'AuthController@getUserByToken');

    Route::get('/home/slider', 'HomeController@home_slider');
    Route::get('/home/banner', 'HomeController@home_banner');
    Route::get('/home/how-it-works', 'HomeController@home_how_it_works');
    Route::get('/home/trusted-by-millions', 'HomeController@home_trusted_by_millions');
    Route::get('/home/happy-stories', 'HomeController@home_happy_stories');
    Route::get('/home/packages', 'HomeController@home_packages');
    Route::get('/home/reviews', 'HomeController@home_reviews');

    Route::group(['middleware' => ['auth:sanctum', 'api_require_password_change']], function () {
        Route::get('/discovery', 'DiscoveryController@index');
        Route::get('/discovery/search', 'DiscoveryController@search');
        Route::get('/match-intelligence/{id}', 'MatchIntelligenceController@show');
        Route::post('/match-tuner/tune', 'MatchTunerController@tune');

        // Onboarding
        Route::post('/onboarding/complete', 'OnboardingController@complete');

        // Progression
        Route::get('/progression/active', 'ProgressionController@getActiveProgressions');
        Route::get('/progression/{id}', 'ProgressionController@getProgression');
        Route::post('/progression/{id}/update-stage', 'ProgressionController@updateStage');

        // Family Portal
        Route::get('/family', 'FamilyController@index');
        Route::post('/family/update-profile', 'FamilyController@updateProfile');
        Route::post('/family/guardian/add', 'FamilyController@addGuardian');
        Route::post('/family/guardian/update/{id}', 'FamilyController@updateGuardian');
        Route::delete('/family/guardian/delete/{id}', 'FamilyController@deleteGuardian');
        Route::post('/family/photo/upload', 'FamilyController@uploadPhoto');
        Route::delete('/family/photo/delete/{id}', 'FamilyController@deletePhoto');
        Route::post('/family/approval/approve/{id}', 'FamilyController@approve');
        Route::post('/family/approval/reject/{id}', 'FamilyController@reject');

        // Full Profile for React
        Route::get('/full-profile', 'ProfileController@get_full_profile_react');
        Route::post('/full-profile/update', 'ProfileController@update_full_profile_react');
        Route::get('/profile/download-biodata', 'ProfileController@download_biodata');
        Route::get('/profile/biodata-json', 'ProfileController@biodata_json');

        // Dropdowns and Profile Center (Accessible even if email not verified)
        Route::group(['prefix' => 'member'], function () {
            Route::get('/maritial-status', 'ProfileDropdownController@maritial_status');
            Route::get('/countries', 'ProfileDropdownController@country_list');
            Route::get('/states/{id}', 'ProfileDropdownController@state_list');
            Route::get('/cities/{id}', 'ProfileDropdownController@city_list');
            Route::get('/languages', 'ProfileDropdownController@language_list');
            Route::get('/religions', 'ProfileDropdownController@religion_list');
            Route::get('/sects', 'ProfileDropdownController@sect_list');
            Route::get('/casts/{id?}', 'ProfileDropdownController@caste_list');
            Route::get('/sub-casts/{id}', 'ProfileDropdownController@sub_caste_list');
            Route::get('/family-values', 'ProfileDropdownController@family_value_list');
            Route::get('/profile-dropdown', 'ProfileDropdownController@profile_dropdown');
            Route::get('/profile/quality-score', 'ProfileCenterController@getQualityScore');
        });
    });
    Route::get('/home/blogs', 'HomeController@home_blogs');
    Route::get('/home/premium-members', 'HomeController@home_premium_members');
    Route::get('/home/new-members', 'HomeController@home_new_members');

    Route::get('/home', 'HomeController@home');
    Route::get('/packages', 'PackageController@active_packages');
    Route::get('/addons', 'AddonProductController@index');
    Route::post('/package-details', 'PackageController@package_details');
    Route::get('/happy-stories', 'HappyStoryController@happy_stories');
    Route::post('/story-details', 'HappyStoryController@story_details');
    Route::get('/blogs', 'BlogController@all_blogs');

    Route::post('/blog-details', 'BlogController@blog_details');
    Route::post('/contact-us', 'HomeController@contact_us');

    Route::get('/addon-check', 'HomeController@addon_check');
    Route::get('/feature-check', 'HomeController@feature_check');
    Route::get('/app-info', 'HomeController@app_info');
    Route::get('/on-behalf', 'ProfileDropdownController@onbehalf_list');

    Route::get('/static-page', 'CustomPageController@custom_page');

    Route::get('/countries', 'CountryController@countries');
    Route::get('google-recaptcha', function () {
        return view("frontend.google_recaptcha.app_recaptcha");
    });

    //Payment Gateways
    Route::group(['namespace' => 'Payment'], function () {
        //Paypal START
        Route::get('/paypal/payment/done', 'PaypalController@getDone')->name('api.paypal.done');
        Route::get('/paypal/payment/cancel', 'PaypalController@getCancel')->name('api.paypal.cancel');
        //Stripe Start           
        Route::any('/stripe/success', 'StripeController@success')->name('api.stripe.success');
        Route::any('/stripe/cancel', 'StripeController@cancel')->name('api.stripe.cancel');
        Route::any('/stripe/create-checkout-session', 'StripeController@create_checkout_session')->name('api.stripe.get_token');

        // PayStack
        Route::get('/paystack/payment/callback', 'PaystackController@handleGatewayCallback');
        //Paytm
        Route::post('/paytm/callback', 'PaytmController@callback')->name('api.paytm.callback');

        // Razor Pay
        Route::controller('RazorpayController')->group(function () {
            Route::any('razorpay/payment', 'payment')->name('api.razorpay.legacy_payment');
            Route::post('razorpay/success', 'success')->name('api.razorpay.success');
        });

        // Phonepe
        Route::controller('PhonepeController')->group(function () {
            Route::any('phonepe/redirecturl', 'phonepe_redirecturl')->name('api.phonepe.redirecturl');
            Route::any('phonepe/callbackUrl', 'phonepe_callbackUrl')->name('api.phonepe.callbackUrl');
        });

        //Instamojo
        Route::controller('InstamojoController')->group(function () {
            Route::get('instamojo/success', 'success')->name('api.instamojo.success');
        });
    });

    Route::post('/logout', 'AuthController@logout')->name('api.logout')->middleware('auth:sanctum');
    Route::get('/member-validate', 'MemberController@member_validate');

    Route::group(['middleware' => ['auth:sanctum', 'api_email_verified', 'api_require_password_change']], function () {
        Route::get('/member/dashboard', 'HomeController@member_dashboard');
        Route::get('/member/verification_form', 'MemberController@getVerifyForm');
        Route::get('/member/is-approved', 'MemberController@isApproved');
        Route::post('/member/verification-info-store', 'MemberController@store_verification_info');
    });


    Route::group(['middleware' => ['auth:sanctum', 'api_email_verified', 'api_member', 'api_require_password_change']], function () {
        Route::post('/update-device-token', 'AuthController@update_device_token');
        Route::get('/app-check', 'AuthController@checkedData');
        //Payment Gateways
        Route::group(['namespace' => 'Payment'], function () {
            Route::get('payment-types', 'PaymentTypesController@getList');
            //Paypal START
            Route::any('paypal/payment/pay', 'PaypalController@pay')->name('api.paypal.pay');
            //Stripe Start
            Route::any('stripe', 'StripeController@stripe');

            Route::any('/stripe/payment/callback', 'StripeController@callback')->name('api.stripe.callback');
            //Paytm
            Route::get('/paytm/index', 'PaytmController@index');
            // Razor Pay
            Route::any('pay-with-razorpay', 'RazorpayController@payWithRazorpay')->name('api.razorpay.payment');

            // PhonePe
            Route::any('pay-with-phonepe', 'PhonepeController@pay')->name('api.phonepe.pay');
            Route::get('/phonepe-credentials', 'PhonepeController@getPhonePayCredentials')->name('api.phonepe.credentials');


            //Instamojo
            Route::any('pay-with-instamojo', 'InstamojoController@pay')->name('api.instamojo.pay');
        });
        Route::post('/upload-profile-picture', 'HomeController@upload_profile_picture')->name('api.upload.profile.picture');

        // member middleware has removed for api but it exist in web
        Route::group(['prefix' => 'member'], function () {
            //Profile
            Route::get('/public-profile/{id}', 'ProfileController@public_profile');
            Route::get('/profile-settings', 'ProfileController@profile_settings');
            Route::get('/introduction', 'ProfileController@get_introduction');
            Route::get('/get-email', 'ProfileController@get_email');
            Route::post('/introduction-update', 'ProfileController@introduction_update');
            Route::get('/basic-info', 'ProfileController@get_basic_info');
            Route::post('/basic-info/update', 'ProfileController@basic_info_update');
            Route::get('present/address', 'ProfileController@present_address');
            Route::get('permanent/address', 'ProfileController@permanent_address');
            Route::post('/address/update', 'ProfileController@address_update');
            Route::post('/education-status/update', 'EducationController@education_status_update');

            Route::post('/career-status/update', 'CareerController@career_status_update');
            Route::get('/physical-attributes', 'ProfileController@physical_attributes');
            Route::post('/physical-attributes/update', 'ProfileController@physical_attributes_update');
            Route::get('/language', 'ProfileController@member_language');
            Route::post('/language/update', 'ProfileController@member_language_update');
            Route::get('/hobbies-interests', 'ProfileController@hobbies_interest');
            Route::post('/hobbies/update', 'ProfileController@hobbies_interest_update');
            Route::get('/attitude-behavior', 'ProfileController@attitude_behavior');
            Route::post('/attitude-behavior/update', 'ProfileController@attitude_behavior_update');
            Route::get('/residency-info', 'ProfileController@residency_info');
            Route::post('/residency-info/update', 'ProfileController@residency_info_update');
            Route::get('/spiritual-background', 'ProfileController@spiritual_background');
            Route::post('/spiritual-background/update', 'ProfileController@spiritual_background_update');
            Route::get('/life-style', 'ProfileController@life_style');
            Route::post('/life-style/update', 'ProfileController@life_style_update');
            Route::get('/astronomic', 'ProfileController@astronomic_info');
            Route::post('/astronomic/update', 'ProfileController@astronomic_info_update');
            Route::get('/family-info', 'ProfileController@family_info');
            Route::post('/family-info/update', 'ProfileController@family_info_update');
            Route::get('/partner-expectation', 'ProfileController@partner_expectation');
            Route::post('/partner-expectation/update', 'ProfileController@partner_expectation_update');
            Route::post('/change/password', 'ProfileController@password_update');
            Route::post('/contact-info/update', 'ProfileController@contact_info_update');
            Route::post('/account/deactivate', 'ProfileController@account_deactivation');
            Route::post('/account/delete', 'ProfileController@account_delete');
            Route::post('/view-contact-store', 'ProfileController@store_view_contact');
            Route::get('/matched-profile', 'ProfileController@matched_profile');
            // support -ticket
            Route::get('/my-tickets', 'SupportTicketController@my_ticket');
            Route::post('/support-ticket/store', 'SupportTicketController@store');
            Route::get('/support-ticket/categories', 'SupportTicketController@support_ticket_categories');
            Route::post('/ticket-reply', 'SupportTicketController@ticket_reply');

            Route::get('/home-with-login', 'HomeController@home_with_login');
            Route::get('/check-happy-story', 'HappyStoryController@happy_story_check');
            Route::post('/happy-story', 'HappyStoryController@store');
            Route::apiResource('gallery-image', 'GalleryImageController')->names([
                'index' => 'api.member.gallery-image.index',
                'store' => 'api.member.gallery-image.store',
                'show' => 'api.member.gallery-image.show',
                'update' => 'api.member.gallery-image.update',
                'destroy' => 'api.member.gallery-image.destroy',
            ]);
            Route::apiResource('career', 'CareerController')->names([
                'index' => 'api.member.career.index',
                'store' => 'api.member.career.store',
                'show' => 'api.member.career.show',
                'update' => 'api.member.career.update',
                'destroy' => 'api.member.career.destroy',
            ]);
            Route::apiResource('education', 'EducationController')->names([
                'index' => 'api.member.education.index',
                'store' => 'api.member.education.store',
                'show' => 'api.member.education.show',
                'update' => 'api.member.education.update',
                'destroy' => 'api.member.education.destroy',
            ]);
            Route::apiResource('support-ticket', 'SupportTicketController')->names([
                'index' => 'api.member.support-ticket.index',
                'store' => 'api.member.support-ticket.store',
                'show' => 'api.member.support-ticket.show',
                'update' => 'api.member.support-ticket.update',
                'destroy' => 'api.member.support-ticket.destroy',
            ]);

            // Gallery Image Custom Actions
            Route::post('/gallery-image/{id}/set-primary', 'GalleryImageController@set_primary');
            Route::post('/gallery-image/{id}/toggle-private', 'GalleryImageController@toggle_private');
            Route::post('/gallery-image/{id}/set-as-avatar', 'GalleryImageController@set_as_avatar');

            // Gallery Image View Request
            Route::get('/gallery-image-view-request', 'GalleryImageController@image_view_request');
            Route::post('/gallery-image-view-request', 'GalleryImageController@store_image_view_request');
            Route::post('/gallery-image-view-request/accept', 'GalleryImageController@accept_image_view_request')->name('api.gallery_image_view_request_accept');
            Route::post('/gallery-image-view-request/reject', 'GalleryImageController@reject_image_view_request')->name('api.gallery_image_view_request_reject');
            // Profile Image View Request
            Route::get('/profile-picture-view-request', 'ProfileImageController@image_view_request');
            Route::post('/profile-picture-view-request', 'ProfileImageController@store_image_view_request');
            Route::post('/profile-picture-view-request/accept', 'ProfileImageController@accept_image_view_request')->name('api.profile_picture_view_request_accept');
            Route::post('/profile-picture-view-request/reject', 'ProfileImageController@reject_image_view_request')->name('api.profile_picture_view_request_reject');




            //chat routes
            Route::get('/chat-list', 'ChatController@chat_list')->middleware('api_premium_messaging');
            Route::get('/chat-view/{id}', 'ChatController@chat_view')->middleware('api_premium_messaging');
            Route::post('/chat-reply', 'ChatController@chat_reply')->middleware('api_premium_messaging');
            Route::post('/chat/old-messages', 'ChatController@get_old_messages')->middleware('api_premium_messaging');
            Route::post('/chat/share-biodata', 'ChatController@share_biodata')->middleware('api_premium_messaging');

            // Heartbeat & Online Status
            Route::post('/heartbeat', function () {
                $expiresAt = \Carbon\Carbon::now()->addMinutes(3);
                \Cache::put('user-is-online-' . auth()->id(), true, $expiresAt);
                return response()->json(['result' => true]);
            });
            Route::post('/user-online-status', function (\Illuminate\Http\Request $request) {
                $userIds = $request->input('user_ids', []);
                $statuses = [];
                foreach ($userIds as $uid) {
                    $statuses[$uid] = \Cache::has('user-is-online-' . $uid) ? 1 : 0;
                }
                return response()->json(['result' => true, 'data' => $statuses]);
            });

            // Progression Routes
            Route::get('/progression/stages', 'ProgressionController@getStages');
            Route::get('/progression/active', 'ProgressionController@getActiveProgressions');
            Route::get('/progression/partner/{id}', 'ProgressionController@getProgression');
            Route::post('/progression/update-stage', 'ProgressionController@updateStage');

            // Family Portal Routes
            Route::get('/family/details', 'FamilyPortalController@index');
            Route::post('/family/update', 'FamilyPortalController@update');
            Route::post('/family/guardian/add', 'FamilyPortalController@addGuardian');
            Route::post('/family/guardian/update/{id}', 'FamilyPortalController@updateGuardian');
            Route::delete('/family/guardian/delete/{id}', 'FamilyPortalController@deleteGuardian');
            Route::post('/family/photo/upload', 'FamilyPortalController@uploadPhoto');
            Route::delete('/family/photo/delete/{id}', 'FamilyPortalController@deletePhoto');

            // Notification Center Routes
            Route::get('/notifications/feed', 'NotificationCenterController@feed');
            Route::get('/notifications/recap', 'NotificationCenterController@recap');
            Route::get('/notifications/preferences', 'NotificationCenterController@getPreferences');
            Route::post('/notifications/preferences', 'NotificationCenterController@updatePreferences');
            Route::post('/notifications/snooze', 'NotificationCenterController@toggleSnooze');
            Route::post('/notifications/mark-read', 'NotificationCenterController@markAsRead');

            // Profile Center Routes (Unified Profile Management)
            Route::get('/profile/full', 'ProfileCenterController@getFullProfile');
            Route::post('/profile/section/{section}', 'ProfileCenterController@updateSection');
            Route::get('/profile/visibility', 'ProfileCenterController@getVisibilitySettings');
            Route::post('/profile/visibility', 'ProfileCenterController@toggleVisibility');
            Route::post('/profile/media/voice', 'ProfileCenterController@uploadVoiceIntro');
            Route::delete('/profile/media/voice', 'ProfileCenterController@deleteVoiceIntro');
            Route::post('/profile/media/video', 'ProfileCenterController@uploadIntroVideo');
            Route::delete('/profile/media/video', 'ProfileCenterController@deleteIntroVideo');

            Route::get('/profile/history', 'ProfileCenterController@getHistory');
            Route::post('/profile/preference-priorities', 'ProfileCenterController@updatePreferencePriorities');

            // Account & Security Routes
            Route::get('/account/security-status', 'AccountSecurityController@getSecurityStatus');

            // Device Management
            Route::delete('/account/devices/{tokenId}', 'AccountSecurityController@revokeDevice');
            Route::delete('/account/devices-others', 'AccountSecurityController@revokeOtherDevices');

            // Two-Factor Authentication
            Route::post('/account/2fa/setup', 'AccountSecurityController@setup2FA');
            Route::post('/account/2fa/verify', 'AccountSecurityController@verify2FA');
            Route::delete('/account/2fa', 'AccountSecurityController@disable2FA');
            Route::post('/account/2fa/recovery-codes', 'AccountSecurityController@regenerateRecoveryCodes');

            // Trusted Contacts
            Route::post('/account/trusted-contacts', 'AccountSecurityController@addTrustedContact');
            Route::delete('/account/trusted-contacts/{contactId}', 'AccountSecurityController@removeTrustedContact');
            Route::post('/account/trusted-contacts/{contactId}/resend', 'AccountSecurityController@resendTrustedContactVerification');

            // Step-Up Authentication
            Route::post('/account/step-up/initiate', 'AccountSecurityController@initiateStepUp');
            Route::post('/account/step-up/verify-password', 'AccountSecurityController@verifyStepUpPassword');
            Route::post('/account/step-up/verify-otp', 'AccountSecurityController@verifyStepUpOtp');

            // Profile Ownership & Management
            Route::get('/account/ownership', 'ProfileOwnershipController@getOwnershipStatus');
            Route::put('/account/management-mode', 'ProfileOwnershipController@updateManagementMode');
            Route::post('/account/managers/invite', 'ProfileOwnershipController@inviteManager');
            Route::post('/account/managers/accept', 'ProfileOwnershipController@acceptManagerInvitation');
            Route::put('/account/managers/{managerId}/permissions', 'ProfileOwnershipController@updateManagerPermissions');
            Route::delete('/account/managers/{managerId}', 'ProfileOwnershipController@removeManager');

            // Ownership Transfer
            Route::post('/account/ownership/transfer', 'ProfileOwnershipController@initiateTransfer');
            Route::post('/account/ownership/cancel', 'ProfileOwnershipController@cancelTransfer');

            // Member
            Route::get('/member-info/{id}', 'MemberController@member_info');
            Route::get('/package-details', 'MemberController@package_details');
            Route::post('/member-listing', 'MemberController@member_listing');
            Route::get('/ignored-user-list', 'MemberController@ignored_user_list');
            Route::post('/add-to-ignore-list', 'MemberController@add_to_ignore_list');
            Route::post('/remove-from-ignored-list', 'MemberController@remove_from_ignored_list');
            Route::post('/report-member', 'MemberController@report_member');
            // Package
            Route::post('/package-purchase', 'PackageController@package_purchase');
            Route::get('/package-purchase-history', 'PackageController@package_purchase_history');
            Route::post('/package-purchase-history-invoice', 'PackageController@package_purchase_history_invoice');
            // Add-on Purchases
            Route::post('/addon-purchase', 'AddonPurchaseController@purchase');
            Route::get('/addon-purchase-history', 'AddonPurchaseController@history');
            // Coupons
            Route::post('/coupons/validate', 'CouponController@validateCode');
            // Communities
            Route::get('/communities', 'CommunityController@index');
            Route::post('/communities', 'CommunityController@store');
            Route::post('/communities/{communityId}/join', 'CommunityController@join');
            Route::delete('/communities/{communityId}/leave', 'CommunityController@leave');
            // Interest
            Route::get('/my-interests', 'InterestController@my_interests');
            Route::post('/express-interest', 'InterestController@express_interest');
            Route::get('/interest-requests', 'InterestController@interest_requests');
            Route::post('/interest-accept', 'InterestController@accept_interest');
            Route::post('/interest-reject', 'InterestController@reject_interest');
            Route::post('/interest-withdraw', 'InterestController@withdraw_interest');
            // Shortlist
            Route::get('/my-shortlists', 'ShortlistController@index');
            Route::post('add-to-shortlist', 'ShortlistController@store');
            Route::post('remove-from-shortlist', 'ShortlistController@remove');

            // Profile Viewers
            Route::get('/my-profile-viewers', [ProfileViewerController::class, 'my_profile_viewers']);
            // Walet
            Route::get('/my-wallet-balance', 'WalletController@wallet_balance');
            Route::get('/wallet', 'WalletController@index');
            Route::post('/wallet-recharge', 'WalletController@recharge');
            Route::get('/wallet-withdraw-request-history', 'WalletController@wallet_withdraw_request_history');
            Route::post('/wallet-withdraw-request-store', 'WalletController@wallet_withdraw_request_store');
            // Referral
            Route::get('/referred-users', 'ReferralController@index');
            Route::get('/referral-code', 'ReferralController@referral_code');
            Route::get('/my-referral-earnings', 'ReferralController@referral_earnings');
            Route::get('/referral-check', 'ReferralController@referral_check');
            // Notifications
            Route::get('/notifications', 'NotificationController@notifications');
            Route::get('/notification/{id}', 'NotificationController@single_notification_read');
            Route::get('/mark-all-as-read', 'NotificationController@mark_all_as_read');
            // Happy tory
            Route::get('/happy-story', 'HappyStoryController@happy_story');

            // Additional Profile Attributes
            Route::controller(AdditionalAttributeController::class)->group(function () {
                Route::get('/additional_attributes', 'index');
                Route::post('/additional-member-info/update', 'additional_member_info_update');
            });
        });
    });

    // Dashboard API Routes - Web Authentication
    Route::group(['middleware' => ['auth:sanctum', 'api_email_verified', 'api_member', 'api_require_password_change']], function () {

        // Dashboard Stats
        Route::get('/dashboard/stats', function (Request $request) {
            $user = $request->user();

            $totalViews = \App\Models\ProfileViewer::where('user_id', $user->id)->count();
            $totalLikes = \App\Models\ExpressInterest::where('user_id', $user->id)->count();
            $totalMatches = \App\Models\ProfileMatch::where('user_id', $user->id)->count();

            return response()->json([
                'total_views' => $totalViews,
                'total_likes' => $totalLikes,
                'total_matches' => $totalMatches
            ]);
        });

        // Incoming Interest
        Route::get('/dashboard/incoming-interest', function (Request $request) {
            try {
                $user = $request->user();

                $incomingInterests = \App\Models\ExpressInterest::where('user_id', $user->id)
                    ->where('status', 0)
                    ->with([
                        'user' => function ($query) {
                            $query->select('id', 'first_name', 'last_name', 'date_of_birth');
                        }
                    ])
                    ->with([
                        'user.addresses' => function ($query) {
                            $query->select('user_id', 'city');
                        }
                    ])
                    ->latest()
                    ->limit(5)
                    ->get()
                    ->map(function ($interest) {
                        $interestedUser = $interest->user;
                        $age = $interestedUser->date_of_birth ? \Carbon\Carbon::parse($interestedUser->date_of_birth)->age : '';
                        $location = $interestedUser->addresses->first()->city ?? 'N/A';

                        return [
                            'id' => $interestedUser->id,
                            'name' => $interestedUser->first_name . ' ' . $interestedUser->last_name,
                            'age' => $age,
                            'location' => $location,
                            'interest_id' => $interest->id
                        ];
                    });

                return response()->json($incomingInterests);
            } catch (\Exception $e) {
                return response()->json(['error' => $e->getMessage()], 500);
            }
        });

        // Message Preview
        Route::get('/dashboard/message-preview', function (Request $request) {
            $user = $request->user();

            $messagePreviews = \App\Models\ChatThread::where(function ($query) use ($user) {
                $query->where('sender_user_id', $user->id)
                    ->orWhere('receiver_user_id', $user->id);
            })
                ->with(['sender:id,first_name,last_name', 'receiver:id,first_name,last_name'])
                ->with([
                    'chats' => function ($query) {
                        $query->latest()->limit(1);
                    }
                ])
                ->latest()
                ->limit(3)
                ->get()
                ->map(function ($thread) use ($user) {
                    $otherUser = $thread->sender_user_id == $user->id ? $thread->receiver : $thread->sender;
                    $latestMessage = $thread->chats->first();

                    if (!$otherUser)
                        return null;

                    return [
                        'sender_name' => $otherUser->first_name . ' ' . $otherUser->last_name,
                        'message_preview' => $latestMessage ? substr($latestMessage->message, 0, 50) . '...' : 'No messages yet',
                        'time_ago' => $latestMessage ? $latestMessage->created_at->diffForHumans() : 'Just now',
                        'unread_count' => $thread->chats()->where('sender_user_id', '!=', $user->id)->where('seen', 0)->count(),
                        'thread_id' => $thread->id
                    ];
                })->filter();

            return response()->json($messagePreviews);
        });

        // Mutual Match
        Route::get('/dashboard/mutual-match', function (Request $request) {
            $user = $request->user();

            $mutualMatches = \App\Models\ExpressInterest::where('user_id', $user->id)
                ->where('status', 1)
                ->with([
                    'user' => function ($query) {
                        $query->select('id', 'first_name', 'last_name', 'date_of_birth');
                    }
                ])
                ->with([
                    'user.addresses' => function ($query) {
                        $query->select('user_id', 'city');
                    }
                ])
                ->latest()
                ->limit(3)
                ->get()
                ->map(function ($match) {
                    $age = $match->user->date_of_birth ? \Carbon\Carbon::parse($match->user->date_of_birth)->age : null;
                    $location = $match->user->addresses->first()->city ?? 'N/A';

                    return [
                        'id' => $match->user->id,
                        'name' => $match->user->first_name . ' ' . $match->user->last_name,
                        'age' => $age,
                        'location' => $location,
                        'match_percentage' => rand(85, 98),
                        'is_online' => rand(0, 1)
                    ];
                });

            return response()->json($mutualMatches);
        });

        // Recent Visitors
        Route::get('/dashboard/recent-visitors', function (Request $request) {
            $user = $request->user();

            $recentVisitors = \App\Models\ProfileViewer::where('user_id', $user->id)
                ->with([
                    'profileViewer' => function ($query) {
                        $query->select('id', 'first_name', 'last_name', 'date_of_birth');
                    }
                ])
                ->with([
                    'profileViewer.addresses' => function ($query) {
                        $query->select('user_id', 'city');
                    }
                ])
                ->latest()
                ->limit(3)
                ->get()
                ->map(function ($visitor) {
                    if (!$visitor->profileViewer)
                        return null;

                    $age = $visitor->profileViewer->date_of_birth ? \Carbon\Carbon::parse($visitor->profileViewer->date_of_birth)->age : null;
                    $location = $visitor->profileViewer->addresses->first()->city ?? 'N/A';

                    return [
                        'id' => $visitor->profileViewer->id,
                        'name' => $visitor->profileViewer->first_name . ' ' . $visitor->profileViewer->last_name,
                        'age' => $age,
                        'location' => $location,
                        'visited_time' => $visitor->created_at->diffForHumans()
                    ];
                })->filter();

            return response()->json($recentVisitors);
        });

        // Success Stories
        Route::get('/dashboard/success-stories', function (Request $request) {
            $successStories = \App\Models\HappyStory::where('approved', 1)
                ->with([
                    'user' => function ($query) {
                        $query->select('id', 'first_name', 'last_name');
                    }
                ])
                ->latest()
                ->limit(3)
                ->get()
                ->map(function ($story) {
                    return [
                        'id' => $story->id,
                        'couple_names' => $story->user->first_name . ' & ' . ($story->partner_name ?? 'Partner'),
                        'story_preview' => substr($story->story, 0, 100) . '...',
                        'marriage_date' => $story->marriage_date ? \Carbon\Carbon::parse($story->marriage_date)->format('M d, Y') : 'N/A'
                    ];
                });

            return response()->json($successStories);
        });

        // Today Matches
        Route::get('/dashboard/today-matches', function (Request $request) {
            $user = $request->user();

            $todayMatches = \App\Models\User::where('user_type', 'member')
                ->where('approved', 1)
                ->where('id', '!=', $user->id)
                ->where('created_at', '>=', now()->subMonth())
                ->with([
                    'addresses' => function ($query) {
                        $query->select('user_id', 'city');
                    }
                ])
                ->latest()
                ->limit(10)
                ->get()
                ->map(function ($newUser) {
                    $age = $newUser->date_of_birth ? \Carbon\Carbon::parse($newUser->date_of_birth)->age : null;
                    $location = $newUser->addresses->first()->city ?? 'N/A';

                    return [
                        'id' => $newUser->id,
                        'name' => $newUser->first_name . ' ' . $newUser->last_name,
                        'age' => $age,
                        'location' => $location,
                        'joined_time' => $newUser->created_at->diffForHumans()
                    ];
                });

            return response()->json($todayMatches);
        });

        // Interest Actions
        Route::post('/interest/accept', function (Request $request) {
            $user = $request->user();
            $interestId = $request->input('interest_id');

            // Find the interest
            $interest = \App\Models\ExpressInterest::find($interestId);

            if (!$interest || $interest->user_id != $user->id) {
                return response()->json(['success' => false, 'message' => 'Interest not found'], 404);
            }

            // Create mutual interest (both users like each other)
            \App\Models\ExpressInterest::create([
                'user_id' => $interest->interested_by,
                'interested_by' => $user->id,
                'status' => 1
            ]);

            // Update original interest status
            $interest->update(['status' => 1]);

            return response()->json(['success' => true, 'message' => 'Proposal accepted successfully']);
        });

        Route::post('/interest/decline', function (Request $request) {
            $user = $request->user();
            $interestId = $request->input('interest_id');

            // Find the interest
            $interest = \App\Models\ExpressInterest::find($interestId);

            if (!$interest || $interest->user_id != $user->id) {
                return response()->json(['success' => false, 'message' => 'Interest not found'], 404);
            }

            // Update interest status to declined
            $interest->update(['status' => 2]);

            return response()->json(['success' => true, 'message' => 'Proposal declined successfully']);
        });

        // Express Interest
        Route::post('/express-interest', function (Request $request) {
            $user = $request->user();
            $targetUserId = $request->input('user_id');

            // Check if already expressed interest
            $existingInterest = \App\Models\ExpressInterest::where('user_id', $user->id)
                ->where('interested_by', $targetUserId)
                ->first();

            if ($existingInterest) {
                return response()->json(['success' => false, 'message' => 'Proposal already sent']);
            }

            // Create new interest
            \App\Models\ExpressInterest::create([
                'user_id' => $user->id,
                'interested_by' => $targetUserId,
                'status' => 0
            ]);

            return response()->json(['success' => true, 'message' => 'Proposal sent successfully']);
        });


        // ===== Referral System API Routes =====
        Route::prefix('referral')->group(function () {
            Route::get('/my-stats', 'ReferralApiController@myStats');
            Route::post('/validate-code', 'ReferralApiController@validateCode');
            Route::post('/regenerate-code', 'ReferralApiController@regenerateCode');
            Route::get('/settings-public', 'ReferralApiController@publicSettings');
        });
    });

    // Public referral code validation (no auth required)
    Route::post('/referral/validate-signup-code', 'ReferralApiController@validateCode');
});
