<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('members', function (Blueprint $table) {
            if (Schema::hasColumn('members', 'unverified_fresh_messages_remaining')) {
                $table->dropColumn('unverified_fresh_messages_remaining');
            }

            if (Schema::hasColumn('members', 'unverified_fresh_proposals_remaining')) {
                $table->dropColumn('unverified_fresh_proposals_remaining');
            }
        });
    }

    public function down()
    {
        Schema::table('members', function (Blueprint $table) {
            if (! Schema::hasColumn('members', 'unverified_fresh_messages_remaining')) {
                $table->unsignedTinyInteger('unverified_fresh_messages_remaining')->default(5)->after('remaining_contact_view');
            }

            if (! Schema::hasColumn('members', 'unverified_fresh_proposals_remaining')) {
                $table->unsignedTinyInteger('unverified_fresh_proposals_remaining')->default(5)->after('unverified_fresh_messages_remaining');
            }
        });
    }
};
