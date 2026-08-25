<?php

namespace App\Http\Controllers\Api\Admin;

use App\Models\Addon;
use Illuminate\Http\Request;

class AddonController extends BaseAdminController
{
    public function index()
    {
        $query = Addon::query()->orderByDesc('id');

        return $this->ok($this->paginateQuery(request(), $query));
    }

    public function store(Request $request)
    {
        $addon = new Addon;
        foreach ($request->except(['_token']) as $key => $value) {
            $addon->{$key} = $value;
        }
        $addon->save();

        return $this->ok($addon, 'Addon saved successfully');
    }

    public function toggle($id)
    {
        $addon = Addon::findOrFail($id);
        $addon->activated = (int) ! $addon->activated;
        $addon->save();

        return $this->ok($addon, 'Addon status updated');
    }
}
