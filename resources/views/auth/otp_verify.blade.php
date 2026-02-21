<!DOCTYPE html>
<html class="light" lang="en"><head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<meta name="csrf-token" content="{{ csrf_token() }}">
<title>DMB OTP Entry Screen</title>
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
        }::-webkit-scrollbar {
            width: 8px;
        }
        ::-webkit-scrollbar-track {
            background: transparent;
        }
        ::-webkit-scrollbar-thumb {
            background-color: rgba(156, 163, 175, 0.5);
            border-radius: 20px;
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
<body class="bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-white overflow-hidden h-screen flex flex-col items-center justify-center relative">
<div class="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
<div class="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl"></div>
<div class="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-3xl"></div>
</div>
<div class="w-full max-w-md z-10 px-4">
<div class="flex flex-col items-center mb-8">
<div class="size-16 bg-white dark:bg-[#2a1420] rounded-full shadow-lg shadow-slate-200/50 dark:shadow-none flex items-center justify-center text-primary mb-4 border border-white dark:border-white/5">
<span class="material-symbols-outlined text-[32px]">shield_lock</span>
</div>
<h1 class="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Security Verification</h1>
<p class="text-slate-500 dark:text-slate-400 mt-2 text-center text-sm">
                Enter the 6-digit code sent to your registered<br/><span id="target-display" class="font-semibold text-slate-900 dark:text-white">loading...</span>
</p>
</div>
<div class="bg-white dark:bg-[#2a1420] rounded-xl shadow-xl shadow-slate-200/50 dark:shadow-black/20 border border-slate-100 dark:border-white/5 p-8">
<form id="otp-form" class="flex flex-col gap-6">
<div class="flex justify-between gap-2">
<input autofocus class="otp-input w-12 h-14 text-center text-2xl font-semibold bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all dark:text-white placeholder-transparent" maxlength="1" type="text" data-index="0"/>
<input class="otp-input w-12 h-14 text-center text-2xl font-semibold bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all dark:text-white placeholder-transparent" maxlength="1" type="text" data-index="1"/>
<input class="otp-input w-12 h-14 text-center text-2xl font-semibold bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all dark:text-white placeholder-transparent" maxlength="1" type="text" data-index="2"/>
<input class="otp-input w-12 h-14 text-center text-2xl font-semibold bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all dark:text-white placeholder-transparent" maxlength="1" type="text" data-index="3"/>
<input class="otp-input w-12 h-14 text-center text-2xl font-semibold bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all dark:text-white placeholder-transparent" maxlength="1" type="text" data-index="4"/>
<input class="otp-input w-12 h-14 text-center text-2xl font-semibold bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all dark:text-white placeholder-transparent" maxlength="1" type="text" data-index="5"/>
</div>
<div class="flex items-center justify-between text-sm">
<div class="flex items-center gap-2 text-slate-500 dark:text-slate-400">
<span class="material-symbols-outlined text-[18px]">timer</span>
<span>Code expires in <span id="timer-text" class="font-mono font-bold text-slate-700 dark:text-slate-300">02:00</span></span>
</div>
<button id="resend-btn" class="text-slate-400 dark:text-slate-600 font-semibold cursor-not-allowed disabled:opacity-50" disabled type="button" onclick="resendOtp()">
                        Resend Code
                    </button>
</div>
<button id="verify-btn" class="w-full bg-primary hover:bg-pink-700 text-white font-bold h-12 rounded-lg shadow-lg shadow-primary/30 hover:shadow-primary/40 transition-all flex items-center justify-center gap-2 group" type="submit">
<span>Verify &amp; Proceed</span>
<span class="material-symbols-outlined group-hover:translate-x-1 transition-transform text-[20px]">arrow_forward</span>
</button>
</form>
<div class="mt-8 pt-6 border-t border-slate-100 dark:border-white/5 text-center">
<p class="text-xs text-slate-400 dark:text-slate-500 mb-4">
                    Having trouble verifying? <a class="text-primary hover:underline" href="#">Contact Support</a>
</p>
<div class="flex items-center justify-center gap-2 text-xs text-slate-400 dark:text-slate-600">
<span class="material-symbols-outlined text-[14px]">lock</span>
<span>256-bit SSL Encrypted Connection</span>
</div>
</div>
</div>
<div class="mt-8 text-center">
<a href="{{ route('otp.initiation') }}" class="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white text-sm font-medium transition-colors flex items-center justify-center gap-2 mx-auto">
<span class="material-symbols-outlined text-[18px]">arrow_back</span>
                Back to Verification Options
            </a>
</div>
</div>
<footer class="absolute bottom-6 w-full text-center">
<p class="text-[10px] text-slate-400 dark:text-slate-600 uppercase tracking-widest">
            Doctor Marriage Bureau © {{ date('Y') }}
        </p>
</footer>

<script>
    const inputs = document.querySelectorAll('.otp-input');
    const verifyBtn = document.getElementById('verify-btn');
    const resendBtn = document.getElementById('resend-btn');
    const timerText = document.getElementById('timer-text');
    const targetDisplay = document.getElementById('target-display');
    
    const verifyType = sessionStorage.getItem('otp_verify_type') || 'email';
    let target = sessionStorage.getItem('otp_target') || '';
    
    // Initial setup
    window.addEventListener('load', () => {
        if (!target) {
            // If no target, redirect back to initiation
            window.location.href = "{{ route('otp.initiation') }}";
            return;
        }
        targetDisplay.innerText = maskIdentifier(target, verifyType);
        startTimer(120);
    });

    function maskIdentifier(val, type) {
        if (type === 'email') {
            const [user, domain] = val.split('@');
            return `${user.slice(0, 2)}***@${domain}`;
        } else {
            return `mobile ending in ${val.slice(-4)}`;
        }
    }

    // OTP Input Logic
    inputs.forEach((input, index) => {
        input.addEventListener('input', (e) => {
            const value = e.target.value;
            // Only allow numbers
            e.target.value = value.replace(/[^0-9]/g, '');
            if (e.target.value.length > 0) {
                if (index < inputs.length - 1) {
                    inputs[index + 1].focus();
                }
            }
        });

        input.addEventListener('keydown', (e) => {
            if (e.key === 'Backspace' && !e.target.value && index > 0) {
                inputs[index - 1].focus();
            }
        });

        // Handle paste
        input.addEventListener('paste', (e) => {
            e.preventDefault();
            const pasteData = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, 6);
            pasteData.split('').forEach((char, i) => {
                if (inputs[i]) inputs[i].value = char;
            });
            if (inputs[pasteData.length - 1]) inputs[pasteData.length - 1].focus();
        });
    });

    // Verification Logic
    document.getElementById('otp-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const code = Array.from(inputs).map(i => i.value).join('');
        if (code.length !== 6) {
            // Highlight empty inputs
            inputs.forEach(input => {
                if (!input.value) {
                    input.classList.add('border-red-500', 'ring-1', 'ring-red-500');
                    setTimeout(() => input.classList.remove('border-red-500', 'ring-1', 'ring-red-500'), 2000);
                }
            });
            return;
        }

        verifyBtn.classList.add('btn-loading');
        
        try {
            const url = verifyType === 'email' ? "{{ url('/verify-email-code') }}" : "{{ url('/verify-phone-code') }}";
            const body = verifyType === 'email' ? { email: target, code } : { phone: target, code };
            
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
                sessionStorage.removeItem('otp_verify_type');
                sessionStorage.removeItem('otp_target');
                window.location.href = "{{ route('dashboard') }}";
            } else {
                alert(data.message || 'Incorrect verification code. Please try again.');
                // Clear inputs on error
                inputs.forEach(input => {
                    input.value = '';
                    input.classList.add('border-red-500');
                    setTimeout(() => input.classList.remove('border-red-500'), 2000);
                });
                inputs[0].focus();
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Verification failed. Please try again.');
        } finally {
            verifyBtn.classList.remove('btn-loading');
        }
    });

    // Resend Logic
    async function resendOtp() {
        resendBtn.disabled = true;
        resendBtn.innerText = 'Sending...';
        
        try {
            const url = verifyType === 'email' ? "{{ url('/send-email-verification') }}" : "{{ url('/send-phone-verification') }}";
            const body = verifyType === 'email' ? { email: target } : { phone: target };
            
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
                startTimer(120);
                alert('A new code has been sent.');
            } else {
                alert(data.message || 'Failed to resend code.');
                resendBtn.disabled = false;
                resendBtn.innerText = 'Resend Code';
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Failed to resend. Please try again.');
            resendBtn.disabled = false;
            resendBtn.innerText = 'Resend Code';
        }
    }

    // Timer Logic
    function startTimer(seconds) {
        resendBtn.disabled = true;
        resendBtn.classList.add('cursor-not-allowed');
        resendBtn.classList.remove('text-primary', 'hover:text-pink-700');
        resendBtn.classList.add('text-slate-400');
        
        let remaining = seconds;
        const interval = setInterval(() => {
            const mins = Math.floor(remaining / 60);
            const secs = remaining % 60;
            timerText.innerText = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
            
            if (remaining <= 0) {
                clearInterval(interval);
                resendBtn.disabled = false;
                resendBtn.classList.remove('cursor-not-allowed');
                resendBtn.classList.add('text-primary', 'hover:text-pink-700');
                resendBtn.classList.remove('text-slate-400');
                resendBtn.innerText = 'Resend Code';
                timerText.innerText = '00:00';
            }
            remaining--;
        }, 1000);
    }
</script>

</body></html>
