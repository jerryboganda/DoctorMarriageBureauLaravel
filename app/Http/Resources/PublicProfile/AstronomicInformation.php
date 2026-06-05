<?php

namespace App\Http\Resources\PublicProfile;

use Illuminate\Contracts\Support\Arrayable;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AstronomicInformation extends JsonResource
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
            'sun_sign' => $this->sun_sign,
            'moon_sign' => $this->moon_sign,
            'time_of_birth' => $this->time_of_birth,
            'city_of_birth' => $this->city_of_birth,
        ];
    }
}
