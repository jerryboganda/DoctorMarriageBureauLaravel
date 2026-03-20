<!DOCTYPE html>
<html class="light" lang="en"><head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<meta name="csrf-token" content="{{ csrf_token() }}">
<title>DMB Reset Password</title>
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<script id="tailwind-config">
        tailwind.config = {
            darkMode: "class",
            theme: {
                extend: {
                    colors: {
                        "primary": "#d41173",
                        "background-light": "#f8f6f7",
                        "background-dark": "#221019",
                    },
                    fontFamily: {
                        "display": ["Inter", "sans-serif"]
                    },
                    borderRadius: {
                        "DEFAULT": "1rem",
                        "lg": "1.5rem",
                        "xl": "2rem",
                        "full": "9999px"
                    },
                },
            },
        }
    </script>
<style>
        .material-symbols-outlined {
            font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
        }
        .icon-filled {
            font-variation-settings: 'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24;
        }
        .otp-error .otp-input { border-color: #ef4444 !important; ring: 2px; ring-color: #ef4444; }
    </style>
</head>
<body class="bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-white min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden">
<div class="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
<div class="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-3xl"></div>
<div class="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-blue-500/5 rounded-full blur-3xl"></div>
</div>

<div class="w-full max-w-[480px] bg-white dark:bg-[#2a1420] rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-none border border-white dark:border-white/5 relative z-10 overflow-hidden">
<div class="p-8 pt-10">
    <div class="flex flex-col items-center mb-8">
        <div class="size-16 bg-white dark:bg-[#2a1420] rounded-full shadow-lg shadow-slate-200/50 dark:shadow-none flex items-center justify-center text-primary mb-4 border border-white dark:border-white/5">
            <span class="material-symbols-outlined text-[32px]">lock_reset</span>
        </div>
        <h1 class="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{{ translate('Reset Password') }}</h1>
        <p class="text-slate-500 dark:text-slate-400 mt-2 text-center text-sm">
            {{translate('Enter the 6-digit verification code sent to your email and set your new password.')}}
        </p>
    </div>

    <form method="POST" action="{{ route('password.update') }}" id="resetForm" class="space-y-6">
        @csrf
        <input type="hidden" name="email" value="{{ $email ?? old('email') }}">

        <div class="space-y-4">
            <label class="block text-sm font-semibold text-slate-700 dark:text-slate-200">{{ translate('Verification Code') }}</label>
            <div class="flex justify-between gap-2 otp-group @if($errors->has('code')) otp-error @endif">
                <input autofocus class="otp-input w-12 h-14 text-center text-2xl font-semibold bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all dark:text-white placeholder-transparent" maxlength="1" type="text" inputmode="numeric" pattern="[0-9]*" autocomplete="one-time-code"/>
                <input class="otp-input w-12 h-14 text-center text-2xl font-semibold bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all dark:text-white placeholder-transparent" maxlength="1" type="text" inputmode="numeric" pattern="[0-9]*"/>
                <input class="otp-input w-12 h-14 text-center text-2xl font-semibold bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all dark:text-white placeholder-transparent" maxlength="1" type="text" inputmode="numeric" pattern="[0-9]*"/>
                <input class="otp-input w-12 h-14 text-center text-2xl font-semibold bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all dark:text-white placeholder-transparent" maxlength="1" type="text" inputmode="numeric" pattern="[0-9]*"/>
                <input class="otp-input w-12 h-14 text-center text-2xl font-semibold bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all dark:text-white placeholder-transparent" maxlength="1" type="text" inputmode="numeric" pattern="[0-9]*"/>
                <input class="otp-input w-12 h-14 text-center text-2xl font-semibold bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all dark:text-white placeholder-transparent" maxlength="1" type="text" inputmode="numeric" pattern="[0-9]*"/>
            </div>
            <input id="code" type="hidden" name="code" value="{{ old('code') }}">
            @if ($errors->has('code'))
                <span class="text-red-500 text-xs mt-1 block" role="alert">
                    <strong>{{ $errors->first('code') }}</strong>
                </span>
            @endif
        </div>

        <div class="space-y-2">
            <label class="block text-sm font-semibold text-slate-700 dark:text-slate-200" for="password">{{ translate('New Password') }}</label>
            <x-password-field
                id="password"
                name="password"
                placeholder="••••••••"
                autocomplete="new-password"
                wrapperClass=""
                inputClass="block w-full px-4 py-3.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all sm:text-sm font-medium shadow-sm @error('password') border-red-500 @enderror"
                errorName="password"
                required
            />
        </div>

        <div class="space-y-2">
            <label class="block text-sm font-semibold text-slate-700 dark:text-slate-200" for="password-confirm">{{ translate('Confirm Password') }}</label>
            <x-password-field
                id="password-confirm"
                name="password_confirmation"
                placeholder="••••••••"
                autocomplete="new-password"
                wrapperClass=""
                inputClass="block w-full px-4 py-3.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all sm:text-sm font-medium shadow-sm"
                errorName=""
                required
            />
            <span class="text-red-500 text-xs mt-1 hidden" id="confirmError">{{ translate('Passwords do not match') }}</span>
        </div>

        <button class="w-full flex items-center justify-center py-3.5 px-4 border border-transparent rounded-full shadow-lg shadow-primary/30 text-sm font-bold text-white bg-primary hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed" type="submit" id="resetBtn" disabled>
            {{ translate('Reset Password') }}
        </button>
    </form>
</div>
<div class="bg-slate-50 dark:bg-white/5 p-4 text-center border-t border-slate-100 dark:border-white/5">
    <a class="inline-flex items-center justify-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-primary dark:hover:text-white transition-colors group" href="{{ route('user.login') }}">
        <span class="material-symbols-outlined text-[18px] transition-transform group-hover:-translate-x-1">arrow_back</span>
        {{translate('Back to Login')}}
    </a>
</div>
</div>

<script>
    document.addEventListener('DOMContentLoaded', function () {
        const form = document.getElementById('resetForm');
        const password = document.getElementById('password');
        const confirmPassword = document.getElementById('password-confirm');
        const confirmError = document.getElementById('confirmError');
        const resetBtn = document.getElementById('resetBtn');
        const codeHidden = document.getElementById('code');
        const otpInputs = Array.from(document.querySelectorAll('.otp-input'));

        function validateMatch() {
            const filled = !!password.value && !!confirmPassword.value;
            const matches = filled && password.value === confirmPassword.value;
            if (filled && !matches) {
                confirmError.classList.remove('hidden');
                confirmPassword.classList.add('border-red-500');
            } else {
                confirmError.classList.add('hidden');
                confirmPassword.classList.remove('border-red-500');
            }
            return matches;
        }

        function updateButton() {
            const matches = validateMatch();
            const filled = !!password.value && !!confirmPassword.value && password.value.length >= 8;
            const code = otpInputs.map(i => i.value.trim()).join('');
            if (codeHidden) codeHidden.value = code;
            resetBtn.disabled = !(filled && matches && code.length === 6);
        }

        otpInputs.forEach((input, idx) => {
            input.addEventListener('input', (e) => {
                const v = e.target.value.replace(/\D/g,'');
                e.target.value = v.slice(-1);
                if (e.target.value && idx < otpInputs.length - 1) {
                    otpInputs[idx+1].focus();
                }
                updateButton();
            });
            input.addEventListener('keydown', (e) => {
                if ((e.key === 'Backspace' || e.key === 'Delete') && !e.target.value && idx > 0) {
                    otpInputs[idx-1].focus();
                }
            });
            input.addEventListener('paste', (e) => {
                const data = (e.clipboardData || window.clipboardData).getData('text').replace(/\D/g,'').slice(0, 6);
                if (!data) return;
                e.preventDefault();
                data.split('').forEach((char, i) => {
                    if (otpInputs[i]) otpInputs[i].value = char;
                });
                const next = data.length < 6 ? data.length : 5;
                otpInputs[next].focus();
                updateButton();
            });
        });

        password.addEventListener('input', updateButton);
        confirmPassword.addEventListener('input', updateButton);

        const prevCode = codeHidden.value;
        if (prevCode && prevCode.length === 6) {
            prevCode.split('').forEach((char, i) => {
                if (otpInputs[i]) otpInputs[i].value = char;
            });
            updateButton();
        }
    });
</script>

</body></html>
