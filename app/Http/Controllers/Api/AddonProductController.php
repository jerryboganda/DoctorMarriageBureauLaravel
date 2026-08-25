<?php

namespace App\Http\Controllers\Api;

use App\Http\Resources\AddonProductResource;
use App\Models\AddonProduct;
use Illuminate\Support\Facades\Cache;

class AddonProductController extends Controller
{
    public function index()
    {
        $addons = Cache::remember('api.static.addons.active', now()->addMinutes(30), fn () => AddonProduct::where('is_active', 1)->orderBy('id')->get());

        return AddonProductResource::collection($addons)->additional([
            'result' => true,
        ]);
    }
}
