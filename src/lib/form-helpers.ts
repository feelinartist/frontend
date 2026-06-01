export const formatTimezoneLabel = (timezone: string) => timezone.replaceAll('_', ' ');

export const sanitizePhoneNumber = (value: string) => value.replaceAll(/\D/g, '');

export const normalizeText = (text: string) =>
    text.toLowerCase().normalize('NFD').replaceAll(/[\u0300-\u036f]/g, '');
