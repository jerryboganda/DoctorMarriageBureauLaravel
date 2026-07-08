<?php

namespace App\Http\Controllers\Api;

use App\Http\Resources\Profile\CasteResource;
use App\Http\Resources\Profile\CityResource;
use App\Http\Resources\Profile\CountryResource;
use App\Http\Resources\Profile\FamilyValuesResource;
use App\Http\Resources\Profile\LanguageResource;
use App\Http\Resources\Profile\MaritialStatusResource;
use App\Http\Resources\Profile\OnBehalfResource;
use App\Http\Resources\Profile\ReligionResource;
use App\Http\Resources\Profile\SectResource;
use App\Http\Resources\Profile\StateResource;
use App\Http\Resources\Profile\SubCasteResource;
use App\Models\Caste;
use App\Models\City;
use App\Models\Country;
use App\Models\FamilyValue;
use App\Models\MaritalStatus;
use App\Models\MemberLanguage;
use App\Models\OnBehalf;
use App\Models\Religion;
use App\Models\Sect;
use App\Models\State;
use App\Models\SubCaste;
use Illuminate\Support\Facades\Cache;

class ProfileDropdownController extends Controller
{
    private function remember(string $key, callable $callback)
    {
        return Cache::remember('api.reference.'.$key, now()->addDay(), $callback);
    }

    public function profile_dropdown()
    {
        $data['onbehalf_list'] = OnBehalfResource::collection($this->remember('onbehalf_list', fn () => OnBehalf::latest()->get()));
        $data['maritial_status'] = MaritialStatusResource::collection($this->remember('maritial_status', fn () => MaritalStatus::latest()->get()));
        $data['language_list'] = LanguageResource::collection($this->remember('language_list', fn () => MemberLanguage::all()));
        $data['religion_list'] = ReligionResource::collection($this->remember('religion_list', fn () => Religion::all()));
        $data['family_value_list'] = FamilyValuesResource::collection($this->remember('family_value_list', fn () => FamilyValue::all()));
        $data['country_list'] = CountryResource::collection($this->remember('country_list', fn () => Country::where('status', 1)->get()));

        return $this->response_data($data);
    }

    public function onbehalf_list()
    {
        return OnBehalfResource::collection($this->remember('onbehalf_list', fn () => OnBehalf::latest()->get()));
    }

    public function maritial_status()
    {
        return MaritialStatusResource::collection($this->remember('maritial_status', fn () => MaritalStatus::latest()->get()));
    }

    public function country_list()
    {
        return CountryResource::collection($this->remember('country_list', fn () => Country::where('status', 1)->get()));
    }

    public function state_list($id)
    {
        return StateResource::collection($this->remember('state_list.'.$id, fn () => State::where('country_id', $id)->get()));
    }

    public function city_list($id)
    {
        return CityResource::collection($this->remember('city_list.'.$id, fn () => City::where('state_id', $id)->get()));
    }

    public function language_list()
    {
        return LanguageResource::collection($this->remember('language_list', fn () => MemberLanguage::all()));
    }

    public function religion_list()
    {
        return ReligionResource::collection($this->remember('religion_list', fn () => Religion::all()));
    }

    public function sect_list()
    {
        return SectResource::collection($this->remember('sect_list', fn () => Sect::orderBy('name')->get()));
    }

    public function caste_list($id = null)
    {
        $query = Caste::query();
        if ($id !== null && $id !== '') {
            $query->where('religion_id', $id);
        }

        $cacheKey = 'caste_list.'.(($id !== null && $id !== '') ? $id : 'all');

        return CasteResource::collection($this->remember($cacheKey, fn () => $query->orderBy('name')->get()));
    }

    public function sub_caste_list($id)
    {
        return SubCasteResource::collection($this->remember('sub_caste_list.'.$id, fn () => SubCaste::where('caste_id', $id)->get()));
    }

    public function family_value_list()
    {
        return FamilyValuesResource::collection($this->remember('family_value_list', fn () => FamilyValue::all()));
    }
}
