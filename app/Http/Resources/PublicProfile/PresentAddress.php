<?php

namespace App\Http\Resources\PublicProfile;

use App\Models\City;
use App\Models\Country;
use App\Models\State;
use Illuminate\Contracts\Support\Arrayable;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PresentAddress extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @param  Request  $request
     * @return array|Arrayable|\JsonSerializable
     */
    public function toArray($request)
    {
        return [
            'country' => Country::where('id', $this->country_id)->first()->name,
            'state' => State::where('id', $this->state_id)->first()->name,
            'city' => City::where('id', $this->city_id)->first()->name,
            'postal_code' => $this->postal_code,
        ];
    }
}
