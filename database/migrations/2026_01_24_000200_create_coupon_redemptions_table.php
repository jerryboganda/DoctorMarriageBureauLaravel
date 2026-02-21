<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('coupon_redemptions')) {
            return;
        }

        Schema::create('coupon_redemptions', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('coupon_id');
            $table->unsignedBigInteger('user_id');
            $table->unsignedBigInteger('package_payment_id')->nullable();
            $table->unsignedBigInteger('addon_purchase_id')->nullable();
            $table->string('code', 100);
            $table->string('purchase_type', 20)->nullable();
            $table->decimal('original_amount', 12, 2);
            $table->decimal('discount_amount', 12, 2);
            $table->decimal('final_amount', 12, 2);
            $table->timestamp('redeemed_at')->nullable();
            $table->timestamps();

            $table->index(['coupon_id', 'user_id']);
            $table->index(['package_payment_id']);
            $table->index(['addon_purchase_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('coupon_redemptions');
    }
};
