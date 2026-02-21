<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ReferralSetting extends Model
{
    protected $table = 'referral_settings';

    protected $fillable = [
        'referral_enabled',
        'code_format',
        'allow_code_regeneration',
        'allow_post_signup_apply',
        'default_rule_id',
        'anti_fraud_settings',
        // Popup fields
        'popup_enabled',
        'popup_headline',
        'popup_body',
        'popup_cta_text',
        'popup_bonus_days',
        'popup_show_frequency',
        'popup_delay_seconds',
    ];

    protected $casts = [
        'referral_enabled' => 'boolean',
        'allow_code_regeneration' => 'boolean',
        'allow_post_signup_apply' => 'boolean',
        'anti_fraud_settings' => 'array',
        'popup_enabled' => 'boolean',
        'popup_bonus_days' => 'integer',
        'popup_delay_seconds' => 'integer',
    ];

    /**
     * Get the singleton instance
     */
    public static function instance()
    {
        return static::first() ?? static::create([
            'referral_enabled' => false,
            'code_format' => 'alphanumeric_8',
            'allow_code_regeneration' => false,
            'allow_post_signup_apply' => false,
            'anti_fraud_settings' => [
                'max_referrals_per_ip_per_day' => 5,
                'max_referrals_per_device_per_day' => 5,
                'cooldown_minutes' => 10,
                'block_same_email_domain' => false,
            ],
            'popup_enabled' => false,
            'popup_headline' => 'Join Our Referral Program!',
            'popup_body' => 'Refer 3 friends and earn a FREE premium plan upgrade!',
            'popup_cta_text' => 'Start Referring Now',
            'popup_bonus_days' => 30,
            'popup_show_frequency' => 'once_per_session',
            'popup_delay_seconds' => 2,
        ]);
    }

    public function defaultRule()
    {
        return $this->belongsTo(ReferralRule::class, 'default_rule_id');
    }

    /**
     * Check if referral system is enabled
     */
    public static function isEnabled()
    {
        $settings = static::instance();
        return $settings->referral_enabled;
    }

    /**
     * Get anti-fraud setting
     */
    public function getAntiFraudSetting($key, $default = null)
    {
        $settings = $this->anti_fraud_settings ?? [];
        return $settings[$key] ?? $default;
    }
}
