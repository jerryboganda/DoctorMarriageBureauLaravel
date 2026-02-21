<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class AddonProductResource extends JsonResource
{
    public function toArray($request)
    {
        return [
            'addon_id' => $this->id,
            'name' => $this->name,
            'slug' => $this->slug,
            'description' => $this->description,
            'price' => $this->price,
            'price_text' => single_price($this->price),
            'badge' => $this->badge,
        ];
    }
}
