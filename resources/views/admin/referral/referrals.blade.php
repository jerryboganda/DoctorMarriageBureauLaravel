@extends('admin.layouts.app')
@section('content')
<div class="aiz-titlebar text-left mt-2 mb-3">
    <div class="row align-items-center">
        <div class="col-md-6">
            <h1 class="h3">{{ translate('All Referrals') }}</h1>
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
    <div class="card-header">
        <h5 class="mb-0 h6">{{ translate('Filter Referrals') }}</h5>
    </div>
    <div class="card-body">
        <form method="GET" action="{{ route('admin.referral.referrals') }}">
            <div class="row">
                <div class="col-md-3">
                    <div class="form-group">
                        <label>{{ translate('Status') }}</label>
                        <select name="status" class="form-control aiz-selectpicker">
                            <option value="">{{ translate('All') }}</option>
                            <option value="pending" {{ request('status') == 'pending' ? 'selected' : '' }}>{{ translate('Pending') }}</option>
                            <option value="qualified" {{ request('status') == 'qualified' ? 'selected' : '' }}>{{ translate('Qualified') }}</option>
                            <option value="invalid" {{ request('status') == 'invalid' ? 'selected' : '' }}>{{ translate('Invalid') }}</option>
                            <option value="reversed" {{ request('status') == 'reversed' ? 'selected' : '' }}>{{ translate('Reversed') }}</option>
                        </select>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="form-group">
                        <label>{{ translate('Search') }}</label>
                        <input type="text" name="search" class="form-control" value="{{ request('search') }}" placeholder="{{ translate('Name or email...') }}">
                    </div>
                </div>
                <div class="col-md-2">
                    <div class="form-group">
                        <label>{{ translate('From Date') }}</label>
                        <input type="date" name="date_from" class="form-control" value="{{ request('date_from') }}">
                    </div>
                </div>
                <div class="col-md-2">
                    <div class="form-group">
                        <label>{{ translate('To Date') }}</label>
                        <input type="date" name="date_to" class="form-control" value="{{ request('date_to') }}">
                    </div>
                </div>
                <div class="col-md-2">
                    <div class="form-group">
                        <label>&nbsp;</label>
                        <button type="submit" class="btn btn-primary btn-block">{{ translate('Filter') }}</button>
                    </div>
                </div>
            </div>
        </form>
    </div>
</div>

<!-- Referrals Table -->
<div class="card">
    <div class="card-body">
        <table class="table aiz-table mb-0">
            <thead>
                <tr>
                    <th>#</th>
                    <th>{{ translate('Referrer') }}</th>
                    <th>{{ translate('Referred User') }}</th>
                    <th>{{ translate('Code') }}</th>
                    <th>{{ translate('Source') }}</th>
                    <th>{{ translate('Status') }}</th>
                    <th>{{ translate('Created') }}</th>
                    <th>{{ translate('Qualified At') }}</th>
                    <th class="text-right">{{ translate('Actions') }}</th>
                </tr>
            </thead>
            <tbody>
                @forelse($referrals as $referral)
                <tr>
                    <td>{{ $referral->id }}</td>
                    <td>
                        @if($referral->referrer)
                            <strong>{{ $referral->referrer->first_name }} {{ $referral->referrer->last_name }}</strong>
                            <br><small class="text-muted">{{ $referral->referrer->email }}</small>
                        @else
                            <span class="text-muted">{{ translate('Deleted') }}</span>
                        @endif
                    </td>
                    <td>
                        @if($referral->referred)
                            <strong>{{ $referral->referred->first_name }} {{ $referral->referred->last_name }}</strong>
                            <br><small class="text-muted">{{ $referral->referred->email }}</small>
                        @else
                            <span class="text-muted">{{ translate('Deleted') }}</span>
                        @endif
                    </td>
                    <td>
                        @if($referral->referralCode)
                            <code>{{ $referral->referralCode->code }}</code>
                        @endif
                    </td>
                    <td><span class="badge badge-light">{{ ucfirst($referral->source) }}</span></td>
                    <td>
                        @if($referral->status == 'pending')
                            <span class="badge badge-warning">{{ translate('Pending') }}</span>
                        @elseif($referral->status == 'qualified')
                            <span class="badge badge-success">{{ translate('Qualified') }}</span>
                        @elseif($referral->status == 'invalid')
                            <span class="badge badge-danger">{{ translate('Invalid') }}</span>
                        @elseif($referral->status == 'reversed')
                            <span class="badge badge-secondary">{{ translate('Reversed') }}</span>
                        @endif
                    </td>
                    <td>{{ $referral->created_at->format('M d, Y H:i') }}</td>
                    <td>{{ $referral->qualified_at ? $referral->qualified_at->format('M d, Y H:i') : '-' }}</td>
                    <td class="text-right">
                        @if($referral->status == 'pending' || $referral->status == 'qualified')
                        <form action="{{ route('admin.referral.referrals.invalidate', $referral->id) }}" method="POST" class="d-inline">
                            @csrf
                            <input type="hidden" name="reason" value="Admin invalidation">
                            <button type="submit" class="btn btn-soft-danger btn-icon btn-circle btn-sm"
                                    onclick="return confirm('{{ translate('Invalidate this referral?') }}')"
                                    title="{{ translate('Invalidate') }}">
                                <i class="las la-ban"></i>
                            </button>
                        </form>
                        @endif
                    </td>
                </tr>
                @empty
                <tr>
                    <td colspan="9" class="text-center">{{ translate('No referrals found') }}</td>
                </tr>
                @endforelse
            </tbody>
        </table>

        <div class="aiz-pagination mt-3">
            {{ $referrals->appends(request()->query())->links() }}
        </div>
    </div>
</div>
@endsection
