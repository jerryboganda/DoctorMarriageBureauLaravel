import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { adminApi } from '@/api/admin';
import LoadingSpinner from '@/components/common/LoadingSpinner';

type PageKind = 'resource' | 'list' | 'single' | 'action';

type ModuleConfig = {
    kind: PageKind;
    title: string;
    endpoint: string;
    saveEndpoint?: string;
    createDefaults?: Record<string, unknown>;
    allowCreate?: boolean;
    allowEdit?: boolean;
    allowDelete?: boolean;
    readonly?: boolean;
};

const moduleConfigs: Record<string, ModuleConfig> = {
    '/admin-react/members': {
        kind: 'resource',
        title: 'Members',
        endpoint: '/members',
        createDefaults: {
            first_name: '',
            last_name: '',
            email: '',
            password: '',
            phone: '',
            membership: 1,
            approved: 1,
            gender: 'male',
        },
    },
    '/admin-react/members/bulk-upload': {
        kind: 'action',
        title: 'Bulk Member Upload',
        endpoint: '/members/bulk-upload',
        createDefaults: { bulk_file: '' },
    },
    '/admin-react/religions': {
        kind: 'resource',
        title: 'Religions',
        endpoint: '/religions',
        createDefaults: { name: '' },
    },
    '/admin-react/sects': {
        kind: 'resource',
        title: 'Sects',
        endpoint: '/sects',
        createDefaults: { name: '' },
    },
    '/admin-react/castes': {
        kind: 'resource',
        title: 'Castes',
        endpoint: '/castes',
        createDefaults: { name: '', religion_id: '' },
    },
    '/admin-react/sub-castes': {
        kind: 'resource',
        title: 'Sub-Castes',
        endpoint: '/sub-castes',
        createDefaults: { name: '', caste_id: '' },
    },
    '/admin-react/member-languages': {
        kind: 'resource',
        title: 'Member Languages',
        endpoint: '/member-languages',
        createDefaults: { name: '' },
    },
    '/admin-react/countries': {
        kind: 'resource',
        title: 'Countries',
        endpoint: '/countries',
        createDefaults: { code: '', name: '', status: 1 },
    },
    '/admin-react/states': {
        kind: 'resource',
        title: 'States',
        endpoint: '/states',
        createDefaults: { name: '', country_id: '' },
    },
    '/admin-react/cities': {
        kind: 'resource',
        title: 'Cities',
        endpoint: '/cities',
        createDefaults: { name: '', state_id: '' },
    },
    '/admin-react/family-status': {
        kind: 'resource',
        title: 'Family Status',
        endpoint: '/family-status',
        createDefaults: { name: '' },
    },
    '/admin-react/family-values': {
        kind: 'resource',
        title: 'Family Values',
        endpoint: '/family-values',
        createDefaults: { name: '' },
    },
    '/admin-react/on-behalf': {
        kind: 'resource',
        title: 'On Behalf',
        endpoint: '/on-behalf',
        createDefaults: { name: '' },
    },
    '/admin-react/marital-statuses': {
        kind: 'resource',
        title: 'Marital Statuses',
        endpoint: '/marital-statuses',
        createDefaults: { name: '' },
    },
    '/admin-react/annual-salaries': {
        kind: 'resource',
        title: 'Annual Salaries',
        endpoint: '/annual-salaries',
        createDefaults: { name: '' },
    },
    '/admin-react/job-titles': {
        kind: 'resource',
        title: 'Job Titles',
        endpoint: '/job-titles',
        createDefaults: { name: '' },
    },
    '/admin-react/specialities': {
        kind: 'resource',
        title: 'Specialities',
        endpoint: '/specialities',
        createDefaults: { name: '' },
    },
    '/admin-react/profile-option-values': {
        kind: 'resource',
        title: 'Profile Option Values',
        endpoint: '/profile-option-values',
        createDefaults: { name: '', field_name: '', active: 1 },
    },
    '/admin-react/additional-attributes': {
        kind: 'resource',
        title: 'Additional Attributes',
        endpoint: '/additional-attributes',
        createDefaults: { name: '', status: 1 },
    },
    '/admin-react/packages': {
        kind: 'resource',
        title: 'Packages',
        endpoint: '/packages',
        createDefaults: { name: '', price: '', active: 1 },
    },
    '/admin-react/blogs': {
        kind: 'resource',
        title: 'Blogs',
        endpoint: '/blogs',
        createDefaults: { title: '', category_id: '', status: 1, content: '' },
    },
    '/admin-react/blog-categories': {
        kind: 'resource',
        title: 'Blog Categories',
        endpoint: '/blog-categories',
        createDefaults: { name: '' },
    },
    '/admin-react/happy-stories': {
        kind: 'resource',
        title: 'Happy Stories',
        endpoint: '/happy-stories',
        createDefaults: { title: '', partner_name: '', details: '', approved: 0 },
    },
    '/admin-react/manual-payment-methods': {
        kind: 'resource',
        title: 'Manual Payment Methods',
        endpoint: '/manual-payment-methods',
        createDefaults: { heading: '', description: '' },
    },
    '/admin-react/custom-pages': {
        kind: 'resource',
        title: 'Custom Pages',
        endpoint: '/custom-pages',
        createDefaults: { title: '', slug: '', content: '' },
    },
    '/admin-react/languages': {
        kind: 'resource',
        title: 'Languages',
        endpoint: '/languages',
        createDefaults: { name: '', code: '', rtl: 0 },
    },
    '/admin-react/currencies': {
        kind: 'resource',
        title: 'Currencies',
        endpoint: '/currencies',
        createDefaults: { name: '', code: '', symbol: '', exchange_rate: 1, status: 1 },
    },
    '/admin-react/staffs': {
        kind: 'resource',
        title: 'Staffs',
        endpoint: '/staffs',
        createDefaults: { user_id: '', role_id: '' },
    },
    '/admin-react/roles': {
        kind: 'resource',
        title: 'Roles',
        endpoint: '/roles',
        createDefaults: { name: '' },
    },
    '/admin-react/email-templates': {
        kind: 'resource',
        title: 'Email Templates',
        endpoint: '/email-templates',
        createDefaults: { identifier: '', subject: '', body: '' },
        allowCreate: false,
        allowDelete: false,
    },

    '/admin-react/members/deleted': {
        kind: 'list',
        title: 'Deleted Members',
        endpoint: '/members/deleted',
        readonly: false,
        allowDelete: false,
    },
    '/admin-react/members/reported': {
        kind: 'list',
        title: 'Reported Members',
        endpoint: '/members/reported',
        readonly: false,
        allowDelete: true,
    },
    '/admin-react/members/verification-requests': {
        kind: 'list',
        title: 'Verification Requests',
        endpoint: '/members/verification-requests',
        readonly: false,
        allowDelete: false,
    },
    '/admin-react/members/unapproved-pictures': {
        kind: 'list',
        title: 'Unapproved Pictures',
        endpoint: '/members/unapproved-pictures',
        readonly: false,
        allowDelete: false,
    },
    '/admin-react/package-payments': {
        kind: 'list',
        title: 'Package Payments',
        endpoint: '/package-payments',
        readonly: false,
        allowDelete: false,
    },
    '/admin-react/wallet/transactions': {
        kind: 'list',
        title: 'Wallet Transactions',
        endpoint: '/wallet/transactions',
        readonly: true,
    },
    '/admin-react/wallet/manual-requests': {
        kind: 'list',
        title: 'Wallet Manual Requests',
        endpoint: '/wallet/manual-requests',
        readonly: false,
        allowDelete: false,
    },
    '/admin-react/wallet/payment-detail': {
        kind: 'single',
        title: 'Wallet Payment Detail',
        endpoint: '/wallet/payment',
        readonly: true,
    },
    '/admin-react/contact-us': {
        kind: 'list',
        title: 'Contact Us',
        endpoint: '/contact-us',
        allowDelete: true,
    },
    '/admin-react/support/active': {
        kind: 'list',
        title: 'Support Active Tickets',
        endpoint: '/support-tickets/active',
        readonly: true,
    },
    '/admin-react/support/my': {
        kind: 'list',
        title: 'My Tickets',
        endpoint: '/support-tickets/my',
        readonly: true,
    },
    '/admin-react/support/solved': {
        kind: 'list',
        title: 'Solved Tickets',
        endpoint: '/support-tickets/solved',
        readonly: true,
    },
    '/admin-react/uploaded-files': {
        kind: 'list',
        title: 'Uploaded Files',
        endpoint: '/uploaded-files',
        allowDelete: true,
    },
    '/admin-react/notifications': {
        kind: 'list',
        title: 'Notifications',
        endpoint: '/notifications',
        readonly: true,
    },
    '/admin-react/addons': { kind: 'list', title: 'Addons', endpoint: '/addons', readonly: true },
    '/admin-react/referral/dashboard': {
        kind: 'single',
        title: 'Referral Dashboard',
        endpoint: '/referral/dashboard',
        readonly: true,
    },
    '/admin-react/referral/rules': {
        kind: 'resource',
        title: 'Referral Rules',
        endpoint: '/referral/rules',
        createDefaults: { name: '', trigger_threshold: 1, is_active: 1 },
    },
    '/admin-react/referral/referrals': {
        kind: 'list',
        title: 'Referrals',
        endpoint: '/referral/referrals',
        readonly: true,
    },
    '/admin-react/referral/rewards': {
        kind: 'list',
        title: 'Referral Rewards',
        endpoint: '/referral/rewards',
        readonly: true,
    },
    '/admin-react/referral/audit-logs': {
        kind: 'list',
        title: 'Referral Audit Logs',
        endpoint: '/referral/audit-logs',
        readonly: true,
    },

    '/admin-react/settings/general': {
        kind: 'single',
        title: 'General Settings',
        endpoint: '/settings/general',
        saveEndpoint: '/settings/general',
    },
    '/admin-react/settings/smtp': {
        kind: 'single',
        title: 'SMTP Settings',
        endpoint: '/settings/smtp',
        saveEndpoint: '/settings/smtp',
    },
    '/admin-react/settings/payment-methods': {
        kind: 'single',
        title: 'Payment Methods',
        endpoint: '/settings/payment-methods',
        saveEndpoint: '/settings/payment-methods',
    },
    '/admin-react/settings/third-party': {
        kind: 'single',
        title: 'Third Party Settings',
        endpoint: '/settings/third-party',
        saveEndpoint: '/settings/third-party',
    },
    '/admin-react/settings/social-login': {
        kind: 'single',
        title: 'Social Login Settings',
        endpoint: '/settings/social-login',
        saveEndpoint: '/settings/social-login',
    },
    '/admin-react/settings/fcm': {
        kind: 'single',
        title: 'FCM Settings',
        endpoint: '/settings/fcm',
        saveEndpoint: '/settings/fcm',
    },
    '/admin-react/settings/verification-form': {
        kind: 'single',
        title: 'Verification Form Settings',
        endpoint: '/settings/verification-form',
        saveEndpoint: '/settings/verification-form',
    },
    '/admin-react/settings/profile-sections': {
        kind: 'single',
        title: 'Profile Sections Settings',
        endpoint: '/settings/profile-sections',
        saveEndpoint: '/settings/profile-sections',
    },
    '/admin-react/settings/activation': {
        kind: 'single',
        title: 'Activation Settings',
        endpoint: '/settings/general',
        saveEndpoint: '/settings/activation',
    },
    '/admin-react/website/header': {
        kind: 'single',
        title: 'Website Header',
        endpoint: '/website/header',
        saveEndpoint: '/website/header',
    },
    '/admin-react/website/footer': {
        kind: 'single',
        title: 'Website Footer',
        endpoint: '/website/footer',
        saveEndpoint: '/website/footer',
    },
    '/admin-react/website/appearances': {
        kind: 'single',
        title: 'Website Appearances',
        endpoint: '/website/appearances',
        saveEndpoint: '/website/appearances',
    },
    '/admin-react/referral/settings': {
        kind: 'single',
        title: 'Referral Settings',
        endpoint: '/referral/settings',
        saveEndpoint: '/referral/settings',
    },
    '/admin-react/support/settings': {
        kind: 'single',
        title: 'Support Settings',
        endpoint: '/support-settings',
        saveEndpoint: '/support-settings',
    },
    '/admin-react/profile-reminders': {
        kind: 'single',
        title: 'Profile Reminders',
        endpoint: '/profile-reminders',
        saveEndpoint: '/profile-reminders/update',
    },
    '/admin-react/bulk-notifications': {
        kind: 'action',
        title: 'Bulk Notifications',
        endpoint: '/bulk-notifications/send',
        createDefaults: { title: '', message: '', membership: '' },
    },
};

