@extends('admin.layouts.app')
@section('content')
<div class="aiz-titlebar text-left mt-2 mb-3">
    <div class="row align-items-center">
        <div class="col-md-6">
            <h1 class="h3">{{ translate('Referral Rules') }}</h1>
        </div>
        <div class="col-md-6 text-right">
            <button class="btn btn-primary" data-toggle="modal" data-target="#createRuleModal">
                <i class="las la-plus"></i> {{ translate('Add New Rule') }}
            </button>
        </div>
    </div>
</div>

<div class="card">
    <div class="card-body">
        <table class="table aiz-table mb-0">
            <thead>
                <tr>
                    <th>#</th>
                    <th>{{ translate('Name') }}</th>
                    <th>{{ translate('Threshold') }}</th>
                    <th>{{ translate('Qualification') }}</th>
                    <th>{{ translate('Reward') }}</th>
                    <th>{{ translate('Limit') }}</th>
                    <th>{{ translate('Status') }}</th>
                    <th>{{ translate('Date Range') }}</th>
                    <th class="text-right">{{ translate('Actions') }}</th>
                </tr>
            </thead>
            <tbody>
                @forelse($rules as $rule)
                <tr>
                    <td>{{ $rule->id }}</td>
                    <td>{{ $rule->name }}</td>
                    <td><span class="badge badge-info">{{ $rule->trigger_threshold }} {{ translate('referrals') }}</span></td>
                    <td>{{ str_replace('_', ' ', ucfirst($rule->qualification_mode)) }}</td>
                    <td>
                        @if($rule->reward_type == 'package_upgrade')
                            @php $pkg = \App\Models\Package::find($rule->reward_params['target_package_id'] ?? 0); @endphp
                            <span class="badge badge-success">{{ translate('Upgrade to') }} {{ $pkg ? $pkg->name : 'N/A' }}</span>
                            <br><small>{{ $rule->reward_params['upgrade_duration_days'] ?? 0 }} {{ translate('days') }}</small>
                        @endif
                    </td>
                    <td>{{ ucfirst($rule->per_user_limit) }}</td>
                    <td>
                        @if($rule->is_active)
                            <span class="badge badge-success">{{ translate('Active') }}</span>
                        @else
                            <span class="badge badge-secondary">{{ translate('Inactive') }}</span>
                        @endif
                    </td>
                    <td>
                        @if($rule->starts_at || $rule->ends_at)
                            <small>
                                {{ $rule->starts_at ? $rule->starts_at->format('M d, Y') : '∞' }}
                                →
                                {{ $rule->ends_at ? $rule->ends_at->format('M d, Y') : '∞' }}
                            </small>
                        @else
                            <small class="text-muted">{{ translate('No date limit') }}</small>
                        @endif
                    </td>
                    <td class="text-right">
                        <button class="btn btn-soft-primary btn-icon btn-circle btn-sm"
                                onclick="editRule({{ json_encode($rule) }})"
                                title="{{ translate('Edit') }}">
                            <i class="las la-edit"></i>
                        </button>
                        <form action="{{ route('admin.referral.rules.delete', $rule->id) }}" method="POST" class="d-inline">
                            @csrf
                            @method('DELETE')
                            <button type="submit" class="btn btn-soft-danger btn-icon btn-circle btn-sm"
                                    onclick="return confirm('{{ translate('Are you sure?') }}')"
                                    title="{{ translate('Delete') }}">
                                <i class="las la-trash"></i>
                            </button>
                        </form>
                    </td>
                </tr>
                @empty
                <tr>
                    <td colspan="9" class="text-center">{{ translate('No rules created yet') }}</td>
                </tr>
                @endforelse
            </tbody>
        </table>
    </div>
</div>

