<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Create profile_audit_logs table.
     * Full audit trail for all profile changes with before/after values.
     */
    public function up(): void
    {
        Schema::create('profile_audit_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('section', 50); // e.g. 'basics', 'lifestyle', 'career', 'family', 'preferences', 'media'
            $table->string('field_name', 100); // e.g. 'first_name', 'height', 'marriage_timeline'
            $table->text('old_value')->nullable(); // JSON encoded for complex values
            $table->text('new_value')->nullable(); // JSON encoded for complex values
            $table->string('ip_address', 45)->nullable();
            $table->string('user_agent', 255)->nullable();
            $table->timestamp('changed_at')->useCurrent();
            $table->timestamps();

            // Indexes for efficient querying
            $table->index('user_id');
            $table->index(['user_id', 'section']);
            $table->index(['user_id', 'changed_at']);
            $table->index('changed_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('profile_audit_logs');
    }
};
