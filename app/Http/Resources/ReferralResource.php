<?php

namespace App\Http\Resources;

use App\Models\Referral;
use App\Models\User;
use Illuminate\Http\Resources\Json\JsonResource;

class ReferralResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return array|\Illuminate\Contracts\Support\Arrayable|\JsonSerializable
     */
    public function toArray($request)
    {
        $resource = $this->resource;
        $referredUser = $resource instanceof Referral ? $resource->referred : ($resource instanceof User ? $resource : null);
        $displayDate = $resource instanceof Referral ? $resource->created_at : ($resource->created_at ?? null);

        return [
            'name' => trim(($referredUser->first_name ?? '') . ' ' . ($referredUser->last_name ?? '')),
            'date' => $displayDate ? date('d-m-Y', strtotime($displayDate)) : null,
        ];
    }
}
