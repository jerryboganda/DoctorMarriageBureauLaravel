<!DOCTYPE html>
<html class="light" lang="en"><head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<meta name="csrf-token" content="{{ csrf_token() }}">
<title>DMB Initial Verification</title>
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
                        "primary-hover": "#b00e60",
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
                        "2xl": "2.5rem",
                        "full": "9999px"
                    },
                    boxShadow: {
                        'soft': '0 10px 40px -10px rgba(0,0,0,0.08)',
                        'card': '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
                    }
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
        .masked-text {
            letter-spacing: 0.1em;
        }
        .btn-loading {
            position: relative;
            color: transparent !important;
            pointer-events: none;
        }
        .btn-loading::after {
            content: "";
            position: absolute;
            width: 24px;
            height: 24px;
            top: 50%;
            left: 50%;
            margin-top: -12px;
            margin-left: -12px;
            border: 3px solid rgba(255,255,255,0.3);
            border-radius: 50%;
            border-top-color: #fff;
            animation: spin 0.8s linear infinite;
        }
        @keyframes spin {
            to { transform: rotate(360deg); }
        }
    </style>
</head>
<body class="bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-white min-h-screen flex flex-col">
<header class="w-full h-20 px-8 flex items-center justify-between shrink-0">
<div class="flex items-center gap-3">
<div class="size-10 bg-primary/10 rounded-full flex items-center justify-center text-primary">
<span class="material-symbols-outlined">cardiology</span>
</div>
<h1 class="text-xl font-bold tracking-tight text-slate-900 dark:text-white">DMB<span class="text-primary">.</span></h1>
</div>
<div class="flex items-center gap-4">
<a href="{{ route('logout') }}" class="text-sm font-medium text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition-colors flex items-center gap-2">
    <span class="material-symbols-outlined text-[18px]">logout</span>
    Logout
</a>
</div>
</header>
<main class="flex-1 flex flex-col items-center justify-center px-6 pb-20">
<div class="max-w-4xl w-full space-y-12">
<div class="text-center space-y-4 max-w-2xl mx-auto">
<div class="inline-flex items-center gap-2 px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-xs font-bold uppercase tracking-wide mb-2">
<span class="material-symbols-outlined text-[16px] icon-filled">verified_user</span>
                    Security Check
                </div>
<h2 class="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white tracking-tight">
                    Verify Your Contact Details
                </h2>
<p class="text-slate-600 dark:text-slate-400 text-lg leading-relaxed">
                    To ensure the integrity of the Doctor Marriage Bureau community, we require two-step verification for all medical professionals.
                </p>
</div>
<div class="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
<div class="group bg-white dark:bg-[#2a1420] rounded-2xl p-8 shadow-soft border border-slate-100 dark:border-white/5 hover:border-primary/20 transition-all duration-300 flex flex-col relative overflow-hidden">
<div class="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110 duration-500"></div>
<div class="flex items-center gap-4 mb-6 relative z-10">
<div class="size-14 rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
<span class="material-symbols-outlined text-[28px]">mail_lock</span>
</div>
<div>
<h3 class="text-lg font-bold text-slate-900 dark:text-white">Email Verification</h3>
<p class="text-sm text-slate-500 dark:text-slate-400">Official Correspondence</p>
</div>
</div>
<div class="flex-1 space-y-6 relative z-10">
<div class="space-y-2">
<label class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Registered Email</label>
<div class="flex items-center gap-3">
<span class="text-2xl font-mono font-medium text-slate-800 dark:text-slate-200 masked-text">
                                    {{ substr(auth()->user()->email, 0, 2) }}***@{{ explode('@', auth()->user()->email)[1] ?? 'email.com' }}
                                </span>
<span class="material-symbols-outlined text-green-500 text-[20px] icon-filled" title="Format Valid">check_circle</span>
</div>
</div>
<p class="text-sm text-slate-600 dark:text-slate-300">
                            We will send a 6-digit One Time Password (OTP) to your institutional email address.
                        </p>
