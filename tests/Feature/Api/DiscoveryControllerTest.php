<?php

namespace Tests\Feature\Api;

use App\Models\Address;
use App\Models\Career;
use App\Models\Caste;
use App\Models\Country;
use App\Models\JobTitle;
use App\Models\Member;
use App\Models\PhysicalAttribute;
use App\Models\Religion;
use App\Models\Sect;
use App\Models\Shortlist;
use App\Models\SpiritualBackground;
use App\Models\User;
use App\Models\ViewGalleryImage;
use App\Models\ViewProfilePicture;
use App\Utility\MemberUtility;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class DiscoveryControllerTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        Schema::dropAllTables();
        $this->createTestSchema();
        MemberUtility::resetCaches();
    }

    public function test_it_applies_real_discovery_filters_against_backend_fields(): void
    {
        $viewer = $this->createProfile([
            'first_name' => 'Viewer',
            'last_name' => 'User',
            'email' => 'viewer@example.com',
            'gender' => 1,
            'birthday' => now()->subYears(33)->format('Y-m-d'),
            'approved' => 1,
            'verification_info' => 'viewer-verified',
        ]);

        $pakistan = Country::create(['code' => 'PK', 'name' => 'Pakistan', 'status' => 1]);
        $uae = Country::create(['code' => 'AE', 'name' => 'United Arab Emirates', 'status' => 1]);
        $religion = Religion::create(['name' => 'Islam']);
        $sect = Sect::create(['name' => 'Sunni']);
        $caste = Caste::create(['religion_id' => $religion->id, 'name' => 'Jutt']);
        $jobTitle = JobTitle::create(['name' => 'Doctor']);

        $matching = $this->createProfile([
            'first_name' => 'Match',
            'last_name' => 'Candidate',
            'email' => 'match@example.com',
            'gender' => 2,
            'birthday' => now()->subYears(30)->format('Y-m-d'),
            'approved' => 1,
            'verification_info' => 'verified-doc',
            'country_id' => $pakistan->id,
            'religion_id' => $religion->id,
            'sect_id' => $sect->id,
            'caste_id' => $caste->id,
            'job_title_id' => $jobTitle->id,
            'designation' => 'Doctor',
            'height' => 5.6,
        ]);

        $this->createProfile([
            'first_name' => 'Other',
            'last_name' => 'Candidate',
            'email' => 'other@example.com',
            'gender' => 2,
            'birthday' => now()->subYears(30)->format('Y-m-d'),
            'approved' => 1,
            'verification_info' => 'verified-doc',
            'country_id' => $uae->id,
            'religion_id' => $religion->id,
            'sect_id' => $sect->id,
            'caste_id' => $caste->id,
            'job_title_id' => $jobTitle->id,
            'designation' => 'Doctor',
            'height' => 5.7,
        ]);

        Sanctum::actingAs($viewer);

        $response = $this->getJson('/api/discovery/search?'.http_build_query([
            'verified' => 'yes',
            'age_min' => 28,
            'age_max' => 32,
            'country' => (string) $pakistan->id,
            'religion' => (string) $religion->id,
            'sect' => (string) $sect->id,
            'caste' => (string) $caste->id,
            'job_title_id' => (string) $jobTitle->id,
        ]));

        $response->assertOk();
        $response->assertJsonPath('result', true);
        $response->assertJsonPath('pagination.total', 1);
        $response->assertJsonCount(1, 'data');
        $response->assertJsonPath('data.0.id', $matching->id);
    }

    public function test_it_respects_verified_only_search_filter(): void
    {
        $viewer = $this->createProfile([
            'first_name' => 'Viewer',
            'last_name' => 'User',
            'email' => 'verified-viewer@example.com',
            'gender' => 1,
            'birthday' => now()->subYears(33)->format('Y-m-d'),
            'approved' => 1,
            'verification_info' => 'viewer-verified',
        ]);

        $country = Country::create(['code' => 'PK', 'name' => 'Pakistan', 'status' => 1]);
        $religion = Religion::create(['name' => 'Islam']);
        $sect = Sect::create(['name' => 'Sunni']);
        $caste = Caste::create(['religion_id' => $religion->id, 'name' => 'Jutt']);
        $jobTitle = JobTitle::create(['name' => 'Doctor']);

        $verified = $this->createProfile([
            'first_name' => 'Verified',
            'last_name' => 'Candidate',
            'email' => 'verified@example.com',
            'gender' => 2,
            'birthday' => now()->subYears(29)->format('Y-m-d'),
            'approved' => 1,
            'verification_info' => 'verified-doc',
            'country_id' => $country->id,
            'religion_id' => $religion->id,
            'sect_id' => $sect->id,
            'caste_id' => $caste->id,
            'job_title_id' => $jobTitle->id,
            'designation' => 'Doctor',
            'height' => 5.5,
        ]);

        $unverified = $this->createProfile([
            'first_name' => 'Unverified',
            'last_name' => 'Candidate',
            'email' => 'unverified@example.com',
            'gender' => 2,
            'birthday' => now()->subYears(29)->format('Y-m-d'),
            'approved' => 1,
            'verification_info' => null,
            'country_id' => $country->id,
            'religion_id' => $religion->id,
            'sect_id' => $sect->id,
            'caste_id' => $caste->id,
            'job_title_id' => $jobTitle->id,
            'designation' => 'Doctor',
            'height' => 5.4,
        ]);

        Sanctum::actingAs($viewer);

        $response = $this->getJson('/api/discovery/search?'.http_build_query([
            'verified' => 'yes',
            'country' => (string) $country->id,
            'religion' => (string) $religion->id,
            'sect' => (string) $sect->id,
            'caste' => (string) $caste->id,
            'job_title_id' => (string) $jobTitle->id,
        ]));

        $response->assertOk();
        $response->assertJsonPath('pagination.total', 1);
        $response->assertJsonCount(1, 'data');
        $response->assertJsonPath('data.0.id', $verified->id);
        $this->assertNotEquals($verified->id, $unverified->id);
    }

    public function test_it_never_serializes_zero_age_for_profiles_missing_birthday(): void
    {
        $viewer = $this->createProfile([
            'first_name' => 'Viewer',
            'last_name' => 'User',
            'email' => 'zero-age-viewer@example.com',
            'gender' => 1,
            'birthday' => now()->subYears(33)->format('Y-m-d'),
            'approved' => 1,
            'verification_info' => 'viewer-verified',
        ]);

        $country = Country::create(['code' => 'PK', 'name' => 'Pakistan', 'status' => 1]);
        $religion = Religion::create(['name' => 'Islam']);
        $sect = Sect::create(['name' => 'Sunni']);
        $caste = Caste::create(['religion_id' => $religion->id, 'name' => 'Jutt']);
        $jobTitle = JobTitle::create(['name' => 'Doctor']);

        $missingDobProfile = $this->createProfile([
            'first_name' => 'No',
            'last_name' => 'Birthday',
            'email' => 'no-birthday@example.com',
            'gender' => 2,
            'birthday' => null,
            'approved' => 1,
            'verification_info' => 'verified-doc',
            'country_id' => $country->id,
            'religion_id' => $religion->id,
            'sect_id' => $sect->id,
            'caste_id' => $caste->id,
            'job_title_id' => $jobTitle->id,
            'designation' => 'Doctor',
            'height' => 5.5,
        ]);

        Sanctum::actingAs($viewer);

        $response = $this->getJson('/api/discovery/search?'.http_build_query([
            'verified' => 'yes',
            'country' => (string) $country->id,
            'religion' => (string) $religion->id,
            'sect' => (string) $sect->id,
            'caste' => (string) $caste->id,
            'job_title_id' => (string) $jobTitle->id,
        ]));

        $response->assertOk();
        $response->assertJsonPath('pagination.total', 1);
        $response->assertJsonPath('data.0.id', $missingDobProfile->id);
        $response->assertJsonPath('data.0.age', null);
    }

    public function test_it_exposes_bookmark_copy_for_shortlist_state(): void
    {
        $viewer = $this->createProfile([
            'first_name' => 'Viewer',
            'last_name' => 'User',
            'email' => 'bookmark-viewer@example.com',
            'gender' => 1,
            'birthday' => now()->subYears(33)->format('Y-m-d'),
            'approved' => 1,
            'verification_info' => 'viewer-verified',
        ]);

        $target = $this->createProfile([
            'first_name' => 'Target',
            'last_name' => 'User',
            'email' => 'bookmark-target@example.com',
            'gender' => 2,
            'birthday' => now()->subYears(29)->format('Y-m-d'),
            'approved' => 1,
            'verification_info' => 'verified-doc',
        ]);

        Sanctum::actingAs($viewer);

        $before = MemberUtility::member_shortlist_info($target->id);
        $this->assertSame(1, $before['shortlist_status']);
        $this->assertSame('Bookmark', $before['shortlist_text']);

        Shortlist::create([
            'user_id' => $target->id,
            'shortlisted_by' => $viewer->id,
        ]);
        MemberUtility::resetCaches();

        $after = MemberUtility::member_shortlist_info($target->id);
        $this->assertSame(0, $after['shortlist_status']);
        $this->assertSame('Bookmarked', $after['shortlist_text']);
    }

    public function test_it_returns_only_bookmarked_profiles_in_discovery_index(): void
    {
        $viewer = $this->createProfile([
            'first_name' => 'Viewer',
            'last_name' => 'User',
            'email' => 'bookmarked-index-viewer@example.com',
            'gender' => 1,
            'birthday' => now()->subYears(33)->format('Y-m-d'),
            'approved' => 1,
            'verification_info' => 'viewer-verified',
        ]);

        $country = Country::create(['code' => 'PK', 'name' => 'Pakistan', 'status' => 1]);
        $religion = Religion::create(['name' => 'Islam']);
        $sect = Sect::create(['name' => 'Sunni']);
        $caste = Caste::create(['religion_id' => $religion->id, 'name' => 'Jutt']);
        $jobTitle = JobTitle::create(['name' => 'Doctor']);

        $bookmarked = $this->createProfile([
            'first_name' => 'Bookmarked',
            'last_name' => 'Match',
            'email' => 'bookmarked-match@example.com',
            'gender' => 2,
            'birthday' => now()->subYears(30)->format('Y-m-d'),
            'approved' => 1,
            'verification_info' => 'verified-doc',
            'country_id' => $country->id,
            'religion_id' => $religion->id,
            'sect_id' => $sect->id,
            'caste_id' => $caste->id,
            'job_title_id' => $jobTitle->id,
            'designation' => 'Doctor',
            'height' => 5.6,
        ]);

        $unbookmarked = $this->createProfile([
            'first_name' => 'Unbookmarked',
            'last_name' => 'Match',
            'email' => 'unbookmarked-match@example.com',
            'gender' => 2,
            'birthday' => now()->subYears(30)->format('Y-m-d'),
            'approved' => 1,
            'verification_info' => 'verified-doc',
            'country_id' => $country->id,
            'religion_id' => $religion->id,
            'sect_id' => $sect->id,
            'caste_id' => $caste->id,
            'job_title_id' => $jobTitle->id,
            'designation' => 'Doctor',
            'height' => 5.6,
        ]);

        Shortlist::create([
            'user_id' => $bookmarked->id,
            'shortlisted_by' => $viewer->id,
        ]);
        MemberUtility::resetCaches();

        Sanctum::actingAs($viewer);

        $response = $this->getJson('/api/discovery?'.http_build_query([
            'bookmarked' => 'yes',
        ]));

        $response->assertOk();
        $response->assertJsonPath('result', true);
        $response->assertJsonPath('pagination.total', 1);
        $response->assertJsonCount(1, 'data.all_profiles');
        $response->assertJsonPath('data.all_profiles.0.id', $bookmarked->id);
        $response->assertJsonPath('data.all_profiles.0.shortlist_status', 0);
        $this->assertNotEquals($unbookmarked->id, $bookmarked->id);
    }

    public function test_it_returns_canonical_photo_request_state_through_discovery_and_public_profile_payloads(): void
    {
        DB::table('settings')->where('type', 'profile_picture_privacy')->update(['value' => 'only_me']);

        $viewer = $this->createProfile([
            'first_name' => 'Viewer',
            'last_name' => 'User',
            'email' => 'photo-viewer@example.com',
            'gender' => 1,
            'birthday' => now()->subYears(33)->format('Y-m-d'),
            'approved' => 1,
            'verification_info' => 'viewer-verified',
        ]);

        $target = $this->createProfile([
            'first_name' => 'Target',
            'last_name' => 'User',
            'email' => 'photo-target@example.com',
            'gender' => 2,
            'birthday' => now()->subYears(29)->format('Y-m-d'),
            'approved' => 1,
            'verification_info' => 'verified-doc',
            'photo' => 'uploads/all/test-profile-photo.jpg',
            'photo_approved' => 1,
        ]);

        Sanctum::actingAs($viewer);

        $discoveryBefore = $this->getJson('/api/discovery');
        $discoveryBefore->assertOk();
        $discoveryBefore->assertJsonPath('data.all_profiles.0.id', $target->id);
        $discoveryBefore->assertJsonPath('data.all_profiles.0.profile_photo_request_state', 'none');

        $requestResponse = $this->postJson('/api/member/profile-picture-view-request', ['id' => $target->id]);
        $requestResponse->assertOk();
        $requestResponse->assertJsonPath('result', true);

        Sanctum::actingAs($target);
        $blurResponse = $this->postJson('/api/member/profile/visibility', [
            'profile_photo_blur' => true,
        ]);
        $blurResponse->assertOk();
        $blurResponse->assertJsonPath('data.profile_photo_blur', true);

        MemberUtility::resetCaches();

        Sanctum::actingAs($viewer);
        $discoveryPending = $this->getJson('/api/discovery');
        $discoveryPending->assertOk();
        $discoveryPending->assertJsonPath('data.all_profiles.0.profile_photo_request_state', 'pending');
        $discoveryPending->assertJsonPath('data.all_profiles.0.profile_photo_request_requested', true);
        $discoveryPending->assertJsonPath('data.all_profiles.0.profile_photo_blur', true);

        $publicPending = $this->getJson('/api/member/public-profile/'.$target->id);
        $publicPending->assertOk();
        $publicPending->assertJsonPath('data.basic_info.profile_photo_request_state', 'pending');
        $publicPending->assertJsonPath('data.basic_info.profile_photo_request_requested', true);
        $publicPending->assertJsonPath('data.basic_info.profile_photo_blur', true);
        $publicPending->assertJsonPath('data.profile_photo_request_state', 'pending');
        $publicPending->assertJsonPath('data.profile_pic_request', true);

        $requestId = ViewProfilePicture::query()->latest('id')->value('id');
        $this->assertNotNull($requestId);

        Sanctum::actingAs($target);
        $acceptResponse = $this->postJson('/api/member/profile-picture-view-request/accept', [
            'profile_pic_view_request_id' => $requestId,
        ]);
        $acceptResponse->assertOk();
        $acceptResponse->assertJsonPath('result', true);

        MemberUtility::resetCaches();
        Sanctum::actingAs($viewer);

        $discoveryApproved = $this->getJson('/api/discovery');
        $discoveryApproved->assertOk();
        $discoveryApproved->assertJsonPath('data.all_profiles.0.profile_photo_request_state', 'approved');
        $discoveryApproved->assertJsonPath('data.all_profiles.0.profile_photo_request_approved', true);
        $discoveryApproved->assertJsonPath('data.all_profiles.0.profile_photo_blur', true);

        $publicApproved = $this->getJson('/api/member/public-profile/'.$target->id);
        $publicApproved->assertOk();
        $publicApproved->assertJsonPath('data.basic_info.profile_photo_request_state', 'approved');
        $publicApproved->assertJsonPath('data.basic_info.profile_photo_request_approved', true);
        $publicApproved->assertJsonPath('data.basic_info.profile_photo_blur', true);
        $publicApproved->assertJsonPath('data.profile_photo_request_state', 'approved');
        $publicApproved->assertJsonPath('data.profile_pic_request', false);
    }

    public function test_it_blocks_duplicate_photo_access_requests_and_marks_the_card_pending(): void
    {
        $viewer = $this->createProfile([
            'first_name' => 'Viewer',
            'last_name' => 'User',
            'email' => 'photo-dup-viewer@example.com',
            'gender' => 1,
            'birthday' => now()->subYears(33)->format('Y-m-d'),
            'approved' => 1,
            'verification_info' => 'viewer-verified',
        ]);

        $target = $this->createProfile([
            'first_name' => 'Duplicate',
            'last_name' => 'Target',
            'email' => 'photo-dup-target@example.com',
            'gender' => 2,
            'birthday' => now()->subYears(29)->format('Y-m-d'),
            'approved' => 1,
            'verification_info' => 'verified-doc',
            'photo' => 'uploads/all/test-profile-photo.jpg',
            'photo_approved' => 1,
        ]);

        Sanctum::actingAs($viewer);

        $first = $this->postJson('/api/member/profile-picture-view-request', ['id' => $target->id]);
        $first->assertOk();
        $first->assertJsonPath('result', true);

        $second = $this->postJson('/api/member/profile-picture-view-request', ['id' => $target->id]);
        $second->assertOk();
        $second->assertJsonPath('result', false);

        MemberUtility::resetCaches();

        $discovery = $this->getJson('/api/discovery');
        $discovery->assertOk();
        $discovery->assertJsonPath('data.all_profiles.0.profile_photo_request_state', 'pending');
        $discovery->assertJsonPath('data.all_profiles.0.profile_photo_request_text', 'Photo Access Requested');
    }

    public function test_it_returns_canonical_gallery_request_state_through_discovery_and_public_profile_payloads(): void
    {
        DB::table('settings')->where('type', 'gallery_image_privacy')->update(['value' => 'only_me']);

        $viewer = $this->createProfile([
            'first_name' => 'Gallery',
            'last_name' => 'Viewer',
            'email' => 'gallery-viewer@example.com',
            'gender' => 1,
            'birthday' => now()->subYears(34)->format('Y-m-d'),
            'approved' => 1,
            'verification_info' => 'viewer-verified',
        ]);

        $target = $this->createProfile([
            'first_name' => 'Gallery',
            'last_name' => 'Target',
            'email' => 'gallery-target@example.com',
            'gender' => 2,
            'birthday' => now()->subYears(28)->format('Y-m-d'),
            'approved' => 1,
            'verification_info' => 'verified-doc',
            'photo' => 'uploads/all/test-profile-photo.jpg',
            'photo_approved' => 1,
        ]);

        DB::table('gallery_images')->insert([
            'user_id' => $target->id,
            'image' => 'uploads/all/test-gallery-image.jpg',
            'thumbnail' => null,
            'privacy_level' => 'public',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        Sanctum::actingAs($viewer);

        $discoveryBefore = $this->getJson('/api/discovery');
        $discoveryBefore->assertOk();
        $discoveryBefore->assertJsonPath('data.all_profiles.0.id', $target->id);
        $discoveryBefore->assertJsonPath('data.all_profiles.0.gallery_image_request_state', 'none');

        $requestResponse = $this->postJson('/api/member/gallery-image-view-request', ['id' => $target->id]);
        $requestResponse->assertOk();
        $requestResponse->assertJsonPath('result', true);

        MemberUtility::resetCaches();

        $discoveryPending = $this->getJson('/api/discovery');
        $discoveryPending->assertOk();
        $discoveryPending->assertJsonPath('data.all_profiles.0.gallery_image_request_state', 'pending');
        $discoveryPending->assertJsonPath('data.all_profiles.0.gallery_image_request_requested', true);

        $publicPending = $this->getJson('/api/member/public-profile/'.$target->id);
        $publicPending->assertOk();
        $publicPending->assertJsonPath('data.basic_info.gallery_image_request_state', 'pending');
        $publicPending->assertJsonPath('data.basic_info.gallery_image_request_requested', true);
        $publicPending->assertJsonPath('data.gallery_image_request_state', 'pending');
        $publicPending->assertJsonPath('data.photo_gallery.0.image_path', static_asset('assets/img/placeholder.jpg'));

        $requestId = ViewGalleryImage::query()->latest('id')->value('id');
        $this->assertNotNull($requestId);

        Sanctum::actingAs($target);
        $acceptResponse = $this->postJson('/api/member/gallery-image-view-request/accept', [
            'gallery_image_view_request_id' => $requestId,
        ]);
        $acceptResponse->assertOk();
        $acceptResponse->assertJsonPath('result', true);

        MemberUtility::resetCaches();
        Sanctum::actingAs($viewer);

        $discoveryApproved = $this->getJson('/api/discovery');
        $discoveryApproved->assertOk();
        $discoveryApproved->assertJsonPath('data.all_profiles.0.gallery_image_request_state', 'approved');
        $discoveryApproved->assertJsonPath('data.all_profiles.0.gallery_image_request_approved', true);

        $publicApproved = $this->getJson('/api/member/public-profile/'.$target->id);
        $publicApproved->assertOk();
        $publicApproved->assertJsonPath('data.basic_info.gallery_image_request_state', 'approved');
        $publicApproved->assertJsonPath('data.basic_info.gallery_image_request_approved', true);
        $publicApproved->assertJsonPath('data.gallery_image_request_state', 'approved');
        $publicApproved->assertJsonPath('data.photo_gallery.0.image_path', uploaded_asset('uploads/all/test-gallery-image.jpg'));
    }

    public function test_it_blocks_duplicate_gallery_access_requests_and_marks_the_card_pending(): void
    {
        DB::table('settings')->where('type', 'gallery_image_privacy')->update(['value' => 'only_me']);

        $viewer = $this->createProfile([
            'first_name' => 'Gallery',
            'last_name' => 'Duplicate Viewer',
            'email' => 'gallery-dup-viewer@example.com',
            'gender' => 1,
            'birthday' => now()->subYears(33)->format('Y-m-d'),
            'approved' => 1,
            'verification_info' => 'viewer-verified',
        ]);

        $target = $this->createProfile([
            'first_name' => 'Gallery',
            'last_name' => 'Duplicate Target',
            'email' => 'gallery-dup-target@example.com',
            'gender' => 2,
            'birthday' => now()->subYears(29)->format('Y-m-d'),
            'approved' => 1,
            'verification_info' => 'verified-doc',
            'photo' => 'uploads/all/test-profile-photo.jpg',
            'photo_approved' => 1,
        ]);

        DB::table('gallery_images')->insert([
            'user_id' => $target->id,
            'image' => 'uploads/all/test-gallery-image.jpg',
            'thumbnail' => null,
            'privacy_level' => 'public',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        Sanctum::actingAs($viewer);

        $first = $this->postJson('/api/member/gallery-image-view-request', ['id' => $target->id]);
        $first->assertOk();
        $first->assertJsonPath('result', true);

        $second = $this->postJson('/api/member/gallery-image-view-request', ['id' => $target->id]);
        $second->assertOk();
        $second->assertJsonPath('result', false);

        MemberUtility::resetCaches();

        $discovery = $this->getJson('/api/discovery');
        $discovery->assertOk();
        $discovery->assertJsonPath('data.all_profiles.0.gallery_image_request_state', 'pending');
        $discovery->assertJsonPath('data.all_profiles.0.gallery_image_request_text', 'Gallery Access Requested');
    }

    public function test_it_returns_none_state_after_photo_access_rejection(): void
    {
        DB::table('settings')->where('type', 'profile_picture_privacy')->update(['value' => 'only_me']);

        $viewer = $this->createProfile([
            'first_name' => 'Viewer',
            'last_name' => 'User',
            'email' => 'photo-reject-viewer@example.com',
            'gender' => 1,
            'birthday' => now()->subYears(33)->format('Y-m-d'),
            'approved' => 1,
            'verification_info' => 'viewer-verified',
        ]);

        $target = $this->createProfile([
            'first_name' => 'Reject',
            'last_name' => 'Target',
            'email' => 'photo-reject-target@example.com',
            'gender' => 2,
            'birthday' => now()->subYears(29)->format('Y-m-d'),
            'approved' => 1,
            'verification_info' => 'verified-doc',
            'photo' => 'uploads/all/test-profile-photo.jpg',
            'photo_approved' => 1,
        ]);

        Sanctum::actingAs($viewer);
        $this->postJson('/api/member/profile-picture-view-request', ['id' => $target->id])->assertOk();
        $requestId = ViewProfilePicture::query()->latest('id')->value('id');
        $this->assertNotNull($requestId);

        Sanctum::actingAs($target);
        $rejectResponse = $this->postJson('/api/member/profile-picture-view-request/reject', [
            'profile_pic_view_request_id' => $requestId,
        ]);
        $rejectResponse->assertOk();
        $rejectResponse->assertJsonPath('result', true);

        MemberUtility::resetCaches();
        Sanctum::actingAs($viewer);

        $discovery = $this->getJson('/api/discovery');
        $discovery->assertOk();
        $discovery->assertJsonPath('data.all_profiles.0.profile_photo_request_state', 'none');

        $publicProfile = $this->getJson('/api/member/public-profile/'.$target->id);
        $publicProfile->assertOk();
        $publicProfile->assertJsonPath('data.basic_info.profile_photo_request_state', 'none');
        $publicProfile->assertJsonPath('data.profile_pic_request', true);
    }

    public function test_it_supports_bookmarked_filter_with_search_filters(): void
    {
        $viewer = $this->createProfile([
            'first_name' => 'Viewer',
            'last_name' => 'User',
            'email' => 'bookmarked-search-viewer@example.com',
            'gender' => 1,
            'birthday' => now()->subYears(33)->format('Y-m-d'),
            'approved' => 1,
            'verification_info' => 'viewer-verified',
        ]);

        $country = Country::create(['code' => 'PK', 'name' => 'Pakistan', 'status' => 1]);
        $religion = Religion::create(['name' => 'Islam']);
        $sect = Sect::create(['name' => 'Sunni']);
        $caste = Caste::create(['religion_id' => $religion->id, 'name' => 'Jutt']);
        $jobTitle = JobTitle::create(['name' => 'Doctor']);

        $matching = $this->createProfile([
            'first_name' => 'Matching',
            'last_name' => 'Bookmark',
            'email' => 'matching-bookmark@example.com',
            'gender' => 2,
            'birthday' => now()->subYears(30)->format('Y-m-d'),
            'approved' => 1,
            'verification_info' => 'verified-doc',
            'country_id' => $country->id,
            'religion_id' => $religion->id,
            'sect_id' => $sect->id,
            'caste_id' => $caste->id,
            'job_title_id' => $jobTitle->id,
            'designation' => 'Doctor',
            'height' => 5.6,
        ]);

        $wrongProfession = $this->createProfile([
            'first_name' => 'Wrong',
            'last_name' => 'Profession',
            'email' => 'wrong-profession@example.com',
            'gender' => 2,
            'birthday' => now()->subYears(30)->format('Y-m-d'),
            'approved' => 1,
            'verification_info' => 'verified-doc',
            'country_id' => $country->id,
            'religion_id' => $religion->id,
            'sect_id' => $sect->id,
            'caste_id' => $caste->id,
            'job_title_id' => $jobTitle->id,
            'designation' => 'Engineer',
            'height' => 5.6,
        ]);

        $wrongAge = $this->createProfile([
            'first_name' => 'Wrong',
            'last_name' => 'Age',
            'email' => 'wrong-age@example.com',
            'gender' => 2,
            'birthday' => now()->subYears(40)->format('Y-m-d'),
            'approved' => 1,
            'verification_info' => 'verified-doc',
            'country_id' => $country->id,
            'religion_id' => $religion->id,
            'sect_id' => $sect->id,
            'caste_id' => $caste->id,
            'job_title_id' => $jobTitle->id,
            'designation' => 'Doctor',
            'height' => 5.6,
        ]);

        Shortlist::create([
            'user_id' => $matching->id,
            'shortlisted_by' => $viewer->id,
        ]);
        Shortlist::create([
            'user_id' => $wrongProfession->id,
            'shortlisted_by' => $viewer->id,
        ]);
        Shortlist::create([
            'user_id' => $wrongAge->id,
            'shortlisted_by' => $viewer->id,
        ]);
        MemberUtility::resetCaches();

        Sanctum::actingAs($viewer);

        $response = $this->getJson('/api/discovery/search?'.http_build_query([
            'bookmarked' => 'yes',
            'age_min' => 28,
            'age_max' => 32,
            'country' => (string) $country->id,
            'religion' => (string) $religion->id,
            'sect' => (string) $sect->id,
            'caste' => (string) $caste->id,
            'job_title_id' => (string) $jobTitle->id,
            'profession' => 'Doctor',
        ]));

        $response->assertOk();
        $response->assertJsonPath('result', true);
        $response->assertJsonPath('pagination.total', 1);
        $response->assertJsonCount(1, 'data');
        $response->assertJsonPath('data.0.id', $matching->id);
        $response->assertJsonPath('data.0.shortlist_status', 0);
        $this->assertNotEquals($wrongProfession->id, $matching->id);
        $this->assertNotEquals($wrongAge->id, $matching->id);
    }

    public function test_it_returns_an_empty_bookmarked_result_set_when_no_profiles_are_saved(): void
    {
        $viewer = $this->createProfile([
            'first_name' => 'Viewer',
            'last_name' => 'User',
            'email' => 'empty-bookmark-viewer@example.com',
            'gender' => 1,
            'birthday' => now()->subYears(33)->format('Y-m-d'),
            'approved' => 1,
            'verification_info' => 'viewer-verified',
        ]);

        Sanctum::actingAs($viewer);

        $response = $this->getJson('/api/discovery?'.http_build_query([
            'bookmarked' => 'yes',
        ]));

        $response->assertOk();
        $response->assertJsonPath('result', true);
        $response->assertJsonPath('pagination.total', 0);
        $response->assertJsonPath('pagination.current_page', 1);
        $response->assertJsonPath('pagination.last_page', 1);
        $response->assertJsonCount(0, 'data.all_profiles');
    }

    public function test_it_updates_profile_visibility_and_incognito_state_from_the_privacy_endpoint(): void
    {
        $viewer = $this->createProfile([
            'first_name' => 'Viewer',
            'last_name' => 'User',
            'email' => 'privacy-viewer@example.com',
            'gender' => 1,
            'birthday' => now()->subYears(34)->format('Y-m-d'),
            'approved' => 1,
            'verification_info' => 'viewer-verified',
            'membership' => 2,
            'package_validity' => now()->addDays(30)->format('Y-m-d'),
            'remaining_profile_viewer_view' => 1,
        ]);

        $candidate = $this->createProfile([
            'first_name' => 'Privacy',
            'last_name' => 'Candidate',
            'email' => 'privacy-candidate@example.com',
            'gender' => 2,
            'birthday' => now()->subYears(29)->format('Y-m-d'),
            'approved' => 1,
            'verification_info' => 'candidate-verified',
            'package_validity' => now()->addDays(30)->format('Y-m-d'),
            'remaining_profile_viewer_view' => 1,
        ]);

        Sanctum::actingAs($viewer);

        $visibleResponse = $this->getJson('/api/discovery/search');
        $visibleResponse->assertOk();
        $visibleResponse->assertJsonPath('pagination.total', 1);
        $visibleResponse->assertJsonPath('data.0.id', $candidate->id);

        DB::table('profile_viewers')->delete();
        $baselineProfile = $this->getJson('/api/member/public-profile/'.$candidate->id);
        $baselineProfile->assertOk();
        $this->assertSame(1, DB::table('profile_viewers')->count());

        Sanctum::actingAs($candidate);
        $disableVisibility = $this->postJson('/api/member/profile/visibility', [
            'profile_visible' => false,
        ]);
        $disableVisibility->assertOk();
        $disableVisibility->assertJsonPath('data.profile_visible', false);

        Sanctum::actingAs($viewer);
        $hiddenResponse = $this->getJson('/api/discovery/search');
        $hiddenResponse->assertOk();
        $hiddenResponse->assertJsonPath('pagination.total', 0);

        Sanctum::actingAs($candidate);
        $enableVisibility = $this->postJson('/api/member/profile/visibility', [
            'profile_visible' => true,
        ]);
        $enableVisibility->assertOk();
        $enableVisibility->assertJsonPath('data.profile_visible', true);

        Sanctum::actingAs($viewer);
        $toggleIncognito = $this->postJson('/api/member/profile/visibility', [
            'incognito' => true,
        ]);
        $toggleIncognito->assertOk();
        $toggleIncognito->assertJsonPath('data.incognito', true);

        Sanctum::actingAs($candidate);
        $toggleBlur = $this->postJson('/api/member/profile/visibility', [
            'profile_photo_blur' => true,
        ]);
        $toggleBlur->assertOk();
        $toggleBlur->assertJsonPath('data.profile_photo_blur', true);

        $visibilitySnapshot = $this->getJson('/api/member/profile/visibility');
        $visibilitySnapshot->assertOk();
        $visibilitySnapshot->assertJsonPath('data.profile_photo_blur', true);

        Sanctum::actingAs($viewer);
        $visibleAgain = $this->getJson('/api/discovery/search');
        $visibleAgain->assertOk();
        $visibleAgain->assertJsonPath('pagination.total', 1);
        $visibleAgain->assertJsonPath('data.0.id', $candidate->id);
        $visibleAgain->assertJsonPath('data.0.profile_photo_blur', true);

        DB::table('profile_viewers')->delete();
        DB::table('members')->where('user_id', $candidate->id)->update(['remaining_profile_viewer_view' => 1]);

        $profileResponse = $this->getJson('/api/member/public-profile/'.$candidate->id);
        $profileResponse->assertOk();
        $profileResponse->assertJsonPath('data.basic_info.profile_photo_blur', true);
        $this->assertSame(0, DB::table('profile_viewers')->count());
    }

    public function test_it_applies_the_photo_visibility_policy_to_profile_and_gallery_media(): void
    {
        $viewer = $this->createProfile([
            'first_name' => 'Media',
            'last_name' => 'Viewer',
            'email' => 'media-viewer@example.com',
            'gender' => 1,
            'birthday' => now()->subYears(35)->format('Y-m-d'),
            'approved' => 1,
            'verification_info' => 'viewer-verified',
        ]);

        $candidate = $this->createProfile([
            'first_name' => 'Media',
            'last_name' => 'Candidate',
            'email' => 'media-candidate@example.com',
            'gender' => 2,
            'birthday' => now()->subYears(28)->format('Y-m-d'),
            'approved' => 1,
            'verification_info' => 'candidate-verified',
            'photo' => 'uploads/all/test-photo.jpg',
            'photo_approved' => 1,
        ]);

        DB::table('gallery_images')->insert([
            'user_id' => $candidate->id,
            'image' => 'uploads/all/gallery-photo.jpg',
            'privacy_level' => 'public',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        Sanctum::actingAs($candidate);
        $membersOnly = $this->postJson('/api/member/profile/visibility', [
            'photo_visibility_public' => false,
            'photo_visibility_members' => true,
        ]);
        $membersOnly->assertOk();
        $membersOnly->assertJsonPath('data.photo_visibility_public', false);
        $membersOnly->assertJsonPath('data.photo_visibility_members', true);

        Sanctum::actingAs($viewer);
        $membersOnlyProfile = $this->getJson('/api/member/public-profile/'.$candidate->id);
        $membersOnlyProfile->assertOk();
        $membersOnlyProfile->assertJsonPath('data.profile_photo_request_required', false);
        $membersOnlyProfile->assertJsonPath('data.gallery_image_request_required', false);
        $membersOnlyProfile->assertJsonPath('data.basic_info.profile_photo_accessible', true);
        $membersOnlyProfile->assertJsonPath('data.basic_info.gallery_image_accessible', true);

        Sanctum::actingAs($candidate);
        $requestOnly = $this->postJson('/api/member/profile/visibility', [
            'photo_visibility_public' => false,
            'photo_visibility_members' => false,
        ]);
        $requestOnly->assertOk();
        $requestOnly->assertJsonPath('data.photo_visibility_public', false);
        $requestOnly->assertJsonPath('data.photo_visibility_members', false);

        Sanctum::actingAs($viewer);
        $requestOnlyProfile = $this->getJson('/api/member/public-profile/'.$candidate->id);
        $requestOnlyProfile->assertOk();
        $requestOnlyProfile->assertJsonPath('data.profile_photo_request_required', true);
        $requestOnlyProfile->assertJsonPath('data.gallery_image_request_required', true);
        $requestOnlyProfile->assertJsonPath('data.basic_info.profile_photo_accessible', false);
        $requestOnlyProfile->assertJsonPath('data.basic_info.gallery_image_accessible', false);
        $this->assertTrue(str_contains((string) $requestOnlyProfile->json('data.basic_info.photo'), 'avatar-place') || str_contains((string) $requestOnlyProfile->json('data.basic_info.photo'), 'female-avatar-place'));
    }

    public function test_it_returns_the_canonical_anonymous_snapshot_from_the_discovery_settings_endpoint(): void
    {
        $viewer = $this->createProfile([
            'first_name' => 'Anon',
            'last_name' => 'Viewer',
            'email' => 'anon-viewer@example.com',
            'gender' => 1,
            'birthday' => now()->subYears(32)->format('Y-m-d'),
            'approved' => 1,
            'verification_info' => 'viewer-verified',
        ]);

        Sanctum::actingAs($viewer);

        $toggle = $this->postJson('/api/member/discovery/toggle-anonymous');
        $toggle->assertOk();
        $toggle->assertJsonPath('data.incognito', true);
        $toggle->assertJsonPath('data.profile_visible', true);
        $toggle->assertJsonPath('data.photo_visibility_public', true);
        $toggle->assertJsonPath('data.photo_visibility_members', true);

        $status = $this->getJson('/api/member/discovery/anonymous-status');
        $status->assertOk();
        $status->assertJsonPath('data.incognito', true);
        $status->assertJsonPath('data.profile_visible', true);
    }

    public function test_it_persists_full_name_visibility_and_hides_names_across_discovery_and_public_profile(): void
    {
        $viewer = $this->createProfile([
            'first_name' => 'Viewer',
            'last_name' => 'User',
            'email' => 'full-name-viewer@example.com',
            'gender' => 1,
            'birthday' => now()->subYears(32)->format('Y-m-d'),
            'approved' => 1,
            'verification_info' => 'viewer-verified',
        ]);

        $country = Country::create(['code' => 'PK', 'name' => 'Pakistan', 'status' => 1]);
        $religion = Religion::create(['name' => 'Islam']);
        $sect = Sect::create(['name' => 'Sunni']);
        $caste = Caste::create(['religion_id' => $religion->id, 'name' => 'Jutt']);
        $jobTitle = JobTitle::create(['name' => 'Doctor']);

        $candidate = $this->createProfile([
            'first_name' => 'Hidden',
            'last_name' => 'Candidate',
            'email' => 'hidden-candidate@example.com',
            'gender' => 2,
            'birthday' => now()->subYears(29)->format('Y-m-d'),
            'approved' => 1,
            'verification_info' => 'verified-doc',
            'country_id' => $country->id,
            'religion_id' => $religion->id,
            'sect_id' => $sect->id,
            'caste_id' => $caste->id,
            'job_title_id' => $jobTitle->id,
            'designation' => 'Doctor',
            'height' => 5.5,
        ]);

        Sanctum::actingAs($candidate);

        $legacyHide = $this->postJson('/api/member/profile/visibility', [
            'field_name' => 'full_name',
            'is_visible' => false,
        ]);
        $legacyHide->assertOk();
        $legacyHide->assertJsonPath('data.full_name', false);

        $hiddenSnapshot = $this->getJson('/api/member/profile/visibility');
        $hiddenSnapshot->assertOk();
        $hiddenSnapshot->assertJsonPath('data.full_name', false);

        Sanctum::actingAs($viewer);

        $hiddenDiscovery = $this->getJson('/api/discovery/search?'.http_build_query([
            'verified' => 'yes',
            'country' => (string) $country->id,
            'religion' => (string) $religion->id,
            'sect' => (string) $sect->id,
            'caste' => (string) $caste->id,
            'job_title_id' => (string) $jobTitle->id,
        ]));
        $hiddenDiscovery->assertOk();
        $hiddenDiscovery->assertJsonPath('data.0.id', $candidate->id);
        $hiddenDiscovery->assertJsonPath('data.0.name', 'Hidden C.');

        $hiddenPublicProfile = $this->getJson('/api/member/public-profile/'.$candidate->id);
        $hiddenPublicProfile->assertOk();
        $hiddenPublicProfile->assertJsonPath('data.basic_info.firs_name', 'Hidden');
        $hiddenPublicProfile->assertJsonPath('data.basic_info.last_name', 'C.');

        Sanctum::actingAs($candidate);

        $showAgain = $this->postJson('/api/member/profile/visibility', [
            'full_name' => true,
        ]);
        $showAgain->assertOk();
        $showAgain->assertJsonPath('data.full_name', true);

        $visibleSnapshot = $this->getJson('/api/member/profile/visibility');
        $visibleSnapshot->assertOk();
        $visibleSnapshot->assertJsonPath('data.full_name', true);

        Sanctum::actingAs($viewer);

        $visibleDiscovery = $this->getJson('/api/discovery/search?'.http_build_query([
            'verified' => 'yes',
            'country' => (string) $country->id,
            'religion' => (string) $religion->id,
            'sect' => (string) $sect->id,
            'caste' => (string) $caste->id,
            'job_title_id' => (string) $jobTitle->id,
        ]));
        $visibleDiscovery->assertOk();
        $visibleDiscovery->assertJsonPath('data.0.id', $candidate->id);
        $visibleDiscovery->assertJsonPath('data.0.name', 'Hidden Candidate');

        $visiblePublicProfile = $this->getJson('/api/member/public-profile/'.$candidate->id);
        $visiblePublicProfile->assertOk();
        $visiblePublicProfile->assertJsonPath('data.basic_info.firs_name', 'Hidden');
        $visiblePublicProfile->assertJsonPath('data.basic_info.last_name', 'Candidate');
    }

    private function createTestSchema(): void
    {
        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->string('first_name');
            $table->string('last_name');
            $table->string('email')->unique();
            $table->string('password');
            $table->string('code')->nullable();
            $table->string('phone')->nullable();
            $table->unsignedTinyInteger('membership')->default(1);
            $table->unsignedTinyInteger('approved')->default(1);
            $table->string('verification_code')->nullable();
            $table->string('verification_info')->nullable();
            $table->string('fcm_token')->nullable();
            $table->unsignedBigInteger('referred_by')->nullable();
            $table->timestamp('email_verified_at')->nullable();
            $table->string('user_type')->default('member');
            $table->boolean('blocked')->default(0);
            $table->boolean('deactivated')->default(0);
            $table->boolean('photo_approved')->default(0);
            $table->string('photo')->nullable();
            $table->unsignedTinyInteger('must_change_password')->default(0);
            $table->rememberToken();
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('members', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users');
            $table->unsignedTinyInteger('gender');
            $table->date('birthday')->nullable();
            $table->date('package_validity')->nullable();
            $table->integer('remaining_profile_image_view')->default(0);
            $table->integer('remaining_gallery_image_view')->default(0);
            $table->integer('remaining_profile_viewer_view')->default(0);
            $table->unsignedBigInteger('mothere_tongue')->nullable();
            $table->unsignedTinyInteger('is_agent_pick')->default(0);
            $table->unsignedTinyInteger('is_high_intent')->default(0);
            $table->unsignedTinyInteger('travel_mode')->default(0);
            $table->unsignedTinyInteger('is_visible')->default(1);
            $table->string('travel_city')->nullable();
            $table->string('travel_country')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('countries', function (Blueprint $table) {
            $table->id();
            $table->string('code')->nullable();
            $table->string('name');
            $table->unsignedTinyInteger('status')->default(1);
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('states', function (Blueprint $table) {
            $table->id();
            $table->foreignId('country_id')->nullable()->constrained('countries');
            $table->string('name');
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('religions', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('sects', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('on_behalves', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('marital_statuses', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('castes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('religion_id')->constrained('religions');
            $table->string('name');
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('sub_castes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('caste_id')->nullable()->constrained('castes');
            $table->string('name');
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('family_values', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('member_languages', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('job_titles', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('physical_attributes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users');
            $table->decimal('height', 5, 2)->nullable();
            $table->decimal('weight', 5, 2)->nullable();
            $table->string('complexion')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('careers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users');
            $table->string('designation')->nullable();
            $table->foreignId('job_title_id')->nullable()->constrained('job_titles');
            $table->foreignId('speciality_id')->nullable();
            $table->string('company')->nullable();
            $table->integer('start')->nullable();
            $table->integer('end')->nullable();
            $table->boolean('present')->default(0);
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('educations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users');
            $table->string('degree')->nullable();
            $table->string('institution')->nullable();
            $table->integer('start')->nullable();
            $table->integer('end')->nullable();
            $table->boolean('present')->default(0);
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('education', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users');
            $table->string('degree')->nullable();
            $table->string('institution')->nullable();
            $table->integer('start')->nullable();
            $table->integer('end')->nullable();
            $table->boolean('present')->default(0);
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('spiritual_backgrounds', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users');
            $table->foreignId('religion_id')->nullable()->constrained('religions');
            $table->foreignId('sect_id')->nullable()->constrained('sects');
            $table->foreignId('caste_id')->nullable()->constrained('castes');
            $table->unsignedBigInteger('sub_caste_id')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('addresses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users');
            $table->string('type')->default('present');
            $table->foreignId('country_id')->nullable()->constrained('countries');
            $table->unsignedBigInteger('state_id')->nullable();
            $table->unsignedBigInteger('city_id')->nullable();
            $table->string('postal_code')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('settings', function (Blueprint $table) {
            $table->id();
            $table->string('type')->unique();
            $table->text('value')->nullable();
            $table->timestamps();
        });

        Schema::create('addons', function (Blueprint $table) {
            $table->id();
            $table->string('unique_identifier');
            $table->unsignedTinyInteger('activated')->default(0);
            $table->timestamps();
        });

        Schema::create('email_templates', function (Blueprint $table) {
            $table->id();
            $table->string('identifier')->unique();
            $table->unsignedTinyInteger('status')->default(0);
            $table->timestamps();
        });

        Schema::create('translations', function (Blueprint $table) {
            $table->id();
            $table->string('lang', 10);
            $table->string('lang_key');
            $table->text('lang_value');
            $table->timestamps();
            $table->unique(['lang', 'lang_key']);
        });

        Schema::create('view_profile_pictures', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id');
            $table->unsignedBigInteger('requested_by');
            $table->unsignedTinyInteger('status')->default(0);
            $table->timestamps();
        });

        Schema::create('view_gallery_images', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id');
            $table->unsignedBigInteger('requested_by');
            $table->unsignedTinyInteger('status')->default(0);
            $table->timestamps();
        });

        Schema::create('gallery_images', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id');
            $table->string('image')->nullable();
            $table->string('thumbnail')->nullable();
            $table->string('privacy_level')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('field_visibility_settings', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id');
            $table->string('field_name');
            $table->boolean('is_visible')->default(true);
            $table->timestamps();
        });

        Schema::create('profile_viewers', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id');
            $table->unsignedBigInteger('viewed_by');
            $table->timestamps();
        });

        Schema::create('profile_audit_logs', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id');
            $table->string('section');
            $table->string('field_name');
            $table->text('old_value')->nullable();
            $table->text('new_value')->nullable();
            $table->string('ip_address')->nullable();
            $table->string('user_agent')->nullable();
            $table->timestamp('changed_at')->nullable();
            $table->timestamps();
        });

        Schema::create('view_contacts', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id');
            $table->unsignedBigInteger('viewed_by');
            $table->timestamps();
        });

        Schema::create('hobbies', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id');
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('attitudes', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id');
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('recidencies', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id');
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('lifestyles', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id');
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('astrologies', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id');
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('families', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id');
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('partner_expectations', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id');
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('profile_matches', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id');
            $table->unsignedBigInteger('match_id');
            $table->integer('match_percentage')->nullable();
            $table->timestamps();
        });

        Schema::create('shortlists', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id');
            $table->unsignedBigInteger('shortlisted_by');
            $table->timestamps();
        });

        Schema::create('ignored_users', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id');
            $table->unsignedBigInteger('ignored_by');
            $table->timestamps();
        });

        Schema::create('reported_users', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id');
            $table->unsignedBigInteger('reported_by');
            $table->timestamps();
        });

        Schema::create('express_interests', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id');
            $table->unsignedBigInteger('interested_by');
            $table->unsignedTinyInteger('status')->default(0);
            $table->timestamps();
        });

        DB::table('settings')->insert([
            ['type' => 'profile_picture_privacy', 'value' => 'all', 'created_at' => now(), 'updated_at' => now()],
            ['type' => 'gallery_image_privacy', 'value' => 'all', 'created_at' => now(), 'updated_at' => now()],
            ['type' => 'member_present_address_section', 'value' => 'on', 'created_at' => now(), 'updated_at' => now()],
            ['type' => 'member_spiritual_and_social_background_section', 'value' => 'on', 'created_at' => now(), 'updated_at' => now()],
            ['type' => 'member_language_section', 'value' => 'off', 'created_at' => now(), 'updated_at' => now()],
            ['type' => 'full_profile_show_according_to_membership', 'value' => 0, 'created_at' => now(), 'updated_at' => now()],
        ]);

        DB::table('email_templates')->insert([
            [
                'identifier' => 'profile_picture_view_request_email',
                'status' => 0,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'identifier' => 'profile_picture_view_request_accepted_email',
                'status' => 0,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }

    private function createProfile(array $overrides = []): User
    {
        $user = User::create([
            'first_name' => $overrides['first_name'] ?? 'Test',
            'last_name' => $overrides['last_name'] ?? 'User',
            'email' => $overrides['email'] ?? ('user-'.uniqid().'@example.com'),
            'password' => Hash::make('password'),
            'membership' => $overrides['membership'] ?? 1,
            'approved' => $overrides['approved'] ?? 1,
            'user_type' => 'member',
            'email_verified_at' => now(),
        ]);

        DB::table('users')->where('id', $user->id)->update([
            'blocked' => 0,
            'deactivated' => 0,
            'verification_info' => array_key_exists('verification_info', $overrides) ? $overrides['verification_info'] : 'verified',
            'photo' => array_key_exists('photo', $overrides) ? $overrides['photo'] : null,
            'photo_approved' => array_key_exists('photo_approved', $overrides) ? $overrides['photo_approved'] : 0,
        ]);

        $birthday = array_key_exists('birthday', $overrides)
            ? $overrides['birthday']
            : now()->subYears(30)->format('Y-m-d');

        Member::create([
            'user_id' => $user->id,
            'gender' => $overrides['gender'] ?? 2,
            'birthday' => $birthday,
            'package_validity' => array_key_exists('package_validity', $overrides) ? $overrides['package_validity'] : null,
            'remaining_profile_viewer_view' => array_key_exists('remaining_profile_viewer_view', $overrides) ? $overrides['remaining_profile_viewer_view'] : 0,
            'remaining_profile_image_view' => array_key_exists('remaining_profile_image_view', $overrides) ? $overrides['remaining_profile_image_view'] : 0,
            'remaining_gallery_image_view' => array_key_exists('remaining_gallery_image_view', $overrides) ? $overrides['remaining_gallery_image_view'] : 0,
            'is_visible' => 1,
            'is_agent_pick' => 0,
            'is_high_intent' => 0,
            'travel_mode' => 0,
        ]);

        PhysicalAttribute::create([
            'user_id' => $user->id,
            'height' => $overrides['height'] ?? 5.5,
            'weight' => 70,
            'complexion' => 'Fair',
        ]);

        if (! empty($overrides['designation']) || ! empty($overrides['job_title_id'])) {
            Career::create([
                'user_id' => $user->id,
                'designation' => $overrides['designation'] ?? 'Doctor',
                'job_title_id' => $overrides['job_title_id'] ?? null,
                'speciality_id' => $overrides['speciality_id'] ?? null,
                'company' => 'City Hospital',
                'present' => 1,
            ]);
        }

        if (! empty($overrides['religion_id']) || ! empty($overrides['country_id'])) {
            SpiritualBackground::create([
                'user_id' => $user->id,
                'religion_id' => $overrides['religion_id'] ?? null,
                'sect_id' => $overrides['sect_id'] ?? null,
                'caste_id' => $overrides['caste_id'] ?? null,
            ]);
        }

        if (! empty($overrides['country_id'])) {
            Address::create([
                'user_id' => $user->id,
                'type' => 'present',
                'country_id' => $overrides['country_id'],
            ]);
        }

        return $user;
    }
}
