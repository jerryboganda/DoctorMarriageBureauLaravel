<?php

namespace App\Http\Resources;

use Illuminate\Contracts\Support\Arrayable;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class GalleryImageResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @param  Request  $request
     * @return array|Arrayable|\JsonSerializable
     */
    public function toArray($request)
    {
        $imageUrl = uploaded_asset($this->image);
        $privacyLevel = $this->privacy_level ?? 'public';
        $isMainPhoto = (bool) ($this->is_main_photo ?? false);
        $isPrivate = $privacyLevel === 'private' || $privacyLevel === 'vault';

        return [
            'id' => $this->id,
            'image' => $imageUrl,
            'url' => $imageUrl,
            'privacy_level' => $privacyLevel,
            'is_blurred' => false,
            'is_main' => $isMainPhoto,
            'is_primary' => $isMainPhoto,
            'is_private' => $isPrivate,
            'is_approved' => true,
            'thumbnail' => $imageUrl,
            'order' => $this->sort_order ?? 0,
            'image_id' => $this->id,
            'image_path' => $imageUrl,
            'created_at' => $this->created_at ? $this->created_at->toISOString() : null,
        ];
    }
}
