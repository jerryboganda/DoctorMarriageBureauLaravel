@extends('admin.layouts.app')

@section('content')

<div class="aiz-titlebar text-left mt-2 mb-3">
    <div class="row align-items-center">
        <div class="col-md-6">
            <h1 class="h3">{{ translate('Send Bulk Notification') }}</h1>
        </div>
        <div class="col-md-6 text-right">
            <span id="matched-count-badge" class="badge badge-lg badge-soft-primary p-2" style="font-size: 14px;">
                <i class="las la-users"></i> {{ translate('Matching Members:') }} <strong id="matched-count">—</strong>
            </span>
        </div>
    </div>
</div>

{{-- WhatsApp Links Modal --}}
@if(session('whatsapp_links'))
<div class="card border-success mb-4">
    <div class="card-header bg-success text-white">
        <h5 class="mb-0"><i class="lab la-whatsapp"></i> {{ translate('WhatsApp Links Generated') }}</h5>
    </div>
    <div class="card-body" style="max-height: 300px; overflow-y: auto;">
        <table class="table table-sm table-bordered mb-0">
            <thead><tr><th>{{ translate('Name') }}</th><th>{{ translate('Phone') }}</th><th>{{ translate('Action') }}</th></tr></thead>
            <tbody>
                @foreach(session('whatsapp_links') as $wa)
                <tr>
                    <td>{{ $wa['name'] }}</td>
                    <td>{{ $wa['phone'] }}</td>
                    <td><a href="{{ $wa['link'] }}" target="_blank" class="btn btn-sm btn-success"><i class="lab la-whatsapp"></i> {{ translate('Open') }}</a></td>
                </tr>
                @endforeach
            </tbody>
        </table>
    </div>
</div>
@endif

