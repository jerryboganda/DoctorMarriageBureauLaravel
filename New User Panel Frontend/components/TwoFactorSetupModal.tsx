import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
    X, ShieldCheck, Mail, QrCode, Copy, Download, 
    CheckCircle2, AlertTriangle, ArrowRight, ArrowLeft, Lock, Loader2
} from 'lucide-react';
import { api } from '../utils/api';

interface TwoFactorSetupModalProps {
  onClose: () => void;
  onComplete: () => void;
  mode?: 'setup' | 'recovery';
}

const TwoFactorSetupModal: React.FC<TwoFactorSetupModalProps> = ({ onClose, onComplete, mode = 'setup' }) => {
  const { t } = useTranslation();
  const isRecoveryMode = mode === 'recovery';
  const [step, setStep] = useState<'method' | 'config' | 'backup' | 'success' | 'recover'>(
    isRecoveryMode ? 'recover' : 'method'
  );
  const [method, setMethod] = useState<'app' | 'email'>('app');
  const [verificationCode, setVerificationCode] = useState('');
  const [codesSaved, setCodesSaved] = useState(false);
  const [setupData, setSetupData] = useState<{ qrCode?: string; manualKey?: string } | null>(null);
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  const handleDownload = (text: string) => {
    const blob = new Blob([text], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'dmb-recovery-codes.txt';
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const startSetup = async (nextMethod: 'app' | 'email') => {
    try {
      setLoading(true);
      setError(null);
      setMethod(nextMethod);
      const response = await api.post('/member/account/2fa/setup', { method: nextMethod });
      setSetupData({
        qrCode: response.data?.qr_code,
        manualKey: response.data?.manual_entry_key,
      });
      setStep('config');
    } catch (err: any) {
      setError(err.response?.data?.message || t('errors.failedSetup2FA'));
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (verificationCode.length < 6) return;
    try {
      setLoading(true);
      setError(null);
      const response = await api.post('/member/account/2fa/verify', { code: verificationCode });
      setRecoveryCodes(response.data?.recovery_codes ?? []);
      setStep('backup');
    } catch (err: any) {
      setError(err.response?.data?.message || t('errors.failedSetup2FA'));
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerateCodes = async () => {
    if (verificationCode.length < 6) return;
    try {
      setLoading(true);
      setError(null);
      const response = await api.post('/member/account/2fa/recovery-codes', { code: verificationCode });
      setRecoveryCodes(response.data?.recovery_codes ?? []);
      setStep('backup');
    } catch (err: any) {
      setError(err.response?.data?.message || t('errors.failedRegenerateCodes'));
    } finally {
      setLoading(false);
    }
  };

  const handleFinish = () => {
    if (isRecoveryMode) {
      onComplete();
      return;
    }
    setStep('success');
  };

  const handleBack = () => {
    if (isRecoveryMode) {
      if (step === 'backup') {
        setStep('recover');
        setCodesSaved(false);
      }
      return;
    }
    if (step === 'config') setStep('method');
    if (step === 'backup') setStep('config');
  };

  const renderMethodSelection = () => (
      <div className="space-y-4 animate-in slide-in-from-right">
          <div className="text-center mb-6">
              <h3 className="text-xl font-bold text-slate-900">{t('modals.twoFactor.chooseMethod')}</h3>
              <p className="text-slate-500 text-sm">{t('modals.twoFactor.chooseMethodDesc')}</p>
          </div>

          <div 
              onClick={() => startSetup('app')}
              className="flex items-start gap-4 p-4 border-2 border-slate-200 rounded-xl cursor-pointer hover:border-primary hover:bg-primary/5 transition-all relative group"
          >
              <div className="size-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-600 group-hover:bg-white group-hover:text-primary transition-colors">
                  <QrCode size={24} />
              </div>
              <div>
                  <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-bold text-slate-900">{t('modals.twoFactor.authenticatorApp')}</h4>
                      <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded-full">{t('modals.twoFactor.recommended')}</span>
                  </div>
                  <p className="text-xs text-slate-500">{t('modals.twoFactor.authenticatorDesc')}</p>
              </div>
          </div>

          <div 
              onClick={() => startSetup('email')}
              className="flex items-start gap-4 p-4 border-2 border-slate-200 rounded-xl cursor-pointer hover:border-slate-300 hover:bg-slate-50 transition-all"
          >
              <div className="size-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-600">
                  <Mail size={24} />
              </div>
              <div>
                  <h4 className="font-bold text-slate-900 mb-1">{t('modals.twoFactor.emailAddress')}</h4>
                  <p className="text-xs text-slate-500">{t('modals.twoFactor.emailDesc')}</p>
              </div>
          </div>
      </div>
  );

  const renderConfig = () => (
      <div className="space-y-6 animate-in slide-in-from-right">
          <div className="text-center">
              <h3 className="text-xl font-bold text-slate-900">
                  {method === 'app' ? t('modals.twoFactor.setupAuthenticator') : t('modals.twoFactor.verifyContact')}
              </h3>
              <p className="text-slate-500 text-sm">
                  {method === 'app' ? t('modals.twoFactor.scanQR') : t('modals.twoFactor.codeSentToContact', { method: 'email' })}
              </p>
          </div>

          {method === 'app' ? (
              <div className="flex flex-col items-center gap-6">
                  <div className="p-4 bg-white border-2 border-slate-200 rounded-xl shadow-sm">
                      {setupData?.qrCode ? (
                          <img 
                              src={setupData.qrCode} 
                              alt="QR Code" 
                              className="size-40"
                          />
                      ) : (
                          <div className="size-40 flex items-center justify-center text-slate-400">
                              <Loader2 className="animate-spin" />
                          </div>
                      )}
                  </div>
                  
                  {setupData?.manualKey && (
                      <div className="w-full bg-slate-50 p-3 rounded-lg border border-slate-200 flex justify-between items-center">
                          <div>
                              <p className="text-[10px] text-slate-400 uppercase font-bold">{t('modals.twoFactor.setupKey')}</p>
                              <p className="text-sm font-mono font-bold text-slate-800 tracking-wider">{setupData.manualKey}</p>
                          </div>
                          <button onClick={() => handleCopy(setupData.manualKey || '')} className="p-2 hover:bg-slate-200 rounded text-slate-500">
                              <Copy size={16} />
                          </button>
                      </div>
                  )}
              </div>
          ) : (
              <div className="flex justify-center py-8">
                  <div className="size-24 bg-slate-100 rounded-full flex items-center justify-center animate-pulse text-slate-400">
                      <Mail size={40} />
                  </div>
              </div>
          )}

          <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-2">{t('modals.twoFactor.enterVerificationCode')}</label>
              <input 
                  type="text" 
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="123456" 
                  className="w-full p-3 border border-slate-300 rounded-xl text-center text-xl font-bold tracking-widest focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none"
                  autoFocus
              />
          </div>

          {error && <p className="text-xs text-red-600 font-medium">{error}</p>}

          <button 
              onClick={handleVerify}
              disabled={verificationCode.length < 6 || loading}
              className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
              {loading ? <Loader2 size={16} className="animate-spin" /> : t('modals.twoFactor.verifyAndContinue')}
          </button>
      </div>
  );

  const renderRecovery = () => (
      <div className="space-y-6 animate-in slide-in-from-right">
          <div className="text-center">
              <h3 className="text-xl font-bold text-slate-900">{t('modals.twoFactor.regenerateTitle')}</h3>
              <p className="text-slate-500 text-sm">{t('modals.twoFactor.regenerateDesc')}</p>
          </div>

          <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-2">{t('modals.twoFactor.twoFACode')}</label>
              <input 
                  type="text" 
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="123456" 
                  className="w-full p-3 border border-slate-300 rounded-xl text-center text-xl font-bold tracking-widest focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none"
                  autoFocus
              />
          </div>

          {error && <p className="text-xs text-red-600 font-medium">{error}</p>}

          <button 
              onClick={handleRegenerateCodes}
              disabled={verificationCode.length < 6 || loading}
              className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
              {loading ? <Loader2 size={16} className="animate-spin" /> : t('modals.twoFactor.generateCodes')}
          </button>
      </div>
  );

  const renderBackup = () => (
      <div className="space-y-6 animate-in slide-in-from-right">
          <div className="text-center">
              <div className="size-12 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mx-auto mb-3">
                  <AlertTriangle size={24} />
              </div>
              <h3 className="text-xl font-bold text-slate-900">{t('modals.twoFactor.saveBackupCodes')}</h3>
              <p className="text-slate-500 text-sm max-w-xs mx-auto">
                  {t('modals.twoFactor.backupCodesDesc')}
              </p>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-6">
              <div className="grid grid-cols-2 gap-4 font-mono text-sm font-bold text-slate-700 text-center">
                  {(recoveryCodes.length > 0 ? recoveryCodes : ['---- ----']).map((code, idx) => (
                      <span key={idx}>{code}</span>
                  ))}
              </div>
          </div>

          <div className="flex gap-3">
              <button onClick={() => handleCopy(recoveryCodes.join('\n'))} className="flex-1 py-2 border border-slate-200 rounded-lg text-sm font-bold hover:bg-slate-50 flex items-center justify-center gap-2">
                  <Copy size={16} /> {t('modals.twoFactor.copy')}
              </button>
              <button onClick={() => handleDownload(recoveryCodes.join('\n'))} className="flex-1 py-2 border border-slate-200 rounded-lg text-sm font-bold hover:bg-slate-50 flex items-center justify-center gap-2">
                  <Download size={16} /> {t('modals.twoFactor.download')}
              </button>
          </div>

          <label className="flex items-start gap-3 p-4 bg-orange-50 border border-orange-100 rounded-xl cursor-pointer">
              <input 
                  type="checkbox" 
                  checked={codesSaved}
                  onChange={(e) => setCodesSaved(e.target.checked)}
                  className="mt-1 size-4 accent-orange-600"
              />
              <span className="text-sm text-orange-900 font-medium">{t('modals.twoFactor.savedConfirm')}</span>
          </label>

          <button 
              onClick={handleFinish}
              disabled={!codesSaved}
              className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
              {isRecoveryMode ? t('modals.twoFactor.done') : t('modals.twoFactor.completeSetup')}
          </button>
      </div>
  );

  const renderSuccess = () => (
      <div className="text-center py-8 animate-in zoom-in-95">
          <div className="size-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <ShieldCheck size={40} />
          </div>
          <h3 className="text-2xl font-bold text-slate-900 mb-2">{t('modals.twoFactor.twoFactorEnabled')}</h3>
          <p className="text-slate-500 mb-8 max-w-xs mx-auto">
              {t('modals.twoFactor.enabledDesc')}
          </p>
          <button 
              onClick={onComplete}
              className="w-full bg-primary text-white py-3 rounded-xl font-bold hover:bg-primary-hover shadow-lg"
          >
              {t('modals.twoFactor.done')}
          </button>
      </div>
  );

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[70] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        <div className="h-16 border-b border-slate-100 flex items-center justify-between px-6 bg-slate-50">
            <div className="flex items-center gap-2">
                {(step === 'config' || step === 'backup') && (
                    <button onClick={handleBack} className="mr-2 text-slate-400 hover:text-slate-600">
                        <ArrowLeft size={20} />
                    </button>
                )}
                {!isRecoveryMode && step === 'method' && (
                    <Lock className="text-primary" size={20} />
                )}
                {isRecoveryMode && (
                    <Lock className="text-primary" size={20} />
                )}
                <h2 className="text-lg font-bold text-slate-900">
                    {isRecoveryMode ? t('modals.twoFactor.recoveryCodes') : t('modals.twoFactor.setup2FA')}
                </h2>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full text-slate-400 transition-colors">
                <X size={20} />
            </button>
        </div>

        <div className="p-6 overflow-y-auto">
            {step === 'method' && renderMethodSelection()}
            {step === 'config' && renderConfig()}
            {step === 'recover' && renderRecovery()}
            {step === 'backup' && renderBackup()}
            {step === 'success' && renderSuccess()}
        </div>
      </div>
    </div>
  );
};

export default TwoFactorSetupModal;
