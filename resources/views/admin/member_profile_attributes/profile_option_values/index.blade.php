@extends('admin.layouts.app')
@section('content')
<div class="aiz-titlebar mt-2 mb-4">
    <div class="row align-items-center">
        <div class="col-md-6">
            <h1 class="h3">{{translate('Lifestyle & Profile Options')}}</h1>
        </div>
    </div>
</div>
<div class="row">
    <div class="@if(auth()->user()->can('add_profile_option_value')) col-lg-7 @else col-lg-12 @endif">
        <form class="" id="sort_options" action="" method="GET">
            <div class="card">
                <div class="card-header row gutters-5">
                    <div class="col-md-3 text-center text-md-left">
                        <h5 class="mb-md-0 h6">{{ translate('All Options') }}</h5>
                    </div>

                    @can('delete_profile_option_value')
                        <div class="dropdown mb-2 mb-md-0">
                            <button class="btn btn-sm border dropdown-toggle" type="button" data-toggle="dropdown">
                                {{translate('Bulk Action')}}
                            </button>
                            <div class="dropdown-menu dropdown-menu-right">
                                <a class="dropdown-item confirm-alert" href="javascript:void(0)" data-target="#bulk-delete-modal">{{translate('Delete selection')}}</a>
                            </div>
                        </div>
                    @endcan

                    <div class="col-md-3">
                        <select class="form-control form-control-sm" name="group" onchange="this.form.submit()">
                            <option value="">{{ translate('All Groups') }}</option>
                            @foreach($allGroups as $key => $label)
                                <option value="{{ $key }}" {{ $active_group == $key ? 'selected' : '' }}>{{ translate($label) }}</option>
                            @endforeach
                        </select>
                    </div>

                    <div class="col-md-3">
                        <div class="input-group input-group-sm">
                            <input type="text" class="form-control" id="search" name="search" @isset($sort_search) value="{{ $sort_search }}" @endisset placeholder="{{ translate('Type & Enter') }}">
                        </div>
                    </div>
                </div>
                <div class="card-body">
                    <table class="table aiz-table mb-0">
                        <thead>
                            <tr>
                                @if(auth()->user()->can('delete_profile_option_value'))
                                    <th width="30">
                                        <div class="form-group">
                                            <div class="aiz-checkbox-inline">
                                                <label class="aiz-checkbox">
                                                    <input type="checkbox" class="check-all">
                                                    <span class="aiz-square-check"></span>
                                                </label>
                                            </div>
                                        </div>
                                    </th>
                                @else
                                    <th data-breakpoints="lg">#</th>
                                @endif
                                <th>{{translate('Group')}}</th>
                                <th>{{translate('Label')}}</th>
                                <th data-breakpoints="lg">{{translate('Value')}}</th>
                                <th data-breakpoints="lg" width="60">{{translate('Order')}}</th>
                                <th width="80">{{translate('Active')}}</th>
                                <th class="text-right" width="100">{{translate('Options')}}</th>
                            </tr>
                        </thead>
                        <tbody>
                            @foreach($options as $key => $option)
                                <tr>
                                    <td>
                                        @if(auth()->user()->can('delete_profile_option_value'))
                                            <div class="form-group d-inline-block">
                                                <label class="aiz-checkbox">
                                                    <input type="checkbox" class="check-one" name="id[]" value="{{$option->id}}">
                                                    <span class="aiz-square-check"></span>
                                                </label>
                                            </div>
                                        @else
                                            {{ ($key+1) + ($options->currentPage() - 1)*$options->perPage() }}
                                        @endif
                                    </td>
                                    <td>
                                        <a href="{{ route('profile-option-values.index', ['group' => $option->group]) }}" class="badge badge-soft-info">
                                            {{ $groupLabels[$option->group] ?? ucwords(str_replace('_', ' ', $option->group)) }}
                                        </a>
                                    </td>
                                    <td>{{ $option->label }}</td>
                                    <td><code>{{ $option->value }}</code></td>
                                    <td>{{ $option->sort_order }}</td>
                                    <td>
                                        <label class="aiz-switch aiz-switch-success mb-0">
                                            <input type="checkbox" {{ $option->is_active ? 'checked' : '' }}
                                                onchange="toggleActive({{ $option->id }}, this)"
                                                @cannot('edit_profile_option_value') disabled @endcannot>
                                            <span class="slider round"></span>
                                        </label>
                                    </td>
                                    <td class="text-right">
                                        @can('edit_profile_option_value')
                                            <a class="btn btn-soft-primary btn-icon btn-circle btn-sm" href="javascript:void(0);" onclick="option_edit_modal('{{ route('profile-option-values.edit', encrypt($option->id)) }}')" title="{{ translate('Edit') }}">
                                                <i class="las la-edit"></i>
                                            </a>
                                        @endcan
                                        @can('delete_profile_option_value')
                                            <a href="javascript:void(0);" class="btn btn-soft-danger btn-icon btn-circle btn-sm confirm-delete" data-href="{{route('profile-option-values.destroy', $option->id)}}" title="{{ translate('Delete') }}">
                                                <i class="las la-trash"></i>
                                            </a>
                                        @endcan
                                    </td>
                                </tr>
                            @endforeach
                        </tbody>
                    </table>
                    <div class="aiz-pagination">
                        {{ $options->appends(request()->input())->links() }}
                    </div>
                </div>
            </div>
        </form>
    </div>

    @can('add_profile_option_value')
        <div class="col-lg-5">
            <div class="card">
                <div class="card-header">
                    <h5 class="mb-0 h6">{{translate('Add New Option')}}</h5>
                </div>
                <div class="card-body">
                    <form action="{{ route('profile-option-values.store') }}" method="POST">
                        @csrf
                        <div class="form-group mb-3">
                            <label for="group">{{translate('Group')}}</label>
                            <select id="group" name="group" class="form-control" required>
                                <option value="">{{ translate('Select Group') }}</option>
                                @foreach($allGroups as $key => $label)
                                    <option value="{{ $key }}" {{ ($active_group == $key) ? 'selected' : '' }}>{{ translate($label) }}</option>
                                @endforeach
                            </select>
                            <small class="form-text text-muted">{{ translate('Or type a new group name below') }}</small>
                            <input type="text" id="new_group" class="form-control mt-1" placeholder="{{ translate('New group name (e.g. body_type)') }}">
                            @error('group')
                                <small class="form-text text-danger">{{ $message }}</small>
                            @enderror
                        </div>
                        <div class="form-group mb-3">
                            <label for="value">{{translate('Value')}}</label>
                            <input type="text" id="value" name="value" placeholder="{{ translate('Stored value (e.g. halal_strict)') }}"
                                   class="form-control" required>
                            @error('value')
                                <small class="form-text text-danger">{{ $message }}</small>
                            @enderror
                        </div>
                        <div class="form-group mb-3">
                            <label for="label">{{translate('Display Label')}}</label>
                            <input type="text" id="label" name="label" placeholder="{{ translate('Display text (e.g. Halal Strict)') }}"
                                   class="form-control" required>
                            @error('label')
                                <small class="form-text text-danger">{{ $message }}</small>
                            @enderror
                        </div>
                        <div class="form-group mb-3">
                            <label for="sort_order">{{translate('Sort Order')}}</label>
                            <input type="number" id="sort_order" name="sort_order" placeholder="{{ translate('Auto') }}"
                                   class="form-control" min="0">
                        </div>
                        <div class="form-group mb-3">
                            <div class="custom-control custom-checkbox">
                                <input type="checkbox" class="custom-control-input" id="is_active" name="is_active" checked>
                                <label class="custom-control-label" for="is_active">{{translate('Active')}}</label>
                            </div>
                        </div>
                        <div class="form-group mb-3 text-right">
                            <button type="submit" class="btn btn-primary">{{translate('Save')}}</button>
                        </div>
                    </form>
                </div>
            </div>

            {{-- Group overview card --}}
            <div class="card mt-3">
                <div class="card-header">
                    <h5 class="mb-0 h6">{{translate('Groups Overview')}}</h5>
                </div>
                <div class="card-body p-0">
                    <table class="table table-sm mb-0">
                        <thead>
                            <tr>
                                <th>{{translate('Group')}}</th>
                                <th class="text-center">{{translate('Total')}}</th>
                                <th class="text-center">{{translate('Active')}}</th>
                            </tr>
                        </thead>
                        <tbody>
                            @php
                                $groupCounts = \App\Models\ProfileOptionValue::selectRaw('`group`, COUNT(*) as total, SUM(is_active) as active_count')
                                    ->groupBy('group')
                                    ->orderBy('group')
                                    ->get();
                            @endphp
                            @foreach($groupCounts as $gc)
                                <tr>
                                    <td>
                                        <a href="{{ route('profile-option-values.index', ['group' => $gc->group]) }}">
                                            {{ $groupLabels[$gc->group] ?? ucwords(str_replace('_', ' ', $gc->group)) }}
                                        </a>
                                    </td>
                                    <td class="text-center">{{ $gc->total }}</td>
                                    <td class="text-center">
                                        <span class="badge badge-soft-success">{{ $gc->active_count }}</span>
                                    </td>
                                </tr>
                            @endforeach
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    @endcan
</div>
@endsection

