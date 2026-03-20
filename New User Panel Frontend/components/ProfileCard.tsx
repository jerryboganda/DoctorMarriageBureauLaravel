import React, { useState, useEffect } from 'react';
import { BadgeCheck, MapPin, Cake, GraduationCap, Briefcase, Check, X, Lock, MoreVertical, ShieldAlert, Flag } from 'lucide-react';
import { ProfileMatch } from '../types';
import { api } from '../utils/api';
import ReportModal from './ReportModal';
import { useTranslation } from 'react-i18next';
import { normalizePositiveAge } from '../utils/age';
import { useAuthStore } from '../src/stores/authStore';

// API base URL for assets
const API_BASE = import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'https://api.doctormarriagebureau.com.pk';
const DEFAULT_AVATAR = `${API_BASE}/assets/img/avatar-place.png`;

interface ProfileCardProps {
    profile?: ProfileMatch;
    interestId?: number;
    onDecline?: (interestId?: number) => void;
    onAccept?: (interestId?: number) => Promise<void> | void;
}

const ProfileCard: React.FC<ProfileCardProps> = ({ profile, interestId, onDecline, onAccept }) => {
  const { t } = useTranslation();
  const currentUserId = useAuthStore((state) => state.user?.id);
  const [accepted, setAccepted] = useState(false);
  const [accepting, setAccepting] = useState(false);
  const [blocking, setBlocking] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);

  if (!profile) {
    return (
      <div className="bg-white rounded-xl shadow-lg shadow-slate-200/50 overflow-hidden border border-white p-8 text-center text-slate-500">
        <div className="text-lg font-bold text-slate-900 mb-2">{t('profile.noProposalsYet')}</div>
        <p className="text-sm">{t('profile.whenSomeoneSendsInterest')}</p>
      </div>
    );
  }

  const displayProfile = profile;
  const coverGradient = displayProfile.coverGradient || 'bg-gradient-to-r from-slate-100 to-slate-200';
  let avatarUrl = displayProfile.avatarUrl || '';
  // Use fallback if empty or invalid URL
  if (!avatarUrl || (!avatarUrl.startsWith('http') && !avatarUrl.startsWith('/'))) {
    avatarUrl = DEFAULT_AVATAR;
  }
  const shouldBlurAvatar = Boolean(
    displayProfile.profilePhotoBlur &&
    currentUserId != null &&
    String(currentUserId) !== String(displayProfile.id ?? '') &&
    !avatarUrl.includes('avatar-place.png')
  );
  const age = normalizePositiveAge(displayProfile.age);
  const hasInterest = Boolean(interestId);
  const isLiveProfile = Boolean(profile && profile.id);

  useEffect(() => {
    setAccepted(false);
  }, [displayProfile.id]);

  const handleAccept = async () => {
    if (accepting || accepted) return;
    try {
      setAccepting(true);
      if (onAccept) {
        if (!interestId) return;
        await onAccept(interestId);
      }
      setAccepted(true);
    } catch (error) {
      console.error('Failed to accept interest', error);
    } finally {
      setAccepting(false);
    }
  };

  const handleDecline = () => {
    onDecline?.(interestId);
  };

  const handleBlock = async () => {
    if (!isLiveProfile || !displayProfile.id || blocking) return;
    try {
      setBlocking(true);
      await api.post('/member/add-to-ignore-list', { user_id: displayProfile.id });
    } catch (error) {
      console.error('Failed to block user', error);
    } finally {
      setBlocking(false);
      setShowMenu(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg shadow-slate-200/50 overflow-hidden border border-white relative">
      {/* Cover Image area */}
      <div className={`h-32 md:h-40 ${coverGradient} relative`}>
        <div className="absolute top-4 right-4 bg-white/80 backdrop-blur-md px-3 py-1 rounded-full flex items-center gap-1 text-primary text-xs font-bold shadow-sm">
          <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
          {displayProfile.matchPercentage ?? 0}% {t('common.match')}
        </div>

        {/* Safety Menu Trigger */}
        <div className="absolute top-4 left-4">
             <button 
                onClick={() => setShowMenu(!showMenu)}
                className="p-2 bg-white/30 hover:bg-white/50 backdrop-blur-md rounded-full text-slate-900 transition-colors"
             >
                 <MoreVertical size={20} />
             </button>
             {showMenu && (
                 <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden z-20 animate-in fade-in zoom-in-95 duration-200">
                     <button 
                        onClick={() => { if (isLiveProfile) { setShowReportModal(true); } setShowMenu(false); }}
                        disabled={!isLiveProfile}
                        className="w-full text-left px-4 py-3 text-sm font-bold text-red-600 hover:bg-red-50 flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                     >
                         <Flag size={16} /> {t('profile.reportProfile')}
                     </button>
                     <button
                        onClick={handleBlock}
                        disabled={!isLiveProfile || blocking}
                        className="w-full text-left px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                     >
                         <ShieldAlert size={16} /> {blocking ? t('profile.blocking') : t('profile.blockUser')}
                     </button>
                 </div>
             )}
        </div>
      </div>

      <div className="px-4 md:px-8 pb-8 relative">
        {/* Avatar */}
        <div className="absolute -top-12 md:-top-16 left-4 md:left-8 p-1.5 bg-white rounded-full">
          <div 
            className={`size-24 md:size-32 rounded-full bg-cover bg-center shadow-md border border-slate-100 overflow-hidden ${shouldBlurAvatar ? 'scale-110 blur-2xl' : ''}`}
            style={{ backgroundImage: `url('${avatarUrl}')` }}
            aria-label={`Portrait of ${displayProfile.name}`}
          ></div>
        </div>

        {/* Header Info */}
        <div className="pt-16 md:pt-20 flex flex-col md:flex-row justify-between items-start flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl md:text-2xl font-bold text-slate-900">{displayProfile.name}</h2>
              {displayProfile.isVerified && (
                 <div className="relative group cursor-pointer">
                    <BadgeCheck size={20} className="text-blue-500 fill-blue-50" />
                    <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 bg-slate-900 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                        {t('profile.idPhotoVerified')}
                    </div>
                 </div>
              )}
            </div>
            <p className="text-primary font-medium text-sm md:text-base mt-1">{displayProfile.specialty || t('common.member')}</p>
            
            <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-slate-500">
              <div className="flex items-center gap-1">
                <MapPin size={16} />
                {[displayProfile.hospital, displayProfile.location].filter(Boolean).join(', ') || t('profile.locationUnavailable')}
              </div>
              <div className="flex items-center gap-1">
                <Cake size={16} />
                {age ? `${age} ${t('common.yrs')}` : t('profile.ageNA')}
              </div>
            </div>
          </div>

          <div className="flex gap-3 w-full md:w-auto">
            {!accepted ? (
                <>
                    <button 
                        onClick={handleDecline}
                        disabled={!hasInterest}
                        className="flex-1 md:flex-none bg-background-light text-slate-900 hover:bg-slate-200 px-6 h-12 rounded-full font-bold text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
                    >
                    <X size={18} />
                    {t('dashboard.decline')}
                    </button>
                    <button 
                        onClick={handleAccept}
                        disabled={!hasInterest || accepting}
                        className="flex-1 md:flex-none bg-primary hover:bg-primary-hover text-white px-8 h-12 rounded-full font-bold text-sm shadow-lg shadow-primary/30 transition-all flex items-center gap-2 justify-center disabled:opacity-60"
                    >
                    <Check size={20} strokeWidth={3} />
                    {accepting ? t('dashboard.accepting') : t('dashboard.acceptProposal')}
                    </button>
                </>
            ) : (
                <div className="flex items-center gap-3 bg-green-50 text-green-700 px-6 py-3 rounded-full border border-green-200 animate-in fade-in w-full md:w-auto justify-center">
                    <Check size={20} />
                    <span className="font-bold text-sm">{t('dashboard.chatUnlocked')}</span>
                </div>
            )}
          </div>
        </div>

        <hr className="my-6 border-slate-100" />

        {/* Bio & Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wide text-slate-400">{t('profile.about')}</h3>
            <p className="text-slate-600 leading-relaxed text-sm md:text-base">
              {displayProfile.bio || t('profile.profileDetailsAfterInterest')}
            </p>
            <div className="flex flex-wrap gap-2 pt-2">
              {(displayProfile.tags && displayProfile.tags.length > 0 ? displayProfile.tags : [t('profile.newProfile')]).map((tag) => {
                  let colors = "bg-slate-50 text-slate-700";
                  if (tag === 'Hiking') colors = "bg-pink-50 text-pink-700";
                  if (tag === 'Classical Music') colors = "bg-purple-50 text-purple-700";
                  if (tag === 'Vegetarian') colors = "bg-blue-50 text-blue-700";

                  return (
                    <span key={tag} className={`px-3 py-1 rounded-full text-xs font-semibold ${colors}`}>
                        {tag}
                    </span>
                  );
              })}
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wide text-slate-400">{t('profile.educationAndCareer')}</h3>
            <ul className="space-y-3">
              {/* Education entries */}
              {(displayProfile as any).educations && (displayProfile as any).educations.length > 0 ? (
                (displayProfile as any).educations.map((edu: any, i: number) => (
                  <li key={`edu-${i}`} className="flex gap-3">
                    <div className="mt-1 size-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0 text-slate-500">
                      <GraduationCap size={18} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{edu.degree || t('profile.educationNotShared')}</p>
                      <p className="text-xs text-slate-500">
                        {edu.institution || t('profile.institutionUnavailable')}
                        {edu.start && edu.end ? ` (${edu.start} - ${edu.end})` : edu.start ? ` (${edu.start} - ${t('common.present')})` : ''}
                      </p>
                    </div>
                  </li>
                ))
              ) : (
                <li className="flex gap-3">
                  <div className="mt-1 size-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0 text-slate-500">
                    <GraduationCap size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{displayProfile.education?.degree || t('profile.educationNotShared')}</p>
                    <p className="text-xs text-slate-500">{displayProfile.education?.institution || t('profile.institutionUnavailable')}</p>
                  </div>
                </li>
              )}

              {/* Career entries */}
              {(displayProfile as any).careers && (displayProfile as any).careers.length > 0 ? (
                (displayProfile as any).careers.map((c: any, i: number) => (
                  <li key={`car-${i}`} className="flex gap-3">
                    <div className="mt-1 size-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0 text-slate-500">
                      <Briefcase size={18} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{c.position || c.designation || t('profile.careerNotShared')}</p>
                      <p className="text-xs text-slate-500">
                        {c.institution || c.company || t('profile.organizationUnavailable')}
                        {c.duration ? ` (${c.duration})` : c.present ? ` (${t('common.present')})` : c.start && c.end ? ` (${c.start} - ${c.end})` : ''}
                      </p>
                    </div>
                  </li>
                ))
              ) : (
                <li className="flex gap-3">
                  <div className="mt-1 size-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0 text-slate-500">
                    <Briefcase size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{displayProfile.career?.position || t('profile.careerNotShared')}</p>
                    <p className="text-xs text-slate-500">
                      {displayProfile.career?.institution
                        ? `${displayProfile.career?.institution}${displayProfile.career?.duration ? ` (${displayProfile.career?.duration})` : ''}`
                        : t('profile.organizationUnavailable')}
                    </p>
                  </div>
                </li>
              )}
            </ul>

            <div className="mt-4 p-3 bg-slate-50 rounded-lg border border-slate-100 flex items-center gap-3">
                <Lock size={16} className="text-slate-400" />
                <div className="flex-1">
                    <p className="text-xs font-bold text-slate-700">{t('profile.familyDetailsHidden')}</p>
                    <p className="text-[10px] text-slate-500">{t('profile.unlockFullProfile')}</p>
                </div>
            </div>
          </div>
        </div>
      </div>

      {showReportModal && isLiveProfile && (
        <ReportModal
          userName={displayProfile.name}
          userId={profile?.id ?? displayProfile.id}
          onClose={() => setShowReportModal(false)}
        />
      )}
    </div>
  );
};

export default ProfileCard;
