@extends('admin.layouts.app')
@section('content')
<div class="aiz-titlebar text-left mt-2 mb-3">
    <div class="row align-items-center">
        <div class="col-md-6">
            <h1 class="h3">{{ translate('Referral System Dashboard') }}</h1>
        </div>
        <div class="col-md-6 text-right">
            <span class="badge badge-{{ $settings->referral_enabled ? 'success' : 'danger' }} p-2">
                <i class="las la-{{ $settings->referral_enabled ? 'check-circle' : 'times-circle' }}"></i>
                {{ $settings->referral_enabled ? translate('System Active') : translate('System Disabled') }}
            </span>
        </div>
    </div>
</div>

<!-- Stats Cards -->
<div class="row gutters-5">
    <div class="col-md-3 mb-3">
        <div class="bg-grad-1 text-white rounded-lg overflow-hidden">
            <div class="px-3 pt-3">
                <div class="opacity-50">
                    <span class="fs-12 d-block">{{ translate('Total Referrals') }}</span>
                </div>
                <div class="h4 fw-700 mb-3">{{ $analytics['total_referrals'] }}</div>
            </div>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 120"><path opacity="0.2" fill="#fff" d="M0,64L60,58.7C120,53,240,43,360,48C480,53,600,75,720,80C840,85,960,75,1080,64C1200,53,1320,43,1380,37.3L1440,32L1440,120L1380,120C1320,120,1200,120,1080,120C960,120,840,120,720,120C600,120,480,120,360,120C240,120,120,120,60,120L0,120Z"></path></svg>
        </div>
    </div>
    <div class="col-md-3 mb-3">
        <div class="bg-grad-2 text-white rounded-lg overflow-hidden">
            <div class="px-3 pt-3">
                <div class="opacity-50">
                    <span class="fs-12 d-block">{{ translate('Qualified Referrals') }}</span>
                </div>
                <div class="h4 fw-700 mb-3">{{ $analytics['qualified_referrals'] }}</div>
            </div>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 120"><path opacity="0.2" fill="#fff" d="M0,64L60,58.7C120,53,240,43,360,48C480,53,600,75,720,80C840,85,960,75,1080,64C1200,53,1320,43,1380,37.3L1440,32L1440,120L1380,120C1320,120,1200,120,1080,120C960,120,840,120,720,120C600,120,480,120,360,120C240,120,120,120,60,120L0,120Z"></path></svg>
        </div>
    </div>
    <div class="col-md-3 mb-3">
        <div class="bg-grad-3 text-white rounded-lg overflow-hidden">
            <div class="px-3 pt-3">
                <div class="opacity-50">
                    <span class="fs-12 d-block">{{ translate('Rewards Applied') }}</span>
                </div>
                <div class="h4 fw-700 mb-3">{{ $analytics['total_rewards'] }}</div>
            </div>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 120"><path opacity="0.2" fill="#fff" d="M0,64L60,58.7C120,53,240,43,360,48C480,53,600,75,720,80C840,85,960,75,1080,64C1200,53,1320,43,1380,37.3L1440,32L1440,120L1380,120C1320,120,1200,120,1080,120C960,120,840,120,720,120C600,120,480,120,360,120C240,120,120,120,60,120L0,120Z"></path></svg>
        </div>
    </div>
    <div class="col-md-3 mb-3">
        <div class="bg-grad-4 text-white rounded-lg overflow-hidden">
            <div class="px-3 pt-3">
                <div class="opacity-50">
                    <span class="fs-12 d-block">{{ translate('Qualification Rate') }}</span>
                </div>
                <div class="h4 fw-700 mb-3">{{ $analytics['qualification_rate'] }}%</div>
            </div>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 120"><path opacity="0.2" fill="#fff" d="M0,64L60,58.7C120,53,240,43,360,48C480,53,600,75,720,80C840,85,960,75,1080,64C1200,53,1320,43,1380,37.3L1440,32L1440,120L1380,120C1320,120,1200,120,1080,120C960,120,840,120,720,120C600,120,480,120,360,120C240,120,120,120,60,120L0,120Z"></path></svg>
        </div>
    </div>
</div>

