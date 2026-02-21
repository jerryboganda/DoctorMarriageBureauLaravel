<style>
/* Modal Title Styling */
.modal-title, .modal-title.h6 {
    font-weight: 600;
    font-size: 18px;
    color: #424242;
}

/* Primary Action Button */
.modal-footer .btn-primary,
.modal-body .btn-primary {
    background: #e2476f;
    color: #fff;
    border-radius: 25px;
    font-weight: 600;
    font-size: 14px;
    padding: 12px 30px;
    border: none;
    transition: all 0.3s ease;
    box-shadow: 0 4px 15px rgba(226, 71, 111, 0.2);
}

.modal-footer .btn-primary:hover,
.modal-body .btn-primary:hover {
    background: #c2185b;
    color: #fff;
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(226, 71, 111, 0.3);
}

/* Secondary Action Button */
.modal-footer .btn-light,
.modal-body .btn-light,
.modal-footer .btn-secondary,
.modal-body .btn-secondary {
    background: #f8f9fa;
    color: #e2476f;
    border-radius: 25px;
    font-weight: 600;
    font-size: 14px;
    padding: 12px 30px;
    border: none;
    box-shadow: 0 4px 15px rgba(226, 71, 111, 0.08);
    transition: all 0.3s ease;
}

.modal-footer .btn-light:hover,
.modal-body .btn-light:hover,
.modal-footer .btn-secondary:hover,
.modal-body .btn-secondary:hover {
    background: #eaeaea;
    color: #c2185b;
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(226, 71, 111, 0.15);
}

/* Modal Content Styling */
.modal-content {
    border-radius: 15px;
    border: none;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
}

.modal-header {
    border-bottom: 1px solid #f3b3c3;
    padding: 20px 24px 15px;
    border-radius: 15px 15px 0 0;
}

.modal-body {
    padding: 20px 24px;
}

.modal-footer {
    border-top: 1px solid #f3b3c3;
    padding: 15px 24px 20px;
    border-radius: 0 0 15px 15px;
}

.modal-header .close {
    color: #e2476f;
    opacity: 0.8;
    transition: all 0.3s ease;
}

.modal-header .close:hover {
    opacity: 1;
    color: #c2185b;
}
</style>

<div class="modal-header">
    <h5 class="modal-title h6">{{translate('Running Package Information')}}</h5>
    <button type="button" class="close" data-dismiss="modal">
    </button>
</div>
<div class="modal-body">
    <table class="table table-bordered">
        <tbody>
            <tr>
                <th>{{translate('Package Name')}}</th>
                <td>{{ $member->package->name }}</td>
            </tr>
            <tr>
                <th>{{translate('Remaining Interests')}}</th>
                <td>{{ $member->remaining_interest }}</td>
            </tr>
            <tr>
                <th>{{translate('Remaining Photo Gallery')}}</th>
                <td>{{ $member->remaining_photo_gallery }}</td>
            </tr>
            <tr>
                <th>{{translate('Remaining Contact View')}}</th>
                <td>{{ $member->remaining_contact_view }}</td>
            </tr>
            <tr>
                <th>{{translate('Remaining Profile Viewer View')}}</th>
                <td>{{ $member->remaining_profile_viewer_view }}</td>
            </tr>
            <tr>
                <th>{{translate('Remaining Profile Image View')}}</th>
                <td>{{ $member->remaining_profile_image_view }}</td>
            </tr>
            <tr>
                <th>{{translate('Remaining Gallery Image View')}}</th>
                <td>{{ $member->remaining_gallery_image_view }}</td>
            </tr>
            <tr>
                <th>{{translate('Auto Profile Match Show')}}</th>
                <td>
                  @if($member->auto_profile_match == 1)
                      <span class="badge badge-inline badge-success">{{translate('On')}}</span>
                  @else
                      <span class="badge badge-inline badge-danger">{{translate('Off')}}</span>
                  @endif
                </td>
            </tr>
            <tr>
                <th>{{translate('Validity')}}</th>
                <td>
                  @if(package_validity($member->user_id))
                    {{ $member->package_validity }}
                  @else
                      <span class="badge badge-inline badge-danger">{{translate('Expired')}}</span>
                  @endif
                </td>
            </tr>
        </tbody>
    </table>
</div>
<div class="modal-footer">
    <button class="btn btn-success" onclick="get_package({{ $member->id }});">{{translate('Upgrade Package')}}</button>
</div>
