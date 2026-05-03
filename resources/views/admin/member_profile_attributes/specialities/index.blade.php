@extends('admin.layouts.app')
@section('content')
<div class="aiz-titlebar mt-2 mb-4">
    <div class="row align-items-center">
        <div class="col-md-6">
            <h1 class="h3">{{translate('Specialities')}}</h1>
        </div>
    </div>
</div>
<div class="row">
    <div class="@if(auth()->user()->can('add_speciality')) col-lg-7 @else col-lg-12 @endif">
        <form class="" id="sort_specialities" action="" method="GET">
            <div class="card">
                <div class="card-header row gutters-5">
                    <div class="col text-center text-md-left">
                        <h5 class="mb-md-0 h6">{{ translate('All Specialities') }}</h5>
                    </div>

                    @can('delete_speciality')
                        <div class="dropdown mb-2 mb-md-0">
                            <button class="btn btn-sm border dropdown-toggle" type="button" data-toggle="dropdown">
                                {{translate('Bulk Action')}}
                            </button>
                            <div class="dropdown-menu dropdown-menu-right">
                                <a class="dropdown-item confirm-alert" href="javascript:void(0)" data-target="#bulk-delete-modal">{{translate('Delete selection')}}</a>
                            </div>
                        </div>
                    @endcan

                    <div class="col-md-4">
                        <div class="input-group input-group-sm">
                            <input type="text" class="form-control" id="search" name="search" @isset($sort_search) value="{{ $sort_search }}" @endisset placeholder="{{ translate('Type name & Enter') }}">
                        </div>
                    </div>
                </div>
                <div class="card-body">
                    <table class="table aiz-table mb-0">
                        <thead>
                            <tr>
                                @if(auth()->user()->can('delete_speciality'))
                                    <th>
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
                                <th>{{translate('Name')}}</th>
                                <th class="text-right" width="20%">{{translate('Options')}}</th>
                            </tr>
                        </thead>
                        <tbody>
                            @foreach($specialities as $key => $speciality)
                                <tr>
                                    <td>
                                        @if(auth()->user()->can('delete_speciality'))
                                            <div class="form-group d-inline-block">
                                                <label class="aiz-checkbox">
                                                    <input type="checkbox" class="check-one" name="id[]" value="{{$speciality->id}}">
                                                    <span class="aiz-square-check"></span>
                                                </label>
                                            </div>
                                        @else
                                            {{ ($key+1) + ($specialities->currentPage() - 1)*$specialities->perPage() }}
                                        @endif
                                    </td>
                                    <td>{{$speciality->name}}</td>
                                    <td class="text-right">
                                        @can('edit_speciality')
                                            <a class="btn btn-soft-primary btn-icon btn-circle btn-sm" href="javascript:void(0);" onclick="speciality_modal('{{ route('specialities.edit', encrypt($speciality->id)) }}')" title="{{ translate('Edit') }}">
                                                <i class="las la-edit"></i>
                                            </a>
                                        @endcan
                                        @can('delete_speciality')
                                            <a href="javascript:void(0);" class="btn btn-soft-danger btn-icon btn-circle btn-sm confirm-delete" data-href="{{route('specialities.destroy', $speciality->id)}}" title="{{ translate('Delete') }}">
                                                <i class="las la-trash"></i>
                                            </a>
                                        @endcan
                                    </td>
                                </tr>
                            @endforeach
                        </tbody>
                    </table>
                    <div class="aiz-pagination">
                        {{ $specialities->appends(request()->input())->links() }}
                    </div>
                </div>
            </div>
        </form>
    </div>
    @can('add_speciality')
        <div class="col-lg-5">
            <div class="card">
                <div class="card-header">
                    <h5 class="mb-0 h6">{{translate('Add New Speciality')}}</h5>
                </div>
                <div class="card-body">
                    <form action="{{ route('specialities.store') }}" method="POST">
                        @csrf
                        <div class="form-group mb-3">
                            <label for="name">{{translate('Name')}}</label>
                            <input type="text" id="name" name="name" placeholder="{{ translate('Speciality Name') }}"
                                   class="form-control" required>
                            @error('name')
                                <small class="form-text text-danger">{{ $message }}</small>
                            @enderror
                        </div>
                        <div class="form-group mb-3 text-right">
                            <button type="submit" class="btn btn-primary">{{translate('Save')}}</button>
                        </div>
                    </form>
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
        function sort_specialities(el){
            $('#sort_specialities').submit();
        }

        function speciality_modal(url){
            $.get(url, function(data){
                $('.create_edit_modal').modal('show');
                $('.create_edit_modal_content').html(data);
            });
        }

        $(document).on("change", ".check-all", function() {
            if(this.checked) {
                $('.check-one:checkbox').each(function() {
                    this.checked = true;
                });
            } else {
                $('.check-one:checkbox').each(function() {
                    this.checked = false;
                });
            }
        });

        function bulk_delete() {
            var data = new FormData($('#sort_specialities')[0]);
            $.ajax({
                headers: {
                    'X-CSRF-TOKEN': $('meta[name="csrf-token"]').attr('content')
                },
                url: "{{route('specialities.bulk_delete')}}",
                type: 'POST',
                data: data,
                cache: false,
                contentType: false,
                processData: false,
                success: function(response) {
                    location.reload();
                }
            });
        }
    </script>
@endsection
