<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('referral_settings', function (Blueprint $table) {
            $table->boolean('popup_enabled')->default(false)->after('anti_fraud_settings');
            $table->string('popup_headline', 255)->default('Join Our Referral Program!')->after('popup_enabled');
            $table->text('popup_body')->nullable()->after('popup_headline');
            $table->string('popup_cta_text', 100)->default('Start Referring Now')->after('popup_body');
            $table->unsignedInteger('popup_bonus_days')->default(30)->after('popup_cta_text');
            $table->string('popup_show_frequency', 30)->default('once_per_session')->after('popup_bonus_days');
            $table->unsignedInteger('popup_delay_seconds')->default(2)->after('popup_show_frequency');
        });

        // Set sensible default body text
        \DB::table('referral_settings')->update([
            'popup_body' => "We have an exciting offer for you! Refer 3 friends to Doctor Marriage Bureau and when they successfully register using your referral code, you'll receive a FREE premium plan upgrade.\n\nTrack your progress in real-time from your Referral System dashboard.",
        ]);
    }

    public function down(): void
    {
        Schema::table('referral_settings', function (Blueprint $table) {
            $table->dropColumn([
                'popup_enabled',
                'popup_headline',
                'popup_body',
                'popup_cta_text',
                'popup_bonus_days',
                'popup_show_frequency',
                'popup_delay_seconds',
            ]);
        });
    }
};
