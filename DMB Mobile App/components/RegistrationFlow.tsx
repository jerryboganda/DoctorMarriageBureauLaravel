import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Input from './Input';
import Button from './Button';
import DatePicker from './DatePicker';
import OtpInput from './OtpInput';
import {
    UserIcon,
    CalendarIcon,
    BadgeIcon,
    StethoscopeIcon,
    MailIcon,
    LockIcon,
    ChevronLeftIcon,
    CheckIcon,
    PhoneIcon,
    SmartphoneIcon,
} from './Icons';

interface RegistrationFlowProps {
    onBack: () => void;
    onSuccess: () => void;
}

// Animation Variants for Sliding Steps
const variants = {
    enter: (direction: number) => ({
        x: direction > 0 ? 200 : -200,
        opacity: 0,
        scale: 0.98,
        filter: 'blur(4px)',
    }),
    center: {
        zIndex: 1,
        x: 0,
        opacity: 1,
        scale: 1,
        filter: 'blur(0px)',
    },
    exit: (direction: number) => ({
        zIndex: 0,
        x: direction < 0 ? 200 : -200,
        opacity: 0,
        scale: 0.98,
        filter: 'blur(4px)',
    }),
};

const RegistrationFlow: React.FC<RegistrationFlowProps> = ({ onBack, onSuccess }) => {
    const [step, setStep] = useState(0); // 0: Identity, 1: Professional, 2: Account, 3: Verification
    const [direction, setDirection] = useState(0);
    const [gender, setGender] = useState<'male' | 'female' | ''>('');
    const [isLoading, setIsLoading] = useState(false);
    const [phoneNumber, setPhoneNumber] = useState('');

    // Date Picker State
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [dob, setDob] = useState<Date | null>(null);

    const nextStep = () => {
        setDirection(1);
        setStep((prev) => Math.min(prev + 1, 3));
    };

    const prevStep = () => {
        if (step === 0) {
            onBack();
        } else {
            setDirection(-1);
            setStep((prev) => Math.max(prev - 1, 0));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        nextStep(); // Move to Verification Step
    };

    const handleVerifyOtp = async (code: string) => {
        if (code.length === 4) {
            setIsLoading(true);
            // Simulate API call
            await new Promise((resolve) => setTimeout(resolve, 2000));
            setIsLoading(false);
            onSuccess();
        }
    };

    // Format Date for Display
    const formattedDob = dob
        ? dob.toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
          })
        : '';

    return (
        <div className="w-full h-full bg-slate-50 relative overflow-hidden font-sans">
            {/* 
        HEADER
      */}
            <div className="absolute top-0 left-0 right-0 z-30 h-[90px] pt-4 px-6 flex items-start justify-between bg-slate-50/90 backdrop-blur-xl border-b border-slate-200/50 shadow-sm transition-all duration-300">
                {/* Back Button */}
                <button
                    onClick={prevStep}
                    className="p-2.5 rounded-full bg-white/50 hover:bg-white text-slate-700 transition-all shadow-sm border border-slate-100 active:scale-95 group mt-1"
                >
                    <ChevronLeftIcon className="w-6 h-6 group-hover:-translate-x-0.5 transition-transform" />
                </button>

                {/* Progress Indicator */}
                <div className="flex flex-col items-center mt-2">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">
                        Step {step + 1} of 4
                    </span>
                    <div className="flex gap-2">
                        {[0, 1, 2, 3].map((i) => (
                            <motion.div
                                key={i}
                                className="h-1 rounded-full"
                                initial={false}
                                animate={{
                                    width: i === step ? 24 : 6,
                                    backgroundColor: i <= step ? '#2563EB' : '#E2E8F0',
                                    opacity: i <= step ? 1 : 0.5,
                                }}
                                transition={{
                                    duration: 0.3,
                                    type: 'spring',
                                    stiffness: 300,
                                    damping: 30,
                                }}
                            />
                        ))}
                    </div>
                </div>

                <div className="w-11" />
            </div>

            {/* CONTENT AREA */}
            <div className="absolute inset-0 z-10 w-full h-full">
                <AnimatePresence initial={false} custom={direction} mode="wait">
                    {/* STEP 1: Personal Info */}
                    {step === 0 && (
                        <motion.div
                            key="step1"
                            custom={direction}
                            variants={variants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            transition={{
                                x: { type: 'spring', stiffness: 300, damping: 30 },
                                opacity: { duration: 0.2 },
                            }}
                            className="absolute inset-0 w-full h-full overflow-y-auto overflow-x-hidden"
                        >
                            <div className="pt-[110px] px-6 pb-40 min-h-full">
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.1 }}
                                >
                                    <h2 className="text-3xl font-extrabold text-slate-900 mb-3 tracking-tight">
                                        Who are you?
                                    </h2>
                                    <p className="text-slate-500 text-lg leading-relaxed mb-8">
                                        Let's verify your identity to begin the matchmaking process.
                                    </p>
                                </motion.div>

                                <div className="space-y-6">
                                    <Input
                                        id="fullname"
                                        label="Full Name"
                                        icon={<UserIcon className="w-5 h-5" />}
                                    />

                                    <Input
                                        id="dob"
                                        label="Date of Birth"
                                        value={formattedDob}
                                        readOnly
                                        onClick={() => setShowDatePicker(true)}
                                        icon={<CalendarIcon className="w-5 h-5" />}
                                    />

                                    <div className="pt-2">
                                        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1 mb-4 block">
                                            Gender Identity
                                        </label>
                                        <div className="grid grid-cols-2 gap-4">
                                            {['Male', 'Female'].map((option) => {
                                                const isSelected = gender === option.toLowerCase();
                                                return (
                                                    <button
                                                        key={option}
                                                        type="button"
                                                        onClick={() =>
                                                            setGender(option.toLowerCase() as any)
                                                        }
                                                        className={`relative h-[88px] rounded-3xl border-2 font-bold text-lg transition-all duration-300 flex items-center justify-center gap-3 overflow-hidden group
                                          ${
                                              isSelected
                                                  ? 'border-brand-blue bg-blue-50/80 text-brand-blue shadow-lg shadow-blue-500/10 scale-[1.02]'
                                                  : 'border-slate-100 bg-white text-slate-400 hover:border-slate-300 hover:bg-slate-50 active:scale-95'
                                          }`}
                                                    >
                                                        {isSelected && (
                                                            <motion.div
                                                                layoutId="gender-check"
                                                                className="absolute top-3 right-3 text-brand-blue"
                                                                transition={{
                                                                    type: 'spring',
                                                                    bounce: 0.2,
                                                                    duration: 0.6,
                                                                }}
                                                            >
                                                                <div className="w-6 h-6 bg-brand-blue rounded-full flex items-center justify-center shadow-sm">
                                                                    <CheckIcon className="w-3.5 h-3.5 text-white stroke-[3px]" />
                                                                </div>
                                                            </motion.div>
                                                        )}
                                                        <span className="z-10 relative">
                                                            {option}
                                                        </span>
                                                        {!isSelected && (
                                                            <div className="absolute inset-0 bg-slate-50 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                        )}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* STEP 2: Professional Info */}
                    {step === 1 && (
                        <motion.div
                            key="step2"
                            custom={direction}
                            variants={variants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            transition={{
                                x: { type: 'spring', stiffness: 300, damping: 30 },
                                opacity: { duration: 0.2 },
                            }}
                            className="absolute inset-0 w-full h-full overflow-y-auto overflow-x-hidden"
                        >
                            <div className="pt-[110px] px-6 pb-40 min-h-full">
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.1 }}
                                    className="mb-8"
                                >
                                    <div className="flex items-center gap-3 mb-3">
                                        <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                                            Credentials
                                        </h2>
                                        <div className="px-2.5 py-1 bg-emerald-100/80 text-emerald-700 text-[10px] font-bold uppercase tracking-widest rounded-md flex items-center gap-1.5 border border-emerald-200">
                                            <BadgeIcon className="w-3 h-3" />
                                            Verified
                                        </div>
                                    </div>
                                    <p className="text-slate-500 text-lg leading-relaxed">
                                        Your medical license will be verified against the national
                                        registry.
                                    </p>
                                </motion.div>

                                <div className="space-y-6">
                                    <Input
                                        id="license"
                                        label="Medical License Number"
                                        icon={<BadgeIcon className="w-5 h-5" />}
                                        placeholder="MD-2024-XXXX"
                                    />
                                    <Input
                                        id="specialization"
                                        label="Specialization"
                                        icon={<StethoscopeIcon className="w-5 h-5" />}
                                        placeholder="e.g. Cardiology"
                                    />
                                    <Input
                                        id="hospital"
                                        label="Hospital / Practice"
                                        icon={<StethoscopeIcon className="w-5 h-5" />}
                                        placeholder="e.g. City General"
                                    />
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* STEP 3: Account Info */}
                    {step === 2 && (
                        <motion.div
                            key="step3"
                            custom={direction}
                            variants={variants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            transition={{
                                x: { type: 'spring', stiffness: 300, damping: 30 },
                                opacity: { duration: 0.2 },
                            }}
                            className="absolute inset-0 w-full h-full overflow-y-auto overflow-x-hidden"
                        >
                            <div className="pt-[110px] px-6 pb-40 min-h-full">
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.1 }}
                                    className="mb-8"
                                >
                                    <h2 className="text-3xl font-extrabold text-slate-900 mb-3 tracking-tight">
                                        Secure Access
                                    </h2>
                                    <p className="text-slate-500 text-lg leading-relaxed">
                                        Create a secure login and add a verified phone number.
                                    </p>
                                </motion.div>

                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <Input
                                        id="reg-email"
                                        type="email"
                                        label="Email Address"
                                        icon={<MailIcon className="w-5 h-5" />}
                                    />

                                    {/* Phone Number Input */}
                                    <Input
                                        id="reg-phone"
                                        type="tel"
                                        label="Mobile Number"
                                        icon={<PhoneIcon className="w-5 h-5" />}
                                        value={phoneNumber}
                                        onChange={(e: any) =>
                                            setPhoneNumber((e.target as any).value)
                                        }
                                    />

                                    <Input
                                        id="reg-pass"
                                        type="password"
                                        label="Create Password"
                                        icon={<LockIcon className="w-5 h-5" />}
                                    />
                                    <Input
                                        id="reg-confirm"
                                        type="password"
                                        label="Confirm Password"
                                        icon={<LockIcon className="w-5 h-5" />}
                                    />

                                    <div className="h-2" />

                                    <motion.div
                                        whileHover={{ scale: 1.01 }}
                                        className="p-5 bg-blue-50/80 backdrop-blur-sm rounded-2xl border border-blue-100 shadow-[0_2px_10px_-4px_rgba(37,99,235,0.1)]"
                                    >
                                        <p className="text-xs text-blue-800 leading-relaxed text-center font-medium">
                                            By applying, you confirm you are a registered medical
                                            practitioner and agree to our{' '}
                                            <span className="font-bold cursor-pointer hover:underline text-brand-blue">
                                                Terms of Service
                                            </span>
                                            .
                                        </p>
                                    </motion.div>
                                </form>
                            </div>
                        </motion.div>
                    )}

                    {/* STEP 4: OTP Verification */}
                    {step === 3 && (
                        <motion.div
                            key="step4"
                            custom={direction}
                            variants={variants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            transition={{
                                x: { type: 'spring', stiffness: 300, damping: 30 },
                                opacity: { duration: 0.2 },
                            }}
                            className="absolute inset-0 w-full h-full overflow-y-auto overflow-x-hidden"
                        >
                            <div className="pt-[110px] px-6 pb-40 min-h-full flex flex-col items-center">
                                <motion.div
                                    initial={{ scale: 0.8, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-6"
                                >
                                    <SmartphoneIcon className="w-10 h-10 text-slate-900" />
                                </motion.div>

                                <h2 className="text-2xl font-extrabold text-slate-900 mb-2 text-center">
                                    Verify It's You
                                </h2>
                                <p className="text-slate-500 text-center text-sm mb-8 leading-relaxed max-w-[280px]">
                                    We sent a 4-digit code to{' '}
                                    <span className="font-bold text-slate-900">
                                        {phoneNumber || 'your phone'}
                                    </span>
                                    . Enter it below to complete registration.
                                </p>

                                <OtpInput onComplete={handleVerifyOtp} />

                                {isLoading && (
                                    <p className="text-sm text-brand-blue font-bold mt-8 animate-pulse">
                                        Verifying code...
                                    </p>
                                )}

                                <p className="text-xs text-slate-400 mt-8">
                                    Didn't receive code?{' '}
                                    <button className="font-bold text-brand-blue">Resend</button>
                                </p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Footer Action Button */}
            {step < 3 && (
                <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-slate-50 via-slate-50/95 to-transparent z-40">
                    <Button
                        onClick={step === 2 ? (handleSubmit as any) : nextStep}
                        disabled={step === 0 && !gender}
                        isLoading={isLoading}
                        className={`shadow-xl shadow-brand-blue/20 ${step === 0 && !gender ? 'opacity-50 grayscale' : ''}`}
                    >
                        {step === 2 ? 'Verify & Submit' : 'Next Step'}
                    </Button>
                </div>
            )}

            {/* Date Picker Modal */}
            <DatePicker
                isOpen={showDatePicker}
                onClose={() => setShowDatePicker(false)}
                onSelect={(date) => {
                    setDob(date);
                    setShowDatePicker(false);
                }}
                initialDate={dob}
            />
        </div>
    );
};

export default RegistrationFlow;
