<?php

namespace App\Http\Controllers\Api;

use App\Http\Resources\BlogResource;
use App\Models\Blog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class BlogController extends Controller
{
    public function all_blogs()
    {
        $blogs = Cache::remember('api.static.blogs.all', now()->addMinutes(30), fn () => Blog::latest()->active()->get());

        return BlogResource::collection($blogs)->additional([
            'result' => true,
        ]);
    }

    public function blog_details(Request $request)
    {
        $blog = Cache::remember('api.static.blogs.slug.'.$request->slug, now()->addMinutes(30), fn () => Blog::where('slug', $request->slug)->first());

        return (new BlogResource($blog))->additional([
            'result' => true,
        ]);
    }
}
