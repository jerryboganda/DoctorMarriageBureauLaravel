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
        // Job Titles lookup table
        Schema::create('job_titles', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->timestamps();
            $table->softDeletes();
        });

        // Specialities lookup table
        Schema::create('specialities', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->timestamps();
            $table->softDeletes();
        });

        // Add foreign keys to careers table
        Schema::table('careers', function (Blueprint $table) {
            $table->unsignedBigInteger('job_title_id')->nullable()->after('designation');
            $table->unsignedBigInteger('speciality_id')->nullable()->after('job_title_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('careers', function (Blueprint $table) {
            $table->dropColumn(['job_title_id', 'speciality_id']);
        });

        Schema::dropIfExists('specialities');
        Schema::dropIfExists('job_titles');
    }
};
