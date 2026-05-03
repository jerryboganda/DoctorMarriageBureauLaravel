<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        // 1. Referral Settings (singleton)
        Schema::create('referral_settings', function (Blueprint $table) {
            $table->id();
            $table->boolean('referral_enabled')->default(false);
            $table->string('code_format', 50)->default('alphanumeric_8');
            $table->boolean('allow_code_regeneration')->default(false);
            $table->boolean('allow_post_signup_apply')->default(false);
            $table->unsignedBigInteger('default_rule_id')->nullable();
            $table->json('anti_fraud_settings')->nullable();
            $table->timestamps();
        });

        // 2. Referral Rules (admin-configurable)
        Schema::create('referral_rules', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->boolean('is_active')->default(true);
            $table->unsignedInteger('trigger_threshold')->default(3);
            $table->string('qualification_mode', 50)->default('registration_only');
            $table->json('qualification_params')->nullable();
            $table->string('reward_type', 50)->default('package_upgrade');
            $table->json('reward_params')->nullable();
            $table->string('per_user_limit', 20)->default('once');
            $table->timestamp('starts_at')->nullable();
            $table->timestamp('ends_at')->nullable();
            $table->timestamps();
        });

        // 3. Referral Codes
        Schema::create('referral_codes', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id')->unique();
            $table->string('code', 50)->unique();
            $table->enum('status', ['active', 'disabled'])->default('active');
            $table->timestamps();
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            $table->index('code');
        });

        // 4. Referrals
        Schema::create('referrals', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('referrer_user_id');
            $table->unsignedBigInteger('referred_user_id')->unique();
            $table->unsignedBigInteger('referral_code_id');
            $table->enum('source', ['link', 'manual', 'admin'])->default('link');
            $table->enum('status', ['pending', 'qualified', 'invalid', 'reversed'])->default('pending');
            $table->timestamp('qualified_at')->nullable();
            $table->timestamp('invalidated_at')->nullable();
            $table->timestamp('reversed_at')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamps();
            $table->foreign('referrer_user_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('referred_user_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('referral_code_id')->references('id')->on('referral_codes')->onDelete('cascade');
            $table->index(['referrer_user_id', 'status']);
        });

        // 5. Referral Rewards
        Schema::create('referral_rewards', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id');
            $table->unsignedBigInteger('rule_id');
            $table->string('reward_type', 50)->default('package_upgrade');
            $table->json('reward_payload')->nullable();
            $table->enum('status', ['pending', 'applied', 'reversed', 'failed'])->default('pending');
            $table->timestamp('applied_at')->nullable();
            $table->timestamp('reversed_at')->nullable();
            $table->string('idempotency_key')->unique();
            $table->text('admin_notes')->nullable();
            $table->timestamps();
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('rule_id')->references('id')->on('referral_rules')->onDelete('cascade');
        });

        // 6. Referral Audit Logs
        Schema::create('referral_audit_logs', function (Blueprint $table) {
            $table->id();
            $table->string('actor_type', 20);
            $table->unsignedBigInteger('actor_id')->nullable();
            $table->string('action', 100);
            $table->string('entity_type', 100);
            $table->unsignedBigInteger('entity_id')->nullable();
            $table->json('before_data')->nullable();
            $table->json('after_data')->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->text('notes')->nullable();
            $table->timestamp('created_at')->useCurrent();
        });

        // Insert default settings
        \DB::table('referral_settings')->insert([
            'referral_enabled' => true,
            'code_format' => 'alphanumeric_8',
            'allow_code_regeneration' => false,
            'allow_post_signup_apply' => false,
            'anti_fraud_settings' => json_encode([
                'max_referrals_per_ip_per_day' => 5,
                'max_referrals_per_device_per_day' => 5,
                'cooldown_minutes' => 10,
                'block_same_email_domain' => false,
            ]),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Insert default rule: 3 referrals => Gold Package upgrade
        \DB::table('referral_rules')->insert([
            'name' => '3 Referrals - Gold Package Upgrade',
            'is_active' => true,
            'trigger_threshold' => 3,
            'qualification_mode' => 'email_verified',
            'qualification_params' => json_encode(['active_days' => 0]),
            'reward_type' => 'package_upgrade',
            'reward_params' => json_encode([
                'target_package_id' => 8,
                'upgrade_duration_days' => 90,
                'is_permanent' => false,
            ]),
            'per_user_limit' => 'once',
            'starts_at' => null,
            'ends_at' => null,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Update default_rule_id
        \DB::table('referral_settings')->where('id', 1)->update(['default_rule_id' => 1]);

        // Add referral permissions
        $permissions = [
            'referral_manage_settings',
            'referral_manage_rules',
            'referral_view_referrals',
            'referral_manage_rewards',
            'referral_view_analytics',
        ];

        foreach ($permissions as $perm) {
            \DB::table('permissions')->insertOrIgnore([
                'name' => $perm,
                'guard_name' => 'web',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        // Assign to admin role
        $adminRole = \DB::table('roles')->where('name', 'Super Admin')->first();
        if (!$adminRole) {
            $adminRole = \DB::table('roles')->first();
        }
        if ($adminRole) {
            foreach ($permissions as $perm) {
                $permRecord = \DB::table('permissions')->where('name', $perm)->first();
                if ($permRecord) {
                    \DB::table('role_has_permissions')->insertOrIgnore([
                        'permission_id' => $permRecord->id,
                        'role_id' => $adminRole->id,
                    ]);
                }
            }
        }
    }

    public function down()
    {
        Schema::dropIfExists('referral_audit_logs');
        Schema::dropIfExists('referral_rewards');
        Schema::dropIfExists('referrals');
        Schema::dropIfExists('referral_codes');
        Schema::dropIfExists('referral_rules');
        Schema::dropIfExists('referral_settings');

        $permissions = [
            'referral_manage_settings',
            'referral_manage_rules',
            'referral_view_referrals',
            'referral_manage_rewards',
            'referral_view_analytics',
        ];
        foreach ($permissions as $perm) {
            $p = \DB::table('permissions')->where('name', $perm)->first();
            if ($p) {
                \DB::table('role_has_permissions')->where('permission_id', $p->id)->delete();
                \DB::table('permissions')->where('id', $p->id)->delete();
            }
        }
    }
};
