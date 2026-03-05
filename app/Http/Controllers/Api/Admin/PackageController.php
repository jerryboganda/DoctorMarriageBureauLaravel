<?php

namespace App\Http\Controllers\Api\Admin;

use App\Models\Package;
use Illuminate\Http\Request;

class PackageController extends CrudController
{
    protected string $modelClass = Package::class;
    protected array $searchColumns = ['name'];
    protected array $sortable = ['id', 'name', 'price', 'active', 'created_at'];

    public function toggleStatus($id)
    {
        $package = Package::findOrFail($id);
        $package->active = (int) !$package->active;
        $package->save();

        return $this->ok($package, 'Package status updated');
    }
}
