import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Mic, MicOff, Video, VideoOff, PhoneOff, MessageSquare, MoreVertical, Users } from 'lucide-react';

interface CallModalProps {
  participantName: string;
  participantImage: string;
  type: 'video' | 'audio';
  onEndCall: () => void;
}

const CallModal: React.FC<CallModalProps> = ({ participantName, participantImage, type, onEndCall }) => {
  const { t } = useTranslation();
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(type === 'audio');
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setDuration(d => d + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="fixed inset-0 bg-slate-900 z-50 flex flex-col items-center justify-center animate-in fade-in duration-300">
      
      {/* Main Video Area */}
      <div className="relative w-full h-full flex flex-col">
        {/* Header Overlay */}
        <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-start z-10 bg-gradient-to-b from-black/50 to-transparent">
             <div className="text-white">
                 <h3 className="text-xl font-bold flex items-center gap-2">
                    {type === 'video' ? <Video size={20} /> : <Users size={20} />} 
                    {t('modals.call.secureCall')}
                 </h3>
                 <p className="text-white/80 text-sm flex items-center gap-2">
                    <span className="size-2 bg-red-500 rounded-full animate-pulse"></span>
                    {formatTime(duration)} • {participantName}
                 </p>
             </div>
             <button className="p-2 bg-white/10 rounded-full text-white hover:bg-white/20 backdrop-blur-md">
                 <MoreVertical size={20} />
             </button>
        </div>

        {/* Participant Video/Image */}
        <div className="flex-1 bg-slate-800 relative overflow-hidden flex items-center justify-center">
             {!isVideoOff ? (
                 <>
                    <img 
                        src={participantImage} 
                        className="w-full h-full object-cover opacity-90 blur-sm scale-110" 
                        alt="Background" 
                    />
                    <img 
                        src={participantImage} 
                        className="absolute w-full h-full object-contain" 
                        alt={participantName} 
                    />
                 </>
             ) : (
                 <div className="flex flex-col items-center gap-4 animate-pulse">
                     <div className="size-32 rounded-full border-4 border-slate-700 p-1">
                        <img src={participantImage} className="w-full h-full object-cover rounded-full" alt={participantName} />
                     </div>
                     <h2 className="text-2xl font-bold text-white">{participantName}</h2>
                     <p className="text-slate-400">{t('modals.call.audioCall')}</p>
                 </div>
             )}

             {/* Self View (Picture-in-Picture) */}
             {!isVideoOff && (
                 <div className="absolute bottom-24 right-6 w-32 h-48 bg-black rounded-xl border border-white/20 shadow-2xl overflow-hidden">
                     <div className="w-full h-full bg-slate-700 flex items-center justify-center">
                        <span className="text-xs text-white/50">{t('modals.call.you')}</span>
                     </div>
                 </div>
             )}
        </div>

        {/* Controls Bar */}
        <div className="h-24 bg-slate-900 flex items-center justify-center gap-6 px-6 shrink-0">
             <button 
                onClick={() => setIsMuted(!isMuted)}
                className={`p-4 rounded-full transition-all ${isMuted ? 'bg-white text-slate-900' : 'bg-slate-700 text-white hover:bg-slate-600'}`}
             >
                 {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
             </button>
             
             <button 
                onClick={() => setIsVideoOff(!isVideoOff)}
                className={`p-4 rounded-full transition-all ${isVideoOff ? 'bg-white text-slate-900' : 'bg-slate-700 text-white hover:bg-slate-600'}`}
             >
                 {isVideoOff ? <VideoOff size={24} /> : <Video size={24} />}
             </button>

             <button 
                onClick={onEndCall}
                className="p-4 rounded-full bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-500/30 scale-110"
             >
                 <PhoneOff size={28} />
             </button>

             <button className="p-4 rounded-full bg-slate-700 text-white hover:bg-slate-600">
                 <MessageSquare size={24} />
             </button>
        </div>
      </div>
    </div>
  );
};

export default CallModal;
