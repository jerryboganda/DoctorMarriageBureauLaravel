<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class JobTitle extends Model
{
    use SoftDeletes;

    protected $fillable = ['id', 'name'];

    public function careers()
    {
        return $this->hasMany(Career::class);
    }
}
