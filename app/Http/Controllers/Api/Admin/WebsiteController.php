<?php

namespace App\Http\Controllers\Api\Admin;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class WebsiteController extends BaseAdminController
{
    public function headerSettings()
    {
        return $this->ok($this->readGroup('website_header'));
    }

    public function updateHeader(Request $request)
    {
        $this->writeGroup('website_header', $request->all());

        return $this->ok(null, 'Header settings updated');
    }

    public function footerSettings()
    {
        return $this->ok($this->readGroup('website_footer'));
    }

    public function updateFooter(Request $request)
    {
        $this->writeGroup('website_footer', $request->all());

        return $this->ok(null, 'Footer settings updated');
    }

    public function appearances()
    {
        return $this->ok($this->readGroup('website_appearance'));
    }

    public function updateAppearances(Request $request)
    {
        $this->writeGroup('website_appearance', $request->all());

        return $this->ok(null, 'Appearance settings updated');
    }

    protected function readGroup(string $prefix): array
    {
        return DB::table('settings')
            ->where('type', 'like', $prefix.'.%')
            ->pluck('value', 'type')
            ->toArray();
    }

    protected function writeGroup(string $prefix, array $payload): void
    {
        foreach ($payload as $key => $value) {
            $dotPrefix = $prefix.'.';
            $normalizedKey = str_starts_with((string) $key, $dotPrefix)
                ? substr((string) $key, strlen($dotPrefix))
                : (string) $key;

            DB::table('settings')->updateOrInsert(
                ['type' => $prefix.'.'.$normalizedKey],
                [
                    'value' => is_scalar($value) ? (string) $value : json_encode($value),
                    'updated_at' => now(),
                    'created_at' => now(),
                ]
            );
        }
    }
}
