<?php

namespace Tests\Feature\Api;

use App\Http\Resources\NotificationResource;
use App\Models\Chat;
use App\Models\ChatThread;
use App\Models\ExpressInterest;
use App\Models\Family;
use App\Models\FamilyApproval;
use App\Models\FamilyGuardian;
use App\Models\GalleryImage;
use App\Models\Member;
use App\Models\Notification;
use App\Models\SupportTicket;
use App\Models\User;
use App\Models\ViewGalleryImage;
use App\Models\ViewProfilePicture;
use App\Utility\MemberUtility;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class BackendApiRegressionTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        config(['broadcasting.default' => 'null']);

        Schema::dropAllTables();
        $this->createTestSchema();
        MemberUtility::resetCaches();
    }

    public function test_notification_resource_handles_missing_sender_data(): void
    {
        DB::table('notifications')->insert([
            'id' => (string) Str::uuid(),
            'type' => 'database',
            'notifiable_type' => User::class,
            'notifiable_id' => 999,
            'data' => json_encode(['type' => 'system']),
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        $notification = Notification::firstOrFail();

        $payload = (new NotificationResource($notification))->resolve(request());

        $this->assertTrue($payload['check']);
        $this->assertSame('system', $payload['type']);
        $this->assertSame('Notification', $payload['title']);
        $this->assertSame('No details available', $payload['message']);
        $this->assertNull($payload['sender_name']);
    }

    public function test_member_notifications_endpoint_paginates_without_sender(): void
    {
        $user = $this->createMember('viewer@example.com', 1);
        Sanctum::actingAs($user);

        DB::table('notifications')->insert([
            'id' => (string) Str::uuid(),
            'type' => 'database',
            'notifiable_type' => User::class,
            'notifiable_id' => $user->id,
            'data' => json_encode(['message' => 'Welcome']),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $response = $this->getJson('/api/member/notifications');

        $response->assertOk();
        $response->assertJsonPath('result', true);
        $response->assertJsonPath('data.0.title', 'Welcome');
        $response->assertJsonPath('data.0.is_read', false);
    }

    public function test_member_notifications_endpoint_marks_single_item_read(): void
    {
        $user = $this->createMember('reader@example.com', 1);
        Sanctum::actingAs($user);

        $notificationId = (string) Str::uuid();
        DB::table('notifications')->insert([
            'id' => $notificationId,
            'type' => 'database',
            'notifiable_type' => User::class,
            'notifiable_id' => $user->id,
            'data' => json_encode(['title' => 'Read me']),
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        $notification = Notification::findOrFail($notificationId);

        $response = $this->getJson('/api/member/notifications/'.$notification->id);

        $response->assertOk();
        $response->assertJsonPath('result', true);
        $this->assertNotNull($notification->fresh()->read_at);
    }

    public function test_notification_feed_handles_empty_database_notifications(): void
    {
        $user = $this->createMember('feed@example.com', 1);
        Sanctum::actingAs($user);

        $response = $this->getJson('/api/member/notifications/feed');

        $response->assertOk();
        $response->assertJsonPath('result', true);
        $response->assertJsonPath('unread_count', 0);
        $response->assertJsonCount(0, 'notifications.data');
    }

    public function test_interest_requests_ignore_missing_related_member(): void
    {
        $viewer = $this->createMember('target@example.com', 1);
        $sender = $this->createUser('sender@example.com');

        ExpressInterest::create([
            'user_id' => $viewer->id,
            'interested_by' => $sender->id,
            'status' => 0,
        ]);

        Sanctum::actingAs($viewer);

        $response = $this->getJson('/api/member/interest-requests');

        $response->assertOk();
        $response->assertJsonPath('result', true);
        $response->assertJsonCount(1, 'data');
        $response->assertJsonPath('data.0', []);
    }

    public function test_chat_list_handles_empty_threads_and_missing_package(): void
    {
        $viewer = $this->createMember('chat-viewer@example.com', 2);
        $receiver = $this->createMember('chat-receiver@example.com', 2);

        $thread = ChatThread::create([
            'sender_user_id' => $viewer->id,
            'receiver_user_id' => $receiver->id,
            'thread_code' => 'thread-1',
            'active' => 1,
        ]);

        Chat::create([
            'chat_thread_id' => $thread->id,
            'sender_user_id' => $receiver->id,
            'message' => 'Hello',
            'seen' => 0,
        ]);

        Sanctum::actingAs($viewer);

        $response = $this->getJson('/api/member/chat-list');

        $response->assertOk();
        $response->assertJsonPath('result', true);
        $response->assertJsonPath('data.0.last_message', 'Hello');
        $response->assertJsonPath('data.0.unseen_message_count', 1);
    }

    public function test_verified_non_premium_member_can_send_three_chat_messages_before_subscription_required(): void
    {
        $sender = $this->createMember('verified-free-sender@example.com', 1);
        $receiver = $this->createMember('verified-free-receiver@example.com', 2);
        $thread = $this->createChatThread($sender, $receiver, 'verified-free-thread');

        Sanctum::actingAs($sender);

        for ($messageNumber = 1; $messageNumber <= 3; $messageNumber++) {
            $response = $this->postJson('/api/member/chat-reply', [
                'chat_thread_id' => $thread->id,
                'message' => 'Allowed message '.$messageNumber,
            ]);

            $response->assertOk();
            $response->assertJsonPath('result', true);
        }

        $this->assertDatabaseHas('members', [
            'user_id' => $sender->id,
            'unverified_messages_used' => 3,
        ]);

        $response = $this->postJson('/api/member/chat-reply', [
            'chat_thread_id' => $thread->id,
            'message' => 'Blocked message 4',
        ]);

        $response->assertForbidden();
        $response->assertJsonPath('code', 'SUBSCRIPTION_REQUIRED');
        $response->assertJsonPath('free_limit', 3);
        $this->assertDatabaseCount('chats', 3);
    }

    public function test_verified_premium_member_can_send_beyond_three_chat_messages_without_free_counter(): void
    {
        $sender = $this->createMember('verified-premium-sender@example.com', 2);
        $receiver = $this->createMember('verified-premium-receiver@example.com', 2);
        $thread = $this->createChatThread($sender, $receiver, 'verified-premium-thread');

        Sanctum::actingAs($sender);

        for ($messageNumber = 1; $messageNumber <= 4; $messageNumber++) {
            $response = $this->postJson('/api/member/chat-reply', [
                'chat_thread_id' => $thread->id,
                'message' => 'Premium message '.$messageNumber,
            ]);

            $response->assertOk();
            $response->assertJsonPath('result', true);
        }

        $this->assertDatabaseHas('members', [
            'user_id' => $sender->id,
            'unverified_messages_used' => 0,
        ]);
        $this->assertDatabaseCount('chats', 4);
    }

    public function test_unapproved_member_still_uses_unverified_message_quota(): void
    {
        $sender = $this->createMember('unapproved-sender@example.com', 1, ['approved' => 0]);
        $receiver = $this->createMember('unapproved-receiver@example.com', 2);
        $thread = $this->createChatThread($sender, $receiver, 'unapproved-thread');

        Sanctum::actingAs($sender);

        for ($messageNumber = 1; $messageNumber <= 5; $messageNumber++) {
            $response = $this->postJson('/api/member/chat-reply', [
                'chat_thread_id' => $thread->id,
                'message' => 'Unapproved message '.$messageNumber,
            ]);

            $response->assertOk();
            $response->assertJsonPath('result', true);
        }

        $response = $this->postJson('/api/member/chat-reply', [
            'chat_thread_id' => $thread->id,
            'message' => 'Blocked unapproved message 6',
        ]);

        $response->assertForbidden();
        $response->assertJsonPath('code', 'VERIFICATION_REQUIRED');
        $response->assertJsonPath('free_limit', 5);
        $this->assertDatabaseCount('chats', 5);
    }

    public function test_discovery_handles_profiles_with_missing_optional_relations(): void
    {
        $viewer = $this->createMember('discovery-viewer@example.com', 1, ['gender' => 1]);
        $candidate = $this->createMember('candidate@example.com', 1, [
            'gender' => 2,
            'birthday' => null,
            'first_name' => 'No',
            'last_name' => 'Birthday',
        ]);

        Sanctum::actingAs($viewer);

        $response = $this->getJson('/api/discovery');

        $response->assertOk();
        $response->assertJsonPath('result', true);
        $response->assertJsonPath('data.all_profiles.0.id', $candidate->id);
        $response->assertJsonPath('data.all_profiles.0.age', null);
    }

    public function test_state_dropdown_returns_empty_collection_for_unknown_country(): void
    {
        $user = $this->createMember('states@example.com', 1);
        Sanctum::actingAs($user);

        $response = $this->getJson('/api/member/states/166');

        $response->assertOk();
        $response->assertJsonPath('data', []);
    }

    public function test_family_endpoint_renders_approvals_without_profile_photo(): void
    {
        $owner = $this->createMember('family-owner@example.com', 1);
        $target = $this->createMember('family-target@example.com', 1, [
            'first_name' => 'Approval',
            'last_name' => 'Target',
        ]);

        $family = Family::create([
            'user_id' => $owner->id,
            'about_description' => 'Family profile',
            'tradition_level' => 'Balanced',
            'affluence_level' => 'Middle Class',
            'interests' => ['Education'],
        ]);

        $guardian = FamilyGuardian::create([
            'family_id' => $family->id,
            'user_id' => $owner->id,
            'name' => 'Owner Guardian',
            'relationship' => 'Self',
            'is_primary_contact' => true,
        ]);

        FamilyApproval::create([
            'family_id' => $family->id,
            'guardian_id' => $guardian->id,
            'target_user_id' => $target->id,
            'status' => 'pending',
        ]);

        Sanctum::actingAs($owner);

        $response = $this->getJson('/api/family');

        $response->assertOk();
        $response->assertJsonPath('approvals.0.name', 'Approval Target');
        $response->assertJsonPath('approvals.0.status', 'Pending');
    }

    public function test_auth_and_sensitive_api_routes_have_targeted_rate_limits(): void
    {
        $routes = app('router')->getRoutes();

        $this->assertContains(
            'throttle:api-auth',
            $routes->match(request()->create('/api/signin', 'POST'))->gatherMiddleware()
        );
        $this->assertContains(
            'throttle:api-auth',
            $routes->match(request()->create('/api/admin/login', 'POST'))->gatherMiddleware()
        );
        $this->assertContains(
            'throttle:api-sensitive',
            $routes->match(request()->create('/api/forgot/password', 'POST'))->gatherMiddleware()
        );
        $this->assertContains(
            'throttle:api-sensitive',
            $routes->match(request()->create('/api/send-email-verification', 'POST'))->gatherMiddleware()
        );
    }

    public function test_cors_origins_are_not_wildcard_by_default(): void
    {
        $this->assertNotContains('*', config('cors.allowed_origins'));
        $this->assertFalse(config('cors.supports_credentials'));
    }

    public function test_member_cannot_delete_another_members_gallery_image(): void
    {
        $owner = $this->createMember('gallery-owner@example.com', 1);
        $attacker = $this->createMember('gallery-attacker@example.com', 1);

        $image = GalleryImage::create([
            'user_id' => $owner->id,
            'image' => 'uploads/gallery/owner.jpg',
        ]);

        Sanctum::actingAs($attacker);

        $response = $this->deleteJson('/api/member/gallery-image/'.$image->id);

        $response->assertOk();
        $response->assertJsonPath('result', false);
        $this->assertDatabaseHas('gallery_images', [
            'id' => $image->id,
            'user_id' => $owner->id,
        ]);
    }

    public function test_member_cannot_view_another_members_support_ticket(): void
    {
        $owner = $this->createMember('ticket-owner@example.com', 1);
        $attacker = $this->createMember('ticket-attacker@example.com', 1);

        DB::table('addons')->insert([
            'unique_identifier' => 'support_tickets',
            'activated' => 1,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $ticket = SupportTicket::create([
            'ticket_id' => 'T-100',
            'subject' => 'Private ticket',
            'sender_user_id' => $owner->id,
            'status' => 0,
            'description' => 'Private ticket body',
        ]);

        Sanctum::actingAs($attacker);

        $response = $this->getJson('/api/member/support-ticket/'.$ticket->id);

        $response->assertNotFound();
    }

    public function test_staff_token_cannot_access_admin_api_without_full_admin_type(): void
    {
        $staff = $this->createUser('staff@example.com', ['user_type' => 'staff']);
        Sanctum::actingAs($staff);

        $response = $this->getJson('/api/admin/me');

        $response->assertForbidden();
    }

    public function test_member_cannot_accept_another_members_incoming_interest(): void
    {
        $sender = $this->createMember('interest-sender@example.com', 1);
        $recipient = $this->createMember('interest-recipient@example.com', 1);
        $attacker = $this->createMember('interest-attacker@example.com', 1);

        $interest = ExpressInterest::create([
            'user_id' => $recipient->id,
            'interested_by' => $sender->id,
            'status' => 0,
        ]);

        Sanctum::actingAs($attacker);

        $response = $this->postJson('/api/member/interest-accept', [
            'interest_id' => $interest->id,
        ]);

        $response->assertOk();
        $response->assertJsonPath('result', false);
        $this->assertDatabaseHas('express_interests', [
            'id' => $interest->id,
            'status' => 0,
        ]);
        $this->assertDatabaseCount('chat_threads', 0);
    }

    public function test_member_cannot_accept_another_members_profile_picture_request(): void
    {
        $owner = $this->createMember('profile-photo-owner@example.com', 1);
        $requester = $this->createMember('profile-photo-requester@example.com', 1);
        $attacker = $this->createMember('profile-photo-attacker@example.com', 1);

        DB::table('view_profile_pictures')->insert([
            'id' => 1,
            'user_id' => $owner->id,
            'requested_by' => $requester->id,
            'status' => 0,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        $viewRequest = ViewProfilePicture::findOrFail(1);

        Sanctum::actingAs($attacker);

        $response = $this->postJson('/api/member/profile-picture-view-request/accept', [
            'profile_pic_view_request_id' => $viewRequest->id,
        ]);

        $response->assertNotFound();
        $this->assertDatabaseHas('view_profile_pictures', [
            'id' => $viewRequest->id,
            'status' => 0,
        ]);
    }

    public function test_member_cannot_reject_another_members_profile_picture_request(): void
    {
        $owner = $this->createMember('profile-photo-reject-owner@example.com', 1);
        $requester = $this->createMember('profile-photo-reject-requester@example.com', 1);
        $attacker = $this->createMember('profile-photo-reject-attacker@example.com', 1);

        DB::table('view_profile_pictures')->insert([
            'id' => 1,
            'user_id' => $owner->id,
            'requested_by' => $requester->id,
            'status' => 0,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        $viewRequest = ViewProfilePicture::findOrFail(1);

        Sanctum::actingAs($attacker);

        $response = $this->postJson('/api/member/profile-picture-view-request/reject', [
            'profile_pic_view_request_id' => $viewRequest->id,
        ]);

        $response->assertNotFound();
        $this->assertDatabaseHas('view_profile_pictures', [
            'id' => $viewRequest->id,
            'status' => 0,
        ]);
    }

    public function test_member_cannot_reject_another_members_gallery_image_request(): void
    {
        $owner = $this->createMember('gallery-request-owner@example.com', 1);
        $requester = $this->createMember('gallery-requester@example.com', 1);
        $attacker = $this->createMember('gallery-request-attacker@example.com', 1);

        DB::table('view_gallery_images')->insert([
            'id' => 1,
            'user_id' => $owner->id,
            'requested_by' => $requester->id,
            'status' => 0,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        $viewRequest = ViewGalleryImage::findOrFail(1);

        Sanctum::actingAs($attacker);

        $response = $this->postJson('/api/member/gallery-image-view-request/reject', [
            'gallery_image_view_request_id' => $viewRequest->id,
        ]);

        $response->assertNotFound();
        $this->assertDatabaseHas('view_gallery_images', [
            'id' => $viewRequest->id,
            'status' => 0,
        ]);
    }

    public function test_additional_member_info_update_ignores_client_supplied_member_id(): void
    {
        $owner = $this->createMember('additional-owner@example.com', 1);
        $attacker = $this->createMember('additional-attacker@example.com', 1);

        DB::table('additional_attributes')->insert([
            'id' => 10,
            'status' => 1,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        Sanctum::actingAs($attacker);

        $response = $this->postJson('/api/member/additional-member-info/update', [
            'member_id' => $owner->id,
            'attributes' => [10],
            '10' => 'attacker-controlled',
        ]);

        $response->assertOk();
        $this->assertDatabaseMissing('additional_member_infos', [
            'user_id' => $owner->id,
            'additional_attribute_id' => 10,
        ]);
        $this->assertDatabaseHas('additional_member_infos', [
            'user_id' => $attacker->id,
            'additional_attribute_id' => 10,
            'value' => 'attacker-controlled',
        ]);
    }

    private function createTestSchema(): void
    {
        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->string('first_name')->nullable();
            $table->string('last_name')->nullable();
            $table->string('email')->unique();
            $table->string('password');
            $table->unsignedTinyInteger('membership')->default(1);
            $table->unsignedTinyInteger('approved')->default(1);
            $table->string('verification_info')->nullable();
            $table->timestamp('email_verified_at')->nullable();
            $table->string('user_type')->default('member');
            $table->boolean('blocked')->default(0);
            $table->boolean('deactivated')->default(0);
            $table->boolean('must_change_password')->default(0);
            $table->string('photo')->nullable();
            $table->rememberToken();
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('members', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id');
            $table->unsignedTinyInteger('gender')->default(1);
            $table->date('birthday')->nullable();
            $table->unsignedBigInteger('current_package_id')->nullable();
            $table->integer('remaining_profile_image_view')->default(0);
            $table->integer('remaining_gallery_image_view')->default(0);
            $table->integer('remaining_profile_viewer_view')->default(0);
            $table->unsignedTinyInteger('unverified_messages_used')->default(0);
            $table->unsignedTinyInteger('unverified_proposals_used')->default(0);
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

        Schema::create('notifications', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('type');
            $table->morphs('notifiable');
            $table->text('data');
            $table->string('notification_type', 50)->nullable();
            $table->timestamp('read_at')->nullable();
            $table->timestamps();
        });

        Schema::create('express_interests', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id');
            $table->unsignedBigInteger('interested_by');
            $table->unsignedTinyInteger('status')->default(0);
            $table->timestamps();
        });

        Schema::create('chat_threads', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('sender_user_id');
            $table->unsignedBigInteger('receiver_user_id');
            $table->string('thread_code')->nullable();
            $table->unsignedTinyInteger('active')->default(1);
            $table->unsignedBigInteger('blocked_by_user')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('chats', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('chat_thread_id');
            $table->unsignedBigInteger('sender_user_id');
            $table->text('message')->nullable();
            $table->text('attachment')->nullable();
            $table->unsignedTinyInteger('seen')->default(0);
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('packages', function (Blueprint $table) {
            $table->id();
            $table->string('name')->nullable();
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
            $table->unsignedBigInteger('country_id')->nullable();
            $table->string('name');
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('cities', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('state_id')->nullable();
            $table->string('name');
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('addresses', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id');
            $table->string('type')->default('present');
            $table->unsignedBigInteger('country_id')->nullable();
            $table->unsignedBigInteger('state_id')->nullable();
            $table->unsignedBigInteger('city_id')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('ignored_users', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id');
            $table->unsignedBigInteger('ignored_by');
            $table->timestamps();
        });

        Schema::create('shortlists', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id');
            $table->unsignedBigInteger('shortlisted_by');
            $table->timestamps();
        });

        Schema::create('reported_users', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id');
            $table->unsignedBigInteger('reported_by');
            $table->timestamps();
        });

        Schema::create('field_visibility_settings', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id');
            $table->string('field_name');
            $table->boolean('is_visible')->default(true);
            $table->timestamps();
        });

        Schema::create('physical_attributes', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id');
            $table->decimal('height', 5, 2)->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('careers', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id');
            $table->string('designation')->nullable();
            $table->string('company')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('education', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id');
            $table->string('degree')->nullable();
            $table->string('institution')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('spiritual_backgrounds', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id');
            $table->unsignedBigInteger('religion_id')->nullable();
            $table->unsignedBigInteger('sect_id')->nullable();
            $table->unsignedBigInteger('caste_id')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('settings', function (Blueprint $table) {
            $table->id();
            $table->string('type')->unique();
            $table->text('value')->nullable();
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
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('families', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id');
            $table->text('about_description')->nullable();
            $table->string('tradition_level')->nullable();
            $table->string('affluence_level')->nullable();
            $table->json('interests')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('family_guardians', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('family_id');
            $table->unsignedBigInteger('user_id')->nullable();
            $table->string('name');
            $table->string('relationship')->nullable();
            $table->string('email')->nullable();
            $table->string('phone')->nullable();
            $table->boolean('is_primary_contact')->default(false);
            $table->timestamps();
        });

        Schema::create('family_photos', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('family_id');
            $table->string('photo_path')->nullable();
            $table->string('caption')->nullable();
            $table->integer('sort_order')->default(0);
            $table->timestamps();
        });

        Schema::create('family_approvals', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('family_id');
            $table->unsignedBigInteger('guardian_id');
            $table->unsignedBigInteger('target_user_id')->nullable();
            $table->string('status')->default('pending');
            $table->timestamp('responded_at')->nullable();
            $table->timestamps();
        });

        Schema::create('addons', function (Blueprint $table) {
            $table->id();
            $table->string('unique_identifier')->nullable();
            $table->unsignedTinyInteger('activated')->default(0);
            $table->timestamps();
        });

        Schema::create('additional_attributes', function (Blueprint $table) {
            $table->id();
            $table->string('type')->nullable();
            $table->unsignedTinyInteger('status')->default(1);
            $table->timestamps();
        });

        Schema::create('additional_member_infos', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id');
            $table->unsignedBigInteger('additional_attribute_id');
            $table->text('value')->nullable();
            $table->timestamps();
        });

        Schema::create('support_categories', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->timestamps();
        });

        Schema::create('support_tickets', function (Blueprint $table) {
            $table->id();
            $table->string('ticket_id')->nullable();
            $table->string('subject')->nullable();
            $table->unsignedBigInteger('support_category_id')->nullable();
            $table->unsignedBigInteger('sender_user_id');
            $table->unsignedBigInteger('assigned_user_id')->nullable();
            $table->unsignedTinyInteger('status')->default(0);
            $table->unsignedTinyInteger('seen')->default(0);
            $table->text('description')->nullable();
            $table->string('attachments')->nullable();
            $table->string('priority')->nullable();
            $table->timestamps();
        });

        Schema::create('support_ticket_replies', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('support_ticket_id');
            $table->unsignedBigInteger('replied_user_id');
            $table->text('reply')->nullable();
            $table->string('attachments')->nullable();
            $table->boolean('is_read')->default(false);
            $table->unsignedTinyInteger('seen')->default(0);
            $table->timestamps();
        });

        DB::table('settings')->insert([
            ['type' => 'profile_picture_privacy', 'value' => 'all', 'created_at' => now(), 'updated_at' => now()],
            ['type' => 'gallery_image_privacy', 'value' => 'all', 'created_at' => now(), 'updated_at' => now()],
            ['type' => 'full_profile_show_according_to_membership', 'value' => 0, 'created_at' => now(), 'updated_at' => now()],
        ]);
    }

    private function createUser(string $email, array $overrides = []): User
    {
        return User::create([
            'first_name' => $overrides['first_name'] ?? 'Test',
            'last_name' => $overrides['last_name'] ?? 'User',
            'email' => $email,
            'password' => Hash::make('password'),
            'membership' => $overrides['membership'] ?? 1,
            'approved' => $overrides['approved'] ?? 1,
            'verification_info' => $overrides['verification_info'] ?? 'verified',
            'email_verified_at' => now(),
            'user_type' => $overrides['user_type'] ?? 'member',
        ]);
    }

    private function createMember(string $email, int $membership, array $overrides = []): User
    {
        $user = $this->createUser($email, array_merge($overrides, ['membership' => $membership]));

        Member::create([
            'user_id' => $user->id,
            'gender' => $overrides['gender'] ?? 1,
            'birthday' => array_key_exists('birthday', $overrides)
                ? $overrides['birthday']
                : now()->subYears(30)->format('Y-m-d'),
            'current_package_id' => $overrides['current_package_id'] ?? null,
            'is_visible' => 1,
        ]);

        return $user;
    }

    private function createChatThread(User $sender, User $receiver, string $threadCode): ChatThread
    {
        return ChatThread::create([
            'sender_user_id' => $sender->id,
            'receiver_user_id' => $receiver->id,
            'thread_code' => $threadCode,
            'active' => 1,
        ]);
    }
}
