<?php

namespace Tests\Feature\Api;

use App\Http\Controllers\Api\ProfileController;
use App\Http\Middleware\EmailVerifiedApi;
use App\Http\Middleware\IsApiMember;
use App\Http\Middleware\IsMember;
use App\Http\Middleware\RequirePasswordChangeApi;
use Illuminate\Auth\Middleware\EnsureEmailIsVerified;
use App\Models\Member;
use App\Models\User;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;
use Laravel\Sanctum\Sanctum;
use ReflectionClass;
use Tests\TestCase;

class ProfilePhotoUploadTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        Schema::dropAllTables();
        $this->createTestSchema();
        $this->withoutMiddleware([
            EmailVerifiedApi::class,
            IsApiMember::class,
            IsMember::class,
            EnsureEmailIsVerified::class,
            RequirePasswordChangeApi::class,
        ]);
    }

    public function test_profile_picture_upload_saves_photo_for_authenticated_member(): void
    {
        $user = $this->createUser();
        Sanctum::actingAs($user);

        $response = $this->post('/api/upload-profile-picture', [
            'photo' => UploadedFile::fake()->image('profile.jpg', 320, 320),
        ]);

        $response->assertOk();
        $response->assertJsonPath('result', true);
        $response->assertJsonPath('success', true);

        $user->refresh();

        $this->assertNotEmpty($user->photo);
        $this->assertDatabaseHas('uploads', [
            'id' => $user->photo,
            'user_id' => $user->id,
            'type' => 'image',
        ]);
    }

    public function test_profile_picture_upload_returns_specific_validation_error(): void
    {
        $user = $this->createUser();
        Sanctum::actingAs($user);

        $response = $this->post('/api/upload-profile-picture', [
            'photo' => UploadedFile::fake()->create('profile.txt', 1, 'text/plain'),
        ]);

        $response->assertUnprocessable();
        $response->assertJsonPath('result', false);
        $response->assertJsonPath('success', false);
        $response->assertJsonStructure(['message', 'errors']);
    }

    public function test_web_profile_picture_upload_uses_same_storage_path(): void
    {
        $user = $this->createUser();
        $this->actingAs($user);

        $response = $this->post('/upload-profile-picture', [
            'photo' => UploadedFile::fake()->image('profile.png', 320, 320),
        ]);

        $response->assertOk();
        $response->assertJsonPath('success', true);

        $user->refresh();

        $this->assertNotEmpty($user->photo);
        $this->assertDatabaseHas('uploads', [
            'id' => $user->photo,
            'user_id' => $user->id,
            'type' => 'image',
        ]);
    }

    public function test_onboarding_completion_requires_saved_profile_photo(): void
    {
        $user = $this->createUser([
            'first_name' => 'Complete',
            'last_name' => 'Profile',
            'photo' => null,
        ]);
        $member = $user->member;
        $member->forceFill([
            'gender' => 1,
            'birthday' => '1990-01-01',
            'marital_status_id' => 1,
            'annual_salary_range_id' => 1,
            'introduction' => 'A complete profile except photo.',
        ])->save();

        $this->seedCompleteOnboardingRelations($user->id);

        $reflection = new ReflectionClass(ProfileController::class);
        $method = $reflection->getMethod('getOnboardingMissingFields');
        $method->setAccessible(true);

        $missingFields = $method->invoke(new ProfileController, $user->fresh(), $member->fresh());

        $this->assertContains('Profile Photo', $missingFields);
    }

    private function createTestSchema(): void
    {
        Schema::create('settings', function (Blueprint $table): void {
            $table->id();
            $table->string('type')->nullable();
            $table->text('value')->nullable();
            $table->timestamps();
        });

        Schema::create('users', function (Blueprint $table): void {
            $table->id();
            $table->string('first_name')->nullable();
            $table->string('last_name')->nullable();
            $table->string('email')->unique();
            $table->string('password');
            $table->string('phone')->nullable();
            $table->unsignedTinyInteger('approved')->default(1);
            $table->string('user_type')->default('member');
            $table->boolean('blocked')->default(false);
            $table->boolean('deactivated')->default(false);
            $table->boolean('must_change_password')->default(false);
            $table->unsignedBigInteger('photo')->nullable();
            $table->boolean('photo_approved')->default(false);
            $table->rememberToken();
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('members', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('user_id')->constrained('users');
            $table->unsignedTinyInteger('gender')->nullable();
            $table->date('birthday')->nullable();
            $table->unsignedBigInteger('marital_status_id')->nullable();
            $table->unsignedBigInteger('annual_salary_range_id')->nullable();
            $table->text('introduction')->nullable();
            $table->boolean('onboarding_completed')->default(false);
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('uploads', function (Blueprint $table): void {
            $table->id();
            $table->string('file_original_name')->nullable();
            $table->string('file_name');
            $table->unsignedBigInteger('user_id')->nullable();
            $table->string('extension')->nullable();
            $table->string('type')->nullable();
            $table->unsignedBigInteger('file_size')->default(0);
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('addresses', function (Blueprint $table): void {
            $table->id();
            $table->unsignedBigInteger('user_id');
            $table->string('type')->nullable();
            $table->unsignedBigInteger('country_id')->nullable();
            $table->unsignedBigInteger('state_id')->nullable();
            $table->unsignedBigInteger('city_id')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('spiritual_backgrounds', function (Blueprint $table): void {
            $table->id();
            $table->unsignedBigInteger('user_id');
            $table->unsignedBigInteger('religion_id')->nullable();
            $table->unsignedBigInteger('caste_id')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('careers', function (Blueprint $table): void {
            $table->id();
            $table->unsignedBigInteger('user_id');
            $table->string('designation')->nullable();
            $table->string('company')->nullable();
            $table->boolean('present')->default(true);
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('education', function (Blueprint $table): void {
            $table->id();
            $table->unsignedBigInteger('user_id');
            $table->string('degree')->nullable();
            $table->string('institution')->nullable();
            $table->boolean('is_highest_degree')->default(true);
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('physical_attributes', function (Blueprint $table): void {
            $table->id();
            $table->unsignedBigInteger('user_id');
            $table->decimal('height', 5, 2)->nullable();
            $table->decimal('weight', 5, 2)->nullable();
            $table->string('complexion')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    private function createUser(array $overrides = []): User
    {
        $user = User::create(array_merge([
            'first_name' => 'Test',
            'last_name' => 'User',
            'email' => 'test-'.uniqid().'@example.com',
            'password' => Hash::make('password'),
            'approved' => 1,
            'user_type' => 'member',
        ], $overrides));

        Member::create([
            'user_id' => $user->id,
            'gender' => 1,
        ]);

        return $user;
    }

    private function seedCompleteOnboardingRelations(int $userId): void
    {
        \DB::table('addresses')->insert([
            'user_id' => $userId,
            'type' => 'present',
            'country_id' => 1,
            'state_id' => 1,
            'city_id' => 1,
        ]);
        \DB::table('spiritual_backgrounds')->insert([
            'user_id' => $userId,
            'religion_id' => 1,
            'caste_id' => 1,
        ]);
        \DB::table('careers')->insert([
            'user_id' => $userId,
            'designation' => 'Doctor',
            'company' => 'Hospital',
            'present' => true,
        ]);
        \DB::table('education')->insert([
            'user_id' => $userId,
            'degree' => 'MBBS',
            'institution' => 'Medical College',
            'is_highest_degree' => true,
        ]);
        \DB::table('physical_attributes')->insert([
            'user_id' => $userId,
            'height' => 5.9,
            'weight' => 70,
            'complexion' => 'Fair',
        ]);
    }
}
