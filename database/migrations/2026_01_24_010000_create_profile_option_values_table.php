<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('profile_option_values', function (Blueprint $table) {
            $table->id();
            $table->string('group', 64);
            $table->string('value', 128);
            $table->string('label', 191);
            $table->unsignedInteger('sort_order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->unique(['group', 'value'], 'profile_option_group_value_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('profile_option_values');
    }
};
