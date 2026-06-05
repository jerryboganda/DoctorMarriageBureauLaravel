<?php

namespace Tests\Feature\Api;

use App\Http\Resources\NotificationResource;
use App\Models\Chat;
use App\Models\ChatThread;
use App\Models\ExpressInterest;
use App\Models\Member;
use App\Models\Notification;
use App\Models\User;
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
            'user_type' => 'member',
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
}
