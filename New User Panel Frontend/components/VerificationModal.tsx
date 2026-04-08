import React, { useEffect, useMemo, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { X, ShieldCheck, Check, AlertCircle, Upload, Loader2, FileText, Trash2 } from 'lucide-react';
import { api } from '../utils/api';
import { compressImage } from '../utils/compression';

interface VerificationModalProps {
  onClose: () => void;
}

type VerificationField = {
  type: 'text' | 'select' | 'radio' | 'multi_select' | 'file';
  label: string;
  options?: string[] | string;
};

// -- PREMIUM FILE UPLOADER COMPONENT --
const FileUploader = ({ label, value, onChange }: { label: string, value: File | null, onChange: (f: File | null) => void }) => {
  const { t } = useTranslation();
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onChange(e.dataTransfer.files[0]);
    }
  };

  const handleClick = () => {
    if (inputRef.current) {
      // Reset input value to allow re-selecting the same file
      inputRef.current.value = '';
      inputRef.current.click();
    }
  };

  if (value) {
    return (
      <div className="animate-in zoom-in duration-200">
        <div className="p-4 rounded-xl border-2 border-green-500 bg-green-50 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="size-10 rounded-full bg-white flex items-center justify-center text-green-600 shadow-sm shrink-0">
              <FileText size={20} />
            </div>
            <div className="truncate">
              <p className="text-sm font-bold text-slate-900 truncate">{value.name}</p>
              <p className="text-[10px] text-slate-500 font-medium">{(value.size / 1024 / 1024).toFixed(2)} MB • {t('modals.verification.readyToUpload')}</p>
            </div>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); onChange(null); }}
            className="p-2 hover:bg-white rounded-full text-slate-400 hover:text-red-500 transition-colors"
            title={t('modals.verification.removeFile')}
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <label
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
      className={`
                group relative aspect-[2/1] rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all duration-300
                ${isDragOver
          ? 'border-primary bg-primary/5 scale-[1.02] shadow-lg shadow-primary/10'
          : 'border-slate-300 bg-slate-50 hover:bg-slate-100 hover:border-slate-400'
        }
            `}
    >
      <input
        ref={inputRef}
        type="file"
        className="absolute inset-0 opacity-0 cursor-pointer"
        onChange={(e) => onChange(e.target.files?.[0] || null)}
        accept="image/*,application/pdf"
        aria-hidden="true"
      />

      <div className={`
                size-14 rounded-full flex items-center justify-center mb-3 transition-all duration-300 shadow-sm
                ${isDragOver ? 'bg-primary text-white scale-110' : 'bg-white text-slate-400 group-hover:text-primary group-hover:scale-110'}
            `}>
        <Upload size={24} className={isDragOver ? 'animate-bounce' : ''} />
      </div>

      <p className={`font-bold text-sm transition-colors ${isDragOver ? 'text-primary' : 'text-slate-700'}`}>
        {isDragOver ? t('modals.verification.dropHere') : t('modals.verification.clickOrDrag')}
      </p>
      <p className="text-[10px] text-slate-400 font-medium mt-1">
        {t('modals.verification.supportedFormats')}
      </p>
    </label>
  );
};

