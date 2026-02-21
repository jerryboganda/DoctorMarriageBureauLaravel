<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('coupons')) {
            return;
        }

        Schema::create('coupons', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->string('code')->unique();
            $table->string('name')->nullable();
            $table->text('description')->nullable();
            $table->string('discount_type', 20)->default('amount');
            $table->decimal('discount_value', 12, 2);
            $table->decimal('min_amount', 12, 2)->nullable();
            $table->unsignedInteger('max_redemptions')->nullable();
            $table->unsignedInteger('used_count')->default(0);
            $table->unsignedInteger('per_user_limit')->nullable();
            $table->string('applicable_to', 20)->default('any');
            $table->timestamp('starts_at')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('coupons');
    }
};
