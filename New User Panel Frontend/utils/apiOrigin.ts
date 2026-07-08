const configuredApiUrl = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || '';

const withoutTrailingSlash = (value: string) => value.replace(/\/+$/, '');

const browserOrigin = () =>
    typeof window !== 'undefined' && window.location?.origin ? window.location.origin : '';

export const resolveApiBaseUrl = (value = configuredApiUrl): string => {
    const configured = `${value || ''}`.trim();
    if (!configured) return '/api';

    if (configured.startsWith('/')) {
        const normalized = withoutTrailingSlash(configured);
        return normalized.endsWith('/api') ? normalized : `${normalized}/api`;
    }

    const normalized = withoutTrailingSlash(configured);
    return normalized.endsWith('/api') ? normalized : `${normalized}/api`;
};

export const API_BASE_URL = resolveApiBaseUrl();

export const ASSET_BASE_URL = (() => {
    const configured = `${configuredApiUrl || ''}`.trim();
    if (configured) {
        return withoutTrailingSlash(resolveApiBaseUrl(configured).replace(/\/api$/, ''));
    }

    return browserOrigin();
})();

const assetPath = (path: string) => `${ASSET_BASE_URL}${path}`;

export const DEFAULT_AVATAR_URL = assetPath('/assets/img/avatar-place.png');
export const DEFAULT_FEMALE_AVATAR_URL = assetPath('/assets/img/female-avatar-place.png');

export const resolveAssetUrl = (
    value?: string | null,
    fallback: string = DEFAULT_AVATAR_URL,
): string => {
    const candidate = `${value ?? ''}`.trim();
    if (!candidate) return fallback;
    if (candidate.startsWith('http://') || candidate.startsWith('https://')) return candidate;
    if (candidate.startsWith('//')) return `https:${candidate}`;
    if (candidate.startsWith('/'))
        return ASSET_BASE_URL ? `${ASSET_BASE_URL}${candidate}` : candidate;

    return ASSET_BASE_URL
        ? `${ASSET_BASE_URL}/${candidate.replace(/^\/+/, '')}`
        : `/${candidate.replace(/^\/+/, '')}`;
};
