export type ProformaPreviewLanguage = 'fr' | 'en';

const localeByLanguage: Record<ProformaPreviewLanguage, string> = {
    en: 'en-GB',
    fr: 'fr-FR',
};

const dateLocale = 'en-GB';

export const PROFORMA_DISCLAIMER =
    'This document is a commercial invoice preview and does not constitute a legal or fiscal invoice. Prices are indicative and subject to availability at the time of confirmation.';

export function normalizeProformaLanguage(language?: string): ProformaPreviewLanguage {
    const normalized = language?.toLowerCase() ?? '';
    if (normalized.startsWith('en')) return 'en';
    return 'fr';
}

export function proformaLocale(language: ProformaPreviewLanguage) {
    return localeByLanguage[language] ?? localeByLanguage.en;
}

export function formatProformaCurrency(value: number | null | undefined, currency: string, language: ProformaPreviewLanguage) {
    if (typeof value !== 'number' || !Number.isFinite(value)) return '-';

    return `${new Intl.NumberFormat(proformaLocale(language), {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(value)} ${currency.toUpperCase()}`;
}

export function formatProformaDate(
    value: string | Date | null | undefined,
    language: ProformaPreviewLanguage,
    month: 'short' | 'long' = 'short',
) {
    if (!value) return '-';

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '-';

    void language;
    void month;
    return new Intl.DateTimeFormat(dateLocale, {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    }).format(date);
}

export function formatFxRate(value: number | null | undefined) {
    if (typeof value !== 'number' || !Number.isFinite(value)) return 'not available';
    return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 6,
    }).format(value);
}

export function formatFxStatement(fromCurrency: string, toCurrency: string, rate = 1) {
    const from = fromCurrency.toUpperCase();
    const to = toCurrency.toUpperCase();
    return `1 ${from} = ${formatFxRate(rate)} ${to}`;
}
