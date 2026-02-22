import React, { useState, useEffect, useRef } from 'react';
import {
    Users, ShieldCheck, FileText, Share2, Download, Plus, CheckCircle2,
    Clock, XCircle, ChevronRight, QrCode, Mail, Lock, Heart, Eye, Loader2, Save, X,
    Edit2, Trash2, Phone, AlertCircle, UserPlus
} from 'lucide-react';
import { useAuthStore } from '../src/stores/authStore';
import { api } from '../utils/api';
import { compressImage } from '../utils/compression';
import { useTranslation } from 'react-i18next';
import html2pdf from 'html2pdf.js';
import { createRoot } from 'react-dom/client';
import BiodataPDFTemplate from './BiodataPDFTemplate';

interface FamilyProfile {
    description: string;
    traditionLevel: string;
    affluenceLevel: string;
    interests: string[];
    photos: { id: number; url: string }[];
}

interface Guardian {
    id: number;
    name: string;
    role: string;
    email: string;
    phone?: string;
    status: string;
    isOwner: boolean;
    isPrimaryContact?: boolean;
    permissions: string[];
}

interface Approval {
    id: number;
    name: string;
    desc: string;
    status: string;
    img: string;
    time: string;
    approved: boolean;
}

const FamilyPortalView: React.FC = () => {
    const { t } = useTranslation();
    const { user } = useAuthStore();
    const [activeTab, setActiveTab] = useState<'profile' | 'guardians' | 'approvals' | 'biodata'>('profile');
    const [showQr, setShowQr] = useState(false);
    const [loading, setLoading] = useState(true);
    const [familyData, setFamilyData] = useState<{
        profile: FamilyProfile;
        guardians: Guardian[];
        approvals: Approval[];
    } | null>(null);

    useEffect(() => {
        fetchFamilyData();
    }, []);

    const fetchFamilyData = async () => {
        try {
            setLoading(true);
            const response = await api.get('/family');
            setFamilyData(response.data);
        } catch (error) {
            console.error('Error fetching family data:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center bg-slate-50">
                <div className="text-center">
                    <Loader2 className="animate-spin text-primary mx-auto mb-4" size={40} />
                    <p className="text-slate-500 font-medium">{t('family.loading')}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col h-full min-h-0 bg-slate-50 relative">
            {/* Header */}
            <header className="h-auto py-4 md:py-0 md:h-20 shrink-0 flex flex-col md:flex-row items-start md:items-center justify-between px-4 md:px-8 bg-white border-b border-slate-200 sticky top-0 z-10 gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">{t('family.title')}</h2>
                    <p className="text-sm text-slate-500">{t('family.subtitle')}</p>
                </div>
                <div className="flex bg-slate-100 p-1 rounded-lg w-full md:w-auto overflow-x-auto scrollbar-hide">
                    <TabButton label={t('family.tabs.familyProfile')} active={activeTab === 'profile'} onClick={() => setActiveTab('profile')} />
                    <TabButton label={t('family.tabs.guardians')} active={activeTab === 'guardians'} onClick={() => setActiveTab('guardians')} />
                    <TabButton label={t('family.tabs.approvals')} active={activeTab === 'approvals'} onClick={() => setActiveTab('approvals')} badge={familyData?.approvals.filter(a => !a.approved).length.toString()} />
                    <TabButton label={t('family.tabs.biodata')} active={activeTab === 'biodata'} onClick={() => setActiveTab('biodata')} />
                </div>
            </header>

            {/* Main Content */}
            <div className="flex-1 overflow-y-auto p-4 md:p-8 scrollbar-hide">
                <div className="max-w-6xl mx-auto">

                    {activeTab === 'profile' && familyData && <FamilyProfileSection profile={familyData.profile} onUpdate={fetchFamilyData} />}
                    {activeTab === 'guardians' && familyData && <GuardiansSection guardians={familyData.guardians} onRefresh={fetchFamilyData} />}
                    {activeTab === 'approvals' && familyData && <ApprovalsSection approvals={familyData.approvals} onRefresh={fetchFamilyData} />}
                    {activeTab === 'biodata' && <BiodataSection onShowQr={() => setShowQr(true)} />}

                </div>
            </div>

            {showQr && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl p-8 text-center max-w-sm w-full animate-in zoom-in-95">
                        <h3 className="text-xl font-bold text-slate-900 mb-2">{t('family.shareBiodata')}</h3>
                        <p className="text-sm text-slate-500 mb-6">{t('family.scanToView', { name: user?.name ?? 'member' })}</p>
                        <div className="bg-white p-4 rounded-xl border-2 border-slate-900 inline-block mb-6">
                            <QrCode size={160} className="text-slate-900" />
                        </div>
                        <div className="flex gap-3">
                            <button onClick={() => setShowQr(false)} className="flex-1 py-2 text-slate-500 font-bold hover:bg-slate-50 rounded-lg">{t('family.close')}</button>
                            <button className="flex-1 py-2 bg-primary text-white font-bold rounded-lg hover:bg-primary-hover">{t('family.copyLink')}</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

/* --- Sections --- */

const FamilyProfileSection: React.FC<{ profile: FamilyProfile, onUpdate: () => void }> = ({ profile, onUpdate }) => {
    const { t } = useTranslation();
    const [description, setDescription] = useState(profile.description);
    const [tradition, setTradition] = useState(profile.traditionLevel);
    const [affluence, setAffluence] = useState(profile.affluenceLevel);
    const [interests, setInterests] = useState<string[]>(profile.interests ?? []);
    const [interestInput, setInterestInput] = useState('');
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [deletingPhotoId, setDeletingPhotoId] = useState<number | null>(null);
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    // Sync from server when profile prop changes
    useEffect(() => {
        setInterests(profile.interests ?? []);
    }, [profile.interests]);

    const addInterest = () => {
        const val = interestInput.trim();
        if (!val) return;
        if (interests.some(i => i.toLowerCase() === val.toLowerCase())) return;
        setInterests(prev => [...prev, val]);
        setInterestInput('');
    };

    const removeInterest = (tag: string) => {
        setInterests(prev => prev.filter(i => i !== tag));
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            await api.post('/family/update-profile', {
                description,
                traditionLevel: tradition,
                affluenceLevel: affluence,
                interests
            });
            onUpdate();
        } catch (error) {
            console.error('Failed to update profile', error);
        } finally {
            setSaving(false);
        }
    };

    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        try {
            setUploading(true);
            const compressedFile = await compressImage(file);

            const formData = new FormData();
            formData.append('photo', compressedFile);
            await api.post('/family/photo/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            onUpdate();
        } catch (error) {
            console.error('Failed to upload family photo', error);
        } finally {
            setUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const handleDeletePhoto = async (photoId: number) => {
        try {
            setDeletingPhotoId(photoId);
            await api.delete(`/family/photo/delete/${photoId}`);
            onUpdate();
        } catch (error) {
            console.error('Failed to delete family photo', error);
        } finally {
            setDeletingPhotoId(null);
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-4">
            <div className="lg:col-span-2 space-y-6">
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-bold text-slate-900">{t('family.aboutFamily')}</h3>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="flex items-center gap-2 px-4 py-1.5 bg-primary text-white rounded-lg text-xs font-bold hover:bg-primary-hover disabled:opacity-50"
                        >
                            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                            {t('family.saveChanges')}
                        </button>
                    </div>
                    <textarea
                        className="w-full h-32 p-4 border border-slate-200 rounded-xl text-sm focus:border-primary focus:ring-1 focus:ring-primary/20 resize-none"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                    ></textarea>
                    <div className="flex justify-end mt-2">
                        <span className="text-xs text-slate-400">{t('family.visibleToAccepted')}</span>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-900 mb-4">{t('family.familyValues')}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-700 uppercase">{t('family.traditionLevel')}</label>
                            <select
                                className="w-full p-2.5 border border-slate-200 rounded-lg text-sm bg-white"
                                value={tradition}
                                onChange={(e) => setTradition(e.target.value)}
                            >
                                <option>{t('family.modernTraditional')}</option>
                                <option>{t('family.liberal')}</option>
                                <option>{t('family.conservative')}</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-700 uppercase">{t('family.affluenceStatus')}</label>
                            <select
                                className="w-full p-2.5 border border-slate-200 rounded-lg text-sm bg-white"
                                value={affluence}
                                onChange={(e) => setAffluence(e.target.value)}
                            >
                                <option>{t('family.upperMiddleClass')}</option>
                                <option>{t('family.highNetWorth')}</option>
                                <option>{t('family.middleClass')}</option>
                            </select>
                        </div>
                    </div>
                    <div className="mt-4">
                        <label className="text-xs font-bold text-slate-700 uppercase mb-2 block">{t('family.commonInterests')}</label>
                        <div className="flex flex-wrap gap-2 mb-3">
                            {interests.map(t => (
                                <span key={t} className="inline-flex items-center gap-1 px-3 py-1 bg-slate-100 rounded-full text-xs font-medium text-slate-600 border border-slate-200 group">
                                    {t}
                                    <button
                                        type="button"
                                        onClick={() => removeInterest(t)}
                                        className="text-slate-400 hover:text-red-500 transition-colors"
                                    >
                                        <X size={12} />
                                    </button>
                                </span>
                            ))}
                        </div>
                        <div className="flex items-center gap-2">
                            <input
                                type="text"
                                value={interestInput}
                                onChange={(e) => setInterestInput(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        addInterest();
                                    }
                                }}
                                placeholder={t('family.typeInterest')}
                                className="flex-1 px-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:border-primary focus:ring-1 focus:ring-primary/20 focus:outline-none"
                            />
                            <button
                                type="button"
                                onClick={addInterest}
                                disabled={!interestInput.trim()}
                                className="px-3 py-1.5 border border-dashed border-slate-300 rounded-lg text-xs text-slate-500 hover:text-primary hover:border-primary transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
                            >
                                <Plus size={12} /> Add
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="space-y-6">
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-900 mb-4">{t('family.familyPhotos')}</h3>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handlePhotoUpload}
                    />
                    <div className="grid grid-cols-2 gap-2">
                        <button
                            type="button"
                            onClick={handleUploadClick}
                            disabled={uploading}
                            className="aspect-square bg-slate-100 rounded-lg flex items-center justify-center text-slate-400 cursor-pointer hover:bg-slate-200 transition-colors disabled:opacity-60"
                        >
                            {uploading ? <Loader2 size={22} className="animate-spin" /> : <Plus size={24} />}
                        </button>
                        {profile.photos.map(photo => (
                            <div key={photo.id} className="aspect-square bg-slate-200 rounded-lg overflow-hidden relative group">
                                <img src={photo.url} className="w-full h-full object-cover" />
                                <button
                                    type="button"
                                    onClick={() => handleDeletePhoto(photo.id)}
                                    disabled={deletingPhotoId === photo.id}
                                    className="absolute top-1 right-1 p-1 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-70"
                                >
                                    {deletingPhotoId === photo.id ? <Loader2 size={14} className="animate-spin" /> : <XCircle size={14} />}
                                </button>
                            </div>
                        ))}
                    </div>
                    <p className="text-xs text-slate-500 mt-3">{t('family.familyPhotosDesc')}</p>
                </div>
            </div>
        </div>
    );
};

const GuardiansSection: React.FC<{ guardians: Guardian[]; onRefresh: () => void }> = ({ guardians, onRefresh }) => {
    const { t } = useTranslation();
    const [showInvite, setShowInvite] = useState(false);
    const [saving, setSaving] = useState(false);
    const [activeGuardianId, setActiveGuardianId] = useState<number | null>(null);
    const [editingGuardian, setEditingGuardian] = useState<Guardian | null>(null);
    const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
    const [form, setForm] = useState({
        name: '',
        relationship: '',
        email: '',
        phone: '',
        is_primary_contact: false,
    });
    const [editForm, setEditForm] = useState({
        name: '',
        relationship: '',
        email: '',
        phone: '',
    });

    const showToast = (type: 'success' | 'error', message: string) => {
        setToast({ type, message });
        setTimeout(() => setToast(null), 4000);
    };

    const handleInvite = async () => {
        if (!form.name.trim() || !form.relationship.trim()) return;

        try {
            setSaving(true);
            await api.post('/family/guardian/add', {
                name: form.name.trim(),
                relationship: form.relationship.trim(),
                email: form.email.trim() || null,
                phone: form.phone.trim() || null,
                is_primary_contact: form.is_primary_contact,
            });
            setForm({ name: '', relationship: '', email: '', phone: '', is_primary_contact: false });
            setShowInvite(false);
            showToast('success', form.email.trim()
                ? `Guardian added! Invitation email sent to ${form.email.trim()}`
                : 'Guardian added successfully!');
            onRefresh();
        } catch (error: any) {
            console.error('Failed to invite guardian', error);
            showToast('error', error?.response?.data?.message || 'Failed to add guardian. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const startEdit = (guardian: Guardian) => {
        setEditingGuardian(guardian);
        setEditForm({
            name: guardian.name,
            relationship: guardian.role,
            email: guardian.email || '',
            phone: guardian.phone || '',
        });
    };

    const handleSaveEdit = async () => {
        if (!editingGuardian || !editForm.name.trim() || !editForm.relationship.trim()) return;

        try {
            setActiveGuardianId(editingGuardian.id);
            await api.post(`/family/guardian/update/${editingGuardian.id}`, {
                name: editForm.name.trim(),
                relationship: editForm.relationship.trim(),
                email: editForm.email.trim() || null,
                phone: editForm.phone.trim() || null,
            });
            setEditingGuardian(null);
            showToast('success', 'Guardian updated successfully!');
            onRefresh();
        } catch (error: any) {
            console.error('Failed to update guardian', error);
            showToast('error', error?.response?.data?.message || 'Failed to update guardian.');
        } finally {
            setActiveGuardianId(null);
        }
    };

    const handleRemove = async (guardian: Guardian) => {
        if (!window.confirm(`Are you sure you want to remove ${guardian.name} from the family portal?`)) return;
        try {
            setActiveGuardianId(guardian.id);
            await api.delete(`/family/guardian/delete/${guardian.id}`);
            showToast('success', `${guardian.name} has been removed.`);
            onRefresh();
        } catch (error: any) {
            console.error('Failed to remove guardian', error);
            showToast('error', error?.response?.data?.message || 'Failed to remove guardian.');
        } finally {
            setActiveGuardianId(null);
        }
    };

    return (
        <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4">
            {/* Toast notification */}
            {toast && (
                <div className={`fixed top-6 right-6 z-50 flex items-center gap-2 px-5 py-3 rounded-xl shadow-lg text-sm font-medium animate-in slide-in-from-right-5 ${toast.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
                    }`}>
                    {toast.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                    {toast.message}
                    <button onClick={() => setToast(null)} className="ml-2 opacity-70 hover:opacity-100"><X size={14} /></button>
                </div>
            )}

            <div className="flex justify-between items-center mb-6">
                <div>
                    <h3 className="text-lg font-bold text-slate-900">{t('family.guardiansPermissions')}</h3>
                    <p className="text-sm text-slate-500">{t('family.guardianControlDesc')}</p>
                </div>
                <button
                    onClick={() => { setShowInvite(!showInvite); setEditingGuardian(null); }}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-bold hover:bg-slate-800 transition-colors"
                >
                    {showInvite ? <X size={16} /> : <UserPlus size={16} />}
                    {showInvite ? t('family.close') : t('family.addGuardian')}
                </button>
            </div>

            {showInvite && (
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm mb-6 animate-in fade-in slide-in-from-top-2">
                    <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <UserPlus size={16} className="text-primary" /> {t('family.addFamilyGuardian')}
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-bold text-slate-600 uppercase mb-1 block">{t('family.fullName')}</label>
                            <input
                                className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:border-primary focus:ring-1 focus:ring-primary/20 focus:outline-none"
                                placeholder="e.g. Ahmed Khan"
                                value={form.name}
                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-600 uppercase mb-1 block">{t('family.relationship')}</label>
                            <select
                                className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm bg-white focus:border-primary focus:ring-1 focus:ring-primary/20 focus:outline-none"
                                value={form.relationship}
                                onChange={(e) => setForm({ ...form, relationship: e.target.value })}
                            >
                                <option value="">{t('family.selectRelationship')}</option>
                                <option>{t('family.father')}</option>
                                <option>{t('family.mother')}</option>
                                <option>{t('family.brother')}</option>
                                <option>{t('family.sister')}</option>
                                <option>{t('family.uncle')}</option>
                                <option>{t('family.aunt')}</option>
                                <option>{t('family.grandfather')}</option>
                                <option>{t('family.grandmother')}</option>
                                <option>{t('family.guardian')}</option>
                                <option>{t('family.other')}</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-600 uppercase mb-1 block">{t('family.emailLabel')}</label>
                            <input
                                className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:border-primary focus:ring-1 focus:ring-primary/20 focus:outline-none"
                                placeholder={t('family.optionalPlaceholder')}
                                type="email"
                                value={form.email}
                                onChange={(e) => setForm({ ...form, email: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-600 uppercase mb-1 block">{t('family.phoneLabel')}</label>
                            <input
                                className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:border-primary focus:ring-1 focus:ring-primary/20 focus:outline-none"
                                placeholder={t('family.optionalPlaceholder')}
                                type="tel"
                                value={form.phone}
                                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                            />
                        </div>
                    </div>
                    <label className="flex items-center gap-2 text-xs font-medium text-slate-600 mt-4 cursor-pointer">
                        <input
                            type="checkbox"
                            className="accent-primary w-4 h-4"
                            checked={form.is_primary_contact}
                            onChange={(e) => setForm({ ...form, is_primary_contact: e.target.checked })}
                        />
                        {t('family.setPrimaryContact')}
                    </label>
                    <div className="flex gap-3 mt-5">
                        <button
                            onClick={handleInvite}
                            disabled={saving || !form.name.trim() || !form.relationship.trim()}
                            className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-lg text-sm font-bold hover:bg-primary-hover disabled:opacity-50 transition-colors"
                        >
                            {saving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                            {saving ? t('family.adding') : t('family.addGuardian')}
                        </button>
                        <button
                            onClick={() => { setShowInvite(false); setForm({ name: '', relationship: '', email: '', phone: '', is_primary_contact: false }); }}
                            className="px-5 py-2.5 text-slate-500 rounded-lg text-sm font-bold hover:text-slate-700 hover:bg-slate-50 transition-colors"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {guardians.length === 0 && !showInvite && (
                <div className="bg-white p-12 rounded-xl border border-slate-200 shadow-sm text-center">
                    <Users size={40} className="text-slate-300 mx-auto mb-4" />
                    <h4 className="text-lg font-bold text-slate-700 mb-2">{t('family.noGuardians')}</h4>
                    <p className="text-sm text-slate-500 mb-4">{t('family.noGuardiansDesc')}</p>
                    <button
                        onClick={() => setShowInvite(true)}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-lg text-sm font-bold hover:bg-primary-hover transition-colors"
                    >
                        <UserPlus size={16} /> {t('family.addFirstGuardian')}
                    </button>
                </div>
            )}

            <div className="space-y-4">
                {guardians.map(g => (
                    <div key={g.id}>
                        {editingGuardian?.id === g.id ? (
                            /* Inline Edit Form */
                            <div className="bg-white p-5 rounded-xl border-2 border-primary/30 shadow-sm animate-in fade-in">
                                <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                                    <Edit2 size={14} className="text-primary" /> {t('family.editing', { name: g.name })}
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-bold text-slate-600 uppercase mb-1 block">{t('family.name')}</label>
                                        <input
                                            className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:border-primary focus:ring-1 focus:ring-primary/20 focus:outline-none"
                                            value={editForm.name}
                                            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-600 uppercase mb-1 block">{t('family.relationship')}</label>
                                        <select
                                            className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm bg-white focus:border-primary focus:ring-1 focus:ring-primary/20 focus:outline-none"
                                            value={editForm.relationship}
                                            onChange={(e) => setEditForm({ ...editForm, relationship: e.target.value })}
                                        >
                                            <option value="">{t('family.selectRelationship')}</option>
                                            <option>{t('family.father')}</option>
                                            <option>{t('family.mother')}</option>
                                            <option>{t('family.brother')}</option>
                                            <option>{t('family.sister')}</option>
                                            <option>{t('family.uncle')}</option>
                                            <option>{t('family.aunt')}</option>
                                            <option>{t('family.grandfather')}</option>
                                            <option>{t('family.grandmother')}</option>
                                            <option>{t('family.guardian')}</option>
                                            <option>{t('family.other')}</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-600 uppercase mb-1 block">{t('family.emailLabel')}</label>
                                        <input
                                            className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:border-primary focus:ring-1 focus:ring-primary/20 focus:outline-none"
                                            type="email"
                                            value={editForm.email}
                                            onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-600 uppercase mb-1 block">{t('family.phoneLabel')}</label>
                                        <input
                                            className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:border-primary focus:ring-1 focus:ring-primary/20 focus:outline-none"
                                            type="tel"
                                            value={editForm.phone}
                                            onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="flex gap-3 mt-4">
                                    <button
                                        onClick={handleSaveEdit}
                                        disabled={activeGuardianId === g.id || !editForm.name.trim() || !editForm.relationship.trim()}
                                        className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-xs font-bold hover:bg-primary-hover disabled:opacity-50 transition-colors"
                                    >
                                        {activeGuardianId === g.id ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                                        {activeGuardianId === g.id ? t('family.saving') : t('family.saveChanges')}
                                    </button>
                                    <button
                                        onClick={() => setEditingGuardian(null)}
                                        className="px-4 py-2 text-slate-500 rounded-lg text-xs font-bold hover:text-slate-700 hover:bg-slate-50 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        ) : (
                            /* Display Card */
                            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-6 hover:border-slate-300 transition-colors">
                                <div className="flex items-start gap-4 flex-1">
                                    <div className="size-12 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-slate-600 font-bold text-lg shrink-0">
                                        {g.name?.[0]?.toUpperCase() ?? '?'}
                                    </div>
                                    <div className="min-w-0">
                                        <h4 className="font-bold text-slate-900 flex items-center gap-2 flex-wrap">
                                            {g.name}
                                            {g.isOwner && <span className="bg-primary/10 text-primary text-[10px] px-2 py-0.5 rounded-full uppercase font-bold">{t('family.you')}</span>}
                                            {g.isPrimaryContact && <span className="bg-amber-100 text-amber-700 text-[10px] px-2 py-0.5 rounded-full uppercase font-bold">{t('family.primary')}</span>}
                                        </h4>
                                        <p className="text-sm text-slate-600 mt-0.5">{g.role}</p>
                                        {g.email && (
                                            <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                                                <Mail size={10} /> {g.email}
                                            </p>
                                        )}
                                        {g.phone && (
                                            <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                                                <Phone size={10} /> {g.phone}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 shrink-0 border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6">
                                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${g.status === 'Verified' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                                        }`}>
                                        {g.status === 'Verified' ? '✓ ' : '◷ '}{g.status}
                                    </span>
                                    {g.isOwner ? (
                                        <span className="px-2.5 py-1 bg-slate-100 rounded-full text-xs text-slate-600 font-medium">{t('family.fullAccess')}</span>
                                    ) : (
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => startEdit(g)}
                                                disabled={activeGuardianId === g.id}
                                                className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-primary bg-primary/5 hover:bg-primary/10 rounded-lg transition-colors disabled:opacity-50"
                                            >
                                                <Edit2 size={12} /> {t('family.edit')}
                                            </button>
                                            <button
                                                onClick={() => handleRemove(g)}
                                                disabled={activeGuardianId === g.id}
                                                className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-50"
                                            >
                                                {activeGuardianId === g.id ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                                                {t('family.remove')}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <div className="mt-8 bg-blue-50 border border-blue-100 rounded-xl p-6">
                <h4 className="font-bold text-blue-900 mb-2 flex items-center gap-2">
                    <ShieldCheck size={18} /> Verification Status
                </h4>
                <p className="text-sm text-blue-800 mb-4">
                    Verified guardians increase profile trust score by 40%. We verify via LinkedIn or Government ID (CNIC).
                </p>
            </div>
        </div>
    );
};

const ApprovalsSection: React.FC<{ approvals: Approval[]; onRefresh: () => void }> = ({ approvals, onRefresh }) => {
    const { t } = useTranslation();
    const [processingId, setProcessingId] = useState<number | null>(null);

    const handleApprove = async (id: number) => {
        try {
            setProcessingId(id);
            await api.post(`/family/approval/approve/${id}`);
            onRefresh();
        } catch (error) {
            console.error('Failed to approve match', error);
        } finally {
            setProcessingId(null);
        }
    };

    const handleReject = async (id: number) => {
        try {
            setProcessingId(id);
            await api.post(`/family/approval/reject/${id}`);
            onRefresh();
        } catch (error) {
            console.error('Failed to reject match', error);
        } finally {
            setProcessingId(null);
        }
    };

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h3 className="text-lg font-bold text-slate-900">{t('family.matchApprovalWorkflow')}</h3>
                    <p className="text-sm text-slate-500">{t('family.matchApprovalDesc')}</p>
                </div>
            </div>

            <div className="space-y-4">
                {approvals.length === 0 ? (
                    <div className="bg-white p-12 rounded-xl border border-slate-200 text-center">
                        <Heart className="mx-auto mb-4 text-slate-200" size={48} />
                        <p className="text-slate-500 font-medium">{t('family.noPendingApprovals')}</p>
                    </div>
                ) : approvals.map(a => (
                    <ApprovalCard
                        key={a.id}
                        name={a.name}
                        desc={a.desc}
                        status={a.status}
                        img={a.img}
                        time={a.time}
                        approved={a.approved}
                        busy={processingId === a.id}
                        onApprove={() => handleApprove(a.id)}
                        onReject={() => handleReject(a.id)}
                        t={t}
                    />
                ))}
            </div>
        </div>
    );
};

const ApprovalCard: React.FC<{
    name: string;
    desc: string;
    status: string;
    img: string;
    time: string;
    approved?: boolean;
    busy?: boolean;
    onApprove?: () => void;
    onReject?: () => void;
    t: any;
}> = ({ name, desc, status, img, time, approved, busy, onApprove, onReject, t }) => (
    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between group hover:border-primary/30 transition-all">
        <div className="flex items-center gap-4">
            <img src={img} className="size-12 rounded-full object-cover" />
            <div>
                <h4 className="font-bold text-slate-900">{name}</h4>
                <p className="text-xs text-slate-500">{desc}</p>
                <div className="flex items-center gap-2 mt-1">
                    <span className={`size-2 rounded-full ${approved ? 'bg-green-500' : 'bg-orange-500'}`}></span>
                    <span className="text-xs font-medium text-slate-600">{status}</span>
                </div>
            </div>
        </div>
        <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400 mr-2">{time}</span>
            <button
                onClick={onReject}
                disabled={busy || approved}
                className="p-2 rounded-full bg-slate-50 text-slate-400 hover:bg-slate-200 hover:text-red-600 transition-colors disabled:opacity-60"
            >
                {busy ? <Loader2 size={18} className="animate-spin" /> : <XCircle size={20} />}
            </button>
            <button
                onClick={onApprove}
                disabled={busy || approved}
                className="px-4 py-2 rounded-lg bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors disabled:opacity-60"
            >
                {busy ? <Loader2 size={16} className="animate-spin" /> : approved ? t('family.proceedToChat') : t('family.approve')}
            </button>
        </div>
    </div>
);

const BiodataSection: React.FC<{ onShowQr: () => void }> = ({ onShowQr }) => {
    const { t } = useTranslation();
    const [downloading, setDownloading] = useState(false);

    const handleDownload = async () => {
        try {
            setDownloading(true);
            const response = await api.get('/profile/biodata-json');

            if (response.data.result) {
                const userData = response.data.data;
                const fileName = `Biodata-${userData.first_name || 'User'}.pdf`;

                const container = document.createElement('div');
                // Off-screen but fully rendered (no display:none)
                container.style.position = 'fixed';
                container.style.top = '-10000px';
                container.style.left = '-10000px';
                container.style.width = '800px';
                container.style.height = '1120px';
                container.style.overflow = 'hidden';
                document.body.appendChild(container);

                const root = createRoot(container);
                root.render(<BiodataPDFTemplate userData={userData} />);

                // Wait for React mount + images to load + reflow
                setTimeout(async () => {
                    try {
                        const element = container.querySelector('#biodata-pdf-content') as HTMLElement;
                        if (element) {
                            // Force a reflow to ensure all inline styles are computed
                            element.getBoundingClientRect();

                            const opt: any = {
                                margin: [0, 0, 0, 0],
                                filename: fileName,
                                image: { type: 'jpeg', quality: 0.98 },
                                html2canvas: {
                                    scale: 2,
                                    useCORS: true,
                                    logging: false,
                                    scrollX: 0,
                                    scrollY: 0,
                                    width: 800,
                                    height: 1120,
                                    windowWidth: 800,
                                    windowHeight: 1120,
                                },
                                jsPDF: { unit: 'px', format: [800, 1120], orientation: 'portrait', hotfixes: ["px_scaling"] }
                            };

                            await (html2pdf() as any).from(element).set(opt).save();
                        }
                    } catch (pdfErr) {
                        console.error('PDF generation error:', pdfErr);
                        alert('Failed to generate PDF document.');
                    } finally {
                        root.unmount();
                        container.remove();
                        setDownloading(false);
                    }
                }, 1200); // 1.2s for cross-origin image load + full style computation
            } else {
                throw new Error('Failed to retrieve biodata');
            }
        } catch (error) {
            console.error('Failed to download biodata', error);
            alert(t('family.biodataDownloadFailed') || 'Failed to download biodata. Please try again.');
            setDownloading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4">
            <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-2xl mb-4">
                    <FileText size={28} className="text-primary" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">{t('family.biodataBuilder')}</h3>
                <p className="text-sm text-slate-500 max-w-md mx-auto">{t('family.biodataBuilderDesc')}</p>
            </div>

            {/* Preview Card */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 mb-6">
                <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                    {/* Mini Preview Header */}
                    <div className="bg-slate-900 px-5 py-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-slate-700 border-2 border-primary"></div>
                            <div>
                                <div className="h-2.5 w-32 bg-white rounded mb-1.5"></div>
                                <div className="h-1.5 w-20 bg-slate-400 rounded"></div>
                            </div>
                        </div>
                    </div>
                    {/* Mini Preview Body */}
                    <div className="px-5 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <div className="h-1.5 w-16 bg-primary/30 rounded mb-2"></div>
                                <div className="space-y-1.5">
                                    <div className="h-1.5 w-full bg-slate-100 rounded"></div>
                                    <div className="h-1.5 w-full bg-slate-100 rounded"></div>
                                    <div className="h-1.5 w-3/4 bg-slate-100 rounded"></div>
                                </div>
                            </div>
                            <div>
                                <div className="h-1.5 w-16 bg-primary/30 rounded mb-2"></div>
                                <div className="space-y-1.5">
                                    <div className="h-1.5 w-full bg-slate-100 rounded"></div>
                                    <div className="h-1.5 w-full bg-slate-100 rounded"></div>
                                    <div className="h-1.5 w-2/3 bg-slate-100 rounded"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <p className="text-xs text-slate-400 text-center mt-3">{t('family.biodataPreviewHint') || 'Professional biodata with your profile details'}</p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
                <button
                    onClick={handleDownload}
                    disabled={downloading}
                    className="flex-1 py-3.5 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800 flex items-center justify-center gap-2 disabled:opacity-60 transition-all"
                >
                    {downloading ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />} {t('family.downloadPDF')}
                </button>
                <button
                    onClick={onShowQr}
                    className="flex-1 py-3.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold text-sm hover:bg-slate-50 flex items-center justify-center gap-2 transition-all"
                >
                    <QrCode size={18} /> {t('family.shareLink')}
                </button>
            </div>
        </div>
    );
};

const TabButton: React.FC<{ label: string, active: boolean, onClick: () => void, badge?: string }> = ({ label, active, onClick, badge }) => (
    <button
        onClick={onClick}
        className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap ${active ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
    >
        {label}
        {badge && <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{badge}</span>}
    </button>
);

export default FamilyPortalView;
