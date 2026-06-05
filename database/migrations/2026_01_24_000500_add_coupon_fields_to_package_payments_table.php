<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('package_payments')) {
            return;
        }

        Schema::table('package_payments', function (Blueprint $table) {
            if (! Schema::hasColumn('package_payments', 'original_amount')) {
                $table->double('original_amount')->nullable()->after('amount');
            }
            if (! Schema::hasColumn('package_payments', 'discount_amount')) {
                $table->double('discount_amount')->nullable()->after('original_amount');
            }
            if (! Schema::hasColumn('package_payments', 'coupon_id')) {
                $table->unsignedBigInteger('coupon_id')->nullable()->after('discount_amount');
            }
            if (! Schema::hasColumn('package_payments', 'coupon_code')) {
                $table->string('coupon_code', 100)->nullable()->after('coupon_id');
            }
        });
    }

    public function down(): void
    {
        if (! Schema::hasTable('package_payments')) {
            return;
        }

        Schema::table('package_payments', function (Blueprint $table) {
            if (Schema::hasColumn('package_payments', 'coupon_code')) {
                $table->dropColumn('coupon_code');
            }
            if (Schema::hasColumn('package_payments', 'coupon_id')) {
                $table->dropColumn('coupon_id');
            }
            if (Schema::hasColumn('package_payments', 'discount_amount')) {
                $table->dropColumn('discount_amount');
            }
            if (Schema::hasColumn('package_payments', 'original_amount')) {
                $table->dropColumn('original_amount');
            }
        });
    }
};
