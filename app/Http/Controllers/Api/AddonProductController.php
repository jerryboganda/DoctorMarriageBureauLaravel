<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Api\Controller;
use App\Http\Resources\AddonProductResource;
use App\Models\AddonProduct;

class AddonProductController extends Controller
{
    public function index()
    {
        $addons = AddonProduct::where('is_active', 1)->orderBy('id')->get();

        return AddonProductResource::collection($addons)->additional([
            'result' => true,
        ]);
    }
}
