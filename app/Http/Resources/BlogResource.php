<?php

namespace App\Http\Resources;

use Illuminate\Contracts\Support\Arrayable;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class BlogResource extends JsonResource
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
            'title' => $this->title,
            'slug' => $this->slug,
            'banner' => uploaded_asset($this->banner) ?? static_asset('assets/img/default-blog.png'),
            'category_name' => $this->category ? $this->category->category_name : '',
            'short_description' => $this->short_description,
            // 'description' => str_replace('&nbsp;', ' ', strip_tags($this->description)),
            'description' => preg_replace('/(<[^>]+) style=".*?"/i', '$1', $this->description),
        ];
    }
}
