<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        // Add referred_by column to users table (was referenced but never created)
        if (! Schema::hasColumn('users', 'referred_by')) {
            Schema::table('users', function (Blueprint $table) {
                $table->unsignedBigInteger('referred_by')->nullable()->after('code');
                $table->foreign('referred_by')->references('id')->on('users')->onDelete('set null');
                $table->index('referred_by');
            });
        }

        // Fix referrals.source enum to include 'signup' as a valid source
        if (Schema::hasTable('referrals')) {
            DB::statement("ALTER TABLE referrals MODIFY COLUMN source ENUM('link', 'manual', 'admin', 'signup') DEFAULT 'link'");
        }
    }

    public function down()
    {
        if (Schema::hasColumn('users', 'referred_by')) {
            Schema::table('users', function (Blueprint $table) {
                $table->dropForeign(['referred_by']);
                $table->dropIndex(['referred_by']);
                $table->dropColumn('referred_by');
            });
        }

        if (Schema::hasTable('referrals')) {
            DB::statement("ALTER TABLE referrals MODIFY COLUMN source ENUM('link', 'manual', 'admin') DEFAULT 'link'");
        }
    }
};
