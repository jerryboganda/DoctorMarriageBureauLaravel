import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XIcon, CheckCircleIcon, ShieldIcon, FileBadgeIcon } from './Icons';
import Button from './Button';

interface VerificationModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const VerificationModal: React.FC<VerificationModalProps> = ({ isOpen, onClose }) => {
    const [step, setStep] = useState(0); // 0: Intro, 1: Scan, 2: Success
    const [isScanning, setIsScanning] = useState(false);

    const startScan = () => {
        setStep(1);
        setIsScanning(true);
        setTimeout(() => {
            setIsScanning(false);
            setStep(2);
        }, 3000);
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-slate-900/80 backdrop-blur-md z-[70] flex items-center justify-center p-6"
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full max-w-sm bg-white rounded-[2rem] overflow-hidden shadow-2xl relative flex flex-col min-h-[400px]"
                        >
                            <button
                                onClick={onClose}
                                className="absolute top-4 right-4 p-2 bg-black/5 hover:bg-black/10 rounded-full z-10"
                            >
                                <XIcon className="w-5 h-5 text-slate-500" />
                            </button>

                            <div className="flex-1 p-6 flex flex-col items-center justify-center text-center">
                                <AnimatePresence mode="wait">
                                    {/* STEP 0: INTRO */}
                                    {step === 0 && (
                                        <motion.div
                                            key="intro"
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -20 }}
                                            className="flex flex-col items-center"
                                        >
                                            <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-6 ring-4 ring-blue-100">
                                                <FileBadgeIcon className="w-10 h-10 text-brand-blue" />
                                            </div>
                                            <h2 className="text-2xl font-black text-slate-900 mb-2">
                                                Verify Identity
                                            </h2>
                                            <p className="text-slate-500 text-sm mb-8 leading-relaxed">
                                                To maintain a trusted community, we require a
                                                government-issued ID verification. Your data is
                                                encrypted and deleted after verification.
                                            </p>
                                            <Button onClick={startScan}>Start Verification</Button>
                                            <div className="mt-4 flex items-center gap-2 text-xs text-slate-400 font-medium">
                                                <ShieldIcon className="w-3 h-3" />
                                                <span>256-bit AES Encryption</span>
                                            </div>
                                        </motion.div>
                                    )}

                                    {/* STEP 1: SCANNING SIMULATION */}
                                    {step === 1 && (
                                        <motion.div
                                            key="scan"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            className="flex flex-col items-center w-full"
                                        >
                                            <h3 className="font-bold text-slate-900 mb-6">
                                                Scanning Document...
                                            </h3>
                                            <div className="relative w-full aspect-[1.58] bg-slate-900 rounded-xl overflow-hidden border-2 border-slate-200 shadow-inner">
                                                {/* Mock ID Card */}
                                                <div className="absolute inset-4 bg-slate-200 rounded-lg opacity-20" />
                                                <div className="absolute top-8 left-8 w-16 h-16 bg-slate-200 rounded-full opacity-30" />
                                                <div className="absolute top-8 left-32 h-4 w-32 bg-slate-200 rounded opacity-30" />
                                                <div className="absolute top-16 left-32 h-3 w-20 bg-slate-200 rounded opacity-30" />

                                                {/* Scanning Beam */}
                                                <motion.div
                                                    animate={{ top: ['0%', '100%', '0%'] }}
                                                    transition={{
                                                        duration: 2,
                                                        repeat: Infinity,
                                                        ease: 'linear',
                                                    }}
                                                    className="absolute left-0 right-0 h-1 bg-green-500 shadow-[0_0_20px_rgba(34,197,94,0.8)] z-10"
                                                />
                                                <div className="absolute inset-0 border-[3px] border-white/30 rounded-xl m-4 pointer-events-none" />
                                            </div>
                                            <p className="text-sm text-slate-400 mt-6 animate-pulse">
                                                Align your ID within the frame
                                            </p>
                                        </motion.div>
                                    )}

                                    {/* STEP 2: SUCCESS */}
                                    {step === 2 && (
                                        <motion.div
                                            key="success"
                                            initial={{ opacity: 0, scale: 0.8 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            className="flex flex-col items-center"
                                        >
                                            <motion.div
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                                className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-6"
                                            >
                                                <CheckCircleIcon className="w-12 h-12 text-green-600" />
                                            </motion.div>
                                            <h2 className="text-2xl font-black text-slate-900 mb-2">
                                                Verification Complete
                                            </h2>
                                            <p className="text-slate-500 text-sm mb-8">
                                                Thank you! Your identity has been verified securely.
                                                You now have the verified badge.
                                            </p>
                                            <Button
                                                onClick={onClose}
                                                className="bg-green-600 hover:bg-green-700 shadow-green-500/30"
                                            >
                                                Continue
                                            </Button>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </motion.div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default VerificationModal;
