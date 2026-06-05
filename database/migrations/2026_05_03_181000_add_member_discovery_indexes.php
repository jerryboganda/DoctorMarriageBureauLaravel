<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    private function indexExists(string $table, string $indexName): bool
    {
        $rows = DB::select('SHOW INDEX FROM `'.$table.'` WHERE Key_name = ?', [$indexName]);

        return ! empty($rows);
    }

    public function up(): void
    {
        if (Schema::hasTable('users')) {
            Schema::table('users', function (Blueprint $table) {
                if (! $this->indexExists('users', 'idx_users_member_visibility_created')) {
                    $table->index(
                        ['user_type', 'blocked', 'deactivated', 'permanently_delete', 'created_at'],
                        'idx_users_member_visibility_created'
                    );
                }

                if (! $this->indexExists('users', 'idx_users_approval_membership')) {
                    $table->index(['approved', 'membership'], 'idx_users_approval_membership');
                }
            });
        }

        if (Schema::hasTable('members')) {
            Schema::table('members', function (Blueprint $table) {
                if (! $this->indexExists('members', 'idx_members_user_gender_birth_status')) {
                    $table->index(
                        ['user_id', 'gender', 'birthday', 'marital_status_id'],
                        'idx_members_user_gender_birth_status'
                    );
                }

                if (! $this->indexExists('members', 'idx_members_filters')) {
                    $table->index(
                        ['gender', 'marital_status_id', 'mothere_tongue', 'is_visible'],
                        'idx_members_filters'
                    );
                }
            });
        }

        if (Schema::hasTable('addresses')) {
            Schema::table('addresses', function (Blueprint $table) {
                if (! $this->indexExists('addresses', 'idx_addresses_geo_user')) {
                    $table->index(
                        ['country_id', 'state_id', 'city_id', 'user_id'],
                        'idx_addresses_geo_user'
                    );
                }

                if (! $this->indexExists('addresses', 'idx_addresses_type_user')) {
                    $table->index(['type', 'user_id'], 'idx_addresses_type_user');
                }
            });
        }

        if (Schema::hasTable('ignored_users')) {
            Schema::table('ignored_users', function (Blueprint $table) {
                if (! $this->indexExists('ignored_users', 'idx_ignored_users_ignored_by_user')) {
                    $table->index(['ignored_by', 'user_id'], 'idx_ignored_users_ignored_by_user');
                }
            });
        }
    }

    public function down(): void
    {
        $indexes = [
            'users' => ['idx_users_member_visibility_created', 'idx_users_approval_membership'],
            'members' => ['idx_members_user_gender_birth_status', 'idx_members_filters'],
            'addresses' => ['idx_addresses_geo_user', 'idx_addresses_type_user'],
            'ignored_users' => ['idx_ignored_users_ignored_by_user'],
        ];

        foreach ($indexes as $tableName => $indexNames) {
            if (! Schema::hasTable($tableName)) {
                continue;
            }

            Schema::table($tableName, function (Blueprint $table) use ($tableName, $indexNames) {
                foreach ($indexNames as $indexName) {
                    if ($this->indexExists($tableName, $indexName)) {
                        $table->dropIndex($indexName);
                    }
                }
            });
        }
    }
};
