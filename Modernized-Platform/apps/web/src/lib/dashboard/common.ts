// Shared client-side helpers for dashboard pages.
// All dashboard pages are static Astro shells hydrated via these utilities.
import { api, resolveAssetUrl, DEFAULT_AVATAR_URL, DEFAULT_FEMALE_AVATAR_URL } from '../api/client';
import { isPlaceholderPhoto, normalizeGender } from '../gender';
import { toast } from '../toast';

export { api, resolveAssetUrl, DEFAULT_AVATAR_URL, DEFAULT_FEMALE_AVATAR_URL, toast };
export { isFemaleGender, isMaleGender, isPlaceholderPhoto, normalizeGender } from '../gender';

export interface MeUser {
  id: number;
  type: string;
  name: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  membership: number;
  photo_approved: boolean;
  blocked: boolean;
  deactivated: boolean;
  approved: boolean;
  must_change_password: boolean;
  birthday?: string | null;
  gender?: string;
  avatar?: string;
  referral_code?: string;
}

/** Redirects to /login/ when no token is stored. Returns token or null. */
export function requireAuth(): string | null {
  const token = localStorage.getItem('auth_token');
  if (!token) {
    sessionStorage.setItem('auth_error', 'Please sign in to access your portal.');
    window.location.href = '/login/';
    return null;
  }
  return token;
}

let mePromise: Promise<MeUser | null> | null = null;

/** Fetches /auth/me once per page load (cached promise + sessionStorage snapshot). */
export function getMe(): Promise<MeUser | null> {
  if (!mePromise) {
    mePromise = api
      .get('/auth/me')
      .then((res) => {
        const user = (res.data?.data ?? null) as MeUser | null;
        if (user) sessionStorage.setItem('dmb_me', JSON.stringify(user));
        return user;
      })
      .catch(() => {
        const cached = sessionStorage.getItem('dmb_me');
        return cached ? (JSON.parse(cached) as MeUser) : null;
      });
  }
  return mePromise;
}

export function logout(): void {
  api.post('/auth/logout').catch(() => undefined);
  localStorage.removeItem('auth_token');
  sessionStorage.removeItem('dmb_me');
  window.location.href = '/login/';
}

export function avatarFor(photo: string | null | undefined, gender?: string): string {
  const fallback = normalizeGender(gender) === 'female' ? DEFAULT_FEMALE_AVATAR_URL : DEFAULT_AVATAR_URL;
  if (isPlaceholderPhoto(photo)) return fallback;
  return resolveAssetUrl(photo, fallback);
}

