import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Background from './components/Background';
import Input from './components/Input';
import Button from './components/Button';
import RegistrationFlow from './components/RegistrationFlow';
import ForgotPasswordFlow from './components/ForgotPasswordFlow';
import Dashboard from './components/Dashboard';
import { EyeIcon, EyeOffIcon, MailIcon, LockIcon, GoogleIcon, AppleIcon } from './components/Icons';

// App Wrapper for Desktop Frame
const MobileContainer: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div className="w-full h-full flex items-center justify-center bg-slate-900 md:p-8">
        <div className="relative w-full h-full md:max-w-[450px] md:h-[90dvh] md:rounded-[3rem] md:shadow-[0_0_100px_rgba(0,0,0,0.5)] md:ring-8 md:ring-slate-800 bg-white overflow-hidden transform-gpu">
            {children}
        </div>
    </div>
);

// Staggered Animation Variants
const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1,
            delayChildren: 0.2,
        },
    },
    exit: {
        opacity: 0,
        transition: { staggerChildren: 0.05, staggerDirection: -1 },
    },
};

const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { type: 'spring', stiffness: 300, damping: 24 },
    },
    exit: { opacity: 0, y: -20 },
};

type ViewState = 'login' | 'register' | 'forgot-password' | 'dashboard';

const App: React.FC = () => {
    const [view, setView] = useState<ViewState>('login');
    const [showPassword, setShowPassword] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const handleSignIn = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        await new Promise((resolve) => setTimeout(resolve, 1500));
        setIsLoading(false);
        setView('dashboard');
    };

    if (!mounted) return null;

    return (
        <MobileContainer>
            <div className="w-full h-full flex flex-col relative overflow-hidden bg-slate-50">
                <Background />

                <AnimatePresence mode="wait">
                    {/* LOGIN VIEW */}
                    {view === 'login' && (
                        <motion.div
                            key="login-view"
                            variants={containerVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            className="flex-1 flex flex-col px-8 relative w-full h-full pt-[env(safe-area-inset-top)]"
                        >
                            {/* Logo Area */}
                            <div className="flex-1 min-h-[120px] flex items-center justify-center flex-col mt-4">
                                <motion.div
                                    initial={{ scale: 0.5, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    transition={{
                                        type: 'spring',
                                        stiffness: 200,
                                        damping: 20,
                                        delay: 0.2,
                                    }}
                                    className="relative w-48 h-32 mb-6"
                                >
                                    <img
                                        src="/assets/images/logo.png"
                                        className="w-full h-full object-contain drop-shadow-lg"
                                        alt="Doctor Marriage Bureau"
                                    />
                                </motion.div>

                                <motion.div
                                    variants={itemVariants}
                                    className="text-center space-y-1"
                                >
                                    <h1 className="text-2xl font-black tracking-tight text-brand-red uppercase leading-none filter drop-shadow-sm">
                                        Doctor Marriage
                                    </h1>
                                    <div className="flex items-center justify-center gap-2 w-full">
                                        <div className="h-[2px] w-12 bg-brand-blue rounded-full opacity-60"></div>
                                        <h2 className="text-xl font-bold tracking-widest text-brand-blue uppercase leading-none">
                                            Bureau
                                        </h2>
                                        <div className="h-[2px] w-12 bg-brand-blue rounded-full opacity-60"></div>
                                    </div>
                                </motion.div>

                                <motion.p
                                    variants={itemVariants}
                                    className="text-slate-500 text-center mt-4 text-sm font-medium"
                                >
                                    Exclusive Matchmaking for Medical Professionals
                                </motion.p>
                            </div>

                            {/* Login Form */}
                            <div className="flex-shrink-0 pb-[max(3rem,env(safe-area-inset-bottom))]">
                                <form onSubmit={handleSignIn} className="space-y-4">
                                    <motion.div variants={itemVariants}>
                                        <Input
                                            id="email"
                                            type="email"
                                            inputMode="email"
                                            label="Medical Email ID"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            icon={<MailIcon className="w-5 h-5" />}
                                        />
                                    </motion.div>

                                    <motion.div variants={itemVariants} className="relative">
                                        <Input
                                            id="password"
                                            type={showPassword ? 'text' : 'password'}
                                            label="Password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            icon={<LockIcon className="w-5 h-5" />}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-5 top-5 p-1 text-slate-400 hover:text-brand-blue active:scale-90 transition-all z-20"
                                        >
                                            {showPassword ? (
                                                <EyeOffIcon className="w-5 h-5" />
                                            ) : (
                                                <EyeIcon className="w-5 h-5" />
                                            )}
                                        </button>
                                    </motion.div>

                                    <motion.div
                                        variants={itemVariants}
                                        className="flex justify-end -mt-2 mb-6"
                                    >
                                        <button
                                            type="button"
                                            onClick={() => setView('forgot-password')}
                                            className="text-sm font-semibold text-brand-blue hover:text-blue-700 active:opacity-60 transition-all"
                                        >
                                            Forgot Credentials?
                                        </button>
                                    </motion.div>

                                    <motion.div variants={itemVariants}>
                                        <Button
                                            type="submit"
                                            isLoading={isLoading}
                                            className="h-16 rounded-[2rem] text-lg bg-brand-blue hover:bg-blue-700 shadow-[0_8px_20px_-8px_rgba(37,99,235,0.5)]"
                                        >
                                            Member Login
                                        </Button>
                                    </motion.div>
                                </form>

                                <motion.div
                                    variants={itemVariants}
                                    className="mt-8 flex flex-col gap-4"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="h-px bg-slate-200 flex-1" />
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                            Or Verify With
                                        </span>
                                        <div className="h-px bg-slate-200 flex-1" />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <Button variant="social" className="h-14 rounded-[1.5rem]">
                                            <GoogleIcon className="w-5 h-5" />
                                        </Button>
                                        <Button variant="social" className="h-14 rounded-[1.5rem]">
                                            <AppleIcon className="w-5 h-5 text-slate-800" />
                                        </Button>
                                    </div>
                                </motion.div>

                                <motion.p
                                    variants={itemVariants}
                                    className="mt-8 text-center text-sm text-slate-500 font-medium"
                                >
                                    New Doctor?{' '}
                                    <button
                                        onClick={() => setView('register')}
                                        className="text-brand-red font-bold cursor-pointer active:opacity-60 transition-all"
                                    >
                                        Apply for Membership
                                    </button>
                                </motion.p>
                            </div>
                        </motion.div>
                    )}

                    {/* DASHBOARD & FLOWS */}
                    {view === 'register' && (
                        <motion.div
                            key="register-view"
                            initial={{ opacity: 0, x: '100%' }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: '100%' }}
                            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                            className="absolute inset-0 z-10 bg-slate-50"
                        >
                            <RegistrationFlow
                                onBack={() => setView('login')}
                                onSuccess={() => setView('dashboard')}
                            />
                        </motion.div>
                    )}

                    {view === 'forgot-password' && (
                        <motion.div
                            key="forgot-password-view"
                            initial={{ opacity: 0, x: '100%' }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: '100%' }}
                            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                            className="absolute inset-0 z-10 bg-slate-50"
                        >
                            <ForgotPasswordFlow
                                onBack={() => setView('login')}
                                onComplete={() => setView('login')}
                            />
                        </motion.div>
                    )}

                    {view === 'dashboard' && (
                        <motion.div
                            key="dashboard-view"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="absolute inset-0 z-10 bg-slate-50"
                        >
                            <Dashboard />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </MobileContainer>
    );
};

export default App;
