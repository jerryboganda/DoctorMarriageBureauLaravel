@extends('admin.layouts.app')
@section('content')
<div class="aiz-titlebar text-left mt-2 mb-3">
    <div class="row align-items-center">
        <div class="col-md-6">
            <h1 class="h3">{{ translate('Referral Rewards / Upgrades Ledger') }}</h1>
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
                <select name="status" class="form-control aiz-selectpicker" onchange="this.form.submit()">
                    <option value="">{{ translate('All Statuses') }}</option>
                    <option value="pending" {{ request('status') == 'pending' ? 'selected' : '' }}>{{ translate('Pending') }}</option>
                    <option value="applied" {{ request('status') == 'applied' ? 'selected' : '' }}>{{ translate('Applied') }}</option>
                    <option value="reversed" {{ request('status') == 'reversed' ? 'selected' : '' }}>{{ translate('Reversed') }}</option>
                    <option value="failed" {{ request('status') == 'failed' ? 'selected' : '' }}>{{ translate('Failed') }}</option>
                </select>
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
                    <th>{{ translate('User') }}</th>
                    <th>{{ translate('Rule') }}</th>
                    <th>{{ translate('Reward Type') }}</th>
                    <th>{{ translate('Details') }}</th>
                    <th>{{ translate('Status') }}</th>
                    <th>{{ translate('Idempotency Key') }}</th>
                    <th>{{ translate('Applied At') }}</th>
                    <th class="text-right">{{ translate('Actions') }}</th>
                </tr>
            </thead>
            <tbody>
                @forelse($rewards as $reward)
                <tr>
                    <td>{{ $reward->id }}</td>
                    <td>
                        @if($reward->user)
                            <strong>{{ $reward->user->first_name }} {{ $reward->user->last_name }}</strong>
                            <br><small class="text-muted">{{ $reward->user->email }}</small>
                        @endif
                    </td>
                    <td>
                        @if($reward->rule)
                            {{ $reward->rule->name }}
                        @else
                            <span class="text-muted">{{ translate('Deleted rule') }}</span>
                        @endif
                    </td>
                    <td><span class="badge badge-info">{{ str_replace('_', ' ', ucfirst($reward->reward_type)) }}</span></td>
                    <td>
                        @if($reward->reward_payload)
                            @php $payload = $reward->reward_payload; @endphp
                            @if(isset($payload['target_package_id']))
                                @php $pkg = \App\Models\Package::find($payload['target_package_id']); @endphp
                                {{ translate('Package') }}: {{ $pkg ? $pkg->name : 'N/A' }}
                                <br><small>{{ $payload['upgrade_duration_days'] ?? 0 }} {{ translate('days') }}</small>
                            @endif
                            @if(isset($payload['previous_package_id']))
                                <br><small class="text-muted">{{ translate('From') }}: Package #{{ $payload['previous_package_id'] }}</small>
                            @endif
                        @endif
                    </td>
                    <td>
                        @if($reward->status == 'pending')
                            <span class="badge badge-warning">{{ translate('Pending') }}</span>
                        @elseif($reward->status == 'applied')
                            <span class="badge badge-success">{{ translate('Applied') }}</span>
                        @elseif($reward->status == 'reversed')
                            <span class="badge badge-secondary">{{ translate('Reversed') }}</span>
                        @elseif($reward->status == 'failed')
                            <span class="badge badge-danger">{{ translate('Failed') }}</span>
                        @endif
                    </td>
                    <td><code class="fs-10">{{ $reward->idempotency_key }}</code></td>
                    <td>{{ $reward->applied_at ? $reward->applied_at->format('M d, Y H:i') : '-' }}</td>
                    <td class="text-right">
                        @if($reward->status == 'applied')
                        <form action="{{ route('admin.referral.rewards.reverse', $reward->id) }}" method="POST" class="d-inline">
                            @csrf
                            <input type="hidden" name="reason" value="Admin reversal">
                            <button type="submit" class="btn btn-soft-danger btn-icon btn-circle btn-sm"
                                    onclick="return confirm('{{ translate('Reverse this reward? This will downgrade the user package.') }}')"
                                    title="{{ translate('Reverse') }}">
                                <i class="las la-undo-alt"></i>
                            </button>
                        </form>
                        @endif
                        @if($reward->admin_notes)
                        <button class="btn btn-soft-info btn-icon btn-circle btn-sm"
                                onclick="alert('{{ addslashes($reward->admin_notes) }}')"
                                title="{{ translate('Notes') }}">
                            <i class="las la-sticky-note"></i>
                        </button>
                        @endif
                    </td>
                </tr>
                @empty
                <tr>
                    <td colspan="9" class="text-center">{{ translate('No rewards found') }}</td>
                </tr>
                @endforelse
            </tbody>
        </table>

        <div class="aiz-pagination mt-3">
            {{ $rewards->appends(request()->query())->links() }}
        </div>
    </div>
</div>
@endsection
