<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Tables used by onboarding/profile update that must support utf8mb4 input.
     * Prevents SQL collation errors when users submit modern Unicode characters.
     */
    private array $tables = [
        'members',
        'addresses',
        'spiritual_backgrounds',
        'families',
        'careers',
        'education',
        'physical_attributes',
        'partner_expectations',
        'religions',
        'castes',
        'member_languages',
        'marital_statuses',
    ];

    public function up(): void
    {
        DB::statement('ALTER DATABASE `'.env('DB_DATABASE').'` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');

        foreach ($this->tables as $table) {
            if (Schema::hasTable($table)) {
                DB::statement("ALTER TABLE `{$table}` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
            }
        }
    }

    public function down(): void
    {
        // Intentionally left empty. Do not downgrade text charset/collation.
    }
};