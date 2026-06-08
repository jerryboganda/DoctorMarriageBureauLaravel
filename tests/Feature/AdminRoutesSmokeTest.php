<?php

namespace Tests\Feature;

use App\Models\Notification;
use App\Models\User;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class AdminRoutesSmokeTest extends TestCase
{
    public function test_admin_login_route_does_not_500(): void
    {
        $this->get('/admin')->assertOk();
        $this->get('/admin/login')->assertOk();
    }

    public function test_admin_react_route_serves_shell_without_500(): void
    {
        $response = $this->get('/admin-react/login');

        $response->assertOk();
        $response->assertHeader('content-type', 'text/html; charset=UTF-8');
    }

    public function test_admin_api_auth_guard_does_not_500_when_unauthenticated(): void
    {
        $this->getJson('/api/health')->assertOk();

        $response = $this->getJson('/api/admin/me');

        $this->assertContains($response->getStatusCode(), [401, 403]);
    }

    public function test_admin_notification_header_handles_cast_array_payloads(): void
    {
        $this->createMinimalUsersTable();
        $this->createMinimalNotificationsTable();
        $this->createMinimalLanguagesTable();

        $admin = User::query()->create([
            'first_name' => 'Admin',
            'last_name' => 'User',
            'name' => 'Admin User',
            'email' => 'admin@example.test',
            'password' => Hash::make('password'),
            'user_type' => 'admin',
            'photo' => null,
        ]);

        Notification::query()->create([
            'id' => '11111111-1111-4111-8111-111111111111',
            'type' => 'database',
            'notifiable_type' => User::class,
            'notifiable_id' => $admin->id,
            'data' => [
                'notify_by' => $admin->id,
                'message' => 'Array payload notification',
            ],
            'read_at' => null,
        ]);

        $this->actingAs($admin);

        $html = view('admin.inc.header')->render();

        $this->assertStringContainsString('Array payload notification', $html);
    }

    private function createMinimalUsersTable(): void
    {
        Schema::dropIfExists('notifications');
        Schema::dropIfExists('languages');
        Schema::dropIfExists('users');

        Schema::create('users', function (Blueprint $table): void {
            $table->id();
            $table->string('first_name')->nullable();
            $table->string('last_name')->nullable();
            $table->string('name')->nullable();
            $table->string('email')->unique();
            $table->string('password');
            $table->string('user_type')->default('member');
            $table->unsignedBigInteger('photo')->nullable();
            $table->rememberToken();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    private function createMinimalNotificationsTable(): void
    {
        Schema::create('notifications', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->string('type');
            $table->morphs('notifiable');
            $table->text('data');
            $table->timestamp('read_at')->nullable();
            $table->timestamps();
        });
    }

    private function createMinimalLanguagesTable(): void
    {
        Schema::create('languages', function (Blueprint $table): void {
            $table->id();
            $table->string('name')->default('English');
            $table->string('code')->default('en');
            $table->boolean('rtl')->default(false);
            $table->timestamps();
            $table->softDeletes();
        });
    }
}
