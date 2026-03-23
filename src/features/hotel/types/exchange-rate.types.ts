export interface ExchangeRate {
    id: number;
    hotelId: number;
    currency: string;
    rate: number;
    validFrom: string;
    validUntil: string | null;
    createdAt?: string;
    updatedAt?: string;
}

export interface CreateExchangeRatePayload {
    currency: string;
    rate: number;
    validFrom: string;
    validUntil?: string | null;
}

export interface UpdateExchangeRatePayload extends Partial<CreateExchangeRatePayload> {}
