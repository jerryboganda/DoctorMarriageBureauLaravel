<?php

namespace App\Http\Controllers\Api\Admin;

use App\Models\Notification;

class NotificationController extends BaseAdminController
{
    public function index()
    {
        $query = Notification::query()->orderByDesc('id');
        return $this->ok($this->paginateQuery(request(), $query));
    }
}