<form action="{{ route('admin.bulk_notifications.send') }}" method="POST" id="bulk-notification-form">
    @csrf

    {{-- Target Mode --}}
    <div class="card">
        <div class="card-header">
            <h5 class="mb-0 h6"><i class="las la-crosshairs"></i> {{ translate('Target Audience') }}</h5>
        </div>
        <div class="card-body">
            <div class="form-group row">
                <label class="col-md-3 col-form-label">{{ translate('Target Mode') }}</label>
                <div class="col-md-9">
                    <div class="btn-group btn-group-toggle" data-toggle="buttons">
                        <label class="btn btn-outline-primary active">
                            <input type="radio" name="target_mode" value="all" checked onchange="toggleTargetMode()"> {{ translate('All Members') }}
                        </label>
                        <label class="btn btn-outline-primary">
                            <input type="radio" name="target_mode" value="filtered" onchange="toggleTargetMode()"> {{ translate('Filtered') }}
                        </label>
                        <label class="btn btn-outline-primary">
                            <input type="radio" name="target_mode" value="individual" onchange="toggleTargetMode()"> {{ translate('Individual') }}
                        </label>
                    </div>
                </div>
            </div>

            {{-- Individual Selection --}}
            <div class="form-group row d-none" id="individual-section">
                <label class="col-md-3 col-form-label">{{ translate('Select Members') }}</label>
                <div class="col-md-9">
                    <select name="user_ids[]" class="form-control aiz-selectpicker" multiple data-live-search="true" data-selected-text-format="count" data-actions-box="true" id="individual-users">
                        @foreach($users as $user)
                        <option value="{{ $user->id }}">{{ $user->first_name }} {{ $user->last_name }} ({{ $user->email ?? $user->phone ?? 'ID:'.$user->id }})</option>
                        @endforeach
                    </select>
                </div>
            </div>
        </div>
    </div>

    {{-- Filters Section --}}
    <div class="card d-none" id="filters-section">
        <div class="card-header">
            <h5 class="mb-0 h6"><i class="las la-filter"></i> {{ translate('Filters') }}</h5>
        </div>
        <div class="card-body">
            <div class="row">
                {{-- Gender --}}
                <div class="col-md-4">
                    <div class="form-group">
                        <label>{{ translate('Gender') }}</label>
                        <select name="gender" class="form-control aiz-selectpicker" data-live-search="false" onchange="updatePreviewCount()">
                            <option value="">{{ translate('All Genders') }}</option>
                            <option value="male">{{ translate('Male') }}</option>
                            <option value="female">{{ translate('Female') }}</option>
                        </select>
                    </div>
                </div>

                {{-- Membership --}}
                <div class="col-md-4">
                    <div class="form-group">
                        <label>{{ translate('Membership') }}</label>
                        <select name="membership" class="form-control aiz-selectpicker" onchange="updatePreviewCount()">
                            <option value="">{{ translate('All Memberships') }}</option>
                            <option value="1">{{ translate('Free') }}</option>
                            <option value="2">{{ translate('Premium') }}</option>
                        </select>
                    </div>
                </div>

                {{-- Package --}}
                <div class="col-md-4">
                    <div class="form-group">
                        <label>{{ translate('Package') }}</label>
                        <select name="package_id" class="form-control aiz-selectpicker" data-live-search="true" onchange="updatePreviewCount()">
                            <option value="">{{ translate('All Packages') }}</option>
                            @foreach($packages as $package)
                            <option value="{{ $package->id }}">{{ $package->name }}</option>
                            @endforeach
                        </select>
                    </div>
                </div>

                {{-- Country --}}
                <div class="col-md-4">
                    <div class="form-group">
                        <label>{{ translate('Country') }}</label>
                        <select name="country_id" class="form-control aiz-selectpicker" data-live-search="true" id="country-select" onchange="loadStates(); updatePreviewCount()">
                            <option value="">{{ translate('All Countries') }}</option>
                            @foreach($countries as $country)
                            <option value="{{ $country->id }}">{{ $country->name }}</option>
                            @endforeach
                        </select>
                    </div>
                </div>

                {{-- State --}}
                <div class="col-md-4">
                    <div class="form-group">
                        <label>{{ translate('State') }}</label>
                        <select name="state_id" class="form-control" id="state-select" onchange="loadCities(); updatePreviewCount()">
                            <option value="">{{ translate('All States') }}</option>
                        </select>
                    </div>
                </div>

                {{-- City --}}
                <div class="col-md-4">
                    <div class="form-group">
                        <label>{{ translate('City') }}</label>
                        <select name="city_id" class="form-control" id="city-select" onchange="updatePreviewCount()">
                            <option value="">{{ translate('All Cities') }}</option>
                        </select>
                    </div>
                </div>

                {{-- Religion --}}
                <div class="col-md-4">
                    <div class="form-group">
                        <label>{{ translate('Religion') }}</label>
                        <select name="religion_id" class="form-control aiz-selectpicker" data-live-search="true" onchange="updatePreviewCount()">
                            <option value="">{{ translate('All Religions') }}</option>
                            @foreach($religions as $religion)
                            <option value="{{ $religion->id }}">{{ $religion->name }}</option>
                            @endforeach
                        </select>
                    </div>
                </div>

                {{-- Marital Status --}}
                <div class="col-md-4">
                    <div class="form-group">
                        <label>{{ translate('Marital Status') }}</label>
                        <select name="marital_status_id" class="form-control aiz-selectpicker" data-live-search="true" onchange="updatePreviewCount()">
                            <option value="">{{ translate('All Statuses') }}</option>
                            @foreach($maritalStatuses as $ms)
                            <option value="{{ $ms->id }}">{{ $ms->name }}</option>
                            @endforeach
                        </select>
                    </div>
                </div>

                {{-- Approved --}}
                <div class="col-md-4">
                    <div class="form-group">
                        <label>{{ translate('Approved') }}</label>
                        <select name="approved" class="form-control aiz-selectpicker" onchange="updatePreviewCount()">
                            <option value="">{{ translate('All') }}</option>
                            <option value="1">{{ translate('Approved') }}</option>
                            <option value="0">{{ translate('Not Approved') }}</option>
                        </select>
                    </div>
                </div>

                {{-- Deactivated --}}
                <div class="col-md-4">
                    <div class="form-group">
                        <label>{{ translate('Deactivated') }}</label>
                        <select name="deactivated" class="form-control aiz-selectpicker" onchange="updatePreviewCount()">
                            <option value="">{{ translate('All') }}</option>
                            <option value="0" selected>{{ translate('Active Only') }}</option>
                            <option value="1">{{ translate('Deactivated Only') }}</option>
                        </select>
                    </div>
                </div>

                {{-- Has Photo --}}
                <div class="col-md-4">
                    <div class="form-group">
                        <label>{{ translate('Has Profile Photo') }}</label>
                        <select name="has_photo" class="form-control aiz-selectpicker" onchange="updatePreviewCount()">
                            <option value="">{{ translate('All') }}</option>
                            <option value="1">{{ translate('With Photo') }}</option>
                            <option value="0">{{ translate('Without Photo') }}</option>
                        </select>
                    </div>
                </div>

                {{-- Has Email --}}
                <div class="col-md-4">
                    <div class="form-group">
                        <label>{{ translate('Has Email') }}</label>
                        <select name="has_email" class="form-control aiz-selectpicker" onchange="updatePreviewCount()">
                            <option value="">{{ translate('All') }}</option>
                            <option value="1">{{ translate('With Email') }}</option>
                            <option value="0">{{ translate('Without Email') }}</option>
                        </select>
                    </div>
                </div>

                {{-- Has Phone --}}
                <div class="col-md-4">
                    <div class="form-group">
                        <label>{{ translate('Has Phone') }}</label>
                        <select name="has_phone" class="form-control aiz-selectpicker" onchange="updatePreviewCount()">
                            <option value="">{{ translate('All') }}</option>
                            <option value="1">{{ translate('With Phone') }}</option>
                            <option value="0">{{ translate('Without Phone') }}</option>
                        </select>
                    </div>
                </div>

                {{-- Onboarding Completed --}}
                <div class="col-md-4">
                    <div class="form-group">
                        <label>{{ translate('Onboarding Completed') }}</label>
                        <select name="onboarding_completed" class="form-control aiz-selectpicker" onchange="updatePreviewCount()">
                            <option value="">{{ translate('All') }}</option>
                            <option value="1">{{ translate('Completed') }}</option>
                            <option value="0">{{ translate('Not Completed') }}</option>
                        </select>
                    </div>
                </div>

                {{-- Marriage Timeline --}}
                <div class="col-md-4">
                    <div class="form-group">
                        <label>{{ translate('Marriage Timeline') }}</label>
                        <select name="marriage_timeline" class="form-control aiz-selectpicker" onchange="updatePreviewCount()">
                            <option value="">{{ translate('All') }}</option>
                            <option value="immediate">{{ translate('Immediate') }}</option>
                            <option value="6_months">{{ translate('Within 6 Months') }}</option>
                            <option value="1_year">{{ translate('Within 1 Year') }}</option>
                            <option value="2_years">{{ translate('Within 2 Years') }}</option>
                            <option value="casual">{{ translate('Casual') }}</option>
                            <option value="optional">{{ translate('Optional') }}</option>
                        </select>
                    </div>
                </div>

                {{-- Seriousness Level --}}
                <div class="col-md-4">
                    <div class="form-group">
                        <label>{{ translate('Seriousness Level') }}</label>
                        <select name="seriousness_level" class="form-control aiz-selectpicker" onchange="updatePreviewCount()">
                            <option value="">{{ translate('All') }}</option>
                            <option value="marriage">{{ translate('Marriage') }}</option>
                            <option value="exploring">{{ translate('Exploring') }}</option>
                            <option value="casual">{{ translate('Casual') }}</option>
                            <option value="optional">{{ translate('Optional') }}</option>
                        </select>
                    </div>
                </div>

                {{-- Age Range --}}
                <div class="col-md-4">
                    <div class="form-group">
                        <label>{{ translate('Age Range') }}</label>
                        <div class="row">
                            <div class="col-6">
                                <input type="number" name="age_from" class="form-control" placeholder="{{ translate('From') }}" min="18" max="100" onchange="updatePreviewCount()">
                            </div>
                            <div class="col-6">
                                <input type="number" name="age_to" class="form-control" placeholder="{{ translate('To') }}" min="18" max="100" onchange="updatePreviewCount()">
                            </div>
                        </div>
                    </div>
                </div>

                {{-- Blocked --}}
                <div class="col-md-4">
                    <div class="form-group">
                        <label>{{ translate('Blocked') }}</label>
                        <select name="blocked" class="form-control aiz-selectpicker" onchange="updatePreviewCount()">
                            <option value="">{{ translate('All') }}</option>
                            <option value="0">{{ translate('Not Blocked') }}</option>
                            <option value="1">{{ translate('Blocked') }}</option>
                        </select>
                    </div>
                </div>

                {{-- Registration Date Range --}}
                <div class="col-md-4">
                    <div class="form-group">
                        <label>{{ translate('Registered From') }}</label>
                        <input type="date" name="registered_from" class="form-control" onchange="updatePreviewCount()">
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="form-group">
                        <label>{{ translate('Registered To') }}</label>
                        <input type="date" name="registered_to" class="form-control" onchange="updatePreviewCount()">
                    </div>
                </div>
            </div>

            <div class="text-right">
                <button type="button" class="btn btn-soft-danger btn-sm" onclick="resetFilters()">
                    <i class="las la-undo"></i> {{ translate('Reset Filters') }}
                </button>
                <button type="button" class="btn btn-soft-info btn-sm ml-2" onclick="updatePreviewCount()">
                    <i class="las la-sync"></i> {{ translate('Refresh Count') }}
                </button>
            </div>
        </div>
    </div>

    {{-- Notification Content --}}
    <div class="card">
        <div class="card-header">
            <h5 class="mb-0 h6"><i class="las la-envelope"></i> {{ translate('Notification Content') }}</h5>
        </div>
        <div class="card-body">
            <div class="form-group row">
                <label class="col-md-3 col-form-label">{{ translate('Channels') }} <span class="text-danger">*</span></label>
                <div class="col-md-9">
                    <div class="d-flex flex-wrap" style="gap: 15px;">
                        <label class="aiz-checkbox">
                            <input type="checkbox" name="channels[]" value="email" checked>
                            <span class="aiz-square-check"></span>
                            <span><i class="las la-envelope text-primary"></i> {{ translate('Email') }}</span>
                        </label>
                        <label class="aiz-checkbox">
                            <input type="checkbox" name="channels[]" value="sms">
                            <span class="aiz-square-check"></span>
                            <span><i class="las la-sms text-info"></i> {{ translate('SMS') }}</span>
                        </label>
                        <label class="aiz-checkbox">
                            <input type="checkbox" name="channels[]" value="push">
                            <span class="aiz-square-check"></span>
                            <span><i class="las la-bell text-warning"></i> {{ translate('Push Notification') }}</span>
                        </label>
                        <label class="aiz-checkbox">
                            <input type="checkbox" name="channels[]" value="whatsapp">
                            <span class="aiz-square-check"></span>
                            <span><i class="lab la-whatsapp text-success"></i> {{ translate('WhatsApp') }}</span>
                        </label>
                    </div>
                    <small class="text-muted d-block mt-1">{{ translate('WhatsApp generates clickable links (browser opens WhatsApp Web). SMS costs may apply. Push notifications require the user to be registered.') }}</small>
                </div>
            </div>

            <div class="form-group row">
                <label class="col-md-3 col-form-label">{{ translate('Title / Subject') }} <span class="text-danger">*</span></label>
                <div class="col-md-9">
                    <input type="text" name="title" class="form-control" placeholder="{{ translate('Enter notification title...') }}" required maxlength="255">
                </div>
            </div>

            <div class="form-group row">
                <label class="col-md-3 col-form-label">{{ translate('Body / Content') }} <span class="text-danger">*</span></label>
                <div class="col-md-9">
                    <textarea name="body" rows="8" class="form-control aiz-text-editor" data-buttons='[["font", ["bold", "underline", "italic"]],["para", ["ul", "ol"]], ["insert", ["link", "picture"]],["view", ["undo","redo"]]]' required></textarea>
                    <small class="text-muted d-block mt-1">{{ translate('HTML formatting works for Email. Plain text will be used for SMS, Push, and WhatsApp.') }}</small>
                </div>
            </div>
        </div>
        <div class="card-footer text-right">
            <button type="submit" class="btn btn-primary btn-lg" onclick="return confirm('Are you sure you want to send this notification to all matched members? This action cannot be undone.')">
                <i class="las la-paper-plane"></i> {{ translate('Send Notification') }}
            </button>
        </div>
    </div>
