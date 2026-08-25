import React, { useState, useEffect } from 'react';

const StatusBar: React.FC = () => {
    const [time, setTime] = useState('');

    useEffect(() => {
        const updateTime = () => {
            const now = new Date();
            setTime(
                now
                    .toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: true,
                    })
                    .replace(' PM', '')
                    .replace(' AM', ''),
            );
        };
        updateTime();
        const interval = setInterval(updateTime, 1000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="w-full h-12 flex justify-between items-end px-6 pb-2 text-slate-900 font-bold text-sm select-none z-50">
            <div className="w-20">
                <span>9:41</span>
            </div>
            <div className="flex gap-2 items-center">
                {/* Signal */}
                <svg width="18" height="12" viewBox="0 0 18 12" fill="currentColor">
                    <path d="M1 10H3V12H1V10ZM5 7H7V12H5V7ZM9 4H11V12H9V4ZM13 1H15V12H13V1Z" />
                </svg>
                {/* Wifi */}
                <svg width="18" height="12" viewBox="0 0 18 12" fill="currentColor">
                    <path d="M9.00002 2.82422C11.8906 2.82422 14.5274 3.88281 16.5899 5.61719L17.9258 4.02734C15.5489 2.03125 12.4414 0.773438 9.00002 0.773438C5.55861 0.773438 2.45119 2.03125 0.074234 4.02734L1.41017 5.61719C3.47267 3.88281 6.1094 2.82422 9.00002 2.82422ZM9.00002 6.41797C10.6328 6.41797 12.1328 6.94531 13.3399 7.82812L14.6758 6.23828C13.125 5.10547 11.1719 4.36719 9.00002 4.36719C6.82814 4.36719 4.87502 5.10547 3.32423 6.23828L4.66017 7.82812C5.86721 6.94531 7.36721 6.41797 9.00002 6.41797ZM9.00002 10.0117C9.37502 10.0117 9.72658 10.0742 10.0625 10.1914L11.4258 8.56641C10.7149 8.16797 9.88283 7.96094 9.00002 7.96094C8.11721 7.96094 7.28517 8.16797 6.57423 8.56641L7.93752 10.1914C8.27346 10.0742 8.62502 10.0117 9.00002 10.0117Z" />
                </svg>
                {/* Battery */}
                <div className="w-6 h-3 rounded-[3px] border border-slate-900 relative ml-1">
                    <div className="absolute inset-0.5 bg-slate-900 rounded-[1px] w-[80%]" />
                </div>
            </div>
        </div>
    );
};

export default StatusBar;
