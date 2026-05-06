export function resolveAuditLocale(language: string): string {
    return language.startsWith('fr') ? 'fr-FR' : 'en-GB';
}

export function formatAuditDateTime(
    value: string | null | undefined,
    locale: string,
): string | null {
    if (!value) {
        return null;
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return null;
    }

    return new Intl.DateTimeFormat(locale, {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    }).format(date);
}
