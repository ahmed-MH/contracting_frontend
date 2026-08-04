import type { AuditMetadata } from '../../../types/audit';

export interface ExchangeRate extends AuditMetadata {
    id: number;
    hotelId: number;
    fromCurrency: string;
    toCurrency: string;
    rate: number;
    effectiveDate: string;
    updatedBy?: string | null;
}

export interface CreateExchangeRatePayload {
    fromCurrency: string;
    toCurrency: string;
    rate: number;
    effectiveDate: string;
}

export interface UpdateExchangeRatePayload extends Partial<CreateExchangeRatePayload> {}
