<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('user_notification_preferences', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained()->cascadeOnDelete();
            
            // Notification Channels
            $table->boolean('email_digest')->default(true)->comment('Daily email summary');
            $table->boolean('whatsapp')->default(true)->comment('Instant WhatsApp alerts');
            $table->boolean('push_notifications')->default(true)->comment('Real-time push notifications');
            $table->boolean('sms')->default(false)->comment('SMS (security only by default)');
            
            // Curated Digests
            $table->boolean('weekly_digest')->default(true)->comment('Weekly Top 5 profiles');
            
            // Profile Status
            $table->boolean('profile_snoozed')->default(false);
            $table->timestamp('snooze_until')->nullable();
            
            $table->timestamps();
        });

        // Add notification type column to track categories
        if (Schema::hasTable('notifications') && !Schema::hasColumn('notifications', 'notification_type')) {
            Schema::table('notifications', function (Blueprint $table) {
                $table->string('notification_type', 50)->nullable()->after('data')
                      ->comment('match, expiry, search_alert, safety, profile_view, system');
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('user_notification_preferences');
        
        if (Schema::hasColumn('notifications', 'notification_type')) {
            Schema::table('notifications', function (Blueprint $table) {
                $table->dropColumn('notification_type');
            });
        }
    }
};
