<form action="{{ route('countries.update', $country->id) }}" method="POST">
    <input name="_method" type="hidden" value="PATCH">
    @csrf
    <div class="modal-header">
        <h5 class="modal-title h6">{{translate('Edit Country Info')}}</h5>

        <button type="button" class="close" data-dismiss="modal">
        </button>
    </div>
    <div class="modal-body">
        <div class="form-group row">
            <label class="col-md-3 col-form-label">{{translate('Name')}}</label>
            <div class="col-md-9">
                <input type="text" id="name" name="name" value="{{$country->name}}" class="form-control" placeholder="{{translate('Name')}}" required>
                @error('name')
                    <small class="form-text text-danger">{{ $message }}</small>
                @enderror
            </div>
        </div>
        <div class="form-group row">
            <label class="col-md-3 col-form-label">{{translate('Country Code')}}</label>
            <div class="col-md-9">
                <input type="text" id="code" name="code" value="{{$country->code}}" class="form-control" placeholder="{{translate('Country Code (e.g., US, UK, PK)')}}" required>
                @error('code')
                    <small class="form-text text-danger">{{ $message }}</small>
                @enderror
            </div>
        </div>
    </div>
    <div class="modal-footer">
        <button type="button" class="btn btn-light" data-dismiss="modal">{{translate('Close')}}</button>
        <button type="submit" class="btn btn-primary">{{translate('Update')}}</button>
    </div>
</form>
