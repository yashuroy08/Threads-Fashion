export interface CountryData {
    name: string;
    code: string;
    flag: string;
    dialCode: string;
    minLength: number;
    maxLength: number;
}

export const countries: CountryData[] = [
    { name: 'Afghanistan', code: 'AF', flag: '🇦🇫', dialCode: '+93', minLength: 9, maxLength: 9 },
    { name: 'Albania', code: 'AL', flag: '🇦🇱', dialCode: '+355', minLength: 9, maxLength: 9 },
    { name: 'Algeria', code: 'DZ', flag: '🇩🇿', dialCode: '+213', minLength: 9, maxLength: 9 },
    { name: 'Andorra', code: 'AD', flag: '🇦🇩', dialCode: '+376', minLength: 6, maxLength: 6 },
    { name: 'Angola', code: 'AO', flag: '🇦🇴', dialCode: '+244', minLength: 9, maxLength: 9 },
    { name: 'Argentina', code: 'AR', flag: '🇦🇷', dialCode: '+54', minLength: 10, maxLength: 10 },
    { name: 'Australia', code: 'AU', flag: '🇦🇺', dialCode: '+61', minLength: 9, maxLength: 9 },
    { name: 'Austria', code: 'AT', flag: '🇦🇹', dialCode: '+43', minLength: 10, maxLength: 10 },
    { name: 'Bangladesh', code: 'BD', flag: '🇧🇩', dialCode: '+880', minLength: 10, maxLength: 10 },
    { name: 'Belgium', code: 'BE', flag: '🇧🇪', dialCode: '+32', minLength: 9, maxLength: 9 },
    { name: 'Brazil', code: 'BR', flag: '🇧🇷', dialCode: '+55', minLength: 10, maxLength: 11 },
    { name: 'Canada', code: 'CA', flag: '🇨🇦', dialCode: '+1', minLength: 10, maxLength: 10 },
    { name: 'China', code: 'CN', flag: '🇨🇳', dialCode: '+86', minLength: 11, maxLength: 11 },
    { name: 'Egypt', code: 'EG', flag: '🇪🇬', dialCode: '+20', minLength: 10, maxLength: 10 },
    { name: 'France', code: 'FR', flag: '🇫🇷', dialCode: '+33', minLength: 9, maxLength: 9 },
    { name: 'Germany', code: 'DE', flag: '🇩🇪', dialCode: '+49', minLength: 10, maxLength: 11 },
    { name: 'India', code: 'IN', flag: '🇮🇳', dialCode: '+91', minLength: 10, maxLength: 10 },
    { name: 'Indonesia', code: 'ID', flag: '🇮🇩', dialCode: '+62', minLength: 10, maxLength: 12 },
    { name: 'Italy', code: 'IT', flag: '🇮🇹', dialCode: '+39', minLength: 10, maxLength: 10 },
    { name: 'Japan', code: 'JP', flag: '🇯🇵', dialCode: '+81', minLength: 10, maxLength: 10 },
    { name: 'Mexico', code: 'MX', flag: '🇲🇽', dialCode: '+52', minLength: 10, maxLength: 10 },
    { name: 'Nigeria', code: 'NG', flag: '🇳🇬', dialCode: '+234', minLength: 10, maxLength: 10 },
    { name: 'Pakistan', code: 'PK', flag: '🇵🇰', dialCode: '+92', minLength: 10, maxLength: 10 },
    { name: 'Russia', code: 'RU', flag: '🇷🇺', dialCode: '+7', minLength: 10, maxLength: 10 },
    { name: 'Saudi Arabia', code: 'SA', flag: '🇸🇦', dialCode: '+966', minLength: 9, maxLength: 9 },
    { name: 'Singapore', code: 'SG', flag: '🇸🇬', dialCode: '+65', minLength: 8, maxLength: 8 },
    { name: 'South Africa', code: 'ZA', flag: '🇿🇦', dialCode: '+27', minLength: 9, maxLength: 9 },
    { name: 'Spain', code: 'ES', flag: '🇪🇸', dialCode: '+34', minLength: 9, maxLength: 9 },
    { name: 'United Arab Emirates', code: 'AE', flag: '🇦🇪', dialCode: '+971', minLength: 9, maxLength: 9 },
    { name: 'United Kingdom', code: 'GB', flag: '🇬🇧', dialCode: '+44', minLength: 10, maxLength: 10 },
    { name: 'United States', code: 'US', flag: '🇺🇸', dialCode: '+1', minLength: 10, maxLength: 10 },
    { name: 'Vietnam', code: 'VN', flag: '🇻🇳', dialCode: '+84', minLength: 9, maxLength: 10 },
];
