<?php
// Fix property options: remove "Plot Only" and "Under Construction Home"
// Run via: docker exec marriagebureau-app php fix_property_options.php

require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use Illuminate\Support\Facades\DB;

echo "=== Current Property Options ===\n";
$opts = DB::table('profile_option_values')->where('group', 'property')->get();
foreach ($opts as $o) {
    echo "  ID={$o->id} value={$o->value} label={$o->label}\n";
}

echo "\n=== Users with Plot Only or Under Construction ===\n";
$plotUsers = DB::table('lifestyles')->whereIn('property', ['Plot Only', 'plot_only'])->count();
$ucUsers = DB::table('lifestyles')->whereIn('property', ['Under Construction Home', 'under_construction_home', 'Under Construction'])->count();
echo "  Plot Only: {$plotUsers}\n";
echo "  Under Construction: {$ucUsers}\n";

// Migrate any users with removed values to 'Own Home'
if ($plotUsers > 0) {
    DB::table('lifestyles')->whereIn('property', ['Plot Only', 'plot_only'])->update(['property' => 'Own Home']);
    echo "  -> Migrated Plot Only users to 'Own Home'\n";
}
if ($ucUsers > 0) {
    DB::table('lifestyles')->whereIn('property', ['Under Construction Home', 'under_construction_home', 'Under Construction'])->update(['property' => 'Own Home']);
    echo "  -> Migrated Under Construction users to 'Own Home'\n";
}

// Delete the options from profile_option_values
$deleted = DB::table('profile_option_values')
    ->where('group', 'property')
    ->whereIn('value', ['Plot Only', 'plot_only', 'Under Construction Home', 'under_construction_home', 'Under Construction'])
    ->delete();
echo "\n=== Deleted {$deleted} option rows ===\n";

echo "\n=== Remaining Property Options ===\n";
$opts = DB::table('profile_option_values')->where('group', 'property')->get();
foreach ($opts as $o) {
    echo "  ID={$o->id} value={$o->value} label={$o->label}\n";
}

echo "\nDone!\n";
