import React, { useEffect, useState } from 'react';

interface LoadingTimeoutFallbackProps {
    message: string;
    timeoutMs?: number;
    reloadLabel?: string;
    compact?: boolean;
}

const LoadingTimeoutFallback: React.FC<LoadingTimeoutFallbackProps> = ({
    message,
    timeoutMs = 12000,
    reloadLabel = 'Reload page',
    compact = false,
}) => {
    const [showReload, setShowReload] = useState(false);

    useEffect(() => {
        const timer = window.setTimeout(() => setShowReload(true), timeoutMs);
        return () => window.clearTimeout(timer);
    }, [timeoutMs]);

    return (
        <div className="text-center">
            <div className={`animate-spin rounded-full border-b-2 border-primary mx-auto ${compact ? 'h-8 w-8 mb-3' : 'h-12 w-12 mb-4'}`}></div>
            <p className={`text-slate-700 ${compact ? 'text-sm font-semibold' : ''}`}>{message}</p>
            {showReload && (
                <button
                    onClick={() => window.location.reload()}
                    className={`mt-4 px-4 py-2 rounded-lg bg-primary text-white font-semibold hover:bg-primary/90 transition-colors ${compact ? 'text-sm' : ''}`}
                >
                    {reloadLabel}
                </button>
            )}
        </div>
    );
};

export default LoadingTimeoutFallback;
