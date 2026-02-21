import React, { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Gift, Copy, Check, RefreshCw, Users, Award, Clock, Star,
  Share2, Link2, ChevronRight, AlertCircle, Loader2
} from 'lucide-react';
import { api } from '../utils/api';

interface ReferralStats {
  referral_code: string;
  referral_link: string;
  code_status: string;
  total_referred: number;
  qualified_count: number;
  pending_count: number;
  remaining_for_reward: number;
  threshold: number;
  progress_percentage: number;
  rule_name: string;
  rewards: Array<{
    id: number;
    reward_type: string;
    status: string;
    applied_at: string | null;
    rule_name: string;
  }>;
  referrals: Array<{
    id: number;
    referred_name: string;
    referred_email: string;
    status: string;
    qualified_at: string | null;
    created_at: string;
  }>;
}

interface ReferralSettings {
  enabled: boolean;
  allow_code_regeneration: boolean;
  rules: Array<{
    name: string;
    trigger_threshold: number;
    reward_type: string;
    reward_params: any;
  }>;
}

const formatRewardType = (type: string): string => {
  const map: Record<string, string> = {
    package_upgrade: 'Package Upgrade',
    balance_credit: 'Balance Credit',
    feature_unlock: 'Feature Unlock',
  };
  return map[type] || type.replace(/_/g, ' ');
};