function normalizeValue(value: unknown): string {
    if (value === null || value === undefined) return '';
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
}

function isFileField(field: string): boolean {
    return (
        field === 'file' ||
        field.endsWith('_file') ||
        field.endsWith('_image') ||
        field.endsWith('_photo')
    );
}

function isTextareaField(field: string): boolean {
    return (
        field.includes('message') ||
        field.includes('body') ||
        field.includes('content') ||
        field.includes('details') ||
        field.includes('description') ||
        field.includes('notes')
    );
}

function isBooleanField(field: string, value: unknown): boolean {
    const lowered = field.toLowerCase();
    if (
        lowered === 'status' ||
        lowered === 'active' ||
        lowered === 'approved' ||
        lowered === 'blocked' ||
        lowered === 'deactivated' ||
        lowered === 'rtl' ||
        lowered.startsWith('is_') ||
        lowered.endsWith('_enabled') ||
        lowered.endsWith('_active') ||
        lowered.endsWith('_status')
    ) {
        return true;
    }

    return (
        value === 0 || value === 1 || value === '0' || value === '1' || typeof value === 'boolean'
    );
}

function isNumberField(field: string, value: unknown): boolean {
    if (isFileField(field)) return false;
    if (typeof value === 'number') return true;

    const lowered = field.toLowerCase();
    return (
        lowered.endsWith('_id') ||
        lowered.includes('price') ||
        lowered.includes('amount') ||
        lowered.includes('count') ||
        lowered.includes('days') ||
        lowered.includes('threshold') ||
        lowered.includes('duration') ||
        lowered.includes('rate') ||
        lowered.includes('limit') ||
        lowered.includes('percent') ||
        lowered.includes('delay') ||
        lowered.includes('interval') ||
        lowered.includes('validity')
    );
}

