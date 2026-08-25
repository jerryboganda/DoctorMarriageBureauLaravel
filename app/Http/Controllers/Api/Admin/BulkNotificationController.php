<?php

namespace App\Http\Controllers\Api\Admin;

use App\Models\City;
use App\Models\State;
use App\Models\User;
use App\Notifications\DbStoreNotification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Notification;

class BulkNotificationController extends BaseAdminController
{
    public function index(Request $request)
    {
        return $this->ok([
            'total_members' => User::where('user_type', 'member')->count(),
            'states' => State::orderBy('name')->get(['id', 'name']),
        ]);
    }

    public function previewCount(Request $request)
    {
        $query = $this->filteredMembers($request);

        return $this->ok(['count' => $query->count()]);
    }

    public function send(Request $request)
    {
        $title = (string) $request->get('title', 'Admin Notification');
        $message = (string) $request->get('message', '');

        $sentCount = 0;
        $this->filteredMembers($request)
            ->select('id')
            ->chunkById(200, function ($users) use (&$sentCount, $request, $title, $message) {
                Notification::send(
                    $users,
                    new DbStoreNotification(
                        'bulk_notification',
                        null,
                        optional($request->user())->id,
                        null,
                        $message,
                        null,
                        $title
                    )
                );

                $sentCount += $users->count();
            });

        return $this->ok(['sent_count' => $sentCount], 'Notifications sent successfully');
    }

    public function getStates(Request $request)
    {
        $states = State::query()
            ->when($request->filled('country_id'), function ($q) use ($request) {
                $q->where('country_id', $request->country_id);
            })
            ->orderBy('name')
            ->get(['id', 'name', 'country_id']);

        return $this->ok($states);
    }

    public function getCities(Request $request)
    {
        $cities = City::query()
            ->when($request->filled('state_id'), function ($q) use ($request) {
                $q->where('state_id', $request->state_id);
            })
            ->orderBy('name')
            ->get(['id', 'name', 'state_id']);

        return $this->ok($cities);
    }

    private function filteredMembers(Request $request)
    {
        $query = User::query()->where('user_type', 'member');

        if ($request->filled('gender')) {
            $query->whereIn('id', function ($q) use ($request) {
                $q->select('user_id')->from('members')->where('gender', $request->gender);
            });
        }
        if ($request->filled('membership')) {
            $query->where('membership', $request->membership);
        }
        if ($request->filled('state_id')) {
            $query->whereIn('id', function ($q) use ($request) {
                $q->select('user_id')->from('addresses')->where('state_id', $request->state_id);
            });
        }
        if ($request->filled('city_id')) {
            $query->whereIn('id', function ($q) use ($request) {
                $q->select('user_id')->from('addresses')->where('city_id', $request->city_id);
            });
        }

        return $query;
    }
}
