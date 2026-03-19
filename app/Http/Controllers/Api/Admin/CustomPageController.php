<?php

namespace App\Http\Controllers\Api\Admin;

use App\Models\Page;

class CustomPageController extends CrudController
{
    protected string $modelClass = Page::class;
    protected array $searchColumns = ['title', 'slug'];
    protected array $sortable = ['id', 'title', 'created_at'];
}
