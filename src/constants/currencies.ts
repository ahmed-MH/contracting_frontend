export interface Currency {
    code: string;
    name: string;
    symbol: string;
}

export const CURRENCIES: Currency[] = [
    { code: 'TND', name: 'Dinar Tunisien', symbol: 'DT' },
    { code: 'EUR', name: 'Euro', symbol: '€' },
    { code: 'USD', name: 'US Dollar', symbol: '$' },
    { code: 'GBP', name: 'Livre Sterling', symbol: '£' },
    { code: 'CHF', name: 'Franc Suisse', symbol: 'CHF' },
    { code: 'CAD', name: 'Dollar Canadien', symbol: 'C$' },
    { code: 'JPY', name: 'Yen Japonais', symbol: '¥' },
    { code: 'SAR', name: 'Riyal Saoudien', symbol: 'SR' },
    { code: 'AED', name: 'Dirham Émirati', symbol: 'DH' },
    { code: 'QAR', name: 'Riyal Qatari', symbol: 'QR' },
    { code: 'MAD', name: 'Dirham Marocain', symbol: 'DH' },
    { code: 'DZD', name: 'Dinar Algérien', symbol: 'DA' },
    { code: 'LYD', name: 'Dinar Libyen', symbol: 'LD' },
    { code: 'CNY', name: 'Yuan Chinois', symbol: '¥' },
    { code: 'TRY', name: 'Lire Turque', symbol: '₺' },
].sort((a, b) => a.code.localeCompare(b.code));
