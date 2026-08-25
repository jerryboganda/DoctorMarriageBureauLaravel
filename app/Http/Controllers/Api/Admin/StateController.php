<?php

namespace App\Http\Controllers\Api\Admin;

use App\Models\State;

class StateController extends CrudController
{
    protected string $modelClass = State::class;

    protected array $searchColumns = ['name'];

    protected array $relations = ['country'];

    protected array $sortable = ['id', 'name', 'country_id', 'created_at'];
}
