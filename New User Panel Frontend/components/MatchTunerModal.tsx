import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Sliders, Check, ChevronRight, Loader2 } from 'lucide-react';
import { api } from '../utils/api';

interface MatchTunerModalProps {
  onClose: () => void;
}

const MatchTunerModal: React.FC<MatchTunerModalProps> = ({ onClose }) => {
  const { t } = useTranslation();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [selections, setSelections] = useState({
      dealbreaker: '',
      careerLevel: '',
      familyLevel: ''
  });

  const handleTune = async (field: string, value: string, nextStep: number | null) => {
      const newSelections = { ...selections, [field]: value };
      setSelections(newSelections);

      if (nextStep) {
          setStep(nextStep);
      } else {
          // Final step, save to backend
          try {
              setLoading(true);
              await api.post('/match-tuner/tune', newSelections);
              onClose();
          } catch (error) {
              console.error('Failed to tune matches:', error);
              onClose(); // Close anyway for now
          } finally {
              setLoading(false);
          }
      }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <div>
                <h2 className="text-xl font-bold text-slate-900">{t('modals.matchTuner.title')}</h2>
                <p className="text-sm text-slate-500">{t('modals.matchTuner.subtitle')}</p>
            </div>
            <button onClick={onClose} disabled={loading}><X size={20} className="text-slate-400" /></button>
        </div>

        <div className="p-6 flex-1 overflow-y-auto">
            {loading ? (
                <div className="h-48 flex flex-col items-center justify-center gap-4">
                    <Loader2 className="animate-spin text-primary" size={32} />
                    <p className="text-slate-500 font-medium">{t('modals.matchTuner.recalculating')}</p>
                </div>
            ) : (
                <>
                    {step === 1 && (
                        <div className="space-y-4 animate-in slide-in-from-right duration-300">
                            <h3 className="font-bold text-slate-900">{t('modals.matchTuner.dealbreaker')}</h3>
                            <div className="space-y-2">
                                {[{key: 'smoking', label: t('modals.matchTuner.smoking')}, {key: 'dietaryRestrictions', label: t('modals.matchTuner.dietaryRestrictions')}, {key: 'relocation', label: t('modals.matchTuner.relocation')}, {key: 'careerAmbition', label: t('modals.matchTuner.careerAmbition')}, {key: 'none', label: t('modals.matchTuner.none')}].map(opt => (
                                    <button 
                                        key={opt.key} 
                                        onClick={() => handleTune('dealbreaker', opt.key, 2)} 
                                        className="w-full text-left p-4 rounded-xl border border-slate-200 hover:border-primary hover:bg-primary/5 font-medium text-slate-700 transition-all flex justify-between group"
                                    >
                                        {opt.label}
                                        <ChevronRight className="opacity-0 group-hover:opacity-100 text-primary transition-opacity" size={18} />
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                    {step === 2 && (
                        <div className="space-y-4 animate-in slide-in-from-right duration-300">
                            <h3 className="font-bold text-slate-900">{t('modals.matchTuner.idealCareerLevel')}</h3>
                            <div className="space-y-2">
                                {[{key: 'establishedSpecialist', label: t('modals.matchTuner.establishedSpecialist')}, {key: 'residentInTraining', label: t('modals.matchTuner.residentInTraining')}, {key: 'medicalStudent', label: t('modals.matchTuner.medicalStudent')}, {key: 'nonMedical', label: t('modals.matchTuner.nonMedical')}].map(opt => (
                                    <button 
                                        key={opt.key} 
                                        onClick={() => handleTune('careerLevel', opt.key, 3)} 
                                        className="w-full text-left p-4 rounded-xl border border-slate-200 hover:border-primary hover:bg-primary/5 font-medium text-slate-700 transition-all flex justify-between group"
                                    >
                                        {opt.label}
                                        <ChevronRight className="opacity-0 group-hover:opacity-100 text-primary transition-opacity" size={18} />
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                    {step === 3 && (
                        <div className="space-y-4 animate-in slide-in-from-right duration-300">
                            <h3 className="font-bold text-slate-900">{t('modals.matchTuner.familyInvolvement')}</h3>
                            <div className="space-y-2">
                                {[{key: 'highJointFamily', label: t('modals.matchTuner.highJointFamily')}, {key: 'moderateVisits', label: t('modals.matchTuner.moderateVisits')}, {key: 'lowIndependent', label: t('modals.matchTuner.lowIndependent')}].map(opt => (
                                    <button 
                                        key={opt.key} 
                                        onClick={() => handleTune('familyLevel', opt.key, null)} 
                                        className="w-full text-left p-4 rounded-xl border border-slate-200 hover:border-primary hover:bg-primary/5 font-medium text-slate-700 transition-all flex justify-between group"
                                    >
                                        {opt.label}
                                        <Check className="opacity-0 group-hover:opacity-100 text-primary transition-opacity" size={18} />
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
        
        <div className="bg-slate-50 p-4 text-center text-xs text-slate-400">
            {loading ? t('modals.matchTuner.processing') : t('modals.matchTuner.stepOf', { step })}
        </div>
      </div>
    </div>
  );
};

export default MatchTunerModal;
