<?php

namespace App\Http\Controllers\Api\Admin;

use App\Models\AnnualSalaryRange;

class AnnualSalaryController extends CrudController
{
    protected string $modelClass = AnnualSalaryRange::class;

    protected array $searchColumns = ['name'];

    protected array $sortable = ['id', 'name', 'created_at'];
}
