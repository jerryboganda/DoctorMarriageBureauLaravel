@extends('admin.layouts.app')
@section('content')
<div class="aiz-titlebar text-left mt-2 mb-3">
    <div class="row align-items-center">
        <div class="col-md-6">
            <h1 class="h3">{{ translate('Profile Completion Reminders') }}</h1>
        </div>
        <div class="col-md-6 text-right">
            <form action="{{ route('admin.profile_completion_reminders.send_now') }}" method="POST" class="d-inline">
                @csrf
                <button type="submit" class="btn btn-success" onclick="return confirm('This will send reminders to all eligible members now. Continue?')">
                    <i class="las la-paper-plane"></i> {{ translate('Send Now') }}
                </button>
            </form>
        </div>
    </div>
</div>

<!-- Stats Cards -->
<div class="row gutters-10 mb-4">
    <div class="col-md-3">
        <div class="card bg-grad-1">
            <div class="card-body text-center text-white">
                <h2 class="mb-1">{{ $stats['total_sent'] }}</h2>
                <p class="mb-0">{{ translate('Total Emails Sent') }}</p>
            </div>
        </div>
    </div>
    <div class="col-md-3">
        <div class="card bg-grad-2">
            <div class="card-body text-center text-white">
                <h2 class="mb-1">{{ $stats['sent_today'] }}</h2>
                <p class="mb-0">{{ translate('Sent Today') }}</p>
            </div>
        </div>
    </div>
    <div class="col-md-3">
        <div class="card bg-grad-3">
            <div class="card-body text-center text-white">
                <h2 class="mb-1">{{ $stats['unique_users_reminded'] }}</h2>
                <p class="mb-0">{{ translate('Unique Members Reminded') }}</p>
            </div>
        </div>
    </div>
    <div class="col-md-3">
        <div class="card bg-grad-4">
            <div class="card-body text-center text-white">
                <h2 class="mb-1">{{ $stats['total_failed'] }}</h2>
                <p class="mb-0">{{ translate('Failed Emails') }}</p>
            </div>
        </div>
    </div>
</div>

<!-- Settings Form -->
<form action="{{ route('admin.profile_completion_reminders.update') }}" method="POST">
    @csrf

    <div class="card">
        <div class="card-header">
            <h5 class="mb-0 h6"><i class="las la-cog"></i> {{ translate('Reminder Settings') }}</h5>
        </div>
        <div class="card-body">
            <div class="form-group row">
                <label class="col-md-3 col-form-label">{{ translate('Enable Reminders') }}</label>
                <div class="col-md-9">
                    <label class="aiz-switch aiz-switch-success mb-0">
                        <input type="hidden" name="is_enabled" value="0">
                        <input type="checkbox" name="is_enabled" value="1" {{ $settings->is_enabled ? 'checked' : '' }}>
                        <span class="slider round"></span>
                    </label>
                    <small class="text-muted d-block mt-1">{{ translate('When enabled, the system automatically sends profile completion reminder emails.') }}</small>
                </div>
            </div>

            <div class="form-group row">
                <label class="col-md-3 col-form-label">{{ translate('Threshold Percentage') }}</label>
                <div class="col-md-9">
                    <div class="input-group">
                        <input type="number" name="threshold_percent" class="form-control" value="{{ $settings->threshold_percent }}" min="10" max="100" required>
                        <div class="input-group-append">
                            <span class="input-group-text">%</span>
                        </div>
                    </div>
                    <small class="text-muted d-block mt-1">{{ translate('Members with profile completion below this percentage will receive reminders. (e.g., 80 means members below 80% will get emails)') }}</small>
                </div>
            </div>

            <div class="form-group row">
                <label class="col-md-3 col-form-label">{{ translate('Interval Between Emails') }}</label>
                <div class="col-md-9">
                    <div class="input-group">
                        <input type="number" name="interval_days" class="form-control" value="{{ $settings->interval_days }}" min="1" max="90" required>
                        <div class="input-group-append">
                            <span class="input-group-text">{{ translate('days') }}</span>
                        </div>
                    </div>
                    <small class="text-muted d-block mt-1">{{ translate('Minimum number of days between consecutive reminder emails to the same member.') }}</small>
                </div>
            </div>

            <div class="form-group row">
                <label class="col-md-3 col-form-label">{{ translate('Max Reminders Per Member') }}</label>
                <div class="col-md-9">
                    <input type="number" name="max_reminders" class="form-control" value="{{ $settings->max_reminders }}" min="1" max="100" required>
                    <small class="text-muted d-block mt-1">{{ translate('Maximum number of reminder emails a single member can receive in total. After this, no more reminders will be sent.') }}</small>
                </div>
            </div>

            <div class="form-group row">
                <label class="col-md-3 col-form-label">{{ translate('Email Subject') }}</label>
                <div class="col-md-9">
                    <input type="text" name="email_subject" class="form-control" value="{{ $settings->email_subject }}" required maxlength="255">
                </div>
            </div>

            <div class="form-group row">
                <label class="col-md-3 col-form-label">{{ translate('Email Body (HTML)') }}</label>
                <div class="col-md-9">
                    <textarea name="email_body" class="form-control" rows="12" maxlength="10000" placeholder="{{ translate('Leave empty to use default template...') }}">{{ $settings->email_body }}</textarea>
                    <small class="text-muted d-block mt-1">
                        {{ translate('Available placeholders:') }}
                        <code>{name}</code> — {{ translate('Member name') }},
                        <code>{percentage}</code> — {{ translate('Current profile completion (e.g. 45%)') }},
                        <code>{link}</code> — {{ translate('Profile completion button/link') }}.
                        {{ translate('Leave empty to use the built-in professional template.') }}
                    </small>
                </div>
            </div>
        </div>
        <div class="card-footer text-right">
            <button type="submit" class="btn btn-primary">
                <i class="las la-save"></i> {{ translate('Save Settings') }}
            </button>
        </div>
    </div>
