<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Fix two production issues:
 * 1) families & members tables use utf8mb3 collation, causing crashes when users
 *    enter emoji characters (4-byte UTF-8). Convert to utf8mb4_unicode_ci.
 * 2) physical_attributes.height column is DOUBLE(3,2) which can only store values
 *    up to 9.99. Heights in cm (e.g. 180) converted to feet (5.91) fit, but
 *    certain edge cases from the profile editor send larger cm values that convert
 *    to >9.99 feet. Expand to DOUBLE(5,2) to safely accommodate any value.
 *    Also expand partner_expectations.height for the same reason.
 */
return new class extends Migration
{
    public function up(): void
    {
        // Fix collation on families table
        if (Schema::hasTable('families')) {
            DB::statement('ALTER TABLE `families` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
        }

        // Fix collation on members table
        if (Schema::hasTable('members')) {
            DB::statement('ALTER TABLE `members` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
        }

        // Expand height column precision on physical_attributes
        if (Schema::hasTable('physical_attributes') && Schema::hasColumn('physical_attributes', 'height')) {
            DB::statement('ALTER TABLE `physical_attributes` MODIFY `height` DOUBLE(5,2) NULL');
        }

        // Expand height column precision on partner_expectations
        if (Schema::hasTable('partner_expectations') && Schema::hasColumn('partner_expectations', 'height')) {
            DB::statement('ALTER TABLE `partner_expectations` MODIFY `height` DOUBLE(5,2) NULL');
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('families')) {
            DB::statement('ALTER TABLE `families` CONVERT TO CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci');
        }

        if (Schema::hasTable('members')) {
            DB::statement('ALTER TABLE `members` CONVERT TO CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci');
        }

        if (Schema::hasTable('physical_attributes') && Schema::hasColumn('physical_attributes', 'height')) {
            DB::statement('ALTER TABLE `physical_attributes` MODIFY `height` DOUBLE(3,2) NULL');
        }

        if (Schema::hasTable('partner_expectations') && Schema::hasColumn('partner_expectations', 'height')) {
            DB::statement('ALTER TABLE `partner_expectations` MODIFY `height` DOUBLE(3,2) NULL');
        }
    }
};
