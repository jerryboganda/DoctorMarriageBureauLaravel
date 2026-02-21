import React, { useEffect, useMemo, useState } from 'react';
import {
  Users,
  Search,
  Lock,
  Shield,
  ArrowRight,
  MapPin,
  Building2,
  GraduationCap,
  Loader2,
  X,
  Globe,
  CheckCircle2
} from 'lucide-react';
import { api } from '../utils/api';
import { useTranslation } from 'react-i18next';

type Community = {
  id: number;
  name: string;
  type: string;
  description?: string | null;
  is_private: boolean;
  member_count: number;
  status: 'joined' | 'pending' | 'none';
};

const HeartIcon = ({ className }: { className?: string }) => (
  <svg className={`w-5 h-5 ${className}`} fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
  </svg>
);

const COMMUNITY_META: Record<string, { icon: React.ReactNode; color: string }> = {
  region: { icon: <MapPin className="text-blue-500" />, color: 'bg-blue-50 text-blue-700 border-blue-200' },
  alumni: { icon: <GraduationCap className="text-purple-500" />, color: 'bg-purple-50 text-purple-700 border-purple-200' },
  culture: { icon: <Users className="text-orange-500" />, color: 'bg-orange-50 text-orange-700 border-orange-200' },
  specialty: { icon: <HeartIcon className="text-red-500" />, color: 'bg-red-50 text-red-700 border-red-200' },
  organization: { icon: <Building2 className="text-emerald-500" />, color: 'bg-emerald-50 text-emerald-700 border-emerald-200' }
};

const getCommunityMeta = (type: string) => {
  const key = type?.toLowerCase() || 'default';
  return COMMUNITY_META[key] ?? {
    icon: <Shield className="text-slate-500" />,
    color: 'bg-slate-50 text-slate-700 border-slate-200'
  };
};

const formatMemberCount = (count?: number) => {
  if (!count) return '0';
  if (count >= 1000) return `${(count / 1000).toFixed(1)}k`;
  return String(count);
};

