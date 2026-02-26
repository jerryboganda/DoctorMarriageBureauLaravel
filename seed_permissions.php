<?php
// Temporary script to seed Job Titles & Specialities permissions
// Run via: php artisan tinker seed_permissions.php
// Or: php seed_permissions.php (from project root with bootstrap)

require_once __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$perms = [
    'show_job_titles',
    'add_job_title',
    'edit_job_title',
    'delete_job_title',
    'show_specialities',
    'add_speciality',
    'edit_speciality',
    'delete_speciality',
];

foreach ($perms as $p) {
    \Spatie\Permission\Models\Permission::firstOrCreate(['name' => $p]);
    echo "Created permission: $p\n";
}

// Assign to admin role (role id 1 or name 'admin')
$adminRole = \Spatie\Permission\Models\Role::where('name', 'admin')->first()
    ?? \Spatie\Permission\Models\Role::find(1);

if ($adminRole) {
    $adminRole->givePermissionTo($perms);
    echo "\nAll permissions assigned to role: {$adminRole->name}\n";
} else {
    echo "\nWARNING: No admin role found. Assign permissions manually.\n";
}

echo "Done!\n";
