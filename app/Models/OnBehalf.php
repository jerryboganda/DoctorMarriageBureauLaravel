<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class OnBehalf extends Model
{
    use SoftDeletes;

    protected $fillable = ['name'];

    public function member()
    {
        return $this->hasmany(Member::class)->withTrashed();
    }
}
