<?php

/*
|--------------------------------------------------------------------------
| Referral System Routes
|--------------------------------------------------------------------------
|
| Enterprise-grade referral system routes.
| Loaded by RouteServiceProvider with web middleware.
|
*/

use App\Http\Controllers\ReferralController;

// Admin Referral Management Routes
Route::group(['prefix' => 'admin', 'middleware' => ['auth', 'admin']], function () {

    // Dashboard
    Route::get('/referral/dashboard', [ReferralController::class, 'dashboard'])
        ->name('admin.referral.dashboard')
        ->middleware('can:view_referral_dashboard');

    // Settings
    Route::get('/referral/settings', [ReferralController::class, 'settings'])
        ->name('admin.referral.settings')
        ->middleware('can:manage_referral_settings');
    Route::post('/referral/settings', [ReferralController::class, 'updateSettings'])
        ->name('admin.referral.settings.update')
        ->middleware('can:manage_referral_settings');

    // Rules
    Route::get('/referral/rules', [ReferralController::class, 'rules'])
        ->name('admin.referral.rules')
        ->middleware('can:manage_referral_rules');
    Route::post('/referral/rules', [ReferralController::class, 'storeRule'])
        ->name('admin.referral.rules.store')
        ->middleware('can:manage_referral_rules');
    Route::put('/referral/rules/{id}', [ReferralController::class, 'updateRule'])
        ->name('admin.referral.rules.update')
        ->middleware('can:manage_referral_rules');
    Route::delete('/referral/rules/{id}', [ReferralController::class, 'destroyRule'])
        ->name('admin.referral.rules.destroy')
        ->middleware('can:manage_referral_rules');

    // Referrals List
    Route::get('/referral/referrals', [ReferralController::class, 'referrals'])
        ->name('admin.referral.referrals')
        ->middleware('can:view_referral_dashboard');
    Route::post('/referral/referrals/{id}/invalidate', [ReferralController::class, 'invalidateReferral'])
        ->name('admin.referral.referrals.invalidate')
        ->middleware('can:manage_referral_rules');

    // Rewards
    Route::get('/referral/rewards', [ReferralController::class, 'rewards'])
        ->name('admin.referral.rewards')
        ->middleware('can:view_referral_dashboard');
    Route::post('/referral/rewards/{id}/reverse', [ReferralController::class, 'reverseReward'])
        ->name('admin.referral.rewards.reverse')
        ->middleware('can:reverse_referral_reward');

    // Audit Logs
    Route::get('/referral/audit-logs', [ReferralController::class, 'auditLogs'])
        ->name('admin.referral.audit_logs')
        ->middleware('can:view_referral_audit_logs');

    // Backfill
    Route::post('/referral/backfill-codes', [ReferralController::class, 'backfillCodes'])
        ->name('admin.referral.backfill')
        ->middleware('can:manage_referral_settings');
});
