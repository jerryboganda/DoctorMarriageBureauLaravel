<?php

namespace App\Http\Resources\PublicProfile;

use Illuminate\Contracts\Support\Arrayable;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class LifeStyleResource extends JsonResource
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
            'diet' => $this->diet,
            'drink' => $this->drink,
            'smoke' => $this->smoke,
            'living_with' => $this->living_with,
        ];
    }
}
