import React, { useState, useRef, useEffect } from 'react';
import { Phone, Mail, X, MessageCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const PHONE_NUMBER = '+923368899996';
const EMAIL_ADDRESS = 'support@doctormarriagebureau.com.pk';
const EMAIL_BODY = 'I would like to get customer support for an issue. Please contact me early as possible !';
const EMAIL_HREF = `mailto:${EMAIL_ADDRESS}?body=${encodeURIComponent(EMAIL_BODY)}`;
const WHATSAPP_URL = `https://wa.me/923368899996`;

type FloatingContactButtonProps = {
    placement?: 'default' | 'chat';
};

const FloatingContactButton: React.FC<FloatingContactButtonProps> = ({ placement = 'default' }) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const isChatPlacement = placement === 'chat';
    const containerPositionClass = isChatPlacement
        ? 'fixed bottom-28 right-4 sm:bottom-28 md:bottom-32 md:right-6'
        : 'fixed bottom-6 right-6';
    const actionButtonSizeClass = isChatPlacement
        ? 'w-11 h-11 sm:w-12 sm:h-12'
        : 'w-12 h-12';
    const mainButtonSizeClass = isChatPlacement
        ? 'w-12 h-12 sm:w-14 sm:h-14'
        : 'w-14 h-14';

    // Close on outside click
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    const actions = [
        {
            label: 'Call Us',
            icon: Phone,
            href: `tel:${PHONE_NUMBER}`,
            bg: 'bg-emerald-500 hover:bg-emerald-600',
            shadow: 'shadow-emerald-500/30',
        },
        {
            label: 'WhatsApp',
            icon: () => (
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
            ),
            href: WHATSAPP_URL,
            bg: 'bg-green-500 hover:bg-green-600',
            shadow: 'shadow-green-500/30',
            target: '_blank',
        },
        {
            label: 'Email Us',
            icon: Mail,
            href: EMAIL_HREF,
            bg: 'bg-blue-500 hover:bg-blue-600',
            shadow: 'shadow-blue-500/30',
        },
    ];

    return (
        <div ref={containerRef} className={`${containerPositionClass} z-[9999] flex flex-col items-end gap-3`}>
            {/* Action Buttons */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="flex flex-col items-end gap-3 mb-1"
                    >
                        {actions.map((action, index) => {
                            const IconComponent = action.icon;
                            return (
                                <motion.a
                                    key={action.label}
                                    href={action.href}
                                    target={action.target || '_self'}
                                    rel={action.target === '_blank' ? 'noopener noreferrer' : undefined}
                                    initial={{ opacity: 0, y: 20, scale: 0.8 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 10, scale: 0.8 }}
                                    transition={{
                                        duration: 0.25,
                                        delay: index * 0.07,
                                        type: 'spring',
                                        stiffness: 400,
                                        damping: 25,
                                    }}
                                    className={`flex items-center gap-3 group`}
                                    onClick={() => setIsOpen(false)}
                                >
                                    {/* Label tooltip */}
                                    <span className="px-3 py-1.5 rounded-lg bg-slate-800 text-white text-sm font-medium shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none">
                                        {action.label}
                                    </span>
                                    {/* Icon circle */}
                                    <div
                                        className={`${actionButtonSizeClass} rounded-full ${action.bg} text-white flex items-center justify-center shadow-lg ${action.shadow} transition-all duration-200 hover:scale-110`}
                                    >
                                        <IconComponent className="w-5 h-5" />
                                    </div>
                                </motion.a>
                            );
                        })}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Main FAB Button */}
            <motion.button
                onClick={() => setIsOpen((prev) => !prev)}
                className={`${mainButtonSizeClass} rounded-full bg-primary hover:bg-primary-hover text-white flex items-center justify-center shadow-xl shadow-primary/30 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2`}
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.95 }}
                aria-label="Contact us"
            >
                <AnimatePresence mode="wait">
                    {isOpen ? (
                        <motion.div
                            key="close"
                            initial={{ rotate: -90, opacity: 0 }}
                            animate={{ rotate: 0, opacity: 1 }}
                            exit={{ rotate: 90, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                        >
                            <X className="w-6 h-6" />
                        </motion.div>
                    ) : (
                        <motion.div
                            key="open"
                            initial={{ rotate: 90, opacity: 0 }}
                            animate={{ rotate: 0, opacity: 1 }}
                            exit={{ rotate: -90, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                        >
                            <MessageCircle className="w-6 h-6" />
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.button>
        </div>
    );
};

export default FloatingContactButton;
