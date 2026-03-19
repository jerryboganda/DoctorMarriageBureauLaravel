<?php

namespace App\Http\Controllers\Api\Admin;

use App\Models\MaritalStatus;

class MaritalStatusController extends CrudController
{
    protected string $modelClass = MaritalStatus::class;
    protected array $searchColumns = ['name'];
    protected array $sortable = ['id', 'name', 'created_at'];
}
