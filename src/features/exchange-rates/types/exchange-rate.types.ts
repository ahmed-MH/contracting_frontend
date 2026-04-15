export interface ExchangeRate {
    id: number;
    hotelId: number;
    fromCurrency: string;
    toCurrency: string;
    rate: number;
    effectiveDate: string;
    source: ExchangeRateSource;
    updatedBy?: string | null;
    createdAt?: string;
    updatedAt?: string;
}

export type ExchangeRateSource = 'manual' | 'system' | 'imported';

export interface CreateExchangeRatePayload {
    fromCurrency: string;
    toCurrency: string;
    rate: number;
    effectiveDate: string;
    source?: ExchangeRateSource;
}

export interface UpdateExchangeRatePayload extends Partial<CreateExchangeRatePayload> {}
