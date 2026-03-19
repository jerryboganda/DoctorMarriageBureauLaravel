<?php

namespace App\Http\Controllers\Api\Admin;

use App\Models\Sect;

class SectController extends CrudController
{
    protected string $modelClass = Sect::class;
    protected array $searchColumns = ['name'];
    protected array $sortable = ['id', 'name', 'created_at'];
}