</form>

<!-- Reminder Logs -->
<div class="card">
    <div class="card-header">
        <div class="row align-items-center">
            <div class="col-md-6">
                <h5 class="mb-0 h6"><i class="las la-history"></i> {{ translate('Reminder Logs') }}</h5>
            </div>
            <div class="col-md-6 text-right">
                @if($logs->total() > 0)
                <form action="{{ route('admin.profile_completion_reminders.clear_logs') }}" method="POST" class="d-inline">
                    @csrf
                    <button type="submit" class="btn btn-sm btn-soft-danger" onclick="return confirm('Are you sure you want to clear all logs?')">
                        <i class="las la-trash"></i> {{ translate('Clear All Logs') }}
                    </button>
                </form>
                @endif
            </div>
        </div>
    </div>
    <div class="card-body">
        <table class="table aiz-table mb-0">
            <thead>
                <tr>
                    <th>#</th>
                    <th>{{ translate('Member') }}</th>
                    <th>{{ translate('Email') }}</th>
                    <th>{{ translate('Profile %') }}</th>
                    <th>{{ translate('Status') }}</th>
                    <th>{{ translate('Sent At') }}</th>
                    <th>{{ translate('Error') }}</th>
                </tr>
            </thead>
            <tbody>
                @forelse($logs as $log)
                <tr>
                    <td>{{ $log->id }}</td>
                    <td>
                        @if($log->user)
                            {{ $log->user->first_name }} {{ $log->user->last_name }}
                            <br><small class="text-muted">ID: {{ $log->user_id }}</small>
                        @else
                            <span class="text-muted">{{ translate('User Deleted') }}</span>
                        @endif
                    </td>
                    <td>{{ $log->user->email ?? '—' }}</td>
                    <td>
                        <span class="badge {{ $log->profile_percentage < 50 ? 'badge-danger' : ($log->profile_percentage < 80 ? 'badge-warning' : 'badge-success') }}">
                            {{ $log->profile_percentage }}%
                        </span>
                    </td>
                    <td>
                        @if($log->status === 'sent')
                            <span class="badge badge-success">{{ translate('Sent') }}</span>
                        @else
                            <span class="badge badge-danger">{{ translate('Failed') }}</span>
                        @endif
                    </td>
                    <td>{{ $log->sent_at ? $log->sent_at->format('d M Y, h:i A') : '—' }}</td>
                    <td>
                        @if($log->error_message)
                            <span class="text-danger" title="{{ $log->error_message }}">{{ \Illuminate\Support\Str::limit($log->error_message, 40) }}</span>
                        @else
                            —
                        @endif
                    </td>
                </tr>
                @empty
                <tr>
                    <td colspan="7" class="text-center text-muted py-4">
                        <i class="las la-inbox" style="font-size: 40px;"></i>
                        <p class="mb-0 mt-2">{{ translate('No reminder logs yet. Click "Send Now" to manually trigger reminders, or wait for the automated schedule.') }}</p>
                    </td>
                </tr>
                @endforelse
            </tbody>
        </table>
        <div class="aiz-pagination mt-3">
            {{ $logs->links() }}
        </div>
    </div>
</div>

@endsection
