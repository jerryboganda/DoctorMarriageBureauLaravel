@if($notifications->count() > 0)
    @foreach ($notifications as $key => $notification)
        @php
            $user_data = '';
            $notify_data = is_array($notification->data)
                ? (object) $notification->data
                : (json_decode($notification->data ?? '{}') ?: (object) []);
            $link = env('APP_URL').($notify_data->url ?? '');
            $notify_type = $notify_data->type ?? null;
            $notify_info_id = $notify_data->info_id ?? null;
        @endphp
        @if($notify_type == 'express_interest' && $notify_info_id)
            @php
                $interest = \App\Models\ExpressInterest::where('id', $notify_info_id)->first();
                $userId = $interest ? $interest->interested_by : null;
                $user_data = $userId ? \App\Models\User::where('id', $userId)->first() : null;
            @endphp
        @elseif (($notify_type == 'accept_interest' || $notify_type == 'reject_interest') && $notify_info_id)
            @php
                $interest = \App\Models\ExpressInterest::where('id', $notify_info_id)->first();
                $userId = $interest ? $interest->user_id : null;
                $user_data = $userId ? \App\Models\User::where('id', $userId)->first() : null;
            @endphp
        @endif

        @if(!empty($user_data))
        <li class="list-group-item d-flex justify-content-between align-items-start hov-bg-soft-primary">
            <a href="#" class="media text-inherit">

                <span class="avatar avatar-sm mr-3">
                    <img src="{{ uploaded_asset($user_data->photo) }}">
                </span>
                <div class="media-body">
                    <p class="mb-1">{{ $user_data->first_name.' '.$user_data->last_name }}</p>
                    <small class="text-muted">
                        {{ $notify_data->message ?? '' }}
                    </small>
                </div>
            </a>
            <button class="btn p-0">
                <span class="badge badge-md  badge-dot badge-circle badge-primary"></span>
            </button>
        </li>
        @endif
    @endforeach
@else
    <li class="list-group-item">
        <div class="text-center">
            <i class="las la-frown la-4x mb-4 opacity-40"></i>
            <h4 class="h5">{{ translate('No Notifications') }}</h4>
        </div>
    </li>
@endif
