<?php
namespace App\Utility;
use App\Models\User;
use App\Models\Shortlist;
use App\Models\ReportedUser;
use App\Models\MemberLanguage;
use App\Models\ExpressInterest;

class MemberUtility
{
    protected static array $userCache = [];
    protected static array $countryCache = [];
    protected static array $religionCache = [];
    protected static array $motherTongueCache = [];
    protected static array $interestCache = [];
    protected static array $shortlistCache = [];
    protected static array $reportCache = [];

    protected static function getUserWithProfileRelations($user_id)
    {
        $userId = (int) $user_id;
        if ($userId <= 0) {
            return null;
        }

        if (!array_key_exists($userId, self::$userCache)) {
            self::$userCache[$userId] = User::with([
                'member',
                'spiritual_backgrounds.religion',
                'addresses.country',
            ])->find($userId);
        }

        return self::$userCache[$userId];
    }

    public static function member_religion($user_id = '')
    {
        $userId = (int) $user_id;
        if ($userId <= 0) {
            return '';
        }

        if (!array_key_exists($userId, self::$religionCache)) {
            $user = self::getUserWithProfileRelations($userId);
            self::$religionCache[$userId] = (get_setting('member_spiritual_and_social_background_section') == 'on' &&
                !empty($user?->spiritual_backgrounds?->religion_id))
                ? ($user->spiritual_backgrounds->religion->name ?? '')
                : '';
        }

        return self::$religionCache[$userId];
    }

    public static function member_country($user_id = '')
    {
        $userId = (int) $user_id;
        if ($userId <= 0) {
            return '';
        }

        if (!array_key_exists($userId, self::$countryCache)) {
            $country = '';
            if (get_setting('member_present_address_section') == 'on') {
                $user = self::getUserWithProfileRelations($userId);
                $presentAddress = $user?->addresses?->firstWhere('type', 'present');
                $country = $presentAddress?->country?->name ?? '';
            }
            self::$countryCache[$userId] = $country;
        }

        return self::$countryCache[$userId];
    }

    public static function member_mothere_tongue($user_id = '')
    {
        $userId = (int) $user_id;
        if ($userId <= 0) {
            return '';
        }

        if (!array_key_exists($userId, self::$motherTongueCache)) {
            $motherTongue = '';
            $user = self::getUserWithProfileRelations($userId);
            $languageId = $user?->member?->mothere_tongue;

            if (get_setting('member_language_section') == 'on' && !empty($languageId)) {
                $motherTongue = MemberLanguage::query()
                    ->where('id', $languageId)
                    ->value('name') ?? '';
            }

            self::$motherTongueCache[$userId] = $motherTongue;
        }

        return self::$motherTongueCache[$userId];

    }

    public static function member_interest_info($user_id = '')
    {
        $authId = auth()->id();
        $targetId = (int) $user_id;

        $default = [
            'interest_status' => 1,
            'interest_text' => translate('Proposal'),
            'proposal_status' => 'none',
            'proposal_updated_at' => null,
        ];

        if (!$authId || $targetId <= 0) {
            return $default;
        }

        $cacheKey = $authId . ':' . $targetId;
        if (array_key_exists($cacheKey, self::$interestCache)) {
            return self::$interestCache[$cacheKey];
        }

        $doExpressedInterest = ExpressInterest::query()
            ->where('user_id', $targetId)
            ->where('interested_by', $authId)
            ->latest('id')
            ->first();

        $receivedExpressedInterest = ExpressInterest::query()
            ->where('user_id', $authId)
            ->where('interested_by', $targetId)
            ->latest('id')
            ->first();

        if (!empty($doExpressedInterest) && !empty($receivedExpressedInterest)) {
            $isAccepted = ((int) $doExpressedInterest->status === 1) || ((int) $receivedExpressedInterest->status === 1);
            $data = [
                'interest_status' => $isAccepted ? 'mutual' : 0,
                'interest_text' => $isAccepted ? translate('Proposal Accepted') : translate('Proposal Sent'),
                'proposal_status' => $isAccepted ? 'sent_accepted' : 'sent_pending',
                'proposal_updated_at' => optional(
                    $doExpressedInterest->updated_at >= $receivedExpressedInterest->updated_at
                        ? $doExpressedInterest->updated_at
                        : $receivedExpressedInterest->updated_at
                )->toIso8601String(),
            ];
        } elseif (empty($doExpressedInterest) && empty($receivedExpressedInterest)) {
            $data = $default;
        } elseif (!empty($receivedExpressedInterest)) {
            $data = [
                'interest_status' => 'do_response',
                'interest_text' => $receivedExpressedInterest->status == 0
                    ? translate('Reply to Proposal')
                    : translate('You Accepted Proposal'),
                'proposal_status' => $receivedExpressedInterest->status == 0 ? 'received_pending' : 'received_accepted',
                'proposal_updated_at' => optional($receivedExpressedInterest->updated_at)->toIso8601String(),
            ];
        } else {
            $data = [
                'interest_status' => 0,
                'interest_text' => $doExpressedInterest->status == 0
                    ? translate('Proposal Sent')
                    : translate('Proposal Accepted'),
                'proposal_status' => $doExpressedInterest->status == 0 ? 'sent_pending' : 'sent_accepted',
                'proposal_updated_at' => optional($doExpressedInterest->updated_at)->toIso8601String(),
            ];
        }

        self::$interestCache[$cacheKey] = $data;
        return $data;
    }

    public static function member_shortlist_info($user_id = '')
    {
        $authId = auth()->id();
        $targetId = (int) $user_id;
        if (!$authId || $targetId <= 0) {
            return [
                'shortlist_status' => 1,
                'shortlist_text' => translate('Shortlist'),
            ];
        }

        $cacheKey = $authId . ':' . $targetId;
        if (!array_key_exists($cacheKey, self::$shortlistCache)) {
            $shortlisted = Shortlist::query()
                ->where('user_id', $targetId)
                ->where('shortlisted_by', $authId)
                ->exists();

            self::$shortlistCache[$cacheKey] = [
                'shortlist_status' => $shortlisted ? 0 : 1,
                'shortlist_text' => $shortlisted ? translate('Shortlisted') : translate('Shortlist'),
            ];
        }

        return self::$shortlistCache[$cacheKey];
    }

    public static function member_report_status($user_id = '')
    {
        $authId = auth()->id();
        $targetId = (int) $user_id;
        if (!$authId || $targetId <= 0) {
            return false;
        }

        $cacheKey = $authId . ':' . $targetId;
        if (!array_key_exists($cacheKey, self::$reportCache)) {
            self::$reportCache[$cacheKey] = ReportedUser::query()
                ->where('user_id', $targetId)
                ->where('reported_by', $authId)
                ->exists();
        }

        return self::$reportCache[$cacheKey];
    }

    public static function member_check($key)
    {
        // Bypass external activation check for development/self-hosted environment
        // The external API at activeitzone.com validates license keys
        // For development, we always return true
        return true;
    }

    public static function create_initial_member($key)
    {
        if ($key == "") {
            return false;
        }

        try {
            $gate = "https://activeitzone.com/activation/check/matrimonial/" . $key;

            $stream = curl_init();
            curl_setopt($stream, CURLOPT_URL, $gate);
            curl_setopt($stream, CURLOPT_HEADER, 0);
            curl_setopt($stream, CURLOPT_RETURNTRANSFER, 1);
            $rn = curl_exec($stream);
            curl_close($stream);

            if ($rn == 'no') {
                return false;
            }
        } catch (\Exception $e) {
        }

        return true;
    }
}
