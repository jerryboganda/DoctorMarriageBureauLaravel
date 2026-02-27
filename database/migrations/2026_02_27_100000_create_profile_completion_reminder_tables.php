<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('profile_completion_reminder_settings', function (Blueprint $table) {
            $table->id();
            $table->boolean('is_enabled')->default(true);
            $table->unsignedInteger('threshold_percent')->default(80)->comment('Send reminder if profile completion < this %');
            $table->unsignedInteger('interval_days')->default(5)->comment('Days between reminder emails');
            $table->unsignedInteger('max_reminders')->default(10)->comment('Max reminders per user (0 = unlimited)');
            $table->string('email_subject')->default('Complete Your Profile - Doctor Marriage Bureau');
            $table->text('email_body')->nullable()->comment('Custom HTML email body. Use {name}, {percentage}, {link} placeholders.');
            $table->timestamps();
        });

        Schema::create('profile_completion_reminder_logs', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id');
            $table->unsignedInteger('profile_percentage');
            $table->timestamp('sent_at');
            $table->string('status')->default('sent')->comment('sent, failed');
            $table->text('error_message')->nullable();
            $table->timestamps();

            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            $table->index(['user_id', 'sent_at']);
        });

        // Insert default settings
        DB::table('profile_completion_reminder_settings')->insert([
            'is_enabled' => true,
            'threshold_percent' => 80,
            'interval_days' => 5,
            'max_reminders' => 10,
            'email_subject' => 'Complete Your Profile - Doctor Marriage Bureau',
            'email_body' => null,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    public function down()
    {
        Schema::dropIfExists('profile_completion_reminder_logs');
        Schema::dropIfExists('profile_completion_reminder_settings');
    }
};
