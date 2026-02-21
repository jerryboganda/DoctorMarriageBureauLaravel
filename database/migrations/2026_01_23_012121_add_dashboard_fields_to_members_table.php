<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('members', function (Blueprint $table) {
            $table->boolean('is_agent_pick')->default(0)->after('user_id');
            $table->boolean('is_high_intent')->default(0)->after('is_agent_pick');
            $table->boolean('travel_mode')->default(0)->after('is_high_intent');
            $table->boolean('is_visible')->default(1)->after('travel_mode');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('members', function (Blueprint $table) {
            $table->dropColumn(['is_agent_pick', 'is_high_intent', 'travel_mode', 'is_visible']);
        });
    }
};
