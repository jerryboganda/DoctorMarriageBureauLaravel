@extends('admin.layouts.app')
@section('content')
<div class="aiz-titlebar text-left mt-2 mb-3">
    <div class="row align-items-center">
        <div class="col-md-6">
            <h1 class="h3">{{ translate('Referral Audit Logs') }}</h1>
        </div>
        <div class="col-md-6 text-right">
            <a href="{{ route('admin.referral.dashboard') }}" class="btn btn-soft-primary btn-sm">
                <i class="las la-arrow-left"></i> {{ translate('Dashboard') }}
            </a>
        </div>
    </div>
</div>

<!-- Filters -->
<div class="card">
    <div class="card-body">
        <form method="GET" class="row">
            <div class="col-md-3">
                <select name="action" class="form-control aiz-selectpicker" onchange="this.form.submit()">
                    <option value="">{{ translate('All Actions') }}</option>
                    <option value="referral_created" {{ request('action') == 'referral_created' ? 'selected' : '' }}>{{ translate('Referral Created') }}</option>
                    <option value="referral_qualified" {{ request('action') == 'referral_qualified' ? 'selected' : '' }}>{{ translate('Referral Qualified') }}</option>
                    <option value="referral_invalidated" {{ request('action') == 'referral_invalidated' ? 'selected' : '' }}>{{ translate('Referral Invalidated') }}</option>
                    <option value="reward_applied" {{ request('action') == 'reward_applied' ? 'selected' : '' }}>{{ translate('Reward Applied') }}</option>
                    <option value="reward_reversed" {{ request('action') == 'reward_reversed' ? 'selected' : '' }}>{{ translate('Reward Reversed') }}</option>
                    <option value="code_generated" {{ request('action') == 'code_generated' ? 'selected' : '' }}>{{ translate('Code Generated') }}</option>
                    <option value="fraud_detected" {{ request('action') == 'fraud_detected' ? 'selected' : '' }}>{{ translate('Fraud Detected') }}</option>
                    <option value="settings_updated" {{ request('action') == 'settings_updated' ? 'selected' : '' }}>{{ translate('Settings Updated') }}</option>
                    <option value="rule_created" {{ request('action') == 'rule_created' ? 'selected' : '' }}>{{ translate('Rule Created') }}</option>
                    <option value="rule_updated" {{ request('action') == 'rule_updated' ? 'selected' : '' }}>{{ translate('Rule Updated') }}</option>
                    <option value="codes_backfilled" {{ request('action') == 'codes_backfilled' ? 'selected' : '' }}>{{ translate('Codes Backfilled') }}</option>
                </select>
            </div>
            <div class="col-md-3">
                <input type="text" name="search" class="form-control" placeholder="{{ translate('Search user name or email...') }}" value="{{ request('search') }}">
            </div>
            <div class="col-md-2">
                <button type="submit" class="btn btn-primary btn-block">{{ translate('Filter') }}</button>
            </div>
        </form>
    </div>
</div>

<div class="card">
    <div class="card-body">
        <table class="table aiz-table mb-0">
            <thead>
                <tr>
                    <th>#</th>
                    <th>{{ translate('Action') }}</th>
                    <th>{{ translate('User') }}</th>
                    <th>{{ translate('Description') }}</th>
                    <th>{{ translate('Metadata') }}</th>
                    <th>{{ translate('IP Address') }}</th>
                    <th>{{ translate('Date') }}</th>
                </tr>
            </thead>
            <tbody>
                @forelse($logs as $log)
                <tr>
                    <td>{{ $log->id }}</td>
                    <td>
                        @php
                            $actionColors = [
                                'referral_created' => 'primary',
                                'referral_qualified' => 'success',
                                'referral_invalidated' => 'danger',
                                'reward_applied' => 'success',
                                'reward_reversed' => 'warning',
                                'code_generated' => 'info',
                                'fraud_detected' => 'danger',
                                'settings_updated' => 'secondary',
                                'rule_created' => 'info',
                                'rule_updated' => 'info',
                                'codes_backfilled' => 'secondary',
                            ];
                            $color = $actionColors[$log->action] ?? 'secondary';
                        @endphp
                        <span class="badge badge-{{ $color }}">{{ str_replace('_', ' ', ucfirst($log->action)) }}</span>
                    </td>
                    <td>
                        @if($log->user)
                            <strong>{{ $log->user->first_name }} {{ $log->user->last_name }}</strong>
                            <br><small class="text-muted">{{ $log->user->email }}</small>
                        @else
                            <span class="text-muted">{{ translate('System') }}</span>
                        @endif
                    </td>
                    <td>{{ $log->description }}</td>
                    <td>
                        @if($log->metadata)
                            <button class="btn btn-soft-info btn-xs" onclick="showMetadata({{ $log->id }})">
                                <i class="las la-code"></i> {{ translate('View') }}
                            </button>
                            <div id="metadata-{{ $log->id }}" style="display:none;">
                                <pre class="mb-0 fs-10">{{ json_encode($log->metadata, JSON_PRETTY_PRINT) }}</pre>
                            </div>
                        @else
                            <span class="text-muted">-</span>
                        @endif
                    </td>
                    <td><small>{{ $log->ip_address ?? '-' }}</small></td>
                    <td>{{ $log->created_at->format('M d, Y H:i:s') }}</td>
                </tr>
                @empty
                <tr>
                    <td colspan="7" class="text-center">{{ translate('No audit logs found') }}</td>
                </tr>
                @endforelse
            </tbody>
        </table>

        <div class="aiz-pagination mt-3">
            {{ $logs->appends(request()->query())->links() }}
        </div>
    </div>
</div>
@endsection

@section('script')
<script type="text/javascript">
    function showMetadata(id) {
        var el = document.getElementById('metadata-' + id);
        if (el.style.display === 'none') {
            el.style.display = 'block';
        } else {
            el.style.display = 'none';
        }
    }
</script>
@endsection
