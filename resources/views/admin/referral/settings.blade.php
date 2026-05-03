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

    <!-- Referral Popup Settings -->
    <div class="card">
        <div class="card-header">
            <h5 class="mb-0 h6"><i class="las la-window-maximize"></i> {{ translate('Referral Popup Settings') }}</h5>
        </div>
        <div class="card-body">
            <div class="alert alert-info mb-4">
                <i class="las la-info-circle mr-1"></i>
                {{ translate('This popup is shown to FREE plan users when they log in, encouraging them to join the referral program and earn premium benefits.') }}
            </div>

            <div class="form-group row">
                <label class="col-md-3 col-form-label">{{ translate('Enable Popup') }}</label>
                <div class="col-md-9">
                    <label class="aiz-switch aiz-switch-success mb-0">
                        <input type="hidden" name="popup_enabled" value="0">
                        <input type="checkbox" name="popup_enabled" value="1" {{ $settings->popup_enabled ? 'checked' : '' }}>
                        <span class="slider round"></span>
                    </label>
                    <small class="text-muted d-block mt-1">{{ translate('When enabled, free plan users will see the referral popup after logging in') }}</small>
                </div>
            </div>
            <div class="form-group row">
                <label class="col-md-3 col-form-label">{{ translate('Popup Headline') }}</label>
                <div class="col-md-9">
                    <input type="text" name="popup_headline" class="form-control" value="{{ $settings->popup_headline ?? 'Join Our Referral Program!' }}" maxlength="255" placeholder="{{ translate('e.g. Join Our Referral Program!') }}">
                    <small class="text-muted">{{ translate('Main title displayed at the top of the popup') }}</small>
                </div>
            </div>
            <div class="form-group row">
                <label class="col-md-3 col-form-label">{{ translate('Popup Body Text') }}</label>
                <div class="col-md-9">
                    <textarea name="popup_body" class="form-control" rows="4" maxlength="2000" placeholder="{{ translate('Describe the referral offer...') }}">{{ $settings->popup_body ?? '' }}</textarea>
                    <small class="text-muted">{{ translate('Describe the offer and benefits. This text appears in the popup body.') }}</small>
                </div>
            </div>
            <div class="form-group row">
                <label class="col-md-3 col-form-label">{{ translate('CTA Button Text') }}</label>
                <div class="col-md-9">
                    <input type="text" name="popup_cta_text" class="form-control" value="{{ $settings->popup_cta_text ?? 'Start Referring Now' }}" maxlength="100" placeholder="{{ translate('e.g. Start Referring Now') }}">
                    <small class="text-muted">{{ translate('Text shown on the main action button') }}</small>
                </div>
            </div>
            <div class="form-group row">
                <label class="col-md-3 col-form-label">{{ translate('Bonus Duration (Days)') }}</label>
                <div class="col-md-9">
                    <select name="popup_bonus_days" class="form-control aiz-selectpicker">
                        <option value="7" {{ ($settings->popup_bonus_days ?? 30) == 7 ? 'selected' : '' }}>7 {{ translate('days') }}</option>
                        <option value="14" {{ ($settings->popup_bonus_days ?? 30) == 14 ? 'selected' : '' }}>14 {{ translate('days') }}</option>
                        <option value="30" {{ ($settings->popup_bonus_days ?? 30) == 30 ? 'selected' : '' }}>30 {{ translate('days') }}</option>
                        <option value="60" {{ ($settings->popup_bonus_days ?? 30) == 60 ? 'selected' : '' }}>60 {{ translate('days') }}</option>
                        <option value="90" {{ ($settings->popup_bonus_days ?? 30) == 90 ? 'selected' : '' }}>90 {{ translate('days') }}</option>
                        <option value="180" {{ ($settings->popup_bonus_days ?? 30) == 180 ? 'selected' : '' }}>180 {{ translate('days') }}</option>
                        <option value="365" {{ ($settings->popup_bonus_days ?? 30) == 365 ? 'selected' : '' }}>365 {{ translate('days') }}</option>
                    </select>
                    <small class="text-muted">{{ translate('This value is displayed in the popup to tell users how many days of premium they will earn. The actual reward is managed by the Referral Rules.') }}</small>
                </div>
            </div>
            <div class="form-group row">
                <label class="col-md-3 col-form-label">{{ translate('Show Frequency') }}</label>
                <div class="col-md-9">
                    <select name="popup_show_frequency" class="form-control aiz-selectpicker">
                        <option value="every_login" {{ ($settings->popup_show_frequency ?? 'once_per_session') == 'every_login' ? 'selected' : '' }}>{{ translate('Every Login') }}</option>
                        <option value="once_per_session" {{ ($settings->popup_show_frequency ?? 'once_per_session') == 'once_per_session' ? 'selected' : '' }}>{{ translate('Once Per Session') }}</option>
                        <option value="once_per_day" {{ ($settings->popup_show_frequency ?? 'once_per_session') == 'once_per_day' ? 'selected' : '' }}>{{ translate('Once Per Day') }}</option>
                        <option value="once_ever" {{ ($settings->popup_show_frequency ?? 'once_per_session') == 'once_ever' ? 'selected' : '' }}>{{ translate('Once Ever (never again after dismissed)') }}</option>
                    </select>
                    <small class="text-muted">{{ translate('How often the popup should appear to free plan users') }}</small>
                </div>
            </div>
            <div class="form-group row">
                <label class="col-md-3 col-form-label">{{ translate('Delay Before Showing (seconds)') }}</label>
                <div class="col-md-9">
                    <input type="number" name="popup_delay_seconds" class="form-control" value="{{ $settings->popup_delay_seconds ?? 2 }}" min="0" max="60">
                    <small class="text-muted">{{ translate('Number of seconds to wait after page loads before showing the popup') }}</small>
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
