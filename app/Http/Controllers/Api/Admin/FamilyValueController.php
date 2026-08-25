<?php

namespace App\Http\Controllers\Api\Admin;

use App\Models\FamilyValue;

class FamilyValueController extends CrudController
{
    protected string $modelClass = FamilyValue::class;

    protected array $searchColumns = ['name'];

    protected array $sortable = ['id', 'name', 'created_at'];
}