</div>
<div class="mt-8 pt-6 border-t border-slate-100 dark:border-white/5 relative z-10">
<button id="send-email-btn" onclick="sendVerification('email')" class="w-full bg-primary hover:bg-primary-hover text-white h-12 rounded-xl font-bold text-sm shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all flex items-center justify-center gap-2 group/btn">
<span class="material-symbols-outlined group-hover/btn:animate-pulse">send</span>
                            Send Email OTP
                        </button>
</div>
</div>
<div class="group bg-white dark:bg-[#2a1420] rounded-2xl p-8 shadow-soft border border-slate-100 dark:border-white/5 hover:border-primary/20 transition-all duration-300 flex flex-col relative overflow-hidden">
<div class="absolute top-0 right-0 w-32 h-32 bg-purple-50 dark:bg-purple-900/10 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110 duration-500"></div>
<div class="flex items-center gap-4 mb-6 relative z-10">
<div class="size-14 rounded-2xl bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center text-purple-600 dark:text-purple-400">
<span class="material-symbols-outlined text-[28px]">phonelink_lock</span>
</div>
<div>
<h3 class="text-lg font-bold text-slate-900 dark:text-white">Phone Verification</h3>
<p class="text-sm text-slate-500 dark:text-slate-400">Secure Notifications</p>
</div>
</div>
<div class="flex-1 space-y-6 relative z-10">
<div class="space-y-2">
<label class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Registered Mobile</label>
<div class="flex items-center gap-3">
<span class="text-2xl font-mono font-medium text-slate-800 dark:text-slate-200 masked-text">
                                    {{ substr(auth()->user()->phone, 0, 4) }}*** **{{ substr(auth()->user()->phone, -2) }}
                                </span>
<span class="material-symbols-outlined text-green-500 text-[20px] icon-filled" title="Format Valid">check_circle</span>
</div>
</div>
<p class="text-sm text-slate-600 dark:text-slate-300">
                            A secure text message containing your unique code will be sent to your mobile device.
                        </p>
</div>
<div class="mt-8 pt-6 border-t border-slate-100 dark:border-white/5 relative z-10">
<button id="send-phone-btn" onclick="sendVerification('phone')" class="w-full bg-primary hover:bg-primary-hover text-white h-12 rounded-xl font-bold text-sm shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all flex items-center justify-center gap-2 group/btn">
<span class="material-symbols-outlined group-hover/btn:animate-pulse">sms</span>
                            Send Mobile OTP
                        </button>
</div>
</div>
</div>
<div class="text-center pt-8">
<p class="text-sm text-slate-400">
                    By proceeding, you agree to our <a class="text-slate-600 dark:text-slate-300 underline hover:text-primary transition-colors" href="#">Terms of Service</a> and <a class="text-slate-600 dark:text-slate-300 underline hover:text-primary transition-colors" href="#">Privacy Policy</a>.
                </p>
<div class="mt-4 flex justify-center gap-2 items-center text-slate-400 text-xs">
<span class="material-symbols-outlined text-[14px]">lock</span>
                    256-bit SSL Encrypted Connection
                </div>
</div>
</div>
</main>

<script>
    async function sendVerification(type) {
        const email = "{{ auth()->user()->email }}";
        const phone = "{{ auth()->user()->phone }}";
        const btn = type === 'email' ? document.getElementById('send-email-btn') : document.getElementById('send-phone-btn');
        
        // Show loading state
        btn.classList.add('btn-loading');
        
        try {
            const url = type === 'email' ? "{{ url('/send-email-verification') }}" : "{{ url('/send-phone-verification') }}";
            const body = type === 'email' ? { email } : { phone };
            
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': '{{ csrf_token() }}'
                },
                body: JSON.stringify(body)
            });
            
            const data = await response.json();
            
            if (data.success) {
                sessionStorage.setItem('otp_verify_type', type);
                sessionStorage.setItem('otp_target', type === 'email' ? email : phone);
                window.location.href = "{{ route('otp.verify') }}";
            } else {
                alert(data.message || 'Failed to send verification code. Please try again.');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('An error occurred. Please try again later.');
        } finally {
            btn.classList.remove('btn-loading');
        }
    }
</script>

</body></html>
