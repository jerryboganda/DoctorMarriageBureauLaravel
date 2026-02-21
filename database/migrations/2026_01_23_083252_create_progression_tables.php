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
        Schema::create('progression_stages', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->integer('order');
            $table->integer('progress_percent');
            $table->string('slug')->unique();
            $table->timestamps();
        });

        Schema::create('member_progressions', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id');     // The active user
            $table->unsignedBigInteger('partner_id');  // The match
            $table->unsignedBigInteger('current_stage_id')->nullable();
            
            $table->enum('status', ['active', 'on_hold', 'archived', 'married'])->default('active');
            $table->text('next_steps')->nullable();
            $table->integer('total_progress_percent')->default(0); 
            $table->timestamps();

            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('partner_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('current_stage_id')->references('id')->on('progression_stages');
            
            $table->unique(['user_id', 'partner_id']); 
        });

        Schema::create('progression_events', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('member_progression_id');
            
            $table->string('title');
            $table->dateTime('event_at');
            $table->string('location')->nullable();
            $table->enum('status', ['scheduled', 'completed', 'cancelled'])->default('scheduled');
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->foreign('member_progression_id')->references('id')->on('member_progressions')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('progression_events');
        Schema::dropIfExists('member_progressions');
        Schema::dropIfExists('progression_stages');
    }
};
