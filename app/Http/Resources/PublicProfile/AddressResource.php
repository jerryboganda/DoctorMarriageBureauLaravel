<?php

namespace App\Http\Resources\PublicProfile;

use App\Models\City;
use App\Models\Country;
use App\Models\State;
use Illuminate\Contracts\Support\Arrayable;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AddressResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @param  Request  $request
     * @return array|Arrayable|\JsonSerializable
     */
    public function toArray($request)
    {
        $country = $this->country_id ? Country::where('id', $this->country_id)->first() : null;
        $state = $this->state_id ? State::where('id', $this->state_id)->first() : null;
        $city = $this->city_id ? City::where('id', $this->city_id)->first() : null;

        return [
            'country' => $country ? $country->name : null,
            'state' => $state ? $state->name : null,
            'city' => $city ? $city->name : null,
            'postal_code' => $this->postal_code,
        ];
    }
}
