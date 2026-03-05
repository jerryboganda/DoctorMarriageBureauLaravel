<?php

namespace App\Http\Controllers\Api\Admin;

use App\Models\City;

class CityController extends CrudController
{
    protected string $modelClass = City::class;
    protected array $searchColumns = ['name'];
    protected array $relations = ['state'];
    protected array $sortable = ['id', 'name', 'state_id', 'created_at'];
}
