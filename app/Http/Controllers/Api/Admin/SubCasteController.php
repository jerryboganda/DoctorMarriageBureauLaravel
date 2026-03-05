<?php

namespace App\Http\Controllers\Api\Admin;

use App\Models\SubCaste;

class SubCasteController extends CrudController
{
    protected string $modelClass = SubCaste::class;
    protected array $searchColumns = ['name'];
    protected array $relations = ['caste'];
    protected array $sortable = ['id', 'name', 'caste_id', 'created_at'];
}
