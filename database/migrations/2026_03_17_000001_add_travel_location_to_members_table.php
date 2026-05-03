<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('members', function (Blueprint $table) {
            $table->string('travel_city', 100)->nullable()->after('travel_mode');
            $table->string('travel_country', 100)->nullable()->after('travel_city');
        });
    }

    public function down(): void
    {
        Schema::table('members', function (Blueprint $table) {
            $table->dropColumn(['travel_city', 'travel_country']);
        });
    }
};
