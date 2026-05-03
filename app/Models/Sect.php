<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Sect extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'id',
        'name',
    ];

    public function spiritual_backgrounds()
    {
        return $this->hasMany(SpiritualBackground::class);
    }
}
