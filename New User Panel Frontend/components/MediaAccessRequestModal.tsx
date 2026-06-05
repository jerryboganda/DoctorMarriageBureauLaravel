import React from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
    AlertCircle,
    Camera,
    CheckCircle2,
    Image as ImageIcon,
    Loader2,
    Lock,
    X,
    Clock,
} from 'lucide-react';
import { ProfileMatch } from '../types';
import { BTN_TAP } from '../utils/motion';
import { MediaAccessBundle, MediaAccessSnapshot } from '../utils/mediaAccess';

interface MediaAccessRequestModalProps {
    profile: ProfileMatch;
    mediaAccess: MediaAccessBundle;
    onClose: () => void;
    onRequestProfilePhoto: () => void;
    onRequestGalleryImages: () => void;
    requestingProfilePhoto?: boolean;
    requestingGalleryImages?: boolean;
    priorityKind?: 'photo' | 'gallery';
}

const statusTone = (snapshot: MediaAccessSnapshot) => {
    if (snapshot.state === 'approved' || snapshot.accessible) {
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }
    if (snapshot.state === 'pending') {
        return 'bg-amber-50 text-amber-700 border-amber-200';
    }
    if (!snapshot.exists) {
        return 'bg-slate-50 text-slate-500 border-slate-200';
    }
    return 'bg-primary/5 text-primary border-primary/15';
};

const resolveActionLabel = (
    snapshot: MediaAccessSnapshot,
    t: ReturnType<typeof useTranslation>['t'],
    kind: 'photo' | 'gallery',
) => {
    if (!snapshot.exists) return t('discovery.notAvailable');
    if (snapshot.accessible) return t('discovery.alreadyAccessible');
    if (snapshot.state === 'approved')
        return kind === 'photo'
            ? t('discovery.photoAccessGranted')
            : t('discovery.galleryAccessGranted');
    if (snapshot.state === 'pending')
        return kind === 'photo'
            ? t('discovery.photoAccessRequested')
            : t('discovery.galleryAccessRequested');
    if (!snapshot.required) return t('discovery.noRequestNeeded');
    return kind === 'photo'
        ? t('discovery.requestPhotoAccess')
        : t('discovery.requestGalleryAccess');
};

