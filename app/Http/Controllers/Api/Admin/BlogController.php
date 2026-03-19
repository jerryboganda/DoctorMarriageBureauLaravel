<?php

namespace App\Http\Controllers\Api\Admin;

use App\Models\Blog;

class BlogController extends CrudController
{
    protected string $modelClass = Blog::class;
    protected array $searchColumns = ['title', 'slug'];
    protected array $relations = ['category'];
    protected array $sortable = ['id', 'title', 'status', 'created_at'];

    public function toggleStatus($id)
    {
        $blog = Blog::findOrFail($id);
        $blog->status = (int) !$blog->status;
        $blog->save();

        return $this->ok($blog, 'Blog status updated');
    }
}
