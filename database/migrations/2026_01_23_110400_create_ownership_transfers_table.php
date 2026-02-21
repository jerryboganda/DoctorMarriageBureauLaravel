<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Ownership transfer with step-up authentication
     */
    public function up(): void
    {
        Schema::create('ownership_transfers', function (Blueprint $table) {
            $table->id();
            $table->bigInteger('member_id')->index();
            $table->foreignId('from_user_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('to_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('to_email', 255)->nullable();
            $table->string('to_phone', 20)->nullable();
            $table->string('to_name', 255)->nullable();
            $table->enum('status', ['pending', 'accepted', 'rejected', 'expired', 'cancelled'])->default('pending');
            $table->string('transfer_token', 64)->unique();
            $table->string('step_up_token', 64)->nullable()->comment('Token from step-up auth verification');
            $table->boolean('step_up_verified')->default(false);
            $table->timestamp('step_up_verified_at')->nullable();
            $table->text('transfer_reason')->nullable();
            $table->timestamp('expires_at');
            $table->timestamp('accepted_at')->nullable();
            $table->timestamp('rejected_at')->nullable();
            $table->string('rejection_reason', 500)->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->timestamps();
            
            $table->index(['member_id', 'status']);
            $table->index(['from_user_id', 'status']);
            $table->index('transfer_token');
        });

        // Step-up authentication tokens for sensitive operations
        Schema::create('step_up_auth_tokens', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->string('token', 64)->unique();
            $table->enum('purpose', ['ownership_transfer', '2fa_disable', 'account_delete', 'password_change'])->default('ownership_transfer');
            $table->boolean('password_verified')->default(false);
            $table->boolean('otp_verified')->default(false);
            $table->string('otp_code', 255)->nullable();
            $table->timestamp('otp_sent_at')->nullable();
            $table->timestamp('otp_expires_at')->nullable();
            $table->unsignedTinyInteger('otp_attempts')->default(0);
            $table->boolean('is_valid')->default(true);
            $table->timestamp('expires_at');
            $table->timestamp('completed_at')->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->timestamps();
            
            $table->index(['user_id', 'purpose', 'is_valid']);
            $table->index('token');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('step_up_auth_tokens');
        Schema::dropIfExists('ownership_transfers');
    }
};