const CommunityView: React.FC = () => {
  const { t } = useTranslation();
  const [filter, setFilter] = useState<'all' | 'joined' | 'pending'>('all');
  const [search, setSearch] = useState('');
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<Record<number, boolean>>({});
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createSuccess, setCreateSuccess] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    const timeoutId = setTimeout(async () => {
      try {
        const response = await api.get('/member/communities', {
          params: { search: search.trim() || undefined }
        });
        if (!active) return;
        const items = response.data?.data ?? [];
        setCommunities(items);
      } catch (err) {
        if (!active) return;
        setError('Unable to load communities right now.');
      } finally {
        if (active) setLoading(false);
      }
    }, 250);

    return () => {
      active = false;
      clearTimeout(timeoutId);
    };
  }, [search]);

  const joinedCount = useMemo(
    () => communities.filter((community) => community.status === 'joined').length,
    [communities]
  );
  const pendingCount = useMemo(
    () => communities.filter((community) => community.status === 'pending').length,
    [communities]
  );

  const filteredCommunities = useMemo(() => {
    if (filter === 'joined') return communities.filter((community) => community.status === 'joined');
    if (filter === 'pending') return communities.filter((community) => community.status === 'pending');
    return communities;
  }, [communities, filter]);

  const handleJoin = async (communityId: number) => {
    if (actionLoading[communityId]) return;
    setActionLoading((prev) => ({ ...prev, [communityId]: true }));
    try {
      const response = await api.post(`/member/communities/${communityId}/join`);
      const nextStatus = response.data?.status || 'pending';
      setCommunities((prev) =>
        prev.map((community) =>
          community.id === communityId ? { ...community, status: nextStatus } : community
        )
      );
    } catch (err) {
      setError('Unable to join the community right now.');
    } finally {
      setActionLoading((prev) => ({ ...prev, [communityId]: false }));
    }
  };

  const handleLeave = async (communityId: number) => {
    if (actionLoading[communityId]) return;
    setActionLoading((prev) => ({ ...prev, [communityId]: true }));
    try {
      await api.delete(`/member/communities/${communityId}/leave`);
      setCommunities((prev) =>
        prev.map((community) =>
          community.id === communityId ? { ...community, status: 'none' } : community
        )
      );
    } catch (err) {
      setError('Unable to leave the community right now.');
    } finally {
      setActionLoading((prev) => ({ ...prev, [communityId]: false }));
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full min-h-0 bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 p-8 pb-0">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-start mb-8">
            <div>
              <h2 className="text-3xl font-black text-slate-900 mb-2">{t('community.title')}</h2>
              <p className="text-slate-500">{t('community.subtitle')}</p>
            </div>
            <button 
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-slate-900 text-white rounded-lg font-bold text-sm hover:bg-slate-800"
            >
              {t('community.createCommunity')}
            </button>
          </div>

          <div className="flex items-center gap-4 border-b border-slate-200">
            <TabItem label={t('community.discover')} active={filter === 'all'} onClick={() => setFilter('all')} />
            <TabItem label={t('community.myCommunities')} active={filter === 'joined'} onClick={() => setFilter('joined')} count={joinedCount} />
            <TabItem label={t('community.pendingRequests')} active={filter === 'pending'} onClick={() => setFilter('pending')} count={pendingCount} />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-8 scrollbar-hide">
        <div className="max-w-6xl mx-auto">
          {/* Search */}
          <div className="relative mb-8">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              placeholder={t('community.searchPlaceholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-xl shadow-sm focus:ring-2 focus:ring-primary/20 text-slate-900"
            />
          </div>

          {/* Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loading ? (
              <div className="col-span-full flex flex-col items-center justify-center py-16 text-slate-500">
                <Loader2 className="animate-spin" size={36} />
                <p className="mt-3 text-sm font-medium">{t('community.loading')}</p>
              </div>
            ) : error ? (
              <div className="col-span-full text-center text-sm text-red-500">{error}</div>
            ) : filteredCommunities.length === 0 ? (
              <div className="col-span-full text-center text-sm text-slate-500">{t('community.noCommunities')}</div>
            ) : (
              filteredCommunities.map((community) => {
                const isJoined = community.status === 'joined';
                const isPending = community.status === 'pending';
                const meta = getCommunityMeta(community.type);
                const memberLabel = formatMemberCount(community.member_count);

                return (
                  <div
                    key={community.id}
                    className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow group relative overflow-hidden"
                  >
                    {isJoined && (
                      <div className="absolute top-0 right-0 bg-green-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl">
                        {t('community.joined')}
                      </div>
                    )}
                    {isPending && (
                      <div className="absolute top-0 right-0 bg-amber-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl">
                        {t('community.pending')}
                      </div>
                    )}

                    <div className="flex items-start justify-between mb-4">
                      <div className={`size-12 rounded-xl flex items-center justify-center border ${meta.color}`}>
                        {meta.icon}
                      </div>
                      {community.is_private && <Lock size={16} className="text-slate-400" title="Private Group" />}
                    </div>

                    <h3 className="text-lg font-bold text-slate-900 mb-1">{community.name}</h3>
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-xs font-bold text-slate-500 px-2 py-0.5 bg-slate-100 rounded-md uppercase">{community.type}</span>
                      <span className="text-xs text-slate-400">- {memberLabel} {t('community.members')}</span>
                    </div>

                    <p className="text-sm text-slate-600 mb-6 line-clamp-2 h-10">
                      {community.description || t('community.descriptionComingSoon')}
                    </p>

                    <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                      <div className="flex -space-x-2">
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="size-6 rounded-full border-2 border-white bg-slate-200"></div>
                        ))}
                        <div className="size-6 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[8px] font-bold text-slate-500">
                          +40
                        </div>
                      </div>

                      {isJoined ? (
                        <button
                          onClick={() => handleLeave(community.id)}
                          className="text-sm font-bold text-slate-900 hover:text-primary flex items-center gap-1"
                          disabled={actionLoading[community.id]}
                        >
                          {actionLoading[community.id] ? t('community.leaving') : t('community.leave')} <ArrowRight size={16} />
                        </button>
                      ) : (
                        <button
                          onClick={() => handleJoin(community.id)}
                          className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors ${
                            community.is_private ? 'bg-slate-100 text-slate-600 hover:bg-slate-200' : 'bg-primary/10 text-primary hover:bg-primary/20'
                          }`}
                          disabled={actionLoading[community.id] || isPending}
                        >
                          {actionLoading[community.id]
                            ? t('community.sendingRequest')
                            : isPending
                              ? t('community.requestPending')
                              : community.is_private
                                ? t('community.requestToJoin')
                                : t('community.joinNetwork')}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}

            {/* Promo Card */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 text-white flex flex-col justify-center text-center">
              <div className="size-12 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4 text-yellow-400">
                <Shield size={24} />
              </div>
              <h3 className="font-bold text-lg mb-2">{t('community.adminTitle')}</h3>
              <p className="text-sm text-slate-300 mb-6">{t('community.adminDesc')}</p>
              <button 
                onClick={() => setShowCreateModal(true)}
                className="bg-white text-slate-900 py-2 rounded-lg font-bold text-sm hover:bg-slate-100"
              >
                {t('community.applyForAdmin')}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Create Community Modal */}
      {showCreateModal && (
        <CreateCommunityModal 
          onClose={() => setShowCreateModal(false)}
          onSuccess={(newCommunity) => {
            setCommunities(prev => [newCommunity, ...prev]);
            setShowCreateModal(false);
            setCreateSuccess(true);
            setTimeout(() => setCreateSuccess(false), 5000);
          }}
        />
      )}

      {/* Success Toast */}
      {createSuccess && (
        <div className="fixed bottom-4 right-4 bg-green-600 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 z-50 animate-in slide-in-from-bottom-4">
          <CheckCircle2 size={24} />
          <div>
            <p className="font-bold">{t('community.createdSuccess')}</p>
            <p className="text-sm text-green-100">{t('community.createdSuccessDesc')}</p>
          </div>
        </div>
      )}
    </div>
  );
};

const COMMUNITY_TYPES = [
  { value: 'region', label: 'Region', description: 'Geographic area or city' },
  { value: 'alumni', label: 'Alumni', description: 'University or college graduates' },
  { value: 'culture', label: 'Culture', description: 'Ethnic or cultural group' },
  { value: 'specialty', label: 'Specialty', description: 'Medical specialty' },
  { value: 'organization', label: 'Organization', description: 'Hospital or institution' },
];

const CreateCommunityModal: React.FC<{
  onClose: () => void;
  onSuccess: (community: Community) => void;
}> = ({ onClose, onSuccess }) => {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [type, setType] = useState('region');
  const [description, setDescription] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Community name is required');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const response = await api.post('/member/communities', {
        name: name.trim(),
        type,
        description: description.trim() || null,
        is_private: isPrivate,
      });

      if (response.data.result) {
        onSuccess(response.data.data);
      } else {
        setError(response.data.message || 'Failed to create community');
      }
    } catch (err: any) {
      const message = err.response?.data?.message || err.response?.data?.errors?.name?.[0] || 'Failed to create community. Please try again.';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div 
        className="bg-white rounded-2xl w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div>
            <h3 className="text-xl font-bold text-slate-900">{t('community.createModalTitle')}</h3>
            <p className="text-sm text-slate-500">{t('community.createModalSubtitle')}</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100">
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1">
          {error && (
            <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200">
              {error}
            </div>
          )}

          {/* Name */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">{t('community.communityName')}</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Karachi Doctors Network"
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary"
              maxLength={100}
            />
          </div>

          {/* Type */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">{t('community.communityType')}</label>
            <div className="grid grid-cols-2 gap-2">
              {COMMUNITY_TYPES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setType(t.value)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    type === t.value 
                      ? 'border-primary bg-primary/5 text-primary' 
                      : 'border-slate-200 hover:border-slate-300 text-slate-700'
                  }`}
                >
                  <p className="font-bold text-sm">{t.label}</p>
                  <p className="text-xs opacity-70">{t.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">{t('community.description')}</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('community.descriptionPlaceholder')}
              rows={3}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
              maxLength={500}
            />
            <p className="text-xs text-slate-400 mt-1">{description.length}/500 characters</p>
          </div>

          {/* Privacy */}
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
            <div className="flex items-center gap-3">
              {isPrivate ? <Lock size={20} className="text-amber-500" /> : <Globe size={20} className="text-green-500" />}
              <div>
                <p className="font-bold text-sm text-slate-900">{isPrivate ? t('community.privateCommunity') : t('community.publicCommunity')}</p>
                <p className="text-xs text-slate-500">
                  {isPrivate ? t('community.privateDesc') : t('community.publicDesc')}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsPrivate(!isPrivate)}
              className={`w-12 h-6 rounded-full transition-colors ${isPrivate ? 'bg-amber-500' : 'bg-slate-300'}`}
            >
              <div className={`size-5 bg-white rounded-full shadow transition-transform ${isPrivate ? 'translate-x-6' : 'translate-x-0.5'}`} />
            </button>
          </div>

          {/* Info */}
          <div className="p-4 bg-blue-50 rounded-xl text-sm text-blue-700 border border-blue-100">
            <p className="font-bold mb-1">⏳ {t('community.adminApproval')}</p>
            <p className="text-blue-600">{t('community.adminApprovalDesc')}</p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 border border-slate-200 rounded-xl font-bold text-slate-700 hover:bg-slate-50"
            >
              {t('community.cancel')}
            </button>
            <button
              type="submit"
              disabled={submitting || !name.trim()}
              className="flex-1 py-3 px-4 bg-primary text-white rounded-xl font-bold hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  {t('community.creating')}
                </>
              ) : (
                t('community.createCommunity')
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const TabItem: React.FC<{ label: string; active: boolean; onClick: () => void; count?: number }> = ({ label, active, onClick, count }) => (
  <button
    onClick={onClick}
    className={`px-4 py-4 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${
      active ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-700'
    }`}
  >
    {label}
    {count ? <span className="bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded-full text-[10px]">{count}</span> : null}
  </button>
);

export default CommunityView;
