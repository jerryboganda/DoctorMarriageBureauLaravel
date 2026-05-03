@extends('admin.layouts.app')
@section('content')
<div class="aiz-titlebar mt-2 mb-4">
    <div class="row align-items-center">
        <div class="col-md-6">
            <h1 class="h3">{{ translate('Verification Requests') }}</h1>
        </div>
    </div>
</div>
<div class="row">
    <div class="col-lg-12">
        <div class="card">
            <div class="card-header row gutters-5">
                <div class="col text-center text-md-left">
                    <h5 class="mb-md-0 h6">{{ translate('All Verification Requests') }}</h5>
                </div>
                <div class="col-md-2">
                    <select class="form-control form-control-sm aiz-selectpicker" id="filter_status" onchange="filterRequests()">
                        <option value="all" {{ $filter_status == 'all' ? 'selected' : '' }}>{{ translate('All') }}</option>
                        <option value="pending" {{ $filter_status == 'pending' ? 'selected' : '' }}>{{ translate('Pending') }}</option>
                        <option value="approved" {{ $filter_status == 'approved' ? 'selected' : '' }}>{{ translate('Approved') }}</option>
                    </select>
                </div>
                <div class="col-md-3">
                    <form id="sort_requests" action="" method="GET">
                        <input type="hidden" name="status" value="{{ $filter_status }}">
                        <div class="input-group input-group-sm">
                            <input type="text" class="form-control" id="search" name="search"
                                @isset($sort_search) value="{{ $sort_search }}" @endisset
                                placeholder="{{ translate('Name / Code / Phone & Enter') }}">
                        </div>
                    </form>
                </div>
            </div>
            <div class="card-body">
                <table class="table aiz-table mb-0">
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>{{ translate('Image') }}</th>
                            <th>{{ translate('Member Code') }}</th>
                            <th>{{ translate('Name') }}</th>
                            <th data-breakpoints="md">{{ translate('Email / Phone') }}</th>
                            <th data-breakpoints="md">{{ translate('Submitted On') }}</th>
                            <th data-breakpoints="md">{{ translate('Verification Status') }}</th>
                            <th data-breakpoints="md">{{ translate('Documents') }}</th>
                            <th class="text-right">{{ translate('Actions') }}</th>
                        </tr>
                    </thead>
                    <tbody>
                        @forelse($members as $key => $member)
                            <tr>
                                <td>{{ ($key+1) + ($members->currentPage() - 1)*$members->perPage() }}</td>
                                <td>
                                    @if(uploaded_asset($member->photo) != null)
                                        <img class="img-md rounded" src="{{ uploaded_asset($member->photo) }}" height="45px" alt="{{ translate('photo') }}">
                                    @else
                                        <img class="img-md rounded" src="{{ static_asset('assets/img/avatar-place.png') }}" height="45px" alt="{{ translate('photo') }}">
                                    @endif
                                </td>
                                <td><span class="badge badge-inline badge-secondary">{{ $member->code }}</span></td>
                                <td>
                                    <strong>{{ $member->first_name . ' ' . $member->last_name }}</strong>
                                </td>
                                <td>
                                    <span class="d-block text-muted">{{ $member->email ?? '-' }}</span>
                                    <span class="d-block text-muted">{{ $member->phone ?? '-' }}</span>
                                </td>
                                <td>{{ $member->updated_at ? $member->updated_at->format('d M Y, h:i A') : '-' }}</td>
                                <td>
                                    @if($member->approved == 1)
                                        <span class="badge badge-inline badge-success">{{ translate('Approved') }}</span>
                                    @else
                                        <span class="badge badge-inline badge-warning">{{ translate('Pending') }}</span>
                                    @endif
                                </td>
                                <td>
                                    @php $verInfo = json_decode($member->verification_info); @endphp
                                    @if(is_array($verInfo))
                                        @foreach($verInfo as $info)
                                            @if($info->type == 'file')
                                                <a href="{{ static_asset($info->value) }}" target="_blank" class="btn btn-xs btn-soft-info mb-1">
                                                    <i class="las la-file-alt mr-1"></i>{{ $info->label }}
                                                </a>
                                            @endif
                                        @endforeach
                                    @endif
                                </td>
                                <td class="text-right">
                                    @if(($member->whatsapp_available ?? false) && !empty($member->whatsapp_link))
                                        <a href="{{ $member->whatsapp_link }}" target="_blank" rel="noopener noreferrer" class="btn btn-sm btn-soft-success mb-1" title="{{ translate('Contact on WhatsApp') }}">
                                            <i class="lab la-whatsapp"></i>
                                        </a>
                                    @else
                                        <button type="button" class="btn btn-sm btn-soft-secondary mb-1" title="{{ $member->whatsapp_unavailable_reason ?? translate('WhatsApp unavailable: invalid or missing phone number') }}" disabled>
                                            <i class="lab la-whatsapp"></i>
                                        </button>
                                    @endif
                                    <a href="{{ route('member.show_verification_info', encrypt($member->id)) }}" class="btn btn-sm btn-soft-primary mb-1" title="{{ translate('View Details') }}">
                                        <i class="las la-eye"></i>
                                    </a>
                                    @if($member->approved != 1)
                                        <a href="javascript:void(0);" onclick="verify_member('{{ route('member.approve_verification', $member->id) }}','approve')" class="btn btn-sm btn-soft-success mb-1" title="{{ translate('Approve') }}">
                                            <i class="las la-check"></i>
                                        </a>
                                        <a href="javascript:void(0);" onclick="verify_member('{{ route('member.reject_verification', $member->id) }}','reject')" class="btn btn-sm btn-soft-danger mb-1" title="{{ translate('Reject') }}">
                                            <i class="las la-times"></i>
                                        </a>
                                    @else
                                        <span class="text-muted text-sm"><i class="las la-check-circle text-success"></i></span>
                                    @endif
                                </td>
                            </tr>
                        @empty
                            <tr>
                                <td colspan="9" class="text-center text-muted py-4">
                                    <i class="las la-inbox" style="font-size: 40px;"></i>
                                    <p class="mt-2">{{ translate('No verification requests found.') }}</p>
                                </td>
                            </tr>
                        @endforelse
                    </tbody>
                </table>
                <div class="aiz-pagination">
                    {{ $members->appends(request()->input())->links() }}
                </div>
            </div>
        </div>
    </div>
