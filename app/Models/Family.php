<?php

namespace App\Models;
use App\Models\User;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Family extends Model
{
    use SoftDeletes;

    public function user()
    {
        return $this->belongsTo(User::class)->withTrashed();
    }

    public function guardians()
    {
        return $this->hasMany(FamilyGuardian::class);
    }

    public function photos()
    {
        return $this->hasMany(FamilyPhoto::class)->orderBy('sort_order');
    }

    public function approvals()
    {
        return $this->hasMany(FamilyApproval::class);
    }

    protected $fillable = [
        'user_id',
        'father', 'mother', 'sibling', 
        'father_occupation', 'mother_occupation',
        'about_parents', 'about_siblings', 'about_relatives',
        'about_description', 'location_city', 'location_country', 
        'tradition_level', 'affluence_level', 'interests'
    ];

    protected $casts = [
        'interests' => 'array',
    ];
}