const ReferralView: React.FC = () => {
  const { t } = useTranslation();
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [settings, setSettings] = useState<ReferralSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'referrals' | 'rewards'>('overview');

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [statsRes, settingsRes] = await Promise.allSettled([
        api.get('/referral/my-stats'),
        api.get('/referral/settings-public'),
      ]);

      if (statsRes.status === 'fulfilled') {
        setStats(statsRes.value.data.data || statsRes.value.data);
      }
      if (settingsRes.status === 'fulfilled') {
        setSettings(settingsRes.value.data.data || settingsRes.value.data);
      }
      if (statsRes.status === 'rejected') {
        throw new Error(statsRes.reason?.response?.data?.message || 'Failed to load referral data');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load referral data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCopyCode = async () => {
    if (!stats?.referral_code) return;
    try {
      await navigator.clipboard.writeText(stats.referral_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch { /* fallback */ }
  };

  const handleCopyLink = async () => {
    if (!stats?.referral_link) return;
    try {
      await navigator.clipboard.writeText(stats.referral_link);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch { /* fallback */ }
  };

  const handleShare = async () => {
    if (!stats?.referral_link) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: t('referral.shareTitle'),
          text: t('referral.shareText'),
          url: stats.referral_link,
        });
      } catch { /* user cancelled */ }
    } else {
      handleCopyLink();
    }
  };

  const handleRegenerate = async () => {
    if (regenerating) return;
    try {
      setRegenerating(true);
      const res = await api.post('/referral/regenerate-code');
      if (res.data.data) {
        setStats(prev => prev ? { ...prev, referral_code: res.data.data.code, referral_link: res.data.data.referral_link } : prev);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to regenerate code');
    } finally {
      setRegenerating(false);
    }
  };

  const progressPercent = stats ? Math.min(stats.progress_percentage, 100) : 0;

  return (
    <div className="flex-1 flex flex-col h-full min-h-0">
      {/* ── Sticky Header ── */}
      <header className="h-auto md:h-20 shrink-0 flex flex-col md:flex-row items-start md:items-center justify-between px-4 md:px-8 py-4 bg-white border-b border-slate-200 sticky top-0 z-10 gap-4">
        <div className="w-full md:w-auto">
          <h2 className="text-2xl font-bold text-slate-900">{t('referral.title')}</h2>
          <div className="flex gap-6 mt-1 overflow-x-auto scrollbar-hide w-full pb-1">
            <button
              onClick={() => setActiveTab('overview')}
              className={`text-sm font-bold transition-colors border-b-2 pb-0.5 whitespace-nowrap ${activeTab === 'overview' ? 'text-primary border-primary' : 'text-slate-500 border-transparent hover:text-slate-700'}`}
            >
              {t('referral.tab_overview')}
            </button>
            <button
              onClick={() => setActiveTab('referrals')}
              className={`text-sm font-bold transition-colors border-b-2 pb-0.5 flex items-center gap-1.5 whitespace-nowrap ${activeTab === 'referrals' ? 'text-primary border-primary' : 'text-slate-500 border-transparent hover:text-slate-700'}`}
            >
              <Users size={14} /> {t('referral.tab_referrals')}
            </button>
            <button
              onClick={() => setActiveTab('rewards')}
              className={`text-sm font-bold transition-colors border-b-2 pb-0.5 flex items-center gap-1.5 whitespace-nowrap ${activeTab === 'rewards' ? 'text-primary border-primary' : 'text-slate-500 border-transparent hover:text-slate-700'}`}
            >
              <Award size={14} /> {t('referral.tab_rewards')}
            </button>
          </div>
        </div>
      </header>

      {/* ── Main Scrollable Content ── */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8 scrollbar-hide">
        <div className="max-w-6xl mx-auto">

          {loading ? (
            <div className="flex items-center justify-center p-20">
              <div className="flex flex-col items-center gap-3 text-slate-400">
                <Loader2 size={32} className="animate-spin text-primary" />
                <p className="text-sm font-medium">{t('referral.loading')}</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center p-20">
              <div className="flex flex-col items-center gap-3 text-center">
                <AlertCircle size={32} className="text-red-400" />
                <p className="text-sm font-medium text-slate-600">{error}</p>
                <button onClick={fetchData} className="mt-2 px-4 py-2 bg-primary text-white rounded-full text-sm font-bold hover:bg-primary/90 transition-colors">
                  {t('referral.retry')}
                </button>
              </div>
            </div>
          ) : stats && (
            <>
              {/* ── Overview Tab ── */}
              {activeTab === 'overview' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4">

                  {/* Left Column */}
                  <div className="space-y-6">

                    {/* Referral Code Card */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                      <div className="p-6 border-b border-slate-100">
                        <div className="flex items-center gap-3 mb-1">
                          <Gift size={20} className="text-primary" />
                          <h4 className="font-bold text-slate-900">{t('referral.yourCode')}</h4>
                        </div>
                        <p className="text-sm text-slate-500 ml-8">{t('referral.shareCodeDesc')}</p>
                      </div>
                      <div className="p-6 space-y-4">
                        {/* Code */}
                        <div className="flex items-center gap-3">
                          <div className="flex-1 bg-slate-50 border border-dashed border-slate-300 rounded-lg px-5 py-3 text-center">
                            <span className="text-xl font-mono font-bold text-primary tracking-[0.25em]">
                              {stats.referral_code}
                            </span>
                          </div>
                          <button
                            onClick={handleCopyCode}
                            className={`shrink-0 flex items-center gap-2 px-4 py-3 rounded-lg font-medium text-sm transition-all ${
                              copied ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-primary text-white hover:bg-primary/90'
                            }`}
                          >
                            {copied ? <Check size={16} /> : <Copy size={16} />}
                            {copied ? t('referral.copied') : t('referral.copyCode')}
                          </button>
                        </div>

                        {settings?.allow_code_regeneration && (
                          <button
                            onClick={handleRegenerate}
                            disabled={regenerating}
                            className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 transition-colors disabled:opacity-50"
                          >
                            <RefreshCw size={14} className={regenerating ? 'animate-spin' : ''} />
                            {t('referral.regenerate')}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Referral Link Card */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                      <div className="p-6 border-b border-slate-100">
                        <div className="flex items-center gap-3 mb-1">
                          <Link2 size={20} className="text-primary" />
                          <h4 className="font-bold text-slate-900">{t('referral.yourLink')}</h4>
                        </div>
                      </div>
                      <div className="p-6">
                        <div className="flex items-center gap-2 bg-slate-50 rounded-lg px-4 py-3 border border-slate-200">
                          <input
                            readOnly
                            value={stats.referral_link}
                            className="flex-1 bg-transparent text-sm text-slate-600 truncate border-none outline-none min-w-0"
                          />
                          <button
                            onClick={handleCopyLink}
                            className={`shrink-0 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                              copiedLink ? 'bg-green-100 text-green-700' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            {copiedLink ? t('referral.copied') : t('referral.copy')}
                          </button>
                          <button
                            onClick={handleShare}
                            className="shrink-0 p-1.5 rounded-md bg-white border border-slate-200 text-slate-500 hover:bg-slate-100 transition-all"
                          >
                            <Share2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* How It Works */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                      <div className="p-6 border-b border-slate-100">
                        <h4 className="font-bold text-slate-900">{t('referral.howItWorks')}</h4>
                      </div>
                      <div className="p-6 space-y-5">
                        <StepItem number={1} title={t('referral.step1Title')} desc={t('referral.step1Desc')} />
                        <StepItem number={2} title={t('referral.step2Title')} desc={t('referral.step2Desc')} />
                        <StepItem number={3} title={t('referral.step3Title')} desc={t('referral.step3Desc')} />
                      </div>
                    </div>
                  </div>

                  {/* Right Column */}
                  <div className="space-y-6">

                    {/* Progress Card */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                      <div className="p-6 border-b border-slate-100">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-bold text-slate-900">{t('referral.progressTitle')}</h4>
                            <p className="text-sm text-slate-500 mt-0.5">{stats.rule_name}</p>
                          </div>
                          <div className="text-right">
                            <span className="text-2xl font-bold text-primary">{stats.qualified_count}</span>
                            <span className="text-sm text-slate-400">/{stats.threshold}</span>
                          </div>
                        </div>
                      </div>
                      <div className="p-6">
                        <div className="relative h-3 bg-slate-100 rounded-full overflow-hidden mb-3">
                          <div
                            className="absolute inset-y-0 left-0 bg-primary rounded-full transition-all duration-700"
                            style={{ width: `${progressPercent}%` }}
                          />
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-500">
                            {stats.remaining_for_reward > 0
                              ? t('referral.remainingForReward', { count: stats.remaining_for_reward })
                              : t('referral.rewardUnlocked')
                            }
                          </span>
                          <span className="font-bold text-primary">{progressPercent}%</span>
                        </div>
                      </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-4">
                      <StatCard icon={<Users size={18} />} label={t('referral.totalReferred')} value={stats.total_referred} color="primary" />
                      <StatCard icon={<Check size={18} />} label={t('referral.qualified')} value={stats.qualified_count} color="green" />
                      <StatCard icon={<Clock size={18} />} label={t('referral.pending')} value={stats.pending_count} color="amber" />
                      <StatCard icon={<Award size={18} />} label={t('referral.rewards')} value={stats.rewards?.length || 0} color="purple" />
                    </div>

                    {/* Active Reward Rules */}
                    {settings?.rules && settings.rules.length > 0 && (
                      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="p-6 border-b border-slate-100">
                          <h4 className="font-bold text-slate-900">{t('referral.activeRewards')}</h4>
                        </div>
                        <div className="divide-y divide-slate-100">
                          {settings.rules.map((rule, idx) => (
                            <div key={idx} className="flex items-center gap-4 p-4 hover:bg-slate-50 transition-colors">
                              <div className="p-2 bg-amber-50 rounded-lg">
                                <Star className="w-5 h-5 text-amber-500" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm text-slate-900 truncate">{rule.name}</p>
                                <p className="text-xs text-slate-500">
                                  {t('referral.referCount', { count: rule.trigger_threshold })} → {formatRewardType(rule.reward_type)}
                                </p>
                              </div>
                              <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ── Referrals Tab ── */}
              {activeTab === 'referrals' && (
                <div className="max-w-4xl animate-in fade-in slide-in-from-bottom-4">
                  <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    {stats.referrals && stats.referrals.length > 0 ? (
                      <>
                        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                          <p className="text-sm font-bold text-slate-500">
                            {stats.total_referred} {t('referral.totalReferred')}
                          </p>
                        </div>
                        <div className="divide-y divide-slate-100">
                          {stats.referrals.map((ref) => (
                            <div key={ref.id} className="flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors">
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                                  <Users size={16} className="text-slate-400" />
                                </div>
                                <div className="min-w-0">
                                  <p className="font-medium text-sm text-slate-900 truncate">{ref.referred_name || 'User'}</p>
                                  <p className="text-xs text-slate-400">{new Date(ref.created_at).toLocaleDateString()}</p>
                                </div>
                              </div>
                              <StatusBadge status={ref.status} />
                            </div>
                          ))}
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-16">
                        <Users className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                        <p className="text-sm font-medium text-slate-500">{t('referral.noReferrals')}</p>
                        <p className="text-xs text-slate-400 mt-1">{t('referral.noReferralsDesc')}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ── Rewards Tab ── */}
              {activeTab === 'rewards' && (
                <div className="max-w-4xl animate-in fade-in slide-in-from-bottom-4">
                  <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    {stats.rewards && stats.rewards.length > 0 ? (
                      <>
                        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                          <p className="text-sm font-bold text-slate-500">
                            {stats.rewards.length} {t('referral.rewards')}
                          </p>
                        </div>
                        <div className="divide-y divide-slate-100">
                          {stats.rewards.map((reward) => (
                            <div key={reward.id} className="flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors">
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="w-9 h-9 rounded-full bg-amber-50 flex items-center justify-center shrink-0">
                                  <Award size={16} className="text-amber-500" />
                                </div>
                                <div className="min-w-0">
                                  <p className="font-medium text-sm text-slate-900 truncate">{reward.rule_name || formatRewardType(reward.reward_type)}</p>
                                  <p className="text-xs text-slate-400">{reward.applied_at ? new Date(reward.applied_at).toLocaleDateString() : t('referral.pendingApply')}</p>
                                </div>
                              </div>
                              <StatusBadge status={reward.status} />
                            </div>
                          ))}
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-16">
                        <Award className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                        <p className="text-sm font-medium text-slate-500">{t('referral.noRewards')}</p>
                        <p className="text-xs text-slate-400 mt-1">{t('referral.noRewardsDesc')}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}

        </div>
      </div>
    </div>
  );
};

/* ─── Helper Components ─── */

const StatCard = ({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number; color: string }) => {
  const colorMap: Record<string, string> = {
    primary: 'text-primary bg-primary/5',
    green: 'text-green-600 bg-green-50',
    amber: 'text-amber-600 bg-amber-50',
    purple: 'text-purple-600 bg-purple-50',
  };
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${colorMap[color]}`}>
        {icon}
      </div>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
      <p className="text-xs text-slate-500 mt-0.5">{label}</p>
    </div>
  );
};

const StepItem = ({ number, title, desc }: { number: number; title: string; desc: string }) => (
  <div className="flex gap-4">
    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
      <span className="text-sm font-bold text-primary">{number}</span>
    </div>
    <div>
      <p className="font-medium text-sm text-slate-900">{title}</p>
      <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
    </div>
  </div>
);

const StatusBadge = ({ status }: { status: string }) => {
  const map: Record<string, { bg: string; label: string }> = {
    pending: { bg: 'bg-amber-100 text-amber-700', label: 'Pending' },
    qualified: { bg: 'bg-green-100 text-green-700', label: 'Qualified' },
    invalid: { bg: 'bg-red-100 text-red-700', label: 'Invalid' },
    applied: { bg: 'bg-green-100 text-green-700', label: 'Applied' },
    reversed: { bg: 'bg-slate-100 text-slate-600', label: 'Reversed' },
    failed: { bg: 'bg-red-100 text-red-700', label: 'Failed' },
  };
  const s = map[status] || { bg: 'bg-slate-100 text-slate-600', label: status };
  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${s.bg}`}>
      {s.label}
    </span>
  );
};

export default ReferralView;
