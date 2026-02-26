import React from 'react';
import { User, MapPin, Briefcase, GraduationCap, Heart, Calendar, FileText, Ruler, Eye, Home, BookOpen, UserCheck, Star, Globe, Utensils, Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface BiodataPDFTemplateProps {
    userData: any;
}

const API_BASE = import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'https://api.doctormarriagebureau.com.pk';
const DEFAULT_AVATAR = `${API_BASE}/assets/img/avatar-place.png`;
const DEFAULT_FEMALE_AVATAR = `${API_BASE}/assets/img/female-avatar-place.png`;

/** Humanise raw DB values like "early_bird" → "Early Bird" */
const fmt = (v: any) => v ? String(v).replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : 'N/A';

const BiodataPDFTemplate: React.FC<BiodataPDFTemplateProps> = ({ userData }) => {
    const { t } = useTranslation();

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
        hobbies
    } = userData;

    const age = member?.birthday
        ? new Date().getFullYear() - new Date(member.birthday).getFullYear()
        : null;

    const presentAddress = addresses?.find((a: any) => a.type === 'present') || addresses?.[0];
    const location = [presentAddress?.city?.name, presentAddress?.country?.name].filter(Boolean).join(', ');

    const primaryEducation = Array.isArray(education) ? education.sort((a, b) => b.end - a.end)[0] : education;
    const degree = primaryEducation?.degree || member?.education;

    const primaryCareer = Array.isArray(career) ? career.sort((a, b) => b.present ? 1 : -1)[0] : career;
    const profession = primaryCareer?.designation || member?.designation;

    let heightStr = physical_attributes?.height;
    if (typeof heightStr === 'number') {
        heightStr = heightStr > 20 ? (heightStr / 30.48).toFixed(1) + ' cm' : heightStr.toFixed(1) + "'0\"";
    }

    const gender = member?.gender === 2 ? 'Female' : 'Male';
    const defaultAvatar = member?.gender === 2 ? DEFAULT_FEMALE_AVATAR : DEFAULT_AVATAR;
    const photoUrl = userData?.photo ? `${API_BASE}/${userData.photo}` : defaultAvatar;

    return (
        <div id="biodata-pdf-content" className="w-[800px] min-h-[1130px] bg-slate-50 font-sans text-slate-800 relative overflow-hidden box-border">
            {/* Background Decoration */}
            <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[50%] bg-primary/10 rounded-full mix-blend-multiply filter blur-[100px] pointer-events-none opacity-70" />
            <div className="absolute top-[20%] right-[-10%] w-[50%] h-[50%] bg-amber-400/10 rounded-full mix-blend-multiply filter blur-[120px] pointer-events-none opacity-60" />
            <div className="absolute bottom-[-10%] left-[20%] w-[70%] h-[60%] bg-blue-500/10 rounded-full mix-blend-multiply filter blur-[150px] pointer-events-none opacity-50" />
            <div className="absolute inset-0 opacity-[0.015] pointer-events-none" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")` }} />
            <div className="absolute inset-x-5 top-[140px] bottom-5 bg-white/60 backdrop-blur-3xl rounded-3xl border border-white/50 shadow-[0_8px_32px_0_rgba(31,38,135,0.03)] pointer-events-none z-0" />

            <div className="px-6 pt-4 pb-3 relative z-10 h-full flex flex-col">

                {/* ═══ CENTERED BRAND BAR ═══ */}
                <div className="flex items-center justify-center gap-6 mb-3">
                    <img src="/logo-v2.png" alt="Doctor Marriage Bureau" className="h-7 w-auto mix-blend-multiply" />
                    <img src="/sponsor-logo.png" alt="Sponsor" className="h-7 w-auto mix-blend-multiply" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                </div>

                {/* ═══ HEADER BANNER ═══ */}
                <div className="relative rounded-xl bg-slate-900 overflow-hidden mb-3 shrink-0">
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-transparent pointer-events-none" />
                    <div className="px-4 py-3 flex items-center gap-4 relative z-10">
                        <img src={photoUrl} crossOrigin="anonymous" alt="Profile"
                            className="w-16 h-16 rounded-lg border-2 border-white/20 object-cover shadow-lg bg-slate-800" />
                        <div className="flex-1">
                            <h1 className="text-lg font-bold text-white mb-0">{userData.first_name} {userData.last_name}</h1>
                            <div className="text-primary font-bold text-[10px] tracking-widest mb-1.5">PROFILE ID: {userData.code || userData.id}</div>
                            <div className="flex flex-wrap gap-x-4 text-slate-300 text-[10px]">
                                <span><b className="text-white">{age ? `${age} Yrs` : 'N/A'}</b></span>
                                <span className="text-slate-600">&middot;</span>
                                <span><b className="text-white">{spiritual_backgrounds?.religion?.name || 'N/A'}</b></span>
                                <span className="text-slate-600">&middot;</span>
                                <span><b className="text-white">{member?.marital_status?.name || 'N/A'}</b></span>
                                <span className="text-slate-600">&middot;</span>
                                <span><b className="text-white">{location || 'N/A'}</b></span>
                                <span className="text-slate-600">&middot;</span>
                                <span><b className="text-white">{profession || 'N/A'}</b></span>
                                <span className="text-slate-600">&middot;</span>
                                <span><b className="text-white">{degree || 'N/A'}</b></span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ═══ CONTENT GRID ═══ */}
                <div className="flex-1 flex flex-col gap-2.5">

                    {/* About */}
                    {member?.introduction && (
                        <Section icon={<BookOpen size={13} />} title="About">
                            <div className="text-[10px] text-slate-500 italic bg-white/80 p-2.5 rounded-md border border-slate-200/60 leading-relaxed">
                                "{member.introduction}"
                            </div>
                        </Section>
                    )}

                    {/* ── Row 1: Basic Information (full width, 6-col) ── */}
                    <Section icon={<UserCheck size={13} />} title="Basic Information">
                        <div className="grid grid-cols-6 gap-1.5">
                            <Cell label="Gender" value={gender} />
                            <Cell label="Age" value={age ? `${age} yrs` : null} />
                            <Cell label="Marital Status" value={member?.marital_status?.name} />
                            <Cell label="Religion" value={spiritual_backgrounds?.religion?.name} />
                            <Cell label="Caste" value={spiritual_backgrounds?.caste?.name} />
                            <Cell label="Mother Tongue" value={member?.mothereTongue?.name} />
                        </div>
                    </Section>

                    {/* ── Row 2: Education | Career ── */}
                    <div className="grid grid-cols-2 gap-3">
                        <Section icon={<GraduationCap size={13} />} title="Education">
                            <div className="space-y-1.5">
                                {Array.isArray(education) && education.length > 0 ? education.slice(0, 2).map((edu: any, i: number) => (
                                    <div key={i} className="bg-sky-50/80 border border-sky-200/60 rounded-md px-2.5 py-1.5 flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-full bg-sky-100 text-sky-600 flex items-center justify-center shrink-0">
                                            <GraduationCap size={11} />
                                        </div>
                                        <div>
                                            <div className="font-bold text-slate-900 text-[10px] leading-tight">{edu.degree}</div>
                                            {edu.institution && <div className="text-[8px] text-slate-500 uppercase tracking-wider">{edu.institution}</div>}
                                        </div>
                                    </div>
                                )) : <div className="text-[9px] text-slate-400 italic bg-white p-2 rounded-md border border-slate-200/60">N/A</div>}
                            </div>
                        </Section>
                        <Section icon={<Briefcase size={13} />} title="Career">
                            <div className="space-y-1.5">
                                {Array.isArray(career) && career.length > 0 ? career.slice(0, 2).map((job: any, i: number) => (
                                    <div key={i} className="bg-emerald-50/80 border border-emerald-200/60 rounded-md px-2.5 py-1.5 flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                                            <Briefcase size={11} />
                                        </div>
                                        <div>
                                            <div className="font-bold text-slate-900 text-[10px] leading-tight">{job.designation || job.profession}</div>
                                            {job.company && <div className="text-[8px] text-slate-500 uppercase tracking-wider">{job.company}</div>}
                                        </div>
                                    </div>
                                )) : <div className="text-[9px] text-slate-400 italic bg-white p-2 rounded-md border border-slate-200/60">N/A</div>}
                            </div>
                        </Section>
                    </div>

                    {/* ── Row 3: Religious Context | Residence (3+3 balanced) ── */}
                    <div className="grid grid-cols-2 gap-3">
                        <Section icon={<Star size={13} />} title="Religious Context">
                            <div className="grid grid-cols-2 gap-1.5">
                                <Cell label="Religion" value={spiritual_backgrounds?.religion?.name} />
                                <Cell label="Caste" value={spiritual_backgrounds?.caste?.name} />
                                <Cell className="col-span-2" label="Sect / Ethnicity" value={spiritual_backgrounds?.ethnicity} />
                            </div>
                        </Section>
                        <Section icon={<Globe size={13} />} title="Residence">
                            <div className="grid grid-cols-2 gap-1.5">
                                <Cell label="Country" value={presentAddress?.country?.name} />
                                <Cell label="City" value={presentAddress?.city?.name} />
                                <Cell className="col-span-2" label="Nationality" value={member?.nationality} />
                            </div>
                        </Section>
                    </div>

                    {/* ── Row 4: Physical Appearance | Lifestyle (6+6 balanced) ── */}
                    <div className="grid grid-cols-2 gap-3">
                        <Section icon={<Ruler size={13} />} title="Physical Appearance">
                            <div className="grid grid-cols-3 gap-1.5">
                                <Cell label="Height" value={heightStr} />
                                <Cell label="Weight" value={physical_attributes?.weight ? `${physical_attributes.weight} kg` : null} />
                                <Cell label="Complexion" value={fmt(physical_attributes?.complexion)} />
                                <Cell label="Body Type" value={fmt(physical_attributes?.body_type)} />
                                <Cell label="Eye Color" value={fmt(physical_attributes?.eye_color)} />
                                <Cell label="Hair Color" value={fmt(physical_attributes?.hair_color)} />
                            </div>
                        </Section>
                        <Section icon={<Utensils size={13} />} title="Lifestyle">
                            <div className="grid grid-cols-2 gap-1.5">
                                <Cell label="Diet" value={fmt(lifestyles?.diet)} />
                                <Cell label="Living With" value={fmt(lifestyles?.living_with)} />
                                <Cell label="Smoke" value={fmt(lifestyles?.smoke)} />
                                <Cell label="Drink" value={fmt(lifestyles?.drink)} />
                                <Cell label="Sleep Schedule" value={fmt(lifestyles?.sleep_schedule)} />
                                <Cell label="Property / House" value={fmt(lifestyles?.property)} />
                            </div>
                        </Section>
                    </div>

                    {/* ── Row 5: Family Information (full width) ── */}
                    <Section icon={<Users size={13} />} title="Family Information">
                        <div className="grid grid-cols-4 gap-1.5">
                            <Cell label="Father's Name" value={families?.father_name} />
                            <Cell label="Father's Occupation" value={families?.father_occupation} />
                            <Cell label="Mother's Name" value={families?.mother_name} />
                            <Cell label="Mother's Occupation" value={families?.mother_occupation} />
                            <Cell label="Siblings" value={
                                families ? (
                                    (families.no_of_brothers > 0 ? `${families.no_of_brothers} Brother(s)` : '') +
                                    (families.no_of_brothers > 0 && families.no_of_sisters > 0 ? ' & ' : '') +
                                    (families.no_of_sisters > 0 ? `${families.no_of_sisters} Sister(s)` : '') || 'None'
                                ) : null
                            } />
                            <Cell label="Family Type" value={fmt(families?.family_type)} />
                            <Cell className="col-span-2" label="Family Values" value={spiritual_backgrounds?.family_value?.name} />
                        </div>
                    </Section>

                    {/* ── Row 6: Partner Expectations (full width, accented) ── */}
                    {partner_expectations && (
                        <div>
                            <div className="flex items-center gap-1.5 mb-1">
                                <Heart size={13} className="text-rose-500" />
                                <h3 className="text-[9px] font-bold text-rose-600 uppercase tracking-widest">Partner Expectations</h3>
                            </div>
                            <div className="p-2.5 bg-rose-50/80 border border-rose-200/50 rounded-lg">
                                <div className="grid grid-cols-3 gap-1.5">
                                    <RoseCell label="Age Range" value={`${partner_expectations.min_age || 'Any'} - ${partner_expectations.max_age || 'Any'} yrs`} />
                                    <RoseCell label="Height" value={`${partner_expectations.height || 'Any'} - ${partner_expectations.height_max || 'Any'}`} />
                                    <RoseCell label="Religion" value={partner_expectations.religion?.name || 'Any'} />
                                    <RoseCell label="Marital Status" value={partner_expectations.marital_status?.name || 'Any'} />
                                    <RoseCell label="Caste" value={partner_expectations.caste?.name || 'Any'} />
                                    <RoseCell label="Residence" value={partner_expectations.residence_country?.name || 'Any'} />
                                    <RoseCell label="Education" value={partner_expectations.education || 'Any'} />
                                    <RoseCell label="Language" value={partner_expectations.member_language?.name || 'Any'} />
                                    <RoseCell label="Family Values" value={partner_expectations.family_value?.name || 'Any'} />
                                </div>
                                {partner_expectations.general && (
                                    <div className="mt-1.5 pt-1.5 border-t border-rose-200/50">
                                        <div className="text-[8px] font-bold text-rose-500 uppercase tracking-wider mb-0.5">Ideal Partner</div>
                                        <div className="text-[9px] italic text-rose-900/80 leading-snug">"{partner_expectations.general}"</div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* ═══ FOOTER ═══ */}
                <div className="mt-auto pt-2.5 border-t border-slate-200/60 pb-1 text-center shrink-0">
                    <span className="text-[9px] font-bold text-slate-700 tracking-wide">Doctor Marriage Bureau</span>
                    <p className="text-[7px] text-slate-400 mt-0.5">
                        This document is confidential. Please respect privacy and do not distribute without permission.
                    </p>
                </div>
            </div>
        </div>
    );
};

/* ─── Sub-components ──────────────────────────────────────── */

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
    return (
        <div>
            <div className="flex items-center gap-1 mb-1">
                <span className="text-slate-400">{icon}</span>
                <h3 className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{title}</h3>
            </div>
            {children}
        </div>
    );
}

function Cell({ label, value, className = '' }: { label: string; value: any; className?: string }) {
    return (
        <div className={`bg-white/80 border border-slate-200/60 rounded-md px-2 py-1.5 ${className}`}>
            <div className="text-[7px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">{label}</div>
            <div className="text-[10px] font-semibold text-slate-800">{value ?? 'N/A'}</div>
        </div>
    );
}

function RoseCell({ label, value }: { label: string; value: string }) {
    return (
        <div>
            <div className="text-[7px] font-bold text-rose-400 uppercase tracking-wider mb-0.5">{label}</div>
            <div className="text-[10px] font-semibold text-rose-950">{value}</div>
        </div>
    );
}

export default BiodataPDFTemplate;
