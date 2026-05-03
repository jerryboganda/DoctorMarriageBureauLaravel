import React from 'react';
import {
    Briefcase,
    BookOpen,
    Calendar,
    Globe,
    GraduationCap,
    Heart,
    MapPin,
    Ruler,
    Star,
    Utensils,
    Users,
    UserCheck
} from 'lucide-react';
import { calculateAgeFromDob } from '../utils/age';

interface BiodataPDFTemplateProps {
    userData: any;
}

const resolveAssetBase = () => {
    const envBase = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL;

    if (envBase) {
        return envBase.replace(/\/api$/, '').replace(/\/$/, '');
    }

    if (typeof window !== 'undefined' && window.location?.origin) {
        return window.location.origin;
    }

    return 'https://api.doctormarriagebureau.com.pk';
};

const API_BASE = resolveAssetBase();
const DEFAULT_AVATAR = `${API_BASE}/assets/img/avatar-place.png`;
const DEFAULT_FEMALE_AVATAR = `${API_BASE}/assets/img/female-avatar-place.png`;

const humanize = (value: any) => (value ? String(value).replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : null);
const nonEmpty = (value: any) => !(value == null || value === '' || value === 'N/A');

const BiodataPDFTemplate: React.FC<BiodataPDFTemplateProps> = ({ userData }) => {
    if (!userData) return null;

    const {
        member,
        education,
        career,
        families,
        addresses,
        spiritual_backgrounds,
        lifestyles,
        physical_attributes,
        partner_expectations,
    } = userData;

    const age = calculateAgeFromDob(member?.birthday);
    const gender = member?.gender === 2 ? 'Female' : 'Male';
    const defaultAvatar = member?.gender === 2 ? DEFAULT_FEMALE_AVATAR : DEFAULT_AVATAR;
    const rawPhoto = userData?.photo_url || userData?.photo;
    const photoUrl =
        typeof rawPhoto === 'string' &&
        (rawPhoto.startsWith('http://') || rawPhoto.startsWith('https://') || rawPhoto.startsWith('/'))
            ? (rawPhoto.startsWith('/') ? `${API_BASE}${rawPhoto}` : rawPhoto)
            : defaultAvatar;
    const shouldBlurPhoto = Boolean(userData?.profile_photo_blur && photoUrl !== defaultAvatar);

    const presentAddress = addresses?.find((a: any) => a.type === 'present') || addresses?.[0];
    const location = [presentAddress?.city?.name, presentAddress?.country?.name].filter(Boolean).join(', ');

    const primaryEducation = Array.isArray(education)
        ? [...education].sort((a: any, b: any) => (b.end ?? 0) - (a.end ?? 0))[0]
        : education;
    const degree = primaryEducation?.degree || member?.education;

    const primaryCareer = Array.isArray(career)
        ? [...career].sort((a: any, b: any) => Number(Boolean(b.present)) - Number(Boolean(a.present)) || (b.end ?? 0) - (a.end ?? 0))[0]
        : career;
    const profession = primaryCareer?.designation || member?.designation;

    let heightStr = physical_attributes?.height;
    if (typeof heightStr === 'number') {
        heightStr = heightStr > 20 ? `${(heightStr / 30.48).toFixed(1)} cm` : `${heightStr.toFixed(1)}'0"`;
    }

    const familySiblings = (() => {
        if (!families) return null;
        const brothers = Number(families.no_of_brothers ?? 0);
        const sisters = Number(families.no_of_sisters ?? 0);
        if (brothers === 0 && sisters === 0) return 'None';
        const parts = [];
        if (brothers > 0) parts.push(`${brothers} Brother${brothers > 1 ? 's' : ''}`);
        if (sisters > 0) parts.push(`${sisters} Sister${sisters > 1 ? 's' : ''}`);
        return parts.join(' & ');
    })();

    const religion = spiritual_backgrounds?.religion?.name;
    const caste = spiritual_backgrounds?.caste?.name;
    const sect = spiritual_backgrounds?.ethnicity;
    const familyValue = spiritual_backgrounds?.family_value?.name;

    const partnerAgeRange = partner_expectations
        ? `${partner_expectations.min_age || 'Any'} - ${partner_expectations.max_age || 'Any'} yrs`
        : null;

    return (
        <div id="biodata-pdf-content" className="w-[800px] bg-white font-sans text-slate-900 box-border">
            <div className="px-5 py-5">
                <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-4">
                    <div className="min-w-0">
                        <div className="text-[9px] font-black uppercase tracking-[0.5em] text-primary">
                            Doctor Marriage Bureau
                        </div>
                        <h1 className="mt-2 text-[27px] font-black text-slate-900 leading-tight">
                            Biodata Profile
                        </h1>
                        <p className="mt-1 text-[11px] text-slate-500 max-w-xl">
                            A premium matrimonial summary built from your profile data.
                        </p>
                    </div>

                    <div className="shrink-0 text-right">
                        <div className="text-[8px] font-black uppercase tracking-[0.35em] text-slate-400">
                            Profile ID
                        </div>
                        <div className="mt-2 inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-bold text-slate-900 shadow-sm">
                            {userData.code || userData.id}
                        </div>
                    </div>
                </div>

                <div className="mt-4 rounded-[28px] border border-slate-200/80 bg-gradient-to-br from-white via-slate-50/80 to-rose-50/40 p-4 shadow-[0_22px_48px_-36px_rgba(15,23,42,0.45)] break-inside-avoid-page">
                    <div className="grid grid-cols-[92px_minmax(0,1fr)] gap-4 items-start">
                        <div className="relative">
                            <img
                                src={photoUrl}
                                crossOrigin="anonymous"
                                alt="Profile"
                                className={`h-[112px] w-[92px] rounded-[22px] border border-slate-200 bg-slate-100 object-cover shadow-sm ${
                                    shouldBlurPhoto ? 'scale-105 blur-2xl' : ''
                                }`}
                            />
                            <div className="absolute -bottom-2 -right-2 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[9px] font-bold uppercase tracking-wide text-slate-600 shadow-sm">
                                {gender}
                            </div>
                        </div>

                        <div className="min-w-0">
                            <div className="flex flex-wrap items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <h2 className="text-[28px] font-black text-slate-950 leading-tight">
                                        {userData.first_name} {userData.last_name}
                                    </h2>
                                    <p className="mt-1 text-[10px] font-black uppercase tracking-[0.45em] text-primary">
                                        Candidate Summary
                                    </p>
                                </div>
                            </div>

                            <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2">
                                <StatPill icon={<Calendar size={11} />} label={age ? `${age} yrs` : 'Age N/A'} />
                                <StatPill icon={<Globe size={11} />} label={religion || 'Religion N/A'} />
                                <StatPill icon={<Heart size={11} />} label={member?.marital_status?.name || 'Marital Status N/A'} />
                                <StatPill icon={<MapPin size={11} />} label={location || 'Location N/A'} />
                                <StatPill icon={<Briefcase size={11} />} label={profession || 'Profession N/A'} />
                                <StatPill icon={<GraduationCap size={11} />} label={degree || 'Education N/A'} />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-3 grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-3 items-start">
                    <div className="space-y-3">
                        {member?.introduction && (
                            <Section icon={<BookOpen size={13} />} title="About">
                                <div className="rounded-2xl border border-slate-200/70 bg-slate-50/70 p-3 text-[11px] leading-relaxed italic text-slate-600">
                                    "{member.introduction}"
                                </div>
                            </Section>
                        )}

                        <Section icon={<UserCheck size={13} />} title="Basic Information">
                            <FieldGrid>
                                <CompactField label="Gender" value={gender} />
                                <CompactField label="Age" value={age ? `${age} yrs` : null} />
                                <CompactField label="Marital Status" value={member?.marital_status?.name} />
                                <CompactField label="Religion" value={religion} />
                                <CompactField label="Caste" value={caste} />
                                <CompactField label="Mother Tongue" value={member?.mothereTongue?.name} />
                            </FieldGrid>
                        </Section>

                        <Section icon={<GraduationCap size={13} />} title="Education & Career">
                            <div className="space-y-2">
                                <ListSectionLabel icon={<GraduationCap size={11} />} label="Education" />
                                {Array.isArray(education) && education.length > 0 ? (
                                    education.slice(0, 2).map((edu: any, i: number) => (
                                        <ProfileLineItem
                                            key={`edu-${i}`}
                                            accent="sky"
                                            icon={<GraduationCap size={11} />}
                                            title={edu.degree}
                                            subtitle={edu.institution}
                                        />
                                    ))
                                ) : (
                                    <EmptyBlock />
                                )}

                                <ListSectionLabel icon={<Briefcase size={11} />} label="Career" />
                                {Array.isArray(career) && career.length > 0 ? (
                                    career.slice(0, 2).map((job: any, i: number) => (
                                        <ProfileLineItem
                                            key={`career-${i}`}
                                            accent="emerald"
                                            icon={<Briefcase size={11} />}
                                            title={job.designation || job.profession}
                                            subtitle={job.company}
                                        />
                                    ))
                                ) : (
                                    <EmptyBlock />
                                )}
                            </div>
                        </Section>

                        <Section icon={<Users size={13} />} title="Family Information">
                            <FieldGrid columns="grid-cols-2">
                                <CompactField label="Father's Name" value={families?.father_name} />
                                <CompactField label="Father's Occupation" value={families?.father_occupation} />
                                <CompactField label="Mother's Name" value={families?.mother_name} />
                                <CompactField label="Mother's Occupation" value={families?.mother_occupation} />
                                <CompactField label="Siblings" value={familySiblings} />
                                <CompactField label="Family Type" value={humanize(families?.family_type)} />
                                <CompactField className="col-span-2" label="Family Values" value={familyValue} />
                            </FieldGrid>
                        </Section>
                    </div>

                    <div className="space-y-3">
                        <Section icon={<Star size={13} />} title="Religious & Residence">
                            <div className="space-y-3">
                                <FieldGrid columns="grid-cols-2">
                                    <CompactField label="Religion" value={religion} />
                                    <CompactField label="Caste" value={caste} />
                                    <CompactField className="col-span-2" label="Sect / Ethnicity" value={sect} />
                                </FieldGrid>
                                <FieldGrid columns="grid-cols-2">
                                    <CompactField label="Country" value={presentAddress?.country?.name} />
                                    <CompactField label="City" value={presentAddress?.city?.name} />
                                    <CompactField className="col-span-2" label="Nationality" value={member?.nationality} />
                                </FieldGrid>
                            </div>
                        </Section>

                        <Section icon={<Ruler size={13} />} title="Physical & Lifestyle">
                            <div className="space-y-3">
                                <FieldGrid columns="grid-cols-3">
                                    <CompactField label="Height" value={heightStr} />
                                    <CompactField label="Weight" value={physical_attributes?.weight ? `${physical_attributes.weight} kg` : null} />
                                    <CompactField label="Complexion" value={humanize(physical_attributes?.complexion)} />
                                    <CompactField label="Body Type" value={humanize(physical_attributes?.body_type)} />
                                    <CompactField label="Eye Color" value={humanize(physical_attributes?.eye_color)} />
                                    <CompactField label="Hair Color" value={humanize(physical_attributes?.hair_color)} />
                                </FieldGrid>
                                <FieldGrid columns="grid-cols-2">
                                    <CompactField label="Diet" value={humanize(lifestyles?.diet)} />
                                    <CompactField label="Living With" value={humanize(lifestyles?.living_with)} />
                                    <CompactField label="Smoke" value={humanize(lifestyles?.smoke)} />
                                    <CompactField label="Drink" value={humanize(lifestyles?.drink)} />
                                    <CompactField label="Sleep Schedule" value={humanize(lifestyles?.sleep_schedule)} />
                                    <CompactField label="Property / House" value={humanize(lifestyles?.property)} />
                                </FieldGrid>
                            </div>
                        </Section>

                        {partner_expectations && (
                            <Section icon={<Heart size={13} />} title="Partner Expectations" accent>
                                <div className="space-y-3">
                                    <FieldGrid columns="grid-cols-3" accent>
                                        <AccentField label="Age Range" value={partnerAgeRange} />
                                        <AccentField label="Height" value={partner_expectations.height || null} />
                                        <AccentField label="Religion" value={partner_expectations.religion?.name || null} />
                                        <AccentField label="Marital Status" value={partner_expectations.marital_status?.name || null} />
                                        <AccentField label="Caste" value={partner_expectations.caste?.name || null} />
                                        <AccentField label="Residence" value={partner_expectations.residence_country?.name || null} />
                                        <AccentField label="Education" value={partner_expectations.education || null} />
                                        <AccentField label="Language" value={partner_expectations.member_language?.name || null} />
                                        <AccentField label="Family Values" value={partner_expectations.family_value?.name || null} />
                                    </FieldGrid>
                                    {partner_expectations.general && (
                                        <div className="rounded-2xl border border-rose-200/70 bg-white/80 p-3">
                                            <div className="text-[8px] font-black uppercase tracking-[0.35em] text-rose-500">
                                                Ideal Partner
                                            </div>
                                            <div className="mt-1 text-[11px] italic leading-relaxed text-rose-900/80">
                                                "{partner_expectations.general}"
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </Section>
                        )}
                    </div>
                </div>

                <div className="mt-4 border-t border-slate-200 pt-3 text-center">
                    <div className="text-[9px] font-black uppercase tracking-[0.35em] text-slate-700">
                        Doctor Marriage Bureau
                    </div>
                    <p className="mt-1 text-[7px] text-slate-400">
                        This document is confidential. Please respect privacy and do not distribute without permission.
                    </p>
                </div>
            </div>
        </div>
    );
};

function Section({
    icon,
    title,
    children,
    accent = false,
}: {
    icon: React.ReactNode;
    title: string;
    children: React.ReactNode;
    accent?: boolean;
}) {
    return (
        <section
            className={`break-inside-avoid-page rounded-[22px] border p-3 shadow-sm ${
                accent
                    ? 'border-rose-200/80 bg-rose-50/50'
                    : 'border-slate-200/80 bg-white'
            }`}
        >
            <div className="mb-2 flex items-center gap-2">
                <span className={accent ? 'text-rose-500' : 'text-slate-400'}>{icon}</span>
                <h3
                    className={`text-[10px] font-black uppercase tracking-[0.32em] ${
                        accent ? 'text-rose-600' : 'text-slate-500'
                    }`}
                >
                    {title}
                </h3>
            </div>
            {children}
        </section>
    );
}

function FieldGrid({
    children,
    columns = 'grid-cols-2',
    accent = false,
}: {
    children: React.ReactNode;
    columns?: string;
    accent?: boolean;
}) {
    return <div className={`grid ${columns} gap-2.5`}>{children}</div>;
}

function CompactField({
    label,
    value,
    className = '',
}: {
    label: string;
    value: any;
    className?: string;
}) {
    const text = renderValue(value);
    if (!text) return null;

    return (
        <div className={`rounded-2xl border border-slate-200/70 bg-slate-50/70 px-2.5 py-2 ${className}`}>
            <div className="text-[7px] font-black uppercase tracking-[0.8px] text-slate-400">
                {label}
            </div>
            <div className="mt-0.5 text-[10px] font-semibold leading-tight text-slate-800">
                {text}
            </div>
        </div>
    );
}

function AccentField({
    label,
    value,
    className = '',
}: {
    label: string;
    value: any;
    className?: string;
}) {
    const text = renderValue(value);
    if (!text) return null;

    return (
        <div className={`rounded-2xl border border-rose-200/70 bg-white/75 px-2.5 py-2 ${className}`}>
            <div className="text-[7px] font-black uppercase tracking-[0.8px] text-rose-400">
                {label}
            </div>
            <div className="mt-0.5 text-[10px] font-semibold leading-tight text-rose-950">
                {text}
            </div>
        </div>
    );
}

function ListSectionLabel({ icon, label }: { icon: React.ReactNode; label: string }) {
    return (
        <div className="flex items-center gap-1.5">
            <span className="text-slate-400">{icon}</span>
            <div className="text-[8px] font-black uppercase tracking-[0.35em] text-slate-400">
                {label}
            </div>
        </div>
    );
}

function ProfileLineItem({
    icon,
    title,
    subtitle,
    accent,
}: {
    icon: React.ReactNode;
    title: any;
    subtitle?: any;
    accent: 'sky' | 'emerald';
}) {
    const text = renderValue(title);
    if (!text) return null;

    const accentClasses =
        accent === 'sky'
            ? 'border-sky-200/70 bg-sky-50/60 text-sky-600'
            : 'border-emerald-200/70 bg-emerald-50/60 text-emerald-600';

    return (
        <div className="flex items-start gap-2 rounded-2xl border border-slate-200/70 bg-slate-50/60 px-2.5 py-2.5">
            <div className={`mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-xl border ${accentClasses}`}>
                {icon}
            </div>
            <div className="min-w-0 flex-1">
                <div className="text-[11px] font-bold leading-tight text-slate-900">
                    {text}
                </div>
                {renderValue(subtitle) && (
                    <div className="mt-0.5 text-[8px] uppercase tracking-[0.35em] text-slate-500">
                        {renderValue(subtitle)}
                    </div>
                )}
            </div>
        </div>
    );
}

function EmptyBlock() {
    return (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 px-3 py-2 text-[10px] italic text-slate-400">
            N/A
        </div>
    );
}

function StatPill({ icon, label }: { icon: React.ReactNode; label: string }) {
    return (
        <div className="inline-flex min-w-0 items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[10px] font-semibold text-slate-700 shadow-sm">
            <span className="text-slate-400">{icon}</span>
            <span className="truncate">{label}</span>
        </div>
    );
}

function renderValue(value: any) {
    if (value == null || value === '' || value === 'N/A' || value === 0) return null;
    if (typeof value === 'object' && value?.name) return String(value.name);
    return String(value);
}

export default BiodataPDFTemplate;
