<?php

namespace Tests\Feature;

use App\Models\Addon;
use App\Models\Address;
use App\Models\Country;
use App\Models\Member;
use App\Models\MaritalStatus;
use App\Models\PhysicalAttribute;
use App\Models\Package;
use App\Models\Referral;
use App\Models\ReferralCode;
use App\Models\ReferralReward;
use App\Models\ReferralRule;
use App\Models\ReferralSetting;
use App\Models\Religion;
use App\Models\SpiritualBackground;
use App\Models\Setting;
use App\Models\User;
use App\Models\Wallet;
use App\Services\ReferralService;
use App\Utility\MemberUtility;
use Carbon\Carbon;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use Laravel\Sanctum\Sanctum;
use Laravel\Socialite\Facades\Socialite;
use Mockery;
use Tests\TestCase;

class ReferralSystemTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        Schema::dropAllTables();
        $this->createTestSchema();
        Cache::flush();
        Notification::fake();
        Mail::fake();
        MemberUtility::resetCaches();
    }

    protected function tearDown(): void
    {
        Mockery::close();
        parent::tearDown();
    }

    public function test_signup_with_referral_code_creates_referral_and_updates_dashboard_stats(): void
    {
        $this->enableReferralProgram('registration_only');

        $referrer = $this->createUser([
            'first_name' => 'Referrer',
            'last_name' => 'One',
            'email' => 'referrer@example.com',
            'phone' => '+923001111111',
            'code' => 'REFCODE1',
        ]);
        $referralCode = ReferralCode::getOrCreateForUser($referrer->id);

        $validationResponse = $this->postJson('/api/referral/validate-signup-code', [
            'code' => $referralCode->code,
        ]);

        $validationResponse->assertOk()
            ->assertJsonPath('result', true)
            ->assertJsonPath('data.referrer_name', 'Referrer');

        $response = $this->postJson('/api/signup', [
            'first_name' => 'Referred',
            'last_name' => 'Candidate',
            'gender' => 'Male',
            'on_behalf' => 1,
            'date_of_birth' => '1995-01-01',
            'phone' => '+923001111112',
            'email' => 'referred@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
            'referral_code' => $referralCode->code,
        ]);

        $response->assertOk()
            ->assertJsonPath('result', true)
            ->assertJsonPath('user.email', 'referred@example.com');

        $newUser = User::where('email', 'referred@example.com')->firstOrFail();
        $this->assertSame($referrer->id, (int) $newUser->referred_by);

        $this->assertDatabaseHas('referrals', [
            'referrer_user_id' => $referrer->id,
            'referred_user_id' => $newUser->id,
            'referral_code_id' => $referralCode->id,
            'status' => 'qualified',
            'source' => 'link',
        ]);

        Sanctum::actingAs($referrer);

        $statsResponse = $this->getJson('/api/referral/my-stats');
        $statsResponse->assertOk()
            ->assertJsonPath('result', true)
            ->assertJsonPath('data.referral_code', $referralCode->code)
            ->assertJsonPath('data.total_referred', 1)
            ->assertJsonPath('data.qualified_count', 1)
            ->assertJsonPath('data.pending_count', 0);
    }

    public function test_api_signup_can_reuse_a_soft_deleted_email_address(): void
    {
        $this->enableReferralProgram('registration_only');

        $deletedUser = $this->createUser([
            'first_name' => 'Deleted',
            'last_name' => 'Candidate',
            'email' => 'mindreader_420@yahoo.com',
            'phone' => '+923001111111',
            'code' => 'DELETED01',
        ]);
        $deletedUser->delete();

        $response = $this->postJson('/api/signup', [
            'first_name' => 'Reborn',
            'last_name' => 'Member',
            'gender' => 'Male',
            'on_behalf' => 1,
            'date_of_birth' => '1995-01-01',
            'phone' => '+923001111118',
            'email' => 'mindreader_420@yahoo.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ]);

        $response->assertOk()
            ->assertJsonPath('result', true)
            ->assertJsonPath('user.email', 'mindreader_420@yahoo.com');

        $this->assertSame(1, User::where('email', 'mindreader_420@yahoo.com')->whereNull('deleted_at')->count());
        $this->assertSame(1, User::onlyTrashed()->where('email', 'mindreader_420@yahoo.com')->count());
    }


    public function test_api_signup_succeeds_without_date_of_birth_and_creates_member_with_null_birthday(): void
    {
        $this->enableReferralProgram('registration_only');

        $response = $this->postJson('/api/signup', [
            'first_name' => 'NoDob',
            'last_name' => 'Member',
            'gender' => 'Male',
            'on_behalf' => 1,
            'phone' => '+923001111119',
            'email' => 'nodob.member@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ]);

        $response->assertOk()
            ->assertJsonPath('result', true)
            ->assertJsonPath('user.email', 'nodob.member@example.com');

        $user = User::where('email', 'nodob.member@example.com')->firstOrFail();
        $member = Member::where('user_id', $user->id)->firstOrFail();

        $this->assertNull($member->birthday);
    }

    public function test_api_signup_still_accepts_date_of_birth_when_provided(): void
    {
        $this->enableReferralProgram('registration_only');

        $response = $this->postJson('/api/signup', [
            'first_name' => 'WithDob',
            'last_name' => 'Member',
            'gender' => 'Male',
            'on_behalf' => 1,
            'date_of_birth' => '1995-01-01',
            'phone' => '+923001111120',
            'email' => 'withdob.member@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ]);

        $response->assertOk()
            ->assertJsonPath('result', true)
            ->assertJsonPath('user.email', 'withdob.member@example.com');

        $user = User::where('email', 'withdob.member@example.com')->firstOrFail();
        $member = Member::where('user_id', $user->id)->firstOrFail();

        $this->assertSame('1995-01-01', optional($member->birthday)->format('Y-m-d'));
    }

    public function test_social_login_new_user_preserves_referral_attribution(): void
    {
        $this->enableReferralProgram('registration_only');

        $referrer = $this->createUser([
            'first_name' => 'Social',
            'last_name' => 'Referrer',
            'email' => 'social.referrer@example.com',
            'phone' => '+923001111113',
            'code' => 'SOCIAL01',
        ]);
        $referralCode = ReferralCode::getOrCreateForUser($referrer->id);

        $socialUser = new class {
            public function getId()
            {
                return 'google-social-id';
            }

            public function getEmail()
            {
                return 'social.new@example.com';
            }

            public function getName()
            {
                return 'Social New';
            }
        };

        $driver = Mockery::mock();
        $driver->shouldReceive('stateless')->andReturnSelf();
        $driver->shouldReceive('userFromToken')->with('google-token')->andReturn($socialUser);
        Socialite::shouldReceive('driver')->with('google')->andReturn($driver);

        $response = $this->postJson('/api/social-login', [
            'social_provider' => 'google',
            'access_token' => 'google-token',
            'referral_code' => $referralCode->code,
        ]);

        $response->assertOk()
            ->assertJsonPath('result', true)
            ->assertJsonPath('user.email', 'social.new@example.com');

        $newUser = User::where('email', 'social.new@example.com')->firstOrFail();
        $this->assertSame($referrer->id, (int) $newUser->referred_by);

        $this->assertDatabaseHas('referrals', [
            'referrer_user_id' => $referrer->id,
            'referred_user_id' => $newUser->id,
            'referral_code_id' => $referralCode->id,
            'status' => 'qualified',
            'source' => 'link',
        ]);
    }

    public function test_invalid_referral_code_is_rejected_by_validation_endpoint(): void
    {
        $this->enableReferralProgram('registration_only');

        $response = $this->postJson('/api/referral/validate-signup-code', [
            'code' => 'INVALID01',
        ]);

        $response->assertOk()
            ->assertJsonPath('result', false);
    }

    public function test_package_commission_applies_once_for_referred_user(): void
    {
        $this->enableReferralProgram('registration_only');

        $referrer = $this->createUser([
            'first_name' => 'Wallet',
            'last_name' => 'Referrer',
            'email' => 'wallet.referrer@example.com',
            'phone' => '+923001111114',
            'code' => 'WALLET01',
            'balance' => 0,
        ]);

        $referred = $this->createUser([
            'first_name' => 'Wallet',
            'last_name' => 'User',
            'email' => 'wallet.user@example.com',
            'phone' => '+923001111115',
            'code' => 'WALLET02',
            'referred_by' => $referrer->id,
            'referral_comission' => 0,
        ]);

        $service = app(ReferralService::class);

        $result = $service->applyReferralCommissionIfEligible($referred, 25);
        $this->assertTrue($result['success']);
        $this->assertSame(1, Wallet::count());
        $this->assertSame(25.0, (float) $referrer->fresh()->balance);
        $this->assertSame(1, (int) $referred->fresh()->referral_comission);

        $secondResult = $service->applyReferralCommissionIfEligible($referred, 25);
        $this->assertFalse($secondResult['success']);
        $this->assertSame(1, Wallet::count());
    }

    public function test_pending_referrals_are_qualified_by_daily_processor_for_active_days_rules(): void
    {
        $this->enableReferralProgram('active_days', 999, ['active_days' => 7]);

        $referrer = $this->createUser([
            'first_name' => 'Active',
            'last_name' => 'Referrer',
            'email' => 'active.referrer@example.com',
            'phone' => '+923001111116',
            'code' => 'ACTIVE01',
        ]);
        $referralCode = ReferralCode::getOrCreateForUser($referrer->id);

        $referred = $this->createUser([
            'first_name' => 'Active',
            'last_name' => 'Candidate',
            'email' => 'active.candidate@example.com',
            'phone' => '+923001111117',
            'code' => 'ACTIVE02',
        ]);

        $service = app(ReferralService::class);
        $service->createReferral($referred->id, $referralCode->code, 'link', [
            'source' => 'signup_link',
        ]);

        $referral = Referral::where('referred_user_id', $referred->id)->firstOrFail();
        $this->assertSame('pending', $referral->status);

        Carbon::setTestNow(now()->addDays(8));

        try {
            $this->artisan('referrals:process-pending')->assertExitCode(0);
        } finally {
            Carbon::setTestNow();
        }

        $referral->refresh();
        $this->assertSame('qualified', $referral->status);
    }

    protected function enableReferralProgram(string $qualificationMode = 'registration_only', int $threshold = 999, array $qualificationParams = []): ReferralRule
    {
        DB::table('addons')->updateOrInsert(
            ['unique_identifier' => 'referral_system'],
            ['activated' => 1, 'created_at' => now(), 'updated_at' => now()]
        );

        DB::table('settings')->updateOrInsert(
            ['type' => 'member_verification'],
            ['value' => '0', 'created_at' => now(), 'updated_at' => now()]
        );

        $rule = ReferralRule::create([
            'name' => 'Test Referral Rule',
            'is_active' => true,
            'trigger_threshold' => $threshold,
            'qualification_mode' => $qualificationMode,
            'qualification_params' => $qualificationParams ?: ['active_days' => 7],
            'reward_type' => 'package_upgrade',
            'reward_params' => [
                'target_package_id' => 8,
                'upgrade_duration_days' => 90,
                'is_permanent' => false,
            ],
            'per_user_limit' => 'once',
            'starts_at' => null,
            'ends_at' => null,
        ]);

        ReferralSetting::query()->updateOrCreate(
            ['id' => 1],
            [
                'referral_enabled' => true,
                'code_format' => 'alphanumeric_8',
                'allow_code_regeneration' => false,
                'allow_post_signup_apply' => true,
                'default_rule_id' => $rule->id,
                'anti_fraud_settings' => [
                    'max_referrals_per_ip_per_day' => 5,
                    'max_referrals_per_device_per_day' => 5,
                    'cooldown_minutes' => 10,
                    'block_same_email_domain' => false,
                ],
                'popup_enabled' => false,
                'popup_headline' => 'Join Our Referral Program!',
                'popup_body' => 'Refer friends and earn rewards.',
                'popup_cta_text' => 'Start Referring Now',
                'popup_bonus_days' => 30,
                'popup_show_frequency' => 'once_per_session',
                'popup_delay_seconds' => 2,
            ]
        );

        Cache::forget('addons');
        Cache::forget('settings');

        return $rule;
    }

    protected function createUser(array $attributes = []): User
    {
        $defaults = [
            'email' => $attributes['email'] ?? ('user.' . uniqid() . '@example.com'),
            'password' => Hash::make('password123'),
            'email_verified_at' => now(),
        ];

        $user = User::create(array_merge([
            'first_name' => 'Test',
            'last_name' => 'User',
            'email' => $defaults['email'],
            'phone' => '+923000000000',
            'password' => $defaults['password'],
            'code' => strtoupper(Str::random(8)),
            'membership' => 1,
            'approved' => 1,
            'user_type' => 'member',
            'email_verified_at' => $defaults['email_verified_at'],
            'referred_by' => null,
            'referral_comission' => 0,
            'balance' => 0,
        ], array_intersect_key($attributes, array_flip([
            'first_name',
            'last_name',
            'email',
            'phone',
            'password',
            'code',
            'membership',
            'approved',
            'user_type',
            'email_verified_at',
            'referred_by',
            'referral_comission',
            'balance',
        ]))));

        $user->forceFill(array_merge([
            'first_name' => 'Test',
            'last_name' => 'User',
            'phone' => '+923000000000',
            'code' => strtoupper(Str::random(8)),
            'user_type' => 'member',
            'membership' => 1,
            'approved' => 1,
            'blocked' => 0,
            'deactivated' => 0,
            'photo_approved' => 0,
            'must_change_password' => 0,
            'referral_comission' => 0,
            'balance' => 0,
            'referred_by' => null,
        ], $attributes));
        $user->save();

        return $user->fresh();
    }

    protected function createTestSchema(): void
    {
        Schema::create('addons', function (Blueprint $table) {
            $table->id();
            $table->string('unique_identifier')->unique();
            $table->boolean('activated')->default(false);
            $table->timestamps();
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
        });

        Schema::create('countries', function (Blueprint $table) {
            $table->id();
            $table->string('code', 10)->nullable();
            $table->string('name')->nullable();
            $table->unsignedTinyInteger('status')->default(1);
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('religions', function (Blueprint $table) {
            $table->id();
            $table->string('name')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('marital_statuses', function (Blueprint $table) {
            $table->id();
            $table->string('name')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->string('name')->nullable();
            $table->string('first_name')->nullable();
            $table->string('last_name')->nullable();
            $table->string('email')->nullable();
            $table->timestamp('email_verified_at')->nullable();
            $table->string('password')->nullable();
            $table->string('phone')->nullable();
            $table->string('code')->nullable()->unique();
            $table->string('verification_code')->nullable();
            $table->unsignedTinyInteger('membership')->default(1);
            $table->unsignedTinyInteger('approved')->default(1);
            $table->unsignedTinyInteger('blocked')->default(0);
            $table->unsignedTinyInteger('deactivated')->default(0);
            $table->unsignedTinyInteger('photo_approved')->default(0);
            $table->unsignedTinyInteger('must_change_password')->default(0);
            $table->unsignedBigInteger('referred_by')->nullable();
            $table->unsignedTinyInteger('referral_comission')->default(0);
            $table->string('provider_id')->nullable();
            $table->string('user_type')->nullable();
            $table->decimal('balance', 12, 2)->default(0);
            $table->text('remember_token')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('members', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id')->unique();
            $table->unsignedTinyInteger('gender')->nullable();
            $table->unsignedBigInteger('on_behalves_id')->nullable();
            $table->date('birthday')->nullable();
            $table->unsignedBigInteger('marital_status_id')->nullable();
            $table->unsignedBigInteger('current_package_id')->nullable();
            $table->unsignedInteger('remaining_interest')->default(0);
            $table->unsignedInteger('remaining_photo_gallery')->default(0);
            $table->unsignedInteger('remaining_contact_view')->default(0);
            $table->unsignedInteger('remaining_profile_viewer_view')->default(0);
            $table->unsignedInteger('remaining_profile_image_view')->default(0);
            $table->unsignedInteger('remaining_gallery_image_view')->default(0);
            $table->boolean('auto_profile_match')->default(false);
            $table->date('package_validity')->nullable();
            $table->text('introduction')->nullable();
            $table->boolean('is_visible')->default(true);
            $table->boolean('travel_mode')->default(false);
            $table->string('travel_city')->nullable();
            $table->string('travel_country')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('physical_attributes', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id')->unique();
            $table->decimal('height', 5, 2)->nullable();
            $table->decimal('weight', 5, 2)->nullable();
            $table->string('complexion')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('spiritual_backgrounds', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id')->unique();
            $table->unsignedBigInteger('religion_id')->nullable();
            $table->unsignedBigInteger('caste_id')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('addresses', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id');
            $table->string('type')->nullable();
            $table->unsignedBigInteger('country_id')->nullable();
            $table->unsignedBigInteger('state_id')->nullable();
            $table->unsignedBigInteger('city_id')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('packages', function (Blueprint $table) {
            $table->id();
            $table->string('name')->nullable();
            $table->unsignedInteger('express_interest')->default(0);
            $table->unsignedInteger('photo_gallery')->default(0);
            $table->unsignedInteger('contact')->default(0);
            $table->unsignedInteger('profile_viewers_view')->default(0);
            $table->unsignedInteger('profile_image_view')->default(0);
            $table->unsignedInteger('gallery_image_view')->default(0);
            $table->boolean('auto_profile_match')->default(false);
            $table->unsignedInteger('validity')->default(30);
            $table->timestamps();
            $table->softDeletes();
        });

        DB::table('packages')->insert([
            [
                'id' => 1,
                'name' => 'Basic',
                'express_interest' => 0,
                'photo_gallery' => 0,
                'contact' => 0,
                'profile_viewers_view' => 0,
                'profile_image_view' => 0,
                'gallery_image_view' => 0,
                'auto_profile_match' => 0,
                'validity' => 30,
                'created_at' => now(),
                'updated_at' => now(),
                'deleted_at' => null,
            ],
            [
                'id' => 8,
                'name' => 'Gold',
                'express_interest' => 10,
                'photo_gallery' => 10,
                'contact' => 10,
                'profile_viewers_view' => 10,
                'profile_image_view' => 10,
                'gallery_image_view' => 10,
                'auto_profile_match' => 1,
                'validity' => 90,
                'created_at' => now(),
                'updated_at' => now(),
                'deleted_at' => null,
            ],
        ]);

        Schema::create('personal_access_tokens', function (Blueprint $table) {
            $table->id();
            $table->morphs('tokenable');
            $table->string('name');
            $table->string('token', 64)->unique();
            $table->text('abilities')->nullable();
            $table->timestamp('last_used_at')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->timestamps();
        });

        Schema::create('referral_settings', function (Blueprint $table) {
            $table->id();
            $table->boolean('referral_enabled')->default(false);
            $table->string('code_format', 50)->default('alphanumeric_8');
            $table->boolean('allow_code_regeneration')->default(false);
            $table->boolean('allow_post_signup_apply')->default(false);
            $table->unsignedBigInteger('default_rule_id')->nullable();
            $table->json('anti_fraud_settings')->nullable();
            $table->boolean('popup_enabled')->default(false);
            $table->string('popup_headline')->nullable();
            $table->text('popup_body')->nullable();
            $table->string('popup_cta_text')->nullable();
            $table->unsignedInteger('popup_bonus_days')->default(0);
            $table->string('popup_show_frequency')->nullable();
            $table->unsignedInteger('popup_delay_seconds')->default(0);
            $table->timestamps();
        });

        Schema::create('referral_rules', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->boolean('is_active')->default(true);
            $table->unsignedInteger('trigger_threshold')->default(3);
            $table->string('qualification_mode', 50)->default('registration_only');
            $table->json('qualification_params')->nullable();
            $table->string('reward_type', 50)->default('package_upgrade');
            $table->json('reward_params')->nullable();
            $table->string('per_user_limit', 20)->default('once');
            $table->timestamp('starts_at')->nullable();
            $table->timestamp('ends_at')->nullable();
            $table->timestamps();
        });

        Schema::create('referral_codes', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id')->unique();
            $table->string('code', 50)->unique();
            $table->enum('status', ['active', 'disabled'])->default('active');
            $table->timestamps();
        });

        Schema::create('referrals', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('referrer_user_id');
            $table->unsignedBigInteger('referred_user_id')->unique();
            $table->unsignedBigInteger('referral_code_id');
            $table->enum('source', ['link', 'manual', 'admin'])->default('link');
            $table->enum('status', ['pending', 'qualified', 'invalid', 'reversed'])->default('pending');
            $table->timestamp('qualified_at')->nullable();
            $table->timestamp('invalidated_at')->nullable();
            $table->timestamp('reversed_at')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamps();
        });

        Schema::create('referral_rewards', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id');
            $table->unsignedBigInteger('rule_id');
            $table->string('reward_type', 50)->default('package_upgrade');
            $table->json('reward_payload')->nullable();
            $table->enum('status', ['pending', 'applied', 'reversed', 'failed'])->default('pending');
            $table->timestamp('applied_at')->nullable();
            $table->timestamp('reversed_at')->nullable();
            $table->string('idempotency_key')->unique();
            $table->text('admin_notes')->nullable();
            $table->timestamps();
        });

        Schema::create('referral_audit_logs', function (Blueprint $table) {
            $table->id();
            $table->string('actor_type', 20);
            $table->unsignedBigInteger('actor_id')->nullable();
            $table->string('action', 100);
            $table->string('entity_type', 100);
            $table->unsignedBigInteger('entity_id')->nullable();
            $table->json('before_data')->nullable();
            $table->json('after_data')->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->text('notes')->nullable();
            $table->timestamp('created_at')->useCurrent();
        });

        Schema::create('wallets', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id');
            $table->decimal('amount', 12, 2)->default(0);
            $table->string('payment_method')->nullable();
            $table->text('payment_details')->nullable();
            $table->unsignedBigInteger('referral_user')->nullable();
            $table->timestamps();
        });
    }
}
