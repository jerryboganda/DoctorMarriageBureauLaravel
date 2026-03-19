<?php

namespace App\Models;
use App\Models\User;
use App\Models\JobTitle;
use App\Models\Speciality;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Career extends Model
{
    use SoftDeletes;

    protected $guarded = [];

    public function user()
    {
        return $this->belongsTo(User::class)->withTrashed();
    }

    public function jobTitle()
    {
        return $this->belongsTo(JobTitle::class);
    }

    public function speciality()
    {
        return $this->belongsTo(Speciality::class);
    }
}
