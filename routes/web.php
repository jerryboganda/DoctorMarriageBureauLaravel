<?php

use App\Http\Controllers\AdditionalMemberInfoController;
use App\Http\Controllers\AddressController;
use App\Http\Controllers\AizUploadController;
use App\Http\Controllers\AstrologyController;
use App\Http\Controllers\AttitudeController;
use App\Http\Controllers\Auth\LoginController;
use App\Http\Controllers\Auth\VerificationController;
use App\Http\Controllers\BlogController;
use App\Http\Controllers\CareerController;
use App\Http\Controllers\CasteController;
use App\Http\Controllers\ChatController;
use App\Http\Controllers\CityController;
use App\Http\Controllers\ContactUsController;
use App\Http\Controllers\CurrencyController;
use App\Http\Controllers\DemoController;
use App\Http\Controllers\EducationController;
use App\Http\Controllers\ExpressInterestController;
use App\Http\Controllers\FamilyController;
use App\Http\Controllers\GalleryImageController;
use App\Http\Controllers\HappyStoryController;
use App\Http\Controllers\HobbyController;
use App\Http\Controllers\HomeController;
use App\Http\Controllers\IgnoredUserController;
use App\Http\Controllers\LanguageController;
use App\Http\Controllers\LifestyleController;
use App\Http\Controllers\MemberController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\PackageController;
use App\Http\Controllers\PackagePaymentController;
use App\Http\Controllers\PartnerExpectationController;
use App\Http\Controllers\PhonepeController;
use App\Http\Controllers\PhysicalAttributeController;
use App\Http\Controllers\ProfileMatchController;
use App\Http\Controllers\ProfileViewerController;
use App\Http\Controllers\RecidencyController;
use App\Http\Controllers\ReportedUserController;
use App\Http\Controllers\ShortlistController;
use App\Http\Controllers\SpiritualBackgroundController;
use App\Http\Controllers\StateController;
use App\Http\Controllers\StripeController;
use App\Http\Controllers\SubCasteController;
use App\Http\Controllers\ViewContactController;
use App\Http\Controllers\ViewGalleryImageController;
use App\Http\Controllers\ViewProfilePictureController;
use App\Http\Controllers\WalletController;
use Illuminate\Support\Facades\Route;
use Illuminate\Http\Request;


/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| Here is where you can register web routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| contains the "web" middleware group. Now create something great!
|
*/

//demo
Route::controller(DemoController::class)->group(function () {
    Route::get('/demo/cron_1', 'cron_1');
    Route::get('/demo/cron_2', 'cron_2');
});

Auth::routes();

// Password reset routes - ensure correct routing
Route::get('/password/reset', function () {
    return view('auth.passwords.email');
})->name('password.request');

Route::get('/password/email', function () {
    return view('auth.passwords.email');
})->name('password.email.form');

Route::post('/password/email', [App\Http\Controllers\Auth\ForgotPasswordController::class, 'sendResetLinkEmail'])->name('password.email');

Route::controller(HomeController::class)->group(function () {
    //Home Page
    Route::get('/', 'index')->name('index');
    Route::get('/', 'index')->name('home');

    // fcm
    Route::post('/fcm-token', 'updateToken')->name('fcmToken');
});

// Registration Verification Routes
Route::post('/send-email-verification', [App\Http\Controllers\Api\AuthController::class, 'sendEmailVerification']);
Route::post('/verify-email-code', [App\Http\Controllers\Api\AuthController::class, 'verifyEmailCode']);

Route::controller(VerificationController::class)->group(function () {
    Route::get('/email_change/callback', 'email_change_callback')->name('email_change.callback');
    // Show reset password form (GET) to avoid 405 after POST validation errors
    Route::get('/password/reset/email', function(){ return view('auth.passwords.reset'); })->name('password.reset.form');
    Route::post('/password/reset/email/submit', 'reset_password_with_code')->name('password.update.email_code');
    Route::get('/users/login', 'login')->name('user.login');
    Route::get('/happy-stories', 'happy_stories')->name('happy_stories');
    Route::get('/users/blocked', 'user_account_blocked')->name('user.blocked');
});

