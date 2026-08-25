export type CanonicalGender = 'male' | 'female' | '';

/** Maps Laravel 1/2 plus m/f labels onto male/female. */
export function normalizeGender(value?: string | number | null): CanonicalGender {
  switch (String(value ?? '').trim().toLowerCase()) {
    case 'male':
    case 'm':
    case '1':
      return 'male';
    case 'female':
    case 'f':
    case '2':
      return 'female';
    default:
      return '';
  }
}

export function isFemaleGender(value?: string | number | null): boolean {
  return normalizeGender(value) === 'female';
}

export function isMaleGender(value?: string | number | null): boolean {
  return normalizeGender(value) === 'male';
}

/** True when the URL is missing or is a stock silhouette, not a real photo. */
export function isPlaceholderPhoto(value?: string | null): boolean {
  const url = String(value ?? '').trim().toLowerCase();
  if (!url || /^\d+$/.test(url)) return true;
  return /avatar-place|female-avatar-place|default[-_]?avatar|placeholder/.test(url);
}
