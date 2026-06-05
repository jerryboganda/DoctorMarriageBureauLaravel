<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Adds missing columns for My Profile screen features:
     * - Marriage Intent fields (timeline, relocation, seriousness)
     * - Quality score tracking
     * - Voice/Video intro paths
     * - Additional lifestyle, family, career, partner preference fields
     * - Gallery privacy levels
     */
    public function up(): void
    {
        // Members table - Marriage Intent & Media
        Schema::table('members', function (Blueprint $table) {
            $table->enum('marriage_timeline', ['immediate', '6_months', '1_year', '2_years', 'casual'])
                ->nullable()->after('auto_profile_match');
            $table->enum('relocation_willingness', ['international', 'within_country', 'within_state', 'not_willing'])
                ->nullable()->after('marriage_timeline');
            $table->enum('seriousness_level', ['marriage', 'exploring', 'casual'])
                ->nullable()->default('marriage')->after('relocation_willingness');
            $table->string('voice_intro_path', 255)->nullable()->after('seriousness_level');
            $table->string('intro_video_path', 255)->nullable()->after('voice_intro_path');
            $table->string('nationality', 100)->nullable()->after('intro_video_path');
        });

        // Lifestyles table - Sleep schedule
        Schema::table('lifestyles', function (Blueprint $table) {
            $table->enum('sleep_schedule', ['early_bird', 'night_owl', 'flexible'])
                ->nullable()->after('living_with');
            $table->json('personality_tags')->nullable()->after('sleep_schedule');
        });

        // Families table - Family type
        Schema::table('families', function (Blueprint $table) {
            $table->enum('family_type', ['nuclear', 'joint', 'extended'])
                ->nullable()->after('user_id');
        });

        // Spiritual backgrounds - Gothra/Clan
        Schema::table('spiritual_backgrounds', function (Blueprint $table) {
            $table->string('gothra', 100)->nullable()->after('sub_caste_id');
        });

        // Careers table - Work location type
        Schema::table('careers', function (Blueprint $table) {
            $table->enum('work_location_type', ['on_site', 'remote', 'hybrid'])
                ->nullable()->after('present');
        });

        // Partner expectations - Age range
        Schema::table('partner_expectations', function (Blueprint $table) {
            $table->integer('min_age')->nullable()->after('general');
            $table->integer('max_age')->nullable()->after('min_age');
        });

        // Gallery images - Privacy level
        Schema::table('gallery_images', function (Blueprint $table) {
            $table->enum('privacy_level', ['public', 'connections', 'private', 'vault'])
                ->default('public')->after('image');
            $table->boolean('is_main_photo')->default(false)->after('privacy_level');
            $table->integer('sort_order')->default(0)->after('is_main_photo');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('members', function (Blueprint $table) {
            $table->dropColumn([
                'marriage_timeline',
                'relocation_willingness',
                'seriousness_level',
                'voice_intro_path',
                'intro_video_path',
                'nationality',
            ]);
        });

        Schema::table('lifestyles', function (Blueprint $table) {
            $table->dropColumn(['sleep_schedule', 'personality_tags']);
        });

        Schema::table('families', function (Blueprint $table) {
            $table->dropColumn('family_type');
        });

        Schema::table('spiritual_backgrounds', function (Blueprint $table) {
            $table->dropColumn('gothra');
        });

        Schema::table('careers', function (Blueprint $table) {
            $table->dropColumn('work_location_type');
        });

        Schema::table('partner_expectations', function (Blueprint $table) {
            $table->dropColumn(['min_age', 'max_age']);
        });

        Schema::table('gallery_images', function (Blueprint $table) {
            $table->dropColumn(['privacy_level', 'is_main_photo', 'sort_order']);
        });
    }
};
