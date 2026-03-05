<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Api\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BaseAdminController extends Controller
{
    protected function ok($data = null, string $message = 'Success'): JsonResponse
    {
        return response()->json([
            'result' => true,
            'message' => $message,
            'data' => $data,
        ]);
    }

    protected function fail(string $message = 'Request failed', int $status = 422, $errors = null): JsonResponse
    {
        return response()->json([
            'result' => false,
            'message' => $message,
            'errors' => $errors,
        ], $status);
    }

    protected function applySearch($query, ?string $search, array $columns)
    {
        if (!$search) {
            return $query;
        }

        return $query->where(function ($q) use ($search, $columns) {
            foreach ($columns as $column) {
                $q->orWhere($column, 'like', '%' . $search . '%');
            }
        });
    }

    protected function paginateQuery(Request $request, $query): array
    {
        $perPage = max(1, min(100, (int) $request->get('per_page', 20)));
        $paginated = $query->paginate($perPage);

        return [
            'items' => $paginated->items(),
            'pagination' => [
                'current_page' => $paginated->currentPage(),
                'last_page' => $paginated->lastPage(),
                'per_page' => $paginated->perPage(),
                'total' => $paginated->total(),
            ],
        ];
    }
}
