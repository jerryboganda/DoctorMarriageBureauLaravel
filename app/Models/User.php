<?php

namespace App\Models;
use App\Models\Member;
use App\Models\Address;
use App\Models\Education;
use App\Models\Career;
use App\Models\PhysicalAttribute;
use App\Models\Hobby;
use App\Models\Attitude;
use App\Models\Recidency;
use App\Models\Lifestyle;
use App\Models\Astrology;
use App\Models\Family;
use App\Models\PartnerExpectation;
use App\Models\SpiritualBackground;
use App\Models\PackagePayment;
use App\Models\HappyStory;
use App\Models\Shortlist;
use App\Models\IgnoredUser;
use App\Models\ReportedUser;
use App\Models\Staff;
use App\Models\GalleryImage;
use App\Models\ExpressInterest;
use App\Models\ProfileMatch;
use App\Models\VerificationCode;

use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Database\Eloquent\SoftDeletes;
use Spatie\Permission\Traits\HasRoles;
use App\Notifications\EmailVerificationNotification;
use Laravel\Sanctum\HasApiTokens;


class User extends Authenticatable implements MustVerifyEmail
{
    use HasApiTokens;
    use SoftDeletes;
    use Notifiable;
    use HasRoles;

    public function sendEmailVerificationNotification()
    {
        try {
            $this->notify(new EmailVerificationNotification());
        } catch (\Exception $e) {
            \Log::error('Email verification notification failed: ' . $e->getMessage());
            // Don't throw the exception to prevent breaking the flow
        }
    }

    /**
     * The attributes that are mass assignable.
     *
     * @var array
     */
    protected $fillable = [
        'first_name', 'last_name', 'email', 'password', 'code', 'phone','membership','approved', 'verification_code','fcm_token','referred_by','email_verified_at','user_type'
    ];

    /**
     * The attributes that should be hidden for arrays.
     *
     * @var array
     */
    protected $hidden = [
        'password', 'remember_token',
    ];

    /**
     * The attributes that should be cast to native types.
     *
     * @var array
     */
    protected $casts = [
        'email_verified_at' => 'datetime',
        // phone_verified_at is handled by accessor getPhoneVerifiedAtAttribute()
        // It returns a Carbon instance from verification_codes.updated_at
    ];

    public function member()
    {
        return $this->hasOne(Member::class);
    }

    public function addresses()
    {
        return $this->hasmany(Address::class);
    }

    public function education()
    {
        return $this->hasmany(Education::class);
    }

    public function career()
    {
        return $this->hasmany(Career::class);
    }

    public function physical_attributes()
    {
        return $this->hasOne(PhysicalAttribute::class);
    }

    public function hobbies()
    {
        return $this->hasOne(Hobby::class);
    }

    public function attitude()
    {
        return $this->hasOne(Attitude::class);
    }

    public function recidency()
    {
        return $this->hasOne(Recidency::class);
    }

    public function lifestyles()
    {
        return $this->hasOne(Lifestyle::class);
    }

    public function astrologies()
    {
        return $this->hasOne(Astrology::class);
    }

    public function families()
    {
        return $this->hasOne(Family::class);
    }

    public function partner_expectations()
    {
        return $this->hasOne(PartnerExpectation::class);
    }

    public function spiritual_backgrounds()
    {
        return $this->hasOne(SpiritualBackground::class);
    }

    public function payckage_payments()
    {
        return $this->hasmany(PackagePayment::class);
    }

    public function happy_story()
    {
        return $this->hasOne(HappyStory::class);
    }

    public function staff()
    {
        return $this->hasOne(Staff::class);
    }

    public function shortlist()
    {
        return $this->hasmany(Shortlist::class);
    }

    public function ignored_users()
    {
        return $this->hasmany(IgnoredUser::class);
    }

    public function reported_users()
    {
        return $this->hasmany(ReportedUser::class);
    }

    public function gallery_images()
    {
        return $this->hasmany(GalleryImage::class);
    }

