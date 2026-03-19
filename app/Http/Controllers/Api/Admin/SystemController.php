<?php

namespace App\Http\Controllers\Api\Admin;

use Illuminate\Support\Facades\Artisan;

class SystemController extends BaseAdminController
{
    public function clearCache()
    {
        Artisan::call('optimize:clear');
        return $this->ok(null, 'Cache cleared successfully');
    }
}
