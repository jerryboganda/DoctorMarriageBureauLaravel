<?php

namespace App\Http\Controllers\Api\Admin;

use App\Models\Country;
use Illuminate\Http\Request;

class CountryController extends CrudController
{
    protected string $modelClass = Country::class;
    protected array $searchColumns = ['name', 'code'];
    protected array $sortable = ['id', 'name', 'code', 'status', 'created_at'];

    public function toggleStatus(Request $request, $id)
    {
        $country = Country::findOrFail($id);
        $country->status = (int) !$country->status;
        $country->save();

        return $this->ok($country, 'Status updated');
    }
}
