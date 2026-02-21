<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Trusted contacts for account recovery
     */
    public function up(): void
    {
        Schema::create('trusted_contacts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->string('name', 255);
            $table->enum('relationship', ['parent', 'sibling', 'spouse', 'friend', 'relative', 'other'])->default('other');
            $table->string('phone', 20)->nullable();
            $table->string('email', 255)->nullable();
            $table->boolean('is_verified')->default(false);
            $table->string('verification_token', 64)->nullable();
            $table->timestamp('verification_sent_at')->nullable();
            $table->timestamp('verified_at')->nullable();
            $table->boolean('can_recover_account')->default(true);
            $table->boolean('notify_on_login')->default(false);
            $table->timestamps();
            
            $table->index(['user_id', 'is_verified']);
            $table->index('verification_token');
        });

        // Recovery requests initiated via trusted contacts
        Schema::create('account_recovery_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('trusted_contact_id')->constrained('trusted_contacts')->onDelete('cascade');
            $table->string('recovery_token', 64)->unique();
            $table->enum('status', ['pending', 'approved', 'rejected', 'expired', 'completed'])->default('pending');
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->timestamp('expires_at');
            $table->timestamp('approved_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();
            
            $table->index(['user_id', 'status']);
            $table->index('recovery_token');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('account_recovery_requests');
        Schema::dropIfExists('trusted_contacts');
    }
};
