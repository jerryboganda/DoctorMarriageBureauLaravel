<form action="{{ route('specialities.update', $speciality->id) }}" method="POST">
    <input name="_method" type="hidden" value="PATCH">
    @csrf
    <div class="modal-header">
        <h5 class="modal-title h6">{{translate('Edit Speciality')}}</h5>
        <button type="button" class="close" data-dismiss="modal"></button>
    </div>
    <div class="modal-body">
        <div class="form-group row">
            <label class="col-md-3 col-form-label">{{translate('Name')}}</label>
            <div class="col-md-9">
                <input type="text" name="name" value="{{$speciality->name}}" class="form-control" placeholder="{{translate('Name')}}" required>
            </div>
        </div>
    </div>
    <div class="modal-footer">
        <button type="button" class="btn btn-light" data-dismiss="modal">{{translate('Close')}}</button>
        <button type="submit" class="btn btn-primary">{{translate('Update')}}</button>
    </div>
</form>
