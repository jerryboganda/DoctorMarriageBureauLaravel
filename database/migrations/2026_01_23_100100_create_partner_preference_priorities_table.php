<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Create partner_preference_priorities table.
     * Stores priority level (dealbreaker, must_have, nice_to_have) for each preference field.
     */
    public function up(): void
    {
        Schema::create('partner_preference_priorities', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('field_name', 50); // e.g. 'age', 'height', 'religion', 'profession'
            $table->enum('priority_type', ['dealbreaker', 'must_have', 'nice_to_have', 'flexible'])
                ->default('flexible');
            $table->timestamps();

            // Each user can only have one priority per field
            $table->unique(['user_id', 'field_name']);
            $table->index('user_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('partner_preference_priorities');
    }
};
