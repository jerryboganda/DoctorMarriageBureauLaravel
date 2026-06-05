<?php

namespace App\Utility;

use App\Models\ExpressInterest;
use App\Models\FieldVisibilitySetting;
use App\Models\GalleryImage;
use App\Models\MemberLanguage;
use App\Models\ReportedUser;
use App\Models\Shortlist;
use App\Models\User;
use App\Models\ViewGalleryImage;
use App\Models\ViewProfilePicture;
use Carbon\Carbon;

class MemberUtility
{
    protected static array $userCache = [];

    protected static array $countryCache = [];

    protected static array $religionCache = [];

    protected static array $motherTongueCache = [];

    protected static array $interestCache = [];

    protected static array $shortlistCache = [];

    protected static array $reportCache = [];

    protected static array $visibilitySnapshotCache = [];

    protected static array $mediaVisibilityCache = [];

    protected static array $profilePhotoRequestCache = [];

    protected static array $galleryImageRequestCache = [];

    public static function resetCaches(): void
    {
        self::$userCache = [];
        self::$countryCache = [];
        self::$religionCache = [];
        self::$motherTongueCache = [];
        self::$interestCache = [];
        self::$shortlistCache = [];
        self::$reportCache = [];
        self::$visibilitySnapshotCache = [];
        self::$mediaVisibilityCache = [];
        self::$profilePhotoRequestCache = [];
        self::$galleryImageRequestCache = [];
    }

    public static function primeUserCache($users): void
    {
        foreach ($users as $user) {
            if (! $user || empty($user->id)) {
                continue;
            }

            self::$userCache[(int) $user->id] = $user;
        }
    }

    public static function primeVisibilitySnapshots($userIds): void
    {
        $ids = collect($userIds)
            ->map(fn ($id) => (int) $id)
            ->filter(fn ($id) => $id > 0 && ! array_key_exists($id, self::$visibilitySnapshotCache))
            ->unique()
            ->values();

        if ($ids->isEmpty()) {
            return;
        }

        $settingsByUser = FieldVisibilitySetting::query()
            ->whereIn('user_id', $ids)
            ->get(['user_id', 'field_name', 'is_visible'])
            ->groupBy('user_id')
            ->map(fn ($settings) => $settings->pluck('is_visible', 'field_name')->toArray());

        foreach ($ids as $userId) {
            $user = self::getUserWithProfileRelations($userId);
            $settings = $settingsByUser->get($userId, []);

            self::$visibilitySnapshotCache[$userId] = [
                'profile_visible' => (bool) ($user?->member?->is_visible ?? true),
                'incognito' => self::boolSetting($settings, 'incognito', false),
                'full_name' => self::boolSetting($settings, 'full_name', true),
                'screenshot_deterrence' => self::boolSetting($settings, 'screenshot_deterrence', true),
                'photo_visibility_public' => self::boolSetting($settings, 'photo_visibility_public', true),
                'photo_visibility_members' => self::boolSetting($settings, 'photo_visibility_members', true),
                'profile_photo_blur' => self::boolSetting($settings, 'profile_photo_blur', false),
            ];
        }
    }

    protected static function boolSetting(array $settings, string $key, bool $default): bool
    {
        if (! array_key_exists($key, $settings)) {
            return $default;
        }

        return filter_var($settings[$key], FILTER_VALIDATE_BOOLEAN);
    }

    public static function member_visibility_snapshot($user_id = ''): array
    {
        $userId = (int) $user_id;
        if ($userId <= 0) {
            return [
                'profile_visible' => true,
                'incognito' => false,
                'full_name' => true,
                'screenshot_deterrence' => true,
                'photo_visibility_public' => true,
                'photo_visibility_members' => true,
                'profile_photo_blur' => false,
            ];
        }

        if (! array_key_exists($userId, self::$visibilitySnapshotCache)) {
            $user = self::getUserWithProfileRelations($userId);
            $settings = FieldVisibilitySetting::where('user_id', $userId)
                ->pluck('is_visible', 'field_name')
                ->toArray();

            self::$visibilitySnapshotCache[$userId] = [
                'profile_visible' => (bool) ($user?->member?->is_visible ?? true),
                'incognito' => self::boolSetting($settings, 'incognito', false),
                'full_name' => self::boolSetting($settings, 'full_name', true),
                'screenshot_deterrence' => self::boolSetting($settings, 'screenshot_deterrence', true),
                'photo_visibility_public' => self::boolSetting($settings, 'photo_visibility_public', true),
                'photo_visibility_members' => self::boolSetting($settings, 'photo_visibility_members', true),
                'profile_photo_blur' => self::boolSetting($settings, 'profile_photo_blur', false),
            ];
        }

        return self::$visibilitySnapshotCache[$userId];
    }

