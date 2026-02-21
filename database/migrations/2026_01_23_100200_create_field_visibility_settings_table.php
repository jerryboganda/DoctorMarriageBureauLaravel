<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Create field_visibility_settings table.
     * Controls per-field visibility (eye toggle) for profile fields.
     */
    public function up(): void
    {
        Schema::create('field_visibility_settings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('field_name', 100); // e.g. 'full_name', 'birthday', 'salary', 'phone'
            $table->boolean('is_visible')->default(true);
            $table->timestamps();

            // Each user can only have one visibility setting per field
            $table->unique(['user_id', 'field_name']);
            $table->index('user_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('field_visibility_settings');
    }
};
