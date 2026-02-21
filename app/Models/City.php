<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class City extends Model
{
    use SoftDeletes;

    protected $fillable = ['id', 'name', 'state_id'];


    public function state()
    {
        return $this->belongsTo(State::class);
    }

    public function addresses()
    {
        return $this->hasmany(Address::class);
    }
}
