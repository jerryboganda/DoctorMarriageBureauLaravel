import React, { useState, useEffect, useRef } from 'react';
import { Search, ChevronDown, Check, X } from 'lucide-react';
import ReactDOM from 'react-dom';
import { countries, Country, saveSelectedCountry } from '../utils/countries';
import { useTranslation } from 'react-i18next';

interface CountryCodeSelectorProps {
    selectedCountry: Country;
    onSelect: (country: Country) => void;
    className?: string;
    variant?: 'default' | 'simple';
}

const CountryCodeSelector: React.FC<CountryCodeSelectorProps> = ({
    selectedCountry,
    onSelect,
    className = '',
    variant = 'default',
}) => {
    const { t } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [isMobile, setIsMobile] = useState(false);
    const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });
    const triggerRef = useRef<HTMLButtonElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const listRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    useEffect(() => {
        if (isOpen) {
            setTimeout(() => {
                searchInputRef.current?.focus();
                if (listRef.current) listRef.current.scrollTop = 0;
            }, 50);
        }
        if (!isOpen) setSearch('');
    }, [isOpen]);

    // Reset scroll to top when search changes
    useEffect(() => {
        requestAnimationFrame(() => {
            if (listRef.current) listRef.current.scrollTop = 0;
        });
    }, [search]);

    // Deduplicate countries by code (priority entries come first and are kept)
    const uniqueCountries = (() => {
        const seen = new Set<string>();
        return countries.filter((c) => {
            if (seen.has(c.code)) return false;
            seen.add(c.code);
            return true;
        });
    })();

    const filteredCountries = (() => {
        const searchTerm = search.toLowerCase().trim();
        if (!searchTerm) return uniqueCountries;

        const cleanSearch = searchTerm.replace(/\D/g, '');

        const matches = uniqueCountries.filter((c) => {
            const cleanDialCode = c.dialCode.replace(/\D/g, '');
            return (
                c.name.toLowerCase().includes(searchTerm) ||
                c.code.toLowerCase().includes(searchTerm) ||
                (cleanSearch !== '' && cleanDialCode.includes(cleanSearch)) ||
                c.dialCode.includes(searchTerm)
            );
        });

        // Sort: name starts-with first, then code exact match, then the rest
        matches.sort((a, b) => {
            const aStartsWith = a.name.toLowerCase().startsWith(searchTerm) ? 0 : 1;
            const bStartsWith = b.name.toLowerCase().startsWith(searchTerm) ? 0 : 1;
            if (aStartsWith !== bStartsWith) return aStartsWith - bStartsWith;

            const aCodeMatch = a.code.toLowerCase() === searchTerm ? 0 : 1;
            const bCodeMatch = b.code.toLowerCase() === searchTerm ? 0 : 1;
            if (aCodeMatch !== bCodeMatch) return aCodeMatch - bCodeMatch;

            return a.name.localeCompare(b.name);
        });

        return matches;
    })();

    const handleSelect = (country: Country) => {
        onSelect(country);
        saveSelectedCountry(country);
        setIsOpen(false);
    };

    const openDropdown = () => {
        if (triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect();
            // Position below the trigger, clamped to viewport
            let top = rect.bottom + 4;
            let left = rect.left;
            const dropdownWidth = 288; // w-72 = 18rem = 288px
            const dropdownHeight = 384; // max-h-96 = 24rem = 384px

            // If it would overflow right, shift left
            if (left + dropdownWidth > window.innerWidth - 16) {
                left = window.innerWidth - dropdownWidth - 16;
            }
            // If it would overflow bottom, show above the trigger
            if (top + dropdownHeight > window.innerHeight - 16) {
                top = rect.top - dropdownHeight - 4;
                if (top < 16) top = 16; // Don't go above viewport
            }
            setDropdownPos({ top, left: Math.max(16, left) });
        }
        setIsOpen(true);
    };

    const FlagIcon = ({ code, size = 'w-5' }: { code: string; size?: string }) => (
        <img
            src={`https://flagcdn.com/w40/${code.toLowerCase()}.png`}
            className={`${size} h-auto rounded-sm shadow-sm object-cover`}
            alt={code}
            loading="lazy"
        />
    );

    const dropdownContent = isOpen ? (
        <>
            {/* Backdrop */}
            <div
                onClick={() => setIsOpen(false)}
                className={`fixed inset-0 z-[9998] ${isMobile ? 'bg-black/40 backdrop-blur-sm' : ''}`}
            />

            {/* Dropdown */}
            <div
                style={!isMobile ? { top: dropdownPos.top, left: dropdownPos.left } : undefined}
                className={`
          ${
              isMobile
                  ? 'fixed bottom-0 left-0 right-0 max-h-[80vh] rounded-t-3xl border-t animate-slide-up'
                  : 'fixed w-72 max-h-96 rounded-xl border shadow-2xl'
          }
          bg-white z-[9999] flex flex-col border-slate-200 overflow-hidden
        `}
            >
                {isMobile && (
                    <div className="flex justify-center p-2">
                        <div className="w-12 h-1.5 bg-slate-200 rounded-full" />
                    </div>
                )}

                {/* Search */}
                <div className="p-3 border-b border-slate-100 flex items-center gap-2 bg-slate-50/50 shrink-0">
                    <div className="relative flex-1">
                        <Search
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                            size={16}
                        />
                        <input
                            ref={searchInputRef}
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder={t('common.searchCountryOrCode')}
                            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                        />
                    </div>
                    {isMobile && (
                        <button
                            onClick={() => setIsOpen(false)}
                            className="p-2 text-slate-400 hover:text-slate-900 transition-colors shrink-0"
                        >
                            <X size={20} />
                        </button>
                    )}
                </div>

                {/* Countries List */}
                <div ref={listRef} className="overflow-y-auto flex-1 py-1">
                    {filteredCountries.length > 0 ? (
                        filteredCountries.map((country) => (
                            <button
                                key={country.code}
                                onClick={() => handleSelect(country)}
                                className={`
                  w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 transition-colors text-left
                  ${selectedCountry.code === country.code ? 'bg-primary/5' : ''}
                `}
                            >
                                <FlagIcon code={country.code} size="w-6" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-slate-900 truncate">
                                        {country.name}
                                    </p>
                                    <p className="text-xs text-slate-500">{country.dialCode}</p>
                                </div>
                                {selectedCountry.code === country.code && (
                                    <Check size={16} className="text-primary shrink-0" />
                                )}
                            </button>
                        ))
                    ) : (
                        <div className="p-8 text-center">
                            <p className="text-sm text-slate-400">{t('common.noCountriesFound')}</p>
                        </div>
                    )}
                </div>
            </div>
        </>
    ) : null;

    return (
        <div className={`relative ${className}`}>
            {/* Trigger */}
            <button
                ref={triggerRef}
                type="button"
                onClick={() => (isOpen ? setIsOpen(false) : openDropdown())}
                className={`flex items-center gap-2 px-3 bg-slate-50 hover:bg-slate-100 text-slate-900 font-bold border-r border-slate-200 transition-colors h-full outline-none cursor-pointer ${variant === 'simple' ? 'rounded-l-lg' : 'rounded-l-xl'} ${variant === 'simple' ? 'min-w-[70px]' : 'min-w-[100px]'}`}
            >
                <FlagIcon code={selectedCountry.code} size={variant === 'simple' ? 'w-4' : 'w-5'} />
                <span
                    className={`${variant === 'simple' ? 'text-xs' : 'text-sm'} whitespace-nowrap`}
                >
                    {selectedCountry.dialCode}
                </span>
                <ChevronDown
                    size={14}
                    className={`text-slate-400 transition-transform duration-200 shrink-0 ${isOpen ? 'rotate-180' : ''}`}
                />
            </button>

            {/* Portal the dropdown to document.body to avoid overflow clipping */}
            {ReactDOM.createPortal(dropdownContent, document.body)}
        </div>
    );
};

export default CountryCodeSelector;
