import React from 'react';

interface MobileFrameProps {
    children: React.ReactNode;
}

const MobileFrame: React.FC<MobileFrameProps> = ({ children }) => {
    return (
        <div className="min-h-screen w-full bg-[#111] flex items-center justify-center p-0 md:p-8 font-sans overflow-hidden">
            {/* Desktop Device Simulator Frame */}
            <div className="w-full h-[100dvh] md:h-[844px] md:max-w-[390px] bg-black md:rounded-[3rem] overflow-hidden relative shadow-2xl md:ring-8 ring-gray-900 z-0">
                {/* Mobile Content Area */}
                <div className="absolute inset-0 z-10 flex flex-col">{children}</div>

                {/* Device Shine/Reflection for Desktop Wow Factor */}
                <div className="hidden md:block absolute inset-0 pointer-events-none z-20 rounded-[3rem] shadow-[inset_0_0_20px_rgba(255,255,255,0.05)]" />
            </div>
        </div>
    );
};

export default MobileFrame;
