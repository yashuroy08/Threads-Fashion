import { useState, useEffect, useRef } from 'react';
import { Search, ChevronDown } from 'lucide-react';
import '../styles/auth.css';

export interface Country {
    name: string;
    code: string;
    flag?: string;
    dialCode: string;
    minLength: number;
    maxLength: number;
}

export const countries: Country[] = [
    { name: 'Afghanistan', code: 'AF', dialCode: '+93', minLength: 9, maxLength: 9 },
    { name: 'Albania', code: 'AL', dialCode: '+355', minLength: 9, maxLength: 9 },
    { name: 'Algeria', code: 'DZ', dialCode: '+213', minLength: 9, maxLength: 9 },
    { name: 'Andorra', code: 'AD', dialCode: '+376', minLength: 6, maxLength: 6 },
    { name: 'Angola', code: 'AO', dialCode: '+244', minLength: 9, maxLength: 9 },
    { name: 'Argentina', code: 'AR', dialCode: '+54', minLength: 10, maxLength: 10 },
    { name: 'Australia', code: 'AU', dialCode: '+61', minLength: 9, maxLength: 9 },
    { name: 'Austria', code: 'AT', dialCode: '+43', minLength: 10, maxLength: 10 },
    { name: 'Bangladesh', code: 'BD', dialCode: '+880', minLength: 10, maxLength: 10 },
    { name: 'Belgium', code: 'BE', dialCode: '+32', minLength: 9, maxLength: 9 },
    { name: 'Brazil', code: 'BR', dialCode: '+55', minLength: 10, maxLength: 11 },
    { name: 'Canada', code: 'CA', dialCode: '+1', minLength: 10, maxLength: 10 },
    { name: 'China', code: 'CN', dialCode: '+86', minLength: 11, maxLength: 11 },
    { name: 'Egypt', code: 'EG', dialCode: '+20', minLength: 10, maxLength: 10 },
    { name: 'France', code: 'FR', dialCode: '+33', minLength: 9, maxLength: 9 },
    { name: 'Germany', code: 'DE', dialCode: '+49', minLength: 10, maxLength: 11 },
    { name: 'India', code: 'IN', dialCode: '+91', minLength: 10, maxLength: 10 },
    { name: 'Indonesia', code: 'ID', dialCode: '+62', minLength: 10, maxLength: 12 },
    { name: 'Italy', code: 'IT', dialCode: '+39', minLength: 10, maxLength: 10 },
    { name: 'Japan', code: 'JP', dialCode: '+81', minLength: 10, maxLength: 10 },
    { name: 'Mexico', code: 'MX', dialCode: '+52', minLength: 10, maxLength: 10 },
    { name: 'Nigeria', code: 'NG', dialCode: '+234', minLength: 10, maxLength: 10 },
    { name: 'Pakistan', code: 'PK', dialCode: '+92', minLength: 10, maxLength: 10 },
    { name: 'Russia', code: 'RU', dialCode: '+7', minLength: 10, maxLength: 10 },
    { name: 'Saudi Arabia', code: 'SA', dialCode: '+966', minLength: 9, maxLength: 9 },
    { name: 'Singapore', code: 'SG', dialCode: '+65', minLength: 8, maxLength: 8 },
    { name: 'South Africa', code: 'ZA', dialCode: '+27', minLength: 9, maxLength: 9 },
    { name: 'Spain', code: 'ES', dialCode: '+34', minLength: 9, maxLength: 9 },
    { name: 'United Arab Emirates', code: 'AE', dialCode: '+971', minLength: 9, maxLength: 9 },
    { name: 'United Kingdom', code: 'GB', dialCode: '+44', minLength: 10, maxLength: 10 },
    { name: 'United States', code: 'US', dialCode: '+1', minLength: 10, maxLength: 10 },
    { name: 'Vietnam', code: 'VN', dialCode: '+84', minLength: 9, maxLength: 10 },
];

interface Props {
    selectedCountryCode: string; // ISO code (e.g., 'IN')
    onSelect: (country: Country) => void;
    compact?: boolean;
}

export default function CountrySelector({ selectedCountryCode, onSelect, compact = false }: Props) {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const dropdownRef = useRef<HTMLDivElement>(null);

    const country = countries.find(c => c.code === selectedCountryCode) || countries[16]; // Default to India

    const filteredCountries = countries.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.dialCode.includes(search) ||
        c.code.toLowerCase().includes(search.toLowerCase())
    );

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    if (compact) {
        return (
            <div className="country-selector-compact" ref={dropdownRef}>
                <div className="compact-trigger" onClick={() => setIsOpen(!isOpen)}>
                    <span className="country-code-label">{country.code}</span>
                    <span className="dial-code">{country.dialCode}</span>
                    <ChevronDown size={14} className={`chevron ${isOpen ? 'open' : ''}`} />
                </div>

                {isOpen && (
                    <div className="country-dropdown-list">
                        <div className="country-search-mini">
                            <Search size={14} />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                autoFocus
                            />
                        </div>
                        <div className="list-wrapper">
                            {filteredCountries.map((c) => (
                                <div
                                    key={c.code}
                                    className={`country-option ${c.code === selectedCountryCode ? 'selected' : ''}`}
                                    onClick={() => {
                                        onSelect(c);
                                        setIsOpen(false);
                                        setSearch('');
                                    }}
                                >
                                    <span className="country-code-mini">{c.code}</span>
                                    <span className="country-name">{c.name}</span>
                                    <span className="dial-code-muted">{c.dialCode}</span>
                                    {c.code === selectedCountryCode && <div className="selection-dot" />}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="country-selector-container" ref={dropdownRef}>
            <div className="country-selector-trigger" onClick={() => setIsOpen(!isOpen)}>
                <span className="country-code-badge">{country.code}</span>
                <span className="country-name">{country.name} ({country.dialCode})</span>
                <ChevronDown className={`chevron ${isOpen ? 'open' : ''}`} />
            </div>

            {isOpen && (
                <div className="country-selector-dropdown">
                    <div className="country-search">
                        <Search size={18} />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            autoFocus
                        />
                    </div>
                    <div className="country-list">
                        {filteredCountries.map((c) => (
                            <div
                                key={c.code}
                                className={`country-item ${c.code === selectedCountryCode ? 'selected' : ''}`}
                                onClick={() => {
                                    onSelect(c);
                                    setIsOpen(false);
                                    setSearch('');
                                }}
                            >
                                <span className="country-code-item">{c.code}</span>
                                <span className="country-name">{c.name}</span>
                                <span className="dial-code">{c.dialCode}</span>
                                {c.code === selectedCountryCode && <div className="selection-dot" />}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