<!-- Create Rule Modal -->
<div class="modal fade" id="createRuleModal" tabindex="-1">
    <div class="modal-dialog modal-lg">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title">{{ translate('Create Referral Rule') }}</h5>
                <button type="button" class="close" data-dismiss="modal"><span>&times;</span></button>
            </div>
            <form action="{{ route('admin.referral.rules.store') }}" method="POST">
                @csrf
                <div class="modal-body">
                    <div class="form-group">
                        <label>{{ translate('Rule Name') }} <span class="text-danger">*</span></label>
                        <input type="text" name="name" class="form-control" required placeholder="{{ translate('e.g., 3 Referrals - Gold Upgrade') }}">
                    </div>
                    <div class="row">
                        <div class="col-md-6">
                            <div class="form-group">
                                <label>{{ translate('Required Referrals (Threshold)') }} <span class="text-danger">*</span></label>
                                <input type="number" name="trigger_threshold" class="form-control" value="3" min="1" max="1000" required>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="form-group">
                                <label>{{ translate('Qualification Mode') }} <span class="text-danger">*</span></label>
                                <select name="qualification_mode" class="form-control aiz-selectpicker">
                                    <option value="registration_only">{{ translate('Registration Only') }}</option>
                                    <option value="email_verified" selected>{{ translate('Email Verified') }}</option>
                                    <option value="phone_verified">{{ translate('Phone Verified') }}</option>
                                    <option value="email_and_phone_verified">{{ translate('Email & Phone Verified') }}</option>
                                    <option value="paid_subscription">{{ translate('Paid Subscription') }}</option>
                                    <option value="active_days">{{ translate('Active Days') }}</option>
                                </select>
                            </div>
                        </div>
                    </div>
                    <div class="form-group" id="activeDaysGroup" style="display:none;">
                        <label>{{ translate('Required Active Days') }}</label>
                        <input type="number" name="active_days" class="form-control" value="7" min="1" max="365">
                    </div>
                    <div class="row">
                        <div class="col-md-6">
                            <div class="form-group">
                                <label>{{ translate('Reward Type') }}</label>
                                <select name="reward_type" class="form-control" disabled>
                                    <option value="package_upgrade" selected>{{ translate('Package Upgrade') }}</option>
                                </select>
                                <input type="hidden" name="reward_type" value="package_upgrade">
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="form-group">
                                <label>{{ translate('Target Package') }} <span class="text-danger">*</span></label>
                                <select name="target_package_id" class="form-control aiz-selectpicker" required>
                                    @foreach($packages as $package)
                                        <option value="{{ $package->id }}">{{ $package->name }} ({{ $package->price }} - {{ $package->validity }} days)</option>
                                    @endforeach
                                </select>
                            </div>
                        </div>
                    </div>
                    <div class="row">
                        <div class="col-md-4">
                            <div class="form-group">
                                <label>{{ translate('Upgrade Duration (days)') }} <span class="text-danger">*</span></label>
                                <input type="number" name="upgrade_duration_days" class="form-control" value="90" min="1" max="3650" required>
                            </div>
                        </div>
                        <div class="col-md-4">
                            <div class="form-group">
                                <label>{{ translate('Permanent Upgrade?') }}</label>
                                <select name="is_permanent" class="form-control">
                                    <option value="0">{{ translate('No - Time-bound') }}</option>
                                    <option value="1">{{ translate('Yes - Permanent') }}</option>
                                </select>
                            </div>
                        </div>
                        <div class="col-md-4">
                            <div class="form-group">
                                <label>{{ translate('Per User Limit') }}</label>
                                <select name="per_user_limit" class="form-control aiz-selectpicker">
                                    <option value="once" selected>{{ translate('Once') }}</option>
                                    <option value="monthly">{{ translate('Monthly') }}</option>
                                    <option value="unlimited">{{ translate('Unlimited') }}</option>
                                </select>
                            </div>
                        </div>
                    </div>
                    <div class="row">
                        <div class="col-md-6">
                            <div class="form-group">
                                <label>{{ translate('Start Date (optional)') }}</label>
                                <input type="date" name="starts_at" class="form-control">
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="form-group">
                                <label>{{ translate('End Date (optional)') }}</label>
                                <input type="date" name="ends_at" class="form-control">
                            </div>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-dismiss="modal">{{ translate('Cancel') }}</button>
                    <button type="submit" class="btn btn-primary">{{ translate('Create Rule') }}</button>
                </div>
            </form>
        </div>
    </div>
</div>

