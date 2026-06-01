export interface Country {
    code: string;           // ISO code (PE, US, MX, etc.)
    name: string;           // Country name
    flag: string;           // Emoji flag
    phoneCode: string;      // Phone code (+51, +1, etc.)
    timezone: string;       // Primary timezone (America/Lima, etc.)
    timezoneLabel: string;  // Human readable (GMT-5, GMT-6, etc.)
}

export const countries: Country[] = [
    { code: 'PE', name: 'Perú', flag: '🇵🇪', phoneCode: '+51', timezone: 'America/Lima', timezoneLabel: 'GMT-5' },
    { code: 'US', name: 'Estados Unidos', flag: '🇺🇸', phoneCode: '+1', timezone: 'America/New_York', timezoneLabel: 'GMT-5' },
    { code: 'MX', name: 'México', flag: '🇲🇽', phoneCode: '+52', timezone: 'America/Mexico_City', timezoneLabel: 'GMT-6' },
    { code: 'CO', name: 'Colombia', flag: '🇨🇴', phoneCode: '+57', timezone: 'America/Bogota', timezoneLabel: 'GMT-5' },
    { code: 'AR', name: 'Argentina', flag: '🇦🇷', phoneCode: '+54', timezone: 'America/Argentina/Buenos_Aires', timezoneLabel: 'GMT-3' },
    { code: 'CL', name: 'Chile', flag: '🇨🇱', phoneCode: '+56', timezone: 'America/Santiago', timezoneLabel: 'GMT-3' },
    { code: 'ES', name: 'España', flag: '🇪🇸', phoneCode: '+34', timezone: 'Europe/Madrid', timezoneLabel: 'GMT+1' },
    { code: 'EC', name: 'Ecuador', flag: '🇪🇨', phoneCode: '+593', timezone: 'America/Guayaquil', timezoneLabel: 'GMT-5' },
    { code: 'VE', name: 'Venezuela', flag: '🇻🇪', phoneCode: '+58', timezone: 'America/Caracas', timezoneLabel: 'GMT-4' },
    { code: 'BR', name: 'Brasil', flag: '🇧🇷', phoneCode: '+55', timezone: 'America/Sao_Paulo', timezoneLabel: 'GMT-3' },
    { code: 'UY', name: 'Uruguay', flag: '🇺🇾', phoneCode: '+598', timezone: 'America/Montevideo', timezoneLabel: 'GMT-3' },
    { code: 'PY', name: 'Paraguay', flag: '🇵🇾', phoneCode: '+595', timezone: 'America/Asuncion', timezoneLabel: 'GMT-4' },
    { code: 'BO', name: 'Bolivia', flag: '🇧🇴', phoneCode: '+591', timezone: 'America/La_Paz', timezoneLabel: 'GMT-4' }
];

export const getCountryByCode = (code: string): Country | undefined => {
    return countries.find(c => c.code === code);
};

export const getCountryByPhoneCode = (phoneCode: string): Country | undefined => {
    return countries.find(c => c.phoneCode === phoneCode);
};

export const getCountryByTimezone = (timezone: string): Country | undefined => {
    return countries.find(c => c.timezone === timezone);
};
