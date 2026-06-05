<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('families', function (Blueprint $table) {
            if (! Schema::hasColumn('families', 'affluence_level')) {
                $table->string('affluence_level')->nullable()->comment('Upper Middle Class, HNI, Middle Class');
            }
            if (! Schema::hasColumn('families', 'interests')) {
                $table->json('interests')->nullable()->comment('JSON array of family interests');
            }
            if (! Schema::hasColumn('families', 'father_occupation')) {
                $table->string('father_occupation')->nullable();
            }
            if (! Schema::hasColumn('families', 'mother_occupation')) {
                $table->string('mother_occupation')->nullable();
            }
        });
    }

    public function down(): void
    {
        Schema::table('families', function (Blueprint $table) {
            $table->dropColumn(['affluence_level', 'interests']);
        });
    }
};
