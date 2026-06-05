<?php

namespace App\Http\Controllers\Api\Admin;

use Illuminate\Http\Request;
use Spatie\Permission\Models\Role;

class RoleController extends BaseAdminController
{
    public function index(Request $request)
    {
        $query = Role::query()->with('permissions')->orderByDesc('id');
        if ($search = $request->get('search')) {
            $query->where('name', 'like', '%'.$search.'%');
        }

        return $this->ok($this->paginateQuery($request, $query));
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255|unique:roles,name',
        ]);

        $role = Role::create(['name' => $request->name]);
        $permissions = $request->get('permissions', []);
        if (is_array($permissions) && ! empty($permissions)) {
            $role->syncPermissions($permissions);
        }

        return $this->ok($role->load('permissions'), 'Role created successfully');
    }

    public function show($id)
    {
        $role = Role::with('permissions')->findOrFail($id);

        return $this->ok($role);
    }

    public function update(Request $request, $id)
    {
        $role = Role::findOrFail($id);
        if ($request->filled('name')) {
            $role->name = $request->name;
            $role->save();
        }

        if ($request->has('permissions') && is_array($request->permissions)) {
            $role->syncPermissions($request->permissions);
        }

        return $this->ok($role->load('permissions'), 'Role updated successfully');
    }

    public function destroy($id)
    {
        $role = Role::findOrFail($id);
        $role->delete();

        return $this->ok(null, 'Role deleted successfully');
    }

    public function updatePermissions(Request $request, $id)
    {
        $role = Role::findOrFail($id);
        $permissions = $request->get('permissions', []);
        $role->syncPermissions($permissions);

        return $this->ok($role->load('permissions'), 'Role permissions updated');
    }
}
