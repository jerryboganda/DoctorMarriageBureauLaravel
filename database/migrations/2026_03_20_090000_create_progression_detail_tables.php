<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('progression_checklist_items')) {
            Schema::create('progression_checklist_items', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('member_progression_id');
            $table->string('title');
            $table->boolean('is_completed')->default(false);
            $table->timestamp('completed_at')->nullable();
            $table->integer('sort_order')->default(0);
            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();
            $table->timestamps();

            $table->foreign('member_progression_id')->references('id')->on('member_progressions')->onDelete('cascade');
            $table->index(['member_progression_id', 'sort_order'], 'prog_chk_member_sort_idx');
            });
        }

        if (!Schema::hasTable('progression_notes')) {
            Schema::create('progression_notes', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('member_progression_id');
            $table->unsignedBigInteger('author_id')->nullable();
            $table->string('note_type')->default('family_feedback');
            $table->text('note');
            $table->timestamps();

            $table->foreign('member_progression_id')->references('id')->on('member_progressions')->onDelete('cascade');
            $table->index(['member_progression_id', 'note_type'], 'prog_notes_member_type_idx');
            });
        }

        if (!Schema::hasTable('progression_venues')) {
            Schema::create('progression_venues', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('member_progression_id');
            $table->string('name');
            $table->string('venue_type')->nullable();
            $table->decimal('estimated_cost', 12, 2)->nullable();
            $table->decimal('rating', 3, 1)->nullable();
            $table->enum('status', ['shortlisted', 'visited', 'confirmed', 'rejected'])->default('shortlisted');
            $table->timestamp('visited_at')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->foreign('member_progression_id')->references('id')->on('member_progressions')->onDelete('cascade');
            $table->index(['member_progression_id', 'status'], 'prog_venues_member_status_idx');
            });
        }

        if (!Schema::hasTable('progression_budget_items')) {
            Schema::create('progression_budget_items', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('member_progression_id');
            $table->string('label');
            $table->decimal('amount', 12, 2)->default(0);
            $table->string('category')->nullable();
            $table->enum('status', ['planned', 'reserved', 'spent', 'paid'])->default('planned');
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->foreign('member_progression_id')->references('id')->on('member_progressions')->onDelete('cascade');
            $table->index(['member_progression_id', 'status'], 'prog_budget_member_status_idx');
            });
        }

        if (!Schema::hasTable('progression_settings')) {
            Schema::create('progression_settings', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('member_progression_id')->unique();
            $table->boolean('share_calendar_busy')->default(true);
            $table->boolean('auto_detect_timezone')->default(true);
            $table->string('timezone')->nullable();
            $table->decimal('budget_target', 12, 2)->nullable();
            $table->timestamps();

            $table->foreign('member_progression_id')->references('id')->on('member_progressions')->onDelete('cascade');
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('progression_settings');
        Schema::dropIfExists('progression_budget_items');
        Schema::dropIfExists('progression_venues');
        Schema::dropIfExists('progression_notes');
        Schema::dropIfExists('progression_checklist_items');
    }
};
