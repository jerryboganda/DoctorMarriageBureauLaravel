<?php

namespace Tests\Feature;

use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class EmailVerificationResendTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        Schema::dropAllTables();
        $this->createTestSchema();
    }

    public function test_send_email_verification_allows_reused_email_after_soft_delete(): void
    {
        config(['mail.from.address' => null, 'mail.from.name' => null]);

        $email = 'mindreader_420@yahoo.com';
        $deletedUser = User::create([
            'first_name' => 'Deleted',
            'last_name' => 'Member',
            'email' => $email,
            'phone' => '+923001234567',
            'password' => Hash::make('password123'),
            'code' => 'DELETED01',
            'membership' => 1,
            'approved' => 1,
            'user_type' => 'member',
            'email_verified_at' => Carbon::now(),
        ]);
        $deletedUser->delete();

        $response = $this->postJson('/api/send-email-verification', [
            'email' => $email,
            'intent' => 'signup',
        ]);

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('message', 'Verification code sent to your email');

        $this->assertDatabaseHas('verification_codes', [
            'identifier' => $email,
            'type' => 'email',
            'verified' => 0,
        ]);
    }

    protected function createTestSchema(): void
    {
        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->string('first_name')->nullable();
            $table->string('last_name')->nullable();
            $table->string('email')->nullable();
            $table->timestamp('email_verified_at')->nullable();
            $table->string('password')->nullable();
            $table->string('phone')->nullable();
            $table->string('code')->nullable()->unique();
            $table->unsignedTinyInteger('membership')->default(1);
            $table->unsignedTinyInteger('approved')->default(1);
            $table->unsignedTinyInteger('blocked')->default(0);
            $table->unsignedTinyInteger('deactivated')->default(0);
            $table->unsignedTinyInteger('photo_approved')->default(0);
            $table->unsignedTinyInteger('must_change_password')->default(0);
            $table->string('verification_code')->nullable();
            $table->string('provider_id')->nullable();
            $table->string('user_type')->nullable();
            $table->decimal('balance', 12, 2)->default(0);
            $table->text('remember_token')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('settings', function (Blueprint $table) {
            $table->id();
            $table->string('type')->unique();
            $table->text('value')->nullable();
            $table->timestamps();
        });

        Schema::create('verification_codes', function (Blueprint $table) {
            $table->id();
            $table->string('identifier');
            $table->string('code');
            $table->string('type');
            $table->timestamp('expires_at');
            $table->boolean('verified')->default(false);
            $table->timestamps();
        });
    }
}
