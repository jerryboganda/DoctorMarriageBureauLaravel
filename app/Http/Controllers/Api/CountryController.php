<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\Profile\CountryResource;
use App\Models\Country;

class CountryController extends Controller
{
    public function countries()
    {
        return CountryResource::collection(Country::where('status', 1)->get());
    }
}
