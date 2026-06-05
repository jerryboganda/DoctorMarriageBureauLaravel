<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class ReferralCode extends Model
{
    protected $table = 'referral_codes';

    protected $fillable = [
        'user_id',
        'code',
        'status',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function referrals()
    {
        return $this->hasMany(Referral::class, 'referral_code_id');
    }

    /**
     * Generate a unique referral code based on settings
     */
    public static function generateCode($format = 'alphanumeric_8')
    {
        $maxAttempts = 50;
        $attempt = 0;

        do {
            switch ($format) {
                case 'alphanumeric_6':
                    $code = strtoupper(Str::random(6));
                    break;
                case 'alphanumeric_10':
                    $code = strtoupper(Str::random(10));
                    break;
                case 'numeric_8':
                    $code = str_pad(random_int(0, 99999999), 8, '0', STR_PAD_LEFT);
                    break;
                case 'alphanumeric_8':
                default:
                    $code = strtoupper(Str::random(8));
                    break;
            }
            $attempt++;
        } while (static::where('code', $code)->exists() && $attempt < $maxAttempts);

        if ($attempt >= $maxAttempts) {
            // Fallback: use UUID-based code
            $code = strtoupper(substr(str_replace('-', '', Str::uuid()), 0, 12));
        }

        return $code;
    }

    /**
     * Get or create a referral code for a user
     */
    public static function getOrCreateForUser($userId)
    {
        $existing = static::where('user_id', $userId)->first();
        if ($existing) {
            return $existing;
        }

        $settings = ReferralSetting::instance();
        $code = static::generateCode($settings->code_format);

        return static::create([
            'user_id' => $userId,
            'code' => $code,
            'status' => 'active',
        ]);
    }

    /**
     * Get the full referral link
     */
    public function getReferralLink()
    {
        // Use FRONTEND_URL for the user-facing panel, fallback to panel subdomain
        $baseUrl = rtrim(env('FRONTEND_URL', 'https://panel.doctormarriagebureau.com.pk'), '/');

        return $baseUrl.'/register?ref='.$this->code;
    }

    /**
     * Check if the code is active and usable
     */
    public function isActive()
    {
        return $this->status === 'active';
    }
}
