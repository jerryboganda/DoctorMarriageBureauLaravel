<?php

namespace App\Http\Controllers\Api\Admin;

use App\Models\Staff;

class StaffController extends CrudController
{
    protected string $modelClass = Staff::class;

    protected array $searchColumns = ['staff_id', 'phone'];

    protected array $relations = ['user', 'role'];

    protected array $sortable = ['id', 'role_id', 'created_at'];
}
