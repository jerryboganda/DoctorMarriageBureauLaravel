<?php

namespace App\Http\Resources\PublicProfile;

use Illuminate\Contracts\Support\Arrayable;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class FamilyInformation extends JsonResource
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
            'father' => $this->father,
            'mother' => $this->mother,
            'sibling' => $this->sibling,
        ];
    }
}
