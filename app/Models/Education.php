<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Education extends Model
{
    use SoftDeletes;

    protected $fillable = ['user_id', 'degree', 'present'];

    public function user()
    {
        return $this->belongsTo(User::class)->withTrashed();
    }
}
