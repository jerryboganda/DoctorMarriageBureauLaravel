import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XIcon, RobotIcon, MagicWandIcon, LightbulbIcon, ChartBarIcon, CheckIcon, SparklesIcon } from './Icons';
import Button from './Button';

interface AIAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'bio' | 'coach' | 'analysis';
}

const AIAssistantModal: React.FC<AIAssistantModalProps> = ({ isOpen, onClose, defaultTab = 'coach' }) => {
  const [activeTab, setActiveTab] = useState<'bio' | 'coach' | 'analysis'>(defaultTab);
  const [bioText, setBioText] = useState("I'm a doctor who likes hiking.");
  const [generatedBio, setGeneratedBio] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const generateBio = () => {
    setIsGenerating(true);
    setTimeout(() => {
        setGeneratedBio("Passionate medical professional by day, avid mountain explorer by weekend. Seeking a partner to share both quiet coffee moments and summit views.");
        setIsGenerating(false);
    }, 2000);
  };

  const tabs = [
      { id: 'bio', label: 'Bio Refinement', icon: MagicWandIcon },
      { id: 'coach', label: 'Chat Guide', icon: LightbulbIcon },
      { id: 'analysis', label: 'Profile Analysis', icon: ChartBarIcon },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm z-[100]"
          />
          
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="absolute bottom-0 left-0 right-0 h-[70vh] bg-slate-50 rounded-t-[2.5rem] z-[100] flex flex-col overflow-hidden shadow-2xl"
          >
             {/* Header */}
             <div className="px-6 pt-6 pb-2 flex items-center justify-between bg-white border-b border-slate-100">
                 <div className="flex items-center gap-2">
                     <div className="w-10 h-10 bg-indigo-500 rounded-full flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
                         <RobotIcon className="w-6 h-6" />
                     </div>
                     <div>
                         <h2 className="text-xl font-bold text-slate-900">AI Matchmaker</h2>
                         <p className="text-xs text-slate-500">Your personal marriage assistant</p>
                     </div>
                 </div>
                 <button onClick={onClose} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200">
                     <XIcon className="w-5 h-5 text-slate-500" />
                 </button>
             </div>

             {/* Tabs */}
             <div className="px-4 py-2 bg-white flex justify-between gap-2 border-b border-slate-100">
                 {tabs.map((tab) => (
                     <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`flex-1 py-3 rounded-xl flex flex-col items-center gap-1 transition-all ${activeTab === tab.id ? 'bg-indigo-50 text-indigo-600 shadow-sm ring-1 ring-indigo-200' : 'text-slate-400 hover:bg-slate-50'}`}
                     >
                         <tab.icon className="w-5 h-5" />
                         <span className="text-[10px] font-bold uppercase tracking-wide">{tab.label}</span>
                     </button>
                 ))}
             </div>

             {/* Content */}
             <div className="flex-1 overflow-y-auto p-6">
                <AnimatePresence mode="wait">
                    
                    {/* TAB: BIO POLISH */}
                    {activeTab === 'bio' && (
                        <motion.div key="bio" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 block">Original Bio</label>
                            <textarea 
                                value={bioText} 
                                onChange={(e) => setBioText(e.target.value)}
                                className="w-full p-4 rounded-2xl bg-white border border-slate-200 text-slate-700 text-sm focus:ring-2 focus:ring-indigo-100 outline-none resize-none mb-4"
                                rows={3}
                            />
                            
                            <div className="flex justify-end mb-6">
                                <button 
                                    onClick={generateBio}
                                    disabled={isGenerating}
                                    className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-indigo-500/20 active:scale-95 transition-transform"
                                >
                                    {isGenerating ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <SparklesIcon className="w-4 h-4" />}
                                    Refine with AI
                                </button>
                            </div>

                            {generatedBio && (
                                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100 relative">
                                    <div className="absolute -top-3 left-4 bg-indigo-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">Polished</div>
                                    <p className="text-indigo-900 text-sm italic leading-relaxed">"{generatedBio}"</p>
                                    <button className="mt-3 w-full py-2 bg-white text-indigo-600 rounded-lg text-xs font-bold border border-indigo-200 hover:bg-indigo-50">Apply to Profile</button>
                                </motion.div>
                            )}
                        </motion.div>
                    )}

                    {/* TAB: COACH */}
                    {activeTab === 'coach' && (
                        <motion.div key="coach" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                             <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 mb-6 flex items-start gap-3">
                                 <LightbulbIcon className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                                 <div>
                                     <h4 className="font-bold text-amber-900 text-sm">Context Awareness</h4>
                                     <p className="text-xs text-amber-700 leading-relaxed mt-1">Based on the profile, interest in <strong>Hiking</strong> and <strong>Neurology</strong> is aligned.</p>
                                 </div>
                             </div>

                             <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 block">Suggested Respectful Openers</label>
                             <div className="space-y-3">
                                 {[
                                     "As-salamu alaykum, I noticed your interest in hiking. Have you explored the northern trails?",
                                     "Hello, as a fellow medical professional, I admire your dedication to Neurology.",
                                     "I read your bio and appreciated your focus on family values and work-life balance."
                                 ].map((text, i) => (
                                     <button key={i} className="w-full text-left p-4 bg-white border border-slate-100 rounded-2xl shadow-sm hover:border-indigo-200 hover:bg-indigo-50 transition-all group">
                                         <p className="text-slate-700 text-sm group-hover:text-indigo-900">{text}</p>
                                     </button>
                                 ))}
                             </div>
                        </motion.div>
                    )}

                    {/* TAB: ANALYSIS */}
                    {activeTab === 'analysis' && (
                        <motion.div key="analysis" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                             <div className="flex items-center justify-center mb-6">
                                 <div className="relative w-32 h-32 flex items-center justify-center">
                                     <svg className="w-full h-full transform -rotate-90">
                                         <circle cx="64" cy="64" r="56" stroke="#e2e8f0" strokeWidth="12" fill="none" />
                                         <circle cx="64" cy="64" r="56" stroke="#4f46e5" strokeWidth="12" fill="none" strokeDasharray="351" strokeDashoffset="70" strokeLinecap="round" />
                                     </svg>
                                     <div className="absolute inset-0 flex flex-col items-center justify-center">
                                         <span className="text-3xl font-black text-slate-900">80</span>
                                         <span className="text-[10px] font-bold text-slate-400 uppercase">Score</span>
                                     </div>
                                 </div>
                             </div>

                             <h3 className="font-bold text-slate-900 mb-3">Improvement Checklist</h3>
                             <div className="space-y-3">
                                 <div className="flex items-center gap-3 p-3 bg-green-50 rounded-xl border border-green-100">
                                     <div className="w-5 h-5 bg-green-200 rounded-full flex items-center justify-center text-green-700"><CheckIcon className="w-3 h-3" /></div>
                                     <span className="text-sm font-medium text-green-900">Verify Government ID</span>
                                 </div>
                                 <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-100">
                                     <div className="w-5 h-5 bg-slate-100 rounded-full border-2 border-slate-300" />
                                     <span className="text-sm font-medium text-slate-500">Add 2 more profile photos</span>
                                 </div>
                                 <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-100">
                                     <div className="w-5 h-5 bg-slate-100 rounded-full border-2 border-slate-300" />
                                     <span className="text-sm font-medium text-slate-500">Complete 'Family Values' section</span>
                                 </div>
                             </div>
                        </motion.div>
                    )}

                </AnimatePresence>
             </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default AIAssistantModal;