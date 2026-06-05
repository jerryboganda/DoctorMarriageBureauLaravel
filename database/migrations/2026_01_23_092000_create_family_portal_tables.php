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
        // 1. Extend existing 'families' table
        if (Schema::hasTable('families')) {
            Schema::table('families', function (Blueprint $table) {
                // Check if columns exist before adding to prevent errors on re-run
                if (! Schema::hasColumn('families', 'about_description')) {
                    $table->text('about_description')->nullable();
                }
                if (! Schema::hasColumn('families', 'location_city')) {
                    $table->string('location_city')->nullable();
                }
                if (! Schema::hasColumn('families', 'location_country')) {
                    $table->string('location_country')->nullable();
                }
                if (! Schema::hasColumn('families', 'tradition_level')) {
                    $table->string('tradition_level')->nullable()->comment('Liberal, Moderate, Conservative');
                }
            });
        } else {
            Schema::create('families', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->constrained()->cascadeOnDelete();
                $table->text('about_description')->nullable();
                $table->string('location_city')->nullable();
                $table->string('location_country')->nullable();
                $table->string('tradition_level')->nullable();
                $table->timestamps();
            });
        }

        // 2. Create 'family_guardians' table
        Schema::create('family_guardians', function (Blueprint $table) {
            $table->id();
            $table->bigInteger('family_id'); // Match families.id which is signed bigint
            $table->foreign('family_id')->references('id')->on('families')->cascadeOnDelete();

            $table->foreignId('user_id')->nullable()->comment('If the guardian is also a system user');
            $table->string('name');
            $table->string('relationship')->comment('Father, Mother, Uncle, etc.');
            $table->string('phone')->nullable();
            $table->string('email')->nullable();
            $table->boolean('is_primary_contact')->default(false);
            $table->timestamps();
        });

        // 3. Create 'family_photos' table
        Schema::create('family_photos', function (Blueprint $table) {
            $table->id();
            $table->bigInteger('family_id'); // Match families.id which is signed bigint
            $table->foreign('family_id')->references('id')->on('families')->cascadeOnDelete();

            $table->string('photo_path');
            $table->string('caption')->nullable();
            $table->integer('sort_order')->default(0);
            $table->timestamps();
        });

        // 4. Create 'family_approvals' table (For auditing/logging approvals)
        Schema::create('family_approvals', function (Blueprint $table) {
            $table->id();
            $table->bigInteger('family_id'); // Match families.id which is signed bigint
            $table->foreign('family_id')->references('id')->on('families')->cascadeOnDelete();

            $table->foreignId('guardian_id')->constrained('family_guardians')->cascadeOnDelete();
            $table->foreignId('target_user_id')->constrained('users')->cascadeOnDelete()->comment('The suitor being approved');
            $table->string('status')->default('pending')->comment('pending, approved, rejected');
            $table->text('notes')->nullable();
            $table->timestamp('responded_at')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('family_approvals');
        Schema::dropIfExists('family_photos');
        Schema::dropIfExists('family_guardians');

        if (Schema::hasTable('families')) {
            Schema::table('families', function (Blueprint $table) {
                $table->dropColumn(['about_description', 'location_city', 'location_country', 'tradition_level']);
            });
        }
    }
};