    public static function member_is_incognito($user_id = ''): bool
    {
        $userId = (int) $user_id;
        if ($userId <= 0) {
            return false;
        }

        return (bool) (self::member_visibility_snapshot($userId)['incognito'] ?? false);
    }

    public static function member_full_name_visible($user_id = ''): bool
    {
        $userId = (int) $user_id;
        if ($userId <= 0) {
            return true;
        }

        return (bool) (self::member_visibility_snapshot($userId)['full_name'] ?? true);
    }

    public static function member_display_name_parts($user_id = '', ?string $firstName = null, ?string $lastName = null): array
    {
        $safeFirstName = trim((string) ($firstName ?? ''));
        $safeLastName = trim((string) ($lastName ?? ''));

        if (self::member_full_name_visible($user_id)) {
            return [
                'first_name' => $safeFirstName,
                'last_name' => $safeLastName,
            ];
        }

        $maskedFirstName = $safeFirstName !== '' ? $safeFirstName : 'Member';
        $maskedLastName = $safeLastName !== '' ? strtoupper(substr($safeLastName, 0, 1)).'.' : '';

        return [
            'first_name' => $maskedFirstName,
            'last_name' => $maskedLastName,
        ];
    }

    public static function member_display_name($user_id = '', ?string $firstName = null, ?string $lastName = null): string
    {
        $nameParts = self::member_display_name_parts($user_id, $firstName, $lastName);

        return trim($nameParts['first_name'].' '.$nameParts['last_name']);
    }

    public static function member_profile_photo_blur($user_id = ''): bool
    {
        $userId = (int) $user_id;
        if ($userId <= 0) {
            return false;
        }

        return (bool) (self::member_visibility_snapshot($userId)['profile_photo_blur'] ?? false);
    }

    protected static function member_photo_visibility_level(array $snapshot): int
    {
        $publicVisible = (bool) ($snapshot['photo_visibility_public'] ?? true);
        $membersVisible = (bool) ($snapshot['photo_visibility_members'] ?? true);

        if ($publicVisible) {
            return 0;
        }

        if ($membersVisible) {
            return 2;
        }

        return 3;
    }

    public static function resolve_media_visibility($user_id = '', string $surface = 'profile'): array
    {
        $userId = (int) $user_id;
        if ($userId <= 0) {
            return [
                'admin_privacy' => $surface === 'gallery' ? (string) get_setting('gallery_image_privacy') : (string) get_setting('profile_picture_privacy'),
                'member_level' => 0,
                'effective_level' => 0,
                'requires_request' => false,
                'requires_premium' => false,
                'requires_membership' => false,
                'visible_to_public' => true,
                'visible_to_members' => true,
            ];
        }

        $cacheKey = $userId.':'.$surface;
        if (! array_key_exists($cacheKey, self::$mediaVisibilityCache)) {
            $snapshot = self::member_visibility_snapshot($userId);
            $adminPrivacy = (string) get_setting($surface === 'gallery' ? 'gallery_image_privacy' : 'profile_picture_privacy');
            $adminLevel = match ($adminPrivacy) {
                'premium_members' => 1,
                'only_me' => 3,
                default => 0,
            };
            $memberLevel = self::member_photo_visibility_level($snapshot);
            $effectiveLevel = max($adminLevel, $memberLevel);

            self::$mediaVisibilityCache[$cacheKey] = [
                'admin_privacy' => $adminPrivacy,
                'member_level' => $memberLevel,
                'effective_level' => $effectiveLevel,
                'requires_request' => $effectiveLevel === 3,
                'requires_premium' => $effectiveLevel === 1,
                'requires_membership' => $effectiveLevel >= 1,
                'visible_to_public' => $effectiveLevel === 0,
                'visible_to_members' => $effectiveLevel <= 2,
            ];
        }

        return self::$mediaVisibilityCache[$cacheKey];
    }

    protected static function resolveBirthday($birthday): ?Carbon
    {
        if ($birthday === null || $birthday === '') {
            return null;
        }

        try {
            $birthdayValue = trim((string) $birthday);
            if ($birthdayValue === '') {
                return null;
            }

            if (is_numeric($birthdayValue)) {
                $timestamp = (int) $birthdayValue;
                if ($timestamp > 0) {
                    return Carbon::createFromTimestamp($timestamp);
                }
            }

            return Carbon::parse($birthdayValue);
        } catch (\Throwable $e) {
            return null;
        }
    }

    public static function member_birthdate($user_id = ''): ?string
    {
        $userId = (int) $user_id;
        if ($userId <= 0) {
            return null;
        }

        $user = self::getUserWithProfileRelations($userId);
        $birthday = self::resolveBirthday($user?->member?->birthday);

        return $birthday ? $birthday->format('Y-m-d') : null;
    }

