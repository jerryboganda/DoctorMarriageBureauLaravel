<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Address extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'user_id',
        'type',
        'country_id',
        'state_id',
        'city_id',
        'postal_code',
    ];

    public function user()
    {
        return $this->belongsTo(User::class)->withTrashed();
    }

    public function country()
    {
        return $this->belongsTo(Country::class)->withTrashed();
    }

    public function state()
    {
        return $this->belongsTo(State::class)->withTrashed();
    }

    public function city()
    {
        return $this->belongsTo(City::class)->withTrashed();
    }
}
