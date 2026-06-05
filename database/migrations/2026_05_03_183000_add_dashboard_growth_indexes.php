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

    private function addIndex(string $tableName, array $columns, string $indexName): void
    {
        if (! Schema::hasTable($tableName) || $this->indexExists($tableName, $indexName)) {
            return;
        }

        Schema::table($tableName, function (Blueprint $table) use ($columns, $indexName) {
            $table->index($columns, $indexName);
        });
    }

    public function up(): void
    {
        $this->addIndex('users', ['user_type', 'blocked', 'deactivated', 'approved', 'created_at', 'id'], 'idx_users_dashboard_listing');

        $this->addIndex('members', ['gender', 'is_visible', 'user_id'], 'idx_members_gender_visible_user');
        $this->addIndex('members', ['gender', 'is_visible', 'is_agent_pick', 'user_id'], 'idx_members_agent_picks');
        $this->addIndex('members', ['gender', 'is_visible', 'is_high_intent', 'user_id'], 'idx_members_high_intent');
        $this->addIndex('members', ['gender', 'is_visible', 'birthday', 'user_id'], 'idx_members_age_filters');

        $this->addIndex('spiritual_backgrounds', ['religion_id', 'user_id'], 'idx_spiritual_religion_user');
        $this->addIndex('spiritual_backgrounds', ['caste_id', 'user_id'], 'idx_spiritual_caste_user');
        $this->addIndex('spiritual_backgrounds', ['sub_caste_id', 'user_id'], 'idx_spiritual_sub_caste_user');
        $this->addIndex('spiritual_backgrounds', ['sect_id', 'user_id'], 'idx_spiritual_sect_user');

        $this->addIndex('addresses', ['city_id', 'user_id'], 'idx_addresses_city_user');
        $this->addIndex('addresses', ['state_id', 'user_id'], 'idx_addresses_state_user');

        $this->addIndex('careers', ['job_title_id', 'user_id'], 'idx_careers_job_title_user');
        $this->addIndex('physical_attributes', ['height', 'user_id'], 'idx_physical_height_user');
        $this->addIndex('shortlists', ['shortlisted_by', 'user_id'], 'idx_shortlists_by_user');

        $this->addIndex('express_interests', ['user_id', 'status', 'created_at', 'id'], 'idx_express_user_status_created');
        $this->addIndex('profile_viewers', ['user_id', 'created_at', 'id'], 'idx_profile_viewers_recent');
        $this->addIndex('profile_matches', ['user_id', 'match_percentage'], 'idx_profile_matches_user_percent');

        $this->addIndex('chat_threads', ['sender_user_id', 'updated_at', 'id'], 'idx_chat_threads_sender_recent');
        $this->addIndex('chat_threads', ['receiver_user_id', 'updated_at', 'id'], 'idx_chat_threads_receiver_recent');
        $this->addIndex('chats', ['chat_thread_id', 'seen', 'sender_user_id'], 'idx_chats_thread_seen_sender');

        $this->addIndex('happy_stories', ['approved', 'created_at', 'id'], 'idx_happy_stories_approved_recent');
    }

    public function down(): void
    {
        $indexes = [
            'users' => ['idx_users_dashboard_listing'],
            'members' => ['idx_members_gender_visible_user', 'idx_members_agent_picks', 'idx_members_high_intent', 'idx_members_age_filters'],
            'spiritual_backgrounds' => ['idx_spiritual_religion_user', 'idx_spiritual_caste_user', 'idx_spiritual_sub_caste_user', 'idx_spiritual_sect_user'],
            'addresses' => ['idx_addresses_city_user', 'idx_addresses_state_user'],
            'careers' => ['idx_careers_job_title_user'],
            'physical_attributes' => ['idx_physical_height_user'],
            'shortlists' => ['idx_shortlists_by_user'],
            'express_interests' => ['idx_express_user_status_created'],
            'profile_viewers' => ['idx_profile_viewers_recent'],
            'profile_matches' => ['idx_profile_matches_user_percent'],
            'chat_threads' => ['idx_chat_threads_sender_recent', 'idx_chat_threads_receiver_recent'],
            'chats' => ['idx_chats_thread_seen_sender'],
            'happy_stories' => ['idx_happy_stories_approved_recent'],
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