    public static function member_age($user_id = ''): ?int
    {
        $userId = (int) $user_id;
        if ($userId <= 0) {
            return null;
        }

        $user = self::getUserWithProfileRelations($userId);
        $birthday = self::resolveBirthday($user?->member?->birthday);

        if (! $birthday) {
            return null;
        }

        $age = $birthday->age;

        return $age > 0 ? $age : null;
    }

    protected static function getUserWithProfileRelations($user_id)
    {
        $userId = (int) $user_id;
        if ($userId <= 0) {
            return null;
        }

        if (! array_key_exists($userId, self::$userCache)) {
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

        if (! array_key_exists($userId, self::$religionCache)) {
            $user = self::getUserWithProfileRelations($userId);
            self::$religionCache[$userId] = (get_setting('member_spiritual_and_social_background_section') == 'on' &&
                ! empty($user?->spiritual_backgrounds?->religion_id))
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

        if (! array_key_exists($userId, self::$countryCache)) {
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

        if (! array_key_exists($userId, self::$motherTongueCache)) {
            $motherTongue = '';
            $user = self::getUserWithProfileRelations($userId);
            $languageId = $user?->member?->mothere_tongue;

            if (get_setting('member_language_section') == 'on' && ! empty($languageId)) {
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

        if (! $authId || $targetId <= 0) {
            return $default;
        }

        $cacheKey = $authId.':'.$targetId;
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

        if (! empty($doExpressedInterest) && ! empty($receivedExpressedInterest)) {
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
        } elseif (! empty($receivedExpressedInterest)) {
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
        if (! $authId || $targetId <= 0) {
            return [
                'shortlist_status' => 1,
                'shortlist_text' => translate('Bookmark'),
            ];
        }

        $cacheKey = $authId.':'.$targetId;
        if (! array_key_exists($cacheKey, self::$shortlistCache)) {
            $shortlisted = Shortlist::query()
                ->where('user_id', $targetId)
                ->where('shortlisted_by', $authId)
                ->exists();

            self::$shortlistCache[$cacheKey] = [
                'shortlist_status' => $shortlisted ? 0 : 1,
                'shortlist_text' => $shortlisted ? translate('Bookmarked') : translate('Bookmark'),
            ];
        }

        return self::$shortlistCache[$cacheKey];
    }

    public static function member_profile_photo_request_info($user_id = ''): array
    {
        $authId = auth()->id();
        $targetId = (int) $user_id;
        $user = $targetId > 0 ? self::getUserWithProfileRelations($targetId) : null;
        $hasPhoto = ! empty($user?->photo) && (int) $user?->photo_approved === 1;
        $visibility = self::resolve_media_visibility($targetId, 'profile');
        $effectiveLevel = (int) ($visibility['effective_level'] ?? 0);
        $currentUserIsPremium = (int) (optional(auth()->user())->membership ?? 0) === 2;
        $currentUserIsMember = (bool) auth()->check();
        $accessibleWithoutRequest = $hasPhoto && (
            $effectiveLevel === 0 ||
            ($effectiveLevel === 1 && $currentUserIsPremium) ||
            ($effectiveLevel === 2 && $currentUserIsMember)
        );

        $default = [
            'profile_photo_request_state' => 'none',
            'profile_photo_request_requested' => false,
            'profile_photo_request_approved' => false,
            'profile_photo_request_text' => $hasPhoto
                ? ($accessibleWithoutRequest
                    ? translate('Already Accessible')
                    : ($effectiveLevel === 1
                        ? translate('Premium Members Only')
                        : ($effectiveLevel === 2
                            ? translate('Members Only')
                            : translate('Request Photo Access'))))
                : translate('Photo Not Available'),
            'profile_photo_request_id' => null,
            'profile_photo_request_required' => $hasPhoto && $effectiveLevel === 3,
            'profile_photo_accessible' => $accessibleWithoutRequest,
            'profile_photo_exists' => $hasPhoto,
        ];

        if (! $authId || $targetId <= 0) {
            return $default;
        }

        $cacheKey = $authId.':'.$targetId;
        if (! array_key_exists($cacheKey, self::$profilePhotoRequestCache)) {
            $request = ViewProfilePicture::query()
                ->where('user_id', $targetId)
                ->where('requested_by', $authId)
                ->latest('id')
                ->first();

            if (! $request) {
                self::$profilePhotoRequestCache[$cacheKey] = $default;
            } else {
                $isApproved = (int) $request->status === 1;
                self::$profilePhotoRequestCache[$cacheKey] = [
                    'profile_photo_request_state' => $isApproved ? 'approved' : 'pending',
                    'profile_photo_request_requested' => true,
                    'profile_photo_request_approved' => $isApproved,
                    'profile_photo_request_text' => $isApproved
                        ? translate('Photo Access Granted')
                        : translate('Photo Access Requested'),
                    'profile_photo_request_id' => $request->id,
                    'profile_photo_request_required' => $hasPhoto && $effectiveLevel === 3 && ! $isApproved,
                    'profile_photo_accessible' => $hasPhoto && (
                        $accessibleWithoutRequest ||
                        $isApproved
                    ),
                    'profile_photo_exists' => $hasPhoto,
                ];
            }

            if (! $request) {
                self::$profilePhotoRequestCache[$cacheKey] = [
                    ...$default,
                    'profile_photo_request_required' => $hasPhoto && $effectiveLevel === 3,
                    'profile_photo_accessible' => $accessibleWithoutRequest,
                ];
            }
        }

        return self::$profilePhotoRequestCache[$cacheKey];
    }

    public static function member_gallery_image_request_info($user_id = ''): array
    {
        $authId = auth()->id();
        $targetId = (int) $user_id;
        $user = $targetId > 0 ? self::getUserWithProfileRelations($targetId) : null;
        $hasGalleryImages = GalleryImage::query()->where('user_id', $targetId)->exists();
        $visibility = self::resolve_media_visibility($targetId, 'gallery');
        $effectiveLevel = (int) ($visibility['effective_level'] ?? 0);
        $currentUserIsPremium = (int) (optional(auth()->user())->membership ?? 0) === 2;
        $currentUserIsMember = (bool) auth()->check();
        $accessibleWithoutRequest = $hasGalleryImages && (
            $effectiveLevel === 0 ||
            ($effectiveLevel === 1 && $currentUserIsPremium) ||
            ($effectiveLevel === 2 && $currentUserIsMember)
        );

        $default = [
            'gallery_image_request_state' => 'none',
            'gallery_image_request_requested' => false,
            'gallery_image_request_approved' => false,
            'gallery_image_request_text' => $hasGalleryImages
                ? ($accessibleWithoutRequest
                    ? translate('Already Accessible')
                    : ($effectiveLevel === 1
                        ? translate('Premium Members Only')
                        : ($effectiveLevel === 2
                            ? translate('Members Only')
                            : translate('Request Gallery Access'))))
                : translate('Gallery Images Not Available'),
            'gallery_image_request_id' => null,
            'gallery_image_request_required' => $hasGalleryImages && $effectiveLevel === 3,
            'gallery_image_accessible' => $accessibleWithoutRequest,
            'gallery_image_exists' => $hasGalleryImages,
        ];

        if (! $authId || $targetId <= 0) {
            return $default;
        }

        $cacheKey = $authId.':'.$targetId;
        if (! array_key_exists($cacheKey, self::$galleryImageRequestCache)) {
            $request = ViewGalleryImage::query()
                ->where('user_id', $targetId)
                ->where('requested_by', $authId)
                ->latest('id')
                ->first();

            if (! $request) {
                self::$galleryImageRequestCache[$cacheKey] = [
                    ...$default,
                    'gallery_image_request_required' => $hasGalleryImages && $effectiveLevel === 3,
                    'gallery_image_accessible' => $accessibleWithoutRequest,
                ];
            } else {
                $isApproved = (int) $request->status === 1;
                self::$galleryImageRequestCache[$cacheKey] = [
                    'gallery_image_request_state' => $isApproved ? 'approved' : 'pending',
                    'gallery_image_request_requested' => true,
                    'gallery_image_request_approved' => $isApproved,
                    'gallery_image_request_text' => $isApproved
                        ? translate('Gallery Access Granted')
                        : translate('Gallery Access Requested'),
                    'gallery_image_request_id' => $request->id,
                    'gallery_image_request_required' => $hasGalleryImages && $effectiveLevel === 3 && ! $isApproved,
                    'gallery_image_accessible' => $hasGalleryImages && (
                        $accessibleWithoutRequest ||
                        $isApproved
                    ),
                    'gallery_image_exists' => $hasGalleryImages,
                ];
            }
        }

        return self::$galleryImageRequestCache[$cacheKey];
    }

    public static function member_report_status($user_id = '')
    {
        $authId = auth()->id();
        $targetId = (int) $user_id;
        if (! $authId || $targetId <= 0) {
            return false;
        }

        $cacheKey = $authId.':'.$targetId;
        if (! array_key_exists($cacheKey, self::$reportCache)) {
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
        if ($key == '') {
            return false;
        }

        try {
            $gate = 'https://activeitzone.com/activation/check/matrimonial/'.$key;

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
