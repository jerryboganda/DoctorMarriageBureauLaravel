<?php

namespace App\Http\Controllers\Api\Admin;

use App\Models\Speciality;

class SpecialityController extends CrudController
{
    protected string $modelClass = Speciality::class;
    protected array $searchColumns = ['name'];
    protected array $sortable = ['id', 'name', 'created_at'];
}