<!-- Edit Rule Modal -->
<div class="modal fade" id="editRuleModal" tabindex="-1">
    <div class="modal-dialog modal-lg">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title">{{ translate('Edit Referral Rule') }}</h5>
                <button type="button" class="close" data-dismiss="modal"><span>&times;</span></button>
            </div>
            <form id="editRuleForm" method="POST">
                @csrf
                @method('PUT')
                <div class="modal-body">
                    <div class="form-group">
                        <label>{{ translate('Rule Name') }} <span class="text-danger">*</span></label>
                        <input type="text" name="name" id="edit_name" class="form-control" required>
                    </div>
                    <div class="form-group">
                        <label>{{ translate('Active') }}</label>
                        <select name="is_active" id="edit_is_active" class="form-control">
                            <option value="1">{{ translate('Active') }}</option>
                            <option value="0">{{ translate('Inactive') }}</option>
                        </select>
                    </div>
                    <div class="row">
                        <div class="col-md-6">
                            <div class="form-group">
                                <label>{{ translate('Required Referrals') }} <span class="text-danger">*</span></label>
                                <input type="number" name="trigger_threshold" id="edit_trigger_threshold" class="form-control" min="1" required>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="form-group">
                                <label>{{ translate('Qualification Mode') }} <span class="text-danger">*</span></label>
                                <select name="qualification_mode" id="edit_qualification_mode" class="form-control">
                                    <option value="registration_only">{{ translate('Registration Only') }}</option>
                                    <option value="email_verified">{{ translate('Email Verified') }}</option>
                                    <option value="phone_verified">{{ translate('Phone Verified') }}</option>
                                    <option value="email_and_phone_verified">{{ translate('Email & Phone Verified') }}</option>
                                    <option value="paid_subscription">{{ translate('Paid Subscription') }}</option>
                                    <option value="active_days">{{ translate('Active Days') }}</option>
                                </select>
                            </div>
                        </div>
                    </div>
                    <div class="form-group">
                        <label>{{ translate('Active Days (if applicable)') }}</label>
                        <input type="number" name="active_days" id="edit_active_days" class="form-control" value="7" min="1">
                    </div>
                    <div class="row">
                        <div class="col-md-6">
                            <div class="form-group">
                                <label>{{ translate('Target Package') }} <span class="text-danger">*</span></label>
                                <select name="target_package_id" id="edit_target_package_id" class="form-control" required>
                                    @foreach($packages as $package)
                                        <option value="{{ $package->id }}">{{ $package->name }}</option>
                                    @endforeach
                                </select>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="form-group">
                                <label>{{ translate('Upgrade Duration (days)') }} <span class="text-danger">*</span></label>
                                <input type="number" name="upgrade_duration_days" id="edit_upgrade_duration_days" class="form-control" min="1" required>
                            </div>
                        </div>
                    </div>
                    <div class="row">
                        <div class="col-md-4">
                            <div class="form-group">
                                <label>{{ translate('Permanent?') }}</label>
                                <select name="is_permanent" id="edit_is_permanent" class="form-control">
                                    <option value="0">{{ translate('No') }}</option>
                                    <option value="1">{{ translate('Yes') }}</option>
                                </select>
                            </div>
                        </div>
                        <div class="col-md-4">
                            <div class="form-group">
                                <label>{{ translate('Per User Limit') }}</label>
                                <select name="per_user_limit" id="edit_per_user_limit" class="form-control">
                                    <option value="once">{{ translate('Once') }}</option>
                                    <option value="monthly">{{ translate('Monthly') }}</option>
                                    <option value="unlimited">{{ translate('Unlimited') }}</option>
                                </select>
                            </div>
                        </div>
                    </div>
                    <div class="row">
                        <div class="col-md-6">
                            <div class="form-group">
                                <label>{{ translate('Start Date') }}</label>
                                <input type="date" name="starts_at" id="edit_starts_at" class="form-control">
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="form-group">
                                <label>{{ translate('End Date') }}</label>
                                <input type="date" name="ends_at" id="edit_ends_at" class="form-control">
                            </div>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-dismiss="modal">{{ translate('Cancel') }}</button>
                    <button type="submit" class="btn btn-primary">{{ translate('Update Rule') }}</button>
                </div>
            </form>
        </div>
    </div>
</div>

<script>
    // Show/hide active days field
    document.querySelector('select[name="qualification_mode"]').addEventListener('change', function() {
        document.getElementById('activeDaysGroup').style.display = this.value === 'active_days' ? 'block' : 'none';
    });

    function editRule(rule) {
        var form = document.getElementById('editRuleForm');
        form.action = '{{ url("admin/referral/rules") }}/' + rule.id;

        document.getElementById('edit_name').value = rule.name;
        document.getElementById('edit_is_active').value = rule.is_active ? '1' : '0';
        document.getElementById('edit_trigger_threshold').value = rule.trigger_threshold;
        document.getElementById('edit_qualification_mode').value = rule.qualification_mode;
        document.getElementById('edit_per_user_limit').value = rule.per_user_limit;

        if (rule.qualification_params) {
            document.getElementById('edit_active_days').value = rule.qualification_params.active_days || 7;
        }
        if (rule.reward_params) {
            document.getElementById('edit_target_package_id').value = rule.reward_params.target_package_id || '';
            document.getElementById('edit_upgrade_duration_days').value = rule.reward_params.upgrade_duration_days || 90;
            document.getElementById('edit_is_permanent').value = rule.reward_params.is_permanent ? '1' : '0';
        }

        if (rule.starts_at) {
            document.getElementById('edit_starts_at').value = rule.starts_at.split('T')[0];
        }
        if (rule.ends_at) {
            document.getElementById('edit_ends_at').value = rule.ends_at.split('T')[0];
        }

        $('#editRuleModal').modal('show');
    }
</script>
@endsection
