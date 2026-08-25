<?php

namespace App\Http\Controllers\Api\Admin;

use App\Models\FamilyStatus;

class FamilyStatusController extends CrudController
{
    protected string $modelClass = FamilyStatus::class;

    protected array $searchColumns = ['name'];

    protected array $sortable = ['id', 'name', 'created_at'];
}
