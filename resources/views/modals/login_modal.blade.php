<style>
/* Modal Title Styling */
.modal-title, .modal-title.fw-600 {
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

/* Outline Button Styling */
.modal-body .btn-outline-primary {
    background: transparent;
    color: #e2476f;
    border: 2px solid #e2476f;
    border-radius: 20px;
    font-weight: 600;
    font-size: 12px;
    padding: 8px 20px;
    transition: all 0.3s ease;
}

.modal-body .btn-outline-primary:hover {
    background: #e2476f;
    color: #fff;
    border-color: #e2476f;
    transform: translateY(-1px);
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

<div class="modal fade" id="LoginModal">
    <div class="modal-dialog modal-dialog-zoom">
        <div class="modal-content">
            <div class="modal-header">
                <h6 class="modal-title fw-600">{{ translate('Login')}}</h6>
                <button type="button" class="close" data-dismiss="modal">
                    <span aria-hidden="true"></span>
                </button>
            </div>
            <div class="modal-body">
                <div class="p-3">
                    <form class="" method="POST" action="{{ route('login') }}">
                        @csrf
                        <div class="form-group">
                            <label class="form-label" for="email">
                                {{ addon_activation('otp_system') ? translate('Email/Phone') : translate('Email') }}
                            </label>
                            @if (addon_activation('otp_system'))
                                <input type="text" class="form-control {{ $errors->has('email') ? ' is-invalid' : '' }}" value="{{ old('email') }}" placeholder="{{ translate('Email Or Phone')}}" name="email" id="email">
                            @else
                                <input type="email" class="form-control {{ $errors->has('email') ? ' is-invalid' : '' }}" value="{{ old('email') }}" placeholder="{{  translate('Email') }}" name="email" id="email">
                            @endif
                            @if (addon_activation('otp_system'))
                                <span class="opacity-60">{{ translate('Use country code before number') }}</span>
                            @endif
                        </div>

                        <div class="form-group">
                            <label class="form-label" for="password">{{ translate('Password') }}</label>
                            <x-password-field
                                id="password"
                                name="password"
                                placeholder="********"
                                wrapperClass=""
                                inputClass="form-control @error('password') is-invalid @enderror"
                                errorName="password"
                                required
                            />
                        </div>

                        <div class="mb-3 text-right">
                            <a class="link-muted text-capitalize font-weight-normal" href="{{ route('password.request') }}">{{ translate('Forgot Password?') }}</a>
                        </div>

                        {{-- <div class="mb-5"> --}}
                            <button type="submit" class="btn btn-block btn-primary">{{ translate('Login to your Account') }}</button>
                        {{-- </div> --}}
                    </form>
                    @if (env("DEMO_MODE") == "On")
                        <div class="mb-4 mt-4">
                            <table class="table table-bordered">
                                <tbody>
                                    <tr>
                                        <td>user2@example.com</td>
                                        <td>12345678</td>
                                        <td><button class="btn btn-outline-primary btn-xs" onclick="autoFill1()">{{ translate('Copy') }}</button></td>
                                    </tr>
                                    <tr>
                                        <td>user17@example.com</td>
                                        <td>12345678</td>
                                        <td><button class="btn btn-outline-primary btn-xs" onclick="autoFill2()">{{ translate('Copy') }}</button></td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    @endif


                    {{-- Social media Login --}}
                    @if(get_setting('google_login_activation') == 1 || get_setting('facebook_login_activation') == 1 || get_setting('twitter_login_activation') == 1 || get_setting('apple_login_activation') == 1)
                        <div class="separator mb-3 mt-4">
                            <span class="bg-white px-3 opacity-60">{{ translate('Or Login With')}}</span>
                        </div>
                        <ul class="list-inline social colored text-center mb-3">
                            @if (get_setting('facebook_login_activation') == 1)
                                <li class="list-inline-item">
                                    <a href="{{ route('social.login', ['provider' => 'facebook']) }}" class="facebook">
                                        <i class="lab la-facebook-f"></i>
                                    </a>
                                </li>
                            @endif
                            @if(get_setting('google_login_activation') == 1)
                                <li class="list-inline-item">
                                    <a href="{{ route('social.login', ['provider' => 'google']) }}" class="google">
                                        <i class="lab la-google"></i>
                                    </a>
                                </li>
                            @endif
                            @if (get_setting('twitter_login_activation') == 1)
                                <li class="list-inline-item">
                                    <a href="{{ route('social.login', ['provider' => 'twitter']) }}" class="twitter">
                                        <i class="lab la-twitter"></i>
                                    </a>
                                </li>
                            @endif
                            @if (get_setting('apple_login_activation') == 1)
                                <li class="list-inline-item">
                                    <a href="{{ route('social.login', ['provider' => 'apple']) }}" class="apple">
                                        <i class="lab la-apple"></i>
                                    </a>
                                </li>
                            @endif
                        </ul>
                    @endif

                    <div class="text-center">
                        <p class="text-muted mb-0">{{ translate("Don't have an account?") }}</p>
                        <a href="{{ route('register') }}">{{ translate('Create an account') }}</a>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>