<!-- Period Stats -->
<div class="row gutters-5 mb-3">
    <div class="col-md-6">
        <div class="card">
            <div class="card-header">
                <h5 class="mb-0 h6">{{ translate('Last 30 Days') }}</h5>
            </div>
            <div class="card-body">
                <div class="row">
                    <div class="col-6">
                        <div class="text-center">
                            <div class="h3 fw-700 text-primary">{{ $analytics['referrals_period'] }}</div>
                            <div class="fs-12 text-muted">{{ translate('New Referrals') }}</div>
                        </div>
                    </div>
                    <div class="col-6">
                        <div class="text-center">
                            <div class="h3 fw-700 text-success">{{ $analytics['rewards_period'] }}</div>
                            <div class="fs-12 text-muted">{{ translate('Rewards Issued') }}</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <div class="col-md-6">
        <div class="card">
            <div class="card-header">
                <h5 class="mb-0 h6">{{ translate('Pending Actions') }}</h5>
            </div>
            <div class="card-body">
                <div class="row">
                    <div class="col-6">
                        <div class="text-center">
                            <div class="h3 fw-700 text-warning">{{ $analytics['pending_referrals'] }}</div>
                            <div class="fs-12 text-muted">{{ translate('Pending Referrals') }}</div>
                        </div>
                    </div>
                    <div class="col-6">
                        <div class="text-center">
                            <div class="h3 fw-700 text-danger">{{ $analytics['invalid_referrals'] }}</div>
                            <div class="fs-12 text-muted">{{ translate('Invalid Referrals') }}</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<!-- Top Referrers -->
<div class="row">
    <div class="col-md-7">
        <div class="card">
            <div class="card-header">
                <h5 class="mb-0 h6">{{ translate('Top Referrers') }}</h5>
            </div>
            <div class="card-body">
                <table class="table aiz-table mb-0">
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>{{ translate('Name') }}</th>
                            <th>{{ translate('Email') }}</th>
                            <th>{{ translate('Total') }}</th>
                            <th>{{ translate('Qualified') }}</th>
                        </tr>
                    </thead>
                    <tbody>
                        @forelse($analytics['top_referrers'] as $i => $referrer)
                        <tr>
                            <td>{{ $i + 1 }}</td>
                            <td>{{ $referrer['name'] }}</td>
                            <td>{{ $referrer['email'] }}</td>
                            <td><span class="badge badge-info">{{ $referrer['total_referrals'] }}</span></td>
                            <td><span class="badge badge-success">{{ $referrer['qualified_referrals'] }}</span></td>
                        </tr>
                        @empty
                        <tr>
                            <td colspan="5" class="text-center">{{ translate('No referrals yet') }}</td>
                        </tr>
                        @endforelse
                    </tbody>
                </table>
            </div>
        </div>
    </div>
    <div class="col-md-5">
        <div class="card">
            <div class="card-header">
                <h5 class="mb-0 h6">{{ translate('Recent Referrals') }}</h5>
            </div>
            <div class="card-body">
                @forelse($recentReferrals as $ref)
                <div class="d-flex align-items-center mb-2 pb-2 border-bottom">
                    <div class="flex-grow-1">
                        <div class="fs-13 fw-600">
                            {{ $ref->referred ? $ref->referred->first_name . ' ' . $ref->referred->last_name : 'N/A' }}
                        </div>
                        <div class="fs-11 text-muted">
                            {{ translate('Referred by') }}: {{ $ref->referrer ? $ref->referrer->first_name : 'N/A' }}
                        </div>
                    </div>
                    <div>
                        @if($ref->status == 'pending')
                            <span class="badge badge-warning">{{ translate('Pending') }}</span>
                        @elseif($ref->status == 'qualified')
                            <span class="badge badge-success">{{ translate('Qualified') }}</span>
                        @elseif($ref->status == 'invalid')
                            <span class="badge badge-danger">{{ translate('Invalid') }}</span>
                        @else
                            <span class="badge badge-secondary">{{ $ref->status }}</span>
                        @endif
                    </div>
                </div>
                @empty
                <div class="text-center text-muted py-3">{{ translate('No referrals yet') }}</div>
                @endforelse
            </div>
        </div>
    </div>
</div>
@endsection
