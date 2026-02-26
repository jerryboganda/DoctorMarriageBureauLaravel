@extends('admin.layouts.app')
@section('content')
<div class="aiz-titlebar mt-2 mb-4">
    <div class="row align-items-center">
        <div class="col-md-6">
            <h1 class="h3">{{translate('Sects')}}</h1>
        </div>
    </div>
</div>
<div class="row">
    <div class="@if(auth()->user()->can('add_sect')) col-lg-7 @else col-lg-12 @endif">
        <div class="card">
            <form class="" id="sort_sects" action="" method="GET">
                <div class="card-header row gutters-5">
                    <div class="col text-center text-md-left">
                        <h5 class="mb-md-0 h6">{{ translate('All Sects') }}</h5>
                    </div>
                    @can('delete_sect')
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
                                @if(auth()->user()->can('delete_sect'))
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
                            @foreach($sects as $key => $sect)
                                <tr>
                                    <td>
                                        @if(auth()->user()->can('delete_sect'))
                                            <div class="form-group d-inline-block">
                                                <label class="aiz-checkbox">
                                                    <input type="checkbox" class="check-one" name="id[]" value="{{$sect->id}}">
                                                    <span class="aiz-square-check"></span>
                                                </label>
                                            </div>
                                        @else
                                            {{ ($key+1) + ($sects->currentPage() - 1)*$sects->perPage() }}
                                        @endif
                                    </td>
                                    <td>{{$sect->name}}</td>
                                    <td class="text-right">
                                        @can('edit_sect')
                                            <a href="{{ route('sects.edit', encrypt($sect->id)) }}" class="btn btn-soft-info btn-icon btn-circle btn-sm" title="{{ translate('Edit') }}">
                                                <i class="las la-edit"></i>
                                            </a>
                                        @endcan
                                        @can('delete_sect')
                                            <a href="javascript:void(0);" data-href="{{route('sects.destroy', $sect->id)}}" class="btn btn-soft-danger btn-icon btn-circle btn-sm confirm-delete" title="{{ translate('Delete') }}">
                                                <i class="las la-trash"></i>
                                            </a>
                                        @endcan
                                    </td>
                                </tr>
                            @endforeach
                        </tbody>
                    </table>
                    <div class="aiz-pagination">
                        {{ $sects->appends(request()->input())->links() }}
                    </div>
                </div>
            </form>
        </div>
    </div>
    @can('add_sect')
        <div class="col-lg-5">
            <div class="card">
                <div class="card-header">
                    <h5 class="mb-md-0 h6">{{ translate('Add New Sect') }}</h5>
                </div>
                <div class="card-body">
                    <form action="{{ route('sects.store') }}" method="POST">
                        @csrf
                        <div class="form-group mb-3">
                            <label for="name">{{translate('Sect Name')}}</label>
                            <input type="text" id="name" name="name" placeholder="{{ translate('Sect Name') }}" class="form-control" required>
                            @error('name')
                                <small class="form-text text-danger">{{ $message }}</small>
                            @enderror
                        </div>
                        <div class="form-group mb-3 text-right">
                            <button type="submit" class="btn btn-primary">{{translate('Save New Sect')}}</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    @endcan
</div>
@endsection
@section('modal')
    @include('modals.delete_modal')
    @include('modals.bulk_delete_modal')
@endsection

@section('script')
    <script>
        function sort_sects(el){
            $('#sort_sects').submit();
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
            var data = new FormData($('#sort_sects')[0]);
            $.ajax({
                headers: {
                    'X-CSRF-TOKEN': $('meta[name="csrf-token"]').attr('content')
                },
                url: "{{route('sect.bulk_delete')}}",
                type: 'POST',
                data: data,
                cache: false,
                contentType: false,
                processData: false,
                success: function (response) {
                    if(response == 1) {
                        location.reload();
                    }
                }
            });
        }
    </script>
@endsection
