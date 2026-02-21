<style>
/* Modal Title Styling */
.modal-title, .modal-title.h6 {
    font-weight: 600;
    font-size: 18px;
    color: #424242;
}

/* Primary Action Button */
.modal-footer .btn-primary,
#confirm_button {
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
#confirm_button:hover {
    background: #c2185b;
    color: #fff;
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(226, 71, 111, 0.3);
}

/* Secondary Action Button */
.modal-footer .btn-light {
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

.modal-footer .btn-light:hover {
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

<div class="modal fade confirm_modal" id="modal-basic">
  <div class="modal-dialog">
    <div class="modal-content">
        <div class="modal-header">
              <h5 class="modal-title h6" id="confirm_modal_title"></h5>
            <button type="button" class="close" data-dismiss="modal"></button>
        </div>
        <div class="modal-body text-center" id="confirm_modal_content">
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-light" data-dismiss="modal">{{ translate('Close') }}</button>
          <button type="submit" class="btn btn-primary" id="confirm_button">{{translate('Confirm')}}</button>
        </div>
      </div>
  </div>
</div>
