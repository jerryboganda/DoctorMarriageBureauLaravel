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
        if (Schema::hasTable('express_interests')) {
            Schema::table('express_interests', function (Blueprint $table) {
                if (! $this->indexExists('express_interests', 'idx_express_interests_user_by_status')) {
                    $table->index(['user_id', 'interested_by', 'status'], 'idx_express_interests_user_by_status');
                }
            });
        }

        if (Schema::hasTable('profile_viewers')) {
            Schema::table('profile_viewers', function (Blueprint $table) {
                if (! $this->indexExists('profile_viewers', 'idx_profile_viewers_user_viewer')) {
                    $table->index(['user_id', 'viewed_by'], 'idx_profile_viewers_user_viewer');
                }
            });
        }

        if (Schema::hasTable('ignored_users')) {
            Schema::table('ignored_users', function (Blueprint $table) {
                if (! $this->indexExists('ignored_users', 'idx_ignored_users_user_ignored')) {
                    $table->index(['user_id', 'ignored_by'], 'idx_ignored_users_user_ignored');
                }
            });
        }

        if (Schema::hasTable('chats')) {
            Schema::table('chats', function (Blueprint $table) {
                if (! $this->indexExists('chats', 'idx_chats_thread_created_at')) {
                    $table->index(['chat_thread_id', 'created_at'], 'idx_chats_thread_created_at');
                }
            });
        }

        if (Schema::hasTable('chat_threads')) {
            Schema::table('chat_threads', function (Blueprint $table) {
                if (! $this->indexExists('chat_threads', 'idx_chat_threads_user_pair_updated')) {
                    $table->index(['sender_user_id', 'receiver_user_id', 'updated_at'], 'idx_chat_threads_user_pair_updated');
                }
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('express_interests') && $this->indexExists('express_interests', 'idx_express_interests_user_by_status')) {
            Schema::table('express_interests', function (Blueprint $table) {
                $table->dropIndex('idx_express_interests_user_by_status');
            });
        }

        if (Schema::hasTable('profile_viewers') && $this->indexExists('profile_viewers', 'idx_profile_viewers_user_viewer')) {
            Schema::table('profile_viewers', function (Blueprint $table) {
                $table->dropIndex('idx_profile_viewers_user_viewer');
            });
        }

        if (Schema::hasTable('ignored_users') && $this->indexExists('ignored_users', 'idx_ignored_users_user_ignored')) {
            Schema::table('ignored_users', function (Blueprint $table) {
                $table->dropIndex('idx_ignored_users_user_ignored');
            });
        }

        if (Schema::hasTable('chats') && $this->indexExists('chats', 'idx_chats_thread_created_at')) {
            Schema::table('chats', function (Blueprint $table) {
                $table->dropIndex('idx_chats_thread_created_at');
            });
        }

        if (Schema::hasTable('chat_threads') && $this->indexExists('chat_threads', 'idx_chat_threads_user_pair_updated')) {
            Schema::table('chat_threads', function (Blueprint $table) {
                $table->dropIndex('idx_chat_threads_user_pair_updated');
            });
        }
    }
};
