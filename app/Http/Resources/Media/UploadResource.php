<?php

namespace App\Http\Resources\Media;

use Illuminate\Contracts\Support\Arrayable;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UploadResource extends JsonResource
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
            'attachment' => uploaded_asset($this->id),
            'attachment_type' => ($this->type),
            'extension' => ($this->extension),
            'file_name' => ($this->file_original_name),
        ];
    }
}
