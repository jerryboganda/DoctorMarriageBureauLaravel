<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('verification_codes', function (Blueprint $table) {
            $table->id();
            $table->string('identifier'); // email or phone
            $table->string('code', 6);
            $table->string('type', 20); // 'email' or 'phone'
            $table->timestamp('expires_at');
            $table->boolean('verified')->default(false);
            $table->timestamps();
            
            $table->index(['identifier', 'type']);
            $table->index('expires_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('verification_codes');
    }
};
