<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class GalleryImageResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return array|\Illuminate\Contracts\Support\Arrayable|\JsonSerializable
     */
    public function toArray($request)
    {
        $imageUrl = uploaded_asset($this->image);
        $privacyLevel = $this->privacy_level ?? 'public';
        $isMainPhoto = (bool) ($this->is_main_photo ?? false);
        
        return [
            // Common fields
            'id'             => $this->id,
            'url'            => $imageUrl,
            'privacy_level'  => $privacyLevel,  // For React Panel
            
            // React Panel fields
            'is_main'        => $isMainPhoto,   // For React Panel
            
            // Mobile App fields
            'is_primary'     => $isMainPhoto,   // For Mobile App
            'is_private'     => $privacyLevel === 'private' || $privacyLevel === 'vault',  // For Mobile App
            'is_approved'    => true,           // For Mobile App
            'thumbnail'      => $imageUrl,      // For Mobile App
            'order'          => $this->sort_order ?? 0,
            
            // Legacy support
            'image_id'       => $this->id,
            'image_path'     => $imageUrl,
            
            'created_at'     => $this->created_at ? $this->created_at->toISOString() : null,
        ];
    }
}
