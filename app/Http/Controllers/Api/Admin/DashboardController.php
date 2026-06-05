<?php

namespace App\Http\Controllers\Api\Admin;

use Illuminate\Http\Request;

class DashboardController extends AdminDashboardController
{
    public function stats(Request $request)
    {
        return $this->index($request);
    }

    public function earningsChart(Request $request)
    {
        $data = $this->index($request)->getData(true);

        return response()->json([
            'result' => true,
            'data' => [
                'monthly' => $data['data']['earnings']['monthly'] ?? [],
                'currency_symbol' => $data['data']['earnings']['currency_symbol'] ?? currency_symbol(),
            ],
        ]);
    }

    public function happyStoriesChart(Request $request)
    {
        $data = $this->index($request)->getData(true);

        return response()->json([
            'result' => true,
            'data' => [
                'total' => $data['data']['happy_stories']['total'] ?? 0,
                'approved' => $data['data']['happy_stories']['approved'] ?? 0,
                'pending' => $data['data']['happy_stories']['pending'] ?? 0,
            ],
        ]);
    }

    public function happyStories(Request $request)
    {
        $data = $this->index($request)->getData(true);

        return response()->json([
            'result' => true,
            'data' => $data['data']['happy_stories']['recent'] ?? [],
        ]);
    }
}
