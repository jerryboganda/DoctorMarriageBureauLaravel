<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Member extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'user_id', 'gender', 'birthday', 'on_behalves_id', 'current_package_id', 'remaining_interest', 'unverified_messages_used', 'unverified_proposals_used', 'remaining_contact_view', 'remaining_photo_gallery', 'remaining_profile_image_view', 'remaining_gallery_image_view', 'remaining_profile_viewer_view', 'auto_profile_match', 'onboarding_completed', 'package_validity', 'medical_license_number', 'specialization', 'verification_document',
        'is_agent_pick', 'is_high_intent', 'travel_mode', 'is_visible', 'management_mode', 'primary_manager_id',
        'travel_city', 'travel_country',
    ];

    public function user()
    {
        return $this->belongsTo(User::class)->withTrashed();
    }

    public function getBirthdayAttribute($value)
    {
        return $value ? Carbon::parse($value) : null;
    }

    public function setBirthdayAttribute($value): void
    {
        $this->attributes['birthday'] = $value ? Carbon::parse($value)->format('Y-m-d') : null;
    }

    public function on_behalves()
    {
        return $this->belongsTo(OnBehalf::class)->withTrashed();
    }

    public function marital_status()
    {
        return $this->belongsTo(MaritalStatus::class)->withTrashed();
    }

    public function package()
    {
        return $this->belongsTo(Package::class, 'current_package_id')->withTrashed();
    }

    public function mothereTongue()
    {
        return $this->belongsTo(MemberLanguage::class, 'mothere_tongue')->withTrashed()->withDefault();
    }

    public function annualSalaryRange()
    {
        return $this->belongsTo(AnnualSalaryRange::class);
    }
}
