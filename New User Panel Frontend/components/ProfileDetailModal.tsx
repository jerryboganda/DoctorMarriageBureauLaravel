import React, { useState, useEffect, useMemo } from 'react';
import {
  X, MapPin, Briefcase, GraduationCap, Heart, Calendar, Users, Globe, BookOpen, Star,
  Zap, CheckCircle2, AlertTriangle, ArrowLeftRight, BrainCircuit, UserCheck, Loader2,
  Send, Lock, FileText, ChevronRight, Eye, Phone, Mail, Ruler, Moon, Home, MessageSquare, Clock,
  Mic, Play, Pause, Volume2,
} from 'lucide-react';
import { ProfileMatch, MatchIntelligence } from '../types';
import { api } from '../utils/api';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { BTN_TAP } from '../utils/motion';

const API_BASE = import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'https://api.doctormarriagebureau.com.pk';
const DEFAULT_AVATAR = `${API_BASE}/assets/img/avatar-place.png`;
const DEFAULT_FEMALE_AVATAR = `${API_BASE}/assets/img/female-avatar-place.png`;

interface ProfileDetailModalProps {
  profile: ProfileMatch;
  onClose: () => void;
  onSendProposal: (profile: ProfileMatch) => void;
  onNavigate?: (view: string) => void;
}

/* ────────────────────────────────────────────────────────────
   Helper: check if a data object has ANY displayable values
   ──────────────────────────────────────────────────────────── */
function hasAnyValue(obj: any, keys: string[]): boolean {
  if (!obj) return false;
  return keys.some((k) => {
    const v = obj[k];
    if (v === null || v === undefined || v === '' || v === 'N/A') return false;
    if (typeof v === 'object' && v?.name) return !!v.name;
    return true;
  });
}