const MediaAccessCard: React.FC<{
    title: string;
    description: string;
    icon: React.ReactNode;
    snapshot: MediaAccessSnapshot;
    actionLabel: string;
    onAction: () => void;
    loading?: boolean;
    featured?: boolean;
}> = ({ title, description, icon, snapshot, actionLabel, onAction, loading, featured }) => {
    const actionable =
        snapshot.exists && snapshot.required && snapshot.state === 'none' && !snapshot.accessible;
    const disabledLabel = !snapshot.exists
        ? 'Not available'
        : snapshot.accessible
          ? 'Already accessible'
          : snapshot.state === 'pending'
            ? 'Requested'
            : snapshot.state === 'approved'
              ? 'Granted'
              : 'No request needed';

    return (
        <div
            className={`rounded-2xl border p-4 shadow-sm ${featured ? 'border-primary/25 bg-primary/5 ring-1 ring-primary/10' : 'border-slate-200 bg-slate-50/80'}`}
        >
            <div className="flex items-start gap-3">
                <div className="size-11 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-primary shadow-sm shrink-0">
                    {icon}
                </div>
                <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                        <h4 className="text-sm font-bold text-slate-900">{title}</h4>
                        <span
                            className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${statusTone(snapshot)}`}
                        >
                            {snapshot.accessible || snapshot.state === 'approved'
                                ? 'Accessible'
                                : snapshot.state === 'pending'
                                  ? 'Pending'
                                  : !snapshot.required
                                    ? 'Optional'
                                    : 'Locked'}
                        </span>
                    </div>
                    <p className="mt-1 text-[12px] leading-5 text-slate-500">{description}</p>
                </div>
            </div>

            <div className="mt-3 rounded-xl bg-white border border-slate-200 p-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                    State
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-900">{snapshot.text}</p>
                <p className="mt-1 text-xs text-slate-500">
                    {snapshot.accessible
                        ? 'You can already view this media.'
                        : !snapshot.exists
                          ? 'Nothing has been uploaded yet.'
                          : snapshot.state === 'pending'
                            ? 'Your request is waiting for approval.'
                            : snapshot.state === 'approved'
                              ? 'Access has been granted.'
                              : snapshot.required
                                ? 'A request is required to unlock this media.'
                                : 'No request is needed for this profile.'}
                </p>

                <motion.button
                    whileTap={BTN_TAP}
                    onClick={onAction}
                    disabled={!actionable || loading}
                    className={`mt-3 w-full rounded-xl px-4 py-2.5 text-sm font-bold transition-colors flex items-center justify-center gap-2 ${
                        actionable
                            ? 'bg-primary text-white hover:bg-primary-hover shadow-sm'
                            : 'bg-slate-100 text-slate-500 cursor-not-allowed'
                    }`}
                >
                    {loading ? (
                        <Loader2 size={16} className="animate-spin" />
                    ) : snapshot.state === 'pending' ? (
                        <Clock size={16} />
                    ) : snapshot.accessible ? (
                        <CheckCircle2 size={16} />
                    ) : snapshot.exists ? (
                        <Lock size={16} />
                    ) : (
                        <AlertCircle size={16} />
                    )}
                    {loading ? 'Processing...' : actionable ? actionLabel : disabledLabel}
                </motion.button>
            </div>
        </div>
    );
};

const MediaAccessRequestModal: React.FC<MediaAccessRequestModalProps> = ({
    profile,
    mediaAccess,
    onClose,
    onRequestProfilePhoto,
    onRequestGalleryImages,
    requestingProfilePhoto,
    requestingGalleryImages,
    priorityKind = 'photo',
}) => {
    const { t } = useTranslation();
    const cardOrder =
        priorityKind === 'gallery'
            ? (['gallery', 'photo'] as const)
            : (['photo', 'gallery'] as const);
    const cardConfig = {
        photo: {
            title: t('discovery.profilePhotoAccess'),
            description: t('discovery.profilePhotoAccessDesc'),
            icon: <Camera size={18} />,
            snapshot: mediaAccess.profilePhoto,
            actionLabel: resolveActionLabel(mediaAccess.profilePhoto, t, 'photo'),
            onAction: onRequestProfilePhoto,
            loading: requestingProfilePhoto,
        },
        gallery: {
            title: t('discovery.galleryImagesAccess'),
            description: t('discovery.galleryImagesAccessDesc'),
            icon: <ImageIcon size={18} />,
            snapshot: mediaAccess.galleryImage,
            actionLabel: resolveActionLabel(mediaAccess.galleryImage, t, 'gallery'),
            onAction: onRequestGalleryImages,
            loading: requestingGalleryImages,
        },
    } as const;

    return (
        <div
            className="fixed inset-0 z-[60] bg-slate-950/70 backdrop-blur-sm flex items-end md:items-center justify-center p-0 md:p-4"
            onMouseDown={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
        >
            <div
                className="w-full md:max-w-2xl bg-white rounded-t-3xl md:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
                onMouseDown={(e) => e.stopPropagation()}
            >
                <div className="px-4 md:px-5 pt-4 pb-3 border-b border-slate-100 flex items-start gap-3">
                    <div className="size-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                        <Camera size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="text-base md:text-lg font-black text-slate-900">
                            {t('discovery.mediaAccessTitle')}
                        </h3>
                        <p className="text-xs md:text-sm text-slate-500 mt-1">
                            {t('discovery.mediaAccessSubtitle', {
                                name: profile.name,
                                defaultValue: `Request access for ${profile.name}`,
                            })}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="size-9 rounded-full bg-slate-100 text-slate-500 hover:text-slate-700 hover:bg-slate-200 flex items-center justify-center shrink-0"
                    >
                        <X size={18} />
                    </button>
                </div>

                <div className="p-4 md:p-5 overflow-y-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {cardOrder.map((kind) => (
                            <div
                                key={kind}
                                className={kind === priorityKind ? 'md:order-first' : ''}
                            >
                                <MediaAccessCard
                                    title={cardConfig[kind].title}
                                    description={cardConfig[kind].description}
                                    icon={cardConfig[kind].icon}
                                    snapshot={cardConfig[kind].snapshot}
                                    actionLabel={cardConfig[kind].actionLabel}
                                    onAction={cardConfig[kind].onAction}
                                    loading={cardConfig[kind].loading}
                                    featured={kind === priorityKind}
                                />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MediaAccessRequestModal;
