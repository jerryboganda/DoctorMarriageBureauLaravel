<?php

namespace App\Http\Resources\PublicProfile;

use Illuminate\Contracts\Support\Arrayable;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class HobbiesInterests extends JsonResource
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
            'hobbies' => $this->hobbies,
            'interests' => $this->interests,
            'music' => $this->music,
            'books' => $this->books,
            'movies' => $this->movies,
            'tv_shows' => $this->tv_shows,
            'sports' => $this->sports,
            'fitness_activities' => $this->fitness_activities,
            'cuisines' => $this->cuisines,
            'dress_styles' => $this->dress_styles,
        ];
    }
}