const ProfileDetailModal: React.FC<ProfileDetailModalProps> = ({ profile, onClose, onSendProposal, onNavigate }) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'about' | 'compatibility'>('about');
  const [profileData, setProfileData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [intelligence, setIntelligence] = useState<MatchIntelligence | null>(null);
  const [intelLoading, setIntelLoading] = useState(false);
  const [intelError, setIntelError] = useState<string | null>(null);
  const [showFriction, setShowFriction] = useState(false);

  // interest_status from API: 1 = no interest, 0 = I sent interest, 'do_response' = they sent to me
  // interest_text tells us if it was accepted or pending
  const [interestState, setInterestState] = useState<'none' | 'sent_pending' | 'sent_accepted' | 'received_pending' | 'received_accepted'>(() => {
    const status = profile.interestStatus;
    const text = profile.interestText || '';
    if (status === 0 || status === '0') {
      return text.toLowerCase().includes('accepted') ? 'sent_accepted' : 'sent_pending';
    }
    if (status === 'do_response') {
      return text.toLowerCase().includes('accepted') ? 'received_accepted' : 'received_pending';
    }
    return 'none';
  });

  // Lock body scroll when modal is open
  useEffect(() => {
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = original; };
  }, []);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const [profileRes, memberInfoRes] = await Promise.all([
          api.get(`/member/public-profile/${profile.id}`),
          api.get(`/member/member-info/${profile.id}`).catch(() => null),
        ]);
        if (profileRes.data.result) {
          const data = profileRes.data.data;
          console.log('Profile data received:', { id: profile.id, voice_intro_url: data?.voice_intro_url, has_voice: !!data?.voice_intro_url });
          setProfileData(data);
        } else {
          setError('Could not load profile.');
        }
        // Update interest state from fresh member_info data
        if (memberInfoRes?.data?.data) {
          const info = memberInfoRes.data.data;
          const status = info.interest_status;
          const text = (info.interest_text || '').toLowerCase();
          // member_info returns: 'mutual', 'sent interest', 'received interest', 'no interest'
          // ActiveUserResource returns: 0 (sent), 1 (none), 'do_response' (received) + interest_text with 'accepted'
          if (status === 'mutual') {
            setInterestState('sent_accepted');
          } else if (status === 'sent interest') {
            setInterestState(text.includes('accepted') ? 'sent_accepted' : 'sent_pending');
          } else if (status === 'received interest') {
            setInterestState(text.includes('accepted') ? 'received_accepted' : 'received_pending');
          } else if (status === 0 || status === '0') {
            setInterestState(text.includes('accepted') ? 'sent_accepted' : 'sent_pending');
          } else if (status === 'do_response') {
            setInterestState(text.includes('accepted') ? 'received_accepted' : 'received_pending');
          } else {
            setInterestState('none');
          }
        }
      } catch (err: any) {
        console.error('Failed to fetch profile', err);
        setError('Failed to load profile details.');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [profile.id]);

  useEffect(() => {
    if (activeTab === 'compatibility' && !intelligence && !intelLoading) {
      const fetchIntelligence = async () => {
        try {
          setIntelLoading(true);
          const response = await api.get(`/match-intelligence/${profile.id}`);
          if (response.data.success) {
            setIntelligence(response.data.data);
          } else {
            setIntelError('Failed to retrieve compatibility data.');
          }
        } catch (err: any) {
          console.error('Failed to fetch match intelligence', err);
          setIntelError('Could not analyze compatibility at this time.');
        } finally {
          setIntelLoading(false);
        }
      };
      fetchIntelligence();
    }
  }, [activeTab, profile.id]);

  const handleSendProposal = () => {
    if (interestState !== 'none') return;
    onSendProposal(profile);
  };

  const basicInfo = profileData?.basic_info;
  const introduction = profileData?.intoduction?.introduction;
  const education = profileData?.education;
  const career = profileData?.career;
  const physical = profileData?.physical_attributes;
  const spiritual = profileData?.spiritual_backgrounds;
  const residence = profileData?.residence_info;
  const lifestyle = profileData?.lifestyles;
  const family = profileData?.families_information;
  const partnerExpectation = profileData?.partner_expectation;
  const hobbies = profileData?.hobbies_interest;
  const gallery = profileData?.photo_gallery;
  const screenshotDeterrence = profileData?.screenshot_deterrence;

  const displayName = basicInfo ? `${basicInfo.firs_name || ''} ${basicInfo.last_name || ''}`.trim() : profile.name;
  const photoUrl = basicInfo?.photo || profile.avatarUrl || DEFAULT_AVATAR;

  const primaryProfession = useMemo(() => {
    const values: string[] = [];
    const append = (value: unknown) => {
      if (typeof value === 'number') {
        values.push(String(value));
        return;
      }
      if (typeof value !== 'string') return;
      const normalized = value.trim();
      if (normalized) values.push(normalized);
    };

    const profileAny = profile as any;

    const collectCareerItem = (item: any) => {
      if (!item) return;
      if (typeof item === 'string') {
        append(item);
        return;
      }
      append(item?.designation);
      append(item?.position);
      append(item?.occupation);
      append(item?.profession);
      append(item?.job_title);
      append(item?.title);
      append(item?.career);
      append(item?.company);
      append(item?.institution);
    };

    if (Array.isArray(career)) {
      career.forEach(collectCareerItem);
    } else {
      collectCareerItem(career);
    }

    if (Array.isArray(profileAny?.careers)) {
      profileAny.careers.forEach(collectCareerItem);
    }

    collectCareerItem(profileAny?.career);

    append(profileAny?.profession);
    append(profileAny?.occupation);
    append(profileAny?.job_title);
    append(profile.specialty);

    return values[0] || 'Not shared';
  }, [career, profile]);

  const primaryEducation = useMemo(() => {
    const values: string[] = [];
    const append = (value: unknown) => {
      if (typeof value === 'number') {
        values.push(String(value));
        return;
      }
      if (typeof value !== 'string') return;
      const normalized = value.trim();
      if (normalized) values.push(normalized);
    };

    const profileAny = profile as any;

    const collectEducationItem = (item: any) => {
      if (!item) return;
      if (typeof item === 'string') {
        append(item);
        return;
      }
      append(item?.degree);
      append(item?.education);
      append(item?.qualification);
      append(item?.title);
      append(item?.field_of_study);
      append(item?.institution);
      append(item?.school);
    };

    if (Array.isArray(education)) {
      education.forEach(collectEducationItem);
    } else {
      collectEducationItem(education);
    }

    if (Array.isArray(profileAny?.educations)) {
      profileAny.educations.forEach(collectEducationItem);
    }

    collectEducationItem(profileAny?.education);

    append(profileAny?.highest_education);
    append(profileAny?.qualification);

    return values[0] || 'Not shared';
  }, [education, profile]);

  const quickInfo = useMemo(() => {
    const items: { icon: React.ReactNode; text: string; wrap?: boolean }[] = [];
    if (basicInfo?.age) items.push({ icon: <Calendar size={12} />, text: `${basicInfo.age} yrs` });
    if (basicInfo?.religion) items.push({ icon: <Moon size={12} />, text: basicInfo.religion });
    if (basicInfo?.maritial_status) items.push({ icon: <Heart size={12} />, text: basicInfo.maritial_status });
    if (profile.location) items.push({ icon: <MapPin size={12} />, text: profile.location });

    const professionText = primaryProfession.trim();
    const educationText = primaryEducation.trim();

    if (professionText && professionText !== 'Not shared') {
      items.push({ icon: <Briefcase size={12} />, text: `Profession: ${professionText}`, wrap: true });
    }

    if (educationText && educationText !== 'Not shared') {
      items.push({ icon: <GraduationCap size={12} />, text: `Education: ${educationText}`, wrap: true });
    }

    return items;
  }, [basicInfo, profile.location, primaryProfession, primaryEducation]);

  const visibleGallery = useMemo(() => {
    if (!gallery || !Array.isArray(gallery)) return [];
    return gallery.filter((img: any) => img.image && !img.is_blurred);
  }, [gallery]);

  const blurredGallery = useMemo(() => {
    if (!gallery || !Array.isArray(gallery)) return [];
    return gallery.filter((img: any) => img.is_blurred && img.thumbnail);
  }, [gallery]);

  const lockedCount = useMemo(() => {
    if (!gallery || !Array.isArray(gallery)) return 0;
    return gallery.filter((img: any) => !img.image && !img.thumbnail).length;
  }, [gallery]);

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Position wrapper — no framer-motion, no flex, just raw positioning */}
      <div
        className="fixed bottom-0 left-0 right-0 sm:bottom-auto sm:top-1/2 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-full sm:max-w-4xl bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col pb-14 sm:pb-0"
        style={{ maxHeight: '90vh' }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* ═══════════════════════════════════════════
            HEADER — Compact mobile-first hero (non-scrollable)
           ═══════════════════════════════════════════ */}
        <div className="shrink-0">
          {/* Gradient banner */}
          <div className="h-20 sm:h-28 bg-gradient-to-br from-slate-800 via-slate-700 to-slate-900 relative overflow-hidden rounded-t-2xl">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-40" />
            <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-10">
              <div className="bg-white/95 backdrop-blur-sm rounded-full px-2.5 py-1 flex items-center gap-1 shadow-md">
                <Zap size={12} className="text-primary fill-primary" />
                <span className="text-xs font-bold text-primary">{profile.matchPercentage}% {t('common.match')}</span>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 bg-white/15 hover:bg-white/25 rounded-full text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Avatar + Name row */}
          <div className="px-4 sm:px-5 pb-2 -mt-10 flex items-end gap-3 relative z-10">
            <div className="size-[72px] sm:size-20 rounded-xl border-[3px] border-white bg-slate-200 shadow-lg overflow-hidden shrink-0">
              <img
                src={photoUrl}
                alt={displayName}
                className="w-full h-full object-cover"
                onError={(e) => { (e.target as HTMLImageElement).src = DEFAULT_AVATAR; }}
              />
            </div>
            <div className="flex-1 min-w-0 pt-12 pb-0.5">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-snug truncate">{displayName}</h2>
              <div className="mt-0.5">
                <div className="flex items-center gap-x-2.5 gap-y-0.5 flex-wrap">
                  {quickInfo.map((item, i) => (
                    <span
                      key={i}
                      className={`inline-flex items-center gap-1 text-[11px] text-slate-500 ${item.wrap ? 'max-w-full sm:max-w-[320px]' : 'whitespace-nowrap'}`}
                    >
                      {item.icon}
                      <span className={item.wrap ? 'truncate' : ''}>{item.text}</span>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Proposal button — status-aware CTA */}
          <div className="px-4 sm:px-5 pb-2.5">
            {interestState === 'sent_accepted' || interestState === 'received_accepted' ? (
              /* Mutual match — show Chat Now */
              <motion.button
                whileTap={BTN_TAP}
                onClick={() => { onClose(); onNavigate?.('messages'); }}
                className="w-full py-2.5 rounded-xl font-bold text-sm shadow-md flex items-center justify-center gap-2 transition-all bg-emerald-500 text-white hover:bg-emerald-600"
              >
                <MessageSquare size={15} /> {t('profile.interestAccepted')}
              </motion.button>
            ) : interestState === 'sent_pending' ? (
              /* I sent interest, awaiting response */
              <div className="w-full py-2.5 rounded-xl font-bold text-sm shadow-md flex items-center justify-center gap-2 bg-amber-50 text-amber-700 border border-amber-200">
                <Clock size={15} /> {t('profile.pendingResponse')}
              </div>
            ) : interestState === 'received_pending' ? (
              /* They sent me interest — show Respond */
              <motion.button
                whileTap={BTN_TAP}
                onClick={() => { onClose(); onNavigate?.('dashboard'); }}
                className="w-full py-2.5 rounded-xl font-bold text-sm shadow-md flex items-center justify-center gap-2 transition-all bg-blue-500 text-white hover:bg-blue-600"
              >
                <Heart size={15} /> {t('profile.respondToInterest')}
              </motion.button>
            ) : (
              /* No interest — show Send Proposal */
              <motion.button
                whileTap={BTN_TAP}
                onClick={handleSendProposal}
                className="w-full py-2.5 rounded-xl font-bold text-sm shadow-md flex items-center justify-center gap-2 transition-all bg-primary text-white hover:bg-primary-hover"
              >
                <Send size={15} /> {t('profile.sendProposal')}
              </motion.button>
            )}
          </div>

          {/* Tab bar */}
          <div className="px-4 sm:px-5 border-b border-slate-200 flex bg-white">
            <button
              onClick={() => setActiveTab('about')}
              className={`flex-1 sm:flex-none sm:px-5 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition-colors text-center ${
                activeTab === 'about'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              {t('profile.profileDetails')}
            </button>
            <button
              onClick={() => setActiveTab('compatibility')}
              className={`flex-1 sm:flex-none sm:px-5 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition-colors flex items-center justify-center gap-1.5 ${
                activeTab === 'compatibility'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              <BrainCircuit size={13} />
              {t('profile.compatibility')}
            </button>
          </div>
        </div>

        {/* ═══════════════════════════════════════════
            SCROLLABLE CONTENT AREA
           ═══════════════════════════════════════════ */}
        <div
          className="flex-1 overflow-y-auto overscroll-contain min-h-0"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {loading ? (
            <div className="h-48 flex flex-col items-center justify-center gap-3">
              <Loader2 className="animate-spin text-primary" size={28} />
              <p className="text-slate-400 text-sm">{t('profile.loadingProfile')}</p>
            </div>
          ) : error ? (
            <div className="h-48 flex flex-col items-center justify-center gap-3 text-center px-6">
              <div className="size-11 bg-red-50 text-red-400 rounded-full flex items-center justify-center">
                <AlertTriangle size={22} />
              </div>
              <p className="text-slate-500 text-sm">{error}</p>
            </div>
          ) : activeTab === 'about' ? (
            <div className="p-4 sm:p-5 space-y-4">

              {/* About */}
              {introduction && (
                <Section title={t('profile.about')} icon={<BookOpen size={15} />}>
                  <p className="text-[13px] text-slate-600 leading-relaxed">{introduction}</p>
                </Section>
              )}

              {/* Voice Introduction */}
              {profileData?.voice_intro_url && (
                <Section title={t('profile.voiceIntroduction')} icon={<Mic size={15} />}>
                  <VoiceIntroPlayer url={profileData.voice_intro_url} name={displayName} />
                </Section>
              )}

              {/* Basic Information */}
              {basicInfo && hasAnyValue(basicInfo, ['gender', 'age', 'religion', 'caste', 'maritial_status', 'no_of_children']) && (
                <Section title={t('profile.basicInformation')} icon={<Users size={15} />}>
                  <InfoGrid>
                    <InfoItem label="Gender" value={basicInfo.gender} />
                    <InfoItem label="Age" value={basicInfo.age ? `${basicInfo.age} years` : null} />
                    <InfoItem label="Religion" value={basicInfo.religion} />
                    <InfoItem label="Caste" value={basicInfo.caste} />
                    <InfoItem label="Marital Status" value={basicInfo.maritial_status} />
                    <InfoItem label="Children" value={basicInfo.no_of_children} />
                  </InfoGrid>
                </Section>
              )}

              {/* Education */}
              {education && education.length > 0 && (
                <Section title={t('profile.education')} icon={<GraduationCap size={15} />}>
                  <div className="space-y-2">
                    {education.map((edu: any, idx: number) => (
                      <div key={idx} className="flex items-start gap-2.5 p-2.5 bg-slate-50 rounded-xl">
                        <div className="size-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                          <GraduationCap size={14} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-[13px] text-slate-900 truncate">{edu.degree || 'Degree'}</p>
                          {edu.institution && <p className="text-xs text-slate-500 truncate">{edu.institution}</p>}
                          {edu.start && <p className="text-[11px] text-slate-400 mt-0.5">{edu.start}{edu.end ? ` – ${edu.end}` : ''}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </Section>
              )}

              {/* Career */}
              {career && career.length > 0 && (
                <Section title={t('profile.career')} icon={<Briefcase size={15} />}>
                  <div className="space-y-2">
                    {career.map((c: any, idx: number) => (
                      <div key={idx} className="flex items-start gap-2.5 p-2.5 bg-slate-50 rounded-xl">
                        <div className="size-8 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                          <Briefcase size={14} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-[13px] text-slate-900 truncate">{c.designation || 'Position'}</p>
                          {c.company && <p className="text-xs text-slate-500 truncate">{c.company}</p>}
                          {c.start && <p className="text-[11px] text-slate-400 mt-0.5">{c.start}{c.end ? ` – ${c.end}` : ' – Present'}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </Section>
              )}

              {/* Physical Attributes */}
              {physical && hasAnyValue(physical, ['height', 'weight', 'eye_color', 'hair_color', 'body_type', 'complexion', 'blood_group', 'disability']) && (
                <Section title={t('profile.physicalAttributes')} icon={<Ruler size={15} />}>
                  <InfoGrid>
                    <InfoItem label="Height" value={physical.height ? `${physical.height} cm` : null} />
                    <InfoItem label="Weight" value={physical.weight ? `${physical.weight} kg` : null} />
                    <InfoItem label="Eye Color" value={physical.eye_color} />
                    <InfoItem label="Hair Color" value={physical.hair_color} />
                    <InfoItem label="Body Type" value={physical.body_type} />
                    <InfoItem label="Complexion" value={physical.complexion} />
                    <InfoItem label="Blood Group" value={physical.blood_group} />
                    <InfoItem label="Disability" value={physical.disability} />
                  </InfoGrid>
                </Section>
              )}

              {/* Religious Background */}
              {spiritual && hasAnyValue(spiritual, ['religion', 'caste', 'sub_caste', 'ethnicity']) && (
                <Section title={t('profile.religiousBackground')} icon={<Moon size={15} />}>
                  <InfoGrid>
                    <InfoItem label="Religion" value={spiritual.religion} />
                    <InfoItem label="Caste" value={spiritual.caste} />
                    <InfoItem label="Sub Caste" value={spiritual.sub_caste} />
                    <InfoItem label="Ethnicity" value={spiritual.ethnicity} />
                  </InfoGrid>
                </Section>
              )}

              {/* Residence */}
              {residence && hasAnyValue(residence, ['country', 'state', 'city', 'nationality', 'born_in', 'grew_up_in']) && (
                <Section title={t('profile.residence')} icon={<Home size={15} />}>
                  <InfoGrid>
                    <InfoItem label="Country" value={residence.country} />
                    <InfoItem label="State" value={residence.state} />
                    <InfoItem label="City" value={residence.city} />
                    <InfoItem label="Nationality" value={residence.nationality} />
                    <InfoItem label="Born In" value={residence.born_in} />
                    <InfoItem label="Grew Up In" value={residence.grew_up_in} />
                  </InfoGrid>
                </Section>
              )}

              {/* Family */}
              {family && hasAnyValue(family, ['father', 'mother', 'siblings', 'family_type', 'family_value', 'family_status']) && (
                <Section title={t('profile.familyInformation')} icon={<Users size={15} />}>
                  <InfoGrid>
                    <InfoItem label="Father" value={family.father} />
                    <InfoItem label="Mother" value={family.mother} />
                    <InfoItem label="Siblings" value={family.siblings} />
                    <InfoItem label="Family Type" value={family.family_type} />
                    <InfoItem label="Family Values" value={family.family_value} />
                    <InfoItem label="Family Status" value={family.family_status} />
                  </InfoGrid>
                </Section>
              )}

              {/* Lifestyle */}
              {lifestyle && hasAnyValue(lifestyle, ['diet', 'drink', 'smoke', 'living_with']) && (
                <Section title={t('profile.lifestyle')} icon={<Star size={15} />}>
                  <InfoGrid>
                    <InfoItem label="Diet" value={lifestyle.diet} />
                    <InfoItem label="Drink" value={lifestyle.drink} />
                    <InfoItem label="Smoke" value={lifestyle.smoke} />
                    <InfoItem label="Living With" value={lifestyle.living_with} />
                  </InfoGrid>
                </Section>
              )}

              {/* Hobbies & Interests */}
              {hobbies && hasAnyValue(hobbies, ['hobbies', 'interests', 'music', 'books', 'movies', 'sports', 'cuisine', 'dress_style']) && (
                <Section title={t('profile.hobbiesAndInterests')} icon={<Heart size={15} />}>
                  <InfoGrid>
                    <InfoItem label="Hobbies" value={hobbies.hobbies} />
                    <InfoItem label="Interests" value={hobbies.interests} />
                    <InfoItem label="Music" value={hobbies.music} />
                    <InfoItem label="Books" value={hobbies.books} />
                    <InfoItem label="Movies" value={hobbies.movies} />
                    <InfoItem label="Sports" value={hobbies.sports} />
                    <InfoItem label="Cuisine" value={hobbies.cuisine} />
                    <InfoItem label="Dress Style" value={hobbies.dress_style} />
                  </InfoGrid>
                </Section>
              )}

              {/* Partner Expectations */}
              {partnerExpectation && hasAnyValue(partnerExpectation, ['min_age', 'max_age', 'height', 'weight', 'religion_id', 'caste_id', 'residence_country_id', 'marital_status', 'education', 'profession', 'smoking_acceptable', 'drinking_acceptable', 'family_value_id', 'general']) && (
                <Section title={t('profile.partnerExpectations')} icon={<Heart size={15} className="text-pink-500" />}>
                  <InfoGrid>
                    <InfoItem label="Age Range" value={partnerExpectation.min_age && partnerExpectation.max_age ? `${partnerExpectation.min_age} – ${partnerExpectation.max_age} yrs` : null} />
                    <InfoItem label="Height" value={partnerExpectation.height ? `${partnerExpectation.height} cm` : null} />
                    <InfoItem label="Weight" value={partnerExpectation.weight ? `${partnerExpectation.weight} kg` : null} />
                    <InfoItem label="Religion" value={partnerExpectation.religion_id} />
                    <InfoItem label="Caste" value={partnerExpectation.caste_id} />
                    <InfoItem label="Residence" value={partnerExpectation.residence_country_id} />
                    <InfoItem label="Marital Status" value={partnerExpectation.marital_status} />
                    <InfoItem label="Education" value={partnerExpectation.education} />
                    <InfoItem label="Profession" value={partnerExpectation.profession} />
                    <InfoItem label="Smoking" value={partnerExpectation.smoking_acceptable} />
                    <InfoItem label="Drinking" value={partnerExpectation.drinking_acceptable} />
                    <InfoItem label="Family Value" value={partnerExpectation.family_value_id} />
                  </InfoGrid>
                  {partnerExpectation.general && (
                    <div className="mt-3 p-4 bg-gradient-to-br from-pink-50 to-rose-50 rounded-xl border border-pink-100">
                      <p className="text-[11px] font-semibold text-pink-400 uppercase tracking-wider mb-1.5">{t('profile.idealPartner')}</p>
                      <p className="text-[13px] text-slate-700 leading-relaxed italic">
                        "{partnerExpectation.general}"
                      </p>
                    </div>
                  )}
                </Section>
              )}

              {/* Gallery */}
              {(visibleGallery.length > 0 || blurredGallery.length > 0) && (
                <Section title={t('profile.gallery')} icon={<Eye size={15} />}>
                  <div className="grid grid-cols-3 gap-1.5">
                    {/* Visible (public) photos */}
                    {visibleGallery.map((img: any, idx: number) => (
                      <div key={`v-${idx}`} className="aspect-square rounded-lg overflow-hidden bg-slate-100 relative">
                        <img src={img.image} alt="" className="w-full h-full object-cover" />
                        {/* Screenshot deterrence watermark */}
                        {screenshotDeterrence && (
                          <div className="absolute inset-0 pointer-events-none overflow-hidden select-none" style={{ zIndex: 2 }}>
                            <div className="absolute inset-[-50%] flex items-center justify-center" style={{ transform: 'rotate(-30deg)', width: '200%', height: '200%' }}>
                              <div className="w-full h-full flex flex-wrap items-start justify-start gap-6 p-3" style={{ opacity: 0.07 }}>
                                {Array.from({ length: 16 }).map((_, i) => (
                                  <span key={i} className="text-white text-[9px] font-bold whitespace-nowrap tracking-wider">DMB PROTECTED</span>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                    {/* Blurred (private) photos */}
                    {blurredGallery.map((img: any, idx: number) => (
                      <div key={`b-${idx}`} className="aspect-square rounded-lg overflow-hidden bg-slate-200 relative">
                        <img
                          src={img.thumbnail}
                          alt=""
                          className="w-full h-full object-cover scale-110"
                          style={{ filter: 'blur(20px)' }}
                        />
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/10">
                          <Lock size={16} className="text-white/70 mb-1" />
                          <span className="text-[9px] font-bold text-white/60 uppercase tracking-wider">Private</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  {lockedCount > 0 && (
                    <div className="mt-2 flex items-center justify-center gap-1.5 text-[11px] text-slate-400 py-1">
                      <Lock size={11} />
                      <span>{lockedCount} {t('profile.photosLocked', { count: lockedCount })}</span>
                    </div>
                  )}
                </Section>
              )}

              {/* Gallery — only locked images, no visible ones */}
              {visibleGallery.length === 0 && blurredGallery.length === 0 && lockedCount > 0 && (
                <Section title={t('profile.gallery')} icon={<Eye size={15} />}>
                  <div className="flex items-center justify-center gap-2 text-sm text-slate-400 py-6 bg-slate-50 rounded-xl">
                    <Lock size={14} />
                    <span>{lockedCount} {t('profile.photosLocked', { count: lockedCount })}</span>
                  </div>
                </Section>
              )}
            </div>
          ) : (
            /* ═══════════════════════════════════════
               COMPATIBILITY TAB
               ═══════════════════════════════════════ */
            <div className="p-4 sm:p-5">
              {intelLoading ? (
                <div className="h-48 flex flex-col items-center justify-center gap-3">
                  <Loader2 className="animate-spin text-primary" size={28} />
                  <p className="text-slate-400 text-sm">{t('profile.analyzingCompatibility')}</p>
                </div>
              ) : intelError || !intelligence ? (
                <div className="h-48 flex flex-col items-center justify-center gap-3 text-center px-6">
                  <div className="size-11 bg-red-50 text-red-400 rounded-full flex items-center justify-center">
                    <AlertTriangle size={22} />
                  </div>
                  <p className="text-slate-500 text-sm">{intelError || t('profile.failedToLoadCompatibility')}</p>
                </div>
              ) : (
                <div className="space-y-5">
                  {/* Score ring */}
                  <div className="flex flex-col items-center text-center">
                    <div className="relative size-28 sm:size-32 mb-3">
                      <svg className="size-full -rotate-90" viewBox="0 0 36 36">
                        <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#f1f5f9" strokeWidth="3" />
                        <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#d41173" strokeWidth="3" strokeDasharray={`${intelligence.totalScore}, 100`} />
                      </svg>
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                        <span className="text-2xl sm:text-3xl font-black text-slate-900">{intelligence.totalScore}%</span>
                        <span className="text-[9px] font-bold text-primary uppercase tracking-wider">{t('profile.compatible')}</span>
                      </div>
                    </div>

                    <div className="w-full max-w-xs space-y-2.5">
                      {intelligence.categories.map((cat: any, idx: number) => (
                        <div key={idx}>
                          <div className="flex justify-between items-end mb-0.5">
                            <span className="text-[11px] font-semibold text-slate-600">{cat.name}</span>
                            <span className="text-[11px] font-bold text-slate-800">{cat.score}%</span>
                          </div>
                          <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                cat.score >= 80 ? 'bg-green-500' : cat.score >= 60 ? 'bg-amber-500' : 'bg-red-400'
                              }`}
                              style={{ width: `${cat.score}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Mutual Fit */}
                  <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-100">
                    <div className="flex items-center gap-2 mb-2.5">
                      <ArrowLeftRight size={14} className="text-slate-500" />
                      <h3 className="font-bold text-slate-900 text-[13px]">{t('profile.mutualPreferenceFit')}</h3>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 text-center">
                        <div className="text-lg font-bold text-slate-900">{intelligence.mutualFit.youMeetThem}%</div>
                        <div className="text-[11px] text-slate-500 leading-tight">{t('profile.youMeetTheirCriteria')}</div>
                      </div>
                      <div className="h-7 w-px bg-slate-200" />
                      <div className="flex-1 text-center">
                        <div className="text-lg font-bold text-slate-900">{intelligence.mutualFit.theyMeetYou}%</div>
                        <div className="text-[11px] text-slate-500 leading-tight">{t('profile.theyMeetYourCriteria')}</div>
                      </div>
                    </div>
                  </div>

                  {/* Top Reasons */}
                  {intelligence.topReasons.length > 0 && (
                    <div>
                      <h3 className="font-bold text-slate-900 text-[13px] mb-2 flex items-center gap-2">
                        <Zap size={13} className="text-yellow-500 fill-yellow-500" />
                        {t('profile.topReasonsCompatible')}
                      </h3>
                      <ul className="space-y-1.5">
                        {intelligence.topReasons.map((reason: string, idx: number) => (
                          <li key={idx} className="flex items-start gap-2 text-[13px] text-slate-700">
                            <CheckCircle2 size={14} className="text-green-500 shrink-0 mt-0.5" />
                            {reason}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Friction Points */}
                  {intelligence.frictionPoints.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-bold text-slate-900 text-[13px] flex items-center gap-2">
                          <AlertTriangle size={13} className="text-orange-500" />
                          {t('profile.potentialFrictionPoints')}
                        </h3>
                        <button
                          onClick={() => setShowFriction(!showFriction)}
                          className="text-xs font-bold text-primary hover:underline"
                        >
                          {showFriction ? 'Hide' : 'View'}
                        </button>
                      </div>
                      <div className={`transition-all duration-300 ${showFriction ? 'opacity-100' : 'opacity-50 blur-sm select-none'}`}>
                        <ul className="space-y-1.5">
                          {intelligence.frictionPoints.map((point: string, idx: number) => (
                            <li key={idx} className="flex items-start gap-2 text-[13px] text-slate-600">
                              <div className="size-1.5 rounded-full bg-orange-400 mt-1.5 shrink-0" />
                              {point}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}

                  {/* Agent Notes */}
                  {intelligence.agentNotes && (
                    <div className="bg-purple-50 border border-purple-100 rounded-xl p-3.5">
                      <div className="flex items-center gap-2 mb-1.5">
                        <UserCheck size={14} className="text-purple-600" />
                        <h3 className="font-bold text-purple-900 text-[13px]">{t('profile.matchmakersNote')}</h3>
                      </div>
                      <p className="text-[13px] text-purple-800 italic leading-relaxed">"{intelligence.agentNotes}"</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/* ════════════════════════════════════════════════════════════
   HELPER COMPONENTS
   ════════════════════════════════════════════════════════════ */

const Section: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode }> = ({ title, icon, children }) => (
  <div>
    <div className="flex items-center gap-2 mb-2 pb-1.5 border-b border-slate-100">
      <span className="text-slate-400">{icon}</span>
      <h3 className="font-bold text-slate-800 text-[13px]">{title}</h3>
    </div>
    {children}
  </div>
);

const InfoGrid: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const validChildren = React.Children.toArray(children).filter(Boolean);
  if (validChildren.length === 0) return null;
  return <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">{validChildren}</div>;
};

const InfoItem: React.FC<{ label: string; value: any }> = ({ label, value }) => {
  if (value === null || value === undefined || value === '' || value === 'N/A' || value === 0) return null;
  const displayValue = typeof value === 'object' && value?.name ? value.name : String(value);
  if (!displayValue || displayValue === '' || displayValue === 'N/A') return null;

  return (
    <div className="p-2 sm:p-2.5 bg-slate-50 rounded-lg">
      <p className="text-[9px] sm:text-[10px] uppercase tracking-wider text-primary/60 font-bold mb-0.5">{label}</p>
      <p className="text-[13px] font-medium text-slate-800 break-words leading-snug">{displayValue}</p>
    </div>
  );
};

const VoiceIntroPlayer: React.FC<{ url: string; name: string }> = ({ url, name }) => {
  const { t } = useTranslation();
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const audioRef = React.useRef<HTMLAudioElement>(null);

  // Debug logging
  React.useEffect(() => {
    console.log('VoiceIntroPlayer initialized:', { url, isUrl: !!url, length: url?.length });
  }, [url]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio || error) return;
    if (isPlaying) {
      audio.pause();
    } else {
      console.log('Attempting to play audio:', url);
      audio.play().catch((err) => {
        console.error('Voice intro playback error:', err);
        setError('Unable to play voice introduction');
      });
    }
  };

  const formatTime = (sec: number) => {
    if (!sec || !isFinite(sec) || isNaN(sec)) return '0:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      const dur = audioRef.current.duration;
      // Some browsers return Infinity for certain audio formats (e.g. WebM w/o duration header)
      if (isFinite(dur) && !isNaN(dur) && dur > 0) {
        setDuration(dur);
      } else {
        // Fallback: try to discover duration by seeking to a large time
        audioRef.current.currentTime = 1e10;
        audioRef.current.addEventListener('timeupdate', function seekHandler() {
          if (audioRef.current) {
            const realDur = audioRef.current.duration;
            if (isFinite(realDur) && !isNaN(realDur) && realDur > 0) {
              setDuration(realDur);
            }
            audioRef.current.currentTime = 0;
            audioRef.current.removeEventListener('timeupdate', seekHandler);
          }
        }, { once: true });
      }
      setIsLoading(false);
      console.log('Voice intro loaded successfully:', { url, duration: audioRef.current.duration });
    }
  };

  const handleError = (e: any) => {
    console.error('Voice intro load error:', { url, errorCode: e.target?.error?.code, errorMsg: e.target?.error?.message, error: e });
    setIsLoading(false);
    setError('Unable to load voice introduction');
  };

  return (
    <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-100/50">
      <audio
        ref={audioRef}
        src={url}
        preload="metadata"
        crossOrigin="anonymous"
        onLoadedMetadata={handleLoadedMetadata}
        onTimeUpdate={() => {
          if (audioRef.current) {
            setCurrentTime(audioRef.current.currentTime);
            setProgress(audioRef.current.duration ? (audioRef.current.currentTime / audioRef.current.duration) * 100 : 0);
          }
        }}
        onPlay={() => { setIsPlaying(true); setError(null); }}
        onPause={() => setIsPlaying(false)}
        onEnded={() => { setIsPlaying(false); setProgress(0); setCurrentTime(0); }}
        onError={handleError}
      />
      
      {error ? (
        <div className="flex items-center gap-3">
          <AlertTriangle size={18} className="text-red-500 shrink-0" />
          <div>
            <p className="text-xs font-semibold text-red-600">{t('common.error') || 'Error'}</p>
            <p className="text-[12px] text-red-500">{error}</p>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-3">
          <button
            onClick={togglePlay}
            disabled={isLoading}
            className={`size-10 rounded-full flex items-center justify-center shadow-lg transition-all shrink-0 ${
              isLoading
                ? 'bg-purple-300 cursor-not-allowed'
                : 'bg-purple-600 hover:bg-purple-700 text-white cursor-pointer'
            }`}
          >
            {isLoading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : isPlaying ? (
              <Pause size={16} fill="white" />
            ) : (
              <Play size={16} fill="white" className="ml-0.5" />
            )}
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5">
                <Volume2 size={12} className="text-purple-500" />
                <span className="text-xs font-semibold text-purple-700">{t('profile.voiceIntroduction')}</span>
              </div>
              <span className="text-[10px] text-purple-400 font-medium tabular-nums">
                {formatTime(currentTime)} / {formatTime(duration || 0)}
              </span>
            </div>
            <div
              className={`h-1.5 bg-purple-100 rounded-full overflow-hidden ${!isLoading ? 'cursor-pointer' : ''}`}
              onClick={(e) => {
                if (!audioRef.current || !duration || isLoading) return;
                const rect = e.currentTarget.getBoundingClientRect();
                const pct = (e.clientX - rect.left) / rect.width;
                audioRef.current.currentTime = pct * duration;
              }}
            >
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-100"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileDetailModal;
