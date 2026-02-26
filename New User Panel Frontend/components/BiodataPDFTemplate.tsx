import React from 'react';
import { User, MapPin, Briefcase, GraduationCap, Heart, Calendar, FileText, Ruler, Eye, Home, BookOpen, UserCheck, Star, Globe } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface BiodataPDFTemplateProps {
    userData: any;
}

const API_BASE = import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'https://api.doctormarriagebureau.com.pk';
const DEFAULT_AVATAR = `${API_BASE}/assets/img/avatar-place.png`;
const DEFAULT_FEMALE_AVATAR = `${API_BASE}/assets/img/female-avatar-place.png`;

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

    // Computed values
    const age = member?.birthday ?
        new Date().getFullYear() - new Date(member.birthday).getFullYear() :
        null;

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
        <div id="biodata-pdf-content" className="w-[800px] h-[1120px] bg-slate-50 font-sans text-slate-800 relative overflow-hidden box-border">
            {/* Premium Mesh Gradient Orbs */}
            <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[50%] bg-primary/10 rounded-full mix-blend-multiply filter blur-[100px] pointer-events-none opacity-70"></div>
            <div className="absolute top-[20%] right-[-10%] w-[50%] h-[50%] bg-amber-400/10 rounded-full mix-blend-multiply filter blur-[120px] pointer-events-none opacity-60"></div>
            <div className="absolute bottom-[-10%] left-[20%] w-[70%] h-[60%] bg-blue-500/10 rounded-full mix-blend-multiply filter blur-[150px] pointer-events-none opacity-50"></div>

            {/* Subtle Abstract SVG Pattern Overlay */}
            <div className="absolute inset-0 opacity-[0.015] pointer-events-none" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")` }}></div>

            {/* Glassmorphism Data Panel Backdrop */}
            <div className="absolute inset-x-5 top-[150px] bottom-5 bg-white/60 backdrop-blur-3xl rounded-3xl border border-white/50 shadow-[0_8px_32px_0_rgba(31,38,135,0.03)] pointer-events-none z-0"></div>

            <div className="p-8 relative z-10 h-full flex flex-col">
                {/* Platform Logo */}
                <div className="mb-4 flex justify-center">
                    <img src="/logo-v2.png" alt="Doctor Marriage Bureau" className="h-8 w-auto mix-blend-multiply" />
                </div>

                {/* Header Section Matches Profile Details banner styling */}
                <div className="relative rounded-2xl bg-slate-900 overflow-hidden mb-5 shadow-sm shrink-0">
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-transparent pointer-events-none"></div>
                    <div className="p-5 flex items-center gap-5 relative z-10">
                        <img
                            src={photoUrl}
                            crossOrigin="anonymous"
                            alt="Profile"
                            className="w-24 h-24 rounded-xl border-[3px] border-white/20 object-cover shadow-lg bg-slate-800"
                        />
                        <div className="flex-1">
                            <h1 className="text-2xl font-bold text-white mb-1">{userData.first_name} {userData.last_name}</h1>
                            <div className="text-primary font-bold text-xs mb-2">PROFILE ID: {userData.code || userData.id}</div>

                            <div className="flex flex-wrap gap-x-5 gap-y-1 text-slate-300 text-[11px]">
                                <div className="flex items-center gap-1.5">
                                    <Calendar size={12} className="text-primary" /> {age ? `${age} Yrs` : 'N/A'}
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <Heart size={12} className="text-primary" /> {member?.marital_status?.name || 'N/A'}
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <MapPin size={12} className="text-primary" /> {location || 'N/A'}
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <Briefcase size={12} className="text-primary" /> {profession || 'N/A'}
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <GraduationCap size={12} className="text-primary" /> {degree || 'N/A'}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex-1 grid grid-cols-2 gap-x-6 gap-y-4 content-start">
                    {/* About */}
                    {member?.introduction && (
                        <div className="col-span-2">
                            <SectionHeader icon={<BookOpen size={14} />} title="About" />
                            <div className="text-[11px] text-slate-600 bg-white p-3 rounded-lg border border-slate-200/60 leading-relaxed shadow-sm">
                                {member.introduction}
                            </div>
                        </div>
                    )}

                    {/* Basic Info */}
                    <div className="col-span-2">
                        <SectionHeader icon={<UserCheck size={14} />} title="Basic Information" />
                        <div className="grid grid-cols-4 gap-2">
                            <InfoBox label="Gender" value={gender} />
                            <InfoBox label="Age" value={age ? `${age} yrs` : null} />
                            <InfoBox label="Marital Status" value={member?.marital_status?.name} />
                            <InfoBox label="Mother Tongue" value={member?.mothereTongue?.name} />
                        </div>
                    </div>

                    {/* Education */}
                    <div>
                        <SectionHeader icon={<GraduationCap size={14} />} title="Education" />
                        <div className="space-y-2">
                            {Array.isArray(education) && education.length > 0 ? education.slice(0, 2).map((edu: any, i: number) => (
                                <div key={i} className="bg-white p-2.5 rounded-lg border border-slate-200/60 flex gap-2.5 items-center shadow-sm">
                                    <div className="w-7 h-7 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                                        <GraduationCap size={12} />
                                    </div>
                                    <div>
                                        <div className="font-bold text-slate-900 text-[11px] leading-tight">{edu.degree}</div>
                                        <div className="text-[9px] text-slate-500 uppercase tracking-wider leading-tight mt-0.5">{edu.institution}</div>
                                    </div>
                                </div>
                            )) : <div className="text-[10px] text-slate-400 italic bg-white p-3 rounded-lg border border-slate-200/60">No education data</div>}
                        </div>
                    </div>

                    {/* Career */}
                    <div>
                        <SectionHeader icon={<Briefcase size={14} />} title="Career" />
                        <div className="space-y-2">
                            {Array.isArray(career) && career.length > 0 ? career.slice(0, 2).map((job: any, i: number) => (
                                <div key={i} className="bg-white p-2.5 rounded-lg border border-slate-200/60 flex gap-2.5 items-center shadow-sm">
                                    <div className="w-7 h-7 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                                        <Briefcase size={12} />
                                    </div>
                                    <div>
                                        <div className="font-bold text-slate-900 text-[11px] leading-tight">{job.designation || job.profession}</div>
                                        <div className="text-[9px] text-slate-500 uppercase tracking-wider leading-tight mt-0.5">{job.company || 'Private Practice / Hospital'}</div>
                                    </div>
                                </div>
                            )) : <div className="text-[10px] text-slate-400 italic bg-white p-3 rounded-lg border border-slate-200/60">No career data</div>}
                        </div>
                    </div>

                    {/* Religious & Status Context */}
                    <div>
                        <SectionHeader icon={<Star size={14} />} title="Religious Context" />
                        <div className="grid grid-cols-2 gap-2">
                            <InfoBox label="Religion" value={spiritual_backgrounds?.religion?.name} />
                            <InfoBox label="Caste" value={spiritual_backgrounds?.caste?.name} />
                            <InfoBox className="col-span-2" label="Sect / Ethnicity" value={spiritual_backgrounds?.ethnicity} />
                        </div>
                    </div>

                    {/* Looks */}
                    <div>
                        <SectionHeader icon={<Ruler size={14} />} title="Physical Appearance" />
                        <div className="grid grid-cols-3 gap-2">
                            <InfoBox label="Height" value={heightStr} />
                            <InfoBox label="Weight" value={physical_attributes?.weight ? `${physical_attributes.weight} kg` : null} />
                            <InfoBox label="Complexion" value={physical_attributes?.complexion} />
                        </div>
                    </div>

                    {/* Residence */}
                    <div>
                        <SectionHeader icon={<Globe size={14} />} title="Residence" />
                        <div className="grid grid-cols-2 gap-2">
                            <InfoBox label="Country" value={presentAddress?.country?.name} />
                            <InfoBox label="City" value={presentAddress?.city?.name} />
                            <InfoBox className="col-span-2" label="Nationality" value={member?.nationality} />
                        </div>
                    </div>

                    {/* Family */}
                    <div>
                        <SectionHeader icon={<Home size={14} />} title="Family Details" />
                        <div className="grid grid-cols-2 gap-2">
                            <InfoBox label="Father's Name" value={families?.father_name} />
                            <InfoBox label="Father's Occupation" value={families?.father_occupation} />
                            <InfoBox label="Mother's Name" value={families?.mother_name} />
                            <InfoBox label="Mother's Occupation" value={families?.mother_occupation} />
                            <InfoBox label="Siblings" value={
                                families ? (
                                    (families.no_of_brothers > 0 ? `${families.no_of_brothers} Bro` : '') +
                                    (families.no_of_brothers > 0 && families.no_of_sisters > 0 ? ' & ' : '') +
                                    (families.no_of_sisters > 0 ? `${families.no_of_sisters} Sis` : '') || 'None'
                                ) : null
                            } />
                            <InfoBox label="Family Type" value={families?.family_type} />
                        </div>
                    </div>

                    {/* Lifestyle */}
                    <div>
                        <SectionHeader icon={<Star size={14} />} title="Lifestyle" />
                        <div className="grid grid-cols-2 gap-2">
                            <InfoBox label="Diet" value={lifestyles?.diet} />
                            <InfoBox label="Living With" value={lifestyles?.living_with} />
                            <InfoBox label="Smoke" value={lifestyles?.smoke} />
                            <InfoBox label="Drink" value={lifestyles?.drink} />
                            <InfoBox label="Sleep Schedule" value={lifestyles?.sleep_schedule} />
                            <InfoBox label="Property / House" value={lifestyles?.property} />
                        </div>
                    </div>

                    {/* Partner Expectations (highlighted section) */}
                    {partner_expectations && (
                        <div className="col-span-2 mt-2">
                            <div className="flex items-center gap-1.5 mb-2">
                                <Heart size={14} className="text-primary" />
                                <h3 className="text-[10px] font-bold text-primary uppercase tracking-wider">Partner Expectations</h3>
                            </div>
                            <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl shadow-sm">
                                <div className="grid grid-cols-3 gap-3">
                                    <div>
                                        <div className="text-[9px] font-bold text-rose-500 uppercase tracking-wider mb-0.5">Age Range</div>
                                        <div className="text-[11px] font-semibold text-rose-950">{partner_expectations.min_age || 'Any'} - {partner_expectations.max_age || 'Any'} yrs</div>
                                    </div>
                                    <div>
                                        <div className="text-[9px] font-bold text-rose-500 uppercase tracking-wider mb-0.5">Height</div>
                                        <div className="text-[11px] font-semibold text-rose-950">{partner_expectations.height || 'Any'} - {partner_expectations.height_max || 'Any'}</div>
                                    </div>
                                    <div>
                                        <div className="text-[9px] font-bold text-rose-500 uppercase tracking-wider mb-0.5">Religion</div>
                                        <div className="text-[11px] font-semibold text-rose-950">{partner_expectations.religion?.name || 'Any'}</div>
                                    </div>
                                    <div>
                                        <div className="text-[9px] font-bold text-rose-500 uppercase tracking-wider mb-0.5">Marital Status</div>
                                        <div className="text-[11px] font-semibold text-rose-950">{partner_expectations.marital_status?.name || 'Any'}</div>
                                    </div>
                                    <div>
                                        <div className="text-[9px] font-bold text-rose-500 uppercase tracking-wider mb-0.5">Caste</div>
                                        <div className="text-[11px] font-semibold text-rose-950">{partner_expectations.caste?.name || 'Any'}</div>
                                    </div>
                                    <div>
                                        <div className="text-[9px] font-bold text-rose-500 uppercase tracking-wider mb-0.5">Residence</div>
                                        <div className="text-[11px] font-semibold text-rose-950">{partner_expectations.residence_country?.name || 'Any'}</div>
                                    </div>
                                    <div>
                                        <div className="text-[9px] font-bold text-rose-500 uppercase tracking-wider mb-0.5">Education</div>
                                        <div className="text-[11px] font-semibold text-rose-950">{partner_expectations.education || 'Any'}</div>
                                    </div>
                                    <div>
                                        <div className="text-[9px] font-bold text-rose-500 uppercase tracking-wider mb-0.5">Language</div>
                                        <div className="text-[11px] font-semibold text-rose-950">{partner_expectations.member_language?.name || 'Any'}</div>
                                    </div>
                                    <div>
                                        <div className="text-[9px] font-bold text-rose-500 uppercase tracking-wider mb-0.5">Family Values</div>
                                        <div className="text-[11px] font-semibold text-rose-950">{partner_expectations.family_value?.name || 'Any'}</div>
                                    </div>
                                </div>

                                {partner_expectations.general && (
                                    <div className="mt-2 border-t border-rose-200/50 pt-2">
                                        <div className="text-[9px] font-bold text-rose-500 uppercase tracking-wider mb-1">Describe Your Ideal Partner</div>
                                        <div className="text-[10px] italic text-rose-900/80 leading-snug">"{partner_expectations.general}"</div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="mt-auto pt-4 border-t border-slate-200/60 pb-2">
                    <div className="text-center mb-1">
                        <span className="text-[10px] font-bold text-slate-700">Doctor Marriage Bureau</span>
                    </div>
                    <p className="text-[9px] text-slate-400 flex justify-between">
                        <span>Generated securely via Doctor Marriage Bureau.</span>
                        <span>CONFIDENTIAL DOCUMENT</span>
                    </p>
                </div>
            </div>
        </div>
    );
};

// Sub-components
function SectionHeader({ icon, title }: { icon: React.ReactNode, title: string }) {
    return (
        <div className="flex items-center gap-1.5 mb-2">
            <span className="text-slate-400">{icon}</span>
            <h3 className="text-[10px] font-bold text-slate-800 uppercase tracking-wider">{title}</h3>
        </div>
    );
}

function InfoBox({ label, value, subtext, className = '' }: { label: string, value: any, subtext?: string, className?: string }) {
    if (value === undefined || value === null || value === '') {
        value = 'N/A';
    }
    return (
        <div className={`bg-white border border-slate-200/60 rounded-lg p-2.5 shadow-sm ${className}`}>
            <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">{label}</div>
            <div className="text-[12px] font-bold text-slate-700">{value}</div>
            {subtext && <div className="text-[9px] text-slate-500 mt-0.5 leading-tight line-clamp-1">{subtext}</div>}
        </div>
    );
}

export default BiodataPDFTemplate;
