import React, { useEffect } from 'react';
import { Bell, Clock3, ExternalLink, Info, Loader2, User, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export interface NotificationDetailItem {
  notification_id: string;
  title: string;
  message: string;
  full_message: string;
  time: string;
  read_at: string;
  photo: string;
  type: string;
  route?: string | null;
  sender_name?: string | null;
  type_label?: string;
}

interface NotificationDetailModalProps {
  notification: NotificationDetailItem | null;
  isLoading?: boolean;
  showOpenAction?: boolean;
  onClose: () => void;
  onOpenRelated?: () => void;
}

const NotificationDetailModal: React.FC<NotificationDetailModalProps> = ({
  notification,
  isLoading = false,
  showOpenAction = false,
  onClose,
  onOpenRelated,
}) => {
  const { t } = useTranslation();

  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [onClose]);

  if (!notification) {
    return null;
  }

  const statusLabel = notification.read_at === 'New'
    ? t('notifications.status.unread')
    : t('notifications.status.read');

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto overscroll-contain bg-slate-950/55 px-3 py-3 backdrop-blur-sm md:px-4 md:py-4"
      onClick={onClose}
      style={{ WebkitOverflowScrolling: 'touch' }}
    >
      <div className="flex min-h-full items-start justify-center md:items-center">
      <div
        className="flex max-h-[calc(100dvh-1.5rem)] w-full max-w-2xl flex-col overflow-hidden rounded-[28px] bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-5 md:px-8">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary/80">
              {t('notifications.detailHeading')}
            </p>
            <h2 className="mt-2 text-xl font-bold text-slate-900 md:text-2xl">
              {notification.title || t('notifications.fallbackTitle')}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex size-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-slate-200 hover:text-slate-700"
            aria-label={t('common.close')}
          >
            <X size={18} />
          </button>
        </div>

        <div
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 py-6 md:px-8"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          <div className="rounded-3xl border border-primary/15 bg-gradient-to-br from-primary/5 via-white to-rose-50 p-5 md:p-6">
            <div className="flex items-start gap-4">
              <img
                src={notification.photo}
                alt={notification.title || t('notifications.fallbackTitle')}
                className="size-14 shrink-0 rounded-2xl object-cover ring-4 ring-white"
              />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600 shadow-sm">
                    <Bell size={13} className="text-primary" />
                    {notification.type_label || notification.type.replace(/_/g, ' ')}
                  </span>
                  <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${notification.read_at === 'New' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                    {statusLabel}
                  </span>
                </div>

                <div className="mt-4 grid gap-3 text-sm text-slate-600 md:grid-cols-2">
                  <div className="flex items-center gap-2 rounded-2xl bg-white/80 px-4 py-3 shadow-sm">
                    <Clock3 size={16} className="text-primary" />
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                        {t('notifications.receivedLabel')}
                      </p>
                      <p className="font-medium text-slate-700">{notification.time}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 rounded-2xl bg-white/80 px-4 py-3 shadow-sm">
                    <User size={16} className="text-primary" />
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                        {t('notifications.senderLabel')}
                      </p>
                      <p className="font-medium text-slate-700">
                        {notification.sender_name || t('notifications.systemSender')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 px-5 py-5 md:px-6">
            <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-700">
              <Info size={16} className="text-primary" />
              {t('notifications.fullDetailsLabel')}
            </div>

            {isLoading ? (
              <div className="flex items-center gap-3 rounded-2xl bg-white px-4 py-4 text-sm text-slate-500">
                <Loader2 size={18} className="animate-spin text-primary" />
                {t('notifications.loadingDetails')}
              </div>
            ) : (
              <div className="whitespace-pre-line rounded-2xl bg-white px-4 py-4 text-sm leading-7 text-slate-700 shadow-sm">
                {notification.full_message || notification.message || t('notifications.noDetails')}
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-slate-100 px-6 py-5 md:flex-row md:justify-end md:px-8">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            {t('common.close')}
          </button>
          {showOpenAction && onOpenRelated ? (
            <button
              type="button"
              onClick={onOpenRelated}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-white transition hover:bg-primary/90"
            >
              {t('notifications.openRelatedPage')}
              <ExternalLink size={16} />
            </button>
          ) : null}
        </div>
      </div>
      </div>
    </div>
  );
};

export default NotificationDetailModal;
