import React from 'react';
import { useTranslation } from 'react-i18next';
import { ProfileMatch } from '../types';
import { useAuthStore } from '../src/stores/authStore';

// API base URL for assets
const API_BASE = import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'https://api.doctormarriagebureau.com.pk';
const DEFAULT_AVATAR = `${API_BASE}/assets/img/avatar-place.png`;

interface ProfileTeaserProps {
  profile?: Partial<ProfileMatch>;
}

const ProfileTeaser: React.FC<ProfileTeaserProps> = ({ profile }) => {
  const { t } = useTranslation();
  const currentUserId = useAuthStore((state) => state.user?.id);
  if (!profile) {
    return (
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4 opacity-70">
        <div className="size-16 rounded-full bg-slate-200 shrink-0"></div>
        <div className="flex-1">
          <h3 className="font-bold text-slate-900">{t('profile.exploreNewMatches')}</h3>
          <p className="text-sm text-slate-500">{t('profile.headToDiscover')}</p>
        </div>
      </div>
    );
  }

  const displayProfile = profile;
  let avatarUrl = displayProfile.avatarUrl || '';
  if (!avatarUrl || (!avatarUrl.startsWith('http') && !avatarUrl.startsWith('/'))) {
    avatarUrl = DEFAULT_AVATAR;
  }
  const shouldBlurAvatar = Boolean(
    displayProfile.profilePhotoBlur &&
    currentUserId != null &&
    String(currentUserId) !== String(displayProfile.id ?? '') &&
    !avatarUrl.includes('avatar-place.png')
  );

  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4 opacity-60 hover:opacity-100 transition-opacity cursor-pointer group">
      <div 
        className={`size-16 rounded-full bg-cover bg-center shrink-0 grayscale group-hover:grayscale-0 transition-all overflow-hidden ${shouldBlurAvatar ? 'scale-110 blur-2xl' : ''}`}
        style={{ backgroundImage: `url('${avatarUrl}')` }}
      ></div>
      <div className="flex-1">
        <h3 className="font-bold text-slate-900">{displayProfile.name || t('profile.newMatch')}</h3>
        <p className="text-sm text-slate-500">{displayProfile.specialty || t('profile.profilePreviewAvailable')}</p>
      </div>
      <div className="text-right">
        <span className="block text-primary font-bold">{displayProfile.matchPercentage ?? 0}% {t('common.match')}</span>
        <span className="text-xs text-slate-400">2 hrs ago</span>
      </div>
    </div>
  );
};

export default ProfileTeaser;