export function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function timeAgo(value: string | Date | null | undefined): string {
  if (!value) return '';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function formatDate(value: string | Date | null | undefined): string {
  if (!value) return '—';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function formatTime(value: string | Date | null | undefined): string {
  if (!value) return '';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

export function formatDateTime(value: string | Date | null | undefined): string {
  const day = formatDate(value);
  const clock = formatTime(value);
  if (day === '—' || !clock) return day;
  return `${day}, ${clock}`;
}

export function formatPKR(amount: number | string | null | undefined): string {
  const num = Number(amount ?? 0);
  if (Number.isNaN(num)) return 'PKR 0';
  return `PKR ${num.toLocaleString('en-PK')}`;
}

export function ageFrom(birthday: string | null | undefined): number | null {
  if (!birthday) return null;
  const dob = new Date(birthday);
  if (Number.isNaN(dob.getTime())) return null;
  const diff = Date.now() - dob.getTime();
  return Math.floor(diff / (365.25 * 24 * 3600 * 1000));
}

/** Extracts a human-readable message from an axios error. */
export function errorMessage(err: unknown, fallback = 'Something went wrong. Please try again.'): string {
  const anyErr = err as { response?: { data?: { message?: string; error?: { message?: string } } }; message?: string };
  return (
    anyErr?.response?.data?.message ||
    anyErr?.response?.data?.error?.message ||
    anyErr?.message ||
    fallback
  );
}

/** Standard empty-state block markup. */
export function emptyStateHtml(title: string, subtitle: string, icon = '💌'): string {
  return `
    <div class="flex flex-col items-center justify-center text-center py-14 px-6">
      <div class="w-16 h-16 rounded-full bg-brand-50 border border-brand-100 flex items-center justify-center text-3xl mb-4">${icon}</div>
      <h3 class="font-serif text-lg font-bold text-navy-800">${escapeHtml(title)}</h3>
      <p class="text-xs text-navy-500 mt-1.5 max-w-sm leading-relaxed">${escapeHtml(subtitle)}</p>
    </div>`;
}

/** Standard error-state block with retry hook (attach [data-dmb-retry] listener). */
export function errorStateHtml(message: string): string {
  return `
    <div class="flex flex-col items-center justify-center text-center py-14 px-6">
      <div class="w-16 h-16 rounded-full bg-brand-50 border border-brand-100 flex items-center justify-center text-3xl mb-4">⚠️</div>
      <h3 class="font-serif text-lg font-bold text-navy-800">Unable to load</h3>
      <p class="text-xs text-navy-500 mt-1.5 max-w-sm leading-relaxed">${escapeHtml(message)}</p>
      <button data-dmb-retry class="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-brand-500 via-brand-600 to-pink-600 text-white text-xs font-bold shadow-lg shadow-brand-500/30 hover:-translate-y-0.5 transition-all">Try Again</button>
    </div>`;
}

/** Skeleton shimmer card list. */
export function skeletonHtml(rows = 3, heightClass = 'h-24'): string {
  return Array.from({ length: rows })
    .map(
      () =>
        `<div class="animate-pulse rounded-2xl bg-white border border-brand-100/60 ${heightClass} w-full mb-3 overflow-hidden"><div class="h-full w-full bg-gradient-to-r from-navy-50 via-brand-50/40 to-navy-50"></div></div>`,
    )
    .join('');
}

/** Populates common header/sidebar slots + unread badges. Call on every dashboard page. */
export async function hydrateChrome(): Promise<MeUser | null> {
  const me = await getMe();
  if (me) {
    document.querySelectorAll<HTMLElement>('[data-dmb-user-name]').forEach((el) => {
      el.textContent = me.name || `${me.first_name} ${me.last_name}`.trim();
    });
    document.querySelectorAll<HTMLElement>('[data-dmb-user-email]').forEach((el) => {
      el.textContent = me.email || me.phone || '';
    });
    document.querySelectorAll<HTMLElement>('[data-dmb-user-code]').forEach((el) => {
      el.textContent = me.referral_code || '';
    });
    document.querySelectorAll<HTMLElement>('[data-dmb-sidebar-degree]').forEach((el) => {
      el.textContent = me.referral_code ? `Member ${me.referral_code}` : 'Verified Member';
    });
    document.querySelectorAll<HTMLImageElement>('img[data-dmb-avatar]').forEach((el) => {
      el.src = avatarFor(me.avatar, me.gender);
      el.alt = me.name || 'Profile photo';
      el.onerror = () => {
        el.onerror = null;
        el.src = avatarFor('', me.gender);
      };
    });
  }

  document.querySelectorAll<HTMLElement>('[data-dmb-logout]').forEach((el) => {
    el.addEventListener('click', (ev) => {
      ev.preventDefault();
      logout();
    });
  });

  // Unread notification badge
  api
    .get('/notifications/unread-count')
    .then((res) => {
      const count = Number(res.data?.data?.unread_count ?? 0);
      document.querySelectorAll<HTMLElement>('[data-dmb-unread-badge]').forEach((el) => {
        if (count > 0) {
          el.classList.remove('hidden');
          const label = el.querySelector<HTMLElement>('[data-dmb-unread-count]');
          if (label) label.textContent = count > 99 ? '99+' : String(count);
        } else {
          el.classList.add('hidden');
        }
      });
    })
    .catch(() => undefined);

  // Chat unread badge (sidebar)
  api
    .get('/chat/threads')
    .then((res) => {
      const threads = (res.data?.data ?? []) as Array<{ unread_count?: number }>;
      const total = threads.reduce((sum, t) => sum + Number(t.unread_count || 0), 0);
      document.querySelectorAll<HTMLElement>('[data-dmb-badge-messages]').forEach((el) => {
        if (total > 0) {
          el.classList.remove('hidden');
          el.textContent = total > 99 ? '99+' : String(total);
        } else {
          el.classList.add('hidden');
        }
      });
    })
    .catch(() => undefined);

  // Pending received proposals badge (sidebar)
  api
    .get('/interests/requests', { params: { type: 'received' } })
    .then((res) => {
      const items = (res.data?.data ?? []) as Array<{ status?: string }>;
      const pending = items.filter((i) => String(i.status) === 'pending').length;
      document.querySelectorAll<HTMLElement>('[data-dmb-badge-proposals]').forEach((el) => {
        if (pending > 0) {
          el.classList.remove('hidden');
          el.textContent = pending > 99 ? '99+' : String(pending);
        } else {
          el.classList.add('hidden');
        }
      });
    })
    .catch(() => undefined);

  // Subscription tier badge (sidebar)
  api
    .get('/payments/subscription')
    .then((res) => {
      const sub = res.data?.data;
      const pkgName = sub?.package?.name || 'Free Starter';
      const remaining = sub?.remaining_interest;
      document.querySelectorAll<HTMLElement>('[data-dmb-sidebar-tier]').forEach((el) => {
        el.textContent = remaining != null ? `${pkgName} (${remaining} left)` : pkgName;
      });
    })
    .catch(() => undefined);

  // Header search → discover
  document.querySelectorAll<HTMLInputElement>('input[data-dmb-header-search]').forEach((input) => {
    input.addEventListener('keydown', (ev) => {
      if (ev.key === 'Enter' && input.value.trim()) {
        window.location.href = `/discover/?search=${encodeURIComponent(input.value.trim())}`;
      }
    });
  });

  return me;
}

export type DoctorCard = {
  user_id: number;
  first_name: string;
  last_name: string;
  age?: number;
  gender?: string;
  degree?: string;
  speciality?: string;
  city_name?: string;
  country_name?: string;
  caste?: string;
  religion?: string;
  marital_status?: string;
  height?: number;
  profile_photo_url?: string;
  is_photo_blurred?: boolean;
  is_verified?: boolean;
  compatibility_score?: number;
};

export function unwrapData<T>(res: { data?: { data?: T } }): T {
  return (res?.data?.data ?? res?.data) as T;
}

export function doctorName(doc?: Partial<DoctorCard> & { name?: string } | null, fallback = 'Doctor'): string {
  if (!doc) return fallback;
  if (doc.first_name) return `Dr. ${doc.first_name} ${doc.last_name || ''}`.trim();
  if (doc.name) return doc.name.startsWith('Dr.') ? doc.name : `Dr. ${doc.name}`;
  return fallback;
}

export function heightLabel(height?: number | string | null): string {
  const n = Number(height);
  if (!n || Number.isNaN(n)) return '';
  if (n > 90) {
    const inches = Math.round(n / 2.54);
    return `${Math.floor(inches / 12)}'${inches % 12}"`;
  }
  return `${Math.floor(n / 12)}'${n % 12}"`;
}

export function doctorCardHtml(doc: DoctorCard, opts: { shortlist?: boolean } = {}): string {
  const name = escapeHtml(doctorName(doc));
  const title = [doc.degree, doc.speciality].filter(Boolean).map(escapeHtml).join(', ') || 'Medical Professional';
  const city = escapeHtml(doc.city_name || doc.country_name || 'Pakistan');
  const score = doc.compatibility_score != null ? Math.round(Number(doc.compatibility_score)) : null;
  const photo = avatarFor(doc.profile_photo_url, doc.gender);
  const ht = heightLabel(doc.height);
  const tags = [doc.caste, doc.religion, doc.marital_status].filter(Boolean);
  return `
    <div class="group rounded-3xl bg-white border border-brand-100/80 shadow-luxury hover:shadow-luxury-hover transition-all duration-300 overflow-hidden flex flex-col justify-between">
      <div>
        <div class="aspect-[4/3] w-full overflow-hidden bg-navy-100 relative">
          <img src="${photo}" alt="${name}" loading="lazy" onerror="this.onerror=null;this.src='${escapeHtml(avatarFor('', doc.gender))}';" class="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500 ${doc.is_photo_blurred ? 'blur-md' : ''}" />
          ${score != null ? `<div class="absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-bold glass-card text-brand-600 shadow-md">✨ ${score}% Match</div>` : ''}
          ${doc.is_verified ? `<div class="absolute top-3 right-3 p-1.5 rounded-full bg-emerald-500 text-white shadow-md" title="Verified">✓</div>` : ''}
        </div>
        <div class="p-5 space-y-3">
          <div>
            <h3 class="text-base font-bold text-navy-800 group-hover:text-brand-600 transition-colors">${name}</h3>
            <p class="text-xs font-semibold text-brand-600 line-clamp-1">${title}</p>
          </div>
          <div class="grid grid-cols-2 gap-2 py-2 border-y border-navy-100 text-xs text-navy-700">
            <div>📅 ${doc.age || '—'} yrs${ht ? ` • ${ht}` : ''}</div>
            <div class="truncate">📍 ${city}</div>
          </div>
          ${tags.length ? `<div class="flex flex-wrap gap-1.5">${tags.map((t) => `<span class="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-brand-50 text-brand-700 border border-brand-100">${escapeHtml(t)}</span>`).join('')}</div>` : ''}
        </div>
      </div>
      <div class="p-5 pt-0 flex items-center gap-2">
        <button data-express="${doc.user_id}" class="flex-1 py-2.5 px-4 rounded-full bg-gradient-to-r from-brand-500 via-brand-600 to-pink-600 hover:from-brand-600 hover:to-pink-700 text-white text-xs font-bold shadow-lg shadow-brand-500/30 hover:shadow-brand-500/50 transition-all transform hover:-translate-y-0.5 active:scale-[0.98] disabled:opacity-50">💌 Send Proposal</button>
        <a href="/discover/?view=${doc.user_id}" class="py-2.5 px-3 rounded-xl bg-navy-50 hover:bg-navy-100 text-navy-700 border border-navy-200 text-xs font-bold transition-colors">Biodata</a>
        ${opts.shortlist !== false ? `<button data-shortlist="${doc.user_id}" class="p-2.5 rounded-xl bg-navy-50 hover:bg-brand-50 hover:text-brand-600 border border-navy-200 text-navy-400 transition-colors" title="Shortlist">🔖</button>` : ''}
      </div>
    </div>`;
}

export function bindCardActions(host: HTMLElement): void {
  host.querySelectorAll<HTMLButtonElement>('button[data-express]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      btn.disabled = true;
      try {
        await api.post('/interests/express', { user_id: Number(btn.dataset.express) });
        btn.textContent = '✓ Proposal Sent';
        toast('Proposal sent! The doctor will be notified.', 'success');
      } catch (err) {
        btn.disabled = false;
        toast(errorMessage(err, 'Could not send proposal.'), 'error');
      }
    });
  });
  host.querySelectorAll<HTMLButtonElement>('button[data-shortlist]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      btn.disabled = true;
      try {
        await api.post('/shortlists/', { user_id: Number(btn.dataset.shortlist) });
        btn.textContent = '★';
        btn.classList.add('text-brand-600');
        toast('Added to your shortlist.', 'success');
      } catch (err) {
        btn.disabled = false;
        toast(errorMessage(err, 'Could not shortlist this profile.'), 'error');
      }
    });
  });
}
