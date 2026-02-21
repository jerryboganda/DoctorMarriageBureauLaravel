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
    <h5 class="modal-title h6">{{translate('Wallet Balance Update')}}</h5>
    <button type="button" class="close" data-dismiss="modal">
    </button>
</div>
<div class="modal-body">
  <div class="row">
      <div class="col-md-4">
          <label>{{ translate('Current Balance')}} <span class="text-danger">*</span></label>
      </div>
      <div class="col-md-8 ">
          <input type="number" lang="en" class="form-control mb-3" value="{{ $user->balance }}">
      </div>
  </div>
  <div class="row">
      <div class="col-md-4">
          <label>{{ translate('Balance Update Type')}} <span class="text-danger">*</span></label>
      </div>
      <div class="col-md-8">
          <select class="form-control selectpicker" name="payment_option" data-live-search="true">
            <option value="add">{{translate('Add')}}</option>
            <option value="deduct">{{translate('Deduct')}}</option>
          </select>
      </div>
  </div>
  <div class="row">
      <div class="col-md-4">
          <label>{{ translate('Amount')}} <span class="text-danger">*</span></label>
      </div>
      <div class="col-md-8">
          <input type="number" lang="en" class="form-control mb-3" name="amount" placeholder="{{ translate('Amount')}}" required>
      </div>
  </div>
</div>
<div class="modal-footer">
</div>