function toFormData(data: Record<string, unknown>, files: Record<string, File | null>): FormData {
    const formData = new FormData();

    Object.entries(data).forEach(([key, value]) => {
        if (isFileField(key)) {
            return;
        }
        if (value === null || value === undefined || value === '') {
            return;
        }
        if (typeof value === 'object') {
            formData.append(key, JSON.stringify(value));
            return;
        }
        formData.append(key, String(value));
    });

    Object.entries(files).forEach(([key, file]) => {
        if (file) {
            formData.append(key, file);
        }
    });

    return formData;
}

function inferFormFields(data: Record<string, unknown>): string[] {
    const skip = new Set(['id', 'created_at', 'updated_at', 'deleted_at', 'pivot']);
    return Object.keys(data).filter((key) => !skip.has(key) && typeof data[key] !== 'object');
}

function resolveConfig(pathname: string) {
    if (moduleConfigs[pathname]) {
        return {
            config: moduleConfigs[pathname],
            mode: 'base' as const,
            id: null,
            basePath: pathname,
        };
    }

    const entries = Object.entries(moduleConfigs).filter(([, cfg]) => cfg.kind === 'resource');
    for (const [basePath, config] of entries) {
        if (pathname === `${basePath}/create`) {
            return { config, mode: 'create' as const, id: null, basePath };
        }
        const editMatch = pathname.match(new RegExp(`^${basePath}/(\\d+)/edit$`));
        if (editMatch) {
            return { config, mode: 'edit' as const, id: editMatch[1], basePath };
        }
        const viewMatch = pathname.match(new RegExp(`^${basePath}/(\\d+)$`));
        if (viewMatch) {
            return { config, mode: 'view' as const, id: viewMatch[1], basePath };
        }
    }

    const specialMatchers: Array<{
        regex: RegExp;
        config: ModuleConfig;
        mode: 'view';
        basePath: string;
    }> = [
        {
            regex: /^\/admin-react\/package-payments\/(\d+)$/,
            config: moduleConfigs['/admin-react/package-payments'],
            mode: 'view',
            basePath: '/admin-react/package-payments',
        },
        {
            regex: /^\/admin-react\/wallet\/payment\/(\d+)$/,
            config: moduleConfigs['/admin-react/wallet/payment-detail'],
            mode: 'view',
            basePath: '/admin-react/wallet/transactions',
        },
        {
            regex: /^\/admin-react\/contact-us\/(\d+)$/,
            config: moduleConfigs['/admin-react/contact-us'],
            mode: 'view',
            basePath: '/admin-react/contact-us',
        },
        {
            regex: /^\/admin-react\/manual-payment-methods\/(\d+)\/edit$/,
            config: moduleConfigs['/admin-react/manual-payment-methods'],
            mode: 'view',
            basePath: '/admin-react/manual-payment-methods',
        },
        {
            regex: /^\/admin-react\/custom-pages\/(\d+)\/edit$/,
            config: moduleConfigs['/admin-react/custom-pages'],
            mode: 'view',
            basePath: '/admin-react/custom-pages',
        },
    ];

    for (const item of specialMatchers) {
        const match = pathname.match(item.regex);
        if (match) {
            return { config: item.config, mode: item.mode, id: match[1], basePath: item.basePath };
        }
    }

    return { config: null, mode: 'unknown' as const, id: null, basePath: pathname };
}

