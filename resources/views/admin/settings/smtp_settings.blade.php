@extends('admin.layouts.app')

@section('content')
    @php
        $mailDriver = config('mail.default', 'smtp');
        $mailHost = config('mail.mailers.smtp.host') ?: 'smtp-relay.brevo.com';
        $mailPort = config('mail.mailers.smtp.port') ?: '587';
        $mailUsername = config('mail.mailers.smtp.username');
        $mailEncryption = config('mail.mailers.smtp.encryption') ?: 'tls';
        $mailFromAddress = config('mail.from.address') ?: 'noreply@doctormarriagebureau.com.pk';
        $mailFromName = config('mail.from.name') ?: config('app.name', 'Doctor Marriage Bureau');
    @endphp
    <div class="row">
        <div class="col-md-6">
            <div class="card">
                <div class="card-header">
                    <h5 class="mb-0 h6">{{translate('SMTP Settings')}}</h5>
                </div>
                <div class="card-body">
                    <form action="{{ route('smtp_settings.update') }}" method="POST">
                        @csrf
                        <div class="form-group row">
                            <input type="hidden" name="types[]" value="MAIL_DRIVER">
                            <label class="col-md-3 col-form-label">{{translate('Type')}}</label>
                            <div class="col-md-9">
                                <select class="form-control aiz-selectpicker mb-2 mb-md-0" name="MAIL_DRIVER" onchange="checkMailDriver()">
                                    <option value="smtp" @if ($mailDriver == "smtp") selected @endif>{{ translate('SMTP') }}</option>
                                </select>
                            </div>
                        </div>
                        <div id="smtp">
                            <div class="form-group row">
                                <input type="hidden" name="types[]" value="MAIL_HOST">
                                <div class="col-md-3">
                                    <label class="col-from-label">{{translate('MAIL HOST')}}</label>
                                </div>
                                <div class="col-md-9">
                                    <input type="text" class="form-control" name="MAIL_HOST" value="{{ $mailHost }}" placeholder="smtp-relay.brevo.com">
                                </div>
                            </div>
                            <div class="form-group row">
                                <input type="hidden" name="types[]" value="MAIL_PORT">
                                <div class="col-md-3">
                                    <label class="col-from-label">{{translate('MAIL PORT')}}</label>
                                </div>
                                <div class="col-md-9">
                                    <input type="number" min="1" max="65535" class="form-control" name="MAIL_PORT" value="{{ $mailPort }}" placeholder="587">
                                </div>
                            </div>
                            <div class="form-group row">
                                <input type="hidden" name="types[]" value="MAIL_USERNAME">
                                <div class="col-md-3">
                                        <label class="col-from-label">{{translate('MAIL USERNAME')}}</label>
                                </div>
                                <div class="col-md-9">
                                    <input type="text" class="form-control" name="MAIL_USERNAME" value="{{ $mailUsername }}" placeholder="{{ translate('MAIL USERNAME') }}">
                                </div>
                            </div>
                            <div class="form-group row">
                                <input type="hidden" name="types[]" value="MAIL_PASSWORD">
                                <div class="col-md-3">
                                    <label class="col-from-label">{{translate('MAIL PASSWORD')}}</label>
                                </div>
                                <div class="col-md-9">
                                    <input type="password" class="form-control" name="MAIL_PASSWORD" value="" placeholder="{{ translate('Enter new SMTP API key') }}" autocomplete="new-password">
                                    <small class="form-text text-muted">{{ translate('Leave blank to keep the current SMTP API key.') }}</small>
                                </div>
                            </div>
                            <div class="form-group row">
                                <input type="hidden" name="types[]" value="MAIL_ENCRYPTION">
                                <div class="col-md-3">
                                    <label class="col-from-label">{{translate('MAIL ENCRYPTION')}}</label>
                                </div>
                                <div class="col-md-9">
                                    <select class="form-control aiz-selectpicker mb-2 mb-md-0" name="MAIL_ENCRYPTION">
                                        <option value="tls" @if ($mailEncryption == "tls") selected @endif>tls</option>
                                        <option value="ssl" @if ($mailEncryption == "ssl") selected @endif>ssl</option>
                                    </select>
                                </div>
                            </div>
                            <div class="form-group row">
                                <input type="hidden" name="types[]" value="MAIL_FROM_ADDRESS">
                                <div class="col-md-3">
                                    <label class="col-from-label">{{translate('MAIL FROM ADDRESS')}}</label>
                                </div>
                                <div class="col-md-9">
                                    <input type="email" class="form-control" name="MAIL_FROM_ADDRESS" value="{{ $mailFromAddress }}" placeholder="noreply@doctormarriagebureau.com.pk">
                                </div>
                            </div>
                            <div class="form-group row">
                                <input type="hidden" name="types[]" value="MAIL_FROM_NAME">
                                <div class="col-md-3">
                                    <label class="col-from-label">{{translate('MAIL FROM NAME')}}</label>
                                </div>
                                <div class="col-md-9">
                                    <input type="text" class="form-control" name="MAIL_FROM_NAME" value="{{ $mailFromName }}" placeholder="Doctor Marriage Bureau">
                                </div>
                            </div>
                        </div>

                        <div class="form-group mb-3 text-right">
                            <button type="submit" class="btn btn-primary">{{translate('Update')}}</button>
                        </div>
                    </form>
                </div>
            </div>
            <div class="card">
                <div class="card-header">
                    <h5 class="mb-0 h6">{{translate('Test SMTP configuration')}}</h5>
                </div>
                <div class="card-body">
                    <form action="{{ route('test.smtp') }}" method="post">
                        @csrf
                        <div class="row">
                            <div class="col">
                                <input type="email" class="form-control" name="email" value="{{ auth()->user()->email }}" placeholder="{{ translate('Enter your email address') }}">
                            </div>
                            <div class="col-auto">
                                <button type="submit" class="btn btn-primary">{{ translate('Send test email') }}</button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>
        <div class="col-md-6">
            <div class="card">
                <div class="card-header">
                    <h5 class="mb-0 h6">{{translate('Instruction')}}</h5>
                </div>
                <div class="card-body">
                    <p class="text-danger">{{ translate('Incorrect SMTP configuration can stop registration verification, password reset, security OTP, notification, and newsletter emails.') }}</p>
                    <h6 class="text-muted">{{ translate('Brevo SMTP') }}</h6>
                    <ul class="list-group">
                        <li class="list-group-item text-dark">{{ translate('Use SMTP as the mail driver.') }}</li>
                        <li class="list-group-item text-dark">{{ translate('Set Mail Host to smtp-relay.brevo.com.') }}</li>
                        <li class="list-group-item text-dark">{{ translate('Set Mail Port to 587.') }}</li>
                        <li class="list-group-item text-dark">{{ translate('Set Mail Encryption to tls.') }}</li>
                        <li class="list-group-item text-dark">{{ translate('Use your Brevo SMTP login as the username and your Brevo SMTP API key as the password.') }}</li>
                    </ul>
                </div>
            </div>
        </div>
    </div>
@endsection

@section('script')

    <script type="text/javascript">
        $(document).ready(function(){
            checkMailDriver();
        });
        function checkMailDriver(){
            $('#smtp').show();
        }
    </script>

@endsection