@section('modal')
    @include('modals.create_edit_modal')
    @include('modals.delete_modal')
    @include('modals.bulk_delete_modal')
@endsection

@section('script')
    <script>
        // Edit modal loader
        function option_edit_modal(url) {
            $.get(url, function(data) {
                $('.create_edit_modal').modal('show');
                $('.create_edit_modal_content').html(data);
            });
        }

        // Toggle active/inactive via AJAX
        function toggleActive(id, el) {
            $.ajax({
                headers: { 'X-CSRF-TOKEN': $('meta[name="csrf-token"]').attr('content') },
                url: "{{ url('admin/profile-option-values/toggle-active') }}/" + id,
                type: 'POST',
                success: function(response) {
                    if (response.success) {
                        // visual feedback handled by checkbox state
                    }
                },
                error: function() {
                    // revert checkbox on error
                    el.checked = !el.checked;
                }
            });
        }

        // New group name override
        document.getElementById('new_group').addEventListener('input', function() {
            var sel = document.getElementById('group');
            if (this.value.trim() !== '') {
                // Add as temporary option and select it
                var newVal = this.value.trim().toLowerCase().replace(/\s+/g, '_');
                var existing = sel.querySelector('option[value="' + newVal + '"]');
                if (!existing) {
                    var opt = document.createElement('option');
                    opt.value = newVal;
                    opt.textContent = this.value.trim();
                    sel.appendChild(opt);
                }
                sel.value = newVal;
            }
        });

        // Check-all / uncheck-all
        $(document).on("change", ".check-all", function() {
            $('.check-one:checkbox').each(function() {
                this.checked = !this.checked || true;
            });
            if (!this.checked) {
                $('.check-one:checkbox').each(function() {
                    this.checked = false;
                });
            }
        });

        // Bulk delete handler
        function bulk_delete() {
            var data = new FormData($('#sort_options')[0]);
            $.ajax({
                headers: { 'X-CSRF-TOKEN': $('meta[name="csrf-token"]').attr('content') },
                url: "{{ route('profile_option_values.bulk_delete') }}",
                type: 'POST',
                data: data,
                cache: false,
                contentType: false,
                processData: false,
                success: function(response) {
                    if (response == 1) {
                        location.reload();
                    }
                }
            });
        }
    </script>
@endsection
