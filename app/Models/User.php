<?php

namespace App\Models;

use App\Notifications\EmailVerificationNotification;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable implements MustVerifyEmail
{
    use HasApiTokens;
    use HasRoles;
    use Notifiable;
    use SoftDeletes;

    public function sendEmailVerificationNotification()
    {
        try {
            $this->notify(new EmailVerificationNotification);
        } catch (\Exception $e) {
            \Log::error('Email verification notification failed: '.$e->getMessage());
            // Don't throw the exception to prevent breaking the flow
        }
    }

    /**
     * The attributes that are mass assignable.
     *
     * @var array
     */
    protected $fillable = [
        'first_name', 'last_name', 'email', 'password', 'code', 'phone', 'membership', 'approved', 'verification_code', 'fcm_token', 'referred_by', 'email_verified_at', 'user_type',
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
        'must_change_password' => 'boolean',
        // phone_verified_at is handled by accessor getPhoneVerifiedAtAttribute()
        // It returns a Carbon instance from verification_codes.updated_at
    ];

    public function hasUsablePassword(): bool
    {
        return ! empty($this->password) && strlen((string) $this->password) >= 40;
    }

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

    public function uploads()
    {
        return $this->hasMany(Upload::class);
    }

    public function profile_views()
    {
        return $this->hasMany(ProfileView::class);
    }

    // ===== Referral System Relationships =====

    public function referralCode()
    {
        return $this->hasOne(ReferralCode::class);
    }

    public function referralsMade()
    {
        return $this->hasMany(Referral::class, 'referrer_user_id');
    }

    public function referralReceived()
    {
        return $this->hasOne(Referral::class, 'referred_user_id');
    }

    public function referralRewards()
    {
        return $this->hasMany(ReferralReward::class);
    }

    public function referrer()
    {
        return $this->belongsTo(User::class, 'referred_by');
    }
}