    public function express_interests()
    {
        return $this->hasmany(ExpressInterest::class);
    }
    public function profile_match()
    {
        return $this->hasmany(ProfileMatch::class);
    }
    public function uploads(){
        return $this->hasMany(Upload::class);
    }

    public function profile_views(){
        return $this->hasMany(ProfileView::class);
    }

    // ===== Referral System Relationships =====

    public function referralCode()
    {
        return $this->hasOne(\App\Models\ReferralCode::class);
    }

    public function referralsMade()
    {
        return $this->hasMany(\App\Models\Referral::class, 'referrer_id');
    }

    public function referralReceived()
    {
        return $this->hasOne(\App\Models\Referral::class, 'referred_id');
    }

    public function referralRewards()
    {
        return $this->hasMany(\App\Models\ReferralReward::class);
    }

    public function referrer()
    {
        return $this->belongsTo(User::class, 'referred_by');
    }

    /**
     * Get phone verification codes for this user
     * Note: VerificationCode uses 'identifier' (phone number) instead of user_id
     */
    public function phoneVerificationCodes()
    {
        if (!$this->phone) {
            return VerificationCode::whereRaw('1 = 0'); // Return empty query
        }
        
        return VerificationCode::where('identifier', $this->phone)
                    ->where('type', 'phone');
    }

    /**
     * Get verified phone verification code
     * Handles phone number variations (with/without country code)
     */
    public function verifiedPhoneCode()
    {
        if (!$this->phone) {
            return null;
        }
        
        // Try exact match first
        $verifiedCode = VerificationCode::where('identifier', $this->phone)
                    ->where('type', 'phone')
                    ->where('verified', true)
                    ->latest('updated_at')
                    ->first();
        
        if ($verifiedCode) {
            return $verifiedCode;
        }
        
        // Try with common country code variations if exact match fails
        $phoneVariations = [
            $this->phone,
            '+' . $this->phone,
            '+92' . $this->phone, // Pakistan country code
            '92' . $this->phone,
        ];
        
        // Remove duplicates
        $phoneVariations = array_unique($phoneVariations);
        
        return VerificationCode::whereIn('identifier', $phoneVariations)
                    ->where('type', 'phone')
                    ->where('verified', true)
                    ->latest('updated_at')
                    ->first();
    }

    /**
     * Accessor for phone_verified_at attribute
     * Returns the timestamp when phone was verified from verification_codes table
     * This allows $user->phone_verified_at to work without adding a column to users table
     */
    public function getPhoneVerifiedAtAttribute()
    {
        $verifiedCode = $this->verifiedPhoneCode();
        
        if ($verifiedCode && $verifiedCode->verified) {
            return $verifiedCode->updated_at;
        }
        
        return null;
    }

    /**
     * Check if phone is verified
     */
    public function isPhoneVerified()
    {
        return $this->phone_verified_at !== null;
    }

    /**
     * Mark phone as verified by creating/updating verification code
     * This ensures the phone_verified_at accessor will return a value
     */
    public function markPhoneAsVerified()
    {
        if (!$this->phone) {
            return false;
        }

        // Try to find existing verification code for this phone (exact match or variations)
        $phoneVariations = [
            $this->phone,
            '+' . $this->phone,
            '+92' . $this->phone,
            '92' . $this->phone,
        ];
        
        $verificationCode = VerificationCode::whereIn('identifier', array_unique($phoneVariations))
            ->where('type', 'phone')
            ->latest()
            ->first();

        if ($verificationCode) {
            // Mark existing code as verified
            $verificationCode->markAsVerified();
        } else {
            // Create a new verified code record with the exact phone number from user
            VerificationCode::create([
                'identifier' => $this->phone,
                'code' => '000000', // Placeholder since it's already verified
                'type' => 'phone',
                'expires_at' => now()->addYears(10), // Far future date
                'verified' => true
            ]);
        }

        return true;
    }
}