// Uploader
Route::get('/refresh-csrf', function () {
    return csrf_token();
});

Route::controller(AizUploadController::class)->group(function () {
    Route::post('/aiz-uploader', 'show_uploader');
    Route::post('/aiz-uploader/upload', 'upload');
    Route::get('/aiz-uploader/get_uploaded_files', 'get_uploaded_files');
    Route::delete('/aiz-uploader/destroy/{id}', 'destroy');
    Route::post('/aiz-uploader/get_file_by_ids', 'get_preview_files');
    Route::get('/aiz-uploader/download/{id}', 'attachment_download')->name('download_attachment');
    Route::get('/migrate/database', 'migrate_database');
});

Auth::routes(['verify' => true]);
Route::controller(LoginController::class)->group(function () {
    Route::get('/logout', 'logout')->name('logout.get');
    Route::get('/social-login/redirect/{provider}', 'redirectToProvider')->name('social.login');
    Route::get('/social-login/{provider}/callback', 'handleProviderCallback')->name('social.callback');
});

Route::controller(VerificationController::class)->group(function () {
    Route::get('/email/resend', 'resend')->name('verification.resend.get');
    Route::get('/verification-confirmation/{code}', 'verification_confirmation')->name('email.verification.confirmation');
});

Route::post('/language', [LanguageController::class, 'changeLanguage'])->name('language.change');
Route::get('/packages', [PackageController::class, 'select_package'])->name('packages');

// Email verification notice (must exist as it's referenced by Laravel auth)
Route::get('/email/verify', function() { return response()->json(['message' => 'Please verify your email address.'], 200); })->name('verification.notice')->middleware('auth');


Route::group(['middleware' => ['auth']], function () {
    Route::post('/send-email-verification', [App\Http\Controllers\Api\AuthController::class, 'sendEmailVerification']);
        Route::post('/verify-email-code', [App\Http\Controllers\Api\AuthController::class, 'verifyEmailCode']);
    });

//Blog
Route::controller(BlogController::class)->group(function () {
    Route::get('/blog', 'all_blog')->name('blog');
    Route::get('/blog/{slug}', 'blog_details')->name('blog.details');
    Route::get('/blog/description/{slug}', 'blog_description')->name('blog.description');
});


