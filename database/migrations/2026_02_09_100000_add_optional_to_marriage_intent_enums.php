<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Add 'optional' value to marriage_timeline, relocation_willingness, and seriousness_level enum columns.
     */
    public function up(): void
    {
        DB::statement("ALTER TABLE members MODIFY COLUMN marriage_timeline ENUM('immediate','6_months','1_year','2_years','casual','optional') NULL");
        DB::statement("ALTER TABLE members MODIFY COLUMN relocation_willingness ENUM('international','within_country','within_state','not_willing','optional') NULL");
        DB::statement("ALTER TABLE members MODIFY COLUMN seriousness_level ENUM('marriage','exploring','casual','optional') NULL DEFAULT 'marriage'");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Revert any 'optional' values back to null before changing the enum
        DB::statement("UPDATE members SET marriage_timeline = NULL WHERE marriage_timeline = 'optional'");
        DB::statement("UPDATE members SET relocation_willingness = NULL WHERE relocation_willingness = 'optional'");
        DB::statement("UPDATE members SET seriousness_level = 'marriage' WHERE seriousness_level = 'optional'");

        DB::statement("ALTER TABLE members MODIFY COLUMN marriage_timeline ENUM('immediate','6_months','1_year','2_years','casual') NULL");
        DB::statement("ALTER TABLE members MODIFY COLUMN relocation_willingness ENUM('international','within_country','within_state','not_willing') NULL");
        DB::statement("ALTER TABLE members MODIFY COLUMN seriousness_level ENUM('marriage','exploring','casual') NULL DEFAULT 'marriage'");
    }
};
