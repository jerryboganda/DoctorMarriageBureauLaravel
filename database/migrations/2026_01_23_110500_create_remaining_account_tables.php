<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Create profile_managers table with raw SQL to avoid type conflicts
        DB::statement("
            CREATE TABLE IF NOT EXISTS profile_managers (
                id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                member_id BIGINT NOT NULL,
                manager_user_id BIGINT UNSIGNED NULL,
                manager_email VARCHAR(255) NULL,
                manager_phone VARCHAR(20) NULL,
                manager_name VARCHAR(255) NULL,
                manager_type ENUM('owner', 'family', 'matchmaker') DEFAULT 'family',
                permissions JSON NULL,
                is_primary TINYINT(1) DEFAULT 0,
                is_active TINYINT(1) DEFAULT 1,
                invitation_token VARCHAR(64) NULL,
                invited_at TIMESTAMP NULL,
                accepted_at TIMESTAMP NULL,
                created_at TIMESTAMP NULL,
                updated_at TIMESTAMP NULL,
                INDEX pm_member_idx (member_id),
                INDEX pm_invitation_idx (invitation_token),
                INDEX pm_manager_idx (manager_user_id),
                FOREIGN KEY (manager_user_id) REFERENCES users(id) ON DELETE SET NULL
            )
        ");

        // Create ownership_transfers table
        DB::statement("
            CREATE TABLE IF NOT EXISTS ownership_transfers (
                id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                member_id BIGINT NOT NULL,
                from_user_id BIGINT UNSIGNED NOT NULL,
                to_user_id BIGINT UNSIGNED NULL,
                to_email VARCHAR(255) NULL,
                to_phone VARCHAR(20) NULL,
                to_name VARCHAR(255) NULL,
                status ENUM('pending', 'accepted', 'rejected', 'expired', 'cancelled') DEFAULT 'pending',
                transfer_token VARCHAR(64) NOT NULL UNIQUE,
                step_up_token VARCHAR(64) NULL,
                step_up_verified TINYINT(1) DEFAULT 0,
                step_up_verified_at TIMESTAMP NULL,
                transfer_reason TEXT NULL,
                expires_at TIMESTAMP NOT NULL,
                accepted_at TIMESTAMP NULL,
                rejected_at TIMESTAMP NULL,
                rejection_reason VARCHAR(500) NULL,
                ip_address VARCHAR(45) NULL,
                user_agent TEXT NULL,
                created_at TIMESTAMP NULL,
                updated_at TIMESTAMP NULL,
                INDEX ot_member_status_idx (member_id, status),
                INDEX ot_from_user_idx (from_user_id, status),
                INDEX ot_transfer_token_idx (transfer_token),
                FOREIGN KEY (from_user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (to_user_id) REFERENCES users(id) ON DELETE SET NULL
            )
        ");

        // Create step_up_auth_tokens table
        DB::statement("
            CREATE TABLE IF NOT EXISTS step_up_auth_tokens (
                id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                user_id BIGINT UNSIGNED NOT NULL,
                token VARCHAR(64) NOT NULL UNIQUE,
                purpose ENUM('ownership_transfer', '2fa_disable', 'account_delete', 'password_change') DEFAULT 'ownership_transfer',
                password_verified TINYINT(1) DEFAULT 0,
                otp_verified TINYINT(1) DEFAULT 0,
                otp_code VARCHAR(255) NULL,
                otp_sent_at TIMESTAMP NULL,
                otp_expires_at TIMESTAMP NULL,
                otp_attempts TINYINT UNSIGNED DEFAULT 0,
                is_valid TINYINT(1) DEFAULT 1,
                expires_at TIMESTAMP NOT NULL,
                completed_at TIMESTAMP NULL,
                ip_address VARCHAR(45) NULL,
                created_at TIMESTAMP NULL,
                updated_at TIMESTAMP NULL,
                INDEX sua_user_purpose_idx (user_id, purpose, is_valid),
                INDEX sua_token_idx (token),
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        ");
    }

    public function down(): void
    {
        Schema::dropIfExists('step_up_auth_tokens');
        Schema::dropIfExists('ownership_transfers');
        Schema::dropIfExists('profile_managers');
    }
};