</form>

{{-- Recent Bulk Notification Logs --}}
<div class="card">
    <div class="card-header">
        <h5 class="mb-0 h6"><i class="las la-history"></i> {{ translate('Recent Bulk Notifications') }}</h5>
    </div>
    <div class="card-body">
        <table class="table aiz-table mb-0">
            <thead>
                <tr>
                    <th>#</th>
                    <th>{{ translate('Title') }}</th>
                    <th>{{ translate('Channels') }}</th>
                    <th>{{ translate('Filters') }}</th>
                    <th>{{ translate('Targeted') }}</th>
                    <th>{{ translate('Email') }}</th>
                    <th>{{ translate('SMS') }}</th>
                    <th>{{ translate('Push') }}</th>
                    <th>{{ translate('Sent At') }}</th>
                </tr>
            </thead>
            <tbody>
                @forelse($logs as $log)
                <tr>
                    <td>{{ $log->id }}</td>
                    <td>{{ \Illuminate\Support\Str::limit($log->title, 30) }}</td>
                    <td>
                        @foreach(explode(',', $log->channels) as $ch)
                            @if($ch == 'email') <span class="badge badge-primary">Email</span>
                            @elseif($ch == 'sms') <span class="badge badge-info">SMS</span>
                            @elseif($ch == 'push') <span class="badge badge-warning">Push</span>
                            @elseif($ch == 'whatsapp') <span class="badge badge-success">WA</span>
                            @endif
                        @endforeach
                    </td>
                    <td><small>{{ \Illuminate\Support\Str::limit($log->filters_summary, 50) }}</small></td>
                    <td><span class="badge badge-dark">{{ $log->total_targeted }}</span></td>
                    <td>
                        @if($log->email_sent > 0 || $log->email_failed > 0)
                            <span class="text-success">{{ $log->email_sent }}</span> / <span class="text-danger">{{ $log->email_failed }}</span>
                        @else — @endif
                    </td>
                    <td>
                        @if($log->sms_sent > 0 || $log->sms_failed > 0)
                            <span class="text-success">{{ $log->sms_sent }}</span> / <span class="text-danger">{{ $log->sms_failed }}</span>
                        @else — @endif
                    </td>
                    <td>
                        @if($log->push_sent > 0 || $log->push_failed > 0)
                            <span class="text-success">{{ $log->push_sent }}</span> / <span class="text-danger">{{ $log->push_failed }}</span>
                        @else — @endif
                    </td>
                    <td>{{ \Carbon\Carbon::parse($log->created_at)->format('d M Y, h:i A') }}</td>
                </tr>
                @empty
                <tr>
                    <td colspan="9" class="text-center text-muted py-4">
                        <i class="las la-inbox" style="font-size: 40px;"></i>
                        <p class="mb-0 mt-2">{{ translate('No bulk notifications sent yet.') }}</p>
                    </td>
                </tr>
                @endforelse
            </tbody>
        </table>
    </div>
