<?php

namespace App\Http\Controllers\Api\Admin;

use App\Models\Caste;

class CasteController extends CrudController
{
    protected string $modelClass = Caste::class;

    protected array $searchColumns = ['name'];

    protected array $relations = ['religion'];

    protected array $sortable = ['id', 'name', 'religion_id', 'created_at'];
}
