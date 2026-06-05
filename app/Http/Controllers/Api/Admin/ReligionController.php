<?php

namespace App\Http\Controllers\Api\Admin;

use App\Models\Religion;

class ReligionController extends CrudController
{
    protected string $modelClass = Religion::class;

    protected array $searchColumns = ['name'];

    protected array $sortable = ['id', 'name', 'created_at'];
}
