<?php

namespace Tests\Feature\Api;

use App\Models\Career;
use App\Models\Member;
use App\Models\PartnerExpectation;
use App\Models\SpiritualBackground;
use App\Models\User;
use App\Utility\MemberUtility;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class OnboardingControllerTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        Schema::dropAllTables();
        $this->createTestSchema();
        MemberUtility::resetCaches();
    }

    public function test_it_rejects_onboarding_without_date_of_birth(): void
    {
        $user = $this->createUser();

        Sanctum::actingAs($user);

        $response = $this->postJson('/api/onboarding/complete', [
            'gender' => 'Male',
            'religion' => 'Islam',
            'specialty' => 'Cardiology',
        ]);

        $response->assertUnprocessable();
        $response->assertJsonValidationErrors(['dateOfBirth']);
    }

    public function test_it_saves_a_real_date_of_birth_during_onboarding(): void
    {
        $user = $this->createUser();

        Sanctum::actingAs($user);

        $response = $this->postJson('/api/onboarding/complete', [
            'gender' => 'Female',
            'dateOfBirth' => '1995-08-14',
            'religion' => 'Islam',
            'specialty' => 'Dermatology',
            'degree' => 'MBBS',
            'hospital' => 'City Hospital',
            'partnerMinAge' => 28,
            'partnerMaxAge' => 35,
        ]);

        $response->assertOk();
        $response->assertJsonPath('result', true);

        $this->assertDatabaseHas('members', [
            'user_id' => $user->id,
            'birthday' => '1995-08-14',
        ]);

        $this->assertDatabaseHas('careers', [
            'user_id' => $user->id,
            'designation' => 'Dermatology',
            'company' => 'City Hospital',
        ]);

        $this->assertDatabaseHas('education', [
            'user_id' => $user->id,
            'degree' => 'MBBS',
        ]);

        $this->assertDatabaseHas('partner_expectations', [
            'user_id' => $user->id,
            'age_from' => 28,
            'age_to' => 35,
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
            $table->string('phone')->nullable();
            $table->unsignedTinyInteger('approved')->default(1);
            $table->string('user_type')->default('member');
            $table->string('verification_info')->nullable();
            $table->boolean('blocked')->default(0);
            $table->boolean('deactivated')->default(0);
            $table->string('photo')->nullable();
            $table->rememberToken();
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('members', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users');
            $table->unsignedTinyInteger('gender')->nullable();
            $table->date('birthday')->nullable();
            $table->unsignedBigInteger('on_behalves_id')->nullable();
            $table->unsignedBigInteger('marital_status_id')->nullable();
            $table->unsignedTinyInteger('children')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('spiritual_backgrounds', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id');
            $table->string('religion')->nullable();
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
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('partner_expectations', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id');
            $table->unsignedTinyInteger('age_from')->nullable();
            $table->unsignedTinyInteger('age_to')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    private function createUser(): User
    {
        $user = User::create([
            'first_name' => 'Test',
            'last_name' => 'User',
            'email' => 'test-' . uniqid() . '@example.com',
            'password' => Hash::make('password'),
            'approved' => 1,
            'user_type' => 'member',
        ]);

        Member::create([
            'user_id' => $user->id,
            'gender' => 1,
            'birthday' => null,
            'on_behalves_id' => null,
            'marital_status_id' => null,
            'children' => null,
        ]);

        return $user;
    }
}
