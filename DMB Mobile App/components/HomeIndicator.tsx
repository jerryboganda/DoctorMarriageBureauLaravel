import React from 'react';

const HomeIndicator: React.FC = () => {
    return (
        <div className="absolute bottom-0 w-full pt-4 pb-2 flex justify-center z-50 pointer-events-none">
            <div className="w-32 h-1.5 bg-transparent rounded-full" />
        </div>
    );
};

export default HomeIndicator;
