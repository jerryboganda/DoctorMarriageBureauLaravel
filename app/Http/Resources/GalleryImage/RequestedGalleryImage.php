<?php

namespace App\Http\Resources\GalleryImage;

use Illuminate\Contracts\Support\Arrayable;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class RequestedGalleryImage extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @param  Request  $request
     * @return array|Arrayable|\JsonSerializable
     */
    public function toArray($request)
    {
        $placeholderUrl = static_asset('assets/img/placeholder.jpg');
        $privacyLevel = $this->privacy_level ?? 'public';
        $isMainPhoto = (bool) ($this->is_main_photo ?? false);

        return [
            'id' => $this->id,
            'image' => null,
            'url' => null,
            'privacy_level' => $privacyLevel,
            'is_blurred' => true,
            'is_main' => $isMainPhoto,
            'is_primary' => $isMainPhoto,
            'is_private' => $privacyLevel === 'private' || $privacyLevel === 'vault',
            'is_approved' => false,
            'thumbnail' => $placeholderUrl,
            'order' => $this->sort_order ?? 0,
            'image_id' => $this->id,
            'image_path' => $placeholderUrl,
            'created_at' => $this->created_at ? $this->created_at->toISOString() : null,
        ];
    }
}
