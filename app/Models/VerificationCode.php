<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Carbon\Carbon;

class VerificationCode extends Model
{
    use HasFactory;

    protected $fillable = [
        'identifier',
        'code',
        'type',
        'expires_at',
        'verified'
    ];

    protected $casts = [
        'expires_at' => 'datetime',
        'verified' => 'boolean'
    ];

    /**
     * Check if the verification code is expired
     */
    public function isExpired()
    {
        return Carbon::now()->greaterThan($this->expires_at);
    }

    /**
     * Check if the verification code is valid (not expired and not verified)
     */
    public function isValid()
    {
        return !$this->isExpired() && !$this->verified;
    }

    /**
     * Mark as verified
     */
    public function markAsVerified()
    {
        $this->update([
            'verified' => true
        ]);
    }

    /**
     * Get active verification code for identifier and type
     */
    public static function getActiveCode($identifier, $type)
    {
        return self::where('identifier', $identifier)
            ->where('type', $type)
            ->where('verified', false)
            ->where('expires_at', '>', Carbon::now())
            ->latest()
            ->first();
    }

    /**
     * Create or update verification code
     */
    public static function createCode($identifier, $type, $code, $expiresInMinutes = 5)
    {
        // Delete old codes for this identifier and type
        self::where('identifier', $identifier)
            ->where('type', $type)
            ->where('verified', false)
            ->delete();

        return self::create([
            'identifier' => $identifier,
            'code' => $code,
            'type' => $type,
            'expires_at' => Carbon::now()->addMinutes($expiresInMinutes),
            'verified' => false
        ]);
    }

    /**
     * Verify code
     */
    public static function verifyCode($identifier, $type, $code)
    {
        $verificationCode = self::getActiveCode($identifier, $type);

        if (!$verificationCode) {
            return false;
        }

        if ($verificationCode->code !== $code) {
            return false;
        }

        $verificationCode->markAsVerified();
        return true;
    }

    /**
     * Clean up expired codes
     */
    public static function cleanupExpired()
    {
        return self::where('expires_at', '<', Carbon::now())->delete();
    }
}