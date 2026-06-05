<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Create sects table
        Schema::create('sects', function (Blueprint $table) {
            $table->id();
            $table->string('name', 255);
            $table->timestamps();
            $table->softDeletes();
        });

        // 2. Seed common sects
        $now = now();
        DB::table('sects')->insert([
            ['name' => 'Sunni',   'created_at' => $now, 'updated_at' => $now],
            ['name' => 'Shia',    'created_at' => $now, 'updated_at' => $now],
            ['name' => 'Ahmadi',  'created_at' => $now, 'updated_at' => $now],
            ['name' => 'Sufi',    'created_at' => $now, 'updated_at' => $now],
            ['name' => 'Deobandi', 'created_at' => $now, 'updated_at' => $now],
            ['name' => 'Barelvi', 'created_at' => $now, 'updated_at' => $now],
            ['name' => 'Ahl-e-Hadith', 'created_at' => $now, 'updated_at' => $now],
            ['name' => 'Ismaili', 'created_at' => $now, 'updated_at' => $now],
            ['name' => 'Bohra',   'created_at' => $now, 'updated_at' => $now],
            ['name' => 'Other',   'created_at' => $now, 'updated_at' => $now],
        ]);

        // 3. Add sect_id FK to spiritual_backgrounds
        Schema::table('spiritual_backgrounds', function (Blueprint $table) {
            $table->unsignedBigInteger('sect_id')->nullable()->after('religion_id');
            $table->foreign('sect_id')->references('id')->on('sects')->nullOnDelete();
        });

        // 4. Migrate existing ethnicity text values to sect_id where possible
        $sects = DB::table('sects')->pluck('id', 'name');
        foreach ($sects as $name => $id) {
            DB::table('spiritual_backgrounds')
                ->whereNotNull('ethnicity')
                ->whereRaw('LOWER(TRIM(ethnicity)) = ?', [strtolower($name)])
                ->update(['sect_id' => $id]);
        }

        // 5. Insert permissions for admin panel
        $guardName = 'web';
        $permNow = now();
        $permissions = ['show_sects', 'add_sect', 'edit_sect', 'delete_sect'];
        foreach ($permissions as $perm) {
            DB::table('permissions')->insertOrIgnore([
                'name' => $perm,
                'guard_name' => $guardName,
                'created_at' => $permNow,
                'updated_at' => $permNow,
            ]);
        }

        // 6. Grant all sect permissions to the admin role (role_id = 1)
        $permIds = DB::table('permissions')
            ->whereIn('name', $permissions)
            ->pluck('id');
        foreach ($permIds as $pid) {
            DB::table('role_has_permissions')->insertOrIgnore([
                'permission_id' => $pid,
                'role_id' => 1,
            ]);
        }
    }

    public function down(): void
    {
        // Remove FK first
        Schema::table('spiritual_backgrounds', function (Blueprint $table) {
            $table->dropForeign(['sect_id']);
            $table->dropColumn('sect_id');
        });

        // Remove permissions
        $permissions = ['show_sects', 'add_sect', 'edit_sect', 'delete_sect'];
        $permIds = DB::table('permissions')->whereIn('name', $permissions)->pluck('id');
        DB::table('role_has_permissions')->whereIn('permission_id', $permIds)->delete();
        DB::table('permissions')->whereIn('name', $permissions)->delete();

        Schema::dropIfExists('sects');
    }
};
