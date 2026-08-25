import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart,
  MessageSquare,
  Sparkles,
  ShieldCheck,
  Coins,
  CheckCircle2,
  AlertCircle,
  Info,
  X,
  ArrowRight,
  UserCheck,
  ExternalLink,
} from 'lucide-react';
import type { ToastItem, ToastType } from '../../types/toast';
import { TOAST_EVENT_NAME, TOAST_DISMISS_EVENT } from '../../lib/toast';
import { notificationAudio } from '../../utils/audioChime';

export default function ToastContainer() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  // Add toast with max-limit
  const addToast = useCallback((item: ToastItem) => {
    setToasts((prev) => {
      // Avoid exact duplicate IDs
      const filtered = prev.filter((t) => t.id !== item.id);
      // Keep up to 4 most recent toasts
      const next = [item, ...filtered].slice(0, 4);
      return next;
    });

    // Play subtle audio chime based on toast type
    if (item.sound !== false) {
      if (item.type === 'proposal' || item.type === 'proposal_accepted' || item.type === 'match') {
        notificationAudio.playChime('proposal');
      } else if (item.type === 'message') {
        notificationAudio.playChime('message');
      } else if (item.type === 'success' || item.type === 'coins' || item.type === 'verification') {
        notificationAudio.playChime('success');
      } else {
        notificationAudio.playChime('alert');
      }
    }
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Listen to global custom events
  useEffect(() => {
    const handleToastEvent = (e: Event) => {
      const customEvent = e as CustomEvent<ToastItem>;
      if (customEvent.detail) {
        addToast(customEvent.detail);
      }
    };

    const handleDismissEvent = (e: Event) => {
      const customEvent = e as CustomEvent<{ id: string }>;
      if (customEvent.detail?.id) {
        removeToast(customEvent.detail.id);
      }
    };

    window.addEventListener(TOAST_EVENT_NAME, handleToastEvent);
    window.addEventListener(TOAST_DISMISS_EVENT, handleDismissEvent);

    return () => {
      window.removeEventListener(TOAST_EVENT_NAME, handleToastEvent);
      window.removeEventListener(TOAST_DISMISS_EVENT, handleDismissEvent);
    };
  }, [addToast, removeToast]);

  return (
    <div 
      id="dmb-framer-toast-root"
      className="fixed top-4 right-4 z-[99999] flex flex-col gap-3 w-full max-w-sm sm:max-w-md pointer-events-none px-3 sm:px-0"
      aria-live="polite"
    >
      <AnimatePresence mode="popLayout" initial={false}>
        {toasts.map((toast) => (
          <ToastCard 
            key={toast.id} 
            toast={toast} 
            onDismiss={() => removeToast(toast.id)} 
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

// Individual Animated Toast Component
interface ToastCardProps {
  toast: ToastItem;
  onDismiss: () => void;
}

function ToastCard({ toast, onDismiss }: ToastCardProps) {
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(100);
  const duration = toast.duration || 5000;
  const startTimeRef = useRef<number>(Date.now());
  const remainingTimeRef = useRef<number>(duration);

  // Auto-dismiss countdown timer with pause-on-hover
  useEffect(() => {
    if (duration <= 0) return;

    let intervalId: any;
    let timeoutId: any;

    if (!isPaused) {
      startTimeRef.current = Date.now();
      
      // Update progress bar
      intervalId = setInterval(() => {
        const elapsed = Date.now() - startTimeRef.current;
        const currentRemaining = Math.max(0, remainingTimeRef.current - elapsed);
        const percent = (currentRemaining / duration) * 100;
        setProgress(percent);

        if (currentRemaining <= 0) {
          clearInterval(intervalId);
          onDismiss();
        }
      }, 50);

      timeoutId = setTimeout(() => {
        onDismiss();
      }, remainingTimeRef.current);
    }

    return () => {
      clearInterval(intervalId);
      clearTimeout(timeoutId);
    };
  }, [isPaused, duration, onDismiss]);

  const handleMouseEnter = () => {
    const elapsed = Date.now() - startTimeRef.current;
    remainingTimeRef.current = Math.max(0, remainingTimeRef.current - elapsed);
    setIsPaused(true);
  };

  const handleMouseLeave = () => {
    setIsPaused(false);
  };

  // Toast theme styling mapping
  const getTheme = (type: ToastType) => {
    switch (type) {
      case 'proposal':
      case 'proposal_accepted':
        return {
          border: 'border-brand-300 shadow-[0_10px_35px_rgba(255,32,110,0.18)]',
          headerBg: 'from-brand-500 to-pink-600',
          badgeBg: 'bg-brand-50 text-brand-700 border-brand-200',
          icon: <Heart className="w-4 h-4 text-white fill-white animate-pulse" />,
          progressColor: 'bg-gradient-to-r from-brand-500 to-pink-600',
          glow: 'before:absolute before:inset-0 before:rounded-3xl before:bg-brand-500/5 before:pointer-events-none',
        };
      case 'message':
        return {
          border: 'border-sky-300 shadow-[0_10px_35px_rgba(14,165,233,0.18)]',
          headerBg: 'from-sky-500 to-indigo-600',
          badgeBg: 'bg-sky-50 text-sky-700 border-sky-200',
          icon: <MessageSquare className="w-4 h-4 text-white fill-white/80" />,
          progressColor: 'bg-gradient-to-r from-sky-500 to-indigo-600',
          glow: 'before:absolute before:inset-0 before:rounded-3xl before:bg-sky-500/5 before:pointer-events-none',
        };
      case 'match':
        return {
          border: 'border-amber-300 shadow-[0_10px_35px_rgba(245,158,11,0.18)]',
          headerBg: 'from-amber-500 via-rose-500 to-pink-600',
          badgeBg: 'bg-amber-50 text-amber-800 border-amber-200',
          icon: <Sparkles className="w-4 h-4 text-white fill-white" />,
          progressColor: 'bg-gradient-to-r from-amber-500 via-rose-500 to-pink-600',
          glow: 'before:absolute before:inset-0 before:rounded-3xl before:bg-amber-500/5 before:pointer-events-none',
        };
      case 'verification':
        return {
          border: 'border-emerald-300 shadow-[0_10px_35px_rgba(16,185,129,0.18)]',
          headerBg: 'from-emerald-600 to-teal-600',
          badgeBg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
          icon: <ShieldCheck className="w-4 h-4 text-white" />,
          progressColor: 'bg-emerald-500',
          glow: '',
        };
      case 'coins':
        return {
          border: 'border-amber-300 shadow-[0_10px_35px_rgba(245,158,11,0.2)]',
          headerBg: 'from-amber-500 to-yellow-500',
          badgeBg: 'bg-amber-50 text-amber-800 border-amber-200',
          icon: <Coins className="w-4 h-4 text-white" />,
          progressColor: 'bg-amber-500',
          glow: '',
        };
      case 'success':
        return {
          border: 'border-emerald-200 shadow-luxury',
          headerBg: 'from-emerald-600 to-emerald-700',
          badgeBg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
          icon: <CheckCircle2 className="w-4 h-4 text-white" />,
          progressColor: 'bg-emerald-500',
          glow: '',
        };
      case 'error':
        return {
          border: 'border-rose-300 shadow-luxury',
          headerBg: 'from-rose-600 to-red-700',
          badgeBg: 'bg-rose-50 text-rose-800 border-rose-200',
          icon: <AlertCircle className="w-4 h-4 text-white" />,
          progressColor: 'bg-rose-500',
          glow: '',
        };
      default:
        return {
          border: 'border-navy-200 shadow-luxury',
          headerBg: 'from-navy-700 to-navy-900',
          badgeBg: 'bg-navy-50 text-navy-800 border-navy-200',
          icon: <Info className="w-4 h-4 text-white" />,
          progressColor: 'bg-brand-500',
          glow: '',
        };
    }
  };

  const theme = getTheme(toast.type);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -25, scale: 0.92, filter: 'blur(4px)' }}
      animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
      exit={{ opacity: 0, scale: 0.90, x: 80, transition: { duration: 0.22 } }}
      transition={{ type: 'spring', stiffness: 420, damping: 28 }}
      drag="x"
      dragConstraints={{ left: 0, right: 160 }}
      onDragEnd={(_, info) => {
        if (info.offset.x > 80) {
          onDismiss();
        }
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`pointer-events-auto relative w-full rounded-3xl bg-white/95 backdrop-blur-md border ${theme.border} p-4 sm:p-4.5 overflow-hidden transition-shadow select-none group ${theme.glow}`}
      role="alert"
    >
      {/* Top Bar with Icon, Title, and Close Button */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className={`w-8 h-8 rounded-2xl bg-gradient-to-tr ${theme.headerBg} flex items-center justify-center shadow-md shrink-0`}>
            {theme.icon}
          </div>
          <div className="min-w-0">
            <h4 className="text-xs sm:text-sm font-bold text-navy-900 leading-tight truncate">
              {toast.title}
            </h4>
            <span className="text-[10px] text-navy-400 font-medium">Just now</span>
          </div>
        </div>

        <button
          type="button"
          onClick={onDismiss}
          className="w-7 h-7 rounded-full bg-navy-50 hover:bg-navy-100 text-navy-400 hover:text-navy-700 flex items-center justify-center transition-colors shrink-0 -mr-1 -mt-1"
          aria-label="Dismiss notification"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Main Toast Body */}
      <div className="mt-3">
        {/* If this is a Proposal, Match, or Message with Doctor Card preview */}
        {(toast.doctorName || toast.avatar) ? (
          <div className="flex items-center gap-3 p-2.5 rounded-2xl bg-gradient-to-r from-navy-50/70 to-brand-50/40 border border-navy-100/80 mb-3">
            {toast.avatar && (
              <div className="relative w-11 h-11 rounded-full overflow-hidden bg-navy-100 ring-2 ring-white shadow-sm shrink-0">
                <img 
                  src={toast.avatar} 
                  alt={toast.doctorName || 'Doctor'} 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/doctors/doctor1.png';
                  }}
                />
                {toast.score && (
                  <div className="absolute -bottom-1 -right-1 px-1 rounded-full bg-emerald-500 text-white text-[8px] font-extrabold shadow-sm">
                    {toast.score}%
                  </div>
                )}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-1">
                <p className="text-xs font-bold text-navy-800 truncate">
                  {toast.doctorName}
                </p>
                {toast.score && (
                  <span className="text-[10px] font-bold text-brand-600 bg-brand-50 px-1.5 py-0.5 rounded-full border border-brand-200 shrink-0">
                    ✨ {toast.score}% Match
                  </span>
                )}
              </div>
              {toast.specialty && (
                <p className="text-[11px] font-semibold text-brand-600 truncate">
                  {toast.specialty}
                </p>
              )}
              {toast.hospital && (
                <p className="text-[10px] text-navy-500 truncate">
                  📍 {toast.hospital}
                </p>
              )}
            </div>
          </div>
        ) : null}

        {/* Message description */}
        <p className="text-xs text-navy-600 leading-relaxed font-normal">
          {toast.message}
        </p>

        {/* Action Buttons */}
        {toast.actions && toast.actions.length > 0 && (
          <div className="flex items-center gap-2 mt-3 pt-2 border-t border-navy-100/70">
            {toast.actions.map((act, idx) => {
              const isPrimary = act.primary !== false;
              const buttonClass = isPrimary
                ? "flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-brand-500 via-brand-600 to-pink-600 hover:from-brand-600 hover:to-pink-700 text-white text-xs font-bold shadow-md shadow-brand-500/25 transition-all text-center flex items-center justify-center gap-1.5 active:scale-[0.98]"
                : "py-2 px-3 rounded-xl bg-navy-50 hover:bg-navy-100 text-navy-700 text-xs font-bold border border-navy-200 transition-colors text-center";

              if (act.href) {
                return (
                  <a
                    key={idx}
                    href={act.href}
                    onClick={() => {
                      if (act.onClick) act.onClick();
                      onDismiss();
                    }}
                    className={buttonClass}
                  >
                    <span>{act.label}</span>
                    {isPrimary && <ArrowRight className="w-3.5 h-3.5" />}
                  </a>
                );
              }

              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    if (act.onClick) act.onClick();
                    onDismiss();
                  }}
                  className={buttonClass}
                >
                  <span>{act.label}</span>
                  {isPrimary && <UserCheck className="w-3.5 h-3.5" />}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Animated Remaining Duration Progress Bar */}
      {duration > 0 && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-navy-100/60 overflow-hidden">
          <div
            className={`h-full ${theme.progressColor} transition-all ease-linear`}
            style={{ width: `${progress}%`, transitionDuration: '50ms' }}
          />
        </div>
      )}
    </motion.div>
  );
}
