<?php

namespace App\Services;

use App\Models\Referral;
use App\Models\ReferralAuditLog;
use App\Models\ReferralCode;
use App\Models\ReferralReward;
use App\Models\ReferralRule;
use App\Models\ReferralSetting;
use App\Models\Wallet;
use App\Models\User;
use App\Models\Member;
use App\Models\Package;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class ReferralService
{
    /**
     * Normalize a referral code for lookup.
     */
    public function normalizeReferralCode(?string $referralCode): ?string
    {
        if ($referralCode === null) {
            return null;
        }

        $normalized = strtoupper(trim(preg_replace('/\s+/', '', $referralCode)));

        return $normalized !== '' ? $normalized : null;
    }

    /**
     * Resolve a referral code to its active record.
     */
    public function resolveReferralCode(?string $referralCode): ?ReferralCode
    {
        $normalized = $this->normalizeReferralCode($referralCode);

        if (!$normalized) {
            return null;
        }

        return ReferralCode::where('code', $normalized)
            ->where('status', 'active')
            ->first();
    }

    /**
     * Create a referral record when a new user registers with a referral code
     */
    public function createReferral($referredUserId, $referralCodeString, $source = 'link', $metadata = [])
    {
        $settings = ReferralSetting::instance();

        if (!$settings->referral_enabled) {
            Log::info("Referral system disabled. Skipping referral for user {$referredUserId}");
            return ['success' => false, 'message' => 'Referral system is currently disabled'];
        }

        $referredUser = User::find($referredUserId);
        if (!$referredUser) {
            return ['success' => false, 'message' => 'Referred user not found'];
        }

        $referralCode = $this->resolveReferralCode($referralCodeString);

        if (!$referralCode) {
            Log::warning("Invalid referral code: {$referralCodeString}");
            return ['success' => false, 'message' => 'Invalid or inactive referral code'];
        }

        $referrerUserId = $referralCode->user_id;

        // Block self-referral
        if ($referrerUserId == $referredUserId) {
            Log::warning("Self-referral attempt blocked. User: {$referredUserId}");
            return ['success' => false, 'message' => 'Self-referral is not allowed'];
        }

        $existingReferral = Referral::where('referred_user_id', $referredUserId)->first();
        if ($existingReferral) {
            if ((int) $existingReferral->referral_code_id === (int) $referralCode->id || (int) $existingReferral->referrer_user_id === (int) $referrerUserId) {
                $this->syncLegacyReferralState($referredUser, $referrerUserId);
                $this->checkAndQualifyReferral($referredUserId);

                return ['success' => true, 'referral' => $existingReferral, 'message' => 'Referral already exists'];
            }

            Log::warning("User {$referredUserId} already has a referral record");
            return ['success' => false, 'message' => 'User has already been referred'];
        }

        // Anti-fraud checks
        $fraudCheck = $this->performAntiFraudChecks($referrerUserId, $referredUserId, $metadata, $settings);
        if (!$fraudCheck['passed']) {
            Log::warning("Anti-fraud check failed for referral: {$fraudCheck['reason']}");
            return ['success' => false, 'message' => $fraudCheck['reason']];
        }

        // Block same email domain if enabled
        if ($settings->getAntiFraudSetting('block_same_email_domain', false)) {
            $referrer = User::find($referrerUserId);
            $referred = User::find($referredUserId);
            if ($referrer && $referred && $referrer->email && $referred->email) {
                $referrerDomain = substr(strrchr($referrer->email, "@"), 1);
                $referredDomain = substr(strrchr($referred->email, "@"), 1);
                $commonDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com'];
                if ($referrerDomain === $referredDomain && !in_array(strtolower($referrerDomain), $commonDomains)) {
                    return ['success' => false, 'message' => 'Referrals from same email domain are restricted'];
                }
            }
        }

        $referral = DB::transaction(function () use ($referrerUserId, $referredUserId, $referralCode, $source, $metadata, $referredUser) {
            $lockedExisting = Referral::where('referred_user_id', $referredUserId)
                ->lockForUpdate()
                ->first();

            if ($lockedExisting) {
                return $lockedExisting;
            }

            $referral = Referral::create([
                'referrer_user_id' => $referrerUserId,
                'referred_user_id' => $referredUserId,
                'referral_code_id' => $referralCode->id,
                'source' => $source,
                'status' => 'pending',
                'metadata' => array_merge($metadata, [
                    'ip_hash' => isset($metadata['ip']) ? hash('sha256', $metadata['ip']) : null,
                    'user_agent' => $metadata['user_agent'] ?? null,
                    'created_timestamp' => now()->toISOString(),
                ]),
            ]);

            $this->syncLegacyReferralState($referredUser, $referrerUserId);

            ReferralAuditLog::log('system', null, 'referral_created', 'referral', $referral->id, null, [
                'referrer_user_id' => $referrerUserId,
                'referred_user_id' => $referredUserId,
                'code' => $referralCode->code,
                'source' => $source,
            ]);

            Log::info("Referral created: #{$referral->id} referrer={$referrerUserId} referred={$referredUserId}");

            return $referral;
        });

        if ($referral instanceof Referral) {
            $this->notifyReferrer($referrerUserId, 'new_signup', [
                'referral_id' => $referral->id,
                'code' => $referralCode->code,
                'source' => $source,
            ]);

            $this->checkAndQualifyReferral($referredUserId);
        }

        return ['success' => true, 'referral' => $referral];
    }

    /**
     * Apply the stored legacy referral link to the canonical referral tables.
     */
    protected function syncLegacyReferralState(User $referredUser, int $referrerUserId): void
    {
        if ((int) $referredUser->referred_by !== (int) $referrerUserId) {
            $referredUser->referred_by = $referrerUserId;
            $referredUser->save();
        }
    }

    /**
     * Award the legacy package-purchase commission once per referred user.
     */
    public function applyReferralCommissionIfEligible(User $user, ?float $commissionAmount = null): array
    {
        if (!addon_activation('referral_system')) {
            return ['success' => false, 'message' => 'Referral system is disabled'];
        }

        if (empty($user->referred_by) || (int) $user->referral_comission === 1) {
            return ['success' => false, 'message' => 'Referral commission already handled'];
        }

        $referrer = User::find($user->referred_by);
        if (!$referrer) {
            return ['success' => false, 'message' => 'Referrer not found'];
        }

        $amount = $commissionAmount ?? (float) get_setting('referred_by_user_commission');
        if ($amount <= 0) {
            return ['success' => false, 'message' => 'Referral commission amount is not configured'];
        }

        return DB::transaction(function () use ($user, $referrer, $amount) {
            $wallet = Wallet::create([
                'user_id' => $referrer->id,
                'amount' => $amount,
                'payment_method' => 'reffered_commission',
                'payment_details' => '',
                'referral_user' => $user->id,
            ]);

            $referrer->balance = (float) ($referrer->balance ?? 0) + $amount;
            $referrer->save();

            $user->referral_comission = 1;
            $user->save();

            ReferralAuditLog::log('system', null, 'referral_commission_applied', 'wallet', $wallet->id, null, [
                'referrer_user_id' => $referrer->id,
                'referred_user_id' => $user->id,
                'amount' => $amount,
            ]);

            return ['success' => true, 'wallet' => $wallet];
        });
    }

    /**
     * Process all pending referrals and qualify any that now satisfy the active rules.
     */
    public function processPendingReferrals(): int
    {
        $processed = 0;

        Referral::where('status', 'pending')
            ->orderBy('id')
            ->chunkById(100, function ($referrals) use (&$processed) {
                foreach ($referrals as $referral) {
                    $this->checkAndQualifyReferral($referral->referred_user_id);
                    $processed++;
                }
            });

        return $processed;
    }

    /**
     * Backfill legacy users.referred_by values into the canonical referrals table.
     */
    public function backfillLegacyReferrals(): int
    {
        $count = 0;

        User::whereNotNull('referred_by')
            ->orderBy('id')
            ->chunkById(100, function ($users) use (&$count) {
                foreach ($users as $user) {
                    $referrer = User::find($user->referred_by);
                    if (!$referrer) {
                        continue;
                    }

                    $referrerCode = ReferralCode::where('user_id', $referrer->id)->where('status', 'active')->first();
                    if (!$referrerCode) {
                        $referrerCode = ReferralCode::getOrCreateForUser($referrer->id);
                    }

                    $result = $this->createReferral($user->id, $referrerCode->code, 'link', [
                        'backfilled' => true,
                    ]);

                    if (!empty($result['success'])) {
                        $count++;
                    }
                }
            });

        return $count;
    }

    /**
     * Check if a referred user qualifies based on active rules
     * Called after user lifecycle events (email verified, phone verified, etc.)
     */
    public function checkAndQualifyReferral($referredUserId)
    {
        $settings = ReferralSetting::instance();
        if (!$settings->referral_enabled) {
            return;
        }

        $referral = Referral::where('referred_user_id', $referredUserId)
            ->where('status', 'pending')
            ->first();

        if (!$referral) {
            return;
        }

        $rules = ReferralRule::active()->get();
        if ($rules->isEmpty() && $settings->default_rule_id) {
            $defaultRule = ReferralRule::find($settings->default_rule_id);
            if ($defaultRule) {
                $rules = collect([$defaultRule]);
            }
        }

        $referred = User::find($referredUserId);
        if (!$referred) {
            return;
        }

        foreach ($rules as $rule) {
            if ($this->isQualified($referred, $rule)) {
                DB::transaction(function () use ($referral, $rule) {
                    // Lock the row to prevent double qualification
                    $lockedReferral = Referral::where('id', $referral->id)
                        ->where('status', 'pending')
                        ->lockForUpdate()
                        ->first();

                    if (!$lockedReferral) {
                        return; // Already processed
                    }

                    $lockedReferral->markAsQualified();

                    ReferralAuditLog::log('system', null, 'referral_qualified', 'referral', $lockedReferral->id, [
                        'status' => 'pending',
                    ], [
                        'status' => 'qualified',
                        'rule_id' => $rule->id,
                    ]);

                    // Check if referrer should get a reward
                    $this->checkAndApplyReward($lockedReferral->referrer_user_id, $rule);
                });

                break; // Only qualify once
            }
        }
    }

    /**
     * Check if a user meets qualification criteria
     */
    protected function isQualified(User $user, ReferralRule $rule)
    {
        switch ($rule->qualification_mode) {
            case 'registration_only':
                return true;

            case 'email_verified':
                return $user->email_verified_at !== null;

            case 'phone_verified':
                return $user->isPhoneVerified();

            case 'email_and_phone_verified':
                return $user->email_verified_at !== null && $user->isPhoneVerified();

            case 'paid_subscription':
                $member = $user->member;
                if (!$member) return false;
                return $member->current_package_id && $member->current_package_id > 1;

            case 'active_days':
                $days = $rule->qualification_params['active_days'] ?? 7;
                return $user->created_at && $user->created_at->copy()->addDays($days)->isPast();

            case 'identity_verified':
                return (int) $user->approved === 1 && !empty($user->verification_info);

            default:
                return $user->email_verified_at !== null;
        }
    }

    /**
     * Check if referrer has earned a reward and apply it
     */
    public function checkAndApplyReward($referrerUserId, ReferralRule $rule)
    {
        $qualifiedCount = Referral::where('referrer_user_id', $referrerUserId)
            ->where('status', 'qualified')
            ->count();

        $threshold = $rule->trigger_threshold;

        if ($qualifiedCount < $threshold) {
            return; // Not enough referrals yet
        }

        // Calculate milestone (which reward tier this is)
        $milestone = floor($qualifiedCount / $threshold);

        // Check per-user limit
        $existingRewardCount = ReferralReward::where('user_id', $referrerUserId)
            ->where('rule_id', $rule->id)
            ->whereIn('status', ['applied', 'pending'])
            ->count();

        switch ($rule->per_user_limit) {
            case 'once':
                if ($existingRewardCount >= 1) {
                    return;
                }
                break;
            case 'monthly':
                $recentReward = ReferralReward::where('user_id', $referrerUserId)
                    ->where('rule_id', $rule->id)
                    ->whereIn('status', ['applied', 'pending'])
                    ->where('created_at', '>=', now()->startOfMonth())
                    ->exists();
                if ($recentReward) {
                    return;
                }
                break;
            case 'unlimited':
                // No limit
                break;
        }

        // Generate idempotency key
        $idempotencyKey = ReferralReward::generateIdempotencyKey($rule->id, $referrerUserId, $milestone);

        // Check idempotency
        if (ReferralReward::where('idempotency_key', $idempotencyKey)->exists()) {
            Log::info("Reward already exists for idempotency key: {$idempotencyKey}");
            return;
        }

        // Apply reward in transaction
        DB::transaction(function () use ($referrerUserId, $rule, $idempotencyKey) {
            // Create reward record
            $reward = ReferralReward::create([
                'user_id' => $referrerUserId,
                'rule_id' => $rule->id,
                'reward_type' => $rule->reward_type,
                'reward_payload' => $rule->reward_params,
                'status' => 'pending',
                'idempotency_key' => $idempotencyKey,
            ]);

            // Apply the reward
            try {
                $this->applyReward($reward, $rule);
                $reward->markAsApplied();

                ReferralAuditLog::log('system', null, 'reward_applied', 'referral_reward', $reward->id, null, [
                    'user_id' => $referrerUserId,
                    'rule_id' => $rule->id,
                    'reward_type' => $rule->reward_type,
                    'reward_params' => $rule->reward_params,
                ]);

                Log::info("Referral reward #{$reward->id} applied for user {$referrerUserId}");

                // Send notification to referrer
                $this->notifyReferrer($referrerUserId, 'upgrade_applied', [
                    'rule_name' => $rule->name,
                    'reward_type' => $rule->reward_type,
                ]);

            } catch (\Exception $e) {
                $reward->markAsFailed($e->getMessage());
                Log::error("Failed to apply referral reward #{$reward->id}: " . $e->getMessage());
            }
        });
    }

    /**
     * Apply the actual reward (package upgrade)
     */
    protected function applyReward(ReferralReward $reward, ReferralRule $rule)
    {
        if ($rule->reward_type !== 'package_upgrade') {
            throw new \Exception("Unsupported reward type: {$rule->reward_type}");
        }

        $targetPackageId = $rule->getTargetPackageId();
        $package = Package::find($targetPackageId);

        if (!$package) {
            throw new \Exception("Target package not found: {$targetPackageId}");
        }

        $member = Member::where('user_id', $reward->user_id)->first();
        if (!$member) {
            throw new \Exception("Member not found for user: {$reward->user_id}");
        }

        $previousPackageId = $member->current_package_id;
        $durationDays = $rule->getUpgradeDurationDays();

        // Update member package
        $member->current_package_id = $package->id;
        $member->remaining_interest = $package->express_interest;
        $member->remaining_contact_view = $package->contact;
        $member->remaining_photo_gallery = $package->photo_gallery;
        $member->remaining_profile_image_view = $package->profile_image_view;
        $member->remaining_gallery_image_view = $package->gallery_image_view;
        $member->auto_profile_match = $package->auto_profile_match;
        $member->package_validity = date('Y-m-d', strtotime("+{$durationDays} days"));
        $member->save();

        // Update reward payload with applied details
        $payload = $reward->reward_payload ?? [];
        $payload['previous_package_id'] = $previousPackageId;
        $payload['applied_package_id'] = $package->id;
        $payload['applied_duration_days'] = $durationDays;
        $payload['package_validity'] = $member->package_validity;
        $reward->reward_payload = $payload;
        $reward->save();

        Log::info("Package upgrade applied: user={$reward->user_id}, from package {$previousPackageId} to {$package->id}");
    }

    /**
     * Anti-fraud checks
     */
    protected function performAntiFraudChecks($referrerUserId, $referredUserId, $metadata, ReferralSetting $settings)
    {
        $antifraud = $settings->anti_fraud_settings ?? [];

        // Check IP rate limit
        $maxPerIpPerDay = $antifraud['max_referrals_per_ip_per_day'] ?? 5;
        if (isset($metadata['ip'])) {
            $ipHash = hash('sha256', $metadata['ip']);
            $todayIpCount = Referral::where('created_at', '>=', now()->startOfDay())
                ->whereJsonContains('metadata->ip_hash', $ipHash)
                ->count();

            if ($todayIpCount >= $maxPerIpPerDay) {
                return ['passed' => false, 'reason' => 'Too many referrals from this IP address today'];
            }
        }

        // Check cooldown
        $cooldownMinutes = $antifraud['cooldown_minutes'] ?? 10;
        $recentReferral = Referral::where('referrer_user_id', $referrerUserId)
            ->where('created_at', '>=', now()->subMinutes($cooldownMinutes))
            ->exists();

        if ($recentReferral) {
            return ['passed' => false, 'reason' => "Please wait {$cooldownMinutes} minutes between referrals"];
        }

        // Check if referrer and referred share phone/email
        $referrer = User::find($referrerUserId);
        $referred = User::find($referredUserId);

        if ($referrer && $referred) {
            if ($referrer->phone && $referred->phone && $referrer->phone === $referred->phone) {
                return ['passed' => false, 'reason' => 'Referrer and referred user share the same phone number'];
            }
        }

        return ['passed' => true];
    }

    /**
     * Get referral stats for a user
     */
    public function getUserReferralStats($userId)
    {
        $referralCode = ReferralCode::getOrCreateForUser($userId);

        $totalReferred = Referral::where('referrer_user_id', $userId)->count();
        $qualifiedCount = Referral::where('referrer_user_id', $userId)->where('status', 'qualified')->count();
        $pendingCount = Referral::where('referrer_user_id', $userId)->where('status', 'pending')->count();

        $settings = ReferralSetting::instance();
        $activeRule = $settings->defaultRule ?? ReferralRule::active()->first();

        $threshold = $activeRule ? $activeRule->trigger_threshold : 3;
        $remaining = max(0, $threshold - $qualifiedCount);

        $rewards = ReferralReward::where('user_id', $userId)
            ->orderBy('created_at', 'desc')
            ->get();

        $referrals = Referral::where('referrer_user_id', $userId)
            ->with('referred:id,first_name,last_name,email,created_at')
            ->orderBy('created_at', 'desc')
            ->get();

        return [
            'referral_code' => $referralCode->code,
            'referral_link' => $referralCode->getReferralLink(),
            'code_status' => $referralCode->status,
            'total_referred' => $totalReferred,
            'qualified_count' => $qualifiedCount,
            'pending_count' => $pendingCount,
            'remaining_for_reward' => $remaining,
            'threshold' => $threshold,
            'progress_percentage' => $threshold > 0 ? min(100, round(($qualifiedCount / $threshold) * 100)) : 0,
            'rewards' => $rewards,
            'referrals' => $referrals,
            'rule_name' => $activeRule ? $activeRule->name : null,
        ];
    }

    /**
     * Backfill referral codes for existing users
     */
    public function backfillReferralCodes()
    {
        $settings = ReferralSetting::instance();
        $users = User::whereDoesntHave('referralCode')
            ->where('user_type', 'member')
            ->get();

        $count = 0;
        foreach ($users as $user) {
            ReferralCode::getOrCreateForUser($user->id);
            $count++;
        }

        Log::info("Backfilled referral codes for {$count} users");
        return $count;
    }

    /**
     * Notify referrer about events
     */
    protected function notifyReferrer($userId, $type, $data = [])
    {
        try {
            $user = User::find($userId);
            if (!$user) return;

            $message = '';
            switch ($type) {
                case 'new_signup':
                    $message = translate('Someone signed up using your referral code!');
                    break;
                case 'referral_qualified':
                    $message = translate('One of your referrals has been verified! Keep going!');
                    break;
                case 'upgrade_applied':
                    $ruleName = $data['rule_name'] ?? '';
                    $message = translate('Congratulations! Your package has been upgraded via referral program: ') . $ruleName;
                    break;
            }

            if ($message) {
                $notifyType = 'referral_' . $type;
                $id = null;
                $route = '#';

                \Illuminate\Support\Facades\Notification::send($user, new \App\Notifications\DbStoreNotification(
                    $notifyType, $id, 0, $userId, $message, $route
                ));
            }
        } catch (\Exception $e) {
            Log::error("Failed to send referral notification: " . $e->getMessage());
        }
    }

    /**
     * Admin: invalidate a referral and recalculate rewards
     */
    public function adminInvalidateReferral($referralId, $adminId, $reason = null)
    {
        return DB::transaction(function () use ($referralId, $adminId, $reason) {
            $referral = Referral::findOrFail($referralId);
            $wasQualified = $referral->status === 'qualified';
            $referrerUserId = $referral->referrer_user_id;

            $referral->invalidate($reason);

            ReferralAuditLog::log('admin', $adminId, 'referral_invalidated_by_admin', 'referral', $referralId, [
                'previous_status' => $wasQualified ? 'qualified' : $referral->status,
            ], [
                'status' => 'invalid',
                'reason' => $reason,
            ]);

            // If was qualified, check if any rewards need reversing
            if ($wasQualified) {
                $qualifiedCount = Referral::where('referrer_user_id', $referrerUserId)
                    ->where('status', 'qualified')
                    ->count();

                $rules = ReferralRule::active()->get();
                foreach ($rules as $rule) {
                    if ($qualifiedCount < $rule->trigger_threshold) {
                        // Find and reverse pending rewards for this rule
                        $pendingRewards = ReferralReward::where('user_id', $referrerUserId)
                            ->where('rule_id', $rule->id)
                            ->where('status', 'applied')
                            ->get();

                        // Note: By default, we DON'T auto-reverse applied rewards
                        // Admin must manually reverse if needed
                        // This is logged for admin visibility
                        if ($pendingRewards->count() > 0) {
                            Log::warning("Referral invalidated for user {$referrerUserId}. Qualified count ({$qualifiedCount}) now below threshold ({$rule->trigger_threshold}). Admin may want to review rewards.");
                        }
                    }
                }
            }

            return $referral;
        });
    }

    /**
     * Admin: reverse a reward
     */
    public function adminReverseReward($rewardId, $adminId, $reason = null)
    {
        return DB::transaction(function () use ($rewardId, $adminId, $reason) {
            $reward = ReferralReward::findOrFail($rewardId);

            if ($reward->status !== 'applied') {
                throw new \Exception('Can only reverse applied rewards');
            }

            // Reverse the package upgrade
            if ($reward->reward_type === 'package_upgrade') {
                $payload = $reward->reward_payload ?? [];
                $previousPackageId = $payload['previous_package_id'] ?? 1;
                $previousPackage = Package::find($previousPackageId);

                if ($previousPackage) {
                    $member = Member::where('user_id', $reward->user_id)->first();
                    if ($member) {
                        $member->current_package_id = $previousPackage->id;
                        $member->remaining_interest = $previousPackage->express_interest;
                        $member->remaining_contact_view = $previousPackage->contact;
                        $member->remaining_photo_gallery = $previousPackage->photo_gallery;
                        $member->remaining_profile_image_view = $previousPackage->profile_image_view;
                        $member->remaining_gallery_image_view = $previousPackage->gallery_image_view;
                        $member->auto_profile_match = $previousPackage->auto_profile_match;
                        $member->package_validity = date('Y-m-d', strtotime("+{$previousPackage->validity} days"));
                        $member->save();
                    }
                }
            }

            $reward->reverseReward($adminId, $reason);

            return $reward;
        });
    }

    /**
     * Get admin analytics
     */
    public function getAnalytics($days = 30)
    {
        $startDate = now()->subDays($days);

        return [
            'total_referrals' => Referral::count(),
            'referrals_period' => Referral::where('created_at', '>=', $startDate)->count(),
            'qualified_referrals' => Referral::where('status', 'qualified')->count(),
            'qualified_period' => Referral::where('status', 'qualified')->where('qualified_at', '>=', $startDate)->count(),
            'pending_referrals' => Referral::where('status', 'pending')->count(),
            'invalid_referrals' => Referral::where('status', 'invalid')->count(),
            'total_rewards' => ReferralReward::where('status', 'applied')->count(),
            'rewards_period' => ReferralReward::where('status', 'applied')->where('applied_at', '>=', $startDate)->count(),
            'qualification_rate' => Referral::count() > 0
                ? round((Referral::where('status', 'qualified')->count() / Referral::count()) * 100, 1)
                : 0,
            'top_referrers' => Referral::select('referrer_user_id', DB::raw('COUNT(*) as total_referrals'), DB::raw('SUM(CASE WHEN status = "qualified" THEN 1 ELSE 0 END) as qualified_referrals'))
                ->groupBy('referrer_user_id')
                ->orderByDesc('total_referrals')
                ->limit(10)
                ->get()
                ->map(function ($item) {
                    $user = User::find($item->referrer_user_id);
                    return [
                        'user_id' => $item->referrer_user_id,
                        'name' => $user ? $user->first_name . ' ' . $user->last_name : 'Unknown',
                        'email' => $user ? $user->email : '',
                        'total_referrals' => $item->total_referrals,
                        'qualified_referrals' => $item->qualified_referrals,
                    ];
                }),
            'daily_referrals' => Referral::where('created_at', '>=', $startDate)
                ->select(DB::raw('DATE(created_at) as date'), DB::raw('COUNT(*) as count'))
                ->groupBy('date')
                ->orderBy('date')
                ->get(),
        ];
    }
}
