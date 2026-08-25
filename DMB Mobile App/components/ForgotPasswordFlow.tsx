import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Input from './Input';
import Button from './Button';
import OtpInput from './OtpInput';
import {
    ChevronLeftIcon,
    MailIcon,
    LockIcon,
    CheckCircleIcon,
    RefreshCwIcon,
    KeyIcon,
} from './Icons';

// Legacy Web Component - Not used in React Native app
interface ForgotPasswordFlowProps {
    onBack: () => void;
    onComplete: () => void;
}

const ForgotPasswordFlow: React.FC<ForgotPasswordFlowProps> = ({ onBack, onComplete }) => {
    const [step, setStep] = useState(0);
    const [contact, setContact] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const handleSendCode = async (e: any) => {
        e.preventDefault();
        setIsLoading(true);
        await new Promise((resolve) => setTimeout(resolve, 1500));
        setIsLoading(false);
        setStep(1);
    };

    const handleVerifyOtp = async (code: string) => {
        if (code.length === 4) {
            setIsLoading(true);
            await new Promise((resolve) => setTimeout(resolve, 1500));
            setIsLoading(false);
            setStep(2);
        }
    };

    const handleResetPassword = async (e: any) => {
        e.preventDefault();
        setIsLoading(true);
        await new Promise((resolve) => setTimeout(resolve, 1500));
        setIsLoading(false);
        setStep(3);
    };

    return (
        <div className="w-full h-full bg-slate-50 relative overflow-hidden font-sans">
            {/* Header with Blur Background */}
            <div className="absolute top-0 left-0 right-0 z-30 h-[80px] pt-4 px-6 flex items-center justify-between bg-slate-50/90 backdrop-blur-xl border-b border-slate-100/50">
                <button
                    onClick={step === 0 ? onBack : () => setStep(step - 1)}
                    className="p-2.5 rounded-full bg-white/50 hover:bg-white text-slate-700 transition-all shadow-sm border border-slate-100 active:scale-95"
                >
                    <ChevronLeftIcon className="w-6 h-6" />
                </button>
            </div>

            {/* Main Content Area - Scrollable */}
            <div className="absolute inset-0 z-10 w-full h-full">
                <AnimatePresence mode="wait">
                    {/* STEP 0: INPUT CONTACT */}
                    {step === 0 && (
                        <motion.div
                            key="step0"
                            initial={{ opacity: 0, x: 50 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -50 }}
                            className="absolute inset-0 w-full h-full overflow-y-auto overflow-x-hidden"
                        >
                            <div className="pt-[100px] px-6 pb-10 min-h-full">
                                <div className="mb-8">
                                    <h2 className="text-3xl font-extrabold text-slate-900 mb-3">
                                        Forgot Password?
                                    </h2>
                                    <p className="text-slate-500 text-lg leading-relaxed">
                                        Enter your email or phone number to receive a recovery code.
                                    </p>
                                </div>

                                <form onSubmit={handleSendCode} className="space-y-6">
                                    <Input
                                        id="contact"
                                        label="Email or Phone Number"
                                        icon={<MailIcon className="w-5 h-5" />}
                                        value={contact}
                                        onChange={(e: any) => setContact((e.target as any).value)}
                                    />

                                    <Button type="submit" isLoading={isLoading} disabled={!contact}>
                                        Send Recovery Code
                                    </Button>
                                </form>
                            </div>
                        </motion.div>
                    )}

                    {/* STEP 1: VERIFY OTP */}
                    {step === 1 && (
                        <motion.div
                            key="step1"
                            initial={{ opacity: 0, x: 50 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -50 }}
                            className="absolute inset-0 w-full h-full overflow-y-auto overflow-x-hidden"
                        >
                            <div className="pt-[100px] px-6 pb-10 min-h-full">
                                <div className="mb-8 text-center">
                                    <h2 className="text-2xl font-extrabold text-slate-900 mb-2">
                                        Verify Identity
                                    </h2>
                                    <p className="text-slate-500 text-sm">
                                        Enter the code sent to{' '}
                                        <span className="font-bold text-slate-900">{contact}</span>
                                    </p>
                                </div>

                                <div className="py-8">
                                    <OtpInput onComplete={handleVerifyOtp} />
                                </div>

                                <div className="text-center">
                                    <button className="text-brand-blue font-bold text-sm flex items-center justify-center gap-2 mx-auto hover:underline p-2">
                                        <RefreshCwIcon className="w-4 h-4" />
                                        Resend Code
                                    </button>
                                </div>

                                {isLoading && (
                                    <p className="text-center text-slate-400 text-xs mt-4 animate-pulse">
                                        Verifying code...
                                    </p>
                                )}
                            </div>
                        </motion.div>
                    )}

                    {/* STEP 2: RESET PASSWORD */}
                    {step === 2 && (
                        <motion.div
                            key="step2"
                            initial={{ opacity: 0, x: 50 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -50 }}
                            className="absolute inset-0 w-full h-full overflow-y-auto overflow-x-hidden"
                        >
                            <div className="pt-[100px] px-6 pb-10 min-h-full">
                                <div className="mb-8">
                                    <h2 className="text-2xl font-extrabold text-slate-900 mb-2">
                                        Create New Password
                                    </h2>
                                    <p className="text-slate-500 text-sm">
                                        Your new password must be different from previous used
                                        passwords.
                                    </p>
                                </div>

                                <form onSubmit={handleResetPassword} className="space-y-4">
                                    <Input
                                        id="new-pass"
                                        type="password"
                                        label="New Password"
                                        icon={<KeyIcon className="w-5 h-5" />}
                                        value={password}
                                        onChange={(e: any) => setPassword((e.target as any).value)}
                                    />
                                    <Input
                                        id="confirm-pass"
                                        type="password"
                                        label="Confirm Password"
                                        icon={<LockIcon className="w-5 h-5" />}
                                        value={confirmPassword}
                                        onChange={(e: any) =>
                                            setConfirmPassword((e.target as any).value)
                                        }
                                    />

                                    <div className="pt-4">
                                        <Button
                                            type="submit"
                                            isLoading={isLoading}
                                            disabled={!password || !confirmPassword}
                                        >
                                            Reset Password
                                        </Button>
                                    </div>
                                </form>
                            </div>
                        </motion.div>
                    )}

                    {/* STEP 3: SUCCESS */}
                    {step === 3 && (
                        <motion.div
                            key="step3"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="absolute inset-0 w-full h-full flex flex-col items-center justify-center p-6"
                        >
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                                className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-6 shadow-xl shadow-green-100"
                            >
                                <CheckCircleIcon className="w-12 h-12 text-green-600" />
                            </motion.div>

                            <h2 className="text-2xl font-extrabold text-slate-900 mb-2">
                                Password Updated
                            </h2>
                            <p className="text-slate-500 text-center text-sm mb-8 max-w-[200px]">
                                Your password has been changed successfully. You can now login with
                                your new credentials.
                            </p>

                            <Button
                                onClick={onComplete}
                                className="bg-slate-900 text-white shadow-xl shadow-slate-900/20 w-full max-w-xs"
                            >
                                Back to Login
                            </Button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default ForgotPasswordFlow;
