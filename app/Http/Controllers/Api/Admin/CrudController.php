<?php

namespace App\Http\Controllers\Api\Admin;

use Illuminate\Http\Request;

class CrudController extends BaseAdminController
{
    protected string $modelClass;
    protected array $searchColumns = ['name'];
    protected array $relations = [];
    protected array $sortable = ['id'];

    public function index(Request $request)
    {
        $modelClass = $this->modelClass;
        $query = $modelClass::query();

        if (!empty($this->relations)) {
            $query->with($this->relations);
        }

        $search = $request->get('search');
        $query = $this->applySearch($query, $search, $this->searchColumns);

        foreach ($request->except(['search', 'sort_by', 'sort_dir', 'page', 'per_page']) as $key => $value) {
            if ($value !== null && $value !== '') {
                $query->where($key, $value);
            }
        }

        $sortBy = $request->get('sort_by', 'id');
        $sortDir = strtolower($request->get('sort_dir', 'desc')) === 'asc' ? 'asc' : 'desc';
        if (in_array($sortBy, $this->sortable, true)) {
            $query->orderBy($sortBy, $sortDir);
        }

        return $this->ok($this->paginateQuery($request, $query));
    }

    public function store(Request $request)
    {
        $modelClass = $this->modelClass;
        $item = new $modelClass();

        foreach ($request->except(['_token']) as $key => $value) {
            $item->{$key} = $value;
        }
        $item->save();

        return $this->ok($item->fresh(), 'Created successfully');
    }

    public function show($id)
    {
        $modelClass = $this->modelClass;
        $query = $modelClass::query();
        if (!empty($this->relations)) {
            $query->with($this->relations);
        }
        $item = $query->findOrFail($id);

        return $this->ok($item);
    }

    public function update(Request $request, $id)
    {
        $modelClass = $this->modelClass;
        $item = $modelClass::findOrFail($id);

        foreach ($request->except(['_token', '_method']) as $key => $value) {
            $item->{$key} = $value;
        }
        $item->save();

        return $this->ok($item->fresh(), 'Updated successfully');
    }

    public function destroy($id)
    {
        $modelClass = $this->modelClass;
        $item = $modelClass::findOrFail($id);
        $item->delete();

        return $this->ok(null, 'Deleted successfully');
    }

    public function bulkDelete(Request $request)
    {
        $ids = $request->get('ids', []);
        if (!is_array($ids) || empty($ids)) {
            return $this->fail('No ids provided', 422);
        }

        $modelClass = $this->modelClass;
        $modelClass::whereIn('id', $ids)->delete();

        return $this->ok(null, 'Bulk delete completed');
    }
}
