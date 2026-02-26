<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (Schema::hasTable('physical_attributes')) {
            DB::statement('ALTER TABLE `physical_attributes` MODIFY `height` DOUBLE(5,2) NULL');
        }

        if (Schema::hasTable('partner_expectations')) {
            DB::statement('ALTER TABLE `partner_expectations` MODIFY `height` DOUBLE(5,2) NULL');
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('physical_attributes')) {
            DB::statement('ALTER TABLE `physical_attributes` MODIFY `height` DOUBLE(3,2) NULL');
        }

        if (Schema::hasTable('partner_expectations')) {
            DB::statement('ALTER TABLE `partner_expectations` MODIFY `height` DOUBLE(3,2) NULL');
        }
    }
};