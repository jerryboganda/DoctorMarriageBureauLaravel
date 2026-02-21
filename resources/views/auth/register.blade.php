@extends('layouts.app')

@section('content')
<style>
    .register-container {
        min-height: calc(100vh - 100px);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 40px 20px;
    }
    .logo-section {
        display: flex;
        flex-direction: column;
        align-items: center;
        margin-bottom: 30px;
        text-align: center;
    }
    .logo-section i {
        font-size: 56px;
        color: #ca8a04;
        margin-bottom: 12px;
    }
    .logo-section h1 {
        font-family: 'Playfair Display', serif;
        color: #ca8a04;
        font-size: 28px;
        font-weight: 700;
        letter-spacing: 0.1em;
        margin: 0;
    }
    .register-card {
        background: rgba(15, 23, 42, 0.85);
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 24px;
        padding: 40px;
        box-shadow: 0 25px 50px rgba(0,0,0,0.3);
        width: 100%;
        max-width: 600px;
    }
    .card-header {
        background: transparent !important;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1) !important;
        color: white !important;
        font-size: 20px !important;
        font-weight: 700 !important;
        padding: 0 0 20px 0 !important;
        margin-bottom: 30px !important;
        text-align: center;
    }
    .col-form-label {
        color: rgba(255, 255, 255, 0.7) !important;
        font-weight: 500 !important;
    }
    .form-control {
        background: rgba(255, 255, 255, 0.05) !important;
        border: 1px solid rgba(255, 255, 255, 0.1) !important;
        color: white !important;
        height: 50px !important;
        border-radius: 12px !important;
    }
    .form-control:focus {
        background: rgba(255, 255, 255, 0.08) !important;
        border-color: #ca8a04 !important;
        box-shadow: 0 0 0 2px rgba(202, 138, 4, 0.2) !important;
    }
    .btn-primary {
        background: #ca8a04 !important;
        border: none !important;
        border-radius: 12px !important;
        color: white !important;
        font-weight: 700 !important;
        height: 50px !important;
        font-size: 16px !important;
        transition: all 0.3s ease !important;
    }
    .btn-primary:hover {
        background: #a16207 !important;
        transform: translateY(-1px) !important;
        box-shadow: 0 4px 15px rgba(202, 138, 4, 0.3) !important;
    }
</style>

<div class="register-container">
    <div class="logo-section">
        <i class="las la-hospital-alt"></i>
        <h1>DOCTOR MARRIAGE BUREAU</h1>
    </div>

    <div class="register-card">
        <div class="card-header">{{ translate('Create Medical Profile') }}</div>

        <div class="card-body">
            <form method="POST" action="{{ route('register') }}">
                @csrf

                <div class="form-group row">
                    <label for="name" class="col-md-4 col-form-label text-md-right">{{ translate('Full Name') }}</label>

                    <div class="col-md-7">
                        <input id="name" type="text" class="form-control @error('name') is-invalid @enderror" name="name" value="{{ old('name') }}" required autocomplete="name" autofocus placeholder="Dr. John Doe">

                        @error('name')
                            <span class="invalid-feedback" role="alert">
                                <strong>{{ $message }}</strong>
                            </span>
                        @enderror
                    </div>
                </div>

                <div class="form-group row">
                    <label for="email" class="col-md-4 col-form-label text-md-right">{{ translate('E-Mail Address') }}</label>

                    <div class="col-md-7">
                        <input id="email" type="email" class="form-control @error('email') is-invalid @enderror" name="email" value="{{ old('email') }}" required autocomplete="email" placeholder="doctor@hospital.com">

                        @error('email')
                            <span class="invalid-feedback" role="alert">
                                <strong>{{ $message }}</strong>
                            </span>
                        @enderror
                    </div>
                </div>

                <div class="form-group row">
                    <label for="password" class="col-md-4 col-form-label text-md-right">{{ translate('Password') }}</label>

                    <div class="col-md-7">
                        <input id="password" type="password" class="form-control @error('password') is-invalid @enderror" name="password" required autocomplete="new-password">

                        @error('password')
                            <span class="invalid-feedback" role="alert">
                                <strong>{{ $message }}</strong>
                            </span>
                        @enderror
                    </div>
                </div>

                <div class="form-group row">
                    <label for="password-confirm" class="col-md-4 col-form-label text-md-right">{{ translate('Confirm Password') }}</label>

                    <div class="col-md-7">
                        <input id="password-confirm" type="password" class="form-control" name="password_confirmation" required autocomplete="new-password">
                    </div>
                </div>

                <div class="form-group row mb-0 mt-4">
                    <div class="col-md-7 offset-md-4">
                        <button type="submit" class="btn btn-primary btn-block">
                            {{ translate('Join Exclusive Community') }}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    </div>
</div>
@endsection
