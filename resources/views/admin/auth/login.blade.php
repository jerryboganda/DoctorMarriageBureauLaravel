<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin Login | DMB Control Center</title>
    <script src="https://cdn.tailwindcss.com?plugins=forms"></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>
        body {
            font-family: 'Inter', sans-serif;
        }

        .admin-bg {
            background-color: #0f172a;
            background-image: radial-gradient(at 0% 0%, rgba(212, 17, 115, 0.1) 0px, transparent 50%),
                radial-gradient(at 100% 100%, rgba(202, 138, 4, 0.1) 0px, transparent 50%);
        }
    </style>
</head>

<body class="admin-bg flex items-center justify-center min-h-screen p-6 overflow-hidden">
    <div class="w-full max-w-md">
        <div class="text-center mb-8">
            <div class="inline-flex items-center justify-center w-16 h-16 bg-white/5 rounded-2xl border border-white/10 mb-4">
                <svg class="w-10 h-10 text-white" fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                    <path d="M44 4H30.6666V17.3334H17.3334V30.6666H4V44H44V4Z" fill="currentColor"></path>
                </svg>
            </div>
            <h1 class="text-2xl font-bold text-white tracking-tight">DMB Control Center</h1>
            <p class="text-white/50 text-sm mt-2">Administrative Access Only</p>
        </div>

        <div class="bg-white/10 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
            <form method="POST" action="{{ route('login') }}" class="space-y-6">
                @csrf

                <div class="space-y-2">
                    <label class="text-white/80 text-sm font-medium ml-1">Admin Email</label>
                    <input name="email" value="{{ old('email') }}" required autofocus
                        class="w-full h-12 px-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-white/30 transition-all"
                        placeholder="admin@admin.com" type="email">
                    @error('email')
                        <p class="text-red-400 text-xs mt-1">{{ $message }}</p>
                    @enderror
                </div>

                <div class="space-y-2">
                    <div class="flex justify-between items-center px-1">
                        <label class="text-white/80 text-sm font-medium">Password</label>
                        <a href="{{ route('password.request') }}" class="text-white/40 hover:text-white text-xs transition-colors">Reset Key?</a>
                    </div>
                    <x-password-field
                        id="password"
                        name="password"
                        placeholder="••••••••"
                        wrapperClass=""
                        inputClass="w-full h-12 px-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-white/30 transition-all"
                        buttonClass="right-3 text-white/40 hover:text-white"
                        iconClass="w-5 h-5 text-white/40"
                        errorName=""
                        required
                    />
                    @error('password')
                        <p class="text-red-400 text-xs mt-1">{{ $message }}</p>
                    @enderror
                </div>

                <div class="pt-2">
                    <button type="submit"
                        class="w-full h-12 bg-white text-slate-950 font-bold rounded-xl hover:bg-white/90 active:scale-[0.98] transition-all flex items-center justify-center gap-2">
                        <span>Authenticate</span>
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                        </svg>
                    </button>
                </div>
            </form>
        </div>

        <p class="mt-8 text-center text-white/20 text-[10px] uppercase tracking-[0.2em] font-semibold">
            &copy; {{ date('Y') }} Doctor Marriage Bureau &middot; Infrastructure
        </p>
    </div>
</body>

</html>
