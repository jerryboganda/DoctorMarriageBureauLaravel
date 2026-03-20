<?php

namespace Tests\Feature\Api;

use App\Events\ProgressionUpdated;
use App\Models\MemberProgression;
use App\Models\ProgressionChecklistItem;
use App\Models\ProgressionSetting;
use App\Models\ProgressionStage;
use App\Models\User;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ProgressionControllerTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        Schema::dropAllTables();
        $this->createTestSchema();
    }

    public function test_it_returns_empty_active_progressions_when_none_exist(): void
    {
        $user = $this->createUser('viewer@example.com');
        Sanctum::actingAs($user);

        $response = $this->getJson('/api/progression/active');

        $response->assertOk();
        $response->assertJsonPath('result', true);
        $response->assertJsonCount(0, 'tracks');
    }

    public function test_it_starts_a_progression_explicitly(): void
    {
        $viewer = $this->createUser('viewer@example.com');
        $partner = $this->createUser('partner@example.com');
        $this->createCareerAndAddress($partner->id, 'Dermatology', 'City Hospital', 'Karachi');
        Sanctum::actingAs($viewer);

        $response = $this->postJson('/api/progression/start', [
            'partner_id' => $partner->id,
        ]);

        $response->assertOk();
        $response->assertJsonPath('result', true);
        $response->assertJsonPath('data.partner_id', $partner->id);
        $this->assertDatabaseHas('member_progressions', [
            'user_id' => $viewer->id,
            'partner_id' => $partner->id,
            'status' => 'active',
        ]);
        $this->assertDatabaseHas('progression_settings', [
            'budget_target' => null,
        ]);
    }

    public function test_it_returns_and_updates_real_progression_sections(): void
    {
        Event::fake([ProgressionUpdated::class]);

        $viewer = $this->createUser('viewer@example.com');
        $partner = $this->createUser('partner@example.com');
        $this->createCareerAndAddress($viewer->id, 'Surgery', 'Prime Clinic', 'Lahore');
        $this->createCareerAndAddress($partner->id, 'Dermatology', 'City Hospital', 'Karachi');
        $stage = ProgressionStage::create([
            'name' => 'Meeting',
            'slug' => 'meeting',
            'order' => 2,
            'progress_percent' => 40,
        ]);

        $progression = MemberProgression::create([
            'user_id' => $viewer->id,
            'partner_id' => $partner->id,
            'current_stage_id' => $stage->id,
            'status' => 'active',
            'total_progress_percent' => 40,
            'next_steps' => 'Plan family dinner',
        ]);

        ProgressionSetting::create([
            'member_progression_id' => $progression->id,
            'share_calendar_busy' => true,
            'auto_detect_timezone' => true,
            'timezone' => 'Asia/Karachi',
            'budget_target' => 500000,
        ]);

        Sanctum::actingAs($viewer);

        $response = $this->getJson('/api/progression/' . $partner->id);
        $response->assertOk();
        $response->assertJsonPath('result', true);
        $response->assertJsonPath('data.partner_id', $partner->id);
        $response->assertJsonCount(0, 'data.checklist_items');

        $this->postJson('/api/progression/' . $progression->id . '/items', [
            'kind' => 'checklist',
            'title' => 'Share biodata',
            'sort_order' => 1,
        ])->assertOk();

        $this->postJson('/api/progression/' . $progression->id . '/items', [
            'kind' => 'note',
            'note' => 'Family liked the introduction.',
        ])->assertOk();

        $this->postJson('/api/progression/' . $progression->id . '/items', [
            'kind' => 'venue',
            'name' => 'Pearl Continental',
            'venue_type' => 'Dinner',
            'estimated_cost' => 45000,
            'rating' => 4.8,
            'status' => 'shortlisted',
            'notes' => 'Good for family meeting',
        ])->assertOk();

        $this->postJson('/api/progression/' . $progression->id . '/items', [
            'kind' => 'budget',
            'label' => 'Venue advance',
            'amount' => 30000,
            'category' => 'planning',
            'status' => 'planned',
            'notes' => 'Hold until final date',
        ])->assertOk();

        $this->postJson('/api/progression/' . $progression->id . '/items', [
            'kind' => 'event',
            'title' => 'Family meeting',
            'event_at' => now()->addWeek()->toIso8601String(),
            'location' => 'Lahore',
            'status' => 'scheduled',
            'notes' => 'Bring biodata prints',
        ])->assertOk();

        $this->patchJson('/api/progression/' . $progression->id . '/items/' . $progression->checklistItems()->first()->id, [
            'kind' => 'checklist',
            'is_completed' => true,
        ])->assertOk();

        $this->patchJson('/api/progression/' . $progression->id . '/settings', [
            'share_calendar_busy' => false,
            'auto_detect_timezone' => false,
            'timezone' => 'Asia/Karachi',
            'budget_target' => 750000,
        ])->assertOk();

        Event::assertDispatched(ProgressionUpdated::class, function (ProgressionUpdated $event) use ($progression) {
            return $event->progression->id === $progression->id && $event->section === 'settings';
        });

        $fresh = $this->getJson('/api/progression/' . $partner->id);
        $fresh->assertOk();
        $fresh->assertJsonPath('data.summary.checklist_total', 1);
        $fresh->assertJsonPath('data.summary.checklist_completed', 1);
        $fresh->assertJsonPath('data.summary.notes_count', 1);
        $fresh->assertJsonPath('data.summary.venues_count', 1);
        $fresh->assertJsonPath('data.summary.events_count', 1);
        $fresh->assertJsonPath('data.settings.share_calendar_busy', false);
        $fresh->assertJsonPath('data.settings.budget_target', 750000);
        $fresh->assertJsonPath('data.budget.items.0.label', 'Venue advance');
        $fresh->assertJsonPath('data.venues.0.name', 'Pearl Continental');
        $fresh->assertJsonPath('data.family_notes.0.note', 'Family liked the introduction.');
    }

    public function test_it_rejects_unauthorized_progression_edits(): void
    {
        $viewer = $this->createUser('viewer@example.com');
        $partner = $this->createUser('partner@example.com');
        $outsider = $this->createUser('outsider@example.com');
        $stage = ProgressionStage::create([
            'name' => 'Chatting',
            'slug' => 'chatting',
            'order' => 1,
            'progress_percent' => 20,
        ]);

        $progression = MemberProgression::create([
            'user_id' => $viewer->id,
            'partner_id' => $partner->id,
            'current_stage_id' => $stage->id,
            'status' => 'active',
            'total_progress_percent' => 20,
        ]);

        ProgressionChecklistItem::create([
            'member_progression_id' => $progression->id,
            'title' => 'Share biodata',
            'is_completed' => false,
            'sort_order' => 1,
        ]);

        Sanctum::actingAs($outsider);

        $this->patchJson('/api/progression/' . $progression->id . '/items/' . $progression->checklistItems()->first()->id, [
            'kind' => 'checklist',
            'is_completed' => true,
        ])->assertForbidden();
    }

    private function createTestSchema(): void
    {
        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->string('first_name')->nullable();
            $table->string('last_name')->nullable();
            $table->string('email')->unique();
            $table->string('password');
            $table->string('user_type')->default('member');
            $table->string('photo')->nullable();
            $table->boolean('must_change_password')->default(false);
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('members', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id');
            $table->date('birthday')->nullable();
            $table->unsignedBigInteger('mothere_tongue')->nullable();
            $table->boolean('is_visible')->default(true);
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('countries', function (Blueprint $table) {
            $table->id();
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

        Schema::create('spiritual_backgrounds', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id');
            $table->unsignedBigInteger('religion_id')->nullable();
            $table->unsignedBigInteger('sect_id')->nullable();
            $table->unsignedBigInteger('caste_id')->nullable();
            $table->unsignedBigInteger('sub_caste_id')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('field_visibility_settings', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id');
            $table->string('field_name');
            $table->boolean('is_visible')->default(true);
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('cities', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('addresses', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id');
            $table->unsignedBigInteger('city_id')->nullable();
            $table->string('type')->nullable();
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

        Schema::create('progression_stages', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->integer('order')->default(0);
            $table->integer('progress_percent')->default(0);
            $table->timestamps();
        });

        Schema::create('member_progressions', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id');
            $table->unsignedBigInteger('partner_id');
            $table->unsignedBigInteger('current_stage_id')->nullable();
            $table->string('status')->default('active');
            $table->integer('total_progress_percent')->default(0);
            $table->text('next_steps')->nullable();
            $table->timestamps();
        });

        Schema::create('progression_checklist_items', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('member_progression_id');
            $table->string('title');
            $table->boolean('is_completed')->default(false);
            $table->timestamp('completed_at')->nullable();
            $table->integer('sort_order')->default(0);
            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();
            $table->timestamps();
        });

        Schema::create('progression_notes', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('member_progression_id');
            $table->unsignedBigInteger('author_id')->nullable();
            $table->string('note_type')->default('family_feedback');
            $table->text('note');
            $table->timestamps();
        });

        Schema::create('progression_venues', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('member_progression_id');
            $table->string('name');
            $table->string('venue_type')->nullable();
            $table->decimal('estimated_cost', 12, 2)->nullable();
            $table->decimal('rating', 3, 1)->nullable();
            $table->string('status')->default('shortlisted');
            $table->timestamp('visited_at')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        Schema::create('progression_budget_items', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('member_progression_id');
            $table->string('label');
            $table->decimal('amount', 12, 2)->default(0);
            $table->string('category')->nullable();
            $table->string('status')->default('planned');
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        Schema::create('progression_settings', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('member_progression_id')->unique();
            $table->boolean('share_calendar_busy')->default(true);
            $table->boolean('auto_detect_timezone')->default(true);
            $table->string('timezone')->nullable();
            $table->decimal('budget_target', 12, 2)->nullable();
            $table->timestamps();
        });

        Schema::create('progression_events', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('member_progression_id');
            $table->string('title');
            $table->dateTime('event_at')->nullable();
            $table->string('location')->nullable();
            $table->string('status')->default('scheduled');
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    private function createUser(string $email): User
    {
        return User::create([
            'first_name' => 'Test',
            'last_name' => 'User',
            'email' => $email,
            'password' => Hash::make('password'),
            'user_type' => 'member',
        ]);
    }

    private function createCareerAndAddress(int $userId, string $designation, string $company, string $city): void
    {
        $cityId = DB::table('cities')->insertGetId(['name' => $city, 'created_at' => now(), 'updated_at' => now()]);
        DB::table('careers')->insert(['user_id' => $userId, 'designation' => $designation, 'company' => $company, 'created_at' => now(), 'updated_at' => now()]);
        DB::table('addresses')->insert(['user_id' => $userId, 'city_id' => $cityId, 'type' => 'present', 'created_at' => now(), 'updated_at' => now()]);
    }
}