</div>
@endsection

@section('modal')
    {{-- Verification Confirm Modal --}}
    <div class="modal fade member-verification-modal" id="modal-basic">
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h4 class="modal-title h6">{{ translate('Member Verification') }}</h4>
                    <button type="button" class="close" data-dismiss="modal" aria-hidden="true"></button>
                </div>
                <div class="modal-body text-center">
                    <p class="mt-1" id="verify_member_text"></p>
                    <button type="button" class="btn btn-sm btn-light mt-2" data-dismiss="modal">{{ translate('Cancel') }}</button>
                    <a type="submit" class="btn btn-sm btn-primary mt-2" id="confirm-link">{{ translate('Confirm') }}</a>
                </div>
            </div>
        </div>
    </div>
@endsection

@section('script')
<script type="text/javascript">
    function verify_member(url, status) {
        var confirmation_text = status == 'approve' ?
            "{{ translate('Are you sure to approve this verification?') }}" :
            "{{ translate('Are you sure to reject this verification?') }}";

        $('.member-verification-modal').modal('show');
        $('#verify_member_text').html(confirmation_text);
        $("#confirm-link").attr("href", url);
    }

    function filterRequests() {
        var status = document.getElementById('filter_status').value;
        var search = document.getElementById('search').value;
        var url = "{{ route('verification_requests') }}?status=" + status;
        if (search) url += "&search=" + search;
        window.location.href = url;
    }
</script>
@endsection
