<?php

namespace App\Http\Controllers\Api\Admin;

use App\Models\AdditionalAttribute;

class AdditionalAttributeController extends CrudController
{
    protected string $modelClass = AdditionalAttribute::class;

    protected array $searchColumns = ['name'];

    protected array $sortable = ['id', 'name', 'status', 'created_at'];
}
