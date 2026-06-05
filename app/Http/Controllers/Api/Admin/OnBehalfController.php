<?php

namespace App\Http\Controllers\Api\Admin;

use App\Models\OnBehalf;

class OnBehalfController extends CrudController
{
    protected string $modelClass = OnBehalf::class;

    protected array $searchColumns = ['name'];

    protected array $sortable = ['id', 'name', 'created_at'];
}
