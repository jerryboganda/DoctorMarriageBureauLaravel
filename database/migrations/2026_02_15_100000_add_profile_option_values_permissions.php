<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Spatie\Permission\PermissionRegistrar;

return new class extends Migration
{
    /**
     * Add permissions for Profile Option Values admin management.
     */
    public function up(): void
    {
        $now = now();

        // Insert the 4 CRUD permissions
        $permissions = [
            ['name' => 'show_profile_option_values', 'guard_name' => 'web', 'created_at' => $now, 'updated_at' => $now],
            ['name' => 'add_profile_option_value',   'guard_name' => 'web', 'created_at' => $now, 'updated_at' => $now],
            ['name' => 'edit_profile_option_value',  'guard_name' => 'web', 'created_at' => $now, 'updated_at' => $now],
            ['name' => 'delete_profile_option_value', 'guard_name' => 'web', 'created_at' => $now, 'updated_at' => $now],
        ];

        foreach ($permissions as $perm) {
            // Only insert if it doesn't already exist
            $exists = DB::table('permissions')->where('name', $perm['name'])->exists();
            if (! $exists) {
                $id = DB::table('permissions')->insertGetId($perm);

                // Grant to admin role (role_id = 1)
                DB::table('role_has_permissions')->insert([
                    'permission_id' => $id,
                    'role_id' => 1,
                ]);
            }
        }

        // Clear Spatie permission cache
        app()->make(PermissionRegistrar::class)->forgetCachedPermissions();
    }

    /**
     * Reverse the migration.
     */
    public function down(): void
    {
        $permNames = [
            'show_profile_option_values',
            'add_profile_option_value',
            'edit_profile_option_value',
            'delete_profile_option_value',
        ];

        $permIds = DB::table('permissions')->whereIn('name', $permNames)->pluck('id');

        DB::table('role_has_permissions')->whereIn('permission_id', $permIds)->delete();
        DB::table('permissions')->whereIn('name', $permNames)->delete();

        app()->make(PermissionRegistrar::class)->forgetCachedPermissions();
    }
};
