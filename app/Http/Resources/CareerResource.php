<?php

namespace App\Http\Resources;

use Illuminate\Contracts\Support\Arrayable;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CareerResource extends JsonResource
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
            'id' => $this->id ? $this->id : '',
            'designation' => $this->designation ? $this->designation : '',
            'company' => $this->company ? $this->company : '',
            'start' => $this->start ? $this->start : '',
            'end' => $this->end ? $this->end : '',
            'present' => $this->present == 1 ? true : false,
        ];
    }
}
