<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('addon_purchases')) {
            return;
        }

        Schema::create('addon_purchases', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('addon_product_id');
            $table->unsignedBigInteger('user_id');
            $table->string('payment_method', 30);
            $table->string('payment_status', 10);
            $table->longText('payment_details')->nullable();
            $table->double('amount');
            $table->double('original_amount')->nullable();
            $table->double('discount_amount')->nullable();
            $table->unsignedBigInteger('coupon_id')->nullable();
            $table->string('coupon_code', 100)->nullable();
            $table->string('payment_code', 100);
            $table->tinyInteger('offline_payment')->default(2);
            $table->string('custom_payment_name')->nullable();
            $table->string('custom_payment_transaction_id')->nullable();
            $table->longText('custom_payment_details')->nullable();
            $table->string('custom_payment_proof')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['user_id', 'addon_product_id']);
            $table->index(['coupon_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('addon_purchases');
    }
};
