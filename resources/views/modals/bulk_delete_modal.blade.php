<style>
/* Modal Title Styling */
.modal-title, .modal-title.h6 {
    font-weight: 600;
    font-size: 18px;
    color: #424242;
}

/* Primary Action Button */
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

.modal-body .btn-primary:hover {
    background: #c2185b;
    color: #fff;
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(226, 71, 111, 0.3);
}

/* Link Button */
.modal-body .btn-link {
    background: #f8f9fa;
    color: #e2476f;
    border-radius: 25px;
    font-weight: 600;
    font-size: 14px;
    padding: 12px 30px;
    border: none;
    box-shadow: 0 4px 15px rgba(226, 71, 111, 0.08);
    transition: all 0.3s ease;
    text-decoration: none;
}

.modal-body .btn-link:hover {
    background: #eaeaea;
    color: #c2185b;
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(226, 71, 111, 0.15);
    text-decoration: none;
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

<div id="bulk-delete-modal" class="modal fade">
    <div class="modal-dialog modal-sm modal-dialog-centered">
        <div class="modal-content">
            <div class="modal-header">
                <h4 class="modal-title h6">{{ translate('Delete Confirmation') }}</h4>
                <button type="button" class="close" data-dismiss="modal" aria-hidden="true"></button>
            </div>
            <div class="modal-body text-center">
                <p class="mt-1">{{ translate('Are you sure to delete those files?') }}</p>
                <button type="button" class="btn btn-link mt-2" data-dismiss="modal">{{ translate('Cancel') }}</button>
                <a href="javascript:void(0)" onclick="bulk_delete()" class="btn btn-primary mt-2">{{ translate('Delete') }}</a>
            </div>
        </div>
    </div>
</div>