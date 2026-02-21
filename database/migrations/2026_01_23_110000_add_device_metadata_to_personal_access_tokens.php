<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Adds device tracking metadata to personal_access_tokens for session management
     */
    public function up(): void
    {
        Schema::table('personal_access_tokens', function (Blueprint $table) {
            $table->string('device_name', 255)->nullable()->after('abilities');
            $table->enum('device_type', ['desktop', 'mobile', 'tablet', 'unknown'])->default('unknown')->after('device_name');
            $table->string('browser', 100)->nullable()->after('device_type');
            $table->string('browser_version', 50)->nullable()->after('browser');
            $table->string('os', 100)->nullable()->after('browser_version');
            $table->string('os_version', 50)->nullable()->after('os');
            $table->string('ip_address', 45)->nullable()->after('os_version');
            $table->string('location_city', 100)->nullable()->after('ip_address');
            $table->string('location_region', 100)->nullable()->after('location_city');
            $table->string('location_country', 100)->nullable()->after('location_region');
            $table->string('location_country_code', 10)->nullable()->after('location_country');
            $table->decimal('latitude', 10, 8)->nullable()->after('location_country_code');
            $table->decimal('longitude', 11, 8)->nullable()->after('latitude');
            $table->text('user_agent')->nullable()->after('longitude');
            $table->boolean('is_current')->default(false)->after('user_agent');
            $table->timestamp('logged_in_at')->nullable()->after('is_current');
            
            // Index for quick lookup with custom short name
            $table->index(['tokenable_id', 'last_used_at'], 'pat_tokenable_last_used_idx');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('personal_access_tokens', function (Blueprint $table) {
            $table->dropIndex('pat_tokenable_last_used_idx');
            $table->dropColumn([
                'device_name', 'device_type', 'browser', 'browser_version',
                'os', 'os_version', 'ip_address', 'location_city', 'location_region',
                'location_country', 'location_country_code', 'latitude', 'longitude',
                'user_agent', 'is_current', 'logged_in_at'
            ]);
        });
    }
};
