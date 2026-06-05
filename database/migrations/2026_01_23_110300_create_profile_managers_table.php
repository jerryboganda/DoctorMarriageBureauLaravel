<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Profile management mode and managers
     */
    public function up(): void
    {
        // Add management mode to members
        Schema::table('members', function (Blueprint $table) {
            $table->enum('management_mode', ['self', 'family', 'matchmaker', 'dual'])->default('self')->after('remaining_profile_image_view');
            $table->unsignedBigInteger('primary_manager_id')->nullable()->after('management_mode');
            $table->foreign('primary_manager_id')->references('id')->on('users')->nullOnDelete();
        });

        // Profile managers for multi-manager scenarios (family, matchmaker, dual control)
        Schema::create('profile_managers', function (Blueprint $table) {
            $table->id();
            $table->bigInteger('member_id')->index();
            $table->foreignId('manager_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('manager_email', 255)->nullable()->comment('For invited managers not yet registered');
            $table->string('manager_phone', 20)->nullable();
            $table->string('manager_name', 255)->nullable();
            $table->enum('manager_type', ['owner', 'family', 'matchmaker'])->default('family');
            $table->json('permissions')->nullable()->comment('Array of allowed actions');
            $table->boolean('is_primary')->default(false);
            $table->boolean('is_active')->default(true);
            $table->string('invitation_token', 64)->nullable();
            $table->timestamp('invited_at')->nullable();
            $table->timestamp('accepted_at')->nullable();
            $table->timestamps();

            $table->index(['member_id', 'is_active']);
            $table->index('invitation_token');
            $table->index('manager_user_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('profile_managers');

        Schema::table('members', function (Blueprint $table) {
            $table->dropForeign(['primary_manager_id']);
            $table->dropColumn(['management_mode', 'primary_manager_id']);
        });
    }
};
