<?php

namespace App\Http\Resources;

use Illuminate\Contracts\Support\Arrayable;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class EducationResource extends JsonResource
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
            'id' => $this->id,
            'degree' => $this->degree ?? '',
            'institution' => $this->institution ?? '',
            'start' => $this->start ?? '',
            'end' => $this->end ?? '',
            'present' => $this->present == 1 ? true : false,
        ];
    }
}
