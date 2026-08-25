import React, { useState, useEffect } from 'react';
import type { ProposalProfile } from '../../types/proposal';
import { Stethoscope, MapPin, GraduationCap, ShieldCheck, ChevronLeft, ChevronRight, Lock, HeartHandshake, User } from 'lucide-react';
import { isFemaleGender, normalizeGender } from '../../lib/gender';
import { api } from '../../lib/api/client';
import { errorMessage } from '../../lib/dashboard/common';

export default function ProposalsCarousel() {
  const [proposals, setProposals] = useState<ProposalProfile[]>([]);
  const [activeFilter, setActiveFilter] = useState<'all' | 'female' | 'male'>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scrollIndex, setScrollIndex] = useState(0);

  useEffect(() => {
    async function fetchLiveProposals() {
      try {
        setLoading(true);
        setError(null);
        // Public proposals — real, API-driven. Uses the shared axios client so it
        // targets the configured API base URL. Falls back to discovery for authed users.
        let data: ProposalProfile[] = [];
        try {
          const res = await api.get('/public/proposals');
          const arr = Array.isArray(res.data?.data)
            ? res.data.data
            : Array.isArray(res.data)
              ? res.data
              : [];
          if (arr.length) data = arr;
        } catch {
          // ignore, try discovery below
        }
        if (!data.length) {
          try {
            const res = await api.get('/discovery', { params: { per_page: 12 } });
            const d: any = res.data?.data ?? res.data;
            const items = Array.isArray(d?.items) ? d.items : Array.isArray(d) ? d : [];
            if (items.length) {
              data = items.map((it: any) => ({
                id: String(it.user_id ?? it.id),
                gender: it.gender ?? 'female',
                age: it.age ?? 27,
                city: [it.city_name, it.country_name].filter(Boolean).join(', ') || 'Pakistan',
                profession: it.speciality ? `Doctor — ${it.speciality}` : 'Doctor',
                education: it.degree ?? 'MBBS',
                specialization: it.speciality ?? 'General Medicine',
                marital_status: it.marital_status ?? 'Single (Never Married)',
                sect: it.religion ?? 'Sunni Muslim',
                height: it.height ? `${Math.floor(Number(it.height)/12)}'${Number(it.height)%12}"` : "5' 6\"",
              }));
            }
          } catch {
            // discovery requires auth; ignore for public carousel
          }
        }
        setProposals(data);
        if (!data.length) setError(null);
      } catch (err: any) {
        setError(errorMessage(err, 'Unable to load live proposals.'));
      } finally {
        setLoading(false);
      }
    }
    fetchLiveProposals();
  }, []);

  const filteredProposals = proposals.filter((p) => {
    if (activeFilter === 'all') return true;
    return normalizeGender(p.gender) === activeFilter;
  });

  const nextSlide = () => {
    setScrollIndex((prev) => (prev + 1) % Math.max(1, filteredProposals.length - 2));
  };

  const prevSlide = () => {
    setScrollIndex((prev) => (prev === 0 ? Math.max(0, filteredProposals.length - 3) : prev - 1));
  };

  if (loading) {
    return (
      <div className="w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="animate-pulse rounded-3xl bg-white border border-brand-100/60 h-80" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return <div className="w-full py-10 text-center text-sm text-brand-600 bg-white rounded-2xl border border-brand-100">{error}</div>;
  }

  if (!filteredProposals.length) {
    return <div className="w-full py-10 text-center text-sm text-navy-500 bg-white rounded-2xl border border-brand-100">No live verified proposals at the moment — check back soon.</div>;
  }

  return (
    <div className="w-full">
      
      {/* Controls Strip: Filters & Navigation */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-10">
        
        {/* Gender Filter Tabs */}
        <div className="inline-flex p-1.5 rounded-full bg-navy-100/80 border border-navy-200/60 shadow-inner">
          <button
            onClick={() => { setActiveFilter('all'); setScrollIndex(0); }}
            className={`px-5 py-2 rounded-full text-xs font-semibold transition-all duration-200 ${
              activeFilter === 'all'
                ? 'bg-white text-brand-600 shadow-md'
                : 'text-navy-700 hover:text-navy-900'
            }`}
          >
            All Doctor Proposals ({proposals.length})
          </button>
          <button
            onClick={() => { setActiveFilter('female'); setScrollIndex(0); }}
            className={`px-5 py-2 rounded-full text-xs font-semibold transition-all duration-200 ${
              activeFilter === 'female'
                ? 'bg-brand-500 text-white shadow-md'
                : 'text-navy-700 hover:text-navy-900'
            }`}
          >
            Female Doctors
          </button>
          <button
            onClick={() => { setActiveFilter('male'); setScrollIndex(0); }}
            className={`px-5 py-2 rounded-full text-xs font-semibold transition-all duration-200 ${
              activeFilter === 'male'
                ? 'bg-navy-800 text-white shadow-md'
                : 'text-navy-700 hover:text-navy-900'
            }`}
          >
            Male Doctors
          </button>
        </div>

        {/* Carousel Prev/Next Buttons */}
        <div className="hidden sm:flex items-center gap-2">
          <button
            onClick={prevSlide}
            className="w-10 h-10 rounded-full border border-navy-200 bg-white hover:bg-brand-50 text-navy-800 hover:text-brand-600 flex items-center justify-center transition-colors shadow-sm"
            aria-label="Previous proposals"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={nextSlide}
            className="w-10 h-10 rounded-full border border-navy-200 bg-white hover:bg-brand-50 text-navy-800 hover:text-brand-600 flex items-center justify-center transition-colors shadow-sm"
            aria-label="Next proposals"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

      </div>

      {/* Proposals Grid / Carousel */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProposals.slice(scrollIndex, scrollIndex + 6).map((item, i) => {
          const isFemale = isFemaleGender(item.gender);
          return (
            <div 
              key={item.id || i}
              className="group rounded-3xl bg-white border border-brand-100/80 p-6 shadow-luxury hover:shadow-luxury-hover transition-all duration-300 transform hover:-translate-y-1 relative overflow-hidden flex flex-col justify-between"
            >
              {/* Top Accent Gradient Bar */}
              <div className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${
                isFemale ? 'from-brand-400 to-rose-500' : 'from-navy-600 to-navy-800'
              }`}></div>

              <div>
                {/* Header: ID, Gender & Verified Badge */}
                <div className="flex justify-between items-start mb-5 pt-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-navy-400 tracking-wider">
                      ID: #{item.id}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                      isFemale ? 'bg-pink-100 text-brand-700' : 'bg-navy-100 text-navy-800'
                    }`}>
                      {isFemale ? 'Doctor (F)' : 'Doctor (M)'}
                    </span>
                  </div>

                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    Verified
                  </span>
                </div>

                {/* Profile Avatar Card with Privacy Blur Effect */}
                <div className="relative mb-5 rounded-2xl overflow-hidden bg-gradient-to-tr from-navy-50 to-brand-50/50 p-6 text-center border border-brand-100/50">
                  <div className="w-20 h-20 mx-auto rounded-full bg-white shadow-md flex items-center justify-center border-2 border-brand-200 mb-3 text-navy-600 relative">
                    <User className="w-10 h-10 text-navy-400" />
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-navy-900 text-white flex items-center justify-center shadow">
                      <Lock className="w-3 h-3 text-brand-300" />
                    </div>
                  </div>

                  <h3 className="text-base font-bold text-navy-950">
                    {item.specialization || item.profession || 'Medical Doctor'}
                  </h3>
                  <p className="text-xs text-navy-500 font-medium mt-0.5">
                    {item.age} Years • {item.height || "5' 6\""}
                  </p>
                </div>

                {/* Details List */}
                <div className="space-y-2.5 text-xs text-navy-700 mb-6">
                  <div className="flex items-center gap-2.5">
                    <GraduationCap className="w-4 h-4 text-brand-500 shrink-0" />
                    <span className="font-semibold text-navy-900">{item.education}</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <MapPin className="w-4 h-4 text-brand-500 shrink-0" />
                    <span>{item.city}</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Stethoscope className="w-4 h-4 text-brand-500 shrink-0" />
                    <span>{item.marital_status || 'Single (Never Married)'}</span>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <a
                href="/register/"
                className="w-full py-2.5 px-4 rounded-xl text-center text-xs font-bold text-navy-900 bg-brand-50 hover:bg-brand-500 hover:text-white border border-brand-200/80 transition-all duration-200 flex items-center justify-center gap-1.5 shadow-sm group-hover:bg-brand-500 group-hover:text-white group-hover:border-transparent"
              >
                <HeartHandshake className="w-4 h-4" />
                <span>Connect with Candidate</span>
              </a>

            </div>
          );
        })}
      </div>

    </div>
  );
}