Route::group(['middleware' => ['member', 'verified']], function () {
    // Ignore User API
    Route::post('/legacy-api/ignore-user', function (Request $request) {
        try {
            $user = $request->user();
            $targetUserId = $request->user_id;
            
            // Add to ignored users
            \App\Models\IgnoredUser::create([
                'user_id' => $targetUserId,
                'ignored_by' => $user->id
            ]);
            
            return response()->json(['success' => true]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    });
    
    // Accept Interest API
    Route::post('/legacy-api/interest/accept', function (Request $request) {
        try {
            if (!auth()->check()) {
                return response()->json(['success' => false, 'message' => 'User not authenticated'], 401);
            }
            
            $user = auth()->user();
            $interestId = $request->interest_id;
            
            $interest = \App\Models\ExpressInterest::find($interestId);
            if (!$interest) {
                return response()->json(['success' => false, 'message' => 'Proposal request not found'], 404);
            }
            
            // Check if user owns this interest
            if ($interest->user_id != $user->id) {
                return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
            }
            
            $interest->status = 1;
            if ($interest->save()) {
                // Create chat thread if it doesn't exist
                $existing_chat_thread = \App\Models\ChatThread::where(function ($query) use ($interest) {
                    $query->where('sender_user_id', $interest->interested_by)->where('receiver_user_id', $interest->user_id);
                })->orWhere(function ($query) use ($interest) {
                    $query->where('receiver_user_id', $interest->interested_by)->where('sender_user_id', $interest->user_id);
                })->first();

                if ($existing_chat_thread == null) {
                    $chat_thread = new \App\Models\ChatThread;
                    $chat_thread->thread_code = $interest->interested_by . date('Ymd') . $interest->user_id;
                    $chat_thread->sender_user_id = $interest->interested_by;
                    $chat_thread->receiver_user_id = $interest->user_id;
                    $chat_thread->save();
                }
                
                return response()->json(['success' => true, 'message' => 'Proposal accepted successfully']);
            } else {
                return response()->json(['success' => false, 'message' => 'Failed to accept proposal'], 500);
            }
        } catch (\Exception $e) {
            \Log::error('Error accepting interest: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Internal server error'], 500);
        }
    });
    
    // Decline Interest API
    Route::post('/legacy-api/interest/decline', function (Request $request) {
        try {
            if (!auth()->check()) {
                return response()->json(['success' => false, 'message' => 'User not authenticated'], 401);
            }
            
            $user = auth()->user();
            $interestId = $request->interest_id;
            
            $interest = \App\Models\ExpressInterest::find($interestId);
            if (!$interest) {
                return response()->json(['success' => false, 'message' => 'Proposal request not found'], 404);
            }
            
            // Check if user owns this interest
            if ($interest->user_id != $user->id) {
                return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
            }
            
            if (\App\Models\ExpressInterest::destroy($interestId)) {
                return response()->json(['success' => true, 'message' => 'Proposal declined successfully']);
            } else {
                return response()->json(['success' => false, 'message' => 'Failed to decline proposal'], 500);
            }
        } catch (\Exception $e) {
            \Log::error('Error declining interest: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Internal server error'], 500);
        }
    });
    
    // Check Interest Status API
    Route::get('/legacy-api/check-interest-status/{userId}', function (Request $request, $userId) {
        try {
            if (!auth()->check()) {
                return response()->json(['success' => false, 'message' => 'User not authenticated'], 401);
            }
            
            $user = auth()->user();
            
            // Check if current user has already sent interest to this user
            $sentInterest = \App\Models\ExpressInterest::where('interested_by', $user->id)
                ->where('user_id', $userId)
                ->first();
            
            // Check if this user has sent interest to current user
            $receivedInterest = \App\Models\ExpressInterest::where('user_id', $user->id)
                ->where('interested_by', $userId)
                ->first();
            
            $status = 'none';
            $buttonText = 'Send Proposal';
            $buttonClass = 'btn-send-interest';
            
            if ($sentInterest) {
                if ($sentInterest->status == 1) {
                    $status = 'accepted';
                    $buttonText = 'Proposal Accepted';
                    $buttonClass = 'btn-interest-accepted';
                } else {
                    $status = 'sent';
                    $buttonText = 'Proposal Sent';
                    $buttonClass = 'btn-interest-sent';
                }
            } else if ($receivedInterest) {
                if ($receivedInterest->status == 1) {
                    $status = 'mutual';
                    $buttonText = 'Mutual Proposal';
                    $buttonClass = 'btn-mutual-interest';
                } else {
                    $status = 'received';
                    $buttonText = 'Reply to Proposal';
                    $buttonClass = 'btn-respond-interest';
                }
            }
            
            return response()->json([
                'success' => true,
                'status' => $status,
                'button_text' => $buttonText,
                'button_class' => $buttonClass
            ]);
        } catch (\Exception $e) {
            \Log::error('Error checking interest status: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Internal server error'], 500);
        }
    });
    
    // Express Interest API
    Route::post('/legacy-api/express-interest', function (Request $request) {
        try {
            if (!auth()->check()) {
                return response()->json(['success' => false, 'message' => 'User not authenticated'], 401);
            }
            
            $user = auth()->user();
            $targetUserId = $request->user_id;

            $existingInterest = \App\Models\ExpressInterest::where('user_id', $targetUserId)
                ->where('interested_by', $user->id)
                ->first();
            
            if ($existingInterest) {
                return response()->json(['success' => false, 'message' => 'Proposal already sent']);
            }
            
            // Check if user is trying to send interest to themselves
            if ($targetUserId == $user->id) {
                return response()->json(['success' => false, 'message' => 'Cannot send proposal to yourself']);
            }

            $result = (new \App\Services\InterestService())->store($targetUserId);

            if (is_array($result) && ($result['success'] ?? false)) {
                return response()->json(['success' => true, 'message' => 'Proposal sent successfully']);
            }

            $payload = is_array($result) ? $result : [];

            return response()->json([
                'success' => false,
                'result' => false,
                'status' => $payload['status'] ?? null,
                'code' => $payload['code'] ?? null,
                'error_code' => $payload['error_code'] ?? 'unknown',
                'limit_type' => $payload['limit_type'] ?? null,
                'free_limit' => $payload['free_limit'] ?? null,
                'used' => $payload['used'] ?? null,
                'message' => $payload['message'] ?? 'Failed to send proposal',
            ], $payload['http_status'] ?? 200);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    });
    
    // Accept Interest API
    Route::post('/legacy-api/interest/accept', function (Request $request) {
        try {
            $interestId = $request->interest_id;
            $interest = \App\Models\ExpressInterest::find($interestId);
            
            if ($interest) {
                $interest->update(['status' => 1]); // Accepted
                return response()->json(['success' => true]);
            }
            
            return response()->json(['success' => false, 'message' => 'Proposal request not found']);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    });
    
    // Decline Interest API
    Route::post('/legacy-api/interest/decline', function (Request $request) {
        try {
            $interestId = $request->interest_id;
            $interest = \App\Models\ExpressInterest::find($interestId);
            
            if ($interest) {
                $interest->update(['status' => 2]); // Declined
                return response()->json(['success' => true]);
            }
            
            return response()->json(['success' => false, 'message' => 'Proposal request not found']);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    });


});

// Member verification routes - should be accessible to unverified members
Route::group(['middleware' => ['verified']], function () {
    Route::controller(MemberController::class)->group(function () {
        Route::get('/member/verification', 'verification_form')->name('member.verification');
        Route::post('/member/verification-info/store', 'verification_info_store')->name('member.verification_info.store');
    });
    Route::get('/dashboard', function () {
        return redirect(rtrim(env('FRONTEND_URL', env('APP_URL', 'http://localhost')), '/'));
    })->name('dashboard');
});

Route::group(['middleware' => ['member', 'verified']], function () {
    Route::controller(HomeController::class)->group(function () {
        Route::post('/new-user-email', 'update_email')->name('user.change.email');
        Route::post('/new-user-verification', 'new_verify')->name('user.new.verify');

        Route::any('/member-listing', 'member_listing')->name('member.listing');
        Route::get('/member-profile/{id}', 'view_member_profile')->name('member_profile');

        Route::post('/user/remaining_package_value', 'user_remaining_package_value')->name('user.remaining_package_value');
        Route::post('/upload-profile-picture', 'upload_profile_picture')->name('upload.profile.picture');
        
        // Dashboard AJAX endpoints
        Route::get('/dashboard/incoming-interests', 'getIncomingInterests')->name('dashboard.incoming.interests');
        Route::get('/dashboard/mutual-matches', 'getMutualMatches')->name('dashboard.mutual.matches');
        Route::get('/dashboard/recent-visitors', 'getRecentVisitors')->name('dashboard.recent.visitors');
        Route::get('/dashboard/today-matches', 'getTodayMatches')->name('dashboard.today.matches');
        Route::get('/dashboard/success-stories', 'getSuccessStories')->name('dashboard.success.stories');
    });
    

    Route::controller(MemberController::class)->group(function () {
        // Password Change
        Route::get('/members/change-password', 'change_password')->name('member.change_password');
        Route::post('/member/password-update/{id}', 'password_update')->name('member.password_update');
        Route::get('/profile-settings', 'profile_settings')->name('profile_settings');
        
        // Account deacticvation & deletation
        Route::post('/member/account-activation', 'update_account_deactivation_status')->name('member.account_deactivation');
        Route::post('/member/account-delete', 'account_delete')->name('member.account_delete');
    });
    

    Route::get('/package-payment-methods/{id}', [PackageController::class, 'package_payemnt_methods'])->name('package_payment_methods');
    Route::controller(PackagePaymentController::class)->group(function () {
        Route::post('/package-payment', 'store')->name('package.payment');
        Route::get('/package-purchase-history', 'package_purchase_history')->name('package_purchase_history');
    });
    
    // Gallery Image
    Route::resource('/gallery-image', GalleryImageController::class);
    Route::get('/gallery_image/destroy/{id}', [GalleryImageController::class, 'destroy'])->name('gallery_image.destroy');
    // Redirect create to index since we merged the functionality
    Route::get('/gallery-image/create', function() {
        return redirect()->route('gallery-image.index');
    });

    // Express Interest
    Route::resource('/express-interest', ExpressInterestController::class);
    Route::controller(ExpressInterestController::class)->group(function () {
        Route::get('/my-interests', 'index')->name('my_interests.index');
        Route::get('/interest/requests', 'interest_requests')->name('interest_requests');
        Route::post('/interest/accept', 'accept_interest')->name('accept_interest');
        Route::post('/interest/reject', 'reject_interest')->name('reject_interest');
        Route::post('/interest/accept-all', 'accept_all_interests')->name('express_interest.accept_all');
        Route::post('/interest/reject-all', 'reject_all_interests')->name('express_interest.reject_all');
    });

    // Chat
    Route::controller(ChatController::class)->group(function () {
        Route::get('/chat', 'index')->name('all.messages');
        Route::get('/single-chat/{id}', 'chat_view')->name('chat_view');
        Route::post('/chat-reply', 'chat_reply')->name('chat.reply');
        Route::get('/chat/refresh/{id}', 'chat_refresh')->name('chat_refresh');
        Route::post('/chat/old-messages', 'get_old_messages')->name('get-old-message');
    });
    
    // ShortList list, Add, Remove
    Route::controller(ShortlistController::class)->group(function () {
        Route::get('/my-shortlists', 'index')->name('my_shortlists');
        Route::post('/member/add-to-shortlist', 'create')->name('member.add_to_shortlist');
        Route::post('/member/remove-from-shortlist', 'remove')->name('member.remove_from_shortlist');
    });
    
    // Ignore list, Add, Remove
    Route::controller(IgnoredUserController::class)->group(function () {
        Route::get('/ignored-list', 'index')->name('my_ignored_list');
        Route::post('/member/add-to-ignore-list', 'add_to_ignore_list')->name('member.add_to_ignore_list');
        Route::post('/member/remove-from-ignored-list', 'remove_from_ignored_list')->name('member.remove_from_ignored_list');
    });

    // Profile_picture view request 
    Route::resource('/profile-picture-view-request', ViewProfilePictureController::class);
    Route::controller(ViewProfilePictureController::class)->group(function () {
        Route::post('/profile-picture-view-request/accept', 'accept_request')->name('profile_picture_view_request_accept');
        Route::post('/profile-picture-view-request/reject', 'reject_request')->name('profile_picture_view_request_reject');
    });


    // Gallery Image View Request
    Route::resource('/gallery-image-view-request', ViewGalleryImageController::class);
    Route::controller(ViewGalleryImageController::class)->group(function () {
        Route::post('/gallery-image-view-request/accept', 'accept_request')->name('gallery_image_view_request_accept');
        Route::post('/gallery-image-view-request/reject', 'reject_request')->name('gallery_image_view_request_reject');
    });
    

    Route::resource('reportusers', ReportedUserController::class);
    Route::resource('view_contacts', ViewContactController::class);

    // Wallet
    Route::controller(WalletController::class)->group(function () {
        Route::get('/wallet', 'index')->name('wallet.index');
        Route::get('/wallet-recharge-methods', 'wallet_recharge_methods')->name('wallet.recharge_methods');
        Route::post('/recharge', 'recharge')->name('wallet.recharge');
    });

    Route::get('/member/notifications', [NotificationController::class, 'frontend_notify_listing'])->name('frontend.notifications');

    Route::controller(HappyStoryController::class)->group(function () {
        Route::get('/happy-story', 'create')->name('happy_story.member');
        Route::post('/happy-story/store', 'store')->name('happy_story.store');
        Route::get('/story_details/{id}', 'story_details')->name('story_details');

    });

    Route::resource('profile-viewers', ProfileViewerController::class);
    Route::get('/matched-profiles',[ProfileMatchController::class, 'myMatchedProfiles'])->name('my_matched_profiles');
});

Route::get('/registration-success', function() {
    return view('frontend.registration_success');
})->name('registration.success')->middleware('auth');

Route::get('/run-manual-migration', function () {
    try {
        if (!Schema::hasColumn('members', 'medical_license_number')) {
            Schema::table('members', function (Illuminate\Database\Schema\Blueprint $table) {
                $table->string('medical_license_number')->nullable()->after('introduction');
            });
            echo "Added medical_license_number<br>";
        }
        if (!Schema::hasColumn('members', 'specialization')) {
            Schema::table('members', function (Illuminate\Database\Schema\Blueprint $table) {
                $table->string('specialization')->nullable()->after('medical_license_number');
            });
            echo "Added specialization<br>";
        }
        if (!Schema::hasColumn('members', 'verification_document')) {
            Schema::table('members', function (Illuminate\Database\Schema\Blueprint $table) {
                $table->string('verification_document')->nullable()->after('specialization');
            });
            echo "Added verification_document<br>";
        }
        return "Migration checks completed.";
    } catch (\Exception $e) {
        return "Error: " . $e->getMessage();
    }
});

Route::group(['middleware' => ['auth']], function () {

    // member info edit
    Route::controller(MemberController::class)->group(function () {
        Route::post('/members/introduction_update/{id}', 'introduction_update')->name('member.introduction.update');
        Route::post('/members/basic_info_update/{id}', 'basic_info_update')->name('member.basic_info_update');
        Route::post('/members/language_info_update/{id}', 'language_info_update')->name('member.language_info_update');
    });
   

    Route::resource('/address', AddressController::class);

    // Member education
    Route::resource('/education', EducationController::class)->names([
        'create' => 'education.resource.create',
        'edit' => 'education.resource.edit',
        'destroy' => 'education.resource.destroy',
    ]);
    Route::controller(EducationController::class)->group(function () {
        Route::post('/education/create', 'create')->name('education.create');
        Route::post('/education/edit', 'edit')->name('education.edit');
        Route::post('/education/update_education_present_status', 'update_education_present_status')->name('education.update_education_present_status');
        Route::post('/education/update-highest-degree', 'updateHighestDegree')->name('education.update_highest_degree');
        
        Route::get('/education/destroy/{id}', 'destroy')->name('education.destroy');
    });


    // Member Career
    Route::resource('/career', CareerController::class)->names([
        'create' => 'career.resource.create',
        'edit' => 'career.resource.edit',
        'destroy' => 'career.resource.destroy',
    ]);
    Route::controller(CareerController::class)->group(function () {
        Route::post('/career/create', 'create')->name('career.create');
        Route::post('/career/edit', 'edit')->name('career.edit');
        Route::post('/career/update_career_present_status', 'update_career_present_status')->name('career.update_career_present_status');
        Route::get('/career/destroy/{id}', 'destroy')->name('career.destroy');
    });

    Route::resource('/physical-attribute', PhysicalAttributeController::class);
    Route::resource('/hobbies', HobbyController::class);
    Route::resource('/attitudes', AttitudeController::class);
    Route::resource('/recidencies', RecidencyController::class);
    Route::resource('/lifestyles', LifestyleController::class);
    Route::resource('/astrologies', AstrologyController::class);
    Route::resource('/families', FamilyController::class);
    Route::resource('/spiritual_backgrounds', SpiritualBackgroundController::class);
    Route::resource('/partner_expectations', PartnerExpectationController::class);
    Route::post('/additional-member-info/update', [AdditionalMemberInfoController::class, 'update'])->name('additional_member_info.update');

    Route::post('/states/get_state_by_country', [StateController::class, 'get_state_by_country'])->name('states.get_state_by_country');
    Route::post('/cities/get_cities_by_state', [CityController::class, 'get_cities_by_state'])->name('cities.get_cities_by_state');
    Route::post('/castes/get_caste_by_religion', [CasteController::class, 'get_caste_by_religion'])->name('castes.get_caste_by_religion');
    Route::post('/sub-castes/get_sub_castes_by_religion', [SubCasteController::class, 'get_sub_castes_by_religion'])->name('sub_castes.get_sub_castes_by_religion');

    Route::get('/package-payment-invoice/{id}', [PackagePaymentController::class, 'package_payment_invoice'])->name('package_payment.invoice');

    Route::controller(NotificationController::class)->group(function () {
        Route::get('/notification-view/{id}', 'notification_view')->name('notification_view');
        Route::get('/notification/mark-all-as-read', 'mark_all_as_read')->name('notification.mark_all_as_read');
    });
    
});

// Contact Us page
Route::controller(ContactUsController::class)->group(function () {
    Route::get('/contact-us/page', 'show_contact_us_page')->name('contact_us');
    Route::post('/contact-us', 'store')->name('contact-us.store');
});

// Payment gateway Redirect

//Paypal START
Route::get('/paypal/payment/done', 'PaypalController@getDone')->name('payment.done');
Route::get('/paypal/payment/cancel', 'PaypalController@getCancel')->name('payment.cancel');
//Paypal END

//amarpay

Route::post('/aamarpay/success', 'AamarpayController@success')->name('aamarpay.success');
Route::post('/aamarpay/fail', 'AamarpayController@fail')->name('aamarpay.fail');

// SSLCOMMERZ Start
Route::get('/sslcommerz/pay', 'SslcommerzController@index');
Route::any('/sslcommerz/success', 'SslcommerzController@success')->name('sslcommerz.success');
Route::any('/sslcommerz/fail', 'SslcommerzController@fail');
Route::any('/sslcommerz/cancel', 'SslcommerzController@cancel');
Route::post('/sslcommerz/ipn', 'SslcommerzController@ipn');


Route::get('/instamojo/payment/pay-success', 'InstamojoController@success')->name('instamojo.success');
Route::post('rozer/payment/pay-success', 'RazorpayController@payment')->name('payment.rozer');
Route::get('/paystack/payment/callback', 'PaystackController@handleGatewayCallback');

//Stipe Start
Route::controller(StripeController::class)->group(function () {
    Route::get('stripe', 'stripe');
    Route::post('/stripe/create-checkout-session', 'create_checkout_session')->name('stripe.get_token');
    Route::any('/stripe/payment/callback', 'callback')->name('stripe.callback');
    Route::get('/stripe/success', 'success')->name('stripe.success');
    Route::get('/stripe/cancel', 'cancel')->name('stripe.cancel');
});
//Stripe END

//Paytm
Route::get('/paytm/index', 'PaytmController@index');
Route::post('/paytm/callback', 'PaytmController@callback')->name('paytm.callback');

// phonepe
Route::controller(PhonepeController::class)->group(function () {
    Route::any('/phonepe/pay', 'pay')->name('phonepe.pay');
    Route::any('/phonepe/redirecturl', 'phonepe_redirecturl')->name('phonepe.redirecturl');
    Route::any('/phonepe/callbackUrl', 'phonepe_callbackUrl')->name('phonepe.callbackUrl');
});

Route::get('/customer-products/admin', 'HomeController@profile_edit')->name('profile.edit');
Route::get('/check_for_package_invalid', 'PackageController@check_for_package_invalid')->name('member.check_for_package_invalid');

Route::get('/match_profiles', 'ProfileMatchController@match_profiles')->name('match_profiles');
Route::get('/migrate/products/', 'ProfileMatchController@migrate_profiles');



//Custom page
Route::get('/admin-react/{any?}', function () {
    $path = public_path('admin-panel/index.html');
    if (!file_exists($path)) {
        abort(404, 'Admin React build not found. Please run npm run build in Admin Panel Frontend.');
    }

    return response()->file($path);
})->where('any', '.*');

Route::get('/{slug}', 'PageController@show_custom_page')->name('custom-pages.show_custom_page');
