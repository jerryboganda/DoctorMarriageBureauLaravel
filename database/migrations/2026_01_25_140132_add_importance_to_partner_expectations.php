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
        Schema::table('partner_expectations', function (Blueprint $table) {
            $table->string('age_importance')->default('Dealbreaker')->after('max_age');
            $table->string('height_importance')->default('Nice to have')->after('height');
            $table->string('marital_status_importance')->default('Dealbreaker')->after('marital_status_id');
            $table->string('religion_importance')->default('Must have')->after('religion_id');
            $table->string('language_importance')->default('Nice to have')->after('language_id');
            $table->string('residence_importance')->default('Nice to have')->after('residence_country_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('partner_expectations', function (Blueprint $table) {
            $table->dropColumn([
                'age_importance',
                'height_importance',
                'marital_status_importance',
                'religion_importance',
                'language_importance',
                'residence_importance',
            ]);
        });
    }
};
