<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('members', function (Blueprint $table) {
            if (!Schema::hasColumn('members', 'unverified_messages_used')) {
                $table->unsignedTinyInteger('unverified_messages_used')
                    ->default(0)
                    ->after('remaining_interest');
            }

            if (!Schema::hasColumn('members', 'unverified_proposals_used')) {
                $table->unsignedTinyInteger('unverified_proposals_used')
                    ->default(0)
                    ->after('unverified_messages_used');
            }
        });
    }

    public function down()
    {
        Schema::table('members', function (Blueprint $table) {
            if (Schema::hasColumn('members', 'unverified_proposals_used')) {
                $table->dropColumn('unverified_proposals_used');
            }

            if (Schema::hasColumn('members', 'unverified_messages_used')) {
                $table->dropColumn('unverified_messages_used');
            }
        });
    }
};
