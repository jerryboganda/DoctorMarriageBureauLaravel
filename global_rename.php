<?php

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$oldName = 'Active Matrimonial';
$newName = 'Doctor Marriage Bureau';

$tables = DB::connection()->getDoctrineSchemaManager()->listTableNames();

foreach ($tables as $table) {
    $columns = Schema::getColumnListing($table);
    foreach ($columns as $column) {
        try {
            $affected = DB::table($table)
                ->where($column, 'like', "%{$oldName}%")
                ->update([
                    $column => DB::raw("REPLACE($column, '$oldName', '$newName')")
                ]);
            
            if ($affected > 0) {
                echo "Updated $affected rows in $table ($column)\n";
            }
        } catch (\Exception $e) {
            // Skip columns that don't support REPLACE or other errors
        }
    }
}

echo "Global rename complete.\n";
