@extends('admin.layouts.app')
@section('content')
<div class="aiz-titlebar text-left mt-2 mb-3">
    <div class="row align-items-center">
        <div class="col-md-6">
            <h1 class="h3">{{ translate('Referral Settings') }}</h1>
        </div>
        <div class="col-md-6 text-right">
            <a href="{{ route('admin.referral.dashboard') }}" class="btn btn-soft-primary">
                <i class="las la-arrow-left"></i> {{ translate('Back to Dashboard') }}
            </a>
        </div>
    </div>
</div>

<form action="{{ route('admin.referral.settings.update') }}" method="POST">
    @csrf

    <!-- General Settings -->
    <div class="card">
        <div class="card-header">
            <h5 class="mb-0 h6"><i class="las la-cog"></i> {{ translate('General Settings') }}</h5>
        </div>
        <div class="card-body">
            <div class="form-group row">
                <label class="col-md-3 col-form-label">{{ translate('Enable Referral System') }}</label>
                <div class="col-md-9">
                    <label class="aiz-switch aiz-switch-success mb-0">
                        <input type="hidden" name="referral_enabled" value="0">
                        <input type="checkbox" name="referral_enabled" value="1" {{ $settings->referral_enabled ? 'checked' : '' }}>
                        <span class="slider round"></span>
                    </label>
                </div>
            </div>
            <div class="form-group row">
                <label class="col-md-3 col-form-label">{{ translate('Referral Code Format') }}</label>
                <div class="col-md-9">
                    <select name="code_format" class="form-control aiz-selectpicker">
                        <option value="alphanumeric_6" {{ $settings->code_format == 'alphanumeric_6' ? 'selected' : '' }}>{{ translate('Alphanumeric 6 chars') }}</option>
                        <option value="alphanumeric_8" {{ $settings->code_format == 'alphanumeric_8' ? 'selected' : '' }}>{{ translate('Alphanumeric 8 chars') }}</option>
                        <option value="alphanumeric_10" {{ $settings->code_format == 'alphanumeric_10' ? 'selected' : '' }}>{{ translate('Alphanumeric 10 chars') }}</option>
                        <option value="numeric_8" {{ $settings->code_format == 'numeric_8' ? 'selected' : '' }}>{{ translate('Numeric 8 digits') }}</option>
                    </select>
                </div>
            </div>
            <div class="form-group row">
                <label class="col-md-3 col-form-label">{{ translate('Allow Code Regeneration') }}</label>
                <div class="col-md-9">
                    <label class="aiz-switch aiz-switch-success mb-0">
                        <input type="hidden" name="allow_code_regeneration" value="0">
                        <input type="checkbox" name="allow_code_regeneration" value="1" {{ $settings->allow_code_regeneration ? 'checked' : '' }}>
                        <span class="slider round"></span>
                    </label>
                    <small class="text-muted d-block mt-1">{{ translate('Allow users to regenerate their referral code (only if unused)') }}</small>
                </div>
            </div>
            <div class="form-group row">
                <label class="col-md-3 col-form-label">{{ translate('Allow Post-Signup Apply') }}</label>
                <div class="col-md-9">
                    <label class="aiz-switch aiz-switch-success mb-0">
                        <input type="hidden" name="allow_post_signup_apply" value="0">
                        <input type="checkbox" name="allow_post_signup_apply" value="1" {{ $settings->allow_post_signup_apply ? 'checked' : '' }}>
                        <span class="slider round"></span>
                    </label>
                    <small class="text-muted d-block mt-1">{{ translate('Allow users to enter a referral code after registration') }}</small>
                </div>
            </div>
            <div class="form-group row">
                <label class="col-md-3 col-form-label">{{ translate('Default Active Rule') }}</label>
                <div class="col-md-9">
                    <select name="default_rule_id" class="form-control aiz-selectpicker">
                        <option value="">{{ translate('None') }}</option>
                        @foreach($rules as $rule)
                            <option value="{{ $rule->id }}" {{ $settings->default_rule_id == $rule->id ? 'selected' : '' }}>
                                {{ $rule->name }} ({{ $rule->trigger_threshold }} {{ translate('referrals') }})
                            </option>
                        @endforeach
                    </select>
                </div>
            </div>
        </div>
    </div>

    <!-- Anti-Fraud Settings -->
    <div class="card">
        <div class="card-header">
            <h5 class="mb-0 h6"><i class="las la-shield-alt"></i> {{ translate('Anti-Fraud Settings') }}</h5>
        </div>
        <div class="card-body">
            @php $af = $settings->anti_fraud_settings ?? []; @endphp
            <div class="form-group row">
                <label class="col-md-3 col-form-label">{{ translate('Max Referrals Per IP Per Day') }}</label>
                <div class="col-md-9">
                    <input type="number" name="max_referrals_per_ip_per_day" class="form-control" value="{{ $af['max_referrals_per_ip_per_day'] ?? 5 }}" min="1" max="100">
                </div>
            </div>
            <div class="form-group row">
                <label class="col-md-3 col-form-label">{{ translate('Max Referrals Per Device Per Day') }}</label>
                <div class="col-md-9">
                    <input type="number" name="max_referrals_per_device_per_day" class="form-control" value="{{ $af['max_referrals_per_device_per_day'] ?? 5 }}" min="1" max="100">
                </div>
            </div>
            <div class="form-group row">
                <label class="col-md-3 col-form-label">{{ translate('Cooldown Between Referrals (minutes)') }}</label>
                <div class="col-md-9">
                    <input type="number" name="cooldown_minutes" class="form-control" value="{{ $af['cooldown_minutes'] ?? 10 }}" min="0" max="1440">
                    <small class="text-muted">{{ translate('Minimum time between two referrals for the same referrer') }}</small>
                </div>
            </div>
            <div class="form-group row">
                <label class="col-md-3 col-form-label">{{ translate('Block Same Email Domain') }}</label>
                <div class="col-md-9">
                    <label class="aiz-switch aiz-switch-success mb-0">
                        <input type="hidden" name="block_same_email_domain" value="0">
                        <input type="checkbox" name="block_same_email_domain" value="1" {{ ($af['block_same_email_domain'] ?? false) ? 'checked' : '' }}>
                        <span class="slider round"></span>
                    </label>
                    <small class="text-muted d-block mt-1">{{ translate('Block referrals between users with same custom email domain (common providers excluded)') }}</small>
                </div>
            </div>
        </div>
    </div>

    <div class="text-right mb-3">
        <button type="submit" class="btn btn-primary">
            <i class="las la-save"></i> {{ translate('Save Settings') }}
        </button>
    </div>
</form>

<!-- Backfill Section -->
<div class="card">
    <div class="card-header">
        <h5 class="mb-0 h6"><i class="las la-sync"></i> {{ translate('Maintenance') }}</h5>
    </div>
    <div class="card-body">
        <p>{{ translate('Generate referral codes for all existing users who do not have one yet.') }}</p>
        <form action="{{ route('admin.referral.backfill') }}" method="POST" class="d-inline">
            @csrf
            <button type="submit" class="btn btn-warning" onclick="return confirm('{{ translate('Are you sure? This will generate referral codes for all existing users.') }}')">
                <i class="las la-magic"></i> {{ translate('Backfill Referral Codes') }}
            </button>
        </form>
    </div>
</div>
@endsection
