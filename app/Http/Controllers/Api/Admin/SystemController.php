<?php

namespace App\Http\Controllers\Api\Admin;

use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Cache;

class SystemController extends BaseAdminController
{
    public function clearCache()
    {
        Cache::flush();
        Artisan::call('optimize:clear');

        return $this->ok(null, 'Cache cleared successfully');
    }
}
