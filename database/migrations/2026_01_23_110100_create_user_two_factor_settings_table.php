<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Two-Factor Authentication settings with TOTP support
     */
    public function up(): void
    {
        Schema::create('user_two_factor_settings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->boolean('is_enabled')->default(false);
            $table->enum('method', ['app', 'sms', 'email'])->default('app');
            $table->text('secret')->nullable()->comment('Encrypted TOTP secret for authenticator apps');
            $table->text('recovery_codes')->nullable()->comment('JSON array of hashed recovery codes');
            $table->timestamp('confirmed_at')->nullable()->comment('When 2FA was successfully verified and enabled');
            $table->timestamp('last_used_at')->nullable();
            $table->string('backup_phone', 20)->nullable()->comment('Backup phone for SMS 2FA');
            $table->string('backup_email', 255)->nullable()->comment('Backup email for email 2FA');
            $table->unsignedInteger('failed_attempts')->default(0);
            $table->timestamp('locked_until')->nullable()->comment('Lockout after too many failed attempts');
            $table->timestamps();
            
            $table->unique('user_id');
            $table->index(['user_id', 'is_enabled']);
        });

        // Add 2FA pending state to users for login flow
        Schema::table('users', function (Blueprint $table) {
            $table->boolean('two_factor_pending')->default(false)->after('password');
            $table->string('two_factor_token', 64)->nullable()->after('two_factor_pending');
            $table->timestamp('two_factor_token_expires_at')->nullable()->after('two_factor_token');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['two_factor_pending', 'two_factor_token', 'two_factor_token_expires_at']);
        });
        
        Schema::dropIfExists('user_two_factor_settings');
    }
};
