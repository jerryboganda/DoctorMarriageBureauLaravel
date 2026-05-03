<form action="{{ route('profile-option-values.update', $option->id) }}" method="POST">
    <input name="_method" type="hidden" value="PATCH">
    @csrf
    <div class="modal-header">
        <h5 class="modal-title h6">{{translate('Edit Profile Option')}}</h5>
        <button type="button" class="close" data-dismiss="modal"></button>
    </div>
    <div class="modal-body">
        <div class="form-group row">
            <label class="col-md-3 col-form-label">{{translate('Group')}}</label>
            <div class="col-md-9">
                <select name="group" class="form-control" required>
                    @foreach($allGroups as $key => $label)
                        <option value="{{ $key }}" {{ $option->group == $key ? 'selected' : '' }}>{{ translate($label) }}</option>
                    @endforeach
                </select>
            </div>
        </div>
        <div class="form-group row">
            <label class="col-md-3 col-form-label">{{translate('Value')}}</label>
            <div class="col-md-9">
                <input type="text" name="value" value="{{ $option->value }}" class="form-control" placeholder="{{translate('Value')}}" required>
                <small class="form-text text-muted">{{ translate('The stored key (changing this may affect existing user data)') }}</small>
            </div>
        </div>
        <div class="form-group row">
            <label class="col-md-3 col-form-label">{{translate('Label')}}</label>
            <div class="col-md-9">
                <input type="text" name="label" value="{{ $option->label }}" class="form-control" placeholder="{{translate('Display Label')}}" required>
            </div>
        </div>
        <div class="form-group row">
            <label class="col-md-3 col-form-label">{{translate('Sort Order')}}</label>
            <div class="col-md-9">
                <input type="number" name="sort_order" value="{{ $option->sort_order }}" class="form-control" min="0">
            </div>
        </div>
        <div class="form-group row">
            <label class="col-md-3 col-form-label">{{translate('Active')}}</label>
            <div class="col-md-9">
                <div class="custom-control custom-checkbox mt-2">
                    <input type="checkbox" class="custom-control-input" id="edit_is_active" name="is_active" {{ $option->is_active ? 'checked' : '' }}>
                    <label class="custom-control-label" for="edit_is_active">{{translate('Visible to users')}}</label>
                </div>
            </div>
        </div>
    </div>
    <div class="modal-footer">
        <button type="button" class="btn btn-light" data-dismiss="modal">{{translate('Close')}}</button>
        <button type="submit" class="btn btn-primary">{{translate('Update')}}</button>
    </div>
</form>
