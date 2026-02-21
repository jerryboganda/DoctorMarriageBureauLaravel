<!DOCTYPE html>
<html class="light" lang="en"><head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<meta name="csrf-token" content="{{ csrf_token() }}">
<title>DMB Forgot Password</title>
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
    </style>
</head>
<body class="bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-white min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden">
<div class="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
<div class="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-3xl"></div>
<div class="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-blue-500/5 rounded-full blur-3xl"></div>
</div>

<div class="w-full max-w-[440px] bg-white dark:bg-[#2a1420] rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-none border border-white dark:border-white/5 relative z-10 overflow-hidden">
<div class="h-1 w-full bg-slate-50 dark:bg-white/5">
<div class="h-full bg-primary w-1/4 rounded-r-full"></div>
</div>
<div class="p-8 pt-10">
<div class="flex flex-col items-center mb-8">
<div class="size-14 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-4 ring-4 ring-primary/5">
<span class="material-symbols-outlined text-[32px]">cardiology</span>
</div>
<h1 class="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">DMB<span class="text-primary">.</span></h1>
</div>
<div class="text-center mb-8">
<h2 class="text-xl font-bold text-slate-900 dark:text-white mb-3">Recover Your Account</h2>
<p class="text-slate-500 dark:text-slate-400 text-sm leading-relaxed px-2">
                    Please enter the email address or phone number you used to register your medical profile. We'll send you a secure link to reset your password.
                </p>
</div>

{{-- Session Status --}}
@if (session('status'))
    <div class="mb-4 p-3 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 text-sm font-medium">
        {{ session('status') }}
    </div>
@endif

{{-- Error Messages --}}
@if (isset($password_error))
    <div class="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm font-medium">
        {{ $password_error }}
    </div>
@endif

<form class="space-y-6" method="POST" action="{{ route('password.email') }}">
@csrf
<div class="space-y-2">
<label class="block text-sm font-semibold text-slate-700 dark:text-slate-200 ml-1" for="email">Email or Phone Number</label>
<div class="relative group">
<div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors group-focus-within:text-primary text-slate-400">
<span class="material-symbols-outlined text-[20px]">mail</span>
</div>
<input class="block w-full pl-11 pr-4 py-3.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all sm:text-sm font-medium shadow-sm @error('email') border-red-500 ring-red-500/20 @enderror" id="email" name="email" value="{{ old('email', isset($oldEmail) ? $oldEmail : '') }}" placeholder="dr.name@hospital.com or +91XXXXXXXXXX" required type="text"/>
</div>
@error('email')
<span class="text-red-500 text-xs mt-1 block" role="alert">
    <strong>{{ $message }}</strong>
</span>
@enderror
<p class="text-xs text-slate-400 dark:text-slate-500 ml-1">Use country code before phone number (e.g., +91)</p>
</div>
<button class="w-full flex items-center justify-center py-3.5 px-4 border border-transparent rounded-full shadow-lg shadow-primary/30 text-sm font-bold text-white bg-primary hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all transform hover:-translate-y-0.5" type="submit">
                    Send Recovery Link
                </button>
</form>
</div>
<div class="bg-slate-50 dark:bg-white/5 p-4 text-center border-t border-slate-100 dark:border-white/5">
<a class="inline-flex items-center justify-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-primary dark:hover:text-white transition-colors group" href="{{ route('login') }}">
<span class="material-symbols-outlined text-[18px] transition-transform group-hover:-translate-x-1">arrow_back</span>
                Return to Login
            </a>
</div>
</div>
<div class="mt-8 text-center relative z-10">
<div class="flex items-center justify-center gap-2 text-slate-400 text-xs mb-2">
<span class="material-symbols-outlined text-[14px]">lock</span>
<span>Secure Medical Encrypted</span>
</div>
<p class="text-xs text-slate-400 opacity-60">© {{ date('Y') }} Doctor Marriage Bureau</p>
</div>

</body></html>
