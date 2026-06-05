<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\QueryException;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        try {
            Schema::table('users', function (Blueprint $table) {
                $table->dropUnique(['email']);
            });
        } catch (QueryException $e) {
            if (! str_contains($e->getMessage(), "Can't DROP 'users_email_unique'")) {
                throw $e;
            }
        }
    }

    public function down(): void
    {
        try {
            Schema::table('users', function (Blueprint $table) {
                $table->unique('email');
            });
        } catch (QueryException $e) {
            if (! str_contains($e->getMessage(), 'Duplicate key name')) {
                throw $e;
            }
        }
    }
};
