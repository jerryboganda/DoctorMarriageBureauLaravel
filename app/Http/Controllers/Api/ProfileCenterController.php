<?php

namespace App\Http\Controllers\Api;

use App\Events\ProfileUpdated;
use App\Http\Controllers\Controller;
use App\Models\FieldVisibilitySetting;
use App\Models\Member;
use App\Models\PartnerPreferencePriority;
use App\Models\ProfileAuditLog;
use App\Models\User;
use App\Utility\MemberUtility;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class ProfileCenterController extends Controller
{
    /**
     * Quality score weights for each section (totaling 100%)
     */
    private const QUALITY_WEIGHTS = [
        'basics' => 20,
        'photos' => 20,
        'lifestyle' => 15,
        'career' => 15,
        'family' => 10,
        'preferences' => 10,
        'media' => 10,
    ];

    private function buildVisibilitySnapshot(User $user): array
    {
        $stored = FieldVisibilitySetting::where('user_id', $user->id)
            ->pluck('is_visible', 'field_name')
            ->toArray();

        $fieldVisibility = FieldVisibilitySetting::getForUser($user->id);
        $photoVisibilityPublic = array_key_exists('photo_visibility_public', $stored)
            ? filter_var($stored['photo_visibility_public'], FILTER_VALIDATE_BOOLEAN)
            : true;
        $photoVisibilityMembers = array_key_exists('photo_visibility_members', $stored)
            ? filter_var($stored['photo_visibility_members'], FILTER_VALIDATE_BOOLEAN)
            : true;

        return array_merge($fieldVisibility, [
            'profile_visible' => (bool) ($user->member?->is_visible ?? true),
            'incognito' => array_key_exists('incognito', $stored)
                ? filter_var($stored['incognito'], FILTER_VALIDATE_BOOLEAN)
                : false,
            'screenshot_deterrence' => $fieldVisibility['screenshot_deterrence'] ?? true,
            'photo_visibility_public' => $photoVisibilityPublic,
            'photo_visibility_members' => $photoVisibilityMembers,
            'profile_photo_blur' => array_key_exists('profile_photo_blur', $stored)
                ? filter_var($stored['profile_photo_blur'], FILTER_VALIDATE_BOOLEAN)
                : false,
        ]);
    }

    /**
     * Get full profile data aggregated from all tables.
     */
    public function getFullProfile(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = auth()->user();

        $profile = $this->aggregateProfileData($user);
        $qualityScore = $this->calculateQualityScore($user);
        $visibility = $this->buildVisibilitySnapshot($user);
        $preferencePriorities = PartnerPreferencePriority::getForUser($user->id);

        return response()->json([
            'success' => true,
            'data' => [
                'profile' => $profile,
                'quality_score' => $qualityScore,
                'visibility_settings' => $visibility,
                'preference_priorities' => $preferencePriorities,
            ],
        ]);
    }

    /**
     * Update a specific section of the profile.
     */
    public function updateSection(Request $request, string $section): JsonResponse
    {
        /** @var User $user */
        $user = auth()->user();

        $validSections = ['basics', 'lifestyle', 'career', 'family', 'preferences', 'media'];
        if (! in_array($section, $validSections)) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid section: '.$section,
            ], 400);
        }

        try {
            DB::beginTransaction();

            $method = 'update'.ucfirst($section);
            $oldData = $this->getSectionData($user, $section);
            $updatedData = $this->$method($request, $user);

            // Log changes to audit trail
            ProfileAuditLog::logChanges(
                $user->id,
                $section,
                $oldData,
                $updatedData
            );

            DB::commit();

            // Calculate new quality score
            $qualityScore = $this->calculateQualityScore($user->fresh());

            // Broadcast update
            broadcast(new ProfileUpdated($user->id, $section, $updatedData, $qualityScore['total']))->toOthers();

            return response()->json([
                'success' => true,
                'message' => ucfirst($section).' updated successfully',
                'data' => $updatedData,
                'quality_score' => $qualityScore,
            ]);
        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'success' => false,
                'message' => 'Failed to update '.$section.': '.$e->getMessage(),
            ], 500);
        }
    }

    /**
     * Update visibility settings (supports single key-value or bulk update).
     */
    public function toggleVisibility(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = auth()->user();

        // Get all known visibility setting keys
        $knownKeys = array_merge(
            FieldVisibilitySetting::VALID_FIELDS,
            [
                'show_profile_photo',
                'show_contact_details',
                'show_email',
                'show_phone',
                'show_location',
                'profile_visible',
                'show_online_status',
                'show_last_seen',
                'allow_messages_from',
                'searchable',
                'hide_from_search',
                'block_screenshots',
                'incognito',
                'photo_visibility_public',
                'photo_visibility_members',
                'profile_photo_blur',
            ]
        );

        $updates = $request->only($knownKeys);

        // Also support the old 'field_name' + 'is_visible' format for backward compatibility
        if ($request->has('field_name') && $request->has('is_visible')) {
            $updates[$request->input('field_name')] = $request->boolean('is_visible');
        }

        if (empty($updates)) {
            return response()->json([
                'success' => false,
                'message' => 'No valid settings provided',
            ], 400);
        }

        $updatedSettings = [];

        if (
            array_key_exists('incognito', $updates)
            && filter_var($updates['incognito'], FILTER_VALIDATE_BOOLEAN)
            && (int) ($user->membership ?? 0) !== 2
        ) {
            return response()->json([
                'success' => false,
                'message' => 'Browse Privately is available for premium members only.',
                'code' => 'PREMIUM_REQUIRED',
                'data' => $this->buildVisibilitySnapshot($user->fresh(['member'])),
            ], 403);
        }

        if (array_key_exists('photo_visibility_public', $updates) || array_key_exists('photo_visibility_members', $updates)) {
            $currentSettings = FieldVisibilitySetting::where('user_id', $user->id)
                ->pluck('is_visible', 'field_name')
                ->toArray();
            $photoPublic = array_key_exists('photo_visibility_public', $updates)
                ? filter_var($updates['photo_visibility_public'], FILTER_VALIDATE_BOOLEAN)
                : (bool) ($currentSettings['photo_visibility_public'] ?? true);
            $photoMembers = array_key_exists('photo_visibility_members', $updates)
                ? filter_var($updates['photo_visibility_members'], FILTER_VALIDATE_BOOLEAN)
                : (bool) ($currentSettings['photo_visibility_members'] ?? true);

            if ($photoPublic) {
                $photoMembers = true;
            } elseif (! $photoMembers) {
                $photoPublic = false;
                $photoMembers = false;
            } else {
                $photoPublic = false;
                $photoMembers = true;
            }

            $updates['photo_visibility_public'] = $photoPublic;
            $updates['photo_visibility_members'] = $photoMembers;
        }

        foreach ($updates as $key => $value) {
            // Handle boolean conversion for most fields, but keep string for 'allow_messages_from'
            $parsedValue = $key === 'allow_messages_from' ? $value : filter_var($value, FILTER_VALIDATE_BOOLEAN);

            if ($key === 'profile_visible') {
                $member = $user->member;
                if ($member) {
                    $member->is_visible = $parsedValue ? 1 : 0;
                    $member->save();
                }
            }

            // Log previous value
            $oldValue = FieldVisibilitySetting::where('user_id', $user->id)
                ->where('field_name', $key)
                ->value('is_visible');

            FieldVisibilitySetting::setVisibility($user->id, $key, $parsedValue);

            // Only log if changed
            if ($oldValue !== $parsedValue) {
                ProfileAuditLog::logChange(
                    $user->id,
                    ProfileAuditLog::SECTION_VISIBILITY,
                    $key,
                    $oldValue,
                    $parsedValue
                );
            }

            $updatedSettings[$key] = $parsedValue;
        }

        // Broadcast update (non-blocking — don't let broadcast failures kill the response)
        try {
            broadcast(new ProfileUpdated($user->id, 'visibility', [
                'type' => count($updates) > 1 ? 'bulk_update' : 'single_update',
                'updates' => $updatedSettings,
            ]))->toOthers();
        } catch (\Throwable $e) {
            \Log::warning('Visibility broadcast failed: '.$e->getMessage());
        }

        MemberUtility::resetCaches();
        $snapshot = $this->buildVisibilitySnapshot($user->fresh(['member']));

        return response()->json([
            'success' => true,
            'message' => 'Privacy settings updated successfully',
            'data' => array_merge($snapshot, $updatedSettings, [
                'profile_visible' => $snapshot['profile_visible'],
            ]),
        ]);
    }

    /**
     * Get all visibility settings.
     */
    public function getVisibilitySettings(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = auth()->user();

        return response()->json([
            'success' => true,
            'data' => $this->buildVisibilitySnapshot($user),
        ]);
    }

    /**
     * Upload voice intro (max 30 seconds).
     */
    public function uploadVoiceIntro(Request $request): JsonResponse
    {
        $request->validate([
            'voice_file' => 'required|file|mimes:mp3,wav,m4a,webm,ogg|max:5120', // 5MB max
        ]);

        /** @var User $user */
        $user = auth()->user();

        // Delete old file if exists
        $member = $user->member;
        if ($member && $member->voice_intro_path) {
            Storage::disk('public')->delete($member->voice_intro_path);
        }

        // Store new file
        $file = $request->file('voice_file');
        $filename = 'voice_'.$user->id.'_'.time().'.'.$file->getClientOriginalExtension();
        $path = $file->storeAs('uploads/voice_intros', $filename, 'public');

        // Update member record
        if ($member) {
            $oldPath = $member->voice_intro_path;
            $member->voice_intro_path = $path;
            $member->save();

            ProfileAuditLog::logChange(
                $user->id,
                ProfileAuditLog::SECTION_MEDIA,
                'voice_intro_path',
                $oldPath,
                $path
            );
        }

        $qualityScore = $this->calculateQualityScore($user->fresh());

        broadcast(new ProfileUpdated($user->id, 'media', [
            'voice_intro_path' => $path,
            'voice_intro_url' => Storage::disk('public')->url($path),
        ], $qualityScore['total']))->toOthers();

        return response()->json([
            'success' => true,
            'message' => 'Voice intro uploaded successfully',
            'data' => [
                'voice_intro_path' => $path,
                'voice_intro_url' => Storage::disk('public')->url($path),
            ],
            'quality_score' => $qualityScore,
        ]);
    }

    /**
     * Delete voice intro.
     */
    public function deleteVoiceIntro(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = auth()->user();
        $member = $user->member;

        if ($member && $member->voice_intro_path) {
            $oldPath = $member->voice_intro_path;
            Storage::disk('public')->delete($member->voice_intro_path);
            $member->voice_intro_path = null;
            $member->save();

            ProfileAuditLog::logChange(
                $user->id,
                ProfileAuditLog::SECTION_MEDIA,
                'voice_intro_path',
                $oldPath,
                null
            );
        }

        $qualityScore = $this->calculateQualityScore($user->fresh());

        broadcast(new ProfileUpdated($user->id, 'media', [
            'voice_intro_path' => null,
            'voice_intro_url' => null,
        ], $qualityScore['total']))->toOthers();

        return response()->json([
            'success' => true,
            'message' => 'Voice intro deleted',
            'quality_score' => $qualityScore,
        ]);
    }

    /**
     * Upload intro video (max 2 minutes).
     */
    public function uploadIntroVideo(Request $request): JsonResponse
    {
        $request->validate([
            'video_file' => 'required|file|mimes:mp4,mov,webm|max:51200', // 50MB max
        ]);

        /** @var User $user */
        $user = auth()->user();

        // Delete old file if exists
        $member = $user->member;
        if ($member && $member->intro_video_path) {
            Storage::disk('public')->delete($member->intro_video_path);
        }

        // Store new file
        $file = $request->file('video_file');
        $filename = 'video_'.$user->id.'_'.time().'.'.$file->getClientOriginalExtension();
        $path = $file->storeAs('uploads/intro_videos', $filename, 'public');

        // Update member record
        if ($member) {
            $oldPath = $member->intro_video_path;
            $member->intro_video_path = $path;
            $member->save();

            ProfileAuditLog::logChange(
                $user->id,
                ProfileAuditLog::SECTION_MEDIA,
                'intro_video_path',
                $oldPath,
                $path
            );
        }

        $qualityScore = $this->calculateQualityScore($user->fresh());

        broadcast(new ProfileUpdated($user->id, 'media', [
            'intro_video_path' => $path,
            'intro_video_url' => Storage::url($path),
        ], $qualityScore['total']))->toOthers();

        return response()->json([
            'success' => true,
            'message' => 'Intro video uploaded successfully',
            'data' => [
                'intro_video_path' => $path,
                'intro_video_url' => Storage::url($path),
            ],
            'quality_score' => $qualityScore,
        ]);
    }

    /**
     * Delete intro video.
     */
    public function deleteIntroVideo(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = auth()->user();
        $member = $user->member;

        if ($member && $member->intro_video_path) {
            $oldPath = $member->intro_video_path;
            Storage::disk('public')->delete($member->intro_video_path);
            $member->intro_video_path = null;
            $member->save();

            ProfileAuditLog::logChange(
                $user->id,
                ProfileAuditLog::SECTION_MEDIA,
                'intro_video_path',
                $oldPath,
                null
            );
        }

        $qualityScore = $this->calculateQualityScore($user->fresh());

        broadcast(new ProfileUpdated($user->id, 'media', [
            'intro_video_path' => null,
            'intro_video_url' => null,
        ], $qualityScore['total']))->toOthers();

        return response()->json([
            'success' => true,
            'message' => 'Intro video deleted',
            'quality_score' => $qualityScore,
        ]);
    }

    /**
     * Get calculated quality score with breakdown.
     */
    public function getQualityScore(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = auth()->user();
        $qualityScore = $this->calculateQualityScore($user);

        return response()->json([
            'success' => true,
            'data' => $qualityScore,
        ]);
    }

    /**
     * Get profile edit history.
     */
    public function getHistory(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = auth()->user();

        $section = $request->query('section');
        $days = (int) $request->query('days', 30);

        $history = ProfileAuditLog::getGroupedHistory($user->id, $days);
        $stats = ProfileAuditLog::getStats($user->id);

        // Filter by section if provided
        if ($section) {
            foreach ($history as &$day) {
                $day['changes'] = array_filter($day['changes'], fn ($c) => $c['section'] === $section);
            }
            $history = array_filter($history, fn ($d) => ! empty($d['changes']));
        }

        return response()->json([
            'success' => true,
            'data' => [
                'history' => array_values($history),
                'stats' => $stats,
            ],
        ]);
    }

    /**
     * Update preference priorities.
     */
    public function updatePreferencePriorities(Request $request): JsonResponse
    {
        $request->validate([
            'priorities' => 'required|array',
            'priorities.*' => 'in:dealbreaker,must_have,nice_to_have,flexible',
        ]);

        /** @var User $user */
        $user = auth()->user();

        $oldPriorities = PartnerPreferencePriority::getForUser($user->id);
        $newPriorities = $request->input('priorities');

        PartnerPreferencePriority::setBulk($user->id, $newPriorities);

        ProfileAuditLog::logChange(
            $user->id,
            ProfileAuditLog::SECTION_PREFERENCES,
            'preference_priorities',
            $oldPriorities,
            $newPriorities
        );

        broadcast(new ProfileUpdated($user->id, 'preferences', [
            'priorities' => $newPriorities,
        ]))->toOthers();

        return response()->json([
            'success' => true,
            'message' => 'Preference priorities updated',
            'data' => PartnerPreferencePriority::getForUser($user->id),
        ]);
    }

    // ==========================================
    // PRIVATE HELPER METHODS
    // ==========================================

    /**
     * Aggregate all profile data from multiple tables.
     */
    private function aggregateProfileData(User $user): array
    {
        $member = $user->member;
        $physicalAttributes = DB::table('physical_attributes')->where('user_id', $user->id)->first();
        $lifestyle = DB::table('lifestyles')->where('user_id', $user->id)->first();
        $hobbies = DB::table('hobbies')->where('user_id', $user->id)->first();
        $attitudes = DB::table('attitudes')->where('user_id', $user->id)->first();
        $residency = DB::table('recidencies')->where('user_id', $user->id)->first();
        $spiritual = DB::table('spiritual_backgrounds')->where('user_id', $user->id)->first();
        $family = DB::table('families')->where('user_id', $user->id)->first();
        $partnerExpectations = DB::table('partner_expectations')->where('user_id', $user->id)->first();
        $presentAddress = DB::table('addresses')->where('user_id', $user->id)->where('type', 'present')->first();
        $education = DB::table('education')->where('user_id', $user->id)->orderBy('end', 'desc')->get();
        $careers = DB::table('careers')->where('user_id', $user->id)->orderBy('end', 'desc')->get();
        $galleryImages = DB::table('gallery_images')->where('user_id', $user->id)->orderBy('sort_order')->get();

        // Get language names
        $knownLanguages = [];
        if ($member && $member->known_languages) {
            $languageIds = json_decode($member->known_languages, true) ?? [];
            if (! empty($languageIds)) {
                $knownLanguages = DB::table('languages')
                    ->whereIn('id', $languageIds)
                    ->pluck('name')
                    ->toArray();
            }
        }

        // Get country/state/city names
        $presentCountry = $presentAddress ? DB::table('countries')->where('id', $presentAddress->country_id)->value('name') : null;
        $presentState = $presentAddress ? DB::table('states')->where('id', $presentAddress->state_id)->value('name') : null;
        $presentCity = $presentAddress ? DB::table('cities')->where('id', $presentAddress->city_id)->value('name') : null;

        // Get religion/caste names
        $religionName = $spiritual ? DB::table('religions')->where('id', $spiritual->religion_id)->value('name') : null;
        $casteName = $spiritual ? DB::table('castes')->where('id', $spiritual->caste_id)->value('name') : null;

        return [
            'basics' => [
                'full_name' => trim(($user->first_name ?? '').' '.($user->last_name ?? '')),
                'first_name' => $user->first_name,
                'last_name' => $user->last_name,
                'email' => $user->email,
                'phone' => $user->phone,
                'photo' => $user->photo ? uploaded_asset($user->photo) : null,
                'birthday' => $member?->birthday,
                'gender' => $member?->gender,
                'height' => $physicalAttributes?->height,
                'weight' => $physicalAttributes?->weight,
                'nationality' => $member?->nationality,
                'known_languages' => $knownLanguages,
                'known_language_ids' => json_decode($member?->known_languages ?? '[]', true),
                'immigration_status' => $residency?->immigration_status,
                'current_residency' => [
                    'country' => $presentCountry,
                    'state' => $presentState,
                    'city' => $presentCity,
                    'country_id' => $presentAddress?->country_id,
                    'state_id' => $presentAddress?->state_id,
                    'city_id' => $presentAddress?->city_id,
                ],
            ],
            'marriage_intent' => [
                'timeline' => $member?->marriage_timeline,
                'relocation_willingness' => $member?->relocation_willingness,
                'seriousness_level' => $member?->seriousness_level ?? 'marriage',
            ],
            'lifestyle' => [
                'diet' => $lifestyle?->diet,
                'drink' => $lifestyle?->drink,
                'smoke' => $lifestyle?->smoke,
                'living_with' => $lifestyle?->living_with,
                'sleep_schedule' => $lifestyle?->sleep_schedule,
                'personality_tags' => json_decode($lifestyle?->personality_tags ?? '[]', true),
                'hobbies' => $hobbies?->hobbies,
                'interests' => $hobbies?->interests,
                'music' => $hobbies?->music,
                'books' => $hobbies?->books,
                'movies' => $hobbies?->movies,
                'sports' => $hobbies?->sports,
                'fitness_activities' => $hobbies?->fitness_activities,
                'affection' => $attitudes?->affection,
                'humor' => $attitudes?->humor,
                'political_views' => $attitudes?->political_views,
            ],
            'career' => [
                'education' => $education->map(fn ($e) => [
                    'id' => $e->id,
                    'degree' => $e->degree,
                    'institution' => $e->institution,
                    'start' => $e->start,
                    'end' => $e->end,
                    'present' => (bool) $e->present,
                    'is_highest' => (bool) ($e->is_highest_degree ?? false),
                ])->toArray(),
                'careers' => $careers->map(fn ($c) => [
                    'id' => $c->id,
                    'designation' => $c->designation,
                    'company' => $c->company,
                    'start' => $c->start,
                    'end' => $c->end,
                    'present' => (bool) $c->present,
                    'work_location_type' => $c->work_location_type ?? null,
                ])->toArray(),
                'annual_income_range_id' => $member?->annual_salary_range_id,
            ],
            'family' => [
                'family_type' => $family?->family_type,
                'father' => $family?->father,
                'mother' => $family?->mother,
                'father_occupation' => $family?->father_occupation,
                'mother_occupation' => $family?->mother_occupation,
                'no_of_brothers' => $family?->no_of_brothers,
                'no_of_sisters' => $family?->no_of_sisters,
                'about_parents' => $family?->about_parents,
                'about_siblings' => $family?->about_siblings,
                'family_location_city' => $family?->location_city,
                'family_location_country' => $family?->location_country,
            ],
            'spiritual' => [
                'religion_id' => $spiritual?->religion_id,
                'religion_name' => $religionName,
                'caste_id' => $spiritual?->caste_id,
                'caste_name' => $casteName,
                'sub_caste_id' => $spiritual?->sub_caste_id,
                'gothra' => $spiritual?->gothra,
                'ethnicity' => $spiritual?->ethnicity,
                'personal_value' => $spiritual?->personal_value,
                'family_value_id' => $spiritual?->family_value_id,
            ],
            'preferences' => [
                'min_age' => $partnerExpectations?->min_age,
                'max_age' => $partnerExpectations?->max_age,
                'height' => $partnerExpectations?->height,
                'weight' => $partnerExpectations?->weight,
                'marital_status_id' => $partnerExpectations?->marital_status_id,
                'children_acceptable' => $partnerExpectations?->children_acceptable,
                'religion_id' => $partnerExpectations?->religion_id,
                'caste_id' => $partnerExpectations?->caste_id,
                'education' => $partnerExpectations?->education,
                'profession' => $partnerExpectations?->profession,
                'smoking_acceptable' => $partnerExpectations?->smoking_acceptable,
                'drinking_acceptable' => $partnerExpectations?->drinking_acceptable,
                'diet' => $partnerExpectations?->diet,
                'body_type' => $partnerExpectations?->body_type,
                'complexion' => $partnerExpectations?->complexion,
                'preferred_country_id' => $partnerExpectations?->preferred_country_id,
                'preferred_state_id' => $partnerExpectations?->preferred_state_id,
            ],
            'media' => [
                'main_photo' => $user->photo ? uploaded_asset($user->photo) : null,
                'gallery' => $galleryImages->map(fn ($img) => [
                    'id' => $img->id,
                    'url' => uploaded_asset($img->image),
                    'privacy_level' => $img->privacy_level ?? 'public',
                    'is_main' => (bool) ($img->is_main_photo ?? false),
                    'sort_order' => $img->sort_order ?? 0,
                ])->toArray(),
                'voice_intro_path' => $member?->voice_intro_path,
                'voice_intro_url' => $member?->voice_intro_path ? Storage::disk('public')->url($member->voice_intro_path) : null,
                'intro_video_path' => $member?->intro_video_path,
                'intro_video_url' => $member?->intro_video_path ? Storage::url($member->intro_video_path) : null,
            ],
        ];
    }

    /**
     * Get current section data for audit comparison.
     */
    private function getSectionData(User $user, string $section): array
    {
        $profile = $this->aggregateProfileData($user);

        return match ($section) {
            'basics' => array_merge($profile['basics'], $profile['marriage_intent']),
            'lifestyle' => $profile['lifestyle'],
            'career' => $profile['career'],
            'family' => array_merge($profile['family'], $profile['spiritual']),
            'preferences' => $profile['preferences'],
            'media' => $profile['media'],
            default => [],
        };
    }

    /**
     * Calculate quality score dynamically.
     */
    private function calculateQualityScore(User $user): array
    {
        $member = $user->member;
        $scores = [];
        $improvements = [];

        // BASICS (20%)
        $basicsScore = 0;
        $basicsTotal = 10;
        $basicsMissing = [];
        if ($user->first_name) {
            $basicsScore++;
        } else {
            $basicsMissing[] = 'Add your first name';
        }
        if ($user->last_name) {
            $basicsScore++;
        } else {
            $basicsMissing[] = 'Add your last name';
        }
        if ($member?->birthday) {
            $basicsScore++;
        } else {
            $basicsMissing[] = 'Add your date of birth';
        }
        if ($member?->gender) {
            $basicsScore++;
        } else {
            $basicsMissing[] = 'Select your gender';
        }
        if (DB::table('physical_attributes')->where('user_id', $user->id)->whereNotNull('height')->exists()) {
            $basicsScore++;
        } else {
            $basicsMissing[] = 'Set your height';
        }
        if ($member?->known_languages && json_decode($member->known_languages)) {
            $basicsScore++;
        } else {
            $basicsMissing[] = 'Add languages you speak';
        }
        if (DB::table('recidencies')->where('user_id', $user->id)->whereNotNull('immigration_status')->exists()) {
            $basicsScore++;
        } else {
            $basicsMissing[] = 'Add immigration status';
        }
        if (DB::table('addresses')->where('user_id', $user->id)->where('type', 'present')->exists()) {
            $basicsScore++;
        } else {
            $basicsMissing[] = 'Add your current residency';
        }
        if ($member?->marriage_timeline) {
            $basicsScore++;
        } else {
            $basicsMissing[] = 'Set your marriage timeline';
        }
        if ($member?->relocation_willingness) {
            $basicsScore++;
        } else {
            $basicsMissing[] = 'Set relocation willingness';
        }

        $scores['basics'] = ($basicsScore / $basicsTotal) * self::QUALITY_WEIGHTS['basics'];
        if (! empty($basicsMissing)) {
            $pointsPerItem = round(self::QUALITY_WEIGHTS['basics'] / $basicsTotal);
            foreach ($basicsMissing as $msg) {
                $improvements[] = ['action' => $msg, 'points' => $pointsPerItem, 'section' => 'basics'];
            }
        }

        // PHOTOS (20%)
        $photosScore = 0;
        $photosTotal = 5;
        $photoCount = DB::table('gallery_images')->where('user_id', $user->id)->count();
        if ($user->photo) {
            $photosScore += 2;
        } else {
            $improvements[] = ['action' => 'Upload a profile photo', 'points' => 8, 'section' => 'media'];
        }
        $photosScore += min($photoCount, 3);

        $scores['photos'] = ($photosScore / $photosTotal) * self::QUALITY_WEIGHTS['photos'];

        if ($photoCount < 3) {
            $needed = 3 - $photoCount;
            $improvements[] = ['action' => "Add {$needed} more gallery photo".($needed > 1 ? 's' : ''), 'points' => $needed * 4, 'section' => 'media'];
        }

        // LIFESTYLE (15%)
        $lifestyleScore = 0;
        $lifestyleTotal = 6;
        $lifestyle = DB::table('lifestyles')->where('user_id', $user->id)->first();
        $hobbies = DB::table('hobbies')->where('user_id', $user->id)->first();
        $lifestyleMissing = [];
        if ($lifestyle?->diet) {
            $lifestyleScore++;
        } else {
            $lifestyleMissing[] = 'Select your diet preference';
        }
        if ($lifestyle?->drink) {
            $lifestyleScore++;
        } else {
            $lifestyleMissing[] = 'Select drinking habit';
        }
        if ($lifestyle?->smoke) {
            $lifestyleScore++;
        } else {
            $lifestyleMissing[] = 'Select smoking habit';
        }
        if ($lifestyle?->sleep_schedule) {
            $lifestyleScore++;
        } else {
            $lifestyleMissing[] = 'Set your sleep schedule';
        }
        if ($hobbies?->hobbies) {
            $lifestyleScore++;
        } else {
            $lifestyleMissing[] = 'Add your hobbies';
        }
        if ($hobbies?->interests) {
            $lifestyleScore++;
        } else {
            $lifestyleMissing[] = 'Add your interests';
        }

        $scores['lifestyle'] = ($lifestyleScore / $lifestyleTotal) * self::QUALITY_WEIGHTS['lifestyle'];
        if (! empty($lifestyleMissing)) {
            $pointsPerItem = round(self::QUALITY_WEIGHTS['lifestyle'] / $lifestyleTotal);
            foreach ($lifestyleMissing as $msg) {
                $improvements[] = ['action' => $msg, 'points' => $pointsPerItem, 'section' => 'lifestyle'];
            }
        }

        // CAREER (15%)
        $careerScore = 0;
        $careerTotal = 4;
        $hasEducation = DB::table('education')->where('user_id', $user->id)->exists();
        $hasCareer = DB::table('careers')->where('user_id', $user->id)->exists();
        if ($hasEducation) {
            $careerScore += 2;
        } else {
            $improvements[] = ['action' => 'Add your education details', 'points' => 8, 'section' => 'career'];
        }
        if ($hasCareer) {
            $careerScore += 2;
        } else {
            $improvements[] = ['action' => 'Add your career details', 'points' => 8, 'section' => 'career'];
        }

        $scores['career'] = ($careerScore / $careerTotal) * self::QUALITY_WEIGHTS['career'];

        // FAMILY (10%)
        $familyScore = 0;
        $familyTotal = 5;
        $family = DB::table('families')->where('user_id', $user->id)->first();
        $spiritual = DB::table('spiritual_backgrounds')->where('user_id', $user->id)->first();
        $familyMissing = [];
        if ($family?->father_occupation) {
            $familyScore++;
        } else {
            $familyMissing[] = "Add father's occupation";
        }
        if ($family?->mother_occupation) {
            $familyScore++;
        } else {
            $familyMissing[] = "Add mother's occupation";
        }
        if ($family?->family_type) {
            $familyScore++;
        } else {
            $familyMissing[] = 'Select family type';
        }
        if ($spiritual?->religion_id) {
            $familyScore++;
        } else {
            $familyMissing[] = 'Select your religion';
        }
        if ($spiritual?->caste_id) {
            $familyScore++;
        } else {
            $familyMissing[] = 'Select your caste';
        }

        $scores['family'] = ($familyScore / $familyTotal) * self::QUALITY_WEIGHTS['family'];
        if (! empty($familyMissing)) {
            $pointsPerItem = round(self::QUALITY_WEIGHTS['family'] / $familyTotal);
            foreach ($familyMissing as $msg) {
                $improvements[] = ['action' => $msg, 'points' => $pointsPerItem, 'section' => 'family'];
            }
        }

        // PREFERENCES (10%)
        $prefsScore = 0;
        $prefsTotal = 5;
        $prefs = DB::table('partner_expectations')->where('user_id', $user->id)->first();
        $prefsMissing = [];
        if ($prefs?->min_age && $prefs?->max_age) {
            $prefsScore++;
        } else {
            $prefsMissing[] = 'Set preferred age range';
        }
        if ($prefs?->height) {
            $prefsScore++;
        } else {
            $prefsMissing[] = 'Set preferred height';
        }
        if ($prefs?->religion_id) {
            $prefsScore++;
        } else {
            $prefsMissing[] = 'Set preferred religion';
        }
        if ($prefs?->profession) {
            $prefsScore++;
        } else {
            $prefsMissing[] = 'Set preferred profession';
        }
        if ($prefs?->preferred_country_id) {
            $prefsScore++;
        } else {
            $prefsMissing[] = 'Set preferred country';
        }

        $scores['preferences'] = ($prefsScore / $prefsTotal) * self::QUALITY_WEIGHTS['preferences'];
        if (! empty($prefsMissing)) {
            $pointsPerItem = round(self::QUALITY_WEIGHTS['preferences'] / $prefsTotal);
            foreach ($prefsMissing as $msg) {
                $improvements[] = ['action' => $msg, 'points' => $pointsPerItem, 'section' => 'preferences'];
            }
        }

        // MEDIA (10%)
        $mediaScore = 0;
        $mediaTotal = 2;
        if ($member?->voice_intro_path) {
            $mediaScore++;
        } else {
            $improvements[] = ['action' => 'Record a voice introduction', 'points' => 5, 'section' => 'media'];
        }
        if ($member?->intro_video_path) {
            $mediaScore++;
        } else {
            $improvements[] = ['action' => 'Upload an intro video', 'points' => 5, 'section' => 'media'];
        }

        $scores['media'] = ($mediaScore / $mediaTotal) * self::QUALITY_WEIGHTS['media'];

        $totalScore = (int) round(array_sum($scores));
        $level = match (true) {
            $totalScore >= 80 => 'EXCELLENT',
            $totalScore >= 60 => 'GOOD',
            $totalScore >= 40 => 'FAIR',
            default => 'NEEDS WORK',
        };

        // Sort improvements by points descending (highest impact first)
        usort($improvements, fn ($a, $b) => $b['points'] - $a['points']);

        return [
            'total' => $totalScore,
            'level' => $level,
            'breakdown' => array_map(fn ($s) => round($s, 1), $scores),
            'improvements' => array_slice($improvements, 0, 8),
        ];
    }

    // ==========================================
    // SECTION UPDATE METHODS
    // ==========================================

    private function updateBasics(Request $request, User $user): array
    {
        $data = $request->validate([
            'first_name' => 'sometimes|string|max:255',
            'last_name' => 'sometimes|string|max:255',
            'birthday' => 'nullable|date',
            'dateOfBirth' => 'nullable|date',
            'gender' => 'sometimes|string|in:male,female,other',
            'height' => 'sometimes|numeric|min:3|max:8',
            'weight' => 'sometimes|numeric|min:30|max:300',
            'nationality' => 'sometimes|string|max:100',
            'known_language_ids' => 'sometimes|array',
            'immigration_status' => 'sometimes|string|max:100',
            'country_id' => 'sometimes|integer',
            'state_id' => 'sometimes|integer',
            'city_id' => 'sometimes|integer',
            'marriage_timeline' => 'sometimes|string|in:immediate,6_months,1_year,2_years,casual,optional',
            'relocation_willingness' => 'sometimes|string|in:international,within_country,within_state,not_willing,optional',
            'seriousness_level' => 'sometimes|string|in:marriage,exploring,casual,optional',
        ]);

        $birthday = $data['birthday'] ?? $data['dateOfBirth'] ?? null;
        if (trim((string) $birthday) === '') {
            return response()->json([
                'success' => false,
                'message' => 'Date of Birth is required.',
            ], 422);
        }
        $birthday = Carbon::parse($birthday)->format('Y-m-d');

        // Update user table
        $user->update(array_filter([
            'first_name' => $data['first_name'] ?? null,
            'last_name' => $data['last_name'] ?? null,
        ], fn ($v) => $v !== null));

        // Update member table
        $member = $user->member;
        if ($member) {
            $memberData = array_filter([
                'birthday' => $birthday,
                'gender' => $data['gender'] ?? null,
                'nationality' => $data['nationality'] ?? null,
                'known_languages' => isset($data['known_language_ids']) ? json_encode($data['known_language_ids']) : null,
                'marriage_timeline' => $data['marriage_timeline'] ?? null,
                'relocation_willingness' => $data['relocation_willingness'] ?? null,
                'seriousness_level' => $data['seriousness_level'] ?? 'marriage',
            ], fn ($v) => $v !== null);

            if (! empty($memberData)) {
                $member->update($memberData);
            }
        }

        // Update physical attributes
        if (isset($data['height']) || isset($data['weight'])) {
            DB::table('physical_attributes')->updateOrInsert(
                ['user_id' => $user->id],
                array_filter([
                    'height' => $data['height'] ?? null,
                    'weight' => $data['weight'] ?? null,
                    'updated_at' => now(),
                ], fn ($v) => $v !== null)
            );
        }

        // Update residency
        if (isset($data['immigration_status'])) {
            DB::table('recidencies')->updateOrInsert(
                ['user_id' => $user->id],
                ['immigration_status' => $data['immigration_status'], 'updated_at' => now()]
            );
        }

        // Update address
        if (isset($data['country_id']) || isset($data['state_id']) || isset($data['city_id'])) {
            DB::table('addresses')->updateOrInsert(
                ['user_id' => $user->id, 'type' => 'present'],
                array_filter([
                    'country_id' => $data['country_id'] ?? null,
                    'state_id' => $data['state_id'] ?? null,
                    'city_id' => $data['city_id'] ?? null,
                    'updated_at' => now(),
                ], fn ($v) => $v !== null)
            );
        }

        return $data;
    }

    private function updateLifestyle(Request $request, User $user): array
    {
        $data = $request->validate([
            'diet' => 'sometimes|string|max:100',
            'drink' => 'sometimes|string|max:100',
            'smoke' => 'sometimes|string|max:100',
            'living_with' => 'sometimes|string|max:100',
            'sleep_schedule' => 'sometimes|string|in:early_bird,night_owl,flexible',
            'personality_tags' => 'sometimes|array',
            'hobbies' => 'sometimes|string',
            'interests' => 'sometimes|string',
            'music' => 'sometimes|string',
            'books' => 'sometimes|string',
            'movies' => 'sometimes|string',
            'sports' => 'sometimes|string',
            'fitness_activities' => 'sometimes|string',
            'affection' => 'sometimes|string|max:255',
            'humor' => 'sometimes|string|max:255',
            'political_views' => 'sometimes|string',
        ]);

        // Update lifestyles table
        $lifestyleData = array_filter([
            'diet' => $data['diet'] ?? null,
            'drink' => $data['drink'] ?? null,
            'smoke' => $data['smoke'] ?? null,
            'living_with' => $data['living_with'] ?? null,
            'sleep_schedule' => $data['sleep_schedule'] ?? null,
            'personality_tags' => isset($data['personality_tags']) ? json_encode($data['personality_tags']) : null,
        ], fn ($v) => $v !== null);

        if (! empty($lifestyleData)) {
            DB::table('lifestyles')->updateOrInsert(
                ['user_id' => $user->id],
                array_merge($lifestyleData, ['updated_at' => now()])
            );
        }

        // Update hobbies table
        $hobbiesData = array_filter([
            'hobbies' => $data['hobbies'] ?? null,
            'interests' => $data['interests'] ?? null,
            'music' => $data['music'] ?? null,
            'books' => $data['books'] ?? null,
            'movies' => $data['movies'] ?? null,
            'sports' => $data['sports'] ?? null,
            'fitness_activities' => $data['fitness_activities'] ?? null,
        ], fn ($v) => $v !== null);

        if (! empty($hobbiesData)) {
            DB::table('hobbies')->updateOrInsert(
                ['user_id' => $user->id],
                array_merge($hobbiesData, ['updated_at' => now()])
            );
        }

        // Update attitudes table
        $attitudesData = array_filter([
            'affection' => $data['affection'] ?? null,
            'humor' => $data['humor'] ?? null,
            'political_views' => $data['political_views'] ?? null,
        ], fn ($v) => $v !== null);

        if (! empty($attitudesData)) {
            DB::table('attitudes')->updateOrInsert(
                ['user_id' => $user->id],
                array_merge($attitudesData, ['updated_at' => now()])
            );
        }

        return $data;
    }

    private function updateCareer(Request $request, User $user): array
    {
        $data = $request->validate([
            'annual_income_range_id' => 'sometimes|integer',
            'education' => 'sometimes|array',
            'education.*.id' => 'sometimes|integer',
            'education.*.degree' => 'required_with:education|string|max:255',
            'education.*.institution' => 'required_with:education|string|max:255',
            'education.*.start' => 'sometimes|integer',
            'education.*.end' => 'sometimes|integer',
            'education.*.present' => 'sometimes|boolean',
            'education.*.is_highest' => 'sometimes|boolean',
            'careers' => 'sometimes|array',
            'careers.*.id' => 'sometimes|integer',
            'careers.*.designation' => 'required_with:careers|string|max:255',
            'careers.*.company' => 'required_with:careers|string|max:255',
            'careers.*.start' => 'sometimes|integer',
            'careers.*.end' => 'sometimes|integer',
            'careers.*.present' => 'sometimes|boolean',
            'careers.*.work_location_type' => 'sometimes|string|in:on_site,remote,hybrid',
        ]);

        // Update member income range
        if (isset($data['annual_income_range_id'])) {
            $user->member?->update(['annual_salary_range_id' => $data['annual_income_range_id']]);
        }

        // Sync education entries
        if (isset($data['education'])) {
            $existingIds = [];
            foreach ($data['education'] as $edu) {
                if (isset($edu['id'])) {
                    DB::table('education')->where('id', $edu['id'])->where('user_id', $user->id)->update([
                        'degree' => $edu['degree'],
                        'institution' => $edu['institution'],
                        'start' => $edu['start'] ?? null,
                        'end' => $edu['end'] ?? null,
                        'present' => $edu['present'] ?? false,
                        'is_highest_degree' => $edu['is_highest'] ?? false,
                        'updated_at' => now(),
                    ]);
                    $existingIds[] = $edu['id'];
                } else {
                    $id = DB::table('education')->insertGetId([
                        'user_id' => $user->id,
                        'degree' => $edu['degree'],
                        'institution' => $edu['institution'],
                        'start' => $edu['start'] ?? null,
                        'end' => $edu['end'] ?? null,
                        'present' => $edu['present'] ?? false,
                        'is_highest_degree' => $edu['is_highest'] ?? false,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                    $existingIds[] = $id;
                }
            }
            // Delete removed entries
            DB::table('education')->where('user_id', $user->id)->whereNotIn('id', $existingIds)->delete();
        }

        // Sync career entries
        if (isset($data['careers'])) {
            $existingIds = [];
            foreach ($data['careers'] as $career) {
                if (isset($career['id'])) {
                    DB::table('careers')->where('id', $career['id'])->where('user_id', $user->id)->update([
                        'designation' => $career['designation'],
                        'company' => $career['company'],
                        'start' => $career['start'] ?? null,
                        'end' => $career['end'] ?? null,
                        'present' => $career['present'] ?? false,
                        'work_location_type' => $career['work_location_type'] ?? null,
                        'updated_at' => now(),
                    ]);
                    $existingIds[] = $career['id'];
                } else {
                    $id = DB::table('careers')->insertGetId([
                        'user_id' => $user->id,
                        'designation' => $career['designation'],
                        'company' => $career['company'],
                        'start' => $career['start'] ?? null,
                        'end' => $career['end'] ?? null,
                        'present' => $career['present'] ?? false,
                        'work_location_type' => $career['work_location_type'] ?? null,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                    $existingIds[] = $id;
                }
            }
            DB::table('careers')->where('user_id', $user->id)->whereNotIn('id', $existingIds)->delete();
        }

        return $data;
    }

    private function updateFamily(Request $request, User $user): array
    {
        $data = $request->validate([
            'family_type' => 'sometimes|string|in:nuclear,joint,extended',
            'father' => 'sometimes|string|max:255',
            'mother' => 'sometimes|string|max:255',
            'father_occupation' => 'sometimes|string|max:100',
            'mother_occupation' => 'sometimes|string|max:100',
            'no_of_brothers' => 'sometimes|integer|min:0|max:20',
            'no_of_sisters' => 'sometimes|integer|min:0|max:20',
            'about_parents' => 'sometimes|string',
            'about_siblings' => 'sometimes|string',
            'family_location_city' => 'sometimes|string|max:100',
            'family_location_country' => 'sometimes|string|max:100',
            'religion_id' => 'sometimes|integer',
            'caste_id' => 'sometimes|integer',
            'sub_caste_id' => 'sometimes|integer',
            'gothra' => 'sometimes|string|max:100',
            'ethnicity' => 'sometimes|string|max:255',
            'personal_value' => 'sometimes|string|max:255',
            'family_value_id' => 'sometimes|integer',
        ]);

        // Update families table
        $familyData = array_filter([
            'family_type' => $data['family_type'] ?? null,
            'father' => $data['father'] ?? null,
            'mother' => $data['mother'] ?? null,
            'father_occupation' => $data['father_occupation'] ?? null,
            'mother_occupation' => $data['mother_occupation'] ?? null,
            'no_of_brothers' => $data['no_of_brothers'] ?? null,
            'no_of_sisters' => $data['no_of_sisters'] ?? null,
            'about_parents' => $data['about_parents'] ?? null,
            'about_siblings' => $data['about_siblings'] ?? null,
            'location_city' => $data['family_location_city'] ?? null,
            'location_country' => $data['family_location_country'] ?? null,
        ], fn ($v) => $v !== null);

        if (! empty($familyData)) {
            DB::table('families')->updateOrInsert(
                ['user_id' => $user->id],
                array_merge($familyData, ['updated_at' => now()])
            );
        }

        // Update spiritual backgrounds
        $spiritualData = array_filter([
            'religion_id' => $data['religion_id'] ?? null,
            'caste_id' => $data['caste_id'] ?? null,
            'sub_caste_id' => $data['sub_caste_id'] ?? null,
            'gothra' => $data['gothra'] ?? null,
            'ethnicity' => $data['ethnicity'] ?? null,
            'personal_value' => $data['personal_value'] ?? null,
            'family_value_id' => $data['family_value_id'] ?? null,
        ], fn ($v) => $v !== null);

        if (! empty($spiritualData)) {
            DB::table('spiritual_backgrounds')->updateOrInsert(
                ['user_id' => $user->id],
                array_merge($spiritualData, ['updated_at' => now()])
            );
        }

        return $data;
    }

    private function updatePreferences(Request $request, User $user): array
    {
        $data = $request->validate([
            'min_age' => 'sometimes|integer|min:18|max:80',
            'max_age' => 'sometimes|integer|min:18|max:80',
            'height' => 'sometimes|numeric|min:3|max:8',
            'weight' => 'sometimes|numeric|min:30|max:300',
            'marital_status_id' => 'sometimes|integer',
            'children_acceptable' => 'sometimes|string|max:50',
            'religion_id' => 'sometimes|integer',
            'caste_id' => 'sometimes|integer',
            'education' => 'sometimes|string|max:255',
            'profession' => 'sometimes|string|max:50',
            'smoking_acceptable' => 'sometimes|string|max:50',
            'drinking_acceptable' => 'sometimes|string|max:50',
            'diet' => 'sometimes|string|max:50',
            'body_type' => 'sometimes|string|max:50',
            'complexion' => 'sometimes|string|max:50',
            'preferred_country_id' => 'sometimes|integer',
            'preferred_state_id' => 'sometimes|integer',
            'priorities' => 'sometimes|array',
        ]);

        $prefsData = array_filter([
            'min_age' => $data['min_age'] ?? null,
            'max_age' => $data['max_age'] ?? null,
            'height' => $data['height'] ?? null,
            'weight' => $data['weight'] ?? null,
            'marital_status_id' => $data['marital_status_id'] ?? null,
            'children_acceptable' => $data['children_acceptable'] ?? null,
            'religion_id' => $data['religion_id'] ?? null,
            'caste_id' => $data['caste_id'] ?? null,
            'education' => $data['education'] ?? null,
            'profession' => $data['profession'] ?? null,
            'smoking_acceptable' => $data['smoking_acceptable'] ?? null,
            'drinking_acceptable' => $data['drinking_acceptable'] ?? null,
            'diet' => $data['diet'] ?? null,
            'body_type' => $data['body_type'] ?? null,
            'complexion' => $data['complexion'] ?? null,
            'preferred_country_id' => $data['preferred_country_id'] ?? null,
            'preferred_state_id' => $data['preferred_state_id'] ?? null,
        ], fn ($v) => $v !== null);

        if (! empty($prefsData)) {
            DB::table('partner_expectations')->updateOrInsert(
                ['user_id' => $user->id],
                array_merge($prefsData, ['updated_at' => now()])
            );
        }

        // Update priorities if provided
        if (isset($data['priorities'])) {
            PartnerPreferencePriority::setBulk($user->id, $data['priorities']);
        }

        return $data;
    }

    private function updateMedia(Request $request, User $user): array
    {
        // Media updates are handled by dedicated upload endpoints
        // This method handles gallery settings only
        $data = $request->validate([
            'gallery' => 'sometimes|array',
            'gallery.*.id' => 'required|integer',
            'gallery.*.privacy_level' => 'sometimes|string|in:public,connections,private,vault',
            'gallery.*.is_main' => 'sometimes|boolean',
            'gallery.*.sort_order' => 'sometimes|integer',
        ]);

        if (isset($data['gallery'])) {
            foreach ($data['gallery'] as $img) {
                $updateData = array_filter([
                    'privacy_level' => $img['privacy_level'] ?? null,
                    'is_main_photo' => $img['is_main'] ?? null,
                    'sort_order' => $img['sort_order'] ?? null,
                    'updated_at' => now(),
                ], fn ($v) => $v !== null);

                if (! empty($updateData)) {
                    DB::table('gallery_images')
                        ->where('id', $img['id'])
                        ->where('user_id', $user->id)
                        ->update($updateData);
                }

                // If marked as main, unset others
                if (! empty($img['is_main'])) {
                    DB::table('gallery_images')
                        ->where('user_id', $user->id)
                        ->where('id', '!=', $img['id'])
                        ->update(['is_main_photo' => false]);
                }
            }
        }

        return $data;
    }
}
