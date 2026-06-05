<?php

namespace App\Http\Resources\PublicProfile;

use Illuminate\Contracts\Support\Arrayable;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AttitudesBehaviors extends JsonResource
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
            'affection' => $this->affection,
            'humor' => $this->humor,
            'political_views' => $this->political_views,
            'religious_service' => $this->religious_service,
        ];
    }
}
