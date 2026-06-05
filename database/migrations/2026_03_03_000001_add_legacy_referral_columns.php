<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('users', 'referral_comission')) {
            Schema::table('users', function (Blueprint $table) {
                $table->boolean('referral_comission')->default(0)->after('referred_by');
            });
        }

        if (! Schema::hasColumn('wallets', 'referral_user')) {
            Schema::table('wallets', function (Blueprint $table) {
                $table->unsignedBigInteger('referral_user')->nullable()->after('payment_details');
                $table->index('referral_user');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('wallets', 'referral_user')) {
            Schema::table('wallets', function (Blueprint $table) {
                $table->dropIndex(['referral_user']);
                $table->dropColumn('referral_user');
            });
        }

        if (Schema::hasColumn('users', 'referral_comission')) {
            Schema::table('users', function (Blueprint $table) {
                $table->dropColumn('referral_comission');
            });
        }
    }
};