</div>

@endsection

@section('script')
<script>
    function toggleTargetMode() {
        var mode = document.querySelector('input[name="target_mode"]:checked').value;
        var filtersSection = document.getElementById('filters-section');
        var individualSection = document.getElementById('individual-section');

        if (mode === 'filtered') {
            filtersSection.classList.remove('d-none');
            individualSection.classList.add('d-none');
            updatePreviewCount();
        } else if (mode === 'individual') {
            filtersSection.classList.add('d-none');
            individualSection.classList.remove('d-none');
            document.getElementById('matched-count').textContent = '—';
        } else {
            // all
            filtersSection.classList.add('d-none');
            individualSection.classList.add('d-none');
            updatePreviewCount();
        }
    }

    var previewDebounce = null;
    function updatePreviewCount() {
        clearTimeout(previewDebounce);
        previewDebounce = setTimeout(function() {
            var formData = new FormData(document.getElementById('bulk-notification-form'));
            fetch("{{ route('admin.bulk_notifications.preview_count') }}", {
                method: 'POST',
                headers: {
                    'X-CSRF-TOKEN': '{{ csrf_token() }}',
                    'Accept': 'application/json',
                },
                body: formData,
            })
            .then(r => r.json())
            .then(data => {
                document.getElementById('matched-count').textContent = data.count;
            })
            .catch(() => {
                document.getElementById('matched-count').textContent = '?';
            });
        }, 300);
    }

    function loadStates() {
        var countryId = document.getElementById('country-select').value;
        var stateSelect = document.getElementById('state-select');
        var citySelect = document.getElementById('city-select');

        stateSelect.innerHTML = '<option value="">{{ translate("All States") }}</option>';
        citySelect.innerHTML = '<option value="">{{ translate("All Cities") }}</option>';

        if (!countryId) return;

        fetch("{{ route('admin.bulk_notifications.get_states') }}?country_id=" + countryId, {
            headers: { 'Accept': 'application/json' }
        })
        .then(r => r.json())
        .then(states => {
            states.forEach(s => {
                var opt = new Option(s.name, s.id);
                stateSelect.appendChild(opt);
            });
        });
    }

    function loadCities() {
        var stateId = document.getElementById('state-select').value;
        var citySelect = document.getElementById('city-select');

        citySelect.innerHTML = '<option value="">{{ translate("All Cities") }}</option>';

        if (!stateId) return;

        fetch("{{ route('admin.bulk_notifications.get_cities') }}?state_id=" + stateId, {
            headers: { 'Accept': 'application/json' }
        })
        .then(r => r.json())
        .then(cities => {
            cities.forEach(c => {
                var opt = new Option(c.name, c.id);
                citySelect.appendChild(opt);
            });
        });
    }

    function resetFilters() {
        var form = document.getElementById('bulk-notification-form');
        // Reset all selects in filter section
        var filterSection = document.getElementById('filters-section');
        if (filterSection) {
            filterSection.querySelectorAll('select').forEach(s => {
                s.selectedIndex = 0;
                if ($(s).hasClass('aiz-selectpicker')) {
                    $(s).selectpicker('refresh');
                }
            });
            filterSection.querySelectorAll('input[type="number"], input[type="date"]').forEach(i => {
                i.value = '';
            });
        }
        updatePreviewCount();
    }

    // Initial count
    document.addEventListener('DOMContentLoaded', function() {
        updatePreviewCount();
    });
</script>
@endsection
