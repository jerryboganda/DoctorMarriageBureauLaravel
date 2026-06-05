<?php

// Run via: docker exec marriagebureau-app php fix_pending_migration.php

require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Kernel::class)->bootstrap();

use Illuminate\Contracts\Console\Kernel;
use Illuminate\Support\Facades\DB;

// Mark old migration as already ran (column already exists in DB)
DB::table('migrations')->insert([
    'migration' => '2025_07_12_000001_add_onboarding_completed_to_members_table',
    'batch' => 99,
]);

echo "Marked old migration as ran.\n";
