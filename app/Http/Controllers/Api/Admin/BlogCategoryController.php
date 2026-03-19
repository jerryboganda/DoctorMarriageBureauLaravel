<?php

namespace App\Http\Controllers\Api\Admin;

use App\Models\BlogCategory;

class BlogCategoryController extends CrudController
{
    protected string $modelClass = BlogCategory::class;
    protected array $searchColumns = ['name'];
    protected array $sortable = ['id', 'name', 'created_at'];
}
