export type MediaRequestState = 'none' | 'pending' | 'approved';

export interface MediaAccessSnapshot {
    state: MediaRequestState;
    text: string;
    requested: boolean;
    approved: boolean;
    required: boolean;
    accessible: boolean;
    exists: boolean;
    requestId: string | number | null;
}

export interface MediaAccessBundle {
    profilePhoto: MediaAccessSnapshot;
    galleryImage: MediaAccessSnapshot;
}

const truthy = (value: unknown): boolean => {
    if (typeof value === 'string') {
        const normalized = value.trim().toLowerCase();
        return ['1', 'true', 'yes', 'on'].includes(normalized) || normalized.length > 0;
    }
    return Boolean(value);
};

const readFirst = (profile: any, keys: string[]): any => {
    for (const key of keys) {
        const value = profile?.[key];
        if (value !== undefined && value !== null && value !== '') {
            return value;
        }
    }
    return undefined;
};

const normalizeState = (value: unknown): MediaRequestState => {
    const normalized = `${value ?? ''}`.trim().toLowerCase();
    if (normalized === 'pending' || normalized === 'approved' || normalized === 'none') {
        return normalized;
    }
    return 'none';
};

const buildSnapshot = (
    profile: any,
    kind: 'profile_photo' | 'gallery_image',
): MediaAccessSnapshot => {
    const prefix = kind === 'profile_photo' ? 'profile_photo' : 'gallery_image';
    const state = normalizeState(
        readFirst(profile, [
            `${prefix}RequestState`,
            `${prefix}_request_state`,
            kind === 'profile_photo' ? 'photoRequestState' : 'galleryRequestState',
            kind === 'profile_photo' ? 'photo_request_state' : 'gallery_request_state',
            kind === 'profile_photo'
                ? 'profile_view_resquest_status'
                : 'gallery_view_resquest_status',
        ]),
    );
    const requested = truthy(
        readFirst(profile, [
            `${prefix}RequestRequested`,
            `${prefix}_request_requested`,
            kind === 'profile_photo' ? 'photoRequestRequested' : 'galleryRequestRequested',
            kind === 'profile_photo' ? 'photo_request_requested' : 'gallery_request_requested',
        ]),
    );
    const approved = truthy(
        readFirst(profile, [
            `${prefix}RequestApproved`,
            `${prefix}_request_approved`,
            kind === 'profile_photo' ? 'photoRequestApproved' : 'galleryRequestApproved',
            kind === 'profile_photo' ? 'photo_request_approved' : 'gallery_request_approved',
            kind === 'profile_photo'
                ? 'profile_view_resquest_status'
                : 'gallery_view_resquest_status',
        ]),
    );
    const required = truthy(
        readFirst(profile, [
            `${prefix}RequestRequired`,
            `${prefix}_request_required`,
            kind === 'profile_photo' ? 'photoRequestRequired' : 'galleryRequestRequired',
            kind === 'profile_photo' ? 'photo_request_required' : 'gallery_request_required',
        ]),
    );
    const accessible = truthy(
        readFirst(profile, [
            `${prefix}Accessible`,
            `${prefix}_accessible`,
            kind === 'profile_photo' ? 'photoAccessible' : 'galleryAccessible',
            kind === 'profile_photo' ? 'photo_accessible' : 'gallery_accessible',
        ]),
    );
    const exists = truthy(
        readFirst(profile, [
            `${prefix}Exists`,
            `${prefix}_exists`,
            kind === 'profile_photo' ? 'photoExists' : 'galleryExists',
            kind === 'profile_photo' ? 'photo_exists' : 'gallery_exists',
        ]),
    );
    const requestId =
        readFirst(profile, [
            `${prefix}RequestId`,
            `${prefix}_request_id`,
            kind === 'profile_photo' ? 'photoRequestId' : 'galleryRequestId',
            kind === 'profile_photo' ? 'photo_request_id' : 'gallery_request_id',
        ]) ?? null;
    const text = `${
        readFirst(profile, [
            `${prefix}RequestText`,
            `${prefix}_request_text`,
            kind === 'profile_photo' ? 'photoRequestText' : 'galleryRequestText',
            kind === 'profile_photo' ? 'photo_request_text' : 'gallery_request_text',
        ]) ?? ''
    }`.trim();

    return {
        state,
        text:
            text ||
            (state === 'approved'
                ? kind === 'profile_photo'
                    ? 'Photo Access Granted'
                    : 'Gallery Access Granted'
                : state === 'pending'
                  ? kind === 'profile_photo'
                      ? 'Photo Access Requested'
                      : 'Gallery Access Requested'
                  : !exists
                    ? kind === 'profile_photo'
                        ? 'Profile Photo Not Available'
                        : 'Gallery Images Not Available'
                    : accessible
                      ? 'Already Accessible'
                      : kind === 'profile_photo'
                        ? 'Request Photo Access'
                        : 'Request Gallery Access'),
        requested,
        approved,
        required,
        accessible,
        exists,
        requestId,
    };
};

export const resolveMediaAccessBundle = (profile: any): MediaAccessBundle => ({
    profilePhoto: buildSnapshot(profile, 'profile_photo'),
    galleryImage: buildSnapshot(profile, 'gallery_image'),
});

export const isMediaRequestPendingOrApproved = (snapshot: MediaAccessSnapshot): boolean => {
    return snapshot.state === 'pending' || snapshot.state === 'approved';
};
