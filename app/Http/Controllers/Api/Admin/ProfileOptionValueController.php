<?php

namespace App\Http\Controllers\Api\Admin;

use App\Models\ProfileOptionValue;
use Illuminate\Http\Request;

class ProfileOptionValueController extends CrudController
{
    protected string $modelClass = ProfileOptionValue::class;
    protected array $searchColumns = ['name', 'field_name'];
    protected array $sortable = ['id', 'name', 'field_name', 'active', 'created_at'];

    public function toggleActive(Request $request, $id)
    {
        $item = ProfileOptionValue::findOrFail($id);
        $item->active = (int) !$item->active;
        $item->save();

        return $this->ok($item, 'Status updated');
    }
}
