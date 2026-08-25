<?php

namespace App\Http\Controllers\Api\Admin;

use App\Models\JobTitle;

class JobTitleController extends CrudController
{
    protected string $modelClass = JobTitle::class;

    protected array $searchColumns = ['name'];

    protected array $sortable = ['id', 'name', 'created_at'];
}
