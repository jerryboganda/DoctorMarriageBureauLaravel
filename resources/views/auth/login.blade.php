<!DOCTYPE html>
<html class="dark" lang="en"><head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<title>Doctor Login - Doctor Marriage Bureau</title>
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;900&amp;family=Playfair+Display:ital,wght@0,700;1,700&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<script id="tailwind-config">
        tailwind.config = {
            darkMode: "class",
            theme: {
                extend: {
                    colors: {
                        "primary": "#ca8a04",
                        "accent": "#b47b03",
                        "background-light": "#f8f6f7",
                        "background-dark": "#0f172a",
                    },
                    fontFamily: {
                        "display": ["Inter", "sans-serif"],
                        "serif": ["Playfair Display", "serif"],
                    },
                    borderRadius: {
                        "DEFAULT": "1rem",
                        "lg": "2rem",
                        "xl": "3rem",
                        "full": "9999px"
                    },
                },
            },
        }
    </script>
<style>
        .mesh-gradient-overlay {
            background: radial-gradient(at 0% 0%, rgba(202, 138, 4, 0.1) 0px, transparent 50%),
                        radial-gradient(at 100% 0%, rgba(15, 23, 42, 0.4) 0px, transparent 50%),
                        radial-gradient(at 100% 100%, rgba(202, 138, 4, 0.05) 0px, transparent 50%),
                        radial-gradient(at 0% 100%, rgba(15, 23, 42, 0.2) 0px, transparent 50%);
        }
        .glass-card {
            background: rgba(15, 23, 42, 0.85);
            backdrop-filter: blur(24px);
            -webkit-backdrop-filter: blur(24px);
            border: 1px solid rgba(255, 255, 255, 0.1);
        }
        .cta-gradient {
            background: linear-gradient(135deg, #ca8a04 0%, #a16207 100%);
            box-shadow: 0 10px 30px rgba(202, 138, 4, 0.3);
        }
    </style>
</head>
<body class="bg-background-light dark:bg-background-dark font-display text-white overflow-hidden">
<div class="flex h-screen w-full flex-col lg:flex-row">
<div class="relative hidden lg:flex lg:w-4/12 h-full flex-col overflow-hidden">
<div class="absolute inset-0 bg-center bg-no-repeat bg-cover" style='background-image: url("https://lh3.googleusercontent.com/aida-public/AB6AXuBITklj-zmmv5FSo7yQrORT8LXF-A4TOHtWZ-xvh8X8p95SEfRU7NyNTDa53MEM0jtktitz33YFpO4C36Vzn0J3kDyecHxem1OQREy0GKWpugwZlNefyJzUdeBR3HSBm7vPlvh63MpJZg5kiSV9hRIJn1pT3V_lcr3H-Vgqj4gnGj_EtnZaSGzAaqsotYT-dShHtXbFLrjueazVise_zTfWO3VMhKxERYkmcdepwxWeERGFMTA5xL8q6Mym08DJ5v_7om2M-PAxeJk");'>
</div>
<div class="absolute inset-0 mesh-gradient-overlay"></div>
<div class="relative z-10 p-10 flex items-center gap-3">
<div class="size-8 text-white">
<svg fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
<path d="M44 4H30.6666V17.3334H17.3334V30.6666H4V44H44V4Z" fill="currentColor"></path>
</svg>
</div>
<h1 class="text-2xl font-black tracking-[-0.015em] text-white">Doctor Marriage Bureau</h1>
</div>
<div class="relative z-10 mt-auto p-10 xl:p-12">
<span class="inline-block px-4 py-1.5 rounded-full border border-white/30 bg-white/10 text-[10px] font-bold uppercase tracking-widest mb-6 backdrop-blur-sm">Premium Network</span>
<p class="text-4xl xl:text-5xl font-serif italic text-white leading-tight mb-4">Finding your match, with surgical precision.</p>
<p class="text-white/80 text-base xl:text-lg">Exclusively for medical specialists seeking meaningful connections.</p>
</div>
</div>
<div class="flex-1 lg:w-8/12 flex flex-col justify-center items-center px-6 lg:px-12 xl:px-24 bg-background-light dark:bg-background-dark relative">
<div class="lg:hidden absolute top-8 left-8 flex items-center gap-3">
<div class="size-6 text-primary">
<span class="material-symbols-outlined">medical_services</span>
</div>
<h2 class="text-background-dark dark:text-white text-lg font-bold tracking-tight" style="font-family: 'Playfair Display', serif;">DOCTOR MARRIAGE BUREAU</h2>
</div>
<div class="w-full max-w-md glass-card p-10 lg:p-14 rounded-3xl border border-white/5">
<div class="mb-10">
<h2 class="text-white text-4xl lg:text-5xl xl:text-6xl font-serif leading-tight mb-4">Welcome Back, Doctor</h2>
<p class="text-white opacity-60 text-base font-normal">Please enter your credentials to access your dashboard.</p>
</div>
<form class="space-y-6" method="POST" action="{{ route('login') }}">
@csrf
<div class="flex flex-col gap-3">
<label class="text-white text-sm font-semibold">Email or Phone Number</label>
<div class="group relative flex items-center">
<span class="material-symbols-outlined absolute left-5 text-white/30 group-focus-within:text-primary transition-colors">alternate_email</span>
<input name="email" value="{{ old('email') }}" required autofocus class="w-full h-14 pl-14 pr-4 rounded-full border border-white/10 bg-white/5 text-white placeholder:text-white/20 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none" placeholder="dr.specialist@medical.com" type="text"/>
</div>
@error('email')
<span class="text-red-500 text-xs mt-1" role="alert">
    <strong>{{ $message }}</strong>
</span>
@enderror
</div>
<div class="flex flex-col gap-3">
<div class="flex justify-between items-center">
<label class="text-white text-sm font-semibold">Password</label>
<a class="text-primary text-xs font-bold hover:underline" href="{{ route('password.request') }}">Forgot Password?</a>
</div>
<div class="group relative flex items-center">
<span class="material-symbols-outlined absolute left-5 text-white/30 group-focus-within:text-primary transition-colors">lock</span>
<x-password-field
    id="password"
    name="password"
    :value="old('password')"
    placeholder="••••••••"
    wrapperClass=""
    inputClass="w-full h-14 pl-14 rounded-full border border-white/10 bg-white/5 text-white placeholder:text-white/20 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
    buttonClass="right-5 text-white/30 hover:text-primary"
    iconClass="w-5 h-5 text-white/30"
    errorName=""
    required
/>
</div>
@error('password')
<span class="text-red-500 text-xs mt-1" role="alert">
    <strong>{{ $message }}</strong>
</span>
@enderror
</div>
<div class="pt-6">
<button class="cta-gradient w-full h-14 rounded-full text-white text-lg font-bold tracking-wide hover:scale-[1.02] active:scale-95 transition-all duration-300 flex items-center justify-center gap-2 group" type="submit">
<span>Sign In</span>
<span class="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_forward</span>
</button>
</div>
</form>
<div class="mt-12 text-center">
<p class="text-white/40 text-sm font-medium">
                    Don't have an account? 
                    <a class="text-primary font-bold hover:underline ml-1" href="{{ route('register') }}">Join the Circle</a>
</p>
</div>
</div>
<footer class="mt-16 text-center text-[10px] text-white/30 uppercase tracking-[0.25em] font-bold">
            © {{ date('Y') }} Doctor Marriage Bureau · Exclusive Medical Matrimony
        </footer>
</div>
</div>
</body></html>
