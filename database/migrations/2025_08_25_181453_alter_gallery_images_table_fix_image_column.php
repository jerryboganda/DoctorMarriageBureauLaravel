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
        Schema::table('gallery_images', function (Blueprint $table) {
            // Change the image column to TEXT to handle longer image paths/URLs
            $table->text('image')->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('gallery_images', function (Blueprint $table) {
            // Revert back to VARCHAR if needed
            $table->string('image')->change();
        });
    }
};