export default function ModulePage() {
    const location = useLocation();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [notice, setNotice] = useState<string | null>(null);

    const [items, setItems] = useState<any[]>([]);
    const [pagination, setPagination] = useState({
        current_page: 1,
        last_page: 1,
        per_page: 20,
        total: 0,
    });
    const [search, setSearch] = useState('');

    const [singleData, setSingleData] = useState<Record<string, unknown>>({});
    const [detailData, setDetailData] = useState<Record<string, unknown> | null>(null);
    const [formData, setFormData] = useState<Record<string, unknown>>({});
    const [formFiles, setFormFiles] = useState<Record<string, File | null>>({});
    const [saving, setSaving] = useState(false);

    const resolved = useMemo(() => resolveConfig(location.pathname), [location.pathname]);

    const formFields = useMemo(() => {
        if (Object.keys(formData).length > 0) return inferFormFields(formData);
        if (resolved.config?.createDefaults) return inferFormFields(resolved.config.createDefaults);
        return ['name'];
    }, [formData, resolved.config]);

    const tableColumns = useMemo(() => {
        if (!items.length) return [] as string[];
        return Object.keys(items[0])
            .filter((k) => typeof items[0][k] !== 'object')
            .slice(0, 8);
    }, [items]);

    const fetchData = async (page = 1) => {
        if (!resolved.config) return;

        setLoading(true);
        setError(null);
        setNotice(null);
        try {
            if (resolved.mode === 'create') {
                setFormData({ ...(resolved.config.createDefaults || { name: '' }) });
                setFormFiles({});
                setLoading(false);
                return;
            }

            if (resolved.mode === 'edit' || resolved.mode === 'view') {
                const endpoint = `${resolved.config.endpoint}/${resolved.id}`;
                const res = await adminApi.moduleGet(endpoint);
                const payload = (res.data?.data ?? res.data) as Record<string, unknown>;
                setDetailData(payload);
                setFormData(payload);
                setFormFiles({});
                setLoading(false);
                return;
            }

            if (resolved.config.kind === 'resource' || resolved.config.kind === 'list') {
                const res = await adminApi.moduleList(resolved.config.endpoint, {
                    search,
                    page,
                    per_page: pagination.per_page,
                });
                const payload = res.data?.data;

                if (Array.isArray(payload)) {
                    setItems(payload);
                    setPagination((prev) => ({
                        ...prev,
                        current_page: 1,
                        last_page: 1,
                        total: payload.length,
                    }));
                } else if (Array.isArray(payload?.items)) {
                    setItems(payload.items);
                    setPagination(payload.pagination || pagination);
                } else {
                    setItems([]);
                }
            } else if (resolved.config.kind === 'single') {
                const res = await adminApi.moduleGet(resolved.config.endpoint);
                const payload = (res.data?.data ?? {}) as Record<string, unknown>;

                if (
                    payload &&
                    typeof payload === 'object' &&
                    'settings' in payload &&
                    payload.settings &&
                    typeof payload.settings === 'object'
                ) {
                    setSingleData(payload.settings as Record<string, unknown>);
                } else {
                    setSingleData(payload);
                }
            } else if (resolved.config.kind === 'action') {
                setFormData({ ...(resolved.config.createDefaults || {}) });
                setFormFiles({});
            }
        } catch (err: any) {
            setError(err?.response?.data?.message || err?.message || 'Failed to load module data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void fetchData(1);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [resolved.config, resolved.mode, resolved.id]);

    const submitResourceForm = async (e: FormEvent) => {
        e.preventDefault();
        if (!resolved.config) return;

        setSaving(true);
        setError(null);
        setNotice(null);
        try {
            const hasFiles = Object.values(formFiles).some((file) => !!file);
            const payload = hasFiles ? toFormData(formData, formFiles) : formData;

            if (resolved.mode === 'create') {
                await adminApi.moduleCreate(resolved.config.endpoint, payload);
                setNotice('Created successfully');
            } else if (resolved.mode === 'edit') {
                await adminApi.moduleUpdate(`${resolved.config.endpoint}/${resolved.id}`, payload);
                setNotice('Updated successfully');
            }
            navigate(resolved.basePath);
        } catch (err: any) {
            setError(err?.response?.data?.message || err?.message || 'Save failed');
        } finally {
            setSaving(false);
        }
    };

    const submitSingleForm = async (e: FormEvent) => {
        e.preventDefault();
        if (!resolved.config) return;

        setSaving(true);
        setError(null);
        setNotice(null);
        try {
            const endpoint = resolved.config.saveEndpoint || resolved.config.endpoint;
            await adminApi.moduleAction(endpoint, singleData);
            setNotice('Settings saved successfully');
            await fetchData();
        } catch (err: any) {
            setError(err?.response?.data?.message || err?.message || 'Update failed');
        } finally {
            setSaving(false);
        }
    };

    const submitActionForm = async (e: FormEvent) => {
        e.preventDefault();
        if (!resolved.config) return;

        setSaving(true);
        setError(null);
        setNotice(null);
        try {
            const hasFiles = Object.values(formFiles).some((file) => !!file);
            const payload = hasFiles ? toFormData(formData, formFiles) : formData;

            await adminApi.moduleAction(resolved.config.endpoint, payload);
            setFormData({ ...(resolved.config.createDefaults || {}) });
            setFormFiles({});
            setNotice('Action completed successfully');
        } catch (err: any) {
            setError(err?.response?.data?.message || err?.message || 'Action failed');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: number | string) => {
        if (!resolved.config) return;
        if (!window.confirm('Are you sure you want to delete this item?')) return;

        try {
            await adminApi.moduleDelete(`${resolved.config.endpoint}/${id}`);
            setNotice('Deleted successfully');
            await fetchData(pagination.current_page);
        } catch (err: any) {
            setError(err?.response?.data?.message || err?.message || 'Delete failed');
        }
    };

    const runPostAction = async (path: string, payload?: Record<string, unknown>) => {
        try {
            const response = await adminApi.moduleAction(path, payload || {});
            setNotice(response?.data?.message || 'Action completed successfully');
            await fetchData(pagination.current_page);
            return response?.data?.data;
        } catch (err: any) {
            setError(err?.response?.data?.message || err?.message || 'Action failed');
            return null;
        }
    };

    const runDeleteAction = async (path: string) => {
        try {
            await adminApi.moduleDelete(path);
            setNotice('Action completed successfully');
            await fetchData(pagination.current_page);
        } catch (err: any) {
            setError(err?.response?.data?.message || err?.message || 'Action failed');
        }
    };

    if (!resolved.config) {
        return (
            <div className="rounded-xl bg-white p-6 shadow-sm">
                <h2 className="text-xl font-semibold text-slate-800">Module not mapped</h2>
                <p className="mt-1 text-sm text-slate-500">Path: {location.pathname}</p>
            </div>
        );
    }

    if (loading) return <LoadingSpinner />;

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-white p-4 shadow-sm">
                <div>
                    <h2 className="text-xl font-semibold text-slate-800">
                        {resolved.config.title}
                    </h2>
                    <p className="text-xs text-slate-500">Endpoint: {resolved.config.endpoint}</p>
                </div>

                {resolved.config.kind === 'resource' &&
                    resolved.mode === 'base' &&
                    resolved.config.allowCreate !== false && (
                        <Link
                            className="rounded bg-primary px-3 py-2 text-sm font-medium text-white hover:bg-primary-hover"
                            to={`${resolved.basePath}/create`}
                        >
                            Create New
                        </Link>
                    )}
            </div>

            {error && (
                <div className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
            )}
            {notice && (
                <div className="rounded bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                    {notice}
                </div>
            )}

            {(resolved.config.kind === 'resource' || resolved.config.kind === 'list') &&
                resolved.mode === 'base' && (
                    <div className="space-y-3 rounded-xl bg-white p-4 shadow-sm">
                        <div className="flex flex-wrap items-center gap-2">
                            <input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search..."
                                className="w-72 rounded border border-slate-300 px-3 py-2 text-sm"
                            />
                            <button
                                className="rounded border border-slate-300 px-3 py-2 text-sm"
                                onClick={() => void fetchData(1)}
                            >
                                Search
                            </button>
                        </div>

                        {items.length === 0 ? (
                            <div className="text-sm text-slate-500">No records found.</div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="min-w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-slate-200 text-left text-slate-600">
                                            {tableColumns.map((c) => (
                                                <th key={c} className="px-2 py-2">
                                                    {c}
                                                </th>
                                            ))}
                                            <th className="px-2 py-2">actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {items.map((row, idx) => {
                                            const rowId = row.id ?? idx;
                                            return (
                                                <tr
                                                    key={rowId}
                                                    className="border-b border-slate-100"
                                                >
                                                    {tableColumns.map((c) => (
                                                        <td
                                                            key={c}
                                                            className="px-2 py-2 text-slate-700"
                                                        >
                                                            {normalizeValue(row[c])}
                                                        </td>
                                                    ))}
                                                    <td className="px-2 py-2">
                                                        <div className="flex flex-wrap gap-2">
                                                            {(resolved.config.kind === 'resource' ||
                                                                resolved.config.endpoint ===
                                                                    '/contact-us' ||
                                                                resolved.config.endpoint ===
                                                                    '/package-payments') && (
                                                                <Link
                                                                    className="rounded border border-slate-300 px-2 py-1 text-xs"
                                                                    to={`${resolved.basePath}/${rowId}`}
                                                                >
                                                                    View
                                                                </Link>
                                                            )}
                                                            {resolved.config.kind === 'resource' &&
                                                                resolved.config.allowEdit !==
                                                                    false && (
                                                                    <Link
                                                                        className="rounded border border-slate-300 px-2 py-1 text-xs"
                                                                        to={`${resolved.basePath}/${rowId}/edit`}
                                                                    >
                                                                        Edit
                                                                    </Link>
                                                                )}
                                                            {!resolved.config.readonly &&
                                                                (resolved.config.allowDelete ??
                                                                    resolved.config.kind ===
                                                                        'resource') && (
                                                                    <button
                                                                        className="rounded border border-red-200 px-2 py-1 text-xs text-red-700"
                                                                        onClick={() =>
                                                                            void handleDelete(rowId)
                                                                        }
                                                                    >
                                                                        Delete
                                                                    </button>
                                                                )}

                                                            {resolved.config.endpoint ===
                                                                '/members/deleted' && (
                                                                <>
                                                                    <button
                                                                        className="rounded border border-emerald-200 px-2 py-1 text-xs text-emerald-700"
                                                                        onClick={() =>
                                                                            void runPostAction(
                                                                                `/members/${rowId}/restore`,
                                                                            )
                                                                        }
                                                                    >
                                                                        Restore
                                                                    </button>
                                                                    <button
                                                                        className="rounded border border-red-200 px-2 py-1 text-xs text-red-700"
                                                                        onClick={() => {
                                                                            if (
                                                                                window.confirm(
                                                                                    'Permanently delete this member?',
                                                                                )
                                                                            ) {
                                                                                void runDeleteAction(
                                                                                    `/members/${rowId}/permanent`,
                                                                                );
                                                                            }
                                                                        }}
                                                                    >
                                                                        Permanent Delete
                                                                    </button>
                                                                </>
                                                            )}

                                                            {resolved.config.endpoint ===
                                                                '/members/verification-requests' && (
                                                                <>
                                                                    <button
                                                                        className="rounded border border-emerald-200 px-2 py-1 text-xs text-emerald-700"
                                                                        onClick={() =>
                                                                            void runPostAction(
                                                                                `/members/${rowId}/approve-verification`,
                                                                            )
                                                                        }
                                                                    >
                                                                        Approve
                                                                    </button>
                                                                    <button
                                                                        className="rounded border border-orange-200 px-2 py-1 text-xs text-orange-700"
                                                                        onClick={() =>
                                                                            void runPostAction(
                                                                                `/members/${rowId}/reject-verification`,
                                                                            )
                                                                        }
                                                                    >
                                                                        Reject
                                                                    </button>
                                                                </>
                                                            )}

                                                            {resolved.config.endpoint ===
                                                                '/members/unapproved-pictures' && (
                                                                <button
                                                                    className="rounded border border-emerald-200 px-2 py-1 text-xs text-emerald-700"
                                                                    onClick={() =>
                                                                        void runPostAction(
                                                                            `/members/${rowId}/approve-picture`,
                                                                        )
                                                                    }
                                                                >
                                                                    Approve Picture
                                                                </button>
                                                            )}

                                                            {resolved.config.endpoint ===
                                                                '/members' && (
                                                                <>
                                                                    <button
                                                                        className="rounded border border-slate-300 px-2 py-1 text-xs"
                                                                        onClick={() =>
                                                                            void runPostAction(
                                                                                `/members/${rowId}/block`,
                                                                                {
                                                                                    blocked:
                                                                                        row.blocked
                                                                                            ? 0
                                                                                            : 1,
                                                                                },
                                                                            )
                                                                        }
                                                                    >
                                                                        {row.blocked
                                                                            ? 'Unblock'
                                                                            : 'Block'}
                                                                    </button>
                                                                    <button
                                                                        className="rounded border border-slate-300 px-2 py-1 text-xs"
                                                                        onClick={() =>
                                                                            void runPostAction(
                                                                                `/members/${rowId}/toggle-activation`,
                                                                            )
                                                                        }
                                                                    >
                                                                        Toggle Activation
                                                                    </button>
                                                                    <button
                                                                        className="rounded border border-slate-300 px-2 py-1 text-xs"
                                                                        onClick={async () => {
                                                                            const data =
                                                                                await runPostAction(
                                                                                    `/members/${rowId}/login-as`,
                                                                                );
                                                                            if (data?.token) {
                                                                                window.prompt(
                                                                                    'Member login token:',
                                                                                    String(
                                                                                        data.token,
                                                                                    ),
                                                                                );
                                                                            }
                                                                        }}
                                                                    >
                                                                        Login As
                                                                    </button>
                                                                </>
                                                            )}

                                                            {resolved.config.endpoint ===
                                                                '/countries' && (
                                                                <button
                                                                    className="rounded border border-slate-300 px-2 py-1 text-xs"
                                                                    onClick={() =>
                                                                        void runPostAction(
                                                                            `/countries/${rowId}/toggle-status`,
                                                                        )
                                                                    }
                                                                >
                                                                    Toggle Status
                                                                </button>
                                                            )}

                                                            {resolved.config.endpoint ===
                                                                '/packages' && (
                                                                <button
                                                                    className="rounded border border-slate-300 px-2 py-1 text-xs"
                                                                    onClick={() =>
                                                                        void runPostAction(
                                                                            `/packages/${rowId}/toggle-status`,
                                                                        )
                                                                    }
                                                                >
                                                                    Toggle Status
                                                                </button>
                                                            )}

                                                            {resolved.config.endpoint ===
                                                                '/blogs' && (
                                                                <button
                                                                    className="rounded border border-slate-300 px-2 py-1 text-xs"
                                                                    onClick={() =>
                                                                        void runPostAction(
                                                                            `/blogs/${rowId}/toggle-status`,
                                                                        )
                                                                    }
                                                                >
                                                                    Toggle Status
                                                                </button>
                                                            )}

                                                            {resolved.config.endpoint ===
                                                                '/happy-stories' && (
                                                                <button
                                                                    className="rounded border border-slate-300 px-2 py-1 text-xs"
                                                                    onClick={() =>
                                                                        void runPostAction(
                                                                            `/happy-stories/${rowId}/toggle-approval`,
                                                                        )
                                                                    }
                                                                >
                                                                    Toggle Approval
                                                                </button>
                                                            )}

                                                            {resolved.config.endpoint ===
                                                                '/profile-option-values' && (
                                                                <button
                                                                    className="rounded border border-slate-300 px-2 py-1 text-xs"
                                                                    onClick={() =>
                                                                        void runPostAction(
                                                                            `/profile-option-values/${rowId}/toggle-active`,
                                                                        )
                                                                    }
                                                                >
                                                                    Toggle Active
                                                                </button>
                                                            )}

                                                            {resolved.config.endpoint ===
                                                                '/currencies' && (
                                                                <button
                                                                    className="rounded border border-slate-300 px-2 py-1 text-xs"
                                                                    onClick={() =>
                                                                        void runPostAction(
                                                                            `/currencies/${rowId}/toggle-status`,
                                                                        )
                                                                    }
                                                                >
                                                                    Toggle Status
                                                                </button>
                                                            )}

                                                            {resolved.config.endpoint ===
                                                                '/languages' && (
                                                                <button
                                                                    className="rounded border border-slate-300 px-2 py-1 text-xs"
                                                                    onClick={() =>
                                                                        void runPostAction(
                                                                            `/languages/${rowId}/toggle-rtl`,
                                                                        )
                                                                    }
                                                                >
                                                                    Toggle RTL
                                                                </button>
                                                            )}

                                                            {resolved.config.endpoint ===
                                                                '/addons' && (
                                                                <button
                                                                    className="rounded border border-slate-300 px-2 py-1 text-xs"
                                                                    onClick={() =>
                                                                        void runPostAction(
                                                                            `/addons/${rowId}/toggle`,
                                                                        )
                                                                    }
                                                                >
                                                                    Toggle
                                                                </button>
                                                            )}

                                                            {resolved.config.endpoint ===
                                                                '/wallet/manual-requests' && (
                                                                <>
                                                                    <Link
                                                                        className="rounded border border-slate-300 px-2 py-1 text-xs"
                                                                        to={`/admin-react/wallet/payment/${rowId}`}
                                                                    >
                                                                        View
                                                                    </Link>
                                                                    <button
                                                                        className="rounded border border-emerald-200 px-2 py-1 text-xs text-emerald-700"
                                                                        onClick={() =>
                                                                            void runPostAction(
                                                                                `/wallet/manual-accept/${rowId}`,
                                                                            )
                                                                        }
                                                                    >
                                                                        Accept Manual
                                                                    </button>
                                                                </>
                                                            )}

                                                            {resolved.config.endpoint ===
                                                                '/package-payments' && (
                                                                <button
                                                                    className="rounded border border-emerald-200 px-2 py-1 text-xs text-emerald-700"
                                                                    onClick={() =>
                                                                        void runPostAction(
                                                                            `/package-payments/${rowId}/accept-manual`,
                                                                        )
                                                                    }
                                                                >
                                                                    Accept Manual
                                                                </button>
                                                            )}

                                                            {resolved.config.endpoint ===
                                                                '/referral/rewards' && (
                                                                <button
                                                                    className="rounded border border-orange-200 px-2 py-1 text-xs text-orange-700"
                                                                    onClick={() =>
                                                                        void runPostAction(
                                                                            `/referral/rewards/${rowId}/reverse`,
                                                                            {
                                                                                reason: 'Reversed from admin panel',
                                                                            },
                                                                        )
                                                                    }
                                                                >
                                                                    Reverse
                                                                </button>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        <div className="flex items-center justify-between text-sm text-slate-600">
                            <div>
                                Page {pagination.current_page} of {pagination.last_page} (
                                {pagination.total} total)
                            </div>
                            <div className="flex gap-2">
                                <button
                                    disabled={pagination.current_page <= 1}
                                    className="rounded border border-slate-300 px-3 py-1 disabled:opacity-50"
                                    onClick={() =>
                                        void fetchData(Math.max(1, pagination.current_page - 1))
                                    }
                                >
                                    Prev
                                </button>
                                <button
                                    disabled={pagination.current_page >= pagination.last_page}
                                    className="rounded border border-slate-300 px-3 py-1 disabled:opacity-50"
                                    onClick={() =>
                                        void fetchData(
                                            Math.min(
                                                pagination.last_page,
                                                pagination.current_page + 1,
                                            ),
                                        )
                                    }
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    </div>
                )}

            {resolved.config.kind === 'resource' &&
                (resolved.mode === 'create' || resolved.mode === 'edit') && (
                    <form
                        className="space-y-3 rounded-xl bg-white p-4 shadow-sm"
                        onSubmit={submitResourceForm}
                    >
                        {formFields.map((field) => (
                            <div key={field}>
                                <label className="mb-1 block text-sm font-medium text-slate-700">
                                    {field}
                                </label>
                                {isFileField(field) ? (
                                    <input
                                        type="file"
                                        onChange={(e) =>
                                            setFormFiles((prev) => ({
                                                ...prev,
                                                [field]: e.target.files?.[0] || null,
                                            }))
                                        }
                                        className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
                                    />
                                ) : isTextareaField(field) ? (
                                    <textarea
                                        value={normalizeValue(formData[field])}
                                        onChange={(e) =>
                                            setFormData((prev) => ({
                                                ...prev,
                                                [field]: e.target.value,
                                            }))
                                        }
                                        className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
                                        rows={4}
                                    />
                                ) : isBooleanField(field, formData[field]) ? (
                                    <select
                                        value={normalizeValue(formData[field] ?? 0)}
                                        onChange={(e) =>
                                            setFormData((prev) => ({
                                                ...prev,
                                                [field]: Number(e.target.value),
                                            }))
                                        }
                                        className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
                                    >
                                        <option value="1">Enabled</option>
                                        <option value="0">Disabled</option>
                                    </select>
                                ) : isNumberField(field, formData[field]) ? (
                                    <input
                                        type="number"
                                        value={normalizeValue(formData[field])}
                                        onChange={(e) =>
                                            setFormData((prev) => ({
                                                ...prev,
                                                [field]: e.target.value,
                                            }))
                                        }
                                        className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
                                    />
                                ) : (
                                    <input
                                        value={normalizeValue(formData[field])}
                                        onChange={(e) =>
                                            setFormData((prev) => ({
                                                ...prev,
                                                [field]: e.target.value,
                                            }))
                                        }
                                        className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
                                    />
                                )}
                            </div>
                        ))}

                        <div className="flex gap-2">
                            <button
                                disabled={saving}
                                className="rounded bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover"
                            >
                                {saving ? 'Saving...' : 'Save'}
                            </button>
                            <button
                                type="button"
                                className="rounded border border-slate-300 px-4 py-2 text-sm"
                                onClick={() => navigate(resolved.basePath)}
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                )}

            {(resolved.mode === 'view' ||
                (resolved.config.kind === 'single' && resolved.config.readonly)) && (
                <div className="rounded-xl bg-white p-4 shadow-sm">
                    <pre className="overflow-x-auto text-xs text-slate-700">
                        {JSON.stringify(detailData || singleData, null, 2)}
                    </pre>
                </div>
            )}

            {resolved.config.kind === 'single' &&
                !resolved.config.readonly &&
                resolved.mode === 'base' && (
                    <form
                        className="space-y-3 rounded-xl bg-white p-4 shadow-sm"
                        onSubmit={submitSingleForm}
                    >
                        {Object.keys(singleData).length === 0 ? (
                            <div className="text-sm text-slate-500">No settings found.</div>
                        ) : (
                            Object.keys(singleData).map((key) => (
                                <div key={key}>
                                    <label className="mb-1 block text-sm font-medium text-slate-700">
                                        {key}
                                    </label>
                                    {isTextareaField(key) ? (
                                        <textarea
                                            value={normalizeValue(singleData[key])}
                                            onChange={(e) =>
                                                setSingleData((prev) => ({
                                                    ...prev,
                                                    [key]: e.target.value,
                                                }))
                                            }
                                            className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
                                            rows={4}
                                        />
                                    ) : isBooleanField(key, singleData[key]) ? (
                                        <select
                                            value={normalizeValue(singleData[key] ?? 0)}
                                            onChange={(e) =>
                                                setSingleData((prev) => ({
                                                    ...prev,
                                                    [key]: Number(e.target.value),
                                                }))
                                            }
                                            className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
                                        >
                                            <option value="1">Enabled</option>
                                            <option value="0">Disabled</option>
                                        </select>
                                    ) : isNumberField(key, singleData[key]) ? (
                                        <input
                                            type="number"
                                            value={normalizeValue(singleData[key])}
                                            onChange={(e) =>
                                                setSingleData((prev) => ({
                                                    ...prev,
                                                    [key]: e.target.value,
                                                }))
                                            }
                                            className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
                                        />
                                    ) : (
                                        <input
                                            value={normalizeValue(singleData[key])}
                                            onChange={(e) =>
                                                setSingleData((prev) => ({
                                                    ...prev,
                                                    [key]: e.target.value,
                                                }))
                                            }
                                            className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
                                        />
                                    )}
                                </div>
                            ))
                        )}

                        <button
                            disabled={saving}
                            className="rounded bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover"
                        >
                            {saving ? 'Saving...' : 'Save Settings'}
                        </button>

                        {resolved.config.endpoint === '/profile-reminders' && (
                            <div className="flex flex-wrap gap-2">
                                <button
                                    type="button"
                                    className="rounded border border-slate-300 px-4 py-2 text-sm"
                                    onClick={() =>
                                        void runPostAction('/profile-reminders/send-now')
                                    }
                                >
                                    Send Now
                                </button>
                                <button
                                    type="button"
                                    className="rounded border border-red-200 px-4 py-2 text-sm text-red-700"
                                    onClick={() => {
                                        if (window.confirm('Clear all reminder logs?')) {
                                            void runPostAction('/profile-reminders/clear-logs');
                                        }
                                    }}
                                >
                                    Clear Logs
                                </button>
                            </div>
                        )}
                    </form>
                )}

            {resolved.config.kind === 'action' && (
                <form
                    className="space-y-3 rounded-xl bg-white p-4 shadow-sm"
                    onSubmit={submitActionForm}
                >
                    {Object.keys(formData).map((field) => (
                        <div key={field}>
                            <label className="mb-1 block text-sm font-medium text-slate-700">
                                {field}
                            </label>
                            {isFileField(field) ? (
                                <input
                                    type="file"
                                    onChange={(e) =>
                                        setFormFiles((prev) => ({
                                            ...prev,
                                            [field]: e.target.files?.[0] || null,
                                        }))
                                    }
                                    className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
                                />
                            ) : isTextareaField(field) ? (
                                <textarea
                                    value={normalizeValue(formData[field])}
                                    onChange={(e) =>
                                        setFormData((prev) => ({
                                            ...prev,
                                            [field]: e.target.value,
                                        }))
                                    }
                                    className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
                                    rows={4}
                                />
                            ) : isBooleanField(field, formData[field]) ? (
                                <select
                                    value={normalizeValue(formData[field] ?? 0)}
                                    onChange={(e) =>
                                        setFormData((prev) => ({
                                            ...prev,
                                            [field]: Number(e.target.value),
                                        }))
                                    }
                                    className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
                                >
                                    <option value="1">Enabled</option>
                                    <option value="0">Disabled</option>
                                </select>
                            ) : isNumberField(field, formData[field]) ? (
                                <input
                                    type="number"
                                    value={normalizeValue(formData[field])}
                                    onChange={(e) =>
                                        setFormData((prev) => ({
                                            ...prev,
                                            [field]: e.target.value,
                                        }))
                                    }
                                    className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
                                />
                            ) : (
                                <input
                                    value={normalizeValue(formData[field])}
                                    onChange={(e) =>
                                        setFormData((prev) => ({
                                            ...prev,
                                            [field]: e.target.value,
                                        }))
                                    }
                                    className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
                                />
                            )}
                        </div>
                    ))}

                    <button
                        disabled={saving}
                        className="rounded bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover"
                    >
                        {saving ? 'Submitting...' : 'Submit'}
                    </button>
                </form>
            )}
        </div>
    );
}
