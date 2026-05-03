<div class="card-header bg-dark text-white">
    <h5 class="mb-0 h6">{{translate('Basic Information')}}</h5>
</div>
<div class="card-body">

    <form action="{{ route('member.basic_info_update', $member->id) }}#basic_information" method="POST">
        @csrf
        <div class="form-group row">
            <div class="col-md-6">
                <label for="first_name" >{{translate('First Name')}}
                    <span class="text-danger">*</span>
                </label>
                <input type="text" name="first_name" value="{{ $member->first_name }}" class="form-control" placeholder="{{translate('First Name')}}" required>
                @error('first_name')
                    <small class="form-text text-danger">{{ $message }}</small>
                @enderror
            </div>
            <div class="col-md-6">
                <label for="first_name" >{{translate('Last Name')}}
                    <span class="text-danger">*</span>
                </label>
                <input type="text" name="last_name" value="{{ $member->last_name }}" class="form-control" placeholder="{{translate('Last Name')}}" required>
                @error('last_name')
                    <small class="form-text text-danger">{{ $message }}</small>
                @enderror
            </div>
        </div>

        <div class="form-group row">
            <div class="col-md-6">
                <label for="first_name" >{{translate('Gender')}}
                    <span class="text-danger">*</span>
                </label>
                <select class="form-control aiz-selectpicker" name="gender" required>
                    <option value="1" @if($member->member->gender ==  1) selected @endif >{{translate('Male')}}</option>
                    <option value="2" @if($member->member->gender ==  2) selected @endif >{{translate('Female')}}</option>
                    @error('gender')
                        <small class="form-text text-danger">{{ $message }}</small>
                    @enderror
                </select>
            </div>
            <div class="col-md-6">
                <label for="first_name" >{{translate('Date Of Birth')}}
                    <span class="text-danger">*</span>
                </label>
                <input type="text" class="aiz-date-range form-control" value="@if(!empty($member->member->birthday)) {{date('Y-m-d', strtotime($member->member->birthday))}} @endif" name="date_of_birth"  placeholder="Select Date" data-single="true" data-show-dropdown="true" data-max-date="{{ get_max_date() }}" autocomplete="off" required>
                @error('date_of_birth')
                    <small class="form-text text-danger">{{ $message }}</small>
                @enderror
            </div>
        </div>

        <div class="form-group row">
            <input type="hidden" name="email" value="{{ $member->email }}">
            <div class="col-md-6">
                <label for="email" >{{translate('Email')}}</label>
                <input type="email" name="email" value="{{ $member->email }}" class="form-control" placeholder="{{translate('Email')}}" disabled>
                @error('email')
                    <small class="form-text text-danger">{{ $message }}</small>
                @enderror
            </div>
            <div class="col-md-6">
                <label for="first_name" >{{translate('Phone Number')}}</label>
                <input type="text" name="phone" value="{{ $member->phone }}" class="form-control" placeholder="{{translate('Phone')}}">
                @error('phone')
                    <small class="form-text text-danger">{{ $message }}</small>
                @enderror
            </div>
        </div>
        <div class="form-group row">
            <div class="col-md-6">
                <label for="first_name" >{{translate('On Behalf')}}
                    <span class="text-danger">*</span>
                </label>
                <select class="form-control aiz-selectpicker" name="on_behalf" data-selected="{{ $member->member->on_behalves_id }}" data-live-search="true" required>
                    @foreach ($on_behalves as $on_behalf)
                        <option value="{{$on_behalf->id}}">{{$on_behalf->name}}</option>
                    @endforeach
                </select>
                @error('on_behalf')
                    <small class="form-text text-danger">{{ $message }}</small>
                @enderror
            </div>
            <div class="col-md-6">
                <label for="first_name" >{{translate('Annual Salary')}}
                    <span class="text-danger">*</span>
                </label>
                <select class="form-control aiz-selectpicker" name="annual_salary_range" data-selected="{{ $member->member->annual_salary_range_id }}" data-live-search="true" required>
                    @foreach ($annual_salary_ranges as $annual_salary_range)
                        <option value="{{$annual_salary_range->id}}">{{ single_price($annual_salary_range->min_salary) }} - {{ single_price($annual_salary_range->max_salary) }}</option>
                    @endforeach
                </select>
                @error('on_behalf')
                    <small class="form-text text-danger">{{ $message }}</small>
                @enderror
            </div>
        </div>
        <div class="form-group row">
            <div class="col-md-6">
                <label for="first_name" >{{translate('Marital Status')}}
                    <span class="text-danger">*</span>
                </label>
                <select class="form-control aiz-selectpicker" name="marital_status" data-selected="{{ $member->member->marital_status_id }}" data-live-search="true" required>
                    @foreach ($marital_statuses as $marital_status)
                        <option value="{{$marital_status->id}}">{{$marital_status->name}}</option>
                    @endforeach
                </select>
                @error('marital_status')
                    <small class="form-text text-danger">{{ $message }}</small>
                @enderror
            </div>
            <div class="col-md-6">
                <label for="first_name" >{{translate('Number Of Children')}}
                    <span class="text-danger">*</span>
                </label>
                <input type="text" name="children" value="{{ $member->member->children }}" class="form-control" placeholder="{{translate('Number Of Children')}}" >
            </div>
        </div>
        <div class="form-group row">
            <div class="col-md-12">
              <label class="" for="signinSrEmail">{{translate('Photo')}}</small></label>
                <div class="input-group" data-toggle="aizuploader" data-type="image">
                    <div class="input-group-prepend">
                        <div class="input-group-text bg-soft-secondary font-weight-medium">{{ translate('Browse')}}</div>
                    </div>
                    <div class="form-control file-amount">{{ translate('Choose File') }}</div>
                    <input type="hidden" name="photo" class="selected-files" value="{{ $member->photo}}">
                </div>
                <div class="file-preview box sm">
                </div>
            </div>
        </div>
        <div class="text-right">
            <button type="submit" class="btn btn-primary btn-sm">{{translate('Update')}}</button>
        </div>
    </form>

    <hr class="my-4">

    <div class="border rounded p-3 bg-light">
        <h6 class="mb-3">{{ translate('Set Login Password') }}</h6>
        <div class="form-group row">
            <div class="col-md-6">
                <label class="d-block mb-1">{{ translate('Social Linked') }}</label>
                <span class="badge badge-{{ !empty($member->provider_id) ? 'info' : 'secondary' }}">
                    {{ !empty($member->provider_id) ? translate('Yes') : translate('No') }}
                </span>
            </div>
            <div class="col-md-6">
                <label class="d-block mb-1">{{ translate('Local Password Set') }}</label>
                <span class="badge badge-{{ $member->hasUsablePassword() ? 'success' : 'warning' }}">
                    {{ $member->hasUsablePassword() ? translate('Yes') : translate('No') }}
                </span>
            </div>
        </div>

        <form action="{{ route('members.set_password', $member->id) }}#basic_information" method="POST" autocomplete="off">
            @csrf
            <div class="form-group row">
                <div class="col-md-6">
                    <label>{{ translate('New Password') }} <span class="text-danger">*</span></label>
                    <x-password-field
                        id="new_password"
                        name="new_password"
                        placeholder="{{ translate('Enter password') }}"
                        wrapperClass=""
                        inputClass="form-control"
                        errorName=""
                        required
                    />
                    @error('new_password')
                        <small class="form-text text-danger">{{ $message }}</small>
                    @enderror
                </div>
                <div class="col-md-6">
                    <label>{{ translate('Confirm Password') }} <span class="text-danger">*</span></label>
                    <x-password-field
                        id="new_password_confirmation"
                        name="new_password_confirmation"
                        placeholder="{{ translate('Confirm password') }}"
                        wrapperClass=""
                        inputClass="form-control"
                        errorName=""
                        required
                    />
                    @error('new_password_confirmation')
                        <small class="form-text text-danger">{{ $message }}</small>
                    @enderror
                </div>
            </div>
            <small class="text-muted d-block mb-3">
                {{ translate('User will be forced to change this password at next login.') }}
            </small>
            <div class="text-right">
                <button type="submit" class="btn btn-dark btn-sm">{{ translate('Set Password') }}</button>
            </div>
        </form>
    </div>
</div>