const VerificationModal: React.FC<VerificationModalProps> = ({ onClose }) => {
  const { t } = useTranslation();
  const [step, setStep] = useState(1);
  const [fields, setFields] = useState<VerificationField[]>([]);
  const [values, setValues] = useState<Record<number, any>>({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [verificationStatus, setVerificationStatus] = useState<'approved' | 'pending' | null>(null);

  useEffect(() => {
    let isActive = true;

    const fetchForm = async () => {
      try {
        setLoading(true);
        setLoadError(null);
        const response = await api.get('/member/verification_form');
        if (!isActive) return;
        if (Array.isArray(response.data)) {
          setFields(response.data);
        } else if (response.data?.result === false) {
          setVerificationStatus(response.data?.verification_status || 'pending');
          setLoadError(response.data?.message || t('modals.verification.alreadySubmitted'));
        } else {
          setLoadError(t('modals.verification.formUnavailable'));
        }
      } catch (err: any) {
        if (!isActive) return;
        setLoadError(err.response?.data?.message || t('modals.verification.loadFailed'));
      } finally {
        if (isActive) setLoading(false);
      }
    };

    fetchForm();

    return () => {
      isActive = false;
    };
  }, []);

  const infoFields = useMemo(() => fields.filter((field) => field.type !== 'file'), [fields]);
  const fileFields = useMemo(() => fields.filter((field) => field.type === 'file'), [fields]);

  const setFieldValue = (index: number, value: any) => {
    setValues((prev) => ({ ...prev, [index]: value }));
  };

  const parseOptions = (options?: string[] | string) => {
    if (Array.isArray(options)) return options;
    if (typeof options === 'string') return options.split(',').map((opt) => opt.trim()).filter(Boolean);
    return [];
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      setSubmitError(null);
      const formData = new FormData();
      fields.forEach((field, index) => {
        const value = values[index];
        if (field.type === 'file') {
          if (value) {
            formData.append(`element_${index}`, value);
          }
          return;
        }
        if (field.type === 'multi_select') {
          const list = Array.isArray(value) ? value : [];
          formData.append(`element_${index}`, list.join(','));
          return;
        }
        formData.append(`element_${index}`, value ?? '');
      });
      const response = await api.post('/member/verification-info-store', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (response.data?.result === false) {
        setSubmitError(response.data?.message || t('modals.verification.submissionFailed'));
        return;
      }
      setStep(4);
    } catch (err: any) {
      setSubmitError(err.response?.data?.message || t('modals.verification.submissionFailed'));
    } finally {
      setSubmitting(false);
    }
  };

  const renderField = (field: VerificationField, index: number) => {
    const options = parseOptions(field.options);
    const value = values[index] ?? '';

    if (field.type === 'text') {
      return (
        <input
          type="text"
          className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
          value={value}
          onChange={(e) => setFieldValue(index, e.target.value)}
          placeholder={`Enter your ${field.label.toLowerCase()}`}
        />
      );
    }

    if (field.type === 'select') {
      return (
        <div className="relative">
          <select
            className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm appearance-none focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all bg-white"
            value={value}
            onChange={(e) => setFieldValue(index, e.target.value)}
          >
            <option value="">{t('modals.verification.selectOption')}</option>
            {options.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
            <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>
      );
    }

    if (field.type === 'radio') {
      return (
        <div className="flex flex-wrap gap-3">
          {options.map((opt) => (
            <label key={opt} className={`flex items-center gap-2 text-sm px-4 py-2 rounded-full border transition-all cursor-pointer ${value === opt ? 'border-primary bg-primary/5 text-primary font-bold' : 'border-slate-200 hover:border-slate-300 text-slate-600'}`}>
              <input
                type="radio"
                name={`field_${index}`}
                checked={value === opt}
                onChange={() => setFieldValue(index, opt)}
                className="hidden"
              />
              {value === opt && <Check size={14} />}
              {opt}
            </label>
          ))}
        </div>
      );
    }

    if (field.type === 'multi_select') {
      return (
        <select
          multiple
          className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
          value={Array.isArray(value) ? value : []}
          onChange={(e) => {
            const selected = Array.from(e.target.selectedOptions).map((opt) => opt.value);
            setFieldValue(index, selected);
          }}
        >
          {options.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      );
    }

    if (field.type === 'file') {
      return (
        <FileUploader
          label={field.label}
          value={values[index]}
          onChange={async (file) => {
            if (file && file.type.startsWith('image/')) {
              const compressed = await compressImage(file);
              setFieldValue(index, compressed);
            } else {
              setFieldValue(index, file);
            }
          }}
        />
      );
    }

    return null;
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">

        <div className="h-16 border-b border-slate-100 flex items-center justify-between px-8 bg-white/50 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <ShieldCheck size={18} />
            </div>
            <h2 className="text-lg font-bold text-slate-900">{t('modals.verification.title')}</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-8 py-6">
          <div className="w-full mb-8">
            <div className="flex justify-between relative">
              <div className="absolute top-1/2 left-0 right-0 h-1 bg-slate-100 -z-10 rounded-full"></div>
              <div className="absolute top-1/2 left-0 h-1 bg-primary -z-10 rounded-full transition-all duration-300" style={{ right: `${100 - ((step - 1) / 3) * 100}%` }}></div>
              {[t('modals.verification.stepInfo'), t('modals.verification.stepDocuments'), t('modals.verification.stepReview'), t('modals.verification.stepComplete')].map((label, idx) => {
                const s = idx + 1;
                const isActive = step >= s;
                const isCompleted = step > s;
                return (
                  <div key={label} className="flex flex-col items-center gap-2 bg-white px-2 cursor-default">
                    <div className={`size-8 rounded-full flex items-center justify-center text-xs font-bold border-[3px] transition-all duration-300 ${isActive ? 'bg-primary border-primary text-white shadow-lg shadow-primary/30 scale-110' : 'bg-white border-slate-200 text-slate-300'}`}>
                      {isCompleted ? <Check size={14} /> : s}
                    </div>
                    <span className={`text-[10px] font-bold uppercase tracking-wider transition-colors duration-300 ${isActive ? 'text-primary' : 'text-slate-300'}`}>
                      {label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {loading && (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <Loader2 className="animate-spin mb-4 text-primary" size={32} />
              <p className="font-medium text-sm">{t('modals.verification.loading')}</p>
            </div>
          )}

          {loadError && !loading && verificationStatus === 'approved' && (
            <div className="bg-emerald-50 p-8 rounded-2xl flex flex-col items-center text-center gap-3 text-sm text-emerald-800 border border-emerald-200">
              <div className="size-16 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 mb-2">
                <ShieldCheck size={32} />
              </div>
              <h3 className="font-bold text-xl text-emerald-900">{t('modals.verification.identityVerified')}</h3>
              <p className="max-w-sm mx-auto text-emerald-700/80 leading-relaxed">{loadError}</p>
              <div className="mt-2 px-4 py-1.5 bg-emerald-100 rounded-full">
                <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">{t('modals.verification.verifiedMember')}</span>
              </div>
              <button onClick={onClose} className="mt-4 px-8 py-2.5 bg-emerald-600 text-white rounded-full font-bold shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 transition-colors">
                {t('modals.verification.done')}
              </button>
            </div>
          )}

          {loadError && !loading && verificationStatus === 'pending' && (
            <div className="bg-amber-50 p-8 rounded-2xl flex flex-col items-center text-center gap-3 text-sm text-amber-800 border border-amber-200">
              <div className="size-16 bg-amber-100 rounded-full flex items-center justify-center text-amber-600 mb-2">
                <Loader2 size={32} className="animate-spin" />
              </div>
              <h3 className="font-bold text-xl text-amber-900">{t('modals.verification.underReview')}</h3>
              <p className="max-w-sm mx-auto text-amber-700/80 leading-relaxed">{loadError}</p>
              <div className="mt-2 px-4 py-1.5 bg-amber-100 rounded-full">
                <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">{t('modals.verification.pendingReview')}</span>
              </div>
              <button onClick={onClose} className="mt-4 px-8 py-2.5 bg-amber-600 text-white rounded-full font-bold shadow-lg shadow-amber-600/20 hover:bg-amber-700 transition-colors">
                {t('modals.verification.done')}
              </button>
            </div>
          )}

          {loadError && !loading && !verificationStatus && (
            <div className="bg-red-50 p-6 rounded-2xl flex flex-col items-center text-center gap-3 text-sm text-red-800 border border-red-100">
              <div className="size-12 bg-red-100 rounded-full flex items-center justify-center text-red-600 mb-1">
                <AlertCircle size={24} />
              </div>
              <h3 className="font-bold text-lg text-red-900">{t('modals.verification.unableToStart')}</h3>
              <p className="max-w-xs mx-auto text-red-700/80">{loadError}</p>
              <button onClick={onClose} className="mt-4 px-6 py-2 bg-white border border-red-200 rounded-full font-bold text-red-700 shadow-sm hover:bg-red-50">
                {t('modals.verification.done')}
              </button>
            </div>
          )}

          {!loading && !loadError && step === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="text-center mb-2">
                <h3 className="text-xl font-bold text-slate-900">{t('modals.verification.personalInfo')}</h3>
                <p className="text-slate-500 text-sm mt-1">{t('modals.verification.confirmDetails')}</p>
              </div>
              {infoFields.length === 0 ? (
                <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <div className="size-12 bg-white rounded-full mx-auto flex items-center justify-center text-green-500 shadow-sm mb-3">
                    <Check size={24} />
                  </div>
                  <p className="font-bold text-slate-700">{t('modals.verification.allInfoVerified')}</p>
                  <p className="text-xs text-slate-400 mt-1">{t('modals.verification.noAdditionalDetails')}</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {infoFields.map((field, idx) => (
                    <div key={`${field.label}-${idx}`} className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-700 ml-1">{field.label}</label>
                      {renderField(field, fields.indexOf(field))}
                    </div>
                  ))}
                </div>
              )}
              <div className="pt-4">
                <button onClick={() => setStep(2)} className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold hover:bg-slate-800 shadow-xl shadow-slate-900/10 active:scale-[0.98] transition-all flex items-center justify-center gap-2 group">
                  {t('modals.verification.continueToDocs')}
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="group-hover:translate-x-1 transition-transform">
                    <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </div>
            </div>
          )}

          {!loading && !loadError && step === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="text-center mb-2">
                <h3 className="text-xl font-bold text-slate-900">{t('modals.verification.documentUpload')}</h3>
                <p className="text-slate-500 text-sm mt-1">{t('modals.verification.uploadDocsDesc')}</p>
              </div>
              {fileFields.length === 0 ? (
                <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <div className="size-12 bg-white rounded-full mx-auto flex items-center justify-center text-green-500 shadow-sm mb-3">
                    <Check size={24} />
                  </div>
                  <p className="font-bold text-slate-700">{t('modals.verification.docsNotRequired')}</p>
                  <p className="text-xs text-slate-400 mt-1">{t('modals.verification.noUploadsNeeded')}</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-6">
                  {fileFields.map((field, idx) => (
                    <div key={`${field.label}-${idx}`} className="space-y-2">
                      <div className="flex justify-between items-baseline">
                        <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">{field.label}</span>
                        <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-bold">{t('modals.verification.required')}</span>
                      </div>
                      {renderField(field, fields.indexOf(field))}
                    </div>
                  ))}
                </div>
              )}
              <div className="pt-4 flex gap-3">
                <button onClick={() => setStep(1)} className="px-6 py-4 rounded-xl font-bold text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-colors">
                  {t('modals.verification.back')}
                </button>
                <button onClick={() => setStep(3)} className="flex-1 bg-slate-900 text-white py-4 rounded-xl font-bold hover:bg-slate-800 shadow-xl shadow-slate-900/10 active:scale-[0.98] transition-all">
                  {t('modals.verification.reviewSubmission')}
                </button>
              </div>
            </div>
          )}

          {!loading && !loadError && step === 3 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="text-center mb-2">
                <h3 className="text-xl font-bold text-slate-900">{t('modals.verification.confirmDetailsLabel')}</h3>
                <p className="text-slate-500 text-sm mt-1">{t('modals.verification.doubleCheck')}</p>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 space-y-4">
                {fields.map((field, index) => (
                  <div key={`${field.label}-${index}`} className="flex justify-between items-center text-sm group">
                    <span className="font-bold text-slate-500">{field.label}</span>
                    <span className="text-slate-900 font-medium text-right">
                      {field.type === 'file' ? (
                        values[index] ? (
                          <span className="flex items-center gap-1.5 text-green-600 bg-green-50 px-2 py-1 rounded-lg">
                            <FileText size={14} />
                            {values[index].name}
                          </span>
                        ) : <span className="text-red-400 italic">{t('modals.verification.notProvided')}</span>
                      ) : (
                        Array.isArray(values[index]) ? values[index].join(', ') : (values[index] || <span className="text-slate-300 italic">{t('modals.verification.empty')}</span>)
                      )}
                    </span>
                  </div>
                ))}
              </div>

              {submitError && (
                <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg flex items-center gap-2 justify-center font-bold">
                  <AlertCircle size={16} />
                  {submitError}
                </div>
              )}

              <div className="pt-4 flex gap-3">
                <button onClick={() => setStep(2)} className="px-6 py-4 rounded-xl font-bold text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-colors">
                  {t('modals.verification.back')}
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="flex-1 bg-primary text-white py-4 rounded-xl font-bold hover:bg-primary-hover shadow-xl shadow-primary/20 active:scale-[0.98] transition-all disabled:opacity-70 flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <Loader2 size={20} className="animate-spin" />
                      {t('modals.verification.submitting')}
                    </>
                  ) : t('modals.verification.submitVerification')}
                </button>
              </div>
            </div>
          )}

          {!loading && !loadError && step === 4 && (
            <div className="space-y-6 animate-in fade-in zoom-in duration-500 text-center py-12">
              <div className="relative inline-block">
                <div className="absolute inset-0 bg-green-400/20 blur-xl rounded-full"></div>
                <div className="relative size-24 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full flex items-center justify-center text-white mx-auto shadow-2xl shadow-green-500/30 mb-6">
                  <ShieldCheck size={48} />
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-bold text-slate-900">{t('modals.verification.verificationSubmitted')}</h3>
                <p className="text-slate-500 mt-2 max-w-sm mx-auto leading-relaxed">
                  {t('modals.verification.submittedDesc')}
                </p>
              </div>
              <div className="pt-8">
                <button onClick={onClose} className="bg-slate-900 text-white px-10 py-4 rounded-full font-bold hover:bg-slate-800 shadow-xl shadow-slate-900/10 transition-all active:scale-[0.98]">
                  {t('modals.verification.returnToProfile')}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VerificationModal;
