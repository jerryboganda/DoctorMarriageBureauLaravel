<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('lifestyles', function (Blueprint $table) {
            $table->string('property_details')->nullable()->after('property');
        });
    }

    public function down(): void
    {
        Schema::table('lifestyles', function (Blueprint $table) {
            $table->dropColumn('property_details');
        });
    }
};
